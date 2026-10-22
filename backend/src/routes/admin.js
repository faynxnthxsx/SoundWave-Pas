const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Accept small poster images as data URLs and keep the files outside the database.
router.post('/upload', async (req, res) => {
  try {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(req.body?.image || '');
    if (!match) return res.status(400).json({ success: false, message: 'รองรับไฟล์ JPG, PNG หรือ WebP เท่านั้น' });
    const image = Buffer.from(match[2], 'base64');
    if (!image.length || image.length > 4 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'ขนาดไฟล์โปสเตอร์ต้องไม่เกิน 4 MB' });
    }
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[match[1]];
    const filename = `${crypto.randomUUID()}.${extension}`;
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), image, { flag: 'wx' });
    res.status(201).json({ success: true, data: { url: `/uploads/${filename}` } });
  } catch (err) {
    console.error('Admin poster upload error:', err);
    res.status(500).json({ success: false, message: 'อัปโหลดโปสเตอร์ไม่สำเร็จ' });
  }
});

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
// Summary numbers: tickets, revenue, check-ins, concerts
router.get('/stats', async (req, res) => {
  try {
    const [totalTickets, checkedIn, revenueData, totalConcerts, pendingBookings, paidBookings] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: 'USED' } }),
        prisma.booking.aggregate({
          where: { status: 'PAID' },
          _sum: { totalAmount: true },
        }),
        prisma.concert.count(),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'PAID' } }),
      ]);

    res.json({
      success: true,
      data: {
        totalTickets,
        checkedIn,
        revenue: revenueData._sum.totalAmount || 0,
        totalConcerts,
        pendingBookings,
        paidBookings,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/concerts ─────────────────────────────────────────────────
// List all concerts with detailed zone, ticket, financial & check-in stats
router.get('/concerts', async (req, res) => {
  try {
    const concerts = await prisma.concert.findMany({
      include: {
        zones: {
          include: {
            tickets: {
              select: { id: true, status: true, seatNumber: true },
            },
            _count: { select: { tickets: true } },
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    const result = concerts.map((c) => {
      const allTickets = c.zones.flatMap((z) => z.tickets || []);
      const totalCapacity = c.zones.reduce((sum, z) => sum + (z.totalCapacity || 0), 0);
      const totalAvailable = c.zones.reduce((sum, z) => sum + (z.available || 0), 0);
      const totalTicketsSold = c.zones.reduce((sum, z) => sum + z._count.tickets, 0);
      const checkedIn = allTickets.filter((t) => t.status === 'USED').length;
      const validPending = allTickets.filter((t) => t.status === 'VALID').length;
      const revenue = c.zones.reduce((sum, z) => sum + z._count.tickets * z.price, 0);

      const zoneStats = c.zones.map((z) => {
        const zoneTickets = z.tickets || [];
        const zoneCheckedIn = zoneTickets.filter((t) => t.status === 'USED').length;
        const zoneSold = z._count.tickets;
        const zoneRevenue = zoneSold * z.price;
        return {
          id: z.id,
          name: z.name,
          category: z.category,
          price: z.price,
          totalCapacity: z.totalCapacity,
          available: z.available,
          sold: zoneSold,
          checkedIn: zoneCheckedIn,
          revenue: zoneRevenue,
        };
      });

      return {
        ...c,
        totalZones: c.zones.length,
        totalCapacity,
        totalAvailable,
        totalTicketsSold,
        checkedIn,
        validPending,
        revenue,
        zoneStats,
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Admin concerts error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── POST /api/admin/concerts ────────────────────────────────────────────────
// Create a new concert + zones
router.post('/concerts', async (req, res) => {
  try {
    const { name, slug, description, eventDate, location, venue, latitude, longitude, bannerUrl, lineupJson, zones } =
      req.body;

    const parsedDate = new Date(eventDate);
    const validZones = Array.isArray(zones) && zones.length > 0 && zones.every((zone) =>
      zone.name?.trim() && Number.isFinite(Number(zone.price)) && Number(zone.price) >= 0 &&
      Number.isInteger(Number(zone.capacity)) && Number(zone.capacity) > 0
    );
    if (!name?.trim() || !slug?.trim() || !eventDate || Number.isNaN(parsedDate.getTime()) || !location?.trim() || !validZones) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อคอนเสิร์ต URL วันที่ สถานที่ และข้อมูลโซนให้ครบถ้วน',
      });
    }

    // Check duplicate slug
    const existing = await prisma.concert.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `slug "${slug}" ถูกใช้ไปแล้ว`,
      });
    }

    const concert = await prisma.$transaction(async (tx) => {
      const newConcert = await tx.concert.create({
        data: {
          name,
          slug,
          description: description || '',
          eventDate: parsedDate,
          location,
          venue: venue || location,
          latitude: latitude !== null && latitude !== '' && Number.isFinite(Number(latitude)) ? Number(latitude) : null,
          longitude: longitude !== null && longitude !== '' && Number.isFinite(Number(longitude)) ? Number(longitude) : null,
          bannerUrl: bannerUrl || '',
          lineupJson: lineupJson || '[]',
          scheduleJson: '[]',
          status: 'UPCOMING',
        },
      });

      await tx.zone.createMany({
        data: zones.map((z) => ({
          concertId: newConcert.id,
          name: z.name.trim(),
          category: z.category || 'STANDING',
          price: Number(z.price),
          totalCapacity: Number(z.capacity),
          available: Number(z.capacity),
          colorCode: z.colorCode || '#ffffff',
        })),
      });

      return newConcert;
    });

    res.status(201).json({
      success: true,
      message: 'สร้างคอนเสิร์ตสำเร็จ',
      data: concert,
    });
  } catch (err) {
    console.error('Admin create concert error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── PUT /api/admin/concerts/:id ─────────────────────────────────────────────
// Update concert metadata
router.put('/concerts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, eventDate, location, venue, latitude, longitude, bannerUrl, lineupJson, status } =
      req.body;

    const updated = await prisma.concert.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(location && { location }),
        ...(venue && { venue }),
        ...(latitude !== undefined && { latitude: latitude !== null && latitude !== '' && Number.isFinite(Number(latitude)) ? Number(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude !== null && longitude !== '' && Number.isFinite(Number(longitude)) ? Number(longitude) : null }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(lineupJson !== undefined && { lineupJson }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, message: 'อัปเดตสำเร็จ', data: updated });
  } catch (err) {
    console.error('Admin update concert error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/bookings ─────────────────────────────────────────────────
// Recent bookings list
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: {
          include: { zone: { include: { concert: true } } },
        },
        _count: { select: { tickets: true } },
      },
    });
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Admin bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// ─── GET /api/admin/zones/:zoneId/seats ───────────────────────────────────────
// Get full seat inventory & details for a specific zone
router.get('/zones/:zoneId/seats', async (req, res) => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        concert: true,
        tickets: {
          include: { booking: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });

    // Active pending bookings
    const activePending = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        items: { some: { zoneId } }
      }
    });

    res.json({
      success: true,
      data: {
        zone,
        tickets: zone.tickets,
        activePending
      }
    });
  } catch (err) {
    console.error('Admin get zone seats error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── POST /api/admin/zones/:zoneId/seats/block ──────────────────────────────
// Admin blocks / locks a specific seat (so customers cannot book it)
router.post('/zones/:zoneId/seats/block', async (req, res) => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    const { seatNumber, reason } = req.body;
    if (!seatNumber) return res.status(400).json({ success: false, message: 'กรุณาระบุเลขที่นั่งที่ต้องการล็อก' });

    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซน' });

    // Check if already taken
    const existingTicket = await prisma.ticket.findFirst({
      where: { zoneId, seatNumber: String(seatNumber).trim(), status: { in: ['VALID', 'USED'] } }
    });
    if (existingTicket) {
      return res.status(400).json({ success: false, message: `ที่นั่ง ${seatNumber} ถูกใช้งานอยู่แล้วโดย ${existingTicket.attendeeName}` });
    }

    // Create a special Admin Reserved booking & ticket
    const blockCode = `ADMIN-BLK-${Date.now().toString().slice(-6)}`;
    const ticketCode = `SWP-BLK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const created = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingCode: blockCode,
          customerName: reason || 'Admin Reserved / ที่นั่งสำหรับทีมงาน',
          customerPhone: '0000000000',
          selectedSeats: JSON.stringify([String(seatNumber).trim()]),
          status: 'PAID',
          totalAmount: 0,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          paidAt: new Date(),
          items: {
            create: {
              zoneId,
              quantity: 1,
              pricePerUnit: 0
            }
          }
        }
      });

      const t = await tx.ticket.create({
        data: {
          ticketCode,
          bookingId: b.id,
          zoneId,
          attendeeName: reason || 'Admin Reserved / ล็อกที่นั่ง',
          seatNumber: String(seatNumber).trim(),
          status: 'VALID'
        }
      });

      await tx.zone.update({
        where: { id: zoneId },
        data: { available: { decrement: 1 } }
      });

      return { booking: b, ticket: t };
    });

    res.json({ success: true, message: `ล็อกที่นั่ง ${seatNumber} สำเร็จ`, data: created });
  } catch (err) {
    console.error('Admin block seat error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── POST /api/admin/tickets/:ticketId/cancel ───────────────────────────────
// Admin cancels / releases a ticket so the seat becomes available again
router.post('/tickets/:ticketId/cancel', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { zone: true, booking: true }
    });

    if (!ticket) return res.status(404).json({ success: false, message: 'ไม่พบตั๋วใบนี้' });

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'CANCELLED' }
      });

      // If booking had this seat, remove from selectedSeats
      if (ticket.booking?.selectedSeats) {
        try {
          const seats = JSON.parse(ticket.booking.selectedSeats);
          const remaining = seats.filter((s) => s !== ticket.seatNumber);
          await tx.booking.update({
            where: { id: ticket.bookingId },
            data: { selectedSeats: JSON.stringify(remaining) }
          });
        } catch (e) {}
      }

      // Return quota to zone
      await tx.zone.update({
        where: { id: ticket.zoneId },
        data: { available: { increment: 1 } }
      });
    });

    res.json({ success: true, message: `ยกเลิกตั๋ว ${ticket.ticketCode} และคืนที่นั่ง ${ticket.seatNumber || ''} เรียบร้อยแล้ว` });
  } catch (err) {
    console.error('Admin cancel ticket error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── PUT /api/admin/tickets/:ticketId/edit ──────────────────────────────────
// Admin edits seat number or attendee name of a ticket
router.put('/tickets/:ticketId/edit', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { seatNumber, attendeeName, status } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { booking: true }
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'ไม่พบตั๋วใบนี้' });

    const newSeat = seatNumber !== undefined ? String(seatNumber).trim() : ticket.seatNumber;

    // If changing seat number, check if the new seat is already occupied by another ticket
    if (newSeat && newSeat !== ticket.seatNumber) {
      const conflict = await prisma.ticket.findFirst({
        where: {
          zoneId: ticket.zoneId,
          seatNumber: newSeat,
          status: { in: ['VALID', 'USED'] },
          id: { not: ticketId }
        }
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: `ที่นั่ง ${newSeat} มีผู้อื่นใช้งานอยู่แล้ว (${conflict.attendeeName})` });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          ...(newSeat && { seatNumber: newSeat }),
          ...(attendeeName && { attendeeName: String(attendeeName).trim() }),
          ...(status && { status })
        }
      });

      // Update selectedSeats in booking
      if (ticket.booking?.selectedSeats && newSeat && newSeat !== ticket.seatNumber) {
        try {
          const seats = JSON.parse(ticket.booking.selectedSeats);
          const updatedSeats = seats.map((s) => (s === ticket.seatNumber ? newSeat : s));
          await tx.booking.update({
            where: { id: ticket.bookingId },
            data: { selectedSeats: JSON.stringify(updatedSeats) }
          });
        } catch (e) {}
      }

      return t;
    });

    res.json({ success: true, message: 'แก้ไขข้อมูลที่นั่งสำเร็จ', data: updated });
  } catch (err) {
    console.error('Admin edit ticket error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ─── POST /api/admin/zones/:zoneId/capacity ─────────────────────────────────
// Admin adjusts zone totalCapacity and available
router.post('/zones/:zoneId/capacity', async (req, res) => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    const { totalCapacity, available, price } = req.body;

    const updated = await prisma.zone.update({
      where: { id: zoneId },
      data: {
        ...(totalCapacity !== undefined && { totalCapacity: Number(totalCapacity) }),
        ...(available !== undefined && { available: Number(available) }),
        ...(price !== undefined && { price: Number(price) })
      }
    });

    res.json({ success: true, message: 'ปรับความจุและราคาโซนสำเร็จ', data: updated });
  } catch (err) {
    console.error('Admin update zone capacity error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;

