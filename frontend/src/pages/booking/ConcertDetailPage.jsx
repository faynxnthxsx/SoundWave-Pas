import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, Music2, Ticket } from 'lucide-react';

export default function ConcertDetailPage() {
  const { id } = useParams();
  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/concerts/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ไม่พบคอนเสิร์ตนี้');
        if (!cancelled) setConcert(data.data);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const artists = useMemo(() => {
    const stages = Array.isArray(concert?.lineup) ? concert.lineup : [];
    return stages.flatMap((stage) => {
      if (typeof stage === 'string') return [{ stage: 'ศิลปิน', name: stage, time: '' }];
      const bands = Array.isArray(stage.bands) ? stage.bands : Array.isArray(stage.artists) ? stage.artists : [stage];
      return bands.filter((band) => band?.name).map((band) => ({ ...band, stage: band.stage || stage.stage || stage.name || 'เวทีหลัก' }));
    });
  }, [concert]);

  const timetable = useMemo(() => {
    const schedule = Array.isArray(concert?.schedule) ? concert.schedule : [];
    if (schedule.length) return schedule;
    return artists.filter((artist) => artist.time).map((artist) => ({ time: artist.time, activity: artist.name, stage: artist.stage }));
  }, [artists, concert]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">กำลังโหลดรายละเอียดคอนเสิร์ต…</div>;
  if (error || !concert) return <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center"><p className="text-lg font-bold">{error || 'ไม่พบคอนเสิร์ตนี้'}</p><Link to="/" className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">กลับหน้าแรก</Link></div>;

  const eventDate = new Date(concert.eventDate);
  const mapQuery = encodeURIComponent(concert.venue || concert.location);
  const hasCoordinates = Number.isFinite(concert.latitude) && Number.isFinite(concert.longitude);
  const mapBbox = hasCoordinates
    ? `${concert.longitude - 0.035},${concert.latitude - 0.022},${concert.longitude + 0.035},${concert.latitude + 0.022}`
    : null;
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik&marker=${concert.latitude},${concert.longitude}`
    : `https://maps.google.com/maps?q=${mapQuery}&output=embed`;
  const bookingLink = `/booking/zone-select?concertId=${concert.id}`;

  return (
    <div className="min-h-screen bg-[#09090f] pb-16 text-white">
      <div className="relative h-[34vh] min-h-64 max-h-[460px] bg-[#161622]">
        {concert.bannerUrl && <img src={concert.bannerUrl} alt={`โปสเตอร์ ${concert.name}`} className="h-full w-full object-cover opacity-70" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-[#09090f]/30 to-black/20" />
        <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold backdrop-blur"><ArrowLeft size={15} />กลับ</Link>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-7 sm:px-6">
          <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-100">{concert.status}</span>
          <h1 className="mt-3 max-w-4xl text-3xl font-black sm:text-5xl">{concert.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-200 sm:text-sm"><span className="flex items-center gap-1.5"><CalendarDays size={15} />{eventDate.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}</span><span className="flex items-center gap-1.5"><MapPin size={15} />{concert.venue || concert.location}</span></div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-9">
          {concert.description && <section><h2 className="text-xl font-black">เกี่ยวกับงาน</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-300">{concert.description}</p></section>}

          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Festival timetable</p><h2 className="mt-1 text-xl font-black">ตารางเวลาแสดง</h2></div><Clock3 size={19} className="text-cyan-200" /></div>
            {timetable.length ? <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111119]">
              {timetable.map((item, index) => <div key={`${item.time || index}-${index}`} className="grid grid-cols-[76px_1fr] gap-3 border-b border-white/5 p-4 last:border-0 sm:grid-cols-[96px_1fr_160px]"><span className="font-mono text-sm font-bold text-cyan-200">{item.time || '—'}</span><span className="text-sm text-gray-100">{item.activity || item.name || item.artist || 'กิจกรรม'}</span><span className="col-start-2 text-xs text-gray-500 sm:col-start-auto sm:text-right">{item.stage || item.genre || ''}</span></div>)}
            </div> : <EmptyMessage>ยังไม่มีการประกาศตารางเวลา</EmptyMessage>}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-300">Lineup</p><h2 className="mt-1 text-xl font-black">รายชื่อศิลปิน</h2></div><Music2 size={19} className="text-pink-200" /></div>
            {artists.length ? <div className="grid gap-3 sm:grid-cols-2">{artists.map((artist, index) => <article key={`${artist.name}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111119]">{artist.image ? <img src={artist.image} alt={artist.name} className="h-40 w-full object-cover" loading="lazy" /> : <div className="grid h-24 place-items-center bg-gradient-to-br from-pink-500/15 via-violet-500/10 to-cyan-400/15"><Music2 className="text-white/30" size={28} /></div>}<div className="p-4"><p className="text-lg font-bold">{artist.name}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400"><span>{artist.stage}</span><span className="font-mono text-cyan-200">{artist.time || ''}</span></div>{artist.genre && <p className="mt-1 text-xs text-gray-500">{artist.genre}</p>}</div></article>)}</div> : <EmptyMessage>ยังไม่มีการประกาศรายชื่อศิลปิน</EmptyMessage>}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Venue map</p><h2 className="mt-1 text-xl font-black">แผนที่จัดงาน</h2><p className="mt-1 text-xs text-gray-400">{concert.location}</p></div><MapPin size={19} className="text-emerald-200" /></div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111119]"><iframe title={`แผนที่ ${concert.venue || concert.location}`} src={mapUrl} className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />{hasCoordinates && <p className="px-3 py-2 text-[9px] text-gray-500">© OpenStreetMap contributors</p>}</div>
          </section>
        </main>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Ticket zones</p><h2 className="mt-1 text-xl font-black">โซนบัตร</h2></div><Ticket className="text-cyan-200" size={19} /></div>
          {concert.zones?.map((zone) => {
            const soldOut = zone.available <= 0;
            return <article key={zone.id} className={`rounded-2xl border bg-[#111119] p-4 ${soldOut ? 'border-white/5 opacity-55' : 'border-white/10'}`}><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{zone.name}</h3><span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold text-gray-400">{soldOut ? 'SOLD OUT' : `${zone.available.toLocaleString()} ใบ`}</span></div><p className="mt-2 text-2xl font-black text-cyan-200">฿{zone.price.toLocaleString()}<span className="ml-1 text-xs font-medium text-gray-500">/ ใบ</span></p><p className="mt-1 text-xs text-gray-500">{zone.category}</p></article>;
          })}
          {!concert.zones?.length && <EmptyMessage>ยังไม่มีโซนบัตรสำหรับงานนี้</EmptyMessage>}
          <Link to={bookingLink} className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-cyan-200/30 bg-cyan-200/10 px-4 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-200/20">เลือกโซนจากผังคอนเสิร์ต <ArrowRight size={15} /></Link>
        </aside>
      </div>
    </div>
  );
}

function EmptyMessage({ children }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-gray-500">{children}</div>;
}
