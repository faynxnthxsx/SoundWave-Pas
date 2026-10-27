import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Sparkles, Clock, ArrowRight, Star, Users, Zap, CheckCircle2, Music, Mic2, Plus } from 'lucide-react';

// ─── Default Fallback Artist Data with Photos, Date & Performance Time ───────
const DEFAULT_ARTISTS = [
  {
    name: 'Slot Machine',
    genre: 'Rock / Headliner',
    stage: 'Main Neon Stage',
    date: 'เสาร์ 28 พ.ย. 2026',
    time: '22:30 – 24:00 น.',
    color: '#00f0ff',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
    description: 'ร็อกแนวหน้าของไทย พร้อมโชว์เต็มรูปแบบ แสง สี เสียง และวิชวลสุดอลังการปิดท้ายค่ำคืน'
  },
  {
    name: 'Taitosmith',
    genre: 'Rock / Indie',
    stage: 'Main Neon Stage',
    date: 'เสาร์ 28 พ.ย. 2026',
    time: '20:45 – 22:00 น.',
    color: '#ff4d8d',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1000&q=80',
    description: 'ปลดปล่อยพลังดนตรีสะท้อนสังคม กับเพลงฮิตที่แฟนเพลงตะโกนร้องตามกันสนั่นลานคอนเสิร์ต'
  },
  {
    name: 'Three Man Down',
    genre: 'Pop-Rock',
    stage: 'Cyber Valley Stage',
    date: 'เสาร์ 28 พ.ย. 2026',
    time: '21:30 – 23:00 น.',
    color: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1000&q=80',
    description: 'วงป๊อปร็อกขวัญใจคนรุ่นใหม่ รวมทุกบทเพลงอกหักและซาวด์ดนตรีสุดซึ้ง'
  },
  {
    name: 'Tilly Birds',
    genre: 'Alternative / Rock',
    stage: 'Cyber Valley Stage',
    date: 'อาทิตย์ 29 พ.ย. 2026',
    time: '20:00 – 21:00 น.',
    color: '#a855f7',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80',
    description: 'เพลงฮิตติดหูระดับร้อยล้านวิว กับลีลาการร้องสะกดอารมณ์สดๆ บนเวที'
  },
  {
    name: 'Anatomy Rabbit',
    genre: 'Dream Pop / Indie',
    stage: 'Underground Tent Stage',
    date: 'อาทิตย์ 29 พ.ย. 2026',
    time: '21:00 – 22:30 น.',
    color: '#ec4899',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
    description: 'ท่วงทำนองดรีมป๊อปละมุนใจ ชวนเคลิ้มไปกับบรรยากาศธรรมชาติใต้แสงดาว'
  },
  {
    name: 'Bomb at Track',
    genre: 'Nu-Metal / Rock',
    stage: 'Main Neon Stage',
    date: 'เสาร์ 28 พ.ย. 2026',
    time: '19:15 – 20:15 น.',
    color: '#f97316',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=80',
    description: 'เดือดพล่านถึงขีดสุดกับแนวดนตรีฮาร์ดคอร์แร็ปเมทัล ชวนมอชพิตติดขอบเวที'
  },
  {
    name: 'Safeplanet',
    genre: 'Indie Pop',
    stage: 'Cyber Valley Stage',
    date: 'อาทิตย์ 29 พ.ย. 2026',
    time: '18:30 – 19:30 น.',
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=80',
    description: 'จังหวะกีตาร์มีเสน่ห์ เมโลดี้ชวนโยกเบาๆ ในช่วงเวลาพระอาทิตย์ตกดิน'
  },
  {
    name: 'Solitude is Bliss',
    genre: 'Alternative Indie Rock',
    stage: 'Underground Tent Stage',
    date: 'เสาร์ 28 พ.ย. 2026',
    time: '19:30 – 20:30 น.',
    color: '#6366f1',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    description: 'อินดี้ร็อกจากเชียงใหม่ ซาวด์ไซคีเดลิกเฉพาะตัวที่หาฟังสดได้ยาก'
  },
];

