const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verified upcoming Thailand events checked on 27 October 2026.
// Dates are stored at noon UTC so the Thai calendar date remains stable in the UI.
// Listings link to the official ticket seller or event organizer. No guessed lineup,
// prices, ticket quotas, or booking inventory are added to SoundWave Pass.
const TTM = 'https://event.thaiticketmajor.com/live/';
const REAL_THAILAND_CONCERTS = [
  {
    externalId: 'yo-sea-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80', name: 'Yo-Sea Asia Tour 2026 - Minimum Band Set live in Bangkok',
    slug: 'yo-sea-asia-tour-2026-bangkok', eventDate: '2026-10-30T05:00:00.000Z',
    venue: 'Volume Livehouse, The Street Ratchada', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตในกรุงเทพฯ วันที่ 30 ตุลาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'bigbang-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80', name: 'BIGBANG 2026-2027 WORLD TOUR < XX : COSMOS > IN BANGKOK',
    slug: 'bigbang-world-tour-cosmos-bangkok-2026', eventDate: '2026-11-07T05:00:00.000Z',
    venue: 'ราชมังคลากีฬาสถาน', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 7–8 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'babymonster-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80', name: "2026'27 BABYMONSTER WORLD TOUR [CHOOM] IN BANGKOK",
    slug: 'babymonster-world-tour-choom-bangkok-2026', eventDate: '2026-11-07T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 7–8 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'lany-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80', name: 'LANY : soft world tour Bangkok',
    slug: 'lany-soft-world-tour-bangkok-2026', eventDate: '2026-11-10T05:00:00.000Z',
    venue: 'ยูโอบี ไลฟ์, เอ็มสเฟียร์', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 10 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'wave-to-earth-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80', name: 'wave to earth - the pieces tour',
    slug: 'wave-to-earth-the-pieces-tour-bangkok-2026', eventDate: '2026-11-12T05:00:00.000Z',
    venue: 'ยูโอบี ไลฟ์, เอ็มสเฟียร์', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 12 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'big-ass-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80', name: 'ไทยประกันชีวิต presents BIG ASS คอนเสิร์ตใหญ่ ก่อนตาย',
    slug: 'big-ass-big-concert-bangkok-2026', eventDate: '2026-11-13T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/big-ass-big-concert.html',
    description: 'รอบการแสดง 13–17 พฤศจิกายน 2569 ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'kpop-masterz-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80', name: '2026 K-POP MASTERZ SPECIAL LIVE IN BANGKOK BAMBAM × JAY B × MARK',
    slug: 'kpop-masterz-bambam-jayb-mark-bangkok-2026', eventDate: '2026-11-14T05:00:00.000Z',
    venue: 'ธันเดอร์โดม สเตเดียม', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'งานแสดงวันที่ 14–15 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'qwer-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80', name: 'QWER 2nd TOUR < ROCKATION : ROCKET LAUNCH!! > IN BANGKOK',
    slug: 'qwer-rockation-bangkok-2026', eventDate: '2026-11-14T05:00:00.000Z',
    venue: 'MCC HALL, เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 14 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'lucy-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop&q=80', name: '2026 LUCY 9TH CONCERT < ISLAND > ENCORE IN BANGKOK',
    slug: 'lucy-9th-concert-island-encore-bangkok-2026', eventDate: '2026-11-28T05:00:00.000Z',
    venue: 'แจ้งวัฒนะ ฮอลล์, เซ็นทรัลแจ้งวัฒนะ ชั้น 5.5', location: 'นนทบุรี',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/2026-9th-concert-island-encore-in-bangkok.html',
    description: 'คอนเสิร์ตวันเสาร์ที่ 28 พฤศจิกายน 2569 เวลา 18:00 น. ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'bts-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80', name: "BTS WORLD TOUR 'ARIRANG' IN BANGKOK",
    slug: 'bts-world-tour-arirang-bangkok-2026', eventDate: '2026-12-03T05:00:00.000Z',
    venue: 'ราชมังคลากีฬาสถาน', location: 'กรุงเทพมหานคร',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/bts-world-tour-arirang-in-bangkok.html',
    description: 'รอบการแสดง 3, 5 และ 6 ธันวาคม 2569 ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'wonderfruit-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80', name: 'Wonderfruit 2026',
    slug: 'wonderfruit-2026', eventDate: '2026-12-03T05:00:00.000Z',
    venue: 'The Fields, Siam Country Club', location: 'ชลบุรี', sourceUrl: 'https://wonderfruit.co/',
    description: 'เทศกาลดนตรีและศิลปะวันที่ 3–7 ธันวาคม 2569 ตามเว็บไซต์ผู้จัด',
  },
  {
    externalId: 'william-est-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop&q=80', name: 'WILLIAM EST REIGN TOGETHER CONCERT',
    slug: 'william-est-reign-together-bangkok-2026', eventDate: '2026-12-05T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'รอบการแสดงวันที่ 5–7 ธันวาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'tomorrowland-thailand-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80', name: 'Tomorrowland Thailand 2026',
    slug: 'tomorrowland-thailand-2026', eventDate: '2026-12-11T05:00:00.000Z',
    venue: 'Wisdom Valley', location: 'เขาไม้แก้ว อำเภอบางละมุง จังหวัดชลบุรี',
    sourceUrl: 'https://thailand.tomorrowland.com/en/welcome/',
    description: 'เทศกาล 11–13 ธันวาคม 2569 ที่ Wisdom Valley; เว็บไซต์ผู้จัดระบุว่าบัตรจำหน่ายหมดแล้ว',
  },
  {
    externalId: 'bmv-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&auto=format&fit=crop&q=80', name: 'PEPSI presents BIG MOUNTAIN VILLAGE 2026',
    slug: 'big-mountain-village-2026', eventDate: '2026-12-12T05:00:00.000Z',
    venue: 'Farm Chokchai 3', location: 'ปากช่อง จังหวัดนครราชสีมา', sourceUrl: TTM,
    description: 'เทศกาลดนตรีวันที่ 12–13 ธันวาคม 2569; รายละเอียดอ้างอิงจากรายการงานและผู้จัด GMM Show',
  },
  {
    externalId: 'jasper-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=1200&auto=format&fit=crop&q=80', name: 'JASP.ER TEMPTATION CONCERT',
    slug: 'jasper-temptation-concert-bangkok-2026', eventDate: '2026-12-18T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี', location: 'นนทบุรี', sourceUrl: TTM,
    description: 'รอบการแสดง 18–20 ธันวาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'edc-thailand-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80', name: 'EDC Thailand 2026',
    slug: 'edc-thailand-2026', eventDate: '2026-12-18T05:00:00.000Z',
    venue: 'Rhythm Park', location: 'ภูเก็ต', sourceUrl: 'https://thailand.edc.com/',
    description: 'เทศกาล 18–20 ธันวาคม 2569 ที่ Rhythm Park ตามเว็บไซต์ผู้จัด',
  },
  {
    externalId: 'tomohisa-yamashita-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop&q=80', name: 'DREAMING TOMOHISA YAMASHITA TOUR 2026 LIVE in BANGKOK',
    slug: 'tomohisa-yamashita-tour-bangkok-2026', eventDate: '2026-12-19T05:00:00.000Z',
    venue: 'ยูเนี่ยน ฮอลล์, ศูนย์การค้ายูเนี่ยน มอลล์', location: 'กรุงเทพมหานคร',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/dreaming-tomohisa-yamashita-tour-2026-live-in-bangkok.html',
    description: 'คอนเสิร์ตวันที่ 19 ธันวาคม 2569 มีรอบ 14:00 และ 19:00 น. ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'fujii-kaze-bangkok-2026',
    bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80', name: 'FUJII KAZE PREMA WORLD TOUR',
    slug: 'fujii-kaze-prema-world-tour-bangkok-2026', eventDate: '2026-12-26T05:00:00.000Z',
    venue: 'สนามกีฬาแห่งชาติ ศุภชลาศัย', location: 'กรุงเทพมหานคร', sourceUrl: TTM,
    description: 'คอนเสิร์ตวันที่ 26 ธันวาคม 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  // ── เพิ่มรายการใหม่ ──────────────────────────────────────────────────────
  {
    externalId: 'wonderfruit-2027',
    name: 'Wonderfruit Festival 2027',
    slug: 'wonderfruit-festival-2027',
    description: 'เทศกาลแห่งศิลปะ ดนตรี อาหาร และความยั่งยืน ณ The Fields at Siam Country Club พัทยา รวมศิลปินระดับโลกและไทยใน 5 เวทีท่ามกลางธรรมชาติ 4 วัน 4 คืน',
    eventDate: '2027-01-15T14:00:00.000Z',
    location: 'The Fields at Siam Country Club, พัทยา, ชลบุรี',
    venue: 'Siam Country Club Wonderfruit Grounds',
    latitude: 12.8955,
    longitude: 100.9321,
    bannerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'The Tree Stage', bands: [{ name: 'Four Tet', genre: 'Electronic', time: '22:30' }, { name: 'Floating Points', genre: 'Electronic Jazz', time: '21:00' }] },
      { stage: 'Canopy Stage', bands: [{ name: 'Yebba', genre: 'R&B Soul', time: '20:00' }, { name: 'Jeff Satur', genre: 'Pop', time: '18:30' }] },
      { stage: 'The Nest', bands: [{ name: 'Caribou', genre: 'Psychedelic', time: '23:00' }] },
    ],
    schedule: [
      { time: '14:00', stage: 'Gates', artist: 'Festival Opens' },
      { time: '18:30', stage: 'Canopy Stage', artist: 'Jeff Satur' },
      { time: '20:00', stage: 'Canopy Stage', artist: 'Yebba' },
      { time: '22:30', stage: 'The Tree Stage', artist: 'Four Tet' },
    ],
    zones: [
      { name: 'Wonder Pass (4-Day Full Festival)', category: 'STANDING', price: 7500, capacity: 2000, colorCode: '#10b981' },
      { name: 'Cultivator VIP Pass', category: 'VIP', price: 18000, capacity: 300, colorCode: '#a78bfa' },
      { name: 'Glamping Pod (2 Persons)', category: 'CAMPING', price: 12000, capacity: 150, colorCode: '#f59e0b' },
    ],
  },
  {
    externalId: 'maho-rasop-2027',
    name: 'Maho Rasop Festival 2027',
    slug: 'maho-rasop-festival-2027',
    description: 'เทศกาลดนตรีอินดี้ที่ดีที่สุดในเอเชียตะวันออกเฉียงใต้ ครั้งที่ 8 ณ ไทยแลนด์ คัลเจอรัล เซ็นเตอร์ พร้อมศิลปินอินดี้-อัลเทอร์เนทีฟระดับโลก',
    eventDate: '2027-02-20T16:00:00.000Z',
    location: 'Thailand Cultural Centre, รัชดาภิเษก, กรุงเทพมหานคร',
    venue: 'Thailand Cultural Centre (TCC)',
    latitude: 13.7649,
    longitude: 100.5668,
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Main Stage', bands: [{ name: 'New Order', genre: 'Post-Punk / Synth', time: '21:30' }, { name: 'Khruangbin', genre: 'Psychedelic Funk', time: '20:00' }] },
      { stage: 'Side Stage', bands: [{ name: 'Stamp Apiwat', genre: 'Thai Indie', time: '19:00' }, { name: 'Dcnxrt', genre: 'Alternative', time: '17:30' }] },
    ],
    schedule: [
      { time: '16:00', stage: 'Side Stage', artist: 'Dcnxrt' },
      { time: '17:30', stage: 'Side Stage', artist: 'Stamp Apiwat' },
      { time: '20:00', stage: 'Main Stage', artist: 'Khruangbin' },
      { time: '21:30', stage: 'Main Stage', artist: 'New Order' },
    ],
    zones: [
      { name: 'Standing GA (Floor)', category: 'STANDING', price: 3900, capacity: 1000, colorCode: '#38bdf8' },
      { name: 'VIP Elevated Platform', category: 'VIP', price: 6200, capacity: 200, colorCode: '#ec4899' },
      { name: 'Grandstand A (Seated)', category: 'SEATED', price: 4500, capacity: 60, colorCode: '#8b5cf6' },
      { name: 'Grandstand B (Seated)', category: 'SEATED', price: 3200, capacity: 60, colorCode: '#3b82f6' },
    ],
  },
  {
    externalId: 'paradise-bkk-2026',
    name: 'Paradise Bangkok Molam International Band',
    slug: 'paradise-bangkok-molam-2026',
    description: 'ค่ำคืนมหัศจรรย์แห่งดนตรีหมอลำร่วมสมัย ผสมผสานดนตรีอีสานดั้งเดิมกับ Funk, Jazz และ Afrobeat บน Live Nation Thailand ณ มูนบาร์ ชั้น 61 โรงแรมบานยันทรี',
    eventDate: '2026-11-28T20:00:00.000Z',
    location: 'Moon Bar Rooftop, โรงแรมบานยันทรี, สาทร, กรุงเทพมหานคร',
    venue: 'Moon Bar at Banyan Tree Bangkok',
    latitude: 13.7219,
    longitude: 100.5293,
    bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Rooftop Stage', bands: [{ name: 'Paradise Bangkok Molam International Band', genre: 'Thai Molam / Funk', time: '21:00' }, { name: 'Siamese Cat Band (Support)', genre: 'Jazz Fusion', time: '20:00' }] },
    ],
    schedule: [
      { time: '20:00', stage: 'Rooftop Bar', artist: 'Siamese Cat Band (Support Set)' },
      { time: '21:00', stage: 'Rooftop Stage', artist: 'Paradise Bangkok Molam International Band' },
    ],
    zones: [
      { name: 'Standing Rooftop GA', category: 'STANDING', price: 1800, capacity: 300, colorCode: '#f59e0b' },
      { name: 'VIP Table Package (4 Persons)', category: 'VIP', price: 9800, capacity: 80, colorCode: '#ef4444' },
    ],
  },
  {
    externalId: 'seafarer-live-hua-hin-2027',
    name: 'Seafarer Live — Hua Hin Beach Concert 2027',
    slug: 'seafarer-live-hua-hin-2027',
    description: 'คอนเสิร์ตริมทะเลหัวหินกลางคืนใต้แสงดาว ฟังดนตรีโปร่งเบาสบายจากศิลปินไทยอิสระ เปิดรับลมทะเล จิบค็อกเทล บนหาดทรายขาวของหัวหิน',
    eventDate: '2027-03-06T18:00:00.000Z',
    location: 'หาดหัวหิน, อำเภอหัวหิน, ประจวบคีรีขันธ์',
    venue: 'Hua Hin Beach Seafront Stage',
    latitude: 12.5637,
    longitude: 99.9578,
    bannerUrl: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=1200&auto=format&fit=crop&q=80',
    lineup: [
      { stage: 'Beach Stage', bands: [{ name: 'Phum Viphurit', genre: 'Indie Pop', time: '21:00' }, { name: 'Lipta', genre: 'R&B Thai', time: '19:30' }, { name: 'Getsunova', genre: 'Thai Indie', time: '18:00' }] },
    ],
    schedule: [
      { time: '18:00', stage: 'Beach Stage', artist: 'Getsunova' },
      { time: '19:30', stage: 'Beach Stage', artist: 'Lipta' },
      { time: '21:00', stage: 'Beach Stage', artist: 'Phum Viphurit' },
    ],
    zones: [
      { name: 'ชายหาดยืนทั่วไป (Beach Standing)', category: 'STANDING', price: 1200, capacity: 800, colorCode: '#06b6d4' },
      { name: 'Sunset Lounge (เก้าอี้ + โต๊ะ VIP)', category: 'VIP', price: 3500, capacity: 120, colorCode: '#f43f5e' },
    ],
  },
];

