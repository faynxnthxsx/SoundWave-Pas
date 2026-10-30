require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 กำลังส่งออกข้อมูลจาก MySQL (soundwave_db) ไปยัง shared-data.json...');

  const [concerts, zones, radarCandidates, bookings, bookingItems, tickets] = await Promise.all([
    prisma.concert.findMany({ orderBy: { id: 'asc' } }),
    prisma.zone.findMany({ orderBy: { id: 'asc' } }),
    prisma.radarCandidate.findMany({ orderBy: { id: 'asc' } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.bookingItem.findMany({ orderBy: { id: 'asc' } }),
    prisma.ticket.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  // Sanitize personal customer fields while preserving booking codes & ticket records
  const sanitizedBookings = bookings.map((b, idx) => ({
    ...b,
    customerPhone: `08000000${String(idx + 1).padStart(2, '0')}`,
    customerLineId: b.customerLineId ? `U_DEMO_LINE_${String(idx + 1).padStart(2, '0')}` : null,
  }));

  const payload = {
    exportedAt: new Date().toISOString(),
    concerts,
    zones,
    radarCandidates,
    bookings: sanitizedBookings,
    bookingItems,
    tickets,
  };

  const outPath = path.join(__dirname, 'shared-data.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  // Also keep frontend/api/seed-snapshot.json in sync
  const vercelSnapshotPath = path.resolve(__dirname, '../../frontend/api/seed-snapshot.json');
  if (fs.existsSync(path.dirname(vercelSnapshotPath))) {
    fs.writeFileSync(vercelSnapshotPath, JSON.stringify(payload, null, 2), 'utf8');
  }

  console.log(
    `✅ ส่งออกสำเร็จ -> backend/prisma/shared-data.json (${concerts.length} concerts, ${zones.length} zones, ${radarCandidates.length} radar items, ${sanitizedBookings.length} bookings, ${tickets.length} tickets)`
  );
}

main()
  .catch((err) => {
    console.error('❌ Export failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
