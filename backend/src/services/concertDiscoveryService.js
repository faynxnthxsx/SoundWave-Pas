const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verified upcoming Thailand events checked on 27 October 2026.
// Dates are stored at noon UTC so the Thai calendar date remains stable in the UI.
// Listings link to the official ticket seller or event organizer. No guessed lineup,
// prices, ticket quotas, or booking inventory are added to SoundWave Pass.
const TTM = 'https://event.thaiticketmajor.com/live/';
const REAL_THAILAND_CONCERTS = [
  {
    externalId: 'yo-sea-bangkok-2026', name: 'Yo-Sea Asia Tour 2026 - Minimum Band Set live in Bangkok',
    slug: 'yo-sea-asia-tour-2026-bangkok', eventDate: '2026-10-30T05:00:00.000Z',
    venue: 'Volume Livehouse, The Street Ratchada', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตในกรุงเทพฯ วันที่ 30 ตุลาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'bigbang-bangkok-2026', name: 'BIGBANG 2026-2027 WORLD TOUR < XX : COSMOS > IN BANGKOK',
    slug: 'bigbang-world-tour-cosmos-bangkok-2026', eventDate: '2026-11-07T05:00:00.000Z',
    venue: 'ราชมังคลากีฬาสถาน', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 7–8 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'babymonster-bangkok-2026', name: "2026'27 BABYMONSTER WORLD TOUR [CHOOM] IN BANGKOK",
    slug: 'babymonster-world-tour-choom-bangkok-2026', eventDate: '2026-11-07T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 7–8 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'lany-bangkok-2026', name: 'LANY : soft world tour Bangkok',
    slug: 'lany-soft-world-tour-bangkok-2026', eventDate: '2026-11-10T05:00:00.000Z',
    venue: 'ยูโอบี ไลฟ์, เอ็มสเฟียร์', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 10 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'wave-to-earth-bangkok-2026', name: 'wave to earth - the pieces tour',
    slug: 'wave-to-earth-the-pieces-tour-bangkok-2026', eventDate: '2026-11-12T05:00:00.000Z',
    venue: 'ยูโอบี ไลฟ์, เอ็มสเฟียร์', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 12 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'big-ass-bangkok-2026', name: 'ไทยประกันชีวิต presents BIG ASS คอนเสิร์ตใหญ่ ก่อนตาย',
    slug: 'big-ass-big-concert-bangkok-2026', eventDate: '2026-11-13T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/big-ass-big-concert.html',
    description: 'รอบการแสดง 13–17 พฤศจิกายน 2569 ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'kpop-masterz-bangkok-2026', name: '2026 K-POP MASTERZ SPECIAL LIVE IN BANGKOK BAMBAM × JAY B × MARK',
    slug: 'kpop-masterz-bambam-jayb-mark-bangkok-2026', eventDate: '2026-11-14T05:00:00.000Z',
    venue: 'ธันเดอร์โดม สเตเดียม', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'งานแสดงวันที่ 14–15 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'qwer-bangkok-2026', name: 'QWER 2nd TOUR < ROCKATION : ROCKET LAUNCH!! > IN BANGKOK',
    slug: 'qwer-rockation-bangkok-2026', eventDate: '2026-11-14T05:00:00.000Z',
    venue: 'MCC HALL, เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 14 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'lucy-bangkok-2026', name: '2026 LUCY 9TH CONCERT < ISLAND > ENCORE IN BANGKOK',
    slug: 'lucy-9th-concert-island-encore-bangkok-2026', eventDate: '2026-11-28T05:00:00.000Z',
    venue: 'แจ้งวัฒนะ ฮอลล์, เซ็นทรัลแจ้งวัฒนะ ชั้น 5.5', location: 'นนทบุรี',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/2026-9th-concert-island-encore-in-bangkok.html',
    description: 'คอนเสิร์ตวันเสาร์ที่ 28 พฤศจิกายน 2569 เวลา 18:00 น. ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'bts-bangkok-2026', name: "BTS WORLD TOUR 'ARIRANG' IN BANGKOK",
    slug: 'bts-world-tour-arirang-bangkok-2026', eventDate: '2026-12-03T05:00:00.000Z',
    venue: 'ราชมังคลากีฬาสถาน', location: 'กรุงเทพมหานคร',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/bts-world-tour-arirang-in-bangkok.html',
    description: 'รอบการแสดง 3, 5 และ 6 ธันวาคม 2569 ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'wonderfruit-2026', name: 'Wonderfruit 2026',
    slug: 'wonderfruit-2026', eventDate: '2026-12-03T05:00:00.000Z',
    venue: 'The Fields, Siam Country Club', location: 'ชลบุรี', sourceUrl: 'https://wonderfruit.co/',
    description: 'เทศกาลดนตรีและศิลปะวันที่ 3–7 ธันวาคม 2569 ตามเว็บไซต์ผู้จัด',
  },
  {
    externalId: 'william-est-bangkok-2026', name: 'WILLIAM EST REIGN TOGETHER CONCERT',
    slug: 'william-est-reign-together-bangkok-2026', eventDate: '2026-12-05T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'รอบการแสดงวันที่ 5–7 ธันวาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'tomorrowland-thailand-2026', name: 'Tomorrowland Thailand 2026',
    slug: 'tomorrowland-thailand-2026', eventDate: '2026-12-11T05:00:00.000Z',
    venue: 'Wisdom Valley', location: 'เขาไม้แก้ว อำเภอบางละมุง จังหวัดชลบุรี',
    sourceUrl: 'https://thailand.tomorrowland.com/en/welcome/',
    description: 'เทศกาล 11–13 ธันวาคม 2569 ที่ Wisdom Valley; เว็บไซต์ผู้จัดระบุว่าบัตรจำหน่ายหมดแล้ว',
  },
  {
    externalId: 'bmv-2026', name: 'PEPSI presents BIG MOUNTAIN VILLAGE 2026',
    slug: 'big-mountain-village-2026', eventDate: '2026-12-12T05:00:00.000Z',
    venue: 'Farm Chokchai 3', location: 'ปากช่อง จังหวัดนครราชสีมา', sourceUrl: TTM,
    description: 'เทศกาลดนตรีวันที่ 12–13 ธันวาคม 2569; รายละเอียดอ้างอิงจากรายการงานและผู้จัด GMM Show',
  },
  {
    externalId: 'jasper-bangkok-2026', name: 'JASP.ER TEMPTATION CONCERT',
    slug: 'jasper-temptation-concert-bangkok-2026', eventDate: '2026-12-18T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'รอบการแสดง 18–20 ธันวาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'edc-thailand-2026', name: 'EDC Thailand 2026',
    slug: 'edc-thailand-2026', eventDate: '2026-12-18T05:00:00.000Z',
    venue: 'Rhythm Park', location: 'ภูเก็ต', sourceUrl: 'https://thailand.edc.com/',
    description: 'เทศกาล 18–20 ธันวาคม 2569 ที่ Rhythm Park ตามเว็บไซต์ผู้จัด',
  },
  {
    externalId: 'tomohisa-yamashita-bangkok-2026', name: 'DREAMING TOMOHISA YAMASHITA TOUR 2026 LIVE in BANGKOK',
    slug: 'tomohisa-yamashita-tour-bangkok-2026', eventDate: '2026-12-19T05:00:00.000Z',
    venue: 'ยูเนี่ยน ฮอลล์, ศูนย์การค้ายูเนี่ยน มอลล์', location: 'กรุงเทพมหานคร',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/dreaming-tomohisa-yamashita-tour-2026-live-in-bangkok.html',
    description: 'คอนเสิร์ตวันที่ 19 ธันวาคม 2569 มีรอบ 14:00 และ 19:00 น. ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'fujii-kaze-bangkok-2026', name: 'FUJII KAZE PREMA WORLD TOUR',
    slug: 'fujii-kaze-prema-world-tour-bangkok-2026', eventDate: '2026-12-26T05:00:00.000Z',
    venue: 'สนามกีฬาแห่งชาติ ศุภชลาศัย', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 26 ธันวาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
];

async function getDiscoveredConcerts() {
  const existing = await prisma.concert.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existing.map(({ slug }) => slug));
  const items = REAL_THAILAND_CONCERTS.map((concert) => ({
    ...concert,
    lineup: [],
    schedule: [],
    bannerUrl: '',
    zones: [],
    isImported: existingSlugs.has(concert.slug),
  }));
  return {
    items,
    pendingCount: items.filter((concert) => !concert.isImported).length,
    total: items.length,
    checkedAt: new Date().toISOString(),
    sourceNote: 'รายการคัดจากประกาศผู้จัดและ ThaiTicketMajor; ตรวจสอบวันและสถานะบัตรที่ลิงก์ต้นทางก่อนซื้อ',
  };
}

async function importDiscoveredConcert(externalId) {
  const target = REAL_THAILAND_CONCERTS.find((concert) => concert.externalId === externalId);
  if (!target) throw new Error('ไม่พบคอนเสิร์ตที่ต้องการนำเข้า');

  const existing = await prisma.concert.findUnique({ where: { slug: target.slug } });
  if (existing) throw new Error(`คอนเสิร์ต "${target.name}" มีอยู่ในระบบแล้ว`);

  // Import as an event listing only. Do not invent ticket prices or activate
  // ticket sales for inventory that is sold by the original event organizer.
  return prisma.concert.create({
    data: {
      name: target.name,
      slug: target.slug,
      description: `${target.description}\n\nข้อมูลบัตรและการซื้อ: ${target.sourceUrl}`,
      eventDate: new Date(target.eventDate),
      location: target.location,
      venue: target.venue,
      bannerUrl: '',
      lineupJson: '[]',
      scheduleJson: '[]',
      status: 'UPCOMING',
    },
  });
}

module.exports = { getDiscoveredConcerts, importDiscoveredConcert };
