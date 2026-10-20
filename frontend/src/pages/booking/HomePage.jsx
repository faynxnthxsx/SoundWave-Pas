import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Music2, Sparkles, Flame, Clock, ArrowRight, ChevronLeft, ChevronRight, Zap, Star, Users } from 'lucide-react';

// ─── Artist data with placeholder avatar colors ──────────────────────────────
const ARTISTS = [
  { name: 'Slot Machine',      genre: 'Rock',            stage: 'Main Stage', time: '22:30', color: '#00f0ff', emoji: '🎸' },
  { name: 'Taitosmith',        genre: 'Rock / Indie',    stage: 'Main Stage', time: '20:45', color: '#ff007f', emoji: '🎤' },
  { name: 'Three Man Down',    genre: 'Pop-Rock',        stage: 'Cyber Stage', time: '21:30', color: '#ffe600', emoji: '🥁' },
  { name: 'Tilly Birds',       genre: 'Alternative',     stage: 'Cyber Stage', time: '20:00', color: '#39ff14', emoji: '🎵' },
  { name: 'Anatomy Rabbit',    genre: 'Dream Pop',       stage: 'Tent Stage', time: '21:00', color: '#bf5fff', emoji: '🎹' },
  { name: 'Bomb at Track',     genre: 'Nu-Metal',        stage: 'Main Stage', time: '19:15', color: '#ff6b00', emoji: '🤘' },
  { name: 'Safeplanet',        genre: 'Indie Pop',       stage: 'Cyber Stage', time: '18:30', color: '#00f0ff', emoji: '🌟' },
  { name: 'Solitude is Bliss', genre: 'Indie Rock',      stage: 'Tent Stage', time: '19:30', color: '#ff007f', emoji: '🎸' },
];

const SCHEDULE = [
  { time: '14:00', label: 'ประตูเปิด & เช็กอินแคมปิ้ง', icon: '🚪' },
  { time: '16:00', label: 'โซนอาหาร Street Food เปิด', icon: '🍜' },
  { time: '17:00', label: 'เริ่มการแสดงดนตรีทั้ง 3 เวที', icon: '🎸' },
  { time: '20:00', label: 'Neon Lights & Pyro Show สุดอลัง', icon: '🎆' },
  { time: '22:30', label: 'Headliner — Slot Machine ปิดฉาก!', icon: '⚡' },
  { time: '24:00', label: 'After Party DJ Set โซน Camping', icon: '🎧' },
];

