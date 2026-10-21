import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Sparkles, Clock, ArrowRight, Star, Users, Zap, CheckCircle2 } from 'lucide-react';

// ─── Artist Data with Photos, Date & Performance Time ──────────────────────────────
const ARTISTS = [
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

const SCHEDULE = [
  { time: '14:00', label: 'ประตูเปิด & จุดลงทะเบียน Camping', icon: '🚪' },
  { time: '16:00', label: 'โซนอาหาร Street Food & เครื่องดื่มเปิดบริการ', icon: '🍜' },
  { time: '17:00', label: 'เริ่มการแสดงสดทั้ง 3 เวที', icon: '🎸' },
  { time: '20:00', label: 'การแสดง แสง สี เสียง Neon Light & Pyro Show', icon: '🎆' },
  { time: '22:30', label: 'Headliner Stage — วง Slot Machine แสดงสด', icon: '⚡' },
  { time: '24:00', label: 'After Party DJ Set โซน Camping ลานกว้าง', icon: '🎧' },
];

export default function HomePage() {
  const [concert, setConcert] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredIdx, setFeaturedIdx] = useState(0);

  useEffect(() => {
    fetch('/api/concerts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setConcerts(data.data);
          setConcert(data.data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-rotate featured artist
  useEffect(() => {
    const t = setInterval(() => setFeaturedIdx(i => (i + 1) % ARTISTS.length), 4500);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <p className="text-gray-400 text-sm">กำลังโหลดข้อมูลเทศกาล...</p>
      </div>
    </div>
  );

  const featured = ARTISTS[featuredIdx];

  return (
    <div className="pb-16 overflow-hidden bg-[#07070b]">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Modern, Premium Dark Aesthetic
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Background Image with Dark Gradient Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80)`,
            filter: 'brightness(0.22) contrast(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/60 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-8">
          {/* Subtle Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-gray-200 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            28 – 29 พฤศจิกายน 2026 · สวนผึ้ง ราชบุรี
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-none uppercase">
            SOUNDWAVE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-400">
              PASS 2026
            </span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mt-6 leading-relaxed">
            เทศกาลดนตรีร็อกและอินดี้เอาต์ดอร์ที่ทุกคนรอคอย 3 เวที 15 ศิลปินชั้นนำ พร้อมโซนกางเต็นท์สัมผัสธรรมชาติ และระบบออกตั๋วดิจิทัลผ่าน LINE ครบวงจร
          </p>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-gray-200 font-medium">
              <Calendar className="w-4 h-4 text-cyan-400" />
              2 วัน 2 คืนเต็ม
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-gray-200 font-medium">
              <MapPin className="w-4 h-4 text-pink-400" />
              Oasis Outdoor Arena, สวนผึ้ง
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-gray-200 font-medium">
              <Users className="w-4 h-4 text-emerald-400" />
              3 เวที · 15 ศิลปิน
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              to={concert ? `/concerts/${concert.id}` : '/booking/zone-select'}
              className="px-8 py-3.5 rounded-xl font-bold text-black text-sm uppercase tracking-wider flex items-center gap-2 bg-white hover:bg-gray-200 transition-all shadow-lg hover:scale-105"
            >
              <Zap className="w-4 h-4 text-black" />
              เลือกโซนและจองบัตร
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#artists"
              className="px-6 py-3.5 rounded-xl font-semibold text-gray-300 text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
            >
              ดูตารางศิลปิน ↓
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED ARTIST CAROUSEL — High Quality Photos + Dates & Times
      ══════════════════════════════════════════════════════════════════ */}
      <section id="artists" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Star className="w-4 h-4 fill-cyan-400" />
              Lineup & Schedule 2026
            </div>
            <h2 className="text-3xl font-black text-white">ทัพศิลปินและวันเวลาแสดง</h2>
          </div>
          <p className="text-xs text-gray-400">
            คลิกที่การ์ดศิลปินเพื่อดูรายละเอียดและเวลาขึ้นแสดง
          </p>
        </div>

        {/* Highlight Banner Card of Active Artist */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#12121a] shadow-2xl mb-8 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Artist Photo Column */}
            <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-[420px] overflow-hidden">
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
                  to={concert ? `/concerts/${concert.id}` : '/booking/zone-select'}
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
          {ARTISTS.map((artist, i) => {
            const isSelected = i === featuredIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setFeaturedIdx(i)}
                className={`relative rounded-2xl overflow-hidden border p-2 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-white/10 scale-[1.02] shadow-lg'
                    : 'border-white/10 bg-[#101018] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                    <p className="text-[10px] text-cyan-300 font-mono mt-0.5">{artist.time.split('–')[0]} น.</p>
                    <p className="text-[9px] text-gray-400 truncate">{artist.date.split(' ')[0]}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FESTIVAL TIMELINE SCHEDULE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Timetable</span>
          <h3 className="text-2xl font-black text-white mt-1">กำหนดการกิจกรรมเทศกาล</h3>
        </div>

        <div className="space-y-3">
          {SCHEDULE.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl bg-[#12121a] border border-white/10 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-gray-200">{s.label}</span>
              </div>
              <span className="font-mono font-bold text-white shrink-0 ml-2">
                {s.time} น.
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Live events</p><h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">เลือกคอนเสิร์ต</h2></div>
          <span className="text-xs text-gray-500">{concerts.length} งาน</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concerts.map((event) => (
            <Link key={event.id} to={`/concerts/${event.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111119] transition hover:-translate-y-1 hover:border-cyan-300/40">
              <div className="h-44 bg-[#191925]">{event.bannerUrl && <img src={event.bannerUrl} alt={`โปสเตอร์ ${event.name}`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />}</div>
              <div className="p-4"><h3 className="truncate font-bold text-white">{event.name}</h3><p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400"><Calendar className="h-3.5 w-3.5 text-cyan-300" />{new Date(event.eventDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}</p><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-400"><MapPin className="h-3.5 w-3.5 text-pink-300" />{event.venue || event.location}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-gray-400">{event.zones?.length || 0} โซน</span><span className="text-xs font-bold text-cyan-200">{event.zones?.length ? `เริ่ม ฿${Math.min(...event.zones.map((zone) => zone.price)).toLocaleString()}` : 'ดูรายละเอียด'}</span></div></div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TICKET CALL TO ACTION — Clean, Elegant, Less Garish Colors
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

          {/* Clean Muted Zone Preview Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8 max-w-2xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">ยืนหน้าเวที</span>
              <p className="text-xs font-bold text-white mt-0.5">Standing Pit A</p>
              <p className="text-sm font-black text-cyan-400 mt-1">฿3,500</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">ยืนกลางลาน</span>
              <p className="text-xs font-bold text-white mt-0.5">Standing Pit B</p>
              <p className="text-sm font-black text-pink-400 mt-1">฿2,500</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">เก้าอี้อัฒจันทร์</span>
              <p className="text-xs font-bold text-white mt-0.5">VIP Seated</p>
              <p className="text-sm font-black text-amber-300 mt-1">฿2,200</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">กางเต็นท์ 2 วัน</span>
              <p className="text-xs font-bold text-white mt-0.5">Camping Pass</p>
              <p className="text-sm font-black text-emerald-400 mt-1">฿1,500</p>
            </div>
          </div>

          <Link
            to={concert ? `/concerts/${concert.id}` : '/booking/zone-select'}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-black text-sm uppercase tracking-wider bg-white hover:bg-gray-200 transition-all shadow-md hover:scale-105"
          >
            เลือกโซนและซื้อบัตรเลย
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
