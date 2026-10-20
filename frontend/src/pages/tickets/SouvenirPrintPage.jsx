import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Scissors, ArrowLeft, Calendar, MapPin, Sparkles, User, Armchair, ShieldCheck } from 'lucide-react';

export default function SouvenirPrintPage() {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${ticketCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTicket(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [ticketCode]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-xs">
        กำลังจัดเตรียมแบบพิมพ์ A4 บัตรที่ระลึก...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-sm font-bold text-white">ไม่พบข้อมูลตั๋ว</h2>
        <Link to="/" className="mt-3 px-4 py-2 bg-white/10 text-white rounded-xl text-xs">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090f] text-gray-200 py-8 px-4">
      
      {/* On-screen control bar (Hidden during printing) */}
      <div className="no-print max-w-4xl mx-auto mb-6 bg-[#14141e] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            to={`/tickets/${ticket.ticketCode}`}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-bold text-white">พิมพ์บัตรที่ระลึกคอนเสิร์ต (A4 Souvenir Ticket)</h1>
            <p className="text-[11px] text-gray-400">
              กระดาษ A4 แนวนอน พร้อมรูปศิลปินและเส้นประสำหรับตัดเก็บสะสม
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer shadow-md"
        >
          <Printer className="w-4 h-4" />
          สั่งพิมพ์ทันที (Print A4)
        </button>
      </div>

      {/* ── PRINTABLE A4 CANVAS ────────────────────────────────────────── */}
      <div
        id="souvenir-print-area"
        className="max-w-[850px] mx-auto bg-white text-black p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Cut guide header */}
        <div className="flex items-center justify-between border-b border-dashed border-gray-400 pb-2 mb-4 text-gray-500 text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5" />
            CUT ALONG THE DASHED LINE / ตัดตามรอยประเพื่อเก็บสะสมเป็นที่ระลึก
          </span>
          <span className="uppercase tracking-wider text-[10px]">
            SoundWave Festival Official Collectible Pass 2026
          </span>
        </div>

        {/* ── SOUVENIR TICKET PASS (WITH REAL ARTIST PHOTO) ─────────── */}
        <div className="relative border-2 border-black rounded-2xl overflow-hidden bg-[#0c0c14] text-white flex flex-col md:flex-row shadow-lg">
          
          {/* Main Ticket Body (Left 70%) */}
          <div className="flex-1 p-6 border-b-2 md:border-b-0 md:border-r-2 border-dashed border-gray-600 relative">
            
            {/* Top Bar: Festival Logo & Hologram */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black tracking-widest text-cyan-400 uppercase">
                ⚡ SOUNDWAVE PASS
              </span>
              <span className="px-2.5 py-0.5 rounded bg-white/10 text-gray-200 text-[9px] font-mono tracking-widest uppercase border border-white/20">
                OFFICIAL COMMEMORATIVE TICKET
              </span>
            </div>

            {/* ARTIST HERO PHOTO BANNER */}
            <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80"
                alt="Featured Artist"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                    HEADLINER LIVE SHOW
                  </span>
                  <p className="text-xl font-black text-white leading-tight">
                    SLOT MACHINE · TAITOSMITH · THREE MAN DOWN
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-white font-mono shrink-0">
                  LIVE CONCERT
                </span>
              </div>
            </div>

            {/* Concert Details */}
            <h2 className="text-lg font-black uppercase text-white tracking-tight">
              {ticket.concert.name}
            </h2>

            <div className="flex flex-wrap gap-4 text-xs text-gray-300 mt-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {new Date(ticket.concert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                {ticket.concert.location}
              </span>
            </div>

            {/* Zone & Attendee Details Box */}
            <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">ZONE</span>
                <span className="font-bold text-cyan-300 truncate block">{ticket.zone.name}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">ATTENDEE</span>
                <span className="font-bold text-white truncate block">{ticket.attendeeName}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">SEAT / ENTRY</span>
                <span className="font-bold text-amber-300 font-mono block">{ticket.seatNumber || 'STANDING PIT'}</span>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="font-mono text-[10px] text-gray-400">
                TICKET CODE: <strong className="text-white font-bold">{ticket.ticketCode}</strong>
              </div>
              {/* Fake visual barcode stripes */}
              <div className="flex items-center gap-[2px] h-6 bg-white px-2 py-0.5 rounded">
                {[2, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3].map((w, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>

          </div>

          {/* Tear-off Ticket Stub (Right 30%) */}
          <div className="w-full md:w-56 p-6 flex flex-col items-center justify-between text-center bg-[#07070b]">
            <div className="w-full">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-mono block mb-1">
                ADMIT ONE · เข้างาน 1 ท่าน
              </span>
              <p className="font-mono font-bold text-cyan-300 text-xs truncate">
                {ticket.zone.name}
              </p>
              {ticket.seatNumber && (
                <p className="text-[11px] font-mono text-white font-bold mt-0.5">
                  ที่นั่ง {ticket.seatNumber}
                </p>
              )}
            </div>

            {/* Official QR Code */}
            <div className="p-3 bg-white rounded-xl my-4">
              <QRCodeSVG
                value={ticket.ticketCode}
                size={110}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="w-full text-center">
              <p className="font-mono font-bold text-xs text-white tracking-wider">
                {ticket.ticketCode}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                สแกนผ่าน Gate Scanner
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
