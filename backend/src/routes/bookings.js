const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendTicketToLineUser, sendTicketsToLineUser } = require('../services/lineService');
const { requireCustomer } = require('../middleware/customerAuth');

async function deliverTicketsToLine(booking, tickets) {
  if (!booking.customerLineId) {
    await prisma.booking.update({ where: { id: booking.id }, data: { lineDeliveryStatus: 'NOT_LINKED', lineDeliveryError: 'ยังไม่มี LINE ID ในรายการจอง' } });
    return { status: 'NOT_LINKED', error: 'รายการจองนี้ไม่มี LINE ID' };
  }

  const item = booking.items?.find((entry) => entry.zoneId === tickets[0]?.zoneId);
  const zone = item?.zone || tickets[0]?.zone;
  const concert = zone?.concert || tickets[0]?.zone?.concert;
  if (!zone || !concert) {
    await prisma.booking.update({ where: { id: booking.id }, data: { lineDeliveryStatus: 'FAILED', lineDeliveryError: 'ข้อมูลคอนเสิร์ตของตั๋วไม่ครบ' } });
    return { status: 'FAILED', error: 'ข้อมูลคอนเสิร์ตของตั๋วไม่ครบ' };
  }

  const result = await sendTicketsToLineUser(booking.customerLineId, concert, tickets, zone, booking);
  const status = result.success ? 'SENT' : 'FAILED';
  const error = result.error || result.reason || null;
  await prisma.booking.update({ where: { id: booking.id }, data: { lineDeliveryStatus: status, lineDeliveryError: error } });
  return { status, error };
}

