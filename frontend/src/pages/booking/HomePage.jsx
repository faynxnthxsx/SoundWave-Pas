import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Music, Sparkles, Flame, Clock, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/concerts')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConcerts(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load concerts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 font-medium">กำลังโหลดข้อมูลเทศกาลดนตรี...</p>
      </div>
    );
  }

  const concert = concerts[0]; // Featured concert

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#101020] via-[#090912] to-[#07070b] border-b border-[#222238] py-16 lg:py-24 px-4">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#ff007f]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" />
            Outdoor Music & Rock Festival 2026
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-none">
            {concert?.name || 'SOUNDWAVE MUSIC FESTIVAL 2026'}
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-gray-300 text-sm sm:text-base leading-relaxed">
            {concert?.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-sm text-gray-300 font-medium">
            <div className="flex items-center gap-2 bg-[#161622] px-4 py-2 rounded-xl border border-[#2a2a3e]">
              <Calendar className="w-4 h-4 text-[#ff007f]" />
              <span>28 - 29 พฤศจิกายน 2026</span>
            </div>
            <div className="flex items-center gap-2 bg-[#161622] px-4 py-2 rounded-xl border border-[#2a2a3e]">
              <MapPin className="w-4 h-4 text-[#00f0ff]" />
              <span>{concert?.location}</span>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/booking/zone-select"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#ff007f] text-black font-extrabold text-base tracking-wide uppercase hover:scale-105 transition-all shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center gap-2"
            >
              <span>จองบัตรคอนเสิร์ตเลย</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Lineup Section */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[#ff007f] font-bold text-sm uppercase tracking-widest">
            <Flame className="w-4 h-4" /> Lineup & Timetable
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
            ทัพศิลปินร็อก & อินดี้ 3 เวทีเต็มพิกัด
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {concert?.lineup?.map((stage, idx) => (
            <div
              key={idx}
              className="bg-[#12121c] border border-[#232336] rounded-2xl p-6 hover:border-[#00f0ff]/50 transition-all group"
            >
              <div className="border-b border-[#232336] pb-4 mb-4">
                <span className="text-xs uppercase font-bold tracking-widest text-gray-400">STAGE {idx + 1}</span>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00f0ff] transition-colors mt-0.5">
                  {stage.stage}
                </h3>
              </div>

              <div className="space-y-4">
                {stage.bands.map((band, bIdx) => (
                  <div key={bIdx} className="flex items-center justify-between bg-[#191926] p-3 rounded-xl border border-[#26263b]">
                    <div>
                      <h4 className="text-white font-bold text-sm">{band.name}</h4>
                      <span className="text-xs text-[#ff007f] font-medium">{band.genre}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{band.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Zones CTA Preview */}
      <div className="max-w-6xl mx-auto px-4 mt-20">
        <div className="bg-gradient-to-r from-[#141422] to-[#1c1226] border border-[#2f2f45] rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-[#39ff14] text-xs font-bold tracking-widest uppercase">บัตรมีจำนวนจำกัด</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                พร้อมสัมผัสประสบการณ์เสียงดนตรีสดแล้วหรือยัง?
              </h3>
              <p className="text-gray-400 text-sm mt-2 max-w-xl">
                เลือกโซนบัตรยืนติดขอบเวที Pit A, โซนดนตรี Pit B, อัฒจันทร์ Seated VIP หรือโซนกางเต็นท์ Camping 2 วันเต็ม
              </p>
            </div>
            <Link
              to="/booking/zone-select"
              className="whitespace-nowrap px-8 py-4 rounded-xl bg-[#00f0ff] text-black font-extrabold uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              เลือกโซนและที่นั่ง ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
