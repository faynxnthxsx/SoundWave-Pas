const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    // Parse lineup and schedule from JSON string
    const formatted = concerts.map(c => ({
      ...c,
      lineup: JSON.parse(c.lineupJson || '[]'),
      schedule: JSON.parse(c.scheduleJson || '[]')
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching concerts:', error);
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

    if (!concert) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคอนเสิร์ต' });
    }

    res.json({
      success: true,
      data: {
        ...concert,
        lineup: JSON.parse(concert.lineupJson || '[]'),
        schedule: JSON.parse(concert.scheduleJson || '[]')
      }
    });
  } catch (error) {
    console.error('Error fetching concert detail:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
