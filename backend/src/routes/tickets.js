const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/tickets/:ticketCode - Get ticket detail for display & print
router.get('/:ticketCode', async (req, res) => {
  try {
    const { ticketCode } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        zone: {
          include: {
            concert: true
          }
        },
        booking: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'ไม่พบตั๋วใบนี้ในระบบ' });
    }

    res.json({
      success: true,
      data: {
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        seatNumber: ticket.seatNumber,
        status: ticket.status,
        usedAt: ticket.usedAt,
        concert: {
          id: ticket.zone.concert.id,
          name: ticket.zone.concert.name,
          eventDate: ticket.zone.concert.eventDate,
          location: ticket.zone.concert.location,
          venue: ticket.zone.concert.venue,
          bannerUrl: ticket.zone.concert.bannerUrl
        },
        zone: {
          name: ticket.zone.name,
          category: ticket.zone.category,
          price: ticket.zone.price,
          colorCode: ticket.zone.colorCode
        },
        booking: {
          bookingCode: ticket.booking.bookingCode,
          paidAt: ticket.booking.paidAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
