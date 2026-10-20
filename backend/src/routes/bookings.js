const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendTicketToLineUser } = require('../services/lineService');

// POST /api/bookings - Create new reservation with 10-minute hold
router.post('/', async (req, res) => {
  try {
    const { concertId, zoneId, quantity, customerName, customerPhone, customerLineId } = req.body;

    if (!concertId || !zoneId || !quantity || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const qty = parseInt(quantity, 10);
    if (qty <= 0 || qty > 6) {
      return res.status(400).json({ success: false, message: 'สามารถจองได้ 1 - 6 ใบต่อครั้ง' });
    }

    // Check zone availability
    const zone = await prisma.zone.findUnique({
      where: { id: parseInt(zoneId, 10) },
      include: { concert: true }
    });

    if (!zone || zone.available < qty) {
      return res.status(400).json({ success: false, message: 'บัตรในโซนนี้ไม่เพียงพอหรือหมดแล้ว' });
    }

    // Generate Booking Code: SW-YEAR-RANDOM
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingCode = `SW-${new Date().getFullYear()}-${randomCode}`;

    // 10 minutes expiry lock
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const totalAmount = zone.price * qty;

    // Use transaction to hold quota and create booking
    const booking = await prisma.$transaction(async (tx) => {
      // Deduct available
      await tx.zone.update({
        where: { id: zone.id },
        data: { available: { decrement: qty } }
      });

      return await tx.booking.create({
        data: {
          bookingCode,
          customerName,
          customerPhone,
          customerLineId: customerLineId || null,
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
        concertName: zone.concert.name
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
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

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// POST /api/bookings/:bookingCode/pay - Mock Payment Confirmation
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
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    if (booking.status === 'PAID') {
      return res.json({ success: true, message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว' });
    }

    if (booking.status === 'EXPIRED' || new Date() > new Date(booking.expiresAt)) {
      return res.status(400).json({ success: false, message: 'หมดเวลาชำระเงินแล้ว รายการนี้ถูกยกเลิก' });
    }

    // Generate Tickets
    const createdTickets = await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });

      const ticketsList = [];
      for (const item of booking.items) {
        for (let i = 0; i < item.quantity; i++) {
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const ticketCode = `SWP-${item.zone.category.substring(0, 3)}-${randomSuffix}-${Date.now().toString().slice(-4)}`;
          
          const requestedSeats = Array.isArray(req.body?.selectedSeats) ? req.body.selectedSeats : [];
          const seat = item.zone.category === 'SEATED' 
            ? (requestedSeats[i] || `ROW-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 30) + 1}`) 
            : null;

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

    // Optional: Send LINE Flex Message if LINE User ID is present
    if (booking.customerLineId) {
      const concert = booking.items[0]?.zone?.concert;
      const zone = booking.items[0]?.zone;
      for (const ticket of createdTickets) {
        sendTicketToLineUser(booking.customerLineId, concert, ticket, zone, booking).catch(err => {
          console.error("Async LINE send failed:", err);
        });
      }
    }

    res.json({
      success: true,
      message: 'ชำระเงินสำเร็จ ออกตั๋วคอนเสิร์ตเรียบร้อย',
      data: {
        bookingCode: booking.bookingCode,
        tickets: createdTickets
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
