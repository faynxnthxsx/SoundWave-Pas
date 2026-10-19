const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/scanner/verify - Gate Staff ticket scanner validation
router.post('/verify', async (req, res) => {
  try {
    let { ticketCode, scannedBy } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ success: false, valid: false, message: 'กรุณาระบุรหัสตั๋ว' });
    }

    // Clean up ticket code (if user scanned a full URL like http://localhost:5173/tickets/SWP-XXX)
    if (ticketCode.includes('/')) {
      const parts = ticketCode.trim().split('/');
      ticketCode = parts[parts.length - 1];
    }
    ticketCode = ticketCode.trim();

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
      return res.status(404).json({
        success: false,
        valid: false,
        status: "INVALID",
        message: "❌ ไม่พบข้อมูลตั๋วใบนี้ในระบบ (บัตรปลอมหรือไม่ถูกต้อง)"
      });
    }

    // Check if already used
    if (ticket.status === 'USED') {
      return res.status(409).json({
        success: false,
        valid: false,
        status: "ALREADY_USED",
        message: "⚠️ ตั๋วใบนี้ถูกสแกนเข้างานไปแล้ว!",
        data: {
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          zoneName: ticket.zone.name,
          seatNumber: ticket.seatNumber,
          usedAt: ticket.usedAt,
          scannedBy: ticket.scannedBy || "Gate Staff"
        }
      });
    }

    if (ticket.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        valid: false,
        status: "CANCELLED",
        message: "❌ ตั๋วใบนี้ถูกยกเลิกแล้ว"
      });
    }

    // Mark as USED
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        scannedBy: scannedBy || 'Gate Staff'
      }
    });

    res.json({
      success: true,
      valid: true,
      status: "VALID",
      message: "✅ ตรวจสอบผ่าน - ยินดีต้อนรับเข้าสู่งาน SoundWave Festival!",
      data: {
        ticketCode: updatedTicket.ticketCode,
        attendeeName: updatedTicket.attendeeName,
        seatNumber: updatedTicket.seatNumber,
        zoneName: ticket.zone.name,
        concertName: ticket.zone.concert.name,
        usedAt: updatedTicket.usedAt
      }
    });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
