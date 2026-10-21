const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
// List all concerts with zone + ticket stats
router.get('/concerts', async (req, res) => {
  try {
    const concerts = await prisma.concert.findMany({
      include: {
        zones: {
          include: {
            _count: { select: { tickets: true } },
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    const result = concerts.map((c) => ({
      ...c,
      totalZones: c.zones.length,
      totalTicketsSold: c.zones.reduce((sum, z) => sum + z._count.tickets, 0),
      revenue: c.zones.reduce(
        (sum, z) => sum + z._count.tickets * z.price,
        0
      ),
    }));

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
    const { name, slug, description, eventDate, location, venue, bannerUrl, lineupJson, zones } =
      req.body;

    if (!name || !slug || !eventDate || !location) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูล: name, slug, eventDate, location',
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
          eventDate: new Date(eventDate),
          location,
          venue: venue || location,
          bannerUrl: bannerUrl || '',
          lineupJson: lineupJson || '[]',
          scheduleJson: '[]',
          status: 'UPCOMING',
        },
      });

      if (Array.isArray(zones) && zones.length > 0) {
        for (const z of zones) {
          await tx.zone.create({
            data: {
              concertId: newConcert.id,
              name: z.name,
              category: z.category || 'STANDING',
              price: parseFloat(z.price) || 0,
              totalCapacity: parseInt(z.capacity) || 100,
              available: parseInt(z.capacity) || 100,
              colorCode: z.colorCode || '#ffffff',
            },
          });
        }
      }

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
    const { name, description, eventDate, location, venue, bannerUrl, lineupJson, status } =
      req.body;

    const updated = await prisma.concert.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(location && { location }),
        ...(venue && { venue }),
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

module.exports = router;