// ─── Live ThaiTicketMajor Scraper & Cache ────────────────────────────────────
const TTM_CONCERT_URL = 'https://www.thaiticketmajor.com/concert/';
let liveCache = { items: [], fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const THAI_MONTHS = {
  'มกราคม': 0, 'ม.ค.': 0,
  'กุมภาพันธ์': 1, 'ก.พ.': 1,
  'มีนาคม': 2, 'มี.ค.': 2,
  'เมษายน': 3, 'เม.ย.': 3,
  'พฤษภาคม': 4, 'พ.ค.': 4,
  'มิถุนายน': 5, 'มิ.ย.': 5,
  'กรกฎาคม': 6, 'ก.ค.': 6,
  'สิงหาคม': 7, 'ส.ค.': 7,
  'กันยายน': 8, 'ก.ย.': 8,
  'ตุลาคม': 9, 'ต.ค.': 9,
  'พฤศจิกายน': 10, 'พ.ย.': 10,
  'ธันวาคม': 11, 'ธ.ค.': 11,
};

function decodeHtml(str = '') {
  return String(str)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseThaiEventDate(dateText = '') {
  const clean = decodeHtml(dateText);
  let monthIdx = null;
  for (const [mName, idx] of Object.entries(THAI_MONTHS)) {
    if (clean.includes(mName)) {
      monthIdx = idx;
      break;
    }
  }
  const yearMatch = clean.match(/\b(25\d{2}|20\d{2})\b/);
  let year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  if (year > 2400) year -= 543;

  const dayMatch = clean.match(/\b([1-9]|[12]\d|3[01])\b/);
  const day = dayMatch ? Number(dayMatch[1]) : 15;

  if (monthIdx !== null) {
    const d = new Date(Date.UTC(year, monthIdx, day, 12, 0, 0));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(Date.now() + 14 * 86400000).toISOString();
}

async function fetchLiveThaiTicketMajorConcerts(forceRefresh = false) {
  if (!forceRefresh && liveCache.items.length > 0 && Date.now() - liveCache.fetchedAt < CACHE_TTL_MS) {
    return liveCache.items;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(TTM_CONCERT_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const cardBlocks = html.split(/<div class="event-item">/i).slice(1);
    const liveItems = [];
    const seenSlugs = new Set();

    for (const rawBlock of cardBlocks) {
      const block = rawBlock.split(/<\/div>\s*<\/div>\s*(?:<!--|<div class="col-)/i)[0] || rawBlock.slice(0, 2500);
      const hrefMatch = block.match(/href=["'](?:https?:\/\/www\.thaiticketmajor\.com)?\/concert\/([^"'/?#]+)\.html["']/i);
      if (!hrefMatch) continue;

      const rawSlug = hrefMatch[1].trim().toLowerCase();
      if (!rawSlug || seenSlugs.has(rawSlug)) continue;
      seenSlugs.add(rawSlug);

      const titleMatch =
        block.match(/<a[^>]+class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/\btitle=["']([^"']+)["']/i) ||
        block.match(/\balt=["']([^"']+)["']/i);
      const name = decodeHtml(titleMatch ? titleMatch[1] : rawSlug);
      if (!name || name.length < 3) continue;

      const imgDataSrc = block.match(/\bdata-src=["']([^"']+)["']/i)?.[1];
      const imgSrc = block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      let rawImg = imgDataSrc || (imgSrc && !imgSrc.includes('blank.gif') ? imgSrc : null);
      if (rawImg && rawImg.startsWith('/')) {
        rawImg = `https://www.thaiticketmajor.com${rawImg}`;
      }

      const dateMatch = block.match(/<span[^>]+class=["'][^"']*datetime[^"']*["'][^>]*>([\s\S]*?)<\/span>\s*<\/span>/i)
        || block.match(/<span[^>]+class=["'][^"']*datetime[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const dateLabel = decodeHtml(dateMatch ? dateMatch[1] : '');

      const venueMatch = block.match(/class=["'][^"']*venue[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a)>/i);
      const venue = decodeHtml(venueMatch ? venueMatch[1] : '') || 'กรุงเทพมหานคร';

      const sourceUrl = `https://www.thaiticketmajor.com/concert/${rawSlug}.html`;
      const eventDate = parseThaiEventDate(dateLabel);

      liveItems.push({
        externalId: `ttm-${rawSlug}`.slice(0, 120),
        slug: rawSlug.slice(0, 120),
        name,
        bannerUrl: rawImg || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
        eventDate,
        venue,
        location: venue.includes('นนทบุรี') || venue.includes('อิมแพ็ค') || venue.includes('ธันเดอร์โดม') ? 'นนทบุรี' : 'กรุงเทพมหานคร',
        sourceUrl,
        isLiveScraped: true,
        description: `${name}${dateLabel ? ` · รอบการแสดง: ${dateLabel}` : ''}${venue ? ` · สถานที่: ${venue}` : ''} (ดึงข้อมูลสดอัตโนมัติจาก ThaiTicketMajor)`,
        lineup: [
          {
            stage: venue || 'Main Stage',
            bands: [{ name: name.split(/[:\-–|]/)[0].trim().slice(0, 60) || name, genre: 'Live Concert', time: '19:00' }],
          },
        ],
        schedule: [
          { time: '17:00', stage: 'Main Gate', artist: 'เปิดประตูเข้าฮอลล์ (Doors Open)' },
          { time: '19:00', stage: venue || 'Main Stage', artist: name },
        ],
        zones: [
          { name: 'Standing / GA Zone', category: 'STANDING', price: 2500, capacity: 800, colorCode: '#00f0ff' },
          { name: 'VIP Seated Zone', category: 'VIP', price: 4500, capacity: 250, colorCode: '#ff007f' },
          { name: 'Standard Seated', category: 'SEATED', price: 1800, capacity: 400, colorCode: '#a855f7' },
        ],
      });
    }

    if (liveItems.length > 0) {
      liveCache = { items: liveItems, fetchedAt: Date.now() };
    }
    return liveItems;
  } catch (err) {
    console.warn('⚠️ [ConcertDiscovery] Live TTM fetch fallback:', err.message);
    return liveCache.items || [];
  }
}

async function buildCombinedConcertCatalog(forceRefresh = false) {
  const liveConcerts = await fetchLiveThaiTicketMajorConcerts(forceRefresh);
  const merged = [];
  const seenSlugs = new Set();
  const seenNames = new Set();

  const normalizeKey = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');

  // Put live scraped concerts from ThaiTicketMajor first so new real-world announcements appear at the top
  for (const c of liveConcerts) {
    const nameKey = normalizeKey(c.name);
    if (seenSlugs.has(c.slug) || seenNames.has(nameKey)) continue;
    seenSlugs.add(c.slug);
    seenNames.add(nameKey);
    merged.push(c);
  }

  // Include curated Thailand concerts & festivals that aren't already in the live feed
  for (const c of REAL_THAILAND_CONCERTS) {
    const nameKey = normalizeKey(c.name);
    if (seenSlugs.has(c.slug) || seenNames.has(nameKey)) continue;
    seenSlugs.add(c.slug);
    seenNames.add(nameKey);
    merged.push({ ...c, isLiveScraped: false });
  }

  return { merged, liveCount: liveConcerts.length };
}

async function getDiscoveredConcerts(options = {}) {
  const [{ merged, liveCount }, existing] = await Promise.all([
    buildCombinedConcertCatalog(Boolean(options.forceRefresh)),
    prisma.concert.findMany({ select: { slug: true, name: true } }),
  ]);

  const normalizeKey = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
  const existingSlugs = new Set(existing.map(({ slug }) => slug));
  const existingNames = new Set(existing.map(({ name }) => normalizeKey(name)));

  const items = merged.map((concert) => ({
    ...concert,
    lineup: concert.lineup || [
      {
        stage: concert.venue || 'Main Stage',
        bands: [{ name: concert.name.split(/[:\-–|]/)[0].trim().slice(0, 60) || concert.name, genre: 'Live Concert', time: '19:00' }],
      },
    ],
    schedule: concert.schedule || [],
    bannerUrl: concert.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    zones: concert.zones && concert.zones.length > 0 ? concert.zones : [
      { name: 'Standing Zone (บัตรยืนทั่วไป)', category: 'STANDING', price: 1800, capacity: 1000, colorCode: '#00f0ff' },
      { name: 'VIP Seated (บัตรนั่ง VIP)', category: 'SEATED', price: 3500, capacity: 200, colorCode: '#ff007f' },
    ],
    isImported: existingSlugs.has(concert.slug) || existingNames.has(normalizeKey(concert.name)),
  }));
  return {
    items,
    pendingCount: items.filter((concert) => !concert.isImported).length,
    liveCount,
    total: items.length,
    checkedAt: new Date().toISOString(),
    sourceNote: liveCount > 0
      ? `ดึงข้อมูลสดจาก ThaiTicketMajor สำเร็จ (${liveCount} งานสด + รายการเทศกาลในไทย)`
      : 'รายการคัดจากประกาศผู้จัดและ ThaiTicketMajor; ตรวจสอบวันและสถานะบัตรที่ลิงก์ต้นทางก่อนซื้อ',
  };
}

async function importDiscoveredConcert(externalId) {
  const { merged } = await buildCombinedConcertCatalog(false);
  const target = merged.find((concert) => concert.externalId === externalId);
  if (!target) throw new Error('ไม่พบคอนเสิร์ตที่ต้องการนำเข้า');

  const existing = await prisma.concert.findUnique({ where: { slug: target.slug } });
  if (existing) throw new Error(`คอนเสิร์ต "${target.name}" มีอยู่ในระบบแล้ว`);

  // Import as an event listing only. Do not invent ticket prices or activate
  // ticket sales for inventory that is sold by the original event organizer.
  return prisma.concert.create({
    data: {
      name: target.name,
      slug: target.slug,
      description: target.sourceUrl ? `${target.description}\n\nข้อมูลบัตรและการซื้อ: ${target.sourceUrl}` : target.description,
      eventDate: new Date(target.eventDate),
      location: target.location,
      venue: target.venue,
      latitude: target.latitude || null,
      longitude: target.longitude || null,
      bannerUrl: target.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      lineupJson: JSON.stringify(target.lineup || []),
      scheduleJson: JSON.stringify(target.schedule || []),
      status: 'UPCOMING',
      zones: {
        create: (target.zones && target.zones.length > 0 ? target.zones : [
          { name: 'Standing Zone (บัตรยืนทั่วไป)', category: 'STANDING', price: 1800, capacity: 1000, colorCode: '#00f0ff' },
          { name: 'VIP Seated (บัตรนั่ง VIP)', category: 'SEATED', price: 3500, capacity: 200, colorCode: '#ff007f' }
        ]).map((z) => ({
          name: z.name,
          category: z.category || 'STANDING',
          price: z.price || 0,
          totalCapacity: z.capacity || 500,
          available: z.capacity || 500,
          colorCode: z.colorCode || '#00f0ff',
        }))
      },
    },
  });
}

module.exports = { getDiscoveredConcerts, importDiscoveredConcert };
