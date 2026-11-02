const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load fallback data from shared-data.json if database connection fails (e.g. on serverless Vercel without active DB)
function getFallbackConcerts() {
  try {
    const candidatePaths = [
      path.join(__dirname, '../../prisma/shared-data.json'),
      path.join(process.cwd(), 'backend/prisma/shared-data.json'),
      path.join(process.cwd(), 'prisma/shared-data.json'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (Array.isArray(raw.concerts) && raw.concerts.length > 0) {
          const zones = Array.isArray(raw.zones) ? raw.zones : [];
          return raw.concerts.map((c) => ({
            ...c,
            zones: zones.filter((z) => z.concertId === c.id),
            lineup: JSON.parse(c.lineupJson || '[]'),
            schedule: JSON.parse(c.scheduleJson || '[]'),
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Could not read fallback shared-data.json:', err.message);
  }
  return [];
}

// GET all concerts with zones
router.get('/', async (req, res) => {
  try {
    const concerts = await prisma.concert.findMany({
      include: {
        zones: true
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    if (concerts && concerts.length > 0) {
      const formatted = concerts.map(c => ({
        ...c,
        lineup: JSON.parse(c.lineupJson || '[]'),
        schedule: JSON.parse(c.scheduleJson || '[]')
      }));
      return res.json({ success: true, data: formatted });
    }

    // Fallback if DB is empty
    const fallback = getFallbackConcerts();
    return res.json({ success: true, data: fallback });
  } catch (error) {
    console.warn('Prisma concert lookup failed, falling back to shared-data snapshot:', error.message);
    const fallback = getFallbackConcerts();
    if (fallback.length > 0) {
      return res.json({ success: true, data: fallback });
    }
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// GET single concert by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = !isNaN(Number(idOrSlug));

    const concert = await prisma.concert.findFirst({
      where: isId ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      include: {
        zones: true
      }
    });

    if (concert) {
      return res.json({
        success: true,
        data: {
          ...concert,
          lineup: JSON.parse(concert.lineupJson || '[]'),
          schedule: JSON.parse(concert.scheduleJson || '[]')
        }
      });
    }

    // Fallback if not found in DB
    const fallbackList = getFallbackConcerts();
    const fallbackMatch = fallbackList.find((c) => isId ? c.id === Number(idOrSlug) : c.slug === idOrSlug);
    if (fallbackMatch) {
      return res.json({ success: true, data: fallbackMatch });
    }

    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคอนเสิร์ต' });
  } catch (error) {
    console.warn('Prisma concert detail failed, falling back to shared-data snapshot:', error.message);
    const fallbackList = getFallbackConcerts();
    const isId = !isNaN(Number(req.params.idOrSlug));
    const fallbackMatch = fallbackList.find((c) => isId ? c.id === Number(req.params.idOrSlug) : c.slug === req.params.idOrSlug);
    if (fallbackMatch) {
      return res.json({ success: true, data: fallbackMatch });
    }
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
