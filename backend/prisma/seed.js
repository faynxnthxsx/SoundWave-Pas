const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing
  await prisma.ticket.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.concert.deleteMany();

  const lineup = [
    {
      stage: "Main Neon Stage 🎸",
      bands: [
        { name: "Slot Machine", time: "22:30 - 24:00", genre: "Rock" },
        { name: "Taitosmith", time: "20:45 - 22:00", genre: "Rock" },
        { name: "Bomb at Track", time: "19:15 - 20:15", genre: "Nu-Metal / Rock" },
        { name: "The Yers", time: "17:45 - 18:45", genre: "Post-Punk" }
      ]
    },
    {
      stage: "Cyber Valley Stage ⚡",
      bands: [
        { name: "Three Man Down", time: "21:30 - 23:00", genre: "Pop-Rock" },
        { name: "Tilly Birds", time: "20:00 - 21:00", genre: "Alternative / Indie" },
        { name: "Safeplanet", time: "18:30 - 19:30", genre: "Indie Pop" },
        { name: "Dept", time: "17:00 - 18:00", genre: "Indie Pop" }
      ]
    },
    {
      stage: "Underground Tent ⛺",
      bands: [
        { name: "Anatomy Rabbit", time: "21:00 - 22:30", genre: "Dream Pop" },
        { name: "Solitude is Bliss", time: "19:30 - 20:30", genre: "Indie Rock" },
        { name: "Freehand", time: "18:00 - 19:00", genre: "Alternative Rock" }
      ]
    }
  ];

  const schedule = [
    { time: "14:00", activity: "Festival Gates & Camping Area Open" },
    { time: "16:00", activity: "Food & Craft Beer Village Opens" },
    { time: "17:00", activity: "Opening Acts on All Stages" },
    { time: "20:00", activity: "Neon Light & Pyro Show" },
    { time: "24:00", activity: "After Party DJ Set at Camping Zone" }
  ];

  const concert = await prisma.concert.create({
    data: {
      name: "SOUNDWAVE MUSIC FESTIVAL 2026: NEON AWAKENING",
      slug: "soundwave-fest-2026",
      description: "เทศกาลดนตรีร็อกและอินดี้เอาท์ดอร์ที่ยิ่งใหญ่ที่สุดแห่งปี แสงสีนีออนเต็มพิกัด 3 เวที 15 ศิลปิน พร้อมโซนกางเต็นท์สัมผัสธรรมชาติและอาหารสตรีทฟู้ดตลอดคืน",
      eventDate: new Date('2026-11-28T14:00:00Z'),
      location: "Oasis Outdoor Arena, สวนผึ้ง ราชบุรี",
      venue: "Main Amphitheater & Forest Ground",
      bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
      lineupJson: JSON.stringify(lineup),
      scheduleJson: JSON.stringify(schedule),
      status: "UPCOMING",
      zones: {
        create: [
          {
            name: "Standing Pit A (Front Row)",
            category: "STANDING",
            description: "โซนบัตรยืนติดขอบเวทีหลัก สัมผัสความเดือดแบบชิดติดศิลปิน พร้อมสิทธิ์เข้างานช่องทางพิเศษ Fast Lane",
            price: 3500,
            totalCapacity: 500,
            available: 485,
            colorCode: "#00f0ff" // Neon Cyan
          },
          {
            name: "Standing Pit B (Soundwave Pit)",
            category: "STANDING",
            description: "โซนบัตรยืนกึ่งกลางลานคอนเสิร์ต จุดรับฟังระบบเสียงเซอร์ราวด์ที่ดีที่สุด กระโดดมันส์ได้ทุกท่วงทำนอง",
            price: 2500,
            totalCapacity: 1200,
            available: 1150,
            colorCode: "#ff007f" // Neon Magenta
          },
          {
            name: "Grandstand Seated (VIP Deck)",
            category: "SEATED",
            description: "อัฒจันทร์ยกระดับมองเห็นทั้ง 3 เวทีแบบพาโนรามา มีเก้าอี้ส่วนตัว พร้อมบาร์เครื่องดื่มแยกเฉพาะโซน",
            price: 2200,
            totalCapacity: 400,
            available: 390,
            colorCode: "#ffe600" // Neon Yellow
          },
          {
            name: "Festival Camping Zone (2 Days Pass)",
            category: "CAMPING",
            description: "พื้นที่กางเต็นท์ใต้แสงดาวและต้นไม้ รวมสิทธิ์เข้างานทั้ง 2 วัน ห้องอาบน้ำและจุดชาร์จไฟตลอด 24 ชม.",
            price: 1500,
            totalCapacity: 300,
            available: 280,
            colorCode: "#39ff14" // Neon Lime
          }
        ]
      }
    }
  });

  console.log(`✅ Seeded concert: "${concert.name}" with ID: ${concert.id}`);

  // Create a sample booking and valid ticket for testing scanner and print
  const sampleZone = await prisma.zone.findFirst({ where: { concertId: concert.id } });

  const sampleBooking = await prisma.booking.create({
    data: {
      bookingCode: "SW-88990",
      customerName: "สมชาย รักเสียงเพลง",
      customerPhone: "081-234-5678",
      customerLineId: "U1234567890abcdef",
      status: "PAID",
      totalAmount: sampleZone.price,
      expiresAt: new Date(Date.now() + 600000),
      paidAt: new Date(),
      items: {
        create: {
          zoneId: sampleZone.id,
          quantity: 1,
          pricePerUnit: sampleZone.price
        }
      },
      tickets: {
        create: {
          ticketCode: "SWP-VIP-889901",
          zoneId: sampleZone.id,
          attendeeName: "สมชาย รักเสียงเพลง",
          seatNumber: "PIT-A-01",
          status: "VALID"
        }
      }
    }
  });

  console.log(`✅ Seeded test booking: ${sampleBooking.bookingCode} with Ticket: SWP-VIP-889901`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
