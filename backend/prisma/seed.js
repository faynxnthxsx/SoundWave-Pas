const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 กำลังรีเซ็ตและเติมข้อมูลจำลอง (Seeding Database)...');

  // ล้างข้อมูลเก่าทั้งหมดตามลำดับความสัมพันธ์
  await prisma.staff.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.concert.deleteMany();

  // 1. ตารางศิลปินและเวลาแสดง (Lineup & Timetable)
  const lineup = [
    {
      stage: "🎸 Main Neon Stage (เวทีหลัก)",
      bands: [
        { name: "Slot Machine", time: "22:30 - 24:00", genre: "Rock" },
        { name: "Taitosmith", time: "20:45 - 22:00", genre: "Rock / Indie" },
        { name: "Bomb at Track", time: "19:15 - 20:15", genre: "Nu-Metal" },
        { name: "The Yers", time: "17:45 - 18:45", genre: "Post-Punk" }
      ]
    },
    {
      stage: "⚡ Cyber Valley Stage (เวทีอินดี้ซินธ์)",
      bands: [
        { name: "Three Man Down", time: "21:30 - 23:00", genre: "Pop-Rock" },
        { name: "Tilly Birds", time: "20:00 - 21:00", genre: "Alternative" },
        { name: "Safeplanet", time: "18:30 - 19:30", genre: "Indie Pop" },
        { name: "Dept", time: "17:00 - 18:00", genre: "Indie Pop" }
      ]
    },
    {
      stage: "⛺ Underground Tent Stage (เวทีอะคูสติก & ดรีมป็อป)",
      bands: [
        { name: "Anatomy Rabbit", time: "21:00 - 22:30", genre: "Dream Pop" },
        { name: "Solitude is Bliss", time: "19:30 - 20:30", genre: "Indie Rock" },
        { name: "Freehand", time: "18:00 - 19:00", genre: "Alternative Rock" }
      ]
    }
  ];

  const schedule = [
    { time: "14:00", activity: "ประตูเปิด & เช็กอินเข้าโซนแคมป์ปิ้ง" },
    { time: "16:00", activity: "เปิดโซนอาหาร Street Food & เครื่องดื่ม" },
    { time: "17:00", activity: "เริ่มการแสดงดนตรีทั้ง 3 เวทีพร้อมกัน" },
    { time: "20:00", activity: "การแสดงแสงสี Neon Lights & Pyro Show" },
    { time: "24:00", activity: "After Party DJ Set ณ โซน Camping" }
  ];

  // 2. สร้างข้อมูลงานเทศกาลดนตรีและโซนบัตร
  const concert = await prisma.concert.create({
    data: {
      name: "SOUNDWAVE MUSIC FESTIVAL 2026: NEON AWAKENING",
      slug: "soundwave-fest-2026",
      description: "เทศกาลดนตรีร็อกและอินดี้เอาต์ดอร์ที่ยิ่งใหญ่ที่สุด แสงสีนีออนเต็มพิกัด 3 เวที 15 ศิลปิน พร้อมโซนกางเต็นท์สัมผัสธรรมชาติและอาหารสตรีทฟู้ดตลอดคืน",
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
            description: "โซนบัตรยืนติดขอบเวทีหลัก สัมผัสความเดือดแบบชิดติดศิลปิน พร้อมช่องทางพิเศษ Fast Lane",
            price: 3500,
            totalCapacity: 500,
            available: 480,
            colorCode: "#00f0ff" // Neon Cyan
          },
          {
            name: "Standing Pit B (Soundwave Pit)",
            category: "STANDING",
            description: "โซนบัตรยืนกึ่งกลางลานคอนเสิร์ต จุดรับฟังระบบเสียงเซอร์ราวด์ที่ดีที่สุด กระโดดมันส์ได้เต็มที่",
            price: 2500,
            totalCapacity: 1200,
            available: 1140,
            colorCode: "#ff007f" // Neon Magenta
          },
          {
            name: "Grandstand Seated (VIP Deck)",
            category: "SEATED",
            description: "อัฒจันทร์ยกระดับมองเห็นทั้ง 3 เวทีแบบพาโนรามา มีเก้าอี้และแถวที่นั่งส่วนตัว พร้อมบาร์แยกเฉพาะโซน",
            price: 2200,
            totalCapacity: 400,
            available: 388,
            colorCode: "#ffe600" // Neon Yellow
          },
          {
            name: "Festival Camping Zone (2 Days Pass)",
            category: "CAMPING",
            description: "พื้นที่กางเต็นท์ใต้แสงดาว รวมสิทธิ์เข้างานทั้ง 2 วัน ห้องอาบน้ำและจุดชาร์จไฟตลอด 24 ชม.",
            price: 1500,
            totalCapacity: 300,
            available: 275,
            colorCode: "#39ff14" // Neon Lime
          }
        ]
      }
    },
    include: {
      zones: true
    }
  });

  const zonePitA = concert.zones.find(z => z.name.includes("Pit A"));
  const zonePitB = concert.zones.find(z => z.name.includes("Pit B"));
  const zoneSeated = concert.zones.find(z => z.name.includes("Seated"));
  const zoneCamping = concert.zones.find(z => z.name.includes("Camping"));

  console.log(`✅ สร้างข้อมูลคอนเสิร์ต: "${concert.name}" เรียบร้อย`);

  // -------------------------------------------------------------
  // 3. ตั๋วทดสอบ เคสที่ 1: ตั๋วสถานะ VALID (พร้อมสแกนผ่านฉลุย ✅)
  // -------------------------------------------------------------
  const bookingValid = await prisma.booking.create({
    data: {
      bookingCode: "SW-2026-VAL01",
      customerName: "ธนกฤต สายร็อค",
      customerPhone: "081-111-2222",
      customerLineId: "U1234567890abcdef",
      status: "PAID",
      totalAmount: zonePitA.price,
      expiresAt: new Date(Date.now() + 600000),
      paidAt: new Date(),
      items: {
        create: {
          zoneId: zonePitA.id,
          quantity: 1,
          pricePerUnit: zonePitA.price
        }
      },
      tickets: {
        create: {
          ticketCode: "SWP-STA-ROCKER-001",
          zoneId: zonePitA.id,
          attendeeName: "ธนกฤต สายร็อค",
          seatNumber: null,
          status: "VALID"
        }
      }
    }
  });

  // -------------------------------------------------------------
  // 4. ตั๋วทดสอบ เคสที่ 2: ตั๋วสถานะ VALID แบบมีระบุแถวที่นั่ง (VIP Deck Seated)
  // -------------------------------------------------------------
  const bookingSeated = await prisma.booking.create({
    data: {
      bookingCode: "SW-2026-VAL02",
      customerName: "แพรวา สวีทซาวด์",
      customerPhone: "089-333-4444",
      customerLineId: "U9988776655fedcba",
      status: "PAID",
      totalAmount: zoneSeated.price,
      expiresAt: new Date(Date.now() + 600000),
      paidAt: new Date(),
      items: {
        create: {
          zoneId: zoneSeated.id,
          quantity: 1,
          pricePerUnit: zoneSeated.price
        }
      },
      tickets: {
        create: {
          ticketCode: "SWP-SEA-VIPDEC-002",
          zoneId: zoneSeated.id,
          attendeeName: "แพรวา สวีทซาวด์",
          seatNumber: "ROW-B-14",
          status: "VALID"
        }
      }
    }
  });

  // -------------------------------------------------------------
  // 5. ตั๋วทดสอบ เคสที่ 3: ตั๋วสถานะ USED (ถูกสแกนใช้ไปแล้ว ❌ กันใช้ซ้ำ)
  // -------------------------------------------------------------
  const bookingUsed = await prisma.booking.create({
    data: {
      bookingCode: "SW-2026-USD01",
      customerName: "กิตติพงษ์ ใจร้อน",
      customerPhone: "086-555-6666",
      status: "PAID",
      totalAmount: zonePitB.price,
      expiresAt: new Date(Date.now() - 3600000),
      paidAt: new Date(Date.now() - 3600000),
      items: {
        create: {
          zoneId: zonePitB.id,
          quantity: 1,
          pricePerUnit: zonePitB.price
        }
      },
      tickets: {
        create: {
          ticketCode: "SWP-STA-USED99-003",
          zoneId: zonePitB.id,
          attendeeName: "กิตติพงษ์ ใจร้อน",
          seatNumber: null,
          status: "USED",
          usedAt: new Date(Date.now() - 15 * 60 * 1000), // สแกนไปเมื่อ 15 นาทีที่แล้ว
          scannedBy: "Gate Staff Alpha #2"
        }
      }
    }
  });

  // -------------------------------------------------------------
  // 6. ตั๋วทดสอบ เคสที่ 4: การจองสถานะ PENDING (กำลังนับถอยหลัง 10 นาที)
  // -------------------------------------------------------------
  const bookingPending = await prisma.booking.create({
    data: {
      bookingCode: "SW-2026-LOCK10",
      customerName: "วรเมธ กำลังโอนเงิน",
      customerPhone: "084-777-8888",
      status: "PENDING",
      totalAmount: zoneCamping.price * 2,
      expiresAt: new Date(Date.now() + 8 * 60 * 1000), // เหลือเวลาอีก 8 นาที
      items: {
        create: {
          zoneId: zoneCamping.id,
          quantity: 2,
          pricePerUnit: zoneCamping.price
        }
      }
    }
  });

  // -------------------------------------------------------------
  // 7. ตั๋วทดสอบ เคสที่ 5: บัตร Camping Pass 2 วัน
  // -------------------------------------------------------------
  const bookingCamping = await prisma.booking.create({
    data: {
      bookingCode: "SW-2026-CMP01",
      customerName: "สายชิลล์ ป่าเขา",
      customerPhone: "082-999-0000",
      status: "PAID",
      totalAmount: zoneCamping.price,
      expiresAt: new Date(Date.now() + 600000),
      paidAt: new Date(),
      items: {
        create: {
          zoneId: zoneCamping.id,
          quantity: 1,
          pricePerUnit: zoneCamping.price
        }
      },
      tickets: {
        create: {
          ticketCode: "SWP-CMP-NATURE-004",
          zoneId: zoneCamping.id,
          attendeeName: "สายชิลล์ ป่าเขา",
          seatNumber: "CAMP-ZONE-C04",
          status: "VALID"
        }
      }
    }
  });

  // -------------------------------------------------------------
  // 8. ข้อมูลบัญชีพนักงานสแกนตั๋วหน้างาน (Staff Accounts)
  // -------------------------------------------------------------
  await prisma.staff.createMany({
    data: [
      {
        username: "faye",
        password: "1234",
        name: "เฟย์ (หัวหน้าทีมสตาฟฟ์)",
        role: "SUPERVISOR"
      },
      {
        username: "nam",
        password: "1234",
        name: "น้ำ (เจ้าหน้าที่สแกนประตู)",
        role: "GATE_STAFF"
      },
      {
        username: "staff01",
        password: "1234",
        name: "เจ้าหน้าที่ประตู 1 (Alpha Gate)",
        role: "GATE_STAFF"
      }
    ]
  });

  console.log('----------------------------------------------------');
  console.log('🎉 เติมข้อมูลชุดทดสอบครบทุกรูปแบบสำเร็จเรียบร้อย:');
  console.log('1. ตั๋วพร้อมสแกน (ผ่านฉลุย ✅): SWP-STA-ROCKER-001');
  console.log('2. ตั๋วมีเลขที่นั่ง VIP (ผ่าน ✅): SWP-SEA-VIPDEC-002 (ที่นั่ง ROW-B-14)');
  console.log('3. ตั๋วสแกนซ้ำ (ไม่ผ่าน ❌):    SWP-STA-USED99-003 (ถูกใช้ไปแล้ว)');
  console.log('4. ตั๋วโซน Camping Pass:       SWP-CMP-NATURE-004');
  console.log('5. รหัสจองรอนับถอยหลัง 10 นาที: SW-2026-LOCK10');
  console.log('6. บัญชีพนักงานสตาฟฟ์:');
  console.log('   - faye / 1234 (เฟย์ - หัวหน้าทีมสตาฟฟ์)');
  console.log('   - nam / 1234  (น้ำ - เจ้าหน้าที่สแกนประตู)');
  console.log('   - staff01 / 1234 (เจ้าหน้าที่ประตู 1)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาด:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
