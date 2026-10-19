import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Scissors, ArrowLeft, Disc, Calendar, MapPin } from 'lucide-react';

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
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400">
        กำลังจัดเตรียมแบบพิมพ์ A4...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-white">ไม่พบข้อมูลตั๋ว</h2>
        <Link to="/" className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg">กลับหน้าแรก</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111119] text-gray-200 py-8 px-4">
      {/* On-screen control bar (Hidden during print) */}
      <div className="no-print max-w-4xl mx-auto mb-8 bg-[#1a1a27] border border-[#2b2b40] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            to={`/tickets/${ticket.ticketCode}`}
            className="p-2 rounded-xl bg-[#262638] hover:bg-[#35354e] text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white">ระบบพิมพ์บัตรที่ระลึก (A4 Souvenir Ticket)</h1>
            <p className="text-xs text-gray-400">
              ขนาดพอดีกระดาษ A4 มาตรฐาน พร้อมเส้นประสำหรับตัดเก็บสะสม
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#ff007f] text-black font-black text-sm uppercase flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          สั่งพิมพ์ทันที (Print A4)
        </button>
      </div>

      {/* The Printable A4 Area */}
      <div
        id="souvenir-print-area"
        className="max-w-[800px] mx-auto bg-white text-black p-6 sm:p-10 rounded-2xl shadow-2xl border border-gray-300 print:border-none print:shadow-none print:p-4"
      >
        {/* Header note with scissors guide */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-gray-400 pb-2 mb-6 text-gray-500 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Scissors className="w-4 h-4" />
            <span>CUT ALONG THE DASHED LINE / ตัดตามรอยประ</span>
          </div>
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            SoundWave Festival Souvenir Ticket Series 2026
          </span>
        </div>

        {/* ================= LONG STRIP SOUVENIR TICKET ================= */}
        <div className="relative border-4 border-black rounded-2xl overflow-hidden bg-[#0a0a10] text-white shadow-xl flex flex-col md:flex-row">
          
          {/* Main Ticket Body (Left 75%) */}
          <div className="flex-1 p-6 border-b-4 md:border-b-0 md:border-r-4 border-dashed border-gray-500 relative">
            {/* Scissor icon at separator */}
            <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-white items-center justify-center text-white z-10">
              <Scissors className="w-3.5 h-3.5 text-gray-300" />
            </div>

            {/* Top Brand & Hologram Simulation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-widest text-[#00f0ff]">
                  SOUNDWAVE<span className="text-[#ff007f] ml-1">PASS</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
                  OFFICIAL ADMISSION
                </span>
              </div>

              {/* Fake Hologram Sticker */}
              <div className="px-2.5 py-1 rounded bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-black text-[9px] font-black uppercase tracking-widest shadow-inner">
                HOLOGRAM SEAL
              </div>
            </div>

            {/* Concert Title */}
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white mt-4 tracking-tight">
              {ticket.concert.name}
            </h2>

            {/* Date & Location */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-300 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#ff007f]" />
                {new Date(ticket.concert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#00f0ff]" />
                {ticket.concert.location}
              </span>
            </div>

            {/* Zone & Attendee Bar */}
            <div className="mt-6 grid grid-cols-3 gap-3 bg-[#161624] p-3 rounded-xl border border-gray-700">
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">ZONE</span>
                <span className="text-xs sm:text-sm font-black text-[#00f0ff] uppercase block truncate">
                  {ticket.zone.name}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">ATTENDEE</span>
                <span className="text-xs sm:text-sm font-bold text-white block truncate">
                  {ticket.attendeeName}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">SEAT / ENTRY</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-[#ffe600] block">
                  {ticket.seatNumber || 'STANDING GENERAL'}
                </span>
              </div>
            </div>

            {/* Barcode Strip */}
            <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-3">
              <div className="font-mono text-xs text-gray-400">
                <span>REF: {ticket.ticketCode}</span>
              </div>
              {/* Simulated Barcode lines */}
              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded">
                <div className="h-6 w-1 bg-black"></div>
                <div className="h-6 w-2 bg-black"></div>
                <div className="h-6 w-0.5 bg-black"></div>
                <div className="h-6 w-1.5 bg-black"></div>
                <div className="h-6 w-1 bg-black"></div>
                <div className="h-6 w-2.5 bg-black"></div>
                <div className="h-6 w-0.5 bg-black"></div>
                <div className="h-6 w-2 bg-black"></div>
                <div className="h-6 w-1 bg-black"></div>
              </div>
            </div>
          </div>

          {/* Ticket Stub (Right 25% - For tearing at gate) */}
          <div className="w-full md:w-56 p-6 bg-[#0f0f18] flex flex-col justify-between items-center text-center">
            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-gray-400 block">
                GATE STUB / ส่วนหางบัตร
              </span>
              <span className="text-xs font-bold text-[#ff007f] uppercase block mt-1">
                {ticket.zone.name}
              </span>
            </div>

            {/* QR Code */}
            <div className="bg-white p-2.5 rounded-xl my-4">
              <QRCodeSVG
                value={ticket.ticketCode}
                size={110}
                level="M"
              />
            </div>

            <div>
              <span className="text-[10px] font-mono text-gray-400 block">{ticket.ticketCode}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">SCAN FOR ENTRY</span>
            </div>
          </div>
        </div>
        {/* ================= END SOUVENIR TICKET ================= */}

        {/* Bottom dashed line */}
        <div className="flex items-center justify-between border-t-2 border-dashed border-gray-400 pt-2 mt-6 text-gray-500 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Scissors className="w-4 h-4" />
            <span>CUT ALONG THE DASHED LINE / ตัดตามรอยประ</span>
          </div>
          <span className="font-mono text-[10px]">VERIFIED SOUNDWAVE ISSUER</span>
        </div>

        {/* Instructions on printed paper */}
        <div className="mt-8 text-center text-xs text-gray-500 font-sans print:block">
          <p className="font-bold text-gray-700">คำแนะนำในการใช้งานบัตรที่ระลึก:</p>
          <p className="mt-1">
            ใช้กรรไกรตัดตามรอยเส้นประด้านบนและด้านล่าง ท่านสามารถนำบัตรคอนเสิร์ตทรงยาวนี้ไปเคลือบพลาสติกหรือใส่กรอบเก็บสะสมได้
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            QR Code บนหางบัตรสามารถใช้สแกนเข้าประตูหน้างานได้เช่นเดียวกับบัตรดิจิทัล
          </p>
        </div>
      </div>
    </div>
  );
}