// GET /api/bookings/zones/:zoneId/occupied-seats - List all occupied/reserved seats
router.get('/zones/:zoneId/occupied-seats', async (req, res) => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    if (isNaN(zoneId)) return res.status(400).json({ success: false, message: 'รหัสโซนไม่ถูกต้อง' });

    // 1. Seats already issued in valid, used, or admin reserved tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        zoneId,
        status: { in: ['VALID', 'USED', 'RESERVED'] },
        seatNumber: { not: null }
      },
      select: { seatNumber: true }
    });
    const ticketSeats = tickets.map((t) => t.seatNumber).filter(Boolean);

    // 2. Seats locked in active pending or reserved bookings (within hold window or reserved by admin)
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'RESERVED'] },
        expiresAt: { gt: new Date() },
        items: { some: { zoneId } }
      },
      select: { selectedSeats: true }
    });

    const pendingSeats = [];
    for (const b of activeBookings) {
      if (b.selectedSeats) {
        try {
          const parsed = JSON.parse(b.selectedSeats);
          if (Array.isArray(parsed)) pendingSeats.push(...parsed);
        } catch (e) {}
      }
    }

    const occupiedSeats = Array.from(new Set([...ticketSeats, ...pendingSeats]));

    res.json({
      success: true,
      zoneId,
      occupiedSeats
    });
  } catch (error) {
    console.error('Error getting occupied seats:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// POST /api/bookings - Create new reservation with 10-minute hold & unique seat validation (Requires Customer Login)
router.post('/', requireCustomer, async (req, res) => {
  try {
    const { concertId, zoneId, quantity, customerName, customerPhone, customerLineId, selectedSeats } = req.body;

    if (!concertId || !zoneId || !quantity || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 6) {
      return res.status(400).json({ success: false, message: 'สามารถจองได้ 1 - 6 ใบต่อครั้ง' });
    }

    // Check zone availability
    const zone = await prisma.zone.findUnique({
      where: { id: parseInt(zoneId, 10) },
      include: { concert: true }
    });

    if (!zone || zone.concertId !== Number(concertId) || zone.available < qty) {
      return res.status(400).json({ success: false, message: 'บัตรในโซนนี้ไม่เพียงพอหรือหมดแล้ว' });
    }

    // Validate selectedSeats if provided (Cinema Seat Unique Selection)
    let seatsToReserve = [];
    if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      seatsToReserve = selectedSeats.map((s) => String(s).trim()).filter(Boolean);
      
      if (seatsToReserve.length !== qty) {
        return res.status(400).json({
          success: false,
          message: `จำนวนที่นั่งที่เลือก (${seatsToReserve.length} ที่นั่ง) ไม่ตรงกับจำนวนบัตรที่ต้องการ (${qty} ใบ)`
        });
      }

      // Check for duplicate seats within the current selection
      if (new Set(seatsToReserve).size !== seatsToReserve.length) {
        return res.status(400).json({
          success: false,
          message: 'พบที่นั่งซ้ำกันในรายการที่เลือก กรุณาเลือกที่นั่งที่ไม่ซ้ำกัน'
        });
      }

      // Check conflict with already issued or reserved tickets in this zone
      const conflictTicket = await prisma.ticket.findFirst({
        where: {
          zoneId: zone.id,
          status: { in: ['VALID', 'USED', 'RESERVED'] },
          seatNumber: { in: seatsToReserve }
        }
      });

      if (conflictTicket) {
        return res.status(409).json({
          success: false,
          message: `ขออภัย ที่นั่ง ${conflictTicket.seatNumber} มีผู้จองไปแล้ว กรุณาเลือกที่นั่งอื่น`
        });
      }

      // Check conflict with other users' active pending or reserved bookings
      const activePending = await prisma.booking.findMany({
        where: {
          status: { in: ['PENDING', 'RESERVED'] },
          expiresAt: { gt: new Date() },
          items: { some: { zoneId: zone.id } }
        },
        select: { selectedSeats: true }
      });

      for (const b of activePending) {
        if (b.selectedSeats) {
          try {
            const taken = JSON.parse(b.selectedSeats);
            if (Array.isArray(taken)) {
              const conflict = seatsToReserve.find((s) => taken.includes(s));
              if (conflict) {
                return res.status(409).json({
                  success: false,
                  message: `ขออภัย ที่นั่ง ${conflict} กำลังมีผู้ทำรายการจองอยู่ กรุณาเลือกที่นั่งอื่น`
                });
              }
            }
          } catch (e) {}
        }
      }
    }

    // Generate Booking Code: SW-YEAR-RANDOM
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingCode = `SW-${new Date().getFullYear()}-${randomCode}`;

    // 10 minutes expiry lock
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const totalAmount = zone.price * qty;

    // Use transaction to hold quota and create booking
    const booking = await prisma.$transaction(async (tx) => {
      // Atomically reserve inventory so simultaneous checkouts cannot oversell.
      const reserved = await tx.zone.updateMany({
        where: { id: zone.id, available: { gte: qty } },
        data: { available: { decrement: qty } }
      });
      if (reserved.count !== 1) return null;

      return await tx.booking.create({
        data: {
          bookingCode,
          customerName,
          customerPhone,
          customerLineId: customerLineId || req.customer?.lineUserId || null,
          selectedSeats: seatsToReserve.length > 0 ? JSON.stringify(seatsToReserve) : null,
          totalAmount,
          expiresAt,
          status: 'PENDING',
          items: {
            create: {
              zoneId: zone.id,
              quantity: qty,
              pricePerUnit: zone.price
            }
          }
        },
        include: {
          items: {
            include: { zone: true }
          }
        }
      });
    });

    if (!booking) {
      return res.status(409).json({ success: false, message: 'บัตรในโซนนี้เพิ่งหมด กรุณาเลือกจำนวนใหม่' });
    }

    res.status(201).json({
      success: true,
      message: 'จองสิทธิ์สำเร็จ กรุณาชำระเงินภายใน 10 นาที',
      data: {
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        totalAmount: booking.totalAmount,
        expiresAt: booking.expiresAt,
        zoneName: zone.name,
        quantity: qty,
        selectedSeats: seatsToReserve,
        concertName: zone.concert.name
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// GET /api/bookings/:bookingCode - Check booking status and remaining time
router.get('/:bookingCode', async (req, res) => {
  try {
    const { bookingCode } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        items: {
          include: {
            zone: {
              include: { concert: true }
            }
          }
        },
        tickets: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    // Check if expired
    const now = new Date();
    let isExpired = false;
    if (booking.status === 'PENDING' && now > new Date(booking.expiresAt)) {
      isExpired = true;
      // Mark as expired and return quota
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'EXPIRED' }
        });
        for (const item of booking.items) {
          await tx.zone.update({
            where: { id: item.zoneId },
            data: { available: { increment: item.quantity } }
          });
        }
      });
      booking.status = 'EXPIRED';
    }

    let parsedSeats = [];
    if (booking.selectedSeats) {
      try {
        parsedSeats = JSON.parse(booking.selectedSeats);
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        ...booking,
        selectedSeatsList: parsedSeats
      }
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// POST /api/bookings/:bookingCode/pay - Mock Payment Confirmation (Atomic status transition PENDING -> PAID)
router.post('/:bookingCode/pay', async (req, res) => {
  try {
    const { bookingCode } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        items: {
          include: {
            zone: {
              include: { concert: true }
            }
          }
        },
        tickets: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    if (booking.status === 'PAID') {
      return res.json({
        success: true,
        message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว',
        data: {
          bookingCode: booking.bookingCode,
          tickets: booking.tickets,
          lineDelivery: {
            status: booking.lineDeliveryStatus || 'UNKNOWN',
            error: booking.lineDeliveryError
          }
        }
      });
    }

    if (booking.status === 'EXPIRED' || new Date() > new Date(booking.expiresAt)) {
      return res.status(400).json({ success: false, message: 'หมดเวลาชำระเงินแล้ว รายการนี้ถูกยกเลิก' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `ไม่สามารถชำระเงินได้เนื่องจากสถานะปัจจุบันคือ ${booking.status}` });
    }

    // Retrieve reserved seats from booking record or fallback to request body
    let bookingSeats = [];
    if (booking.selectedSeats) {
      try {
        bookingSeats = JSON.parse(booking.selectedSeats);
      } catch (e) {}
    }
    if (!bookingSeats.length && Array.isArray(req.body?.selectedSeats)) {
      bookingSeats = req.body.selectedSeats;
    }

    // Generate Tickets with unique seat numbers atomically
    let seatIndex = 0;
    let createdTickets;
    try {
      createdTickets = await prisma.$transaction(async (tx) => {
        // Atomic status transition from PENDING -> PAID
        const updateResult = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: 'PENDING',
            expiresAt: { gt: new Date() }
          },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        });

        if (updateResult.count !== 1) {
          throw new Error('ALREADY_PAID_OR_EXPIRED');
        }

        // Double check no tickets exist for this booking yet
        const existingCount = await tx.ticket.count({
          where: { bookingId: booking.id }
        });
        if (existingCount > 0) {
          throw new Error('TICKETS_ALREADY_ISSUED');
        }

        const ticketsList = [];
        for (const item of booking.items) {
          for (let i = 0; i < item.quantity; i++) {
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const catCode = (item.zone.category || 'TKT')
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(0, 4)
              .toUpperCase() || 'PASS';
            const ticketCode = `SWP-${catCode}-${randomSuffix}-${Date.now().toString().slice(-4)}`;

            const isSeatCategory = /seat|chair|นั่ง|vip/i.test(item.zone.category || '');
            const fallbackSeat = isSeatCategory
              ? `ROW-A-${String(seatIndex + 1).padStart(2, '0')}`
              : `SPOT-${String(seatIndex + 1).padStart(2, '0')}`;
            
            const seat = bookingSeats[seatIndex] || fallbackSeat;
            seatIndex++;

            const ticket = await tx.ticket.create({
              data: {
                ticketCode,
                bookingId: booking.id,
                zoneId: item.zoneId,
                attendeeName: booking.customerName,
                seatNumber: seat,
                status: 'VALID'
              }
            });
            ticketsList.push(ticket);
          }
        }
        return ticketsList;
      });
    } catch (txError) {
      if (txError.message === 'ALREADY_PAID_OR_EXPIRED' || txError.message === 'TICKETS_ALREADY_ISSUED') {
        const latestBooking = await prisma.booking.findUnique({
          where: { id: booking.id },
          include: { tickets: true }
        });
        if (latestBooking && latestBooking.status === 'PAID') {
          return res.json({
            success: true,
            message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว',
            data: {
              bookingCode: latestBooking.bookingCode,
              tickets: latestBooking.tickets,
              lineDelivery: {
                status: latestBooking.lineDeliveryStatus || 'UNKNOWN',
                error: latestBooking.lineDeliveryError
              }
            }
          });
        }
        return res.status(400).json({ success: false, message: 'หมดเวลาชำระเงินแล้ว หรือรายการนี้ถูกดำเนินการไปแล้ว' });
      }
      throw txError;
    }

    const lineDelivery = await deliverTicketsToLine(booking, createdTickets);

    res.json({
      success: true,
      message: 'ชำระเงินสำเร็จ ออกตั๋วคอนเสิร์ตเรียบร้อย',
      data: {
        bookingCode: booking.bookingCode,
        tickets: createdTickets,
        lineDelivery
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// POST /api/bookings/:bookingCode/line-resend - Retry ticket delivery after payment
router.post('/:bookingCode/line-resend', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: req.params.bookingCode },
      include: {
        items: { include: { zone: { include: { concert: true } } } },
        tickets: { include: { zone: { include: { concert: true } } } }
      }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    if (booking.status !== 'PAID') return res.status(400).json({ success: false, message: 'ส่งตั๋วได้หลังชำระเงินสำเร็จเท่านั้น' });
    const lineDelivery = await deliverTicketsToLine(booking, booking.tickets);
    res.json({ success: true, data: { lineDelivery } });
  } catch (error) {
    console.error('LINE ticket retry failed:', error);
    res.status(500).json({ success: false, message: 'ลองส่งตั๋วเข้า LINE อีกครั้งไม่สำเร็จ' });
  }
});

module.exports = router;
