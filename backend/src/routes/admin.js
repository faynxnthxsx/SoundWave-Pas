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

module.exports = router;
