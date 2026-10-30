require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function main() {
  const dataPath = path.join(__dirname, 'shared-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('ไม่พบไฟล์ backend/prisma/shared-data.json');
  }

  console.log('📥 กำลังนำเข้าข้อมูลจาก backend/prisma/shared-data.json เข้าสู่ MySQL...');
  const payload = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  await prisma.ticket.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.concert.deleteMany();
  await prisma.radarCandidate.deleteMany();

  for (const c of payload.concerts || []) {
    await prisma.concert.create({
      data: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        eventDate: new Date(c.eventDate),
        location: c.location,
        venue: c.venue,
        latitude: c.latitude,
        longitude: c.longitude,
        bannerUrl: c.bannerUrl,
        lineupJson: c.lineupJson,
        scheduleJson: c.scheduleJson,
        status: c.status || 'UPCOMING',
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      },
    });
  }

  for (const z of payload.zones || []) {
    await prisma.zone.create({
      data: {
        id: z.id,
        concertId: z.concertId,
        name: z.name,
        category: z.category,
        status: z.status || 'ON_SALE',
        description: z.description || '',
        price: z.price,
        totalCapacity: z.totalCapacity,
        available: z.available,
        colorCode: z.colorCode || '#00f0ff',
        isActive: z.isActive !== false,
      },
    });
  }

  for (const r of payload.radarCandidates || []) {
    await prisma.radarCandidate.create({
      data: {
        externalId: r.externalId,
        source: r.source,
        sourceUrl: r.sourceUrl,
        title: r.title,
        eventDate: r.eventDate ? new Date(r.eventDate) : null,
        venue: r.venue,
        location: r.location,
        description: String(r.description || '').slice(0, 990),
        imageUrl: r.imageUrl,
        rawJson: r.rawJson || '{}',
        status: r.status || 'NEW',
      },
    });
  }

  for (const b of payload.bookings || []) {
    await prisma.booking.create({
      data: {
        id: b.id,
        bookingCode: b.bookingCode,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerLineId: b.customerLineId,
        selectedSeats: b.selectedSeats,
        lineDeliveryStatus: b.lineDeliveryStatus,
        lineDeliveryError: b.lineDeliveryError,
        status: b.status,
        totalAmount: b.totalAmount,
        refundedAmount: b.refundedAmount || 0,
        refundedAt: b.refundedAt ? new Date(b.refundedAt) : null,
        expiresAt: new Date(b.expiresAt),
        paidAt: b.paidAt ? new Date(b.paidAt) : null,
        paymentMethod: b.paymentMethod || 'PROMPTPAY',
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
      },
    });
  }

  for (const bi of payload.bookingItems || []) {
    await prisma.bookingItem.create({
      data: {
        id: bi.id,
        bookingId: bi.bookingId,
        zoneId: bi.zoneId,
        quantity: bi.quantity,
        pricePerUnit: bi.pricePerUnit,
      },
    });
  }

  for (const t of payload.tickets || []) {
    await prisma.ticket.create({
      data: {
        id: t.id,
        ticketCode: t.ticketCode,
        bookingId: t.bookingId,
        zoneId: t.zoneId,
        attendeeName: t.attendeeName,
        seatNumber: t.seatNumber,
        status: t.status,
        refundedAmount: t.refundedAmount || 0,
        refundedAt: t.refundedAt ? new Date(t.refundedAt) : null,
        usedAt: t.usedAt ? new Date(t.usedAt) : null,
        scannedBy: t.scannedBy,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      },
    });
  }

  // Ensure default local organizer & staff accounts exist (password: 1234)
  const defaultPwdHash = await hashPassword(process.env.SEED_ORGANIZER_PASSWORD || '1234');
  await prisma.organizer.upsert({
    where: { username: 'owner' },
    update: {},
    create: { username: 'owner', passwordHash: defaultPwdHash, name: 'SoundWave Event Organizer' },
  });

  const staffAccounts = [
    { username: 'faye', name: 'เฟย์ (Head Supervisor)', role: 'SUPERVISOR' },
    { username: 'nam', name: 'น้ำ (Gate Scanner Lead)', role: 'GATE_STAFF' },
    { username: 'staff01', name: 'ทีมสแกนประตู 1', role: 'GATE_STAFF' },
  ];
  for (const s of staffAccounts) {
    await prisma.staff.upsert({
      where: { username: s.username },
      update: {},
      create: { username: s.username, passwordHash: defaultPwdHash, name: s.name, role: s.role },
    });
  }

  console.log(
    `✅ นำเข้าข้อมูลสำเร็จ! (${payload.concerts?.length || 0} คอนเสิร์ต, ${payload.zones?.length || 0} โซน, ${payload.radarCandidates?.length || 0} รายการเรดาร์, ${payload.bookings?.length || 0} รายการจอง, ${payload.tickets?.length || 0} ตั๋ว)`
  );
}

main()
  .catch((err) => {
    console.error('❌ Import failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
