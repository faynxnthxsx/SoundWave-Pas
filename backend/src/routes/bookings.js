const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendTicketToLineUser, sendTicketsToLineUser } = require('../services/lineService');
const { requireCustomer } = require('../middleware/customerAuth');
const {
  isOmiseConfigured,
  isTestMode,
  createPromptPayCharge,
  getCharge,
  markTestChargeAsPaid
} = require('../services/omiseService');

function extractOmiseChargeId(paymentMethod) {
  if (!paymentMethod || typeof paymentMethod !== 'string') return null;
  const match = paymentMethod.match(/(chrg_[a-zA-Z0-9_]+)/);
  return match ? match[1] : null;
}

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
  if (!['ON_SALE'].includes(zone.status) || !['ON_SALE', 'UPCOMING'].includes(zone.concert.status)) {
    return res.status(409).json({ success: false, message: 'คอนเสิร์ตหรือโซนนี้พักการขาย/ปิดการขายแล้ว' });
  }

    if (zone.concert?.status === 'PAUSED') {
      return res.status(400).json({ success: false, message: 'คอนเสิร์ตนี้พักการจำหน่ายบัตรชั่วคราว' });
    }
    if (zone.concert?.status === 'CLOSED' || zone.concert?.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'คอนเสิร์ตนี้ปิดการจำหน่ายบัตรแล้ว' });
    }
    if (zone.isActive === false) {
      return res.status(400).json({ success: false, message: `โซน ${zone.name} พักการจำหน่ายบัตรชั่วคราว` });
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
    }

    // Generate Booking Code: SW-YEAR-RANDOM
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingCode = `SW-${new Date().getFullYear()}-${randomCode}`;

    // 10 minutes expiry lock
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const totalAmount = zone.price * qty;

    // Use transaction to hold quota and atomically validate seat reservation (Prevents Race Condition)
    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // 1. Atomically reserve inventory so simultaneous checkouts cannot oversell.
        const reserved = await tx.zone.updateMany({
          where: { id: zone.id, available: { gte: qty } },
          data: { available: { decrement: qty } }
        });
        if (reserved.count !== 1) {
          throw new Error('CAPACITY_EXCEEDED');
        }

        // 2. Atomically check and lock seats inside the transaction
        if (seatsToReserve.length > 0) {
          // Check conflict with already issued or reserved tickets in this zone
          const conflictTicket = await tx.ticket.findFirst({
            where: {
              zoneId: zone.id,
              status: { in: ['VALID', 'USED', 'RESERVED'] },
              seatNumber: { in: seatsToReserve }
            }
          });

          if (conflictTicket) {
            throw new Error(`SEAT_TAKEN:${conflictTicket.seatNumber}`);
          }

          // Check conflict with other users' active pending or reserved bookings
          const activePending = await tx.booking.findMany({
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
                    throw new Error(`SEAT_HOLD:${conflict}`);
                  }
                }
              } catch (e) {}
            }
          }
        }

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
    } catch (txErr) {
      if (txErr.message === 'CAPACITY_EXCEEDED') {
        return res.status(409).json({ success: false, message: 'บัตรในโซนนี้เพิ่งหมด กรุณาเลือกจำนวนใหม่' });
      }
      if (txErr.message?.startsWith('SEAT_TAKEN:')) {
        const seatName = txErr.message.split(':')[1];
        return res.status(409).json({
          success: false,
          message: `ขออภัย ที่นั่ง ${seatName} มีผู้จองและออกตั๋วไปแล้ว กรุณาเลือกที่นั่งอื่น`
        });
      }
      if (txErr.message?.startsWith('SEAT_HOLD:')) {
        const seatName = txErr.message.split(':')[1];
        return res.status(409).json({
          success: false,
          message: `ขออภัย ที่นั่ง ${seatName} เพิ่งถูกผู้ใช้อื่นทำรายการจองไปเมื่อสักครู่ กรุณาเลือกที่นั่งอื่น`
        });
      }
      throw txErr;
    }

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

