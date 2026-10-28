import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Printer, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Sparkles, User, Armchair } from 'lucide-react';

export default function MyTicketPage() {
  const { ticketCode } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-xs">
        กำลังโหลดข้อมูลบัตรคอนเสิร์ต...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <XCircle className="w-10 h-10 text-pink-400 mb-2" />
        <h2 className="text-base font-bold text-white">ไม่พบตั๋วใบนี้ในระบบ</h2>
        <Link to="/" className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-xs text-white">
          กลับสู่หน้าแรก
        </Link>
      </div>
    );
  }

  const isValid = ticket.status === 'VALID';

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 rounded-lg hover:bg-white/5 px-2 py-1 -ml-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> ย้อนกลับ
        </button>
        <Link
          to={`/tickets/${ticket.ticketCode}/print`}
          className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-gray-200 transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          พิมพ์บัตร A4 ที่ระลึก
        </Link>
      </div>

      {/* ── GORGEOUS CONCERT TICKET PASS ──────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-[#12121a] border border-white/15 shadow-2xl">
        
        {/* Ticket Header Banner */}
        <div className="relative h-36 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
            alt="Concert"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/60 to-transparent" />
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/20 text-cyan-300">
              ⚡ SoundWave Official Pass
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              isValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
            }`}>
              {isValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {isValid ? 'VALID' : 'USED'}
            </span>
          </div>
        </div>

        {/* Ticket Info Section */}
        <div className="p-6 text-center -mt-6 relative z-10">
          <h1 className="text-xl font-black text-white leading-tight">
            {ticket.concert.name}
          </h1>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-300 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {new Date(ticket.concert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              {ticket.concert.location}
            </span>
          </div>

          {/* Attendee & Zone Badge Grid */}
          <div className="grid grid-cols-2 gap-2 my-5 text-left text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase">
                <User className="w-3 h-3" /> ผู้ถือบัตร
              </span>
              <p className="font-bold text-white mt-0.5 truncate">{ticket.attendeeName}</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase">
                <Armchair className="w-3 h-3" /> โซน / ที่นั่ง
              </span>
              <p className="font-bold text-cyan-300 mt-0.5 truncate">
                {ticket.zone.name}
                {ticket.seatNumber && <span className="text-white ml-1">({ticket.seatNumber})</span>}
              </p>
            </div>
          </div>

          {/* QR Code Container with Scan Framing */}
          <div className="my-5 flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-white shadow-xl inline-block">
              <QRCodeSVG
                value={ticket.ticketCode}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="font-mono font-bold text-xs text-white tracking-widest mt-3">
              {ticket.ticketCode}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              แสดง QR Code นี้ที่ประตูทางเข้างานเพื่อตัดสิทธิ์
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-white/10 flex gap-2">
            <Link
              to={`/tickets/${ticket.ticketCode}/print`}
              className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> พิมพ์บัตร A4 ที่ระลึก
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
