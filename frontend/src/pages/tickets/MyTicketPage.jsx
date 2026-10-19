import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Printer, ShieldCheck, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function MyTicketPage() {
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400">
        กำลังโหลดบัตรคอนเสิร์ต...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <XCircle className="w-12 h-12 text-[#ff007f] mb-2" />
        <h2 className="text-xl font-bold text-white">ไม่พบตั๋วใบนี้ในระบบ</h2>
        <Link to="/" className="mt-4 px-4 py-2 rounded-lg bg-[#181827] text-[#00f0ff] text-sm">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  const isValid = ticket.status === 'VALID';

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าแรก
        </Link>
        <Link
          to={`/tickets/${ticket.ticketCode}/print`}
          className="px-4 py-2 rounded-xl bg-[#ffe600] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,230,0,0.3)] hover:scale-105 transition-transform"
        >
          <Printer className="w-4 h-4" />
          พิมพ์ตั๋วที่ระลึก A4
        </Link>
      </div>

      {/* Digital Neon Ticket Pass */}
      <div className={`relative bg-[#0d0d17] border-2 rounded-3xl overflow-hidden shadow-2xl transition-all ${
        isValid ? 'border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.25)]' : 'border-[#ff007f]/50 opacity-90'
      }`}>
        {/* Top Header Glow */}
        <div className="p-6 bg-gradient-to-r from-[#171728] via-[#1f162e] to-[#171728] border-b border-[#24243b]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-[#00f0ff] uppercase">
              ⚡ SOUNDWAVE OFFICIAL PASS
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
              isValid ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/50' : 'bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/50'
            }`}>
              {isValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {isValid ? 'VALID PASS' : 'ALREADY USED'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-white mt-2 leading-tight">
            {ticket.concert.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#ff007f]" />
              {new Date(ticket.concert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#00f0ff]" />
              {ticket.concert.location}
            </span>
          </div>
        </div>

        {/* Ticket Details & QR */}
        <div className="p-6 sm:p-8 text-center">
          {/* QR Code Container */}
          <div className="bg-white p-5 rounded-2xl inline-block shadow-lg mx-auto">
            <QRCodeSVG
              value={ticket.ticketCode}
              size={180}
              level="H"
            />
          </div>

          <div className="mt-4">
            <span className="text-[11px] text-gray-500 uppercase tracking-widest font-mono block">
              TICKET CODE
            </span>
            <span className="text-xl font-black text-white font-mono tracking-wider">
              {ticket.ticketCode}
            </span>
          </div>

          {/* Attendee Info Card */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="bg-[#141424] p-3 rounded-xl border border-[#232338]">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">ชื่อผู้ถือบัตร</span>
              <p className="text-white font-bold text-sm mt-0.5 truncate">{ticket.attendeeName}</p>
            </div>
            <div className="bg-[#141424] p-3 rounded-xl border border-[#232338]">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">โซนเข้างาน</span>
              <p className="font-bold text-sm mt-0.5" style={{ color: ticket.zone.colorCode || '#00f0ff' }}>
                {ticket.zone.name}
              </p>
            </div>
          </div>

          {ticket.seatNumber && (
            <div className="mt-3 bg-[#141424] p-3 rounded-xl border border-[#232338] text-center">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">ที่นั่งระบุ (Seat Number)</span>
              <p className="text-[#ffe600] font-black text-base mt-0.5 font-mono">{ticket.seatNumber}</p>
            </div>
          )}

          <p className="text-[11px] text-gray-500 mt-6">
            * กรุณาแสดง QR Code นี้ให้เจ้าหน้าที่สแกนที่ประตูทางเข้างาน SoundWave Festival
          </p>
        </div>
      </div>
    </div>
  );
}
