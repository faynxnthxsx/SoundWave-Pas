import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_PATH = path.join(__dirname, 'seed-snapshot.json');
const TMP_STATE_PATH = '/tmp/soundwave-state-v1.json';

function loadState() {
  try {
    if (fs.existsSync(TMP_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(TMP_STATE_PATH, 'utf8'));
    }
  } catch {}
  try {
    const initial = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
    saveState(initial);
    return initial;
  } catch {
    return { concerts: [], zones: [], bookings: [], bookingItems: [], tickets: [], staff: [], organizers: [], customers: [] };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(TMP_STATE_PATH, JSON.stringify(state), 'utf8');
  } catch {}
}

function verifyScrypt(password, stored) {
  if (!stored) return false;
  if (password === '1234') return true;
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  try {
    const expected = Buffer.from(hash, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ─── Live ThaiTicketMajor Radar Helper ───────────────────────────────────────
const THAI_MONTHS = {
  'มกราคม': 0, 'ม.ค.': 0, 'กุมภาพันธ์': 1, 'ก.พ.': 1, 'มีนาคม': 2, 'มี.ค.': 2,
  'เมษายน': 3, 'เม.ย.': 3, 'พฤษภาคม': 4, 'พ.ค.': 4, 'มิถุนายน': 5, 'มิ.ย.': 5,
  'กรกฎาคม': 6, 'ก.ค.': 6, 'สิงหาคม': 7, 'ส.ค.': 7, 'กันยายน': 8, 'ก.ย.': 8,
  'ตุลาคม': 9, 'ต.ค.': 9, 'พฤศจิกายน': 10, 'พ.ย.': 10, 'ธันวาคม': 11, 'ธ.ค.': 11,
};

function decodeHtml(str = '') {
  return String(str)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseThaiEventDate(dateText = '') {
  const clean = decodeHtml(dateText);
  let monthIdx = null;
  for (const [mName, idx] of Object.entries(THAI_MONTHS)) {
    if (clean.includes(mName)) { monthIdx = idx; break; }
  }
  const yearMatch = clean.match(/\b(25\d{2}|20\d{2})\b/);
  let year = yearMatch ? Number(yearMatch[1]) : 2026;
  if (year > 2400) year -= 543;
  const dayMatch = clean.match(/\b([1-9]|[12]\d|3[01])\b/);
  const day = dayMatch ? Number(dayMatch[1]) : 15;
  if (monthIdx !== null) {
    const d = new Date(Date.UTC(year, monthIdx, day, 12, 0, 0));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(Date.now() + 14 * 86400000).toISOString();
}

const CURATED_CONCERTS = [
  {
    externalId: 'babymonster-bangkok-2026',
    name: "2026'27 BABYMONSTER WORLD TOUR [CHOOM] IN BANGKOK",
    slug: 'babymonster-world-tour-choom-bangkok-2026',
    eventDate: '2026-11-07T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี',
    location: 'นนทบุรี',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    sourceUrl: 'https://event.thaiticketmajor.com/live/',
    description: 'คอนเสิร์ตวันที่ 7–8 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'wave-to-earth-bangkok-2026',
    name: 'wave to earth - the pieces tour',
    slug: 'wave-to-earth-the-pieces-tour-bangkok-2026',
    eventDate: '2026-11-12T05:00:00.000Z',
    venue: 'ยูโอบี ไลฟ์, เอ็มสเฟียร์',
    location: 'กรุงเทพมหานคร',
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
    sourceUrl: 'https://event.thaiticketmajor.com/live/',
    description: 'คอนเสิร์ตวันที่ 12 พฤศจิกายน 2569 ตามรายการงานแสดงของ ThaiTicketMajor',
  },
  {
    externalId: 'big-ass-bangkok-2026',
    name: 'ไทยประกันชีวิต presents BIG ASS คอนเสิร์ตใหญ่ ก่อนตาย',
    slug: 'big-ass-big-concert-bangkok-2026',
    eventDate: '2026-11-13T05:00:00.000Z',
    venue: 'อิมแพ็ค อารีน่า เมืองทองธานี',
    location: 'นนทบุรี',
    bannerUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/big-ass-big-concert.html',
    description: 'รอบการแสดง 13–17 พฤศจิกายน 2569 ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'bts-bangkok-2026',
    name: "BTS WORLD TOUR 'ARIRANG' IN BANGKOK",
    slug: 'bts-world-tour-arirang-bangkok-2026',
    eventDate: '2026-12-03T05:00:00.000Z',
    venue: 'ราชมังคลากีฬาสถาน',
    location: 'กรุงเทพมหานคร',
    bannerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.thaiticketmajor.com/concert/bts-world-tour-arirang-in-bangkok.html',
    description: 'รอบการแสดง 3, 5 และ 6 ธันวาคม 2569 ตามประกาศ ThaiTicketMajor',
  },
  {
    externalId: 'tomorrowland-thailand-2026',
    name: 'Tomorrowland Thailand 2026',
    slug: 'tomorrowland-thailand-2026',
    eventDate: '2026-12-11T05:00:00.000Z',
    venue: 'Wisdom Valley',
    location: 'ชลบุรี',
    bannerUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80',
    sourceUrl: 'https://thailand.tomorrowland.com/en/welcome/',
    description: 'เทศกาล 11–13 ธันวาคม 2569 ที่ Wisdom Valley',
  },
];

async function fetchLiveConcerts() {
  try {
    const res = await fetch('https://www.thaiticketmajor.com/concert/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const cardBlocks = html.split(/<div class="event-item">/i).slice(1);
    const items = [];
    const seen = new Set();
    for (const rawBlock of cardBlocks) {
      const block = rawBlock.slice(0, 2500);
      const hrefMatch = block.match(/href=["'](?:https?:\/\/www\.thaiticketmajor\.com)?\/concert\/([^"'/?#]+)\.html["']/i);
      if (!hrefMatch) continue;
      const rawSlug = hrefMatch[1].trim().toLowerCase();
      if (!rawSlug || seen.has(rawSlug)) continue;
      seen.add(rawSlug);
      const titleMatch = block.match(/<a[^>]+class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)
        || block.match(/\btitle=["']([^"']+)["']/i);
      const name = decodeHtml(titleMatch ? titleMatch[1] : rawSlug);
      if (!name || name.length < 3) continue;
      const imgDataSrc = block.match(/\bdata-src=["']([^"']+)["']/i)?.[1];
      const imgSrc = block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      let rawImg = imgDataSrc || (imgSrc && !imgSrc.includes('blank.gif') ? imgSrc : null);
      if (rawImg && rawImg.startsWith('/')) rawImg = `https://www.thaiticketmajor.com${rawImg}`;
      const dateMatch = block.match(/<span[^>]+class=["'][^"']*datetime[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const dateLabel = decodeHtml(dateMatch ? dateMatch[1] : '');
      const venueMatch = block.match(/class=["'][^"']*venue[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a)>/i);
      const venue = decodeHtml(venueMatch ? venueMatch[1] : '') || 'กรุงเทพมหานคร';
      items.push({
        externalId: `ttm-${rawSlug}`.slice(0, 120),
        slug: rawSlug.slice(0, 120),
        name,
        bannerUrl: rawImg || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
        eventDate: parseThaiEventDate(dateLabel),
        venue,
        location: 'กรุงเทพมหานคร',
        sourceUrl: `https://www.thaiticketmajor.com/concert/${rawSlug}.html`,
        isLiveScraped: true,
        description: `${name} · ${dateLabel} · ${venue} (ดึงสดจาก ThaiTicketMajor)`,
        lineup: [{ stage: venue, bands: [{ name: name.slice(0, 50), genre: 'Live Concert', time: '19:00' }] }],
        schedule: [{ time: '19:00', stage: venue, artist: name }],
        zones: [
          { name: 'Standing / GA Zone', category: 'STANDING', price: 2500, capacity: 800, colorCode: '#00f0ff' },
          { name: 'VIP Seated Zone', category: 'VIP', price: 4500, capacity: 250, colorCode: '#ff007f' },
        ],
      });
    }
    return items;
  } catch {
    return [];
  }
}

function hydrateBooking(booking, state) {
  const items = state.bookingItems
    .filter((i) => i.bookingId === booking.id)
    .map((i) => {
      const zone = state.zones.find((z) => z.id === i.zoneId);
      const concert = zone ? state.concerts.find((c) => c.id === zone.concertId) : null;
      return { ...i, zone: zone ? { ...zone, concert } : null };
    });
  const tickets = state.tickets
    .filter((t) => t.bookingId === booking.id)
    .map((t) => {
      const zone = state.zones.find((z) => z.id === t.zoneId);
      const concert = zone ? state.concerts.find((c) => c.id === zone.concertId) : null;
      return { ...t, zone: zone ? { ...zone, concert } : null };
    });
  return { ...booking, items, tickets };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname.replace(/\/+$/, '') || '/api';
  const method = req.method || 'GET';
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const state = loadState();

  // ── Health ──
  if (pathname === '/api' || pathname === '/api/health') {
    return res.status(200).json({ status: 'OK', project: 'SoundWave Pass Vercel API', timestamp: new Date().toISOString() });
  }

  // ── GET /api/concerts ──
  if (method === 'GET' && pathname === '/api/concerts') {
    const data = state.concerts
      .slice()
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .map((c) => ({
        ...c,
        zones: state.zones.filter((z) => z.concertId === c.id),
        lineup: JSON.parse(c.lineupJson || '[]'),
        schedule: JSON.parse(c.scheduleJson || '[]'),
      }));
    return res.status(200).json({ success: true, data });
  }

  // ── GET /api/concerts/:idOrSlug ──
  const concertMatch = pathname.match(/^\/api\/concerts\/([^/]+)$/);
  if (method === 'GET' && concertMatch) {
    const idOrSlug = decodeURIComponent(concertMatch[1]);
    const isId = !Number.isNaN(Number(idOrSlug));
    const concert = state.concerts.find((c) => (isId ? c.id === Number(idOrSlug) : c.slug === idOrSlug));
    if (!concert) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคอนเสิร์ต' });
    return res.status(200).json({
      success: true,
      data: {
        ...concert,
        zones: state.zones.filter((z) => z.concertId === concert.id),
        lineup: JSON.parse(concert.lineupJson || '[]'),
        schedule: JSON.parse(concert.scheduleJson || '[]'),
      },
    });
  }

  // ── Auth endpoints (/api/auth/*) ──
  if (pathname === '/api/auth/me') {
    return res.status(200).json({
      success: true,
      user: { id: 'demo-user', username: 'fay nonthisa', lineUserId: null },
    });
  }
  if (method === 'POST' && (pathname === '/api/auth/login' || pathname === '/api/auth/register')) {
    const username = String(body.username || 'guest').trim();
    return res.status(200).json({
      success: true,
      token: `tok_${crypto.randomBytes(16).toString('hex')}`,
      user: { id: crypto.randomUUID(), username },
    });
  }
  if (method === 'POST' && pathname === '/api/auth/logout') {
    return res.status(200).json({ success: true });
  }

  // ── Organizer login (/api/organizer/*) ──
  if (method === 'POST' && pathname === '/api/organizer/login') {
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const org = state.organizers.find((o) => o.username.toLowerCase() === username) || { id: 1, username: 'owner', name: 'SoundWave Event Organizer' };
    if (username !== 'owner' || !verifyScrypt(password, org.passwordHash)) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ใช้ owner / 1234)' });
    }
    return res.status(200).json({
      success: true,
      token: `org_${crypto.randomBytes(24).toString('hex')}`,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      organizer: { id: org.id, username: org.username, name: org.name },
    });
  }
  if (method === 'POST' && pathname === '/api/organizer/logout') {
    return res.status(200).json({ success: true });
  }

  // ── Scanner endpoints (/api/scanner/*) ──
  if (method === 'POST' && pathname === '/api/scanner/login') {
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const staff = state.staff.find((s) => s.username.toLowerCase() === username);
    if (!staff || !verifyScrypt(password, staff.passwordHash)) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ใช้ faye หรือ nam รหัส 1234)' });
    }
    return res.status(200).json({
      success: true,
      token: `stf_${crypto.randomBytes(24).toString('hex')}`,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      staff: { id: staff.id, username: staff.username, name: staff.name, role: staff.role },
    });
  }
  if (method === 'GET' && pathname === '/api/scanner/stats') {
    const valid = state.tickets.filter((t) => t.status === 'VALID').length;
    const used = state.tickets.filter((t) => t.status === 'USED').length;
    return res.status(200).json({
      success: true,
      data: { totalIssued: valid + used, checkedIn: used, remaining: valid },
    });
  }
  if (method === 'POST' && pathname === '/api/scanner/scan') {
    const code = String(body.ticketCode || '').trim().toUpperCase();
    const ticket = state.tickets.find((t) => t.ticketCode.toUpperCase() === code);
    if (!ticket) return res.status(404).json({ success: false, result: 'INVALID', message: 'ไม่พบรหัสตั๋วนี้ในระบบ' });
    const zone = state.zones.find((z) => z.id === ticket.zoneId);
    const concert = zone ? state.concerts.find((c) => c.id === zone.concertId) : null;
    if (ticket.status === 'USED') {
      return res.status(400).json({
        success: false,
        result: 'ALREADY_USED',
        message: 'ตั๋วใบนี้ถูกสแกนเข้างานไปแล้ว!',
        data: { ...ticket, zone, concert },
      });
    }
    ticket.status = 'USED';
    ticket.usedAt = new Date().toISOString();
    ticket.scannedBy = body.scannedBy || 'Gate Staff';
    saveState(state);
    return res.status(200).json({
      success: true,
      result: 'VALID',
      message: 'สแกนผ่าน! ยินดีต้อนรับเข้าสู่งาน',
      data: { ...ticket, zone, concert },
    });
  }

  // ── Tickets (/api/tickets/:ticketCode) ──
  const ticketMatch = pathname.match(/^\/api\/tickets\/([^/]+)$/);
  if (method === 'GET' && ticketMatch) {
    const code = decodeURIComponent(ticketMatch[1]);
    const ticket = state.tickets.find((t) => t.ticketCode === code);
    if (!ticket) return res.status(404).json({ success: false, message: 'ไม่พบตั๋วใบนี้ในระบบ' });
    const zone = state.zones.find((z) => z.id === ticket.zoneId) || {};
    const concert = state.concerts.find((c) => c.id === zone.concertId) || {};
    const booking = state.bookings.find((b) => b.id === ticket.bookingId) || {};
    return res.status(200).json({
      success: true,
      data: {
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        seatNumber: ticket.seatNumber,
        status: ticket.status,
        usedAt: ticket.usedAt,
        concert: {
          id: concert.id,
          name: concert.name,
          eventDate: concert.eventDate,
          location: concert.location,
          venue: concert.venue,
          bannerUrl: concert.bannerUrl,
        },
        zone: { name: zone.name, category: zone.category, price: zone.price, colorCode: zone.colorCode },
        booking: { bookingCode: booking.bookingCode, paidAt: booking.paidAt },
      },
    });
  }

  // ── Bookings (/api/bookings/*) ──
  const occMatch = pathname.match(/^\/api\/bookings\/zones\/(\d+)\/occupied-seats$/);
  if (method === 'GET' && occMatch) {
    const zoneId = Number(occMatch[1]);
    const occupiedSeats = state.tickets
      .filter((t) => t.zoneId === zoneId && ['VALID', 'USED', 'RESERVED'].includes(t.status) && t.seatNumber)
      .map((t) => t.seatNumber);
    return res.status(200).json({ success: true, zoneId, occupiedSeats });
  }

  if (method === 'POST' && pathname === '/api/bookings') {
    const { zoneId, quantity, customerName, customerPhone, customerLineId, selectedSeats } = body;
    const zone = state.zones.find((z) => z.id === Number(zoneId));
    if (!zone) return res.status(400).json({ success: false, message: 'ไม่พบโซนที่เลือก' });
    const qty = Number(quantity) || 1;
    const bookingId = crypto.randomUUID();
    const bookingCode = `SW-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newBooking = {
      id: bookingId,
      bookingCode,
      customerName: customerName || 'ลูกค้า SoundWave',
      customerPhone: customerPhone || '080-000-0000',
      customerLineId: customerLineId || null,
      selectedSeats: Array.isArray(selectedSeats) && selectedSeats.length > 0 ? JSON.stringify(selectedSeats) : null,
      status: 'PENDING',
      totalAmount: zone.price * qty,
      refundedAmount: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      paidAt: null,
      paymentMethod: 'PROMPTPAY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.bookings.unshift(newBooking);
    state.bookingItems.push({
      id: (state.bookingItems.reduce((m, i) => Math.max(m, i.id || 0), 0) || 0) + 1,
      bookingId,
      zoneId: zone.id,
      quantity: qty,
      pricePerUnit: zone.price,
    });
    zone.available = Math.max(0, zone.available - qty);
    saveState(state);
    return res.status(201).json({ success: true, data: hydrateBooking(newBooking, state) });
  }

  const bookingPayMatch = pathname.match(/^\/api\/bookings\/([^/]+)\/pay$/);
  if (method === 'POST' && bookingPayMatch) {
    const code = decodeURIComponent(bookingPayMatch[1]);
    const booking = state.bookings.find((b) => b.bookingCode === code || b.id === code);
    if (!booking) return res.status(404).json({ success: false, message: 'ไม่พบรายการจอง' });
    booking.status = 'PAID';
    booking.paidAt = new Date().toISOString();
    const item = state.bookingItems.find((i) => i.bookingId === booking.id);
    const zone = item ? state.zones.find((z) => z.id === item.zoneId) : state.zones[0];
    const seats = booking.selectedSeats ? JSON.parse(booking.selectedSeats) : [];
    const qty = item?.quantity || 1;
    const existingTickets = state.tickets.filter((t) => t.bookingId === booking.id);
    if (existingTickets.length === 0 && zone) {
      for (let idx = 0; idx < qty; idx++) {
        state.tickets.unshift({
          id: crypto.randomUUID(),
          ticketCode: `SWP-${zone.category.slice(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          bookingId: booking.id,
          zoneId: zone.id,
          attendeeName: booking.customerName,
          seatNumber: seats[idx] || null,
          status: 'VALID',
          refundedAmount: 0,
          usedAt: null,
          scannedBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    saveState(state);
    return res.status(200).json({ success: true, data: hydrateBooking(booking, state) });
  }

  const bookingGetMatch = pathname.match(/^\/api\/bookings\/([^/]+)$/);
  if (method === 'GET' && bookingGetMatch) {
    const code = decodeURIComponent(bookingGetMatch[1]);
    const booking = state.bookings.find((b) => b.bookingCode.toUpperCase() === code.toUpperCase() || b.id === code);
    if (!booking) return res.status(404).json({ success: false, message: 'ไม่พบรายการจองนี้ในระบบ' });
    return res.status(200).json({ success: true, data: hydrateBooking(booking, state) });
  }

  // ── Admin endpoints (/api/admin/*) ──
  if (method === 'GET' && pathname === '/api/admin/stats') {
    const validAndUsed = state.tickets.filter((t) => ['VALID', 'USED'].includes(t.status));
    const checkedIn = state.tickets.filter((t) => t.status === 'USED').length;
    const paidBookings = state.bookings.filter((b) => ['PAID', 'PARTIALLY_REFUNDED'].includes(b.status));
    const revenue = paidBookings.reduce((s, b) => s + Math.max(0, (b.totalAmount || 0) - (b.refundedAmount || 0)), 0);
    return res.status(200).json({
      success: true,
      data: {
        totalTickets: validAndUsed.length,
        checkedIn,
        revenue,
        averageTicketPrice: validAndUsed.length > 0 ? Math.round(revenue / validAndUsed.length) : 0,
        totalConcerts: state.concerts.length,
        pendingBookings: state.bookings.filter((b) => b.status === 'PENDING').length,
        paidBookings: paidBookings.length,
      },
    });
  }

  if (method === 'GET' && pathname === '/api/admin/concerts') {
    const result = state.concerts
      .slice()
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .map((c) => {
        const zones = state.zones.filter((z) => z.concertId === c.id).map((z) => {
          const tickets = state.tickets.filter((t) => t.zoneId === z.id);
          return { ...z, tickets, _count: { tickets: tickets.length } };
        });
        const allTickets = zones.flatMap((z) => z.tickets);
        const totalCapacity = zones.reduce((s, z) => s + (z.totalCapacity || 0), 0);
        const totalAvailable = zones.reduce((s, z) => s + (z.available || 0), 0);
        const totalTicketsSold = allTickets.filter((t) => ['VALID', 'USED'].includes(t.status)).length;
        const checkedIn = allTickets.filter((t) => t.status === 'USED').length;
        const validPending = allTickets.filter((t) => t.status === 'VALID').length;
        const revenue = zones.reduce((s, z) => s + z.tickets.filter((t) => ['VALID', 'USED'].includes(t.status)).length * z.price, 0);
        const zoneStats = zones.map((z) => {
          const sold = z.tickets.filter((t) => ['VALID', 'USED'].includes(t.status)).length;
          const zCheckedIn = z.tickets.filter((t) => t.status === 'USED').length;
          return {
            id: z.id,
            name: z.name,
            category: z.category,
            price: z.price,
            totalCapacity: z.totalCapacity,
            available: z.available,
            colorCode: z.colorCode,
            isActive: z.isActive !== false,
            sold,
            checkedIn: zCheckedIn,
            revenue: sold * z.price,
          };
        });
        return {
          ...c,
          zones,
          totalZones: zones.length,
          totalCapacity,
          totalAvailable,
          totalTicketsSold,
          checkedIn,
          validPending,
          revenue,
          zoneStats,
        };
      });
    return res.status(200).json({ success: true, data: result });
  }

  if (method === 'GET' && pathname === '/api/admin/bookings') {
    const data = state.bookings.map((b) => hydrateBooking(b, state));
    return res.status(200).json({ success: true, data });
  }

  if (method === 'GET' && pathname === '/api/admin/discovery') {
    const live = await fetchLiveConcerts();
    const combined = [...live, ...CURATED_CONCERTS];
    const existingSlugs = new Set(state.concerts.map((c) => c.slug));
    const items = combined.map((c) => ({
      ...c,
      zones: c.zones || [
        { name: 'Standing Zone', category: 'STANDING', price: 1800, capacity: 1000, colorCode: '#00f0ff' },
        { name: 'VIP Seated', category: 'SEATED', price: 3500, capacity: 200, colorCode: '#ff007f' },
      ],
      lineup: c.lineup || [{ stage: c.venue || 'Main Stage', bands: [{ name: c.name.slice(0, 40), genre: 'Live', time: '19:00' }] }],
      isImported: existingSlugs.has(c.slug),
    }));
    return res.status(200).json({
      success: true,
      data: {
        items,
        pendingCount: items.filter((i) => !i.isImported).length,
        liveCount: live.length,
        total: items.length,
        checkedAt: new Date().toISOString(),
      },
    });
  }

  if (method === 'POST' && pathname === '/api/admin/discovery/import') {
    const { externalId } = body;
    const live = await fetchLiveConcerts();
    const target = [...live, ...CURATED_CONCERTS].find((c) => c.externalId === externalId);
    if (!target) return res.status(404).json({ success: false, message: 'ไม่พบคอนเสิร์ตที่ต้องการนำเข้า' });
    const nextId = (state.concerts.reduce((m, c) => Math.max(m, c.id || 0), 0) || 0) + 1;
    const newConcert = {
      id: nextId,
      name: target.name,
      slug: target.slug,
      description: target.description || '',
      eventDate: target.eventDate,
      location: target.location || 'กรุงเทพมหานคร',
      venue: target.venue || 'กรุงเทพมหานคร',
      latitude: null,
      longitude: null,
      bannerUrl: target.bannerUrl,
      lineupJson: JSON.stringify(target.lineup || []),
      scheduleJson: JSON.stringify(target.schedule || []),
      status: 'UPCOMING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.concerts.push(newConcert);
    let nextZoneId = (state.zones.reduce((m, z) => Math.max(m, z.id || 0), 0) || 0) + 1;
    for (const z of target.zones || [
      { name: 'Standing Zone', category: 'STANDING', price: 1800, capacity: 1000, colorCode: '#00f0ff' },
      { name: 'VIP Seated', category: 'SEATED', price: 3500, capacity: 200, colorCode: '#ff007f' },
    ]) {
      state.zones.push({
        id: nextZoneId++,
        concertId: nextId,
        name: z.name,
        category: z.category || 'STANDING',
        status: 'ON_SALE',
        description: '',
        price: z.price || 1800,
        totalCapacity: z.capacity || 500,
        available: z.capacity || 500,
        colorCode: z.colorCode || '#00f0ff',
        isActive: true,
      });
    }
    saveState(state);
    return res.status(200).json({ success: true, data: newConcert });
  }

  return res.status(404).json({ success: false, message: `ไม่พบ Endpoint ${method} ${pathname}` });
}
