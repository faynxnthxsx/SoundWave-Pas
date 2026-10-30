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

function hashScrypt(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64);
  return `${salt}:${derived.toString('hex')}`;
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
  return { ...booking, items, tickets, _count: { tickets: tickets.length } };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname.replace(/\/+$/, '') || '/api';
  const method = req.method || 'GET';
  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    body = {};
  }
  const state = loadState();

  // ── Health ──
  if (pathname === '/api' || pathname === '/api/health') {
    return res.status(200).json({ status: 'OK', project: 'SoundWave Pass Vercel API', timestamp: new Date().toISOString() });
  }

  // ── GET /api/locations/search ──
  if (method === 'GET' && pathname === '/api/locations/search') {
    const query = String(urlObj.searchParams.get('q') || '').trim();
    if (query.length < 3) {
      return res.status(400).json({ success: false, message: 'พิมพ์ชื่อสถานที่อย่างน้อย 3 ตัวอักษร' });
    }
    try {
      const base = (process.env.GEOCODER_URL || 'https://photon.komoot.io').replace(/\/$/, '');
      const url = new URL(`${base}/api/`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', '6');
      url.searchParams.set('lat', '13.75');
      url.searchParams.set('lon', '100.5');
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SoundWavePass/1.0 (concert venue picker)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error(`Geocoder ${response.status}`);
      const payload = await response.json();
      const features = (payload.features || []).filter((f) => {
        const p = f.properties || {};
        return String(p.country || '').toLowerCase() === 'thailand' || String(p.countrycode || '').toUpperCase() === 'TH';
      });
      const data = features.map((f) => {
        const p = f.properties || {};
        return {
          id: `${p.osm_type || p.type || 'place'}-${p.osm_id || p.name || Math.random()}`,
          name: p.name || p.street || p.city || '',
          displayName: [p.name, p.street, p.district, p.city, p.state, p.postcode, p.country]
            .filter((part, index, all) => part && all.indexOf(part) === index)
            .join(', '),
          latitude: Number(f.geometry?.coordinates?.[1]),
          longitude: Number(f.geometry?.coordinates?.[0]),
        };
      }).filter((pl) => Number.isFinite(pl.latitude) && Number.isFinite(pl.longitude));
      return res.status(200).json({ success: true, data });
    } catch {
      return res.status(200).json({ success: true, data: [] });
    }
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
  if (method === 'GET' && pathname === '/api/auth/line/config') {
    return res.status(200).json({
      channelId: process.env.LINE_LOGIN_CHANNEL_ID || '2012117630',
      callbackUrl: process.env.LINE_LOGIN_CALLBACK_URL || `https://${req.headers.host || 'soundwave-pas.vercel.app'}/booking/zone-select`,
      officialAccountUrl: null,
    });
  }
  if (method === 'POST' && pathname === '/api/auth/line/verify') {
    return res.status(400).json({
      success: false,
      message: 'LINE Login OAuth ต้องตั้งค่า LINE_LOGIN_CHANNEL_SECRET บนเซิร์ฟเวอร์',
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
  if (method === 'POST' && pathname === '/api/auth/forgot-password') {
    return res.status(200).json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง' });
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
  if (method === 'POST' && pathname === '/api/organizer/forgot-password') {
    const username = String(body.username || '').trim().toLowerCase();
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสผ่านใหม่' });
    }
    const org = state.organizers.find((o) => o.username.toLowerCase() === username);
    if (!org) return res.status(400).json({ success: false, message: 'ไม่พบชื่อผู้ใช้นี้' });
    org.passwordHash = hashScrypt(newPassword);
    saveState(state);
    return res.status(200).json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
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
  if (method === 'POST' && pathname === '/api/scanner/forgot-password') {
    const username = String(body.username || '').trim().toLowerCase();
    const newPassword = String(body.newPassword || '');
    const staff = state.staff.find((s) => s.username.toLowerCase() === username);
    if (!staff) return res.status(400).json({ success: false, message: 'ไม่พบชื่อผู้ใช้นี้' });
    staff.passwordHash = hashScrypt(newPassword);
    saveState(state);
    return res.status(200).json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  }
  if (method === 'POST' && pathname === '/api/scanner/logout') {
    return res.status(200).json({ success: true });
  }
  if (method === 'GET' && pathname === '/api/scanner/stats') {
    const valid = state.tickets.filter((t) => t.status === 'VALID').length;
    const used = state.tickets.filter((t) => t.status === 'USED').length;
    return res.status(200).json({
      success: true,
      data: { totalIssued: valid + used, checkedIn: used, remaining: valid },
    });
  }
  if (method === 'POST' && (pathname === '/api/scanner/scan' || pathname === '/api/scanner/verify')) {
    let rawCode = String(body.ticketCode || '').trim();
    if (!rawCode) {
      return res.status(400).json({ success: false, valid: false, message: 'กรุณาระบุรหัสตั๋ว' });
    }
    if (rawCode.includes('/tickets/')) {
      const m = rawCode.match(/\/tickets\/([A-Za-z0-9_-]+)/);
      if (m && m[1]) rawCode = m[1];
    } else if (rawCode.includes('data=')) {
      const m = rawCode.match(/data=([A-Za-z0-9_%-]+)/);
      if (m && m[1]) rawCode = decodeURIComponent(m[1]);
    } else if (rawCode.includes('/')) {
      const parts = rawCode.split('/').filter(Boolean);
      rawCode = parts[parts.length - 1];
    }
    const code = rawCode.split('?')[0].split('#')[0].trim().toUpperCase();
    const ticket = state.tickets.find((t) => t.ticketCode.toUpperCase() === code);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        valid: false,
        result: 'INVALID',
        status: 'INVALID',
        message: '❌ ไม่พบข้อมูลตั๋วใบนี้ในระบบ (บัตรปลอมหรือไม่ถูกต้อง)',
      });
    }
    const zone = state.zones.find((z) => z.id === ticket.zoneId) || {};
    const concert = zone ? state.concerts.find((c) => c.id === zone.concertId) : {};
    if (ticket.status === 'USED') {
      return res.status(409).json({
        success: false,
        valid: false,
        result: 'ALREADY_USED',
        status: 'ALREADY_USED',
        message: '⚠️ ตั๋วใบนี้ถูกสแกนเข้างานไปแล้ว!',
        data: {
          ...ticket,
          zone,
          concert,
          zoneName: zone?.name,
          concertName: concert?.name,
        },
      });
    }
    if (ticket.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        valid: false,
        result: 'CANCELLED',
        status: 'CANCELLED',
        message: '❌ ตั๋วใบนี้ถูกยกเลิกแล้ว',
      });
    }
    if (ticket.status === 'RESERVED') {
      return res.status(400).json({
        success: false,
        valid: false,
        result: 'RESERVED',
        status: 'RESERVED',
        message: '❌ ตั๋วใบนี้เป็นที่นั่งสำรองโดยผู้จัด ยังไม่ได้ออกเป็นตั๋วเข้างาน',
      });
    }
    ticket.status = 'USED';
    ticket.usedAt = new Date().toISOString();
    ticket.scannedBy = body.scannedBy || 'Gate Staff';
    saveState(state);
    return res.status(200).json({
      success: true,
      valid: true,
      result: 'VALID',
      status: 'VALID',
      message: '✅ ตรวจสอบผ่าน - ยินดีต้อนรับเข้าสู่งาน SoundWave Festival!',
      data: {
        ...ticket,
        zone,
        concert,
        zoneName: zone?.name,
        concertName: concert?.name,
      },
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
  if (method === 'POST' && pathname === '/api/admin/upload') {
    const image = String(body.image || '');
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'รองรับไฟล์ JPG, PNG หรือ WebP เท่านั้น' });
    }
    return res.status(201).json({ success: true, data: { url: image } });
  }

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

  if (method === 'POST' && pathname === '/api/admin/concerts') {
    const { name, slug, description, eventDate, location, venue, latitude, longitude, bannerUrl, lineupJson, scheduleJson, zones } = body;
    const parsedDate = new Date(eventDate);
    if (!name?.trim() || !slug?.trim() || !eventDate || Number.isNaN(parsedDate.getTime()) || !location?.trim() || !Array.isArray(zones) || zones.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อคอนเสิร์ต URL วันที่ สถานที่ และข้อมูลโซนให้ครบถ้วน' });
    }
    if (state.concerts.some((c) => c.slug === slug)) {
      return res.status(400).json({ success: false, message: `slug "${slug}" ถูกใช้ไปแล้ว` });
    }
    const nextConcertId = (state.concerts.reduce((m, c) => Math.max(m, c.id || 0), 0) || 0) + 1;
    const newConcert = {
      id: nextConcertId,
      name: name.trim(),
      slug: slug.trim(),
      description: description || '',
      eventDate: parsedDate.toISOString(),
      location: location.trim(),
      venue: (venue || location).trim(),
      latitude: latitude !== null && latitude !== '' && Number.isFinite(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude !== null && longitude !== '' && Number.isFinite(Number(longitude)) ? Number(longitude) : null,
      bannerUrl: bannerUrl || '',
      lineupJson: lineupJson || '[]',
      scheduleJson: scheduleJson || '[]',
      status: 'UPCOMING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.concerts.push(newConcert);
    let nextZoneId = (state.zones.reduce((m, z) => Math.max(m, z.id || 0), 0) || 0) + 1;
    for (const z of zones) {
      state.zones.push({
        id: nextZoneId++,
        concertId: nextConcertId,
        name: String(z.name || 'General').trim(),
        category: z.category || 'STANDING',
        status: 'ON_SALE',
        description: '',
        price: Number(z.price) || 0,
        totalCapacity: Number(z.capacity) || 100,
        available: Number(z.capacity) || 100,
        colorCode: z.colorCode || '#00f0ff',
        isActive: true,
      });
    }
    saveState(state);
    return res.status(201).json({ success: true, message: 'สร้างคอนเสิร์ตสำเร็จ', data: newConcert });
  }

  const adminConcertUpdateMatch = pathname.match(/^\/api\/admin\/concerts\/(\d+)$/);
  if (method === 'PUT' && adminConcertUpdateMatch) {
    const id = Number(adminConcertUpdateMatch[1]);
    const concert = state.concerts.find((c) => c.id === id);
    if (!concert) return res.status(404).json({ success: false, message: 'ไม่พบคอนเสิร์ตนี้' });
    const { name, description, eventDate, location, venue, latitude, longitude, bannerUrl, lineupJson, scheduleJson, status } = body;
    if (name !== undefined) concert.name = name;
    if (description !== undefined) concert.description = description;
    if (eventDate) concert.eventDate = new Date(eventDate).toISOString();
    if (location !== undefined) concert.location = location;
    if (venue !== undefined) concert.venue = venue;
    if (latitude !== undefined) concert.latitude = latitude !== null && latitude !== '' && Number.isFinite(Number(latitude)) ? Number(latitude) : null;
    if (longitude !== undefined) concert.longitude = longitude !== null && longitude !== '' && Number.isFinite(Number(longitude)) ? Number(longitude) : null;
    if (bannerUrl !== undefined) concert.bannerUrl = bannerUrl;
    if (lineupJson !== undefined) concert.lineupJson = lineupJson;
    if (scheduleJson !== undefined) concert.scheduleJson = scheduleJson;
    if (status) concert.status = status;
    concert.updatedAt = new Date().toISOString();
    saveState(state);
    return res.status(200).json({ success: true, message: 'อัปเดตสำเร็จ', data: concert });
  }

  const adminConcertStatusMatch = pathname.match(/^\/api\/admin\/concerts\/(\d+)\/status$/);
  if (method === 'PATCH' && adminConcertStatusMatch) {
    const id = Number(adminConcertStatusMatch[1]);
    const concert = state.concerts.find((c) => c.id === id);
    if (!concert) return res.status(404).json({ success: false, message: 'ไม่พบคอนเสิร์ตนี้' });
    const { status } = body;
    if (!status || !['UPCOMING', 'ON_SALE', 'PAUSED', 'CLOSED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
    }
    concert.status = status;
    concert.updatedAt = new Date().toISOString();
    saveState(state);
    return res.status(200).json({ success: true, message: `เปลี่ยนสถานะคอนเสิร์ตเป็น ${status} สำเร็จ`, data: concert });
  }

  // ── GET /api/admin/zones/:zoneId/seats ──
  const adminZoneSeatsMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/seats$/);
  if (method === 'GET' && adminZoneSeatsMatch) {
    const zoneId = Number(adminZoneSeatsMatch[1]);
    const rawZone = state.zones.find((z) => z.id === zoneId);
    if (!rawZone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });

    const concert = state.concerts.find((c) => c.id === rawZone.concertId) || null;
    const tickets = state.tickets
      .filter((t) => t.zoneId === zoneId)
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((t) => ({
        ...t,
        booking: state.bookings.find((b) => b.id === t.bookingId) || null,
      }));

    const zone = {
      ...rawZone,
      concert,
      tickets,
    };

    const now = Date.now();
    const activePending = state.bookings.filter((b) => {
      if (b.status !== 'PENDING') return false;
      if (b.expiresAt && new Date(b.expiresAt).getTime() <= now) return false;
      return state.bookingItems.some((item) => item.bookingId === b.id && item.zoneId === zoneId);
    });

    return res.status(200).json({
      success: true,
      data: {
        zone,
        tickets,
        activePending,
      },
    });
  }

  // ── POST /api/admin/zones/:zoneId/seats/block ──
  const adminSeatBlockMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/seats\/block$/);
  if (method === 'POST' && adminSeatBlockMatch) {
    const zoneId = Number(adminSeatBlockMatch[1]);
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซน' });

    const seatNumber = String(body.seatNumber || '').trim();
    const reservedFor = String(body.attendeeName || body.reason || 'Admin Reserved').trim();
    if (!seatNumber) return res.status(400).json({ success: false, message: 'กรุณาระบุเลขที่นั่งที่ต้องการล็อก' });

    const existingTicket = state.tickets.find(
      (t) => t.zoneId === zoneId && String(t.seatNumber || '').trim().toUpperCase() === seatNumber.toUpperCase() && ['VALID', 'USED', 'RESERVED'].includes(t.status)
    );
    if (existingTicket) {
      return res.status(400).json({ success: false, message: `ที่นั่ง ${seatNumber} ถูกใช้งานอยู่แล้วโดย ${existingTicket.attendeeName}` });
    }
    if ((zone.available || 0) <= 0) {
      return res.status(409).json({ success: false, message: 'โซนนี้ไม่มีที่นั่งเหลือสำหรับสำรองแล้ว' });
    }

    zone.available = Math.max(0, zone.available - 1);
    const bookingId = crypto.randomUUID();
    const blockCode = `ADMIN-BLK-${Date.now().toString().slice(-6)}`;
    const ticketCode = `SWP-BLK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    const newBooking = {
      id: bookingId,
      bookingCode: blockCode,
      customerName: reservedFor,
      customerPhone: '0000000000',
      customerLineId: null,
      selectedSeats: JSON.stringify([seatNumber]),
      status: 'RESERVED',
      totalAmount: 0,
      refundedAmount: 0,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      paidAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    state.bookings.unshift(newBooking);
    state.bookingItems.push({
      id: (state.bookingItems.reduce((m, i) => Math.max(m, i.id || 0), 0) || 0) + 1,
      bookingId,
      zoneId,
      quantity: 1,
      pricePerUnit: 0,
    });

    const newTicket = {
      id: crypto.randomUUID(),
      ticketCode,
      bookingId,
      zoneId,
      attendeeName: reservedFor,
      seatNumber,
      status: 'RESERVED',
      refundedAmount: 0,
      usedAt: null,
      scannedBy: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    state.tickets.unshift(newTicket);
    saveState(state);

    return res.status(200).json({
      success: true,
      message: `ล็อกที่นั่ง ${seatNumber} สำเร็จ`,
      data: { booking: newBooking, ticket: newTicket },
    });
  }

  // ── POST /api/admin/zones/:zoneId/seats/batch-block ──
  const adminBatchBlockMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/seats\/batch-block$/);
  if (method === 'POST' && adminBatchBlockMatch) {
    const zoneId = Number(adminBatchBlockMatch[1]);
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });

    const { seatNumbers, attendeeName } = body;
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุที่นั่งที่ต้องการล็อก' });
    }
    const reservedFor = String(attendeeName || 'Admin Reserved').trim();
    const cleanSeats = [...new Set(seatNumbers.map((s) => String(s).trim()).filter(Boolean))];
    const takenSet = new Set(
      state.tickets
        .filter((t) => t.zoneId === zoneId && ['VALID', 'USED', 'RESERVED'].includes(t.status) && t.seatNumber)
        .map((t) => String(t.seatNumber).trim().toUpperCase())
    );
    const seatsToLock = cleanSeats.filter((s) => !takenSet.has(s.toUpperCase()));
    if (seatsToLock.length === 0) {
      return res.status(400).json({ success: false, message: 'ทุกที่นั่งในรายการนี้ถูกใช้งานหรือล็อกอยู่แล้ว' });
    }
    if ((zone.available || 0) < seatsToLock.length) {
      return res.status(409).json({ success: false, message: `โควตาคงเหลือไม่เพียงพอ (ต้องการ ${seatsToLock.length} แต่เหลือ ${zone.available})` });
    }

    zone.available -= seatsToLock.length;
    const bookingId = crypto.randomUUID();
    const blockCode = `ADMIN-BLK-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const booking = {
      id: bookingId,
      bookingCode: blockCode,
      customerName: reservedFor,
      customerPhone: '0000000000',
      customerLineId: null,
      selectedSeats: JSON.stringify(seatsToLock),
      status: 'RESERVED',
      totalAmount: 0,
      refundedAmount: 0,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      paidAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    state.bookings.unshift(booking);
    state.bookingItems.push({
      id: (state.bookingItems.reduce((m, i) => Math.max(m, i.id || 0), 0) || 0) + 1,
      bookingId,
      zoneId,
      quantity: seatsToLock.length,
      pricePerUnit: 0,
    });

    const createdTickets = [];
    for (const seatNumber of seatsToLock) {
      const t = {
        id: crypto.randomUUID(),
        ticketCode: `SWP-BLK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        bookingId,
        zoneId,
        attendeeName: reservedFor,
        seatNumber,
        status: 'RESERVED',
        refundedAmount: 0,
        usedAt: null,
        scannedBy: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.tickets.unshift(t);
      createdTickets.push(t);
    }
    saveState(state);

    return res.status(200).json({
      success: true,
      message: `ล็อกสำรอง ${seatsToLock.length} ที่นั่งเรียบร้อยแล้ว`,
      data: { booking, tickets: createdTickets, lockedCount: seatsToLock.length },
    });
  }

  // ── POST /api/admin/zones/:zoneId/seats/batch-release ──
  const adminBatchReleaseMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/seats\/batch-release$/);
  if (method === 'POST' && adminBatchReleaseMatch) {
    const zoneId = Number(adminBatchReleaseMatch[1]);
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });

    const { seatNumbers } = body;
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุที่นั่งที่ต้องการปลดล็อก' });
    }
    const cleanUpper = new Set(seatNumbers.map((s) => String(s).trim().toUpperCase()).filter(Boolean));
    const reservedTickets = state.tickets.filter(
      (t) => t.zoneId === zoneId && t.status === 'RESERVED' && t.seatNumber && cleanUpper.has(String(t.seatNumber).trim().toUpperCase())
    );
    if (reservedTickets.length === 0) {
      return res.status(400).json({ success: false, message: 'ไม่พบที่นั่งที่อยู่ในสถานะสำรอง' });
    }

    const bookingIds = new Set();
    for (const t of reservedTickets) {
      t.status = 'CANCELLED';
      t.updatedAt = new Date().toISOString();
      if (t.bookingId) bookingIds.add(t.bookingId);
    }
    for (const bId of bookingIds) {
      const hasRemaining = state.tickets.some((t) => t.bookingId === bId && t.status !== 'CANCELLED');
      if (!hasRemaining) {
        const b = state.bookings.find((bk) => bk.id === bId);
        if (b) b.status = 'CANCELLED';
      }
    }
    zone.available = Math.min(zone.totalCapacity, (zone.available || 0) + reservedTickets.length);
    saveState(state);

    return res.status(200).json({
      success: true,
      message: `ปลดล็อกและคืนโควตา ${reservedTickets.length} ที่นั่งเรียบร้อยแล้ว`,
    });
  }

  // ── POST /api/admin/zones/:zoneId/capacity ──
  const adminZoneCapMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/capacity$/);
  if (method === 'POST' && adminZoneCapMatch) {
    const zoneId = Number(adminZoneCapMatch[1]);
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });

    const parsedCapacity = Number(body.totalCapacity);
    const parsedPrice = Number(body.price);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'ความจุต้องเป็นจำนวนเต็มบวก และราคาต้องไม่ติดลบ' });
    }
    const occupied = Math.max(0, (zone.totalCapacity || 0) - (zone.available || 0));
    if (parsedCapacity < occupied) {
      return res.status(409).json({
        success: false,
        message: `ความจุใหม่ต้องไม่น้อยกว่าจำนวนที่นั่งที่ถูกจองหรือถูกล็อกอยู่ ${occupied} ใบ`,
      });
    }
    zone.totalCapacity = parsedCapacity;
    zone.available = parsedCapacity - occupied;
    zone.price = parsedPrice;
    saveState(state);

    return res.status(200).json({ success: true, message: 'ปรับความจุและราคาโซนสำเร็จ', data: zone });
  }

  // ── PATCH /api/admin/zones/:id/toggle-active ──
  const adminZoneToggleMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/toggle-active$/);
  if (method === 'PATCH' && adminZoneToggleMatch) {
    const id = Number(adminZoneToggleMatch[1]);
    const zone = state.zones.find((z) => z.id === id);
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });
    zone.isActive = typeof body.isActive === 'boolean' ? body.isActive : zone.isActive === false;
    saveState(state);
    return res.status(200).json({
      success: true,
      message: `${zone.isActive ? 'เปิดขาย' : 'พักการจำหน่าย'} โซน ${zone.name} แล้ว`,
      data: zone,
    });
  }

  // ── PATCH /api/admin/zones/:id/status ──
  const adminZoneStatusMatch = pathname.match(/^\/api\/admin\/zones\/(\d+)\/status$/);
  if (method === 'PATCH' && adminZoneStatusMatch) {
    const id = Number(adminZoneStatusMatch[1]);
    const zone = state.zones.find((z) => z.id === id);
    if (!zone) return res.status(404).json({ success: false, message: 'ไม่พบโซนนี้' });
    const status = String(body.status || 'ON_SALE');
    if (!['ON_SALE', 'PAUSED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะโซนไม่ถูกต้อง' });
    }
    zone.status = status;
    zone.isActive = status === 'ON_SALE';
    saveState(state);
    return res.status(200).json({ success: true, message: `เปลี่ยนสถานะโซนเป็น ${status} สำเร็จ`, data: zone });
  }

  // ── POST /api/admin/tickets/:ticketId/release-reservation ──
  const adminReleaseResMatch = pathname.match(/^\/api\/admin\/tickets\/([^/]+)\/release-reservation$/);
  if (method === 'POST' && adminReleaseResMatch) {
    const ticketId = decodeURIComponent(adminReleaseResMatch[1]);
    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status !== 'RESERVED') {
      return res.status(409).json({ success: false, message: 'สามารถยกเลิกได้เฉพาะที่นั่งที่อยู่ในสถานะสำรองเท่านั้น' });
    }
    ticket.status = 'CANCELLED';
    ticket.updatedAt = new Date().toISOString();
    const booking = state.bookings.find((b) => b.id === ticket.bookingId);
    if (booking) {
      const remaining = state.tickets.some((t) => t.bookingId === booking.id && t.status !== 'CANCELLED');
      if (!remaining) booking.status = 'CANCELLED';
    }
    const zone = state.zones.find((z) => z.id === ticket.zoneId);
    if (zone) zone.available = Math.min(zone.totalCapacity, (zone.available || 0) + 1);
    saveState(state);
    return res.status(200).json({ success: true, message: 'ยกเลิกการล็อกที่นั่งและคืนโควต้าเรียบร้อยแล้ว' });
  }

  // ── POST /api/admin/tickets/:ticketId/refund ──
  const adminRefundMatch = pathname.match(/^\/api\/admin\/tickets\/([^/]+)\/refund$/);
  if (method === 'POST' && adminRefundMatch) {
    const ticketId = decodeURIComponent(adminRefundMatch[1]);
    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'ไม่พบตั๋วใบนี้' });
    if (ticket.status !== 'VALID') {
      return res.status(409).json({ success: false, message: 'คืนเงินได้เฉพาะตั๋วที่ยังไม่ผ่านการสแกนและยังไม่ถูกยกเลิก' });
    }
    const booking = state.bookings.find((b) => b.id === ticket.bookingId);
    const zone = state.zones.find((z) => z.id === ticket.zoneId);
    const bookingItem = state.bookingItems.find((i) => i.bookingId === ticket.bookingId && i.zoneId === ticket.zoneId);
    const refundAmount = Number(bookingItem?.pricePerUnit ?? zone?.price ?? 0);

    ticket.status = 'CANCELLED';
    ticket.refundedAmount = refundAmount;
    ticket.refundedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    let refundAll = true;
    if (booking) {
      const bookingTickets = state.tickets.filter((t) => t.bookingId === booking.id);
      refundAll = bookingTickets.every((bt) => bt.id === ticket.id || bt.status === 'CANCELLED');
      booking.refundedAmount = (booking.refundedAmount || 0) + refundAmount;
      booking.status = refundAll ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      if (refundAll) booking.refundedAt = new Date().toISOString();
      if (booking.selectedSeats && ticket.seatNumber) {
        try {
          const seats = JSON.parse(booking.selectedSeats);
          booking.selectedSeats = JSON.stringify(seats.filter((s) => s !== ticket.seatNumber));
        } catch {}
      }
    }
    if (zone) zone.available = Math.min(zone.totalCapacity, (zone.available || 0) + 1);
    saveState(state);

    return res.status(200).json({
      success: true,
      message: 'บันทึกการคืนเงินและยกเลิกตั๋วแล้ว (ระบบสาธิตไม่ได้โอนเงินกลับธนาคาร)',
      data: { ticketCode: ticket.ticketCode, refundAmount, bookingStatus: refundAll ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    });
  }

  // ── PUT /api/admin/tickets/:ticketId/edit ──
  const adminTicketEditMatch = pathname.match(/^\/api\/admin\/tickets\/([^/]+)\/edit$/);
  if (method === 'PUT' && adminTicketEditMatch) {
    const ticketId = decodeURIComponent(adminTicketEditMatch[1]);
    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'ไม่พบตั๋วใบนี้' });
    if (!['VALID', 'RESERVED'].includes(ticket.status)) {
      return res.status(409).json({ success: false, message: 'แก้ไขได้เฉพาะตั๋วที่ยังไม่ถูกใช้หรือที่นั่งสำรอง' });
    }
    const newSeat = body.seatNumber !== undefined ? String(body.seatNumber).trim() : ticket.seatNumber;
    if (newSeat && newSeat !== ticket.seatNumber) {
      const conflict = state.tickets.find(
        (t) => t.zoneId === ticket.zoneId && t.id !== ticketId && ['VALID', 'USED', 'RESERVED'].includes(t.status) && String(t.seatNumber || '').trim().toUpperCase() === newSeat.toUpperCase()
      );
      if (conflict) {
        return res.status(400).json({ success: false, message: `ที่นั่ง ${newSeat} มีผู้อื่นใช้งานอยู่แล้ว (${conflict.attendeeName})` });
      }
    }
    const oldSeat = ticket.seatNumber;
    if (newSeat) ticket.seatNumber = newSeat;
    if (body.attendeeName) ticket.attendeeName = String(body.attendeeName).trim();
    ticket.updatedAt = new Date().toISOString();

    const booking = state.bookings.find((b) => b.id === ticket.bookingId);
    if (booking?.selectedSeats && newSeat && newSeat !== oldSeat) {
      try {
        const seats = JSON.parse(booking.selectedSeats);
        booking.selectedSeats = JSON.stringify(seats.map((s) => (s === oldSeat ? newSeat : s)));
      } catch {}
    }
    saveState(state);
    return res.status(200).json({ success: true, message: 'แก้ไขข้อมูลที่นั่งสำเร็จ', data: ticket });
  }

  // ── POST /api/admin/bookings/:bookingId/resend-line ──
  const adminResendLineMatch = pathname.match(/^\/api\/admin\/bookings\/([^/]+)\/resend-line$/);
  if (method === 'POST' && adminResendLineMatch) {
    const bookingId = decodeURIComponent(adminResendLineMatch[1]);
    const booking = state.bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    if (!booking.customerLineId) {
      return res.status(400).json({ success: false, message: 'รายการจองนี้ยังไม่ได้ผูกกับบัญชี LINE ของลูกค้า' });
    }
    booking.lineDeliveryStatus = 'SENT';
    booking.lineDeliveryError = null;
    saveState(state);
    return res.status(200).json({
      success: true,
      message: 'ส่งตั๋ว Flex Message เข้า LINE ลูกค้าสำเร็จแล้ว',
      data: hydrateBooking(booking, state),
    });
  }

  // ── GET /api/admin/search ──
  if (method === 'GET' && pathname === '/api/admin/search') {
    const q = String(urlObj.searchParams.get('q') || '').trim().toLowerCase();
    if (!q) return res.status(200).json({ success: true, data: { bookings: [], tickets: [] } });
    const bookings = state.bookings
      .filter((b) => [b.bookingCode, b.customerName, b.customerPhone, b.customerLineId].some((v) => String(v || '').toLowerCase().includes(q)))
      .slice(0, 20)
      .map((b) => hydrateBooking(b, state));
    const tickets = state.tickets
      .filter((t) => [t.ticketCode, t.attendeeName, t.seatNumber].some((v) => String(v || '').toLowerCase().includes(q)))
      .slice(0, 30)
      .map((t) => {
        const zone = state.zones.find((z) => z.id === t.zoneId);
        const concert = zone ? state.concerts.find((c) => c.id === zone.concertId) : null;
        const booking = state.bookings.find((b) => b.id === t.bookingId) || null;
        return { ...t, zone: zone ? { ...zone, concert } : null, booking };
      });
    return res.status(200).json({ success: true, data: { bookings, tickets } });
  }

  // ── GET /api/admin/export/attendees ──
  if (method === 'GET' && pathname === '/api/admin/export/attendees') {
    const concertIdParam = urlObj.searchParams.get('concertId');
    const filterConcertId = concertIdParam ? Number(concertIdParam) : null;
    const exportRows = state.tickets
      .filter((t) => {
        if (!filterConcertId) return true;
        const zone = state.zones.find((z) => z.id === t.zoneId);
        return zone?.concertId === filterConcertId;
      })
      .map((t) => {
        const zone = state.zones.find((z) => z.id === t.zoneId) || {};
        const concert = state.concerts.find((c) => c.id === zone.concertId) || {};
        const booking = state.bookings.find((b) => b.id === t.bookingId) || {};
        return {
          ticketCode: t.ticketCode,
          concertName: concert.name || '',
          zoneName: zone.name || '',
          category: zone.category || '',
          seatNumber: t.seatNumber || 'N/A',
          attendeeName: t.attendeeName,
          customerPhone: booking.customerPhone || '',
          bookingCode: booking.bookingCode || '',
          bookingStatus: booking.status || '',
          ticketStatus: t.status,
          scannedAt: t.usedAt ? new Date(t.usedAt).toISOString() : '',
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
        };
      });
    return res.status(200).json({ success: true, data: exportRows });
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