export default function HomePage() {
  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState(0);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    fetch('/api/concerts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) setConcert(data.data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate featured artist
  useEffect(() => {
    const t = setInterval(() => setFeaturedIdx(i => (i + 1) % ARTISTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const lineup = concert?.lineup || [];
  const stages = lineup.length > 0 ? lineup : [
    { stage: '🎸 Main Neon Stage', bands: ARTISTS.slice(0, 3).map(a => ({ name: a.name, genre: a.genre, time: a.time })) },
    { stage: '⚡ Cyber Valley Stage', bands: ARTISTS.slice(3, 6).map(a => ({ name: a.name, genre: a.genre, time: a.time })) },
    { stage: '⛺ Underground Tent Stage', bands: ARTISTS.slice(6).map(a => ({ name: a.name, genre: a.genre, time: a.time })) },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-[#00f0ff]/30 border-t-[#00f0ff] animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">กำลังโหลดเทศกาล...</p>
      </div>
    </div>
  );

  const featured = ARTISTS[featuredIdx];

  return (
    <div className="pb-20 overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Full-screen concert vibe with parallax neon
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">

        {/* Background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80)`,
            transform: `translateY(${scrollY * 0.3}px)`,
            filter: 'brightness(0.3)',
          }}
        />

        {/* Neon blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00f0ff]/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ff007f]/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#ffe600]/8 rounded-full blur-[100px]" />
        </div>

        {/* Scan-line effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/15 text-[#00f0ff] text-xs font-bold uppercase tracking-[3px] mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Rock · Indie · Outdoor · 2026
          </div>

          {/* Logo wordmark — styled like Figma */}
          <div className="mb-6">
            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-tight leading-none uppercase">
              <span
                className="block text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg,#00f0ff 0%,#ffffff 40%,#ff007f 100%)' }}
              >
                SOUND
              </span>
              <span
                className="block text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg,#ff007f 0%,#ffffff 50%,#ffe600 100%)',
                  WebkitTextStroke: '1px rgba(255,255,255,0.1)',
                }}
              >
                WAVE
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#00f0ff]/60" />
              <span className="text-xs font-black uppercase tracking-[6px] text-[#ffe600] px-3 py-1 border border-[#ffe600]/40 rounded bg-[#ffe600]/5">
                PASS 2026
              </span>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#ff007f]/60" />
            </div>
          </div>

          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {concert?.description || 'เทศกาลดนตรีร็อกและอินดี้เอาต์ดอร์ที่ยิ่งใหญ่ที่สุด 3 เวที 15 ศิลปิน แสงสีนีออนเต็มพิกัด'}
          </p>

          {/* Event info pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium">
              <Calendar className="w-4 h-4 text-[#ff007f]" />
              28 – 29 พฤศจิกายน 2026
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium">
              <MapPin className="w-4 h-4 text-[#00f0ff]" />
              {concert?.location || 'Oasis Outdoor Arena, สวนผึ้ง ราชบุรี'}
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium">
              <Users className="w-4 h-4 text-[#39ff14]" />
              3 เวที · 15 ศิลปิน
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link
              to="/booking/zone-select"
              className="group px-8 py-4 rounded-2xl font-extrabold text-black text-base uppercase tracking-wider flex items-center gap-2.5 transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg,#00f0ff,#ff007f)',
                boxShadow: '0 0 40px rgba(0,240,255,0.4), 0 0 80px rgba(255,0,127,0.2)',
              }}
            >
              <Zap className="w-5 h-5" />
              จองบัตรคอนเสิร์ตเลย!
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#lineup"
              className="px-8 py-4 rounded-2xl font-bold text-white text-base uppercase tracking-wider border border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 transition-all"
            >
              ดูทัพศิลปิน ↓
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] uppercase tracking-widest text-gray-400">Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/60 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED ARTIST — Rotating hero card like in Figma
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 px-4 overflow-hidden bg-[#09090f]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 30% 50%, ${featured.color}18 0%, transparent 60%)` }} />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-5 h-5 text-[#ffe600]" />
            <span className="text-sm font-black uppercase tracking-widest text-[#ffe600]">Featured Artist</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Artist Card */}
            <div
              key={featuredIdx}
              className="relative rounded-3xl overflow-hidden border-2 transition-all duration-700"
              style={{ borderColor: featured.color + '60', boxShadow: `0 0 60px ${featured.color}30` }}
            >
              {/* Colored gradient bg as artist visual */}
              <div
                className="w-full aspect-video flex items-center justify-center text-8xl"
                style={{ background: `linear-gradient(135deg, #0d0d16 0%, ${featured.color}25 100%)` }}
              >
                <span style={{ textShadow: `0 0 40px ${featured.color}` }}>{featured.emoji}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: featured.color }}>
                      {featured.stage}
                    </span>
                    <h3 className="text-2xl font-black text-white mt-0.5">{featured.name}</h3>
                    <p className="text-sm text-gray-300 mt-1">{featured.genre}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">เริ่มแสดง</span>
                    <span className="text-2xl font-black text-white font-mono">{featured.time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Artist Grid — all artists */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {ARTISTS.map((artist, i) => (
                <button
                  key={i}
                  onClick={() => setFeaturedIdx(i)}
                  className={`group p-3 rounded-2xl border-2 text-left transition-all duration-300 ${
                    i === featuredIdx
                      ? 'scale-105'
                      : 'border-[#222235] bg-[#111119] hover:border-white/20 hover:scale-[1.02]'
                  }`}
                  style={i === featuredIdx ? {
                    borderColor: artist.color + '80',
                    background: `linear-gradient(135deg, #111119, ${artist.color}15)`,
                    boxShadow: `0 0 20px ${artist.color}25`,
                  } : {}}
                >
                  <div className="text-2xl mb-1.5 text-center">{artist.emoji}</div>
                  <p className="text-white font-bold text-xs leading-tight text-center">{artist.name}</p>
                  <p className="text-[10px] mt-0.5 text-center" style={{ color: artist.color }}>{artist.genre}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Artist dots */}
          <div className="flex justify-center gap-2 mt-6">
            {ARTISTS.map((a, i) => (
              <button
                key={i}
                onClick={() => setFeaturedIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === featuredIdx ? 24 : 8,
                  height: 8,
                  background: i === featuredIdx ? a.color : '#333',
                  boxShadow: i === featuredIdx ? `0 0 10px ${a.color}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LINEUP & TIMETABLE — Stage tabs like Figma
      ══════════════════════════════════════════════════════════════════ */}
      <section id="lineup" className="py-20 px-4 bg-[#07070b] relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[#ff007f] text-sm font-black uppercase tracking-widest mb-3">
              <Flame className="w-4 h-4" />
              Lineup & Timetable
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white">
              ทัพศิลปินร็อก & อินดี้<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#00f0ff,#ff007f)' }}>
                3 เวทีเต็มพิกัด
              </span>
            </h2>
          </div>

          {/* Stage Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {stages.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStage(i)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${
                  activeStage === i
                    ? 'text-black'
                    : 'bg-[#141420] text-gray-400 border border-[#2a2a3e] hover:text-white'
                }`}
                style={activeStage === i ? {
                  background: 'linear-gradient(135deg,#00f0ff,#ff007f)',
                  boxShadow: '0 0 20px rgba(0,240,255,0.3)',
                } : {}}
              >
                {s.stage}
              </button>
            ))}
          </div>

          {/* Active Stage bands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stages[activeStage]?.bands.map((band, i) => {
              const artist = ARTISTS.find(a => a.name === band.name) || ARTISTS[i % ARTISTS.length];
              return (
                <div
                  key={i}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-[#111119] border border-[#222235] hover:border-white/20 transition-all hover:scale-[1.01]"
                  style={{ '--a-color': artist.color }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `linear-gradient(135deg,${artist.color}30,${artist.color}10)`, border: `1px solid ${artist.color}40` }}
                  >
                    {artist.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base truncate group-hover:text-[var(--a-color)] transition-colors">
                      {band.name}
                    </h4>
                    <span className="text-xs font-medium" style={{ color: artist.color }}>{band.genre}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono text-sm font-bold text-white">{band.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCHEDULE — Timeline like Figma
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-[#09090f]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#00f0ff]">Festival Schedule</span>
            <h3 className="text-3xl font-black text-white mt-1">ตารางกิจกรรมประจำวัน</h3>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[28px] top-0 bottom-0 w-px bg-gradient-to-b from-[#00f0ff]/60 via-[#ff007f]/60 to-[#ffe600]/60" />

            <div className="space-y-4">
              {SCHEDULE.map((s, i) => (
                <div key={i} className="flex items-start gap-5 group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 relative z-10 border border-[#2a2a3e] transition-all group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, #111119, #1a1a28)`,
                      boxShadow: i % 2 === 0 ? '0 0 20px rgba(0,240,255,0.15)' : '0 0 20px rgba(255,0,127,0.15)',
                    }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0 py-3 border-b border-[#1e1e2e] group-last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-lg text-white">{s.time}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]/50" />
                      <span className="text-gray-300 text-sm">{s.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE PREVIEW CTA — Map teaser with animated neon rings
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a10]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[400, 500, 600].map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-[#00f0ff]/10 animate-ping"
              style={{
                width: s, height: s,
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                animationDuration: `${3 + i}s`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="rounded-3xl border border-[#2a2a40] p-8 sm:p-14 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#0e0e1c,#14102a,#0e1a14)' }}>

            {/* Neon spot */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff007f]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] text-xs font-black uppercase tracking-widest mb-6">
              <Zap className="w-3.5 h-3.5" />
              บัตรมีจำนวนจำกัด!
            </div>

            <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
              พร้อมสัมผัส<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#00f0ff,#ff007f,#ffe600)' }}>
                ประสบการณ์เสียงดนตรีสด?
              </span>
            </h3>

            <p className="text-gray-300 max-w-xl mx-auto text-base mb-10 leading-relaxed">
              เลือกโซน Standing Pit A ติดขอบเวที, Pit B ซาวด์เซอร์ราวด์,
              VIP Seated อัฒจันทร์พาโนรามา หรือ Camping 2 วัน 2 คืน
            </p>

            {/* Zone pills preview */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[
                { name: 'Standing Pit A', price: '3,500', color: '#00f0ff' },
                { name: 'Standing Pit B', price: '2,500', color: '#ff007f' },
                { name: 'VIP Seated', price: '2,200', color: '#ffe600' },
                { name: 'Camping 2 Days', price: '1,500', color: '#39ff14' },
              ].map(z => (
                <div
                  key={z.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold"
                  style={{ borderColor: z.color + '50', background: z.color + '12', color: z.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: z.color, boxShadow: `0 0 8px ${z.color}` }} />
                  {z.name}
                  <span className="text-white/70 font-normal text-xs">฿{z.price}</span>
                </div>
              ))}
            </div>

            <Link
              to="/booking/zone-select"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-extrabold text-black text-lg uppercase tracking-wider transition-all hover:scale-105 hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg,#00f0ff,#ff007f)',
                boxShadow: '0 0 50px rgba(0,240,255,0.4), 0 0 100px rgba(255,0,127,0.2)',
              }}
            >
              <Zap className="w-6 h-6" />
              เลือกโซนและซื้อบัตร
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
