import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Scissors, ArrowLeft, Calendar, MapPin, User } from 'lucide-react';

// ─── Barcode visual (CSS bars, no external lib needed) ───────────────────────
function BarcodeStrips({ value = '' }) {
  // Deterministic bar widths from ticket code characters
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = Array.from({ length: 40 }, (_, i) => {
    const w = ((seed * (i + 7) * 13) % 3) + 1; // 1-3px
    return w;
  });
  return (
    <div className="flex h-8 items-stretch gap-[1.5px] px-1">
      {bars.map((w, i) => (
        <div
          key={i}
          style={{ width: `${w}px`, minWidth: `${w}px` }}
          className="bg-black h-full"
        />
      ))}
    </div>
  );
}

export default function SouvenirPrintPage() {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${ticketCode}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTicket(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticketCode]);

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-xs">
      กำลังจัดเตรียมแบบพิมพ์ A4...
    </div>
  );

  if (!ticket) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-white font-bold text-sm">ไม่พบข้อมูลตั๋ว</p>
      <Link to="/" className="mt-3 px-4 py-2 bg-white/10 text-white rounded-xl text-xs">กลับหน้าแรก</Link>
    </div>
  );

  const eventDateFormatted = new Date(ticket.concert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'long' });
  const paidAtFormatted = ticket.booking?.paidAt
    ? new Date(ticket.booking.paidAt).toLocaleDateString('th-TH', { dateStyle: 'short' })
    : '—';
  const artists = (Array.isArray(ticket.concert.lineup) ? ticket.concert.lineup : [])
    .flatMap((stage) => typeof stage === 'string' ? [{ name: stage }] : (stage.bands || stage.artists || (stage.name ? [stage] : [])))
    .filter((artist) => artist?.name);
  const artistNames = artists.slice(0, 4).map((artist) => artist.name).join(' · ');

  return (
    <div className="min-h-screen bg-[#09090f] py-8 px-4">

      {/* ─── Control Bar (Hidden on print) ─────────────────────────── */}
      <div className="no-print max-w-5xl mx-auto mb-6 bg-[#14141e] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/tickets/${ticket.ticketCode}`}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-bold text-white">A4 Souvenir Ticket — บัตรที่ระลึกคอนเสิร์ต</h1>
            <p className="text-[10px] text-gray-400">
              กระดาษ A4 แนวนอน · พร้อมเส้นปรุ บาร์โค้ด และ QR Code · กดปุ่มพิมพ์หรือ <kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300">Ctrl+P</kbd>
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer shadow"
        >
          <Printer className="w-4 h-4" />
          พิมพ์บัตรทันที
        </button>
      </div>

      {/* ─── Preview wrapper (on-screen white A4-ish card) ─────────── */}
      <div className="no-print max-w-5xl mx-auto mb-3 text-center">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          ตัวอย่างการพิมพ์ (Preview) — จะพิมพ์บนกระดาษ A4 แนวนอน
        </span>
      </div>

      {/* ─── PRINTABLE AREA ─────────────────────────────────────────── */}
      <div
        id="souvenir-print-area"
        className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", width: 'min(100%, 220mm)' }}
      >
        {/* ── Cut Guide Row ── */}
        <div className="flex items-center justify-between px-6 py-2 bg-white border-b-2 border-dashed border-gray-300">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase tracking-wider">
            <Scissors className="w-3 h-3 text-gray-400" />
            Cut along the dashed line / ตัดตามรอยประ
          </span>
          <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">
            SoundWave Festival 2026 · Official Collectible Series
          </span>
        </div>

        {/* ─── TICKET BODY ─────────────────────────────────────────── */}
        <div className="ticket-a4-wrap flex" style={{ minHeight: '82mm' }}>

          {/* ═══ LEFT MAIN TICKET (75%) ════════════════════════════ */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #13102a 60%, #0d1a14 100%)' }}
          >
            {/* Background artist photo */}
            <div className="absolute inset-0">
              <img
                src={ticket.concert.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80'}
                alt=""
                className="w-full h-full object-cover"
                style={{ opacity: 0.18 }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(13,10,35,0.85) 50%, rgba(10,20,12,0.95) 100%)' }} />
            </div>

            {/* Top neon accent line */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #00f0ff, #ff007f, #ffe600, #39ff14)' }} />

            <div className="ticket-main-content relative z-10 flex h-full flex-col p-3">
              {/* Header Row */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black tracking-[4px] uppercase text-cyan-400">⚡ SOUNDWAVE</span>
                    <span className="text-[10px] font-black tracking-[3px] uppercase text-pink-400">PASS</span>
                  </div>
                  <p className="text-[9px] text-gray-400 tracking-widest uppercase font-mono">OFFICIAL COMMEMORATIVE TICKET · 2026</p>
                </div>
                <div className="text-right">
                  <div
                    className="px-3 py-1 rounded text-[9px] font-black tracking-widest uppercase"
                    style={{ background: 'linear-gradient(90deg,#c084fc,#38bdf8,#34d399)', color: '#000' }}
                  >
                    HOLOGRAM SEAL ✦
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1 font-mono">#{ticket.ticketCode}</p>
                </div>
              </div>

              <div className="ticket-feature relative mb-3 flex items-end overflow-hidden rounded-xl border border-white/15 p-3" style={{ minHeight: '27mm', background: `linear-gradient(125deg,rgba(6,15,30,.28),rgba(7,9,18,.94)), url('${ticket.concert.bannerUrl || ''}') center 42% / cover, linear-gradient(120deg,#123343,#29163b 58%,#10281f)` }}>
                <div className="absolute right-5 top-4 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[8px] font-bold uppercase tracking-[.22em] text-cyan-100">Live · Thailand</div>
                <div className="relative max-w-[82%]">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200">On stage</p>
                  <p className="text-2xl font-black leading-tight text-white">{ticket.concert.name}</p>
                  <p className="mt-2 text-xs font-semibold text-gray-200">{artistNames || 'A night to remember'}</p>
                </div>
              </div>

              {/* Concert Title & Info */}
              <div className="mb-4">
                <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                  {ticket.concert.name}
                </h2>
                <div className="flex flex-wrap gap-5 mt-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {eventDateFormatted}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                    {ticket.concert.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    {ticket.attendeeName}
                  </span>
                </div>
              </div>

              {/* Zone & Seat Detail Grid */}
              <div
                className="grid grid-cols-4 gap-2 rounded-xl p-2.5 mb-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {[
                  { label: 'ZONE', value: ticket.zone.name, color: '#00f0ff' },
                  { label: 'CATEGORY', value: ticket.zone.category, color: '#a78bfa' },
                  { label: 'SEAT / ENTRY', value: ticket.seatNumber || 'STANDING PIT', color: '#fbbf24' },
                  { label: 'PRICE PAID', value: `฿${ticket.zone.price?.toLocaleString()}`, color: '#34d399' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-[8px] text-gray-400 uppercase font-mono tracking-wider">{label}</p>
                    <p className="text-xs font-black mt-0.5 truncate" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Barcode Row */}
              <div className="mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest mb-1">BARCODE / TICKET IDENTIFIER</p>
                    <div className="bg-white rounded p-1 inline-block">
                      <BarcodeStrips value={ticket.ticketCode} />
                    </div>
                    <p className="text-[8px] font-mono text-gray-400 mt-1 tracking-wider">{ticket.ticketCode}</p>
                  </div>
                  <div className="text-right text-[9px] text-gray-500 font-mono">
                    <p>Booking: {ticket.booking?.bookingCode}</p>
                    <p>Issued: {paidAtFormatted}</p>
                    <p>Valid for: 1 ADMISSION</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ─── Perforated separator ─────────────────────────────── */}
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ width: '24px', background: 'white' }}
          >
            {/* Semicircle cutouts top and bottom */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 bg-white rounded-b-full z-10"
            />
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 bg-white rounded-t-full z-10"
            />
            {/* Dashed vertical line */}
            <div className="h-full flex flex-col items-center">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-[1.5px] h-3 mb-1" style={{ background: '#ccc' }} />
              ))}
            </div>
            {/* Scissors icon in the middle */}
            <div className="absolute bg-white p-0.5 rounded-full" style={{ top: '50%', transform: 'translateY(-50%) rotate(90deg)' }}>
              <Scissors className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* ═══ RIGHT STUB (25%) ══════════════════════════════════ */}
          <div
            className="relative flex flex-col items-center justify-between overflow-hidden p-4"
            style={{
              width: '56mm',
              minWidth: '56mm',
              background: 'linear-gradient(160deg, #101d2d 0%, #1b1028 100%)',
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg,#ff007f,#ffe600)' }} />

            <div className="text-center w-full">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-mono mb-2">
                ADMIT ONE / เข้างาน 1 ท่าน
              </p>
              <p className="text-sm font-black text-cyan-300 leading-tight text-center">
                {ticket.zone.name}
              </p>
              {ticket.seatNumber && (
                <p className="text-xs font-mono font-bold text-amber-300 mt-1">
                  ที่นั่ง: {ticket.seatNumber}
                </p>
              )}
              <p className="text-[10px] text-gray-400 font-semibold mt-1">
                {ticket.attendeeName}
              </p>
            </div>

            {/* QR Code */}
            <div className="my-3">
                <div className="rounded-lg bg-white p-2 shadow-md">
                <QRCodeSVG
                  value={ticket.ticketCode}
                  size={88}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="text-center w-full">
              <p className="font-mono font-bold text-white text-[10px] tracking-wider">
                {ticket.ticketCode}
              </p>
              <p className="text-[9px] text-gray-500 mt-0.5">
                สแกนที่ประตูเข้างาน
              </p>
              <div
                className="mt-2 text-[9px] font-black tracking-widest px-2 py-1 rounded uppercase"
                style={{ background: 'linear-gradient(90deg,#00f0ff,#ff007f)', color: '#000' }}
              >
                OFFICIAL PASS
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom cut guide ── */}
        <div
          className="flex items-center justify-center py-1.5 bg-white"
          style={{ borderTop: '1.5px dashed #ccc' }}
        >
          <span className="text-[9px] text-gray-300 font-mono uppercase tracking-widest flex items-center gap-1">
            <Scissors className="w-3 h-3 text-gray-300" />
            ตัดตามรอยประเพื่อแยกก้านตั๋ว (Tear-off Stub) ออกจากบัตรหลัก
          </span>
        </div>

      </div>
      {/* End #souvenir-print-area */}

    </div>
  );
}
