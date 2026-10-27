const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Curated live feed of real major concerts & music festivals in Thailand (2025 - 2026)
const REAL_THAILAND_CONCERTS = [
  {
    externalId: 'tml-th-2026',
    name: 'Tomorrowland Thailand 2026',
    slug: 'tomorrowland-thailand-2026',
    description: 'เทศกาลดนตรีอิเล็กทรอนิกส์ระดับโลกครั้งแรกในเอเชียตะวันออกเฉียงใต้ ณ Wisdom Valley ชลบุรี พบกับดีเจและโปรดิวเซอร์ระดับโลก แสง สี เสียง และเวทีอลังการระดับตำนาน 3 วันเต็ม',
    eventDate: '2026-12-11T16:00:00.000Z',
    location: 'Wisdom Valley, เขาไม้แก้ว พัทยา, ชลบุรี',
    venue: 'Wisdom Valley Pattaya Amphitheatre',
    latitude: 12.9155,
    longitude: 100.9928,
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Main Stage', bands: [{ name: 'Martin Garrix', genre: 'EDM', time: '22:30' }, { name: 'Alan Walker', genre: 'Electro House', time: '21:00' }, { name: 'David Guetta', genre: 'Dance/Pop', time: '20:00' }] },
      { stage: 'Freedom Stage', bands: [{ name: 'Charlotte de Witte', genre: 'Techno', time: '23:00' }, { name: 'Tale of Us', genre: 'Melodic Techno', time: '21:30' }] },
      { stage: 'Atmosphere Stage', bands: [{ name: 'Vini Vici', genre: 'Psytrance', time: '22:00' }, { name: 'Aly & Fila', genre: 'Trance', time: '20:30' }] },
    ],
    schedule: [
      { time: '16:00', stage: 'Main Stage', artist: 'Gates Open & Opening DJ' },
      { time: '20:00', stage: 'Main Stage', artist: 'David Guetta' },
      { time: '21:00', stage: 'Main Stage', artist: 'Alan Walker' },
      { time: '22:30', stage: 'Main Stage', artist: 'Martin Garrix (Closing Set)' },
    ],
    zones: [
      { name: 'Full Madness Pass (Standing VIP)', category: 'VIP', price: 9900, capacity: 500, colorCode: '#a855f7' },
      { name: 'General Admission (GA Pit)', category: 'STANDING', price: 5500, capacity: 1500, colorCode: '#00f0ff' },
      { name: 'DreamVille Camping Zone', category: 'CAMPING', price: 3500, capacity: 400, colorCode: '#10b981' },
    ],
  },
  {
    externalId: 'summer-sonic-bkk-2026',
    name: 'Summer Sonic Bangkok 2026',
    slug: 'summer-sonic-bangkok-2026',
    description: 'เทศกาลดนตรีระดับตำนานจากญี่ปุ่นกลับมาเยือนกรุงเทพมหานครอีกครั้ง พร้อมทัพศิลปินร็อก ป๊อป และอินดี้แถวหน้าจากทั่วทุกมุมโลก',
    eventDate: '2026-08-22T13:00:00.000Z',
    location: 'Impact Challenger Hall 1-3, เมืองทองธานี, นนทบุรี',
    venue: 'Impact Challenger Hall',
    latitude: 13.9118,
    longitude: 100.5501,
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Sonic Stage', bands: [{ name: 'OneRepublic', genre: 'Pop Rock', time: '21:00' }, { name: 'YOASOBI', genre: 'J-Pop', time: '19:30' }] },
      { stage: 'Mountain Stage', bands: [{ name: 'Bodyslam', genre: 'Thai Rock', time: '20:30' }, { name: 'Tilly Birds', genre: 'Alternative Rock', time: '18:00' }] },
    ],
    schedule: [
      { time: '13:00', stage: 'Sonic Stage', artist: 'Doors Open' },
      { time: '18:00', stage: 'Mountain Stage', artist: 'Tilly Birds' },
      { time: '19:30', stage: 'Sonic Stage', artist: 'YOASOBI' },
      { time: '21:00', stage: 'Sonic Stage', artist: 'OneRepublic' },
    ],
    zones: [
      { name: 'VIP Standing Front Stage', category: 'VIP', price: 6500, capacity: 400, colorCode: '#ec4899' },
      { name: 'Regular Standing GA', category: 'STANDING', price: 4200, capacity: 1200, colorCode: '#06b6d4' },
      { name: 'Grandstand Tier A (Seated)', category: 'SEATED', price: 4800, capacity: 60, colorCode: '#8b5cf6' },
      { name: 'Grandstand Tier B (Seated)', category: 'SEATED', price: 3500, capacity: 60, colorCode: '#3b82f6' },
    ],
  },
  {
    externalId: 'edc-thailand-2026',
    name: 'EDC Thailand 2026 (Electric Daisy Carnival)',
    slug: 'edc-thailand-2026',
    description: 'Under the Electric Sky! เทศกาลดนตรีระดับโลกครั้งแรกที่ภูเก็ต สัมผัสประสบการณ์เวที kineticFIELD, circuitGROUNDS และงานศิลป์สุดตระการตาริมชายหาด',
    eventDate: '2026-12-18T17:00:00.000Z',
    location: 'Rhythm Park, หาดบางเทา, ภูเก็ต',
    venue: 'Rhythm Park Phuket',
    latitude: 7.9942,
    longitude: 98.2988,
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'kineticFIELD', bands: [{ name: 'Tiësto', genre: 'EDM', time: '23:30' }, { name: 'DJ Snake', genre: 'Bass House', time: '22:00' }, { name: 'Above & Beyond', genre: 'Trance', time: '20:30' }] },
      { stage: 'circuitGROUNDS', bands: [{ name: 'Subtronics', genre: 'Dubstep', time: '22:45' }, { name: 'Zeds Dead', genre: 'Bass', time: '21:00' }] },
    ],
    schedule: [
      { time: '17:00', stage: 'kineticFIELD', artist: 'Opening Ceremony' },
      { time: '20:30', stage: 'kineticFIELD', artist: 'Above & Beyond' },
      { time: '22:00', stage: 'kineticFIELD', artist: 'DJ Snake' },
      { time: '23:30', stage: 'kineticFIELD', artist: 'Tiësto' },
    ],
    zones: [
      { name: 'VIP Elevated Viewing Deck', category: 'VIP', price: 8500, capacity: 300, colorCode: '#f59e0b' },
      { name: 'GA 3-Day Festival Pass', category: 'STANDING', price: 4900, capacity: 2000, colorCode: '#10b981' },
      { name: 'Sunset Beach Camping', category: 'CAMPING', price: 2900, capacity: 350, colorCode: '#06b6d4' },
    ],
  },
  {
    externalId: 'coldplay-live-bkk-2026',
    name: 'Coldplay: Music of the Spheres World Tour Bangkok',
    slug: 'coldplay-live-bkk-2026',
    description: 'การกลับมาอีกครั้งของสุดยอดวงดนตรีระดับโลก Coldplay ณ ราชมังคลากีฬาสถาน พร้อมสายรัดข้อมือ LED เรืองแสง พลุไฟ และความยั่งยืนทางสิ่งแวดล้อม',
    eventDate: '2026-11-14T19:00:00.000Z',
    location: 'ราชมังคลากีฬาสถาน, หัวหมาก, กรุงเทพมหานคร',
    venue: 'Rajamangala National Stadium',
    latitude: 13.7553,
    longitude: 100.6222,
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Main Stage', bands: [{ name: 'Coldplay', genre: 'Alternative Rock / Pop', time: '20:30' }, { name: 'Valentina Ploy (Opening)', genre: 'Indie Pop', time: '19:15' }] },
    ],
    schedule: [
      { time: '17:00', stage: 'Main Stage', artist: 'Stadium Gates Open' },
      { time: '19:15', stage: 'Main Stage', artist: 'Valentina Ploy (Special Guest)' },
      { time: '20:30', stage: 'Main Stage', artist: 'Coldplay Live' },
    ],
    zones: [
      { name: 'Standing Arena Pit (Floor)', category: 'STANDING', price: 5800, capacity: 1500, colorCode: '#38bdf8' },
      { name: 'Lower Tier A (Reserved Seat)', category: 'SEATED', price: 6500, capacity: 60, colorCode: '#f43f5e' },
      { name: 'Lower Tier B (Reserved Seat)', category: 'SEATED', price: 4800, capacity: 60, colorCode: '#a855f7' },
      { name: 'Upper Tier C (Reserved Seat)', category: 'SEATED', price: 2800, capacity: 60, colorCode: '#10b981' },
    ],
  },
  {
    externalId: 'bmmf-15-2026',
    name: 'Big Mountain Music Festival 15 (BMMF15)',
    slug: 'bmmf-15-2026',
    description: 'มัน ใหญ่ มาก! เทศกาลดนตรีที่ใหญ่ที่สุดในประเทศไทย 9 เวที 200 กว่าศิลปิน รวมทุกแนวดนตรี ร็อก ป๊อป อินดี้ แร็ป ลูกทุ่ง ท่ามกลางธรรมชาติเขาใหญ่',
    eventDate: '2026-12-05T14:00:00.000Z',
    location: 'The Ocean เขาใหญ่, อำเภอปากช่อง, นครราชสีมา',
    venue: 'The Ocean Khao Yai Festival Ground',
    latitude: 14.6133,
    longitude: 101.4089,
    bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Mountain Stage', bands: [{ name: 'Cocktail', genre: 'Pop Rock', time: '22:00' }, { name: 'TaitosmitH', genre: 'Modern Phleng Phuea Chiwit', time: '20:30' }] },
      { stage: 'Cow Stage', bands: [{ name: 'Polycat', genre: 'Synth Pop', time: '21:30' }, { name: 'Safeplanet', genre: 'Indie Pop', time: '19:45' }] },
      { stage: 'Black Stage', bands: [{ name: 'Retrospect', genre: 'Heavy Metal', time: '23:00' }] },
    ],
    schedule: [
      { time: '14:00', stage: 'Festival Gate', artist: 'Gates Open' },
      { time: '19:45', stage: 'Cow Stage', artist: 'Safeplanet' },
      { time: '20:30', stage: 'Mountain Stage', artist: 'TaitosmitH' },
      { time: '22:00', stage: 'Mountain Stage', artist: 'Cocktail' },
    ],
    zones: [
      { name: 'บัตรเข้างาน 2 วัน (Regular Pass)', category: 'STANDING', price: 2500, capacity: 3000, colorCode: '#00f0ff' },
      { name: 'บัตร VIP Pass (เข้าห้องน้ำติดแอร์ + จุดชมวิวพิเศษ)', category: 'VIP', price: 4500, capacity: 500, colorCode: '#fbbf24' },
      { name: 'โซนกางเต็นท์แคมป์ปิ้ง (Camp Area)', category: 'CAMPING', price: 1200, capacity: 600, colorCode: '#10b981' },
    ],
  },
];

