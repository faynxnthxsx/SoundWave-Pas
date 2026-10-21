import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check, CircleDollarSign, ImagePlus, LoaderCircle, MapPin, Plus, Ticket, Trash2, Users, Mic2, Upload } from 'lucide-react';
import CropImageModal from '../../components/CropImageModal';
import LocationPicker from '../../components/LocationPicker';
import ConcertDateTimePicker from '../../components/ConcertDateTimePicker';

const emptyZone = () => ({ name: '', category: 'STANDING', price: '', capacity: '' });
const emptyForm = () => ({ name: '', slug: '', description: '', eventDate: '', location: '', province: '', venue: '', latitude: null, longitude: null, bannerUrl: '', zones: [emptyZone()] });
const money = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);
const dateLabel = (date) => new Date(date).toLocaleDateString('th-TH', { dateStyle: 'medium' });
async function api(path, options) {
  const response = await fetch(`/api/admin${path}`, options);
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
  return result.data;
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [posterPreview, setPosterPreview] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [artistEditor, setArtistEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, eventList] = await Promise.all([api('/stats'), api('/concerts')]);
      setStats(summary);
      setConcerts(eventList);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateZone = (index, field, value) => setForm((current) => ({
    ...current,
    zones: current.zones.map((zone, zoneIndex) => zoneIndex === index ? { ...zone, [field]: value } : zone),
  }));

  const startCrop = (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('เลือกไฟล์ JPG, PNG หรือ WebP');
      event.target.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('ขนาดไฟล์โปสเตอร์ต้องไม่เกิน 4 MB');
      event.target.value = '';
      return;
    }
    setCropTarget(target);
    setCropFile(file);
    event.target.value = '';
  };

  const uploadCroppedImage = async (image) => {
    setUploading(true);
    setError('');
    try {
      const result = await api('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      if (cropTarget?.type === 'poster') {
        updateField('bannerUrl', result.url);
        setPosterPreview(result.url);
      } else if (cropTarget?.type === 'artist') {
        setArtistEditor((current) => current ? ({ ...current, artists: current.artists.map((artist, index) => index === cropTarget.index ? { ...artist, image: result.url } : artist) }) : current);
      }
      setCropFile(null);
      setCropTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openArtistEditor = (concert) => {
    let stages = [];
    try { stages = JSON.parse(concert.lineupJson || '[]'); } catch { stages = []; }
    const artists = Array.isArray(stages) ? stages.flatMap((stage) => {
      const bands = Array.isArray(stage.bands) ? stage.bands : Array.isArray(stage.artists) ? stage.artists : stage.name ? [stage] : [];
      return bands.map((artist) => ({ name: artist.name || '', genre: artist.genre || '', time: artist.time || '', stage: artist.stage || stage.stage || 'Main Stage', image: artist.image || '' }));
    }) : [];
    setArtistEditor({ id: concert.id, name: concert.name, artists });
  };

  const updateArtist = (index, field, value) => setArtistEditor((current) => current ? ({ ...current, artists: current.artists.map((artist, artistIndex) => artistIndex === index ? { ...artist, [field]: value } : artist) }) : current);

  const saveArtists = async () => {
    if (!artistEditor?.artists.every((artist) => artist.name.trim())) {
      setError('กรอกชื่อศิลปินทุกคนก่อนบันทึก');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const stages = new Map();
      artistEditor.artists.forEach((artist) => {
        const stage = artist.stage.trim() || 'Main Stage';
        if (!stages.has(stage)) stages.set(stage, []);
        stages.get(stage).push({ name: artist.name.trim(), genre: artist.genre.trim(), time: artist.time.trim(), image: artist.image || '' });
      });
      await api(`/concerts/${artistEditor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lineupJson: JSON.stringify(Array.from(stages, ([stage, bands]) => ({ stage, bands }))) }) });
      setArtistEditor(null);
      setNotice('บันทึกรายชื่อศิลปินแล้ว');
      await loadDashboard();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(form.eventDate)) {
      setError('เลือกวันและเวลาแสดงก่อนสร้างคอนเสิร์ต');
      return;
    }
    if (!form.bannerUrl) {
      setError('อัปโหลดโปสเตอร์ก่อนสร้างคอนเสิร์ต');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const slug = form.slug.trim() || form.name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `concert-${Date.now()}`;
    try {
      await api('/concerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug, zones: form.zones.map((zone) => ({ ...zone, price: Number(zone.price), capacity: Number(zone.capacity) })) }),
      });
      setForm(emptyForm());
      setPosterPreview('');
      setNotice('เพิ่มคอนเสิร์ตเรียบร้อยแล้ว');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">SoundWave Pass · Organizer</p>
            <h1 className="text-3xl font-black sm:text-4xl">แดชบอร์ดผู้จัดงาน</h1>
            <p className="mt-2 text-sm text-gray-400">ติดตามยอดขายและจัดการคอนเสิร์ตของคุณ</p>
          </div>
          <Link to="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">กลับหน้าหลัก</Link>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"><Check size={16} />{notice}</div>}

        <section aria-label="สรุปยอด" className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="ขายตั๋วแล้ว" value={loading ? '—' : (stats?.totalTickets || 0).toLocaleString('th-TH')} detail={`${stats?.paidBookings || 0} รายการชำระเงิน`} icon={Ticket} />
          <StatCard label="รายได้รวม" value={loading ? '—' : money(stats?.revenue)} detail="จากรายการที่ชำระแล้ว" icon={CircleDollarSign} />
          <StatCard label="เข้างานแล้ว" value={loading ? '—' : (stats?.checkedIn || 0).toLocaleString('th-TH')} detail="สแกนตั๋วผ่านประตู" icon={Users} />
          <StatCard label="คอนเสิร์ต" value={loading ? '—' : (stats?.totalConcerts || 0).toLocaleString('th-TH')} detail={`${stats?.pendingBookings || 0} รายการรอชำระ`} icon={CalendarDays} />
        </section>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-xl font-bold">คอนเสิร์ตในระบบ</h2><p className="mt-1 text-xs text-gray-500">ยอดขายและรายละเอียดแต่ละงาน</p></div>
              <button onClick={loadDashboard} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">รีเฟรช</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {concerts.map((concert) => (
                <article key={concert.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111119]">
                  <div className="relative h-40 bg-[#191925]">
                    {concert.bannerUrl && <img src={concert.bannerUrl} alt={`โปสเตอร์ ${concert.name}`} className="h-full w-full object-cover" />}
                    <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold text-cyan-200">{concert.status}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-bold">{concert.name}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400"><CalendarDays size={13} />{dateLabel(concert.eventDate)}</p>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-400"><MapPin size={13} />{concert.venue || concert.location}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
                      <MiniStat label="โซน" value={concert.totalZones} />
                      <MiniStat label="ขายแล้ว" value={concert.totalTicketsSold} />
                      <MiniStat label="รายได้" value={money(concert.revenue)} />
                    </div>
                    <button type="button" onClick={() => openArtistEditor(concert)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-bold text-gray-200 transition hover:border-pink-200/30 hover:bg-pink-200/5 hover:text-white"><Mic2 size={14} className="text-pink-200" />เพิ่มหรือแก้ไขศิลปินและรูป</button>
                  </div>
                </article>
              ))}
              {!loading && concerts.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-gray-500 md:col-span-2">ยังไม่มีคอนเสิร์ต เพิ่มงานแรกได้จากแบบฟอร์ม</div>}
              {loading && <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-400 md:col-span-2"><LoaderCircle className="animate-spin" size={17} />กำลังโหลดข้อมูล</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#111119] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-200"><Plus size={19} /></div><div><h2 className="text-lg font-bold">เพิ่มคอนเสิร์ตใหม่</h2><p className="text-xs text-gray-500">สร้างงานและกำหนดราคาโซน</p></div></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="ชื่อคอนเสิร์ต" required><input required value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} placeholder="เช่น SoundWave Festival" /></Field>
              <Field label="Slug สำหรับ URL"><input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className={inputClass} placeholder="soundwave-festival (เว้นว่างเพื่อสร้างอัตโนมัติ)" /></Field>
              <Field label="วันและเวลาแสดง" required><ConcertDateTimePicker value={form.eventDate} onChange={(value) => updateField('eventDate', value)} /></Field>
              <Field label="รายละเอียด"><textarea rows="2" value={form.description} onChange={(e) => updateField('description', e.target.value)} className={`${inputClass} resize-y`} placeholder="รายละเอียดคอนเสิร์ต" /></Field>
              <Field label="โปสเตอร์ (JPG, PNG, WebP ไม่เกิน 4 MB)">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/20 p-3 hover:border-cyan-300/50">
                  {posterPreview ? <img src={posterPreview} alt="ตัวอย่างโปสเตอร์" className="h-20 w-16 rounded-lg object-cover" /> : <span className="flex h-20 w-16 items-center justify-center rounded-lg bg-white/5 text-gray-500">{uploading ? <LoaderCircle className="animate-spin" size={18} /> : <ImagePlus size={19} />}</span>}
                  <span className="flex-1"><span className="block text-xs font-semibold text-gray-200">{uploading ? 'กำลังอัปโหลด…' : posterPreview ? 'ครอบตัดรูปใหม่' : 'เลือกรูปและปรับกรอบโปสเตอร์'}</span><span className="mt-1 block text-[10px] text-gray-500">สัดส่วน 4:5 · JPG, PNG, WebP ไม่เกิน 4 MB</span></span><Upload size={15} className="text-cyan-200" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => startCrop(event, { type: 'poster' })} className="sr-only" />
                </label>
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><h3 className="text-sm font-bold">โซนบัตร</h3><button type="button" onClick={() => setForm((current) => ({ ...current, zones: [...current.zones, emptyZone()] }))} className="text-xs font-semibold text-cyan-200 hover:text-white">+ เพิ่มโซน</button></div>
                {form.zones.map((zone, index) => (
                  <div key={index} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">โซน {index + 1}</span>{form.zones.length > 1 && <button type="button" aria-label="ลบโซน" onClick={() => setForm((current) => ({ ...current, zones: current.zones.filter((_, i) => i !== index) }))} className="text-gray-500 hover:text-rose-300"><Trash2 size={14} /></button>}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input required value={zone.name} onChange={(e) => updateZone(index, 'name', e.target.value)} className={inputClass} placeholder="ชื่อโซน" />
                      <select value={zone.category} onChange={(e) => updateZone(index, 'category', e.target.value)} className={inputClass}><option value="STANDING">ยืน</option><option value="SEATED">นั่ง</option><option value="CAMPING">แคมป์</option></select>
                      <input required min="0" type="number" value={zone.price} onChange={(e) => updateZone(index, 'price', e.target.value)} className={inputClass} placeholder="ราคา (บาท)" />
                      <input required min="1" type="number" value={zone.capacity} onChange={(e) => updateZone(index, 'capacity', e.target.value)} className={inputClass} placeholder="จำนวนบัตร" />
                    </div>
                  </div>
                ))}
              </div>
              <button disabled={saving || uploading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={17} />}{saving ? 'กำลังบันทึก…' : 'สร้างคอนเสิร์ต'}
              </button>
            </form>
          </section>
        </div>
      </div>
      {artistEditor && <ArtistEditorModal editor={artistEditor} error={error} onClose={() => setArtistEditor(null)} onAdd={() => setArtistEditor((current) => ({ ...current, artists: [...current.artists, { name: '', genre: '', time: '', stage: 'Main Stage', image: '' }] }))} onRemove={(index) => setArtistEditor((current) => ({ ...current, artists: current.artists.filter((_, artistIndex) => artistIndex !== index) }))} onUpdate={updateArtist} onSave={saveArtists} saving={saving} uploading={uploading} onPhoto={(event, index) => startCrop(event, { type: 'artist', index })} />}
      {cropFile && <CropImageModal file={cropFile} onCancel={() => { setCropFile(null); setCropTarget(null); }} onApply={uploadCroppedImage} />}
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60';

function ArtistEditorModal({ editor, error, onClose, onAdd, onRemove, onUpdate, onSave, saving, uploading, onPhoto }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="artist-modal-title" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#111119] shadow-2xl">
    <header className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-200">Artist studio</p><h2 id="artist-modal-title" className="mt-1 text-xl font-black">รายชื่อศิลปิน · {editor.name}</h2><p className="mt-1 text-xs text-gray-500">เพิ่มชื่อ เวที เวลา แนวเพลง และครอบตัดรูปศิลปินได้</p></div><button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white">×</button></header>
    <div className="flex-1 space-y-3 overflow-y-auto p-5">
      {!editor.artists.length && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-gray-500">ยังไม่มีศิลปิน เพิ่มรายชื่อแรกได้เลย</div>}
      {editor.artists.map((artist, index) => <article key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start gap-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">{artist.image ? <img src={artist.image} alt={`รูป ${artist.name || 'ศิลปิน'}`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-pink-200"><Mic2 size={21} /></span>}</div><div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2"><input value={artist.name} onChange={(event) => onUpdate(index, 'name', event.target.value)} className={inputClass} placeholder="ชื่อศิลปิน" aria-label="ชื่อศิลปิน" /><input value={artist.stage} onChange={(event) => onUpdate(index, 'stage', event.target.value)} className={inputClass} placeholder="ชื่อเวที" aria-label="ชื่อเวที" /><input value={artist.genre} onChange={(event) => onUpdate(index, 'genre', event.target.value)} className={inputClass} placeholder="แนวเพลง (ไม่บังคับ)" aria-label="แนวเพลง" /><input value={artist.time} onChange={(event) => onUpdate(index, 'time', event.target.value)} className={inputClass} placeholder="เวลาแสดง เช่น 19:00–20:00" aria-label="เวลาแสดง" /></div><div className="flex gap-2"><label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] font-semibold text-gray-300 hover:bg-white/5"><Upload size={12} />รูป<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onPhoto(event, index)} className="sr-only" /></label><button type="button" onClick={() => onRemove(index)} aria-label="ลบศิลปิน" className="rounded-lg border border-white/10 px-2.5 text-gray-500 hover:text-rose-300"><Trash2 size={14} /></button></div></div></article>)}
      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
    </div>
    <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 p-4"><button type="button" onClick={onAdd} className="rounded-xl border border-pink-200/20 px-4 py-2.5 text-xs font-bold text-pink-100 hover:bg-pink-200/5">+ เพิ่มศิลปิน</button><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300">ยกเลิก</button><button type="button" onClick={onSave} disabled={saving || uploading} className="rounded-xl bg-pink-200 px-4 py-2.5 text-xs font-black text-[#1c0c14] hover:bg-white disabled:opacity-50">{saving ? 'กำลังบันทึก…' : 'บันทึกรายชื่อ'}</button></div></footer>
  </section></div>;
}

function Field({ label, required, children }) {
  return <label className="block space-y-1.5"><span className="text-xs font-medium text-gray-300">{label}{required && <span className="ml-1 text-rose-300">*</span>}</span>{children}</label>;
}

function StatCard({ label, value, detail, icon: Icon }) {
  return <article className="rounded-2xl border border-white/10 bg-[#111119] p-5"><div className="flex items-start justify-between"><p className="text-sm text-gray-400">{label}</p><Icon size={18} className="text-cyan-200" /></div><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></article>;
}

function MiniStat({ label, value }) {
  return <div><p className="text-[10px] text-gray-500">{label}</p><p className="mt-1 truncate text-xs font-bold text-gray-200">{value}</p></div>;
}