// Shared helper: Atomic status transition PENDING -> PAID + Ticket issuance + LINE delivery
async function fulfillBookingPayment(bookingCode, { selectedSeatsFallback = [], paymentMethodOverride = null } = {}) {
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
    return { httpStatus: 404, body: { success: false, message: 'ไม่พบข้อมูลการจอง' } };
  }

  if (booking.status === 'PAID') {
    return {
      httpStatus: 200,
      body: {
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
      }
    };
  }

  if (booking.status === 'EXPIRED' || new Date() > new Date(booking.expiresAt)) {
    return { httpStatus: 400, body: { success: false, message: 'หมดเวลาชำระเงินแล้ว รายการนี้ถูกยกเลิก' } };
  }

  if (booking.status !== 'PENDING') {
    return {
      httpStatus: 400,
      body: { success: false, message: `ไม่สามารถชำระเงินได้เนื่องจากสถานะปัจจุบันคือ ${booking.status}` }
    };
  }

  let bookingSeats = [];
  if (booking.selectedSeats) {
    try {
      bookingSeats = JSON.parse(booking.selectedSeats);
    } catch (e) {}
  }
  if (!bookingSeats.length && Array.isArray(selectedSeatsFallback)) {
    bookingSeats = selectedSeatsFallback;
  }

  let seatIndex = 0;
  let createdTickets;
  try {
    createdTickets = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: 'PAID',
        paidAt: new Date()
      };
      if (paymentMethodOverride) {
        updateData.paymentMethod = paymentMethodOverride;
      }

      const updateResult = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        },
        data: updateData
      });

      if (updateResult.count !== 1) {
        throw new Error('ALREADY_PAID_OR_EXPIRED');
      }

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

          if (seat) {
            const seatAlreadyClaimed = await tx.ticket.findFirst({
              where: {
                zoneId: item.zoneId,
                status: { in: ['VALID', 'USED', 'RESERVED'] },
                seatNumber: seat,
                bookingId: { not: booking.id }
              }
            });
            if (seatAlreadyClaimed) {
              throw new Error(`SEAT_ALREADY_CLAIMED:${seat}`);
            }
          }

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
    if (txError.message?.startsWith('SEAT_ALREADY_CLAIMED:')) {
      const seatName = txError.message.split(':')[1];
      return {
        httpStatus: 409,
        body: {
          success: false,
          message: `ไม่สามารถออกตั๋วได้ เนื่องจากที่นั่ง ${seatName} มีผู้ชำระเงินตัดหน้าไปก่อนแล้ว`
        }
      };
    }
    if (txError.message === 'ALREADY_PAID_OR_EXPIRED' || txError.message === 'TICKETS_ALREADY_ISSUED') {
      const latestBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { tickets: true }
      });
      if (latestBooking && latestBooking.status === 'PAID') {
        return {
          httpStatus: 200,
          body: {
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
          }
        };
      }
      return {
        httpStatus: 400,
        body: { success: false, message: 'หมดเวลาชำระเงินแล้ว หรือรายการนี้ถูกดำเนินการไปแล้ว' }
      };
    }
    throw txError;
  }

  const lineDelivery = await deliverTicketsToLine(booking, createdTickets);

  return {
    httpStatus: 200,
    body: {
      success: true,
      message: 'ชำระเงินสำเร็จ ออกตั๋วคอนเสิร์ตเรียบร้อย',
      data: {
        bookingCode: booking.bookingCode,
        tickets: createdTickets,
        lineDelivery
      }
    }
  };
}

// POST /api/bookings/:bookingCode/omise-charge - Create or reuse an Omise PromptPay QR charge
router.post('/:bookingCode/omise-charge', async (req, res) => {
  try {
    const { bookingCode } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { bookingCode }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    if (booking.status === 'PAID') {
      return res.json({
        success: true,
        configured: isOmiseConfigured(),
        alreadyPaid: true
      });
    }

    if (booking.status !== 'PENDING' || new Date() > new Date(booking.expiresAt)) {
      return res.status(400).json({ success: false, message: 'รายการจองนี้หมดเวลาหรือถูกยกเลิกแล้ว' });
    }

    if (!isOmiseConfigured()) {
      return res.json({
        success: true,
        configured: false,
        mode: 'DEMO',
        message: 'ยังไม่ได้ตั้งค่า OMISE_SECRET_KEY ระบบทำงานในโหมดจำลอง (Demo PromptPay)'
      });
    }

    // Reuse existing pending Omise charge if stored in paymentMethod
    const existingChargeId = extractOmiseChargeId(booking.paymentMethod);
    if (existingChargeId) {
      try {
        const existingCharge = await getCharge(existingChargeId);
        if (existingCharge.paid && existingCharge.status === 'successful') {
          const fulfilled = await fulfillBookingPayment(bookingCode, {
            paymentMethodOverride: `OMISE_PROMPTPAY:${existingCharge.id}`
          });
          return res.status(fulfilled.httpStatus).json({
            ...fulfilled.body,
            configured: true,
            mode: existingCharge.livemode ? 'OMISE_LIVE' : 'OMISE_TEST',
            charge: existingCharge
          });
        }
        if (existingCharge.status === 'pending' && existingCharge.qrImageUrl) {
          return res.json({
            success: true,
            configured: true,
            mode: existingCharge.livemode ? 'OMISE_LIVE' : 'OMISE_TEST',
            charge: existingCharge
          });
        }
      } catch (reuseErr) {
        console.warn('Could not reuse previous Omise charge, creating a new one:', reuseErr.message);
      }
    }

    // Create new Omise PromptPay charge
    const charge = await createPromptPayCharge({
      amountTHB: booking.totalAmount,
      bookingCode: booking.bookingCode,
      bookingId: booking.id,
      expiresAt: booking.expiresAt
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentMethod: `OMISE_PROMPTPAY:${charge.id}` }
    });

    res.json({
      success: true,
      configured: true,
      mode: charge.livemode ? 'OMISE_LIVE' : 'OMISE_TEST',
      charge
    });
  } catch (error) {
    console.error('Error creating Omise PromptPay charge:', error);
    res.status(502).json({
      success: false,
      configured: isOmiseConfigured(),
      message: error.message || 'ไม่สามารถสร้าง QR PromptPay จาก Omise ได้'
    });
  }
});