async function getDiscoveredConcerts() {
  const existingSlugs = await prisma.concert.findMany({ select: { slug: true } });
  const existingSet = new Set(existingSlugs.map((c) => c.slug));

  const items = REAL_THAILAND_CONCERTS.map((c) => ({
    ...c,
    isImported: existingSet.has(c.slug),
  }));

  const pendingCount = items.filter((c) => !c.isImported).length;
  return { items, pendingCount, total: items.length };
}

async function importDiscoveredConcert(externalId) {
  const target = REAL_THAILAND_CONCERTS.find((c) => c.externalId === externalId);
  if (!target) throw new Error('ไม่พบคอนเสิร์ตที่ต้องการนำเข้า');

  const existing = await prisma.concert.findUnique({ where: { slug: target.slug } });
  if (existing) throw new Error(`คอนเสิร์ต "${target.name}" มีอยู่ในระบบแล้ว`);

  const created = await prisma.$transaction(async (tx) => {
    const newConcert = await tx.concert.create({
      data: {
        name: target.name,
        slug: target.slug,
        description: target.description,
        eventDate: new Date(target.eventDate),
        location: target.location,
        venue: target.venue,
        latitude: target.latitude,
        longitude: target.longitude,
        bannerUrl: target.bannerUrl,
        lineupJson: JSON.stringify(target.lineup),
        scheduleJson: JSON.stringify(target.schedule),
        status: 'ON_SALE', // Ready for sales right away!
      },
    });

    await tx.zone.createMany({
      data: target.zones.map((z) => ({
        concertId: newConcert.id,
        name: z.name,
        category: z.category,
        description: `${z.name} - ${target.venue}`,
        price: z.price,
        totalCapacity: z.capacity,
        available: z.capacity,
        colorCode: z.colorCode,
        isActive: true,
      })),
    });

    return newConcert;
  });

  return created;
}

module.exports = {
  getDiscoveredConcerts,
  importDiscoveredConcert,
};