const DEFAULT_SCHEDULE = [
  { time: '14:00', label: 'ประตูเปิด & จุดลงทะเบียน Camping', icon: '🚪' },
  { time: '16:00', label: 'โซนอาหาร Street Food & เครื่องดื่มเปิดบริการ', icon: '🍜' },
  { time: '17:00', label: 'เริ่มการแสดงสดทั้ง 3 เวที', icon: '🎸' },
  { time: '20:00', label: 'การแสดง แสง สี เสียง Neon Light & Pyro Show', icon: '🎆' },
  { time: '22:30', label: 'Headliner Stage — วง Slot Machine แสดงสด', icon: '⚡' },
  { time: '24:00', label: 'After Party DJ Set โซน Camping ลานกว้าง', icon: '🎧' },
];

export default function HomePage() {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcertId, setSelectedConcertId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [featuredIdx, setFeaturedIdx] = useState(0);

  useEffect(() => {
    fetch('/api/concerts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setConcerts(data.data);
          setSelectedConcertId(data.data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedConcert = useMemo(() => {
    return concerts.find((c) => c.id === selectedConcertId) || concerts[0] || null;
  }, [concerts, selectedConcertId]);

  // Dynamically resolve the lineup of the currently selected concert
  const currentArtists = useMemo(() => {
    if (!selectedConcert) return DEFAULT_ARTISTS;
    const stages = Array.isArray(selectedConcert.lineup) ? selectedConcert.lineup : [];

    // Parse lineup from database
    const artists = stages.flatMap((stage) => {
      if (typeof stage === 'string') {
        return [{
          name: stage,
          genre: 'Live Act',
          stage: 'เวทีหลัก',
          date: selectedConcert.eventDate ? new Date(selectedConcert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : 'วันแสดง',
          time: '20:00 – 21:00 น.',
          color: '#00f0ff',
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
          description: `พบกับโชว์สุดพิเศษของ ${stage} ในงาน ${selectedConcert.name}`,
        }];
      }

      const bands = Array.isArray(stage?.bands) ? stage.bands : Array.isArray(stage?.artists) ? stage.artists : [];
      return bands.map((band) => {
        const defaultMatch = DEFAULT_ARTISTS.find((a) => a.name.toLowerCase() === (band.name || '').toLowerCase());
        const eventDateStr = selectedConcert.eventDate
          ? new Date(selectedConcert.eventDate).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
          : 'วันแสดง';

        return {
          name: band.name || 'ไม่ระบุชื่อ',
          genre: band.genre || defaultMatch?.genre || 'Rock / Live',
          stage: band.stage || stage.stage || stage.name || 'Main Stage',
          date: band.date || defaultMatch?.date || eventDateStr,
          time: band.time || defaultMatch?.time || '20:00 – 21:00 น.',
          color: band.color || defaultMatch?.color || '#00f0ff',
          image: band.image || defaultMatch?.image || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
          description: band.description || defaultMatch?.description || `เตรียมพบกับโชว์สดเต็มรูปแบบของ ${band.name} บนเวที ${band.stage || stage.stage || 'เวทีหลัก'}`
        };
      });
    });

    if (artists.length > 0) return artists;
    // Fallback for default concert #1 if lineup is empty
    return selectedConcert.id === 1 ? DEFAULT_ARTISTS : [];
  }, [selectedConcert]);

  // Auto-rotate featured artist
  useEffect(() => {
    if (!currentArtists.length) return;
    const t = setInterval(() => {
      setFeaturedIdx((i) => (i + 1) % currentArtists.length);
    }, 4500);
    return () => clearInterval(t);
  }, [currentArtists.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-cyan-400 animate-spin" />
          <p className="text-gray-400 text-sm">กำลังโหลดข้อมูลเทศกาล...</p>
        </div>
      </div>
    );
  }

  const featured = currentArtists[featuredIdx] || currentArtists[0];
  const eventDateFormatted = selectedConcert?.eventDate
    ? new Date(selectedConcert.eventDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
    : '28 – 29 พฤศจิกายน 2026';

  return (
    <div className="pb-16 overflow-hidden bg-[#07070b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO — Modern, Premium Dark Aesthetic
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${selectedConcert?.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80'})`,
            filter: 'brightness(0.22) contrast(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/60 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-gray-200 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {eventDateFormatted} · {selectedConcert?.venue || selectedConcert?.location || 'Oasis Outdoor Arena'}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight uppercase">
            {selectedConcert ? (
              <>
                <span className="block">{selectedConcert.name}</span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-400 mt-2 font-mono">
                  SOUNDWAVE PASS LIVE
                </span>
              </>
            ) : (
              <>
                SOUNDWAVE
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-400">
                  PASS 2026
                </span>
              </>
            )}
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mt-6 leading-relaxed">
            {selectedConcert?.description || 'เทศกาลดนตรีและคอนเสิร์ตสดเต็มรูปแบบ พร้อมระบบออกตั๋วดิจิทัลผ่าน LINE และผังโซนที่นั่งครบวงจร'}
          </p>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {selectedConcert?.status === 'PAUSED' && (
              <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 px-4 py-2 rounded-xl text-xs text-amber-200 font-bold animate-pulse">
                <span>⏸️ พักการจำหน่ายบัตรชั่วคราว</span>
              </div>
            )}
            {selectedConcert?.status === 'CLOSED' && (
              <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/40 px-4 py-2 rounded-xl text-xs text-rose-200 font-bold">
                <span>🔴 ปิดจำหน่ายบัตรแล้ว</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-gray-200 font-medium">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {eventDateFormatted}
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-gray-200 font-medium">
              <MapPin className="w-4 h-4 text-pink-400" />
              {selectedConcert?.venue || selectedConcert?.location || 'ประเทศไทย'}
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-gray-200 font-medium">
              <Users className="w-4 h-4 text-emerald-400" />
              {currentArtists.length} ศิลปินในงาน
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {selectedConcert?.status === 'PAUSED' ? (
              <div className="px-8 py-3.5 rounded-xl font-bold text-amber-200 text-sm border border-amber-400/40 bg-amber-400/10 flex items-center gap-2">
                <span>⏸️ พักการจำหน่ายชั่วคราว (กรุณารอประกาศเพิ่มเติม)</span>
              </div>
            ) : selectedConcert?.status === 'CLOSED' ? (
              <div className="px-8 py-3.5 rounded-xl font-bold text-gray-400 text-sm border border-white/10 bg-white/5 flex items-center gap-2 cursor-not-allowed">
                <span>🔴 ปิดการจำหน่ายบัตรแล้ว</span>
              </div>
            ) : (
              <Link
                to={selectedConcert ? `/booking/zone-select?concertId=${selectedConcert.id}` : '/booking/zone-select'}
                className="px-8 py-3.5 rounded-xl font-bold text-black text-sm uppercase tracking-wider flex items-center gap-2 bg-cyan-300 hover:bg-cyan-200 transition-all shadow-lg shadow-cyan-400/20 hover:scale-105"
              >
                <Zap className="w-4 h-4 text-black" />
                เลือกโซนและจองบัตร
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a
              href="#artists-section"
              className="px-6 py-3.5 rounded-xl font-semibold text-gray-300 text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
            >
              ดูทัพศิลปินแต่ละงาน ↓
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INTERACTIVE CONCERT SWITCHER & LINEUP SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section id="artists-section" className="py-16 px-4 max-w-6xl mx-auto scroll-mt-20">
        
        {/* ── Dynamic Concert Switcher Bar ── */}
        <div className="mb-8 rounded-3xl border border-white/15 bg-[#101019] p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Music className="w-4 h-4" />
                <span>เลือกคอนเสิร์ตเพื่อดูไลน์อัป (Concert Lineup)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                คลิกเลือกคอนเสิร์ต เพื่อดูรายชื่อวงและเวลาขึ้นแสดง
              </h2>
            </div>
            <span className="text-xs text-gray-400">
              พบ {concerts.length} คอนเสิร์ต
            </span>
          </div>

          {/* Concert Selector Pills / Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.map((c) => {
              const isSelected = c.id === selectedConcert?.id;
              let artistCount = 0;
              try {
                const stages = Array.isArray(c.lineup) ? c.lineup : JSON.parse(c.lineupJson || '[]');
                artistCount = stages.flatMap((s) => s.bands || s.artists || []).length;
              } catch {
                artistCount = 0;
              }
              if (c.id === 1 && artistCount === 0) artistCount = DEFAULT_ARTISTS.length;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedConcertId(c.id);
                    setFeaturedIdx(0);
                  }}
                  className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-400/20 via-blue-500/15 to-purple-500/10 shadow-lg shadow-cyan-400/20 ring-2 ring-cyan-300 scale-[1.02]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  <div className="h-14 w-14 rounded-xl bg-white/10 overflow-hidden shrink-0 border border-white/10">
                    {c.bannerUrl ? (
                      <img src={c.bannerUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-cyan-300">
                        <Sparkles size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black truncate ${isSelected ? 'text-cyan-200' : 'text-white'}`}>
                        {c.name}
                      </span>
                      {c.status === 'PAUSED' && (
                        <span className="shrink-0 rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-400/40">
                          พักการขาย
                        </span>
                      )}
                      {c.status === 'CLOSED' && (
                        <span className="shrink-0 rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-300 border border-rose-500/40">
                          ปิดขาย
                        </span>
                      )}
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={12} className="text-pink-400" />
                      <span>{new Date(c.eventDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-cyan-300 font-bold">{artistCount} วง</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Lineup Header of Selected Concert ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Star className="w-4 h-4 fill-cyan-400" />
              Lineup & Schedule 2026 · {selectedConcert?.name}
            </div>
            <h2 className="text-3xl font-black text-white">ทัพศิลปินและวันเวลาแสดง</h2>
          </div>
          <p className="text-xs text-gray-400">
            คลิกที่การ์ดศิลปินเพื่อดูรายละเอียดและเวลาขึ้นแสดง
          </p>
        </div>

        {/* When Concert has artists */}
        {currentArtists.length > 0 && featured ? (
          <>
            {/* Highlight Banner Card of Active Artist */}
            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#12121a] shadow-2xl mb-8 transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Artist Photo Column */}
                <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-[420px] overflow-hidden bg-black/40">
                  <img
                    src={featured.image}
                    alt={featured.name}
                    className="w-full h-full object-cover object-center transition-all duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#12121a]" />

                  {/* Floating Stage Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/70 backdrop-blur border border-white/20 text-white">
                      🎪 {featured.stage}
                    </span>
                  </div>
                </div>

                {/* Artist Info Column */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
                      {featured.genre}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {featured.name}
                    </h3>
                    <p className="text-gray-300 text-xs sm:text-sm mt-3 leading-relaxed">
                      {featured.description}
                    </p>
                  </div>

                  {/* Show Date & Show Time Card */}
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-pink-400" />
                        วันที่แสดง
                      </span>
                      <span className="font-bold text-white font-mono text-sm">
                        {featured.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        เวลาขึ้นแสดง
                      </span>
                      <span className="font-bold text-cyan-300 font-mono text-base">
                        {featured.time}
                      </span>
                    </div>

                    <Link
                      to={selectedConcert ? `/booking/zone-select?concertId=${selectedConcert.id}` : '/booking/zone-select'}
                      className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors mt-2"
                    >
                      จองบัตรดู {featured.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Small Artists Carousel Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentArtists.map((artist, i) => {
                const isSelected = i === featuredIdx;
                return (
                  <button
                    key={`${artist.name}-${i}`}
                    type="button"
                    onClick={() => setFeaturedIdx(i)}
                    className={`relative rounded-2xl overflow-hidden border p-2 text-left transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-white/10 scale-[1.02] shadow-lg shadow-cyan-400/20'
                        : 'border-white/10 bg-[#101018] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white/5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                        <p className="text-[10px] text-cyan-300 font-mono mt-0.5 truncate">{artist.time.split('–')[0]} น.</p>
                        <p className="text-[9px] text-gray-400 truncate">{artist.stage}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* Empty Lineup Message */
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 mx-auto mb-3">
              <Mic2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">ยังไม่มีการประกาศรายชื่อศิลปินสำหรับงานนี้</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              โปรดติดตามการประกาศไลน์อัปและตารางเวลาแสดงอย่างเป็นทางการเร็วๆ นี้
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FESTIVAL TIMELINE SCHEDULE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Timetable</span>
          <h3 className="text-2xl font-black text-white mt-1">กำหนดการกิจกรรมเทศกาล</h3>
          <p className="text-xs text-gray-500 mt-1">{selectedConcert?.name}</p>
        </div>

        <div className="space-y-3">
          {(selectedConcert?.schedule?.length ? selectedConcert.schedule : DEFAULT_SCHEDULE).map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl bg-[#12121a] border border-white/10 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{s.icon || '🎵'}</span>
                <span className="text-gray-200">{s.label || s.activity}</span>
              </div>
              <span className="font-mono font-bold text-white shrink-0 ml-2">
                {s.time} น.
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIVE EVENTS LIST SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Live events</p>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">คอนเสิร์ตทั้งหมดในระบบ</h2>
          </div>
          <span className="text-xs text-gray-500">{concerts.length} งาน</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concerts.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                setSelectedConcertId(event.id);
                setFeaturedIdx(0);
                document.getElementById('artists-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#111119] transition hover:-translate-y-1 hover:border-cyan-300/40"
            >
              <div className="h-44 bg-[#191925] relative">
                {event.bannerUrl && (
                  <img
                    src={event.bannerUrl}
                    alt={`โปสเตอร์ ${event.name}`}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                )}
                <span className="absolute top-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-cyan-200">
                  {event.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="truncate font-bold text-white">{event.name}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5 text-cyan-300" />
                  {new Date(event.eventDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-400">
                  <MapPin className="h-3.5 w-3.5 text-pink-300" />
                  {event.venue || event.location}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-gray-400">{event.zones?.length || 0} โซน</span>
                  <span className="text-xs font-bold text-cyan-200">
                    {event.zones?.length
                      ? `เริ่ม ฿${Math.min(...event.zones.map((zone) => zone.price)).toLocaleString()}`
                      : 'ดูรายละเอียด'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TICKET CALL TO ACTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#141420] to-[#0d0d16] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            เปิดจำหน่ายบัตรอย่างเป็นทางการ
          </div>

          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            พร้อมสัมผัสประสบการณ์ดนตรีสดแล้วหรือยัง?
          </h3>

          <p className="text-gray-300 text-xs sm:text-sm max-w-lg mx-auto mt-3 leading-relaxed">
            เลือกโซนที่ต้องการ ไม่ว่าจะเป็น Standing Pit ติดขอบเวที, Seated VIP อัฒจันทร์มองเห็น 3 เวที หรือพื้นที่กางเต็นท์สัมผัสธรรมชาติ
          </p>

          <div className="mt-8">
            <Link
              to={selectedConcert ? `/booking/zone-select?concertId=${selectedConcert.id}` : '/booking/zone-select'}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-black text-sm uppercase tracking-wider bg-white hover:bg-gray-200 transition-all shadow-md hover:scale-105"
            >
              เลือกโซนและซื้อบัตรเลย
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