// GET /api/bookings/:bookingCode/omise-status - Poll Omise charge status & fulfill if paid
router.get('/:bookingCode/omise-status', async (req, res) => {
  try {
    const { bookingCode } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: { tickets: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    if (booking.status === 'PAID') {
      return res.json({
        success: true,
        paid: true,
        status: 'PAID',
        data: {
          bookingCode: booking.bookingCode,
          tickets: booking.tickets
        }
      });
    }

    const chargeId = extractOmiseChargeId(booking.paymentMethod);
    if (!isOmiseConfigured() || !chargeId) {
      return res.json({
        success: true,
        paid: false,
        status: booking.status,
        configured: isOmiseConfigured()
      });
    }

    const charge = await getCharge(chargeId);
    if (charge.paid && charge.status === 'successful') {
      const fulfilled = await fulfillBookingPayment(bookingCode, {
        paymentMethodOverride: `OMISE_PROMPTPAY:${charge.id}`
      });
      return res.status(fulfilled.httpStatus).json({
        ...fulfilled.body,
        paid: true,
        status: 'PAID',
        chargeStatus: charge.status
      });
    }

    res.json({
      success: true,
      paid: false,
      status: booking.status,
      chargeStatus: charge.status,
      failureMessage: charge.failureMessage
    });
  } catch (error) {
    console.error('Error checking Omise charge status:', error);
    res.status(500).json({ success: false, message: 'ตรวจสอบสถานะจาก Omise ไม่สำเร็จ' });
  }
});

// POST /api/bookings/:bookingCode/pay - Confirm / Simulate Payment (Supports both Omise Test & Demo Mode)
router.post('/:bookingCode/pay', async (req, res) => {
  try {
    const { bookingCode } = req.params;

    // If an Omise charge exists on this booking, either verify it or mark it paid in Test Mode
    if (isOmiseConfigured()) {
      const booking = await prisma.booking.findUnique({ where: { bookingCode } });
      const chargeId = extractOmiseChargeId(booking?.paymentMethod);
      if (chargeId) {
        try {
          let charge = await getCharge(chargeId);
          // In Omise Test Mode, clicking the confirm/simulate button also marks the charge as paid on Omise
          if (!charge.paid && charge.status === 'pending' && isTestMode() && chargeId.startsWith('chrg_test_')) {
            charge = await markTestChargeAsPaid(chargeId);
          } else if (!charge.paid && !isTestMode()) {
            return res.status(402).json({
              success: false,
              message: 'ระบบยังไม่ได้รับยอดชำระจาก Omise กรุณาสแกน QR โอนเงินให้เรียบร้อยก่อน'
            });
          }
        } catch (omiseErr) {
          console.warn('Omise mark/verify warning during /pay:', omiseErr.message);
        }
      }
    }

    const result = await fulfillBookingPayment(bookingCode, {
      selectedSeatsFallback: req.body?.selectedSeats
    });
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// POST /api/webhooks/omise (and /api/bookings/webhooks/omise) - Official Omise Webhook Handler
async function handleOmiseWebhook(req, res) {
  try {
    const event = req.body;
    if (!event || event.object !== 'event' || !event.data) {
      return res.status(400).json({ success: false, message: 'Invalid Omise webhook payload' });
    }

    const eventData = event.data;
    if (eventData.object !== 'charge' || !eventData.id) {
      return res.json({ success: true, ignored: true });
    }

    // Verify charge directly with Omise API if secret key is configured
    let verifiedCharge = null;
    if (isOmiseConfigured()) {
      verifiedCharge = await getCharge(eventData.id);
    } else {
      return res.status(503).json({ success: false, message: 'OMISE_SECRET_KEY is not configured' });
    }

    if (!verifiedCharge.paid || verifiedCharge.status !== 'successful') {
      return res.json({
        success: true,
        processed: false,
        chargeStatus: verifiedCharge.status
      });
    }

    // Find matching booking via metadata.bookingCode or paymentMethod containing charge ID
    let bookingCode = verifiedCharge.bookingCode;
    if (!bookingCode) {
      const matched = await prisma.booking.findFirst({
        where: { paymentMethod: { contains: verifiedCharge.id } },
        select: { bookingCode: true }
      });
      bookingCode = matched?.bookingCode;
    }

    if (!bookingCode) {
      return res.status(404).json({ success: false, message: 'No matching booking found for charge' });
    }

    const result = await fulfillBookingPayment(bookingCode, {
      paymentMethodOverride: `OMISE_PROMPTPAY:${verifiedCharge.id}`
    });
    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error('Error handling Omise webhook:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
}

router.post('/webhooks/omise', handleOmiseWebhook);

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

router.handleOmiseWebhook = handleOmiseWebhook;
module.exports = router;
