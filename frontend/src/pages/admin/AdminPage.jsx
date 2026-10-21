import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Plus,
  Ticket,
  Trash2,
  Users,
  Mic2,
  Upload,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  Link2,
  X,
  PenLine,
} from 'lucide-react';
import CropImageModal from '../../components/CropImageModal';
import LocationPicker from '../../components/LocationPicker';
import ConcertDateTimePicker from '../../components/ConcertDateTimePicker';

// ── Preset ticket categories ──────────────────────────────────────────────────
const PRESET_CATEGORIES = [
  { value: 'STANDING',   label: 'บัตรยืน',         emoji: '🎪' },
  { value: 'SEATED',     label: 'บัตรนั่ง',         emoji: '💺' },
  { value: 'CAMPING',    label: 'แคมป์ปิ้ง',        emoji: '⛺' },
  { value: 'VIP',        label: 'VIP',               emoji: '👑' },
  { value: 'VVIP',       label: 'VVIP',              emoji: '💎' },
  { value: 'EARLY_BIRD', label: 'Early Bird',        emoji: '🐦' },
  { value: 'MEET_GREET', label: 'Meet & Greet',      emoji: '🤝' },
];

// Helper: return human-readable label for any category string
const categoryLabel = (cat) => {
  if (!cat) return '—';
  const preset = PRESET_CATEGORIES.find((p) => p.value === cat);
  return preset ? `${preset.emoji} ${preset.label}` : cat;
};

const emptyZone = () => ({ name: '', category: 'STANDING', price: '', capacity: '' });
const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  eventDate: '',
  location: '',
  province: '',
  venue: '',
  latitude: null,
  longitude: null,
  bannerUrl: '',
  zones: [emptyZone()],
});

const money = (amount) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const dateLabel = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${timeStr} น.`;
};

async function api(path, options) {
  const response = await fetch(`/api/admin${path}`, options);
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
  return result.data;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'create'
  const [stats, setStats] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [posterPreview, setPosterPreview] = useState('');
  const [posterUrlInput, setPosterUrlInput] = useState(''); // direct URL input
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [artistEditor, setArtistEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expandedConcerts, setExpandedConcerts] = useState({});
  // Per-zone custom category text input state: { [zoneIndex]: string }
  const [customCatInputs, setCustomCatInputs] = useState({});

  const toggleExpand = (id) => {
    setExpandedConcerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateZone = (index, field, value) =>
    setForm((current) => ({
      ...current,
      zones: current.zones.map((zone, zoneIndex) => (zoneIndex === index ? { ...zone, [field]: value } : zone)),
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
        setArtistEditor((current) =>
          current
            ? {
                ...current,
                artists: current.artists.map((artist, index) =>
                  index === cropTarget.index ? { ...artist, image: result.url } : artist
                ),
              }
            : current
        );
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
    try {
      stages = JSON.parse(concert.lineupJson || '[]');
    } catch {
      stages = [];
    }
    const artists = Array.isArray(stages)
      ? stages.flatMap((stage) => {
          const bands = Array.isArray(stage.bands)
            ? stage.bands
            : Array.isArray(stage.artists)
            ? stage.artists
            : stage.name
            ? [stage]
            : [];
          return bands.map((artist) => ({
            name: artist.name || '',
            genre: artist.genre || '',
            time: artist.time || '',
            stage: artist.stage || stage.stage || 'Main Stage',
            image: artist.image || '',
          }));
        })
      : [];
    setArtistEditor({ id: concert.id, name: concert.name, artists });
  };

  const updateArtist = (index, field, value) =>
    setArtistEditor((current) =>
      current
        ? {
            ...current,
            artists: current.artists.map((artist, artistIndex) =>
              artistIndex === index ? { ...artist, [field]: value } : artist
            ),
          }
        : current
    );

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
        stages
          .get(stage)
          .push({ name: artist.name.trim(), genre: artist.genre.trim(), time: artist.time.trim(), image: artist.image || '' });
      });
      await api(`/concerts/${artistEditor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineupJson: JSON.stringify(Array.from(stages, ([stage, bands]) => ({ stage, bands }))),
        }),
      });
      setArtistEditor(null);
      setNotice('บันทึกรายชื่อศิลปินเรียบร้อยแล้ว');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(form.eventDate)) {
      setError('เลือกวันและเวลาแสดงก่อนสร้างคอนเสิร์ต');
      return;
    }
    if (!form.location) {
      setError('เลือกจังหวัดและสถานที่จัดงานก่อนสร้างคอนเสิร์ต');
      return;
    }
    if (!form.bannerUrl) {
      setError('อัปโหลดโปสเตอร์ก่อนสร้างคอนเสิร์ต');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const slug =
      form.slug.trim() ||
      form.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      `concert-${Date.now()}`;

    try {
      await api('/concerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug,
          zones: form.zones.map((zone) => ({
            ...zone,
            price: Number(zone.price),
            capacity: Number(zone.capacity),
          })),
        }),
      });
      setForm(emptyForm());
      setPosterPreview('');
      setNotice('เพิ่มคอนเสิร์ตเรียบร้อยแล้ว');
      setActiveTab('overview');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Aggregated system totals
  const totalSystemCapacity = useMemo(
    () => concerts.reduce((sum, c) => sum + (c.totalCapacity || 0), 0),
    [concerts]
  );
  const totalSystemAvailable = useMemo(
    () => concerts.reduce((sum, c) => sum + (c.totalAvailable || 0), 0),
    [concerts]
  );

  return (
    <div className="min-h-screen bg-[#07070c] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Page Header & Navigation Bar ── */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center rounded-md bg-cyan-400/15 px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-cyan-400/30">
                Organizer Portal
              </span>
              <span className="text-xs text-gray-400">ระบบจัดการผู้จัดงาน SoundWave Pass</span>
            </div>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">แผงควบคุมและสถิติคอนเสิร์ต</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <TrendingUp size={14} />
                <span>ภาพรวม & ข้อมูลการเงิน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'create'
                    ? 'bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Plus size={14} />
                <span>+ เพิ่มคอนเสิร์ตใหม่</span>
              </button>
            </div>

            <Link
              to="/"
              className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5"
            >
              กลับหน้าร้าน
            </Link>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
            <Check size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* ── Top Executive KPI Metrics ── */}
        <section aria-label="สรุปยอดภาพรวมระบบ" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="ตั๋วที่ขายแล้วทั้งหมด"
            value={loading ? '—' : `${(stats?.totalTickets || 0).toLocaleString('th-TH')} ใบ`}
            detail={`จากความจุทั้งหมด ${totalSystemCapacity.toLocaleString()} ใบ`}
            subTag={`เหลือ ${totalSystemAvailable.toLocaleString()} ใบ`}
            icon={Ticket}
            color="text-cyan-300"
          />
          <StatCard
            label="รายได้รวมทั้งหมด"
            value={loading ? '—' : money(stats?.revenue)}
            detail={`${stats?.paidBookings || 0} รายการชำระเงินสำเร็จ`}
            subTag="PromptPay / ธนาคาร"
            icon={CircleDollarSign}
            color="text-emerald-300"
          />
          <StatCard
            label="สแกนเข้างานแล้ว (Check-in)"
            value={loading ? '—' : `${(stats?.checkedIn || 0).toLocaleString('th-TH')} คน`}
            detail={`จากตั๋วที่ขายแล้ว ${stats?.totalTickets || 0} ใบ`}
            subTag={`${stats?.totalTickets ? Math.round(((stats?.checkedIn || 0) / stats.totalTickets) * 100) : 0}% เข้างาน`}
            icon={Users}
            color="text-purple-300"
          />
          <StatCard
            label="คอนเสิร์ตในระบบ"
            value={loading ? '—' : `${(stats?.totalConcerts || concerts.length || 0).toLocaleString('th-TH')} งาน`}
            detail={`${stats?.pendingBookings || 0} รายการรอชำระเงิน`}
            subTag="กำลังเปิดจำหน่าย"
            icon={CalendarDays}
            color="text-pink-300"
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            VIEW 1: FULL-WIDTH CONCERTS & ANALYTICS OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">รายงานตั๋ว, การเงิน และการเข้างานรายคอนเสิร์ต</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  ตรวจสอบยอดขาย บัตรคงเหลือ ยอดเงิน และผลการสแกนบัตรหน้างานของแต่ละคอนเสิร์ต
                </p>
              </div>
              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-xl border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/5"
              >
                รีเฟรชข้อมูล
              </button>
            </div>

            {/* Concerts Detail Cards */}
            <div className="space-y-6">
              {concerts.map((c) => {
                const sold = c.totalTicketsSold || 0;
                const capacity = c.totalCapacity || 1;
                const available = c.totalAvailable ?? (capacity - sold);
                const percentSold = Math.min(100, Math.round((sold / capacity) * 100));
                const checkedIn = c.checkedIn || 0;
                const percentCheckedIn = sold > 0 ? Math.min(100, Math.round((checkedIn / sold) * 100)) : 0;
                const isExpanded = !!expandedConcerts[c.id];

                return (
                  <article
                    key={c.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#101018] shadow-2xl transition-all"
                  >
                    {/* Concert Header Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-5 sm:p-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/10 overflow-hidden shrink-0 border border-white/10">
                          {c.bannerUrl ? (
                            <img src={c.bannerUrl} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-cyan-300 font-bold">
                              LOGO
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 border border-cyan-400/30">
                              {c.status || 'UPCOMING'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              ID: #{c.id} · {c.slug}
                            </span>
                          </div>
                          <h3 className="mt-1 text-lg sm:text-xl font-black text-white truncate">
                            {c.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CalendarDays size={13} className="text-cyan-300" />
                              {dateLabel(c.eventDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-pink-300" />
                              {c.venue || c.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Header Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => openArtistEditor(c)}
                          className="flex items-center gap-1.5 rounded-xl border border-pink-400/30 bg-pink-400/10 px-3 py-2 text-xs font-bold text-pink-200 hover:bg-pink-400/20 transition-all"
                        >
                          <Mic2 size={13} />
                          <span>จัดการศิลปิน ({c.lineup?.length || 0})</span>
                        </button>

                        <Link
                          to={`/concerts/${c.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <ExternalLink size={13} />
                          <span>หน้าร้าน</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => toggleExpand(c.id)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-gray-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* ── 3 Big Analytics Blocks ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 p-5 sm:p-6 bg-black/20">
                      {/* Block 1: Ticket Numbers */}
                      <div className="space-y-3 pb-4 md:pb-0 md:pr-6">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <Ticket size={15} /> สถานะยอดขายตั๋ว
                          </span>
                          <span className="font-mono text-cyan-200">{percentSold}% ขายแล้ว</span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                              {sold.toLocaleString()}
                            </span>
                            <span className="ml-1.5 text-xs text-gray-400">ใบที่ขายแล้ว</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              {available.toLocaleString()}
                            </span>
                            <span className="ml-1 text-[11px] text-gray-500">ใบคงเหลือ</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          ความจุบัตรทั้งหมด: <strong className="text-gray-300">{capacity.toLocaleString()} ใบ</strong> ใน {c.totalZones} โซน
                        </p>
                      </div>

                      {/* Block 2: Financial Stats */}
                      <div className="space-y-3 py-4 md:py-0 md:px-6">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5 text-emerald-300">
                            <CircleDollarSign size={15} /> ข้อมูลการเงิน (Revenue)
                          </span>
                          <span className="font-mono text-emerald-200">ชำระแล้ว</span>
                        </div>

                        <div>
                          <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                            {money(c.revenue)}
                          </span>
                          <p className="text-[11px] text-gray-400 mt-1">
                            ยอดเงินรวมจากตั๋วที่ออกสำเร็จทั้งหมด
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 flex items-center justify-between text-xs">
                          <span className="text-gray-400">ราคาเฉลี่ยต่อใบ:</span>
                          <span className="font-mono font-bold text-white">
                            {sold > 0 ? money(Math.round(c.revenue / sold)) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Block 3: Gate Check-in Stats */}
                      <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5 text-purple-300">
                            <Users size={15} /> การเข้างาน (Gate Check-in)
                          </span>
                          <span className="font-mono text-purple-200">{percentCheckedIn}% เข้างาน</span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
                              {checkedIn}
                            </span>
                            <span className="ml-1.5 text-xs text-gray-400">คนสแกนผ่าน</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-gray-300 text-sm">
                              {c.validPending || Math.max(0, sold - checkedIn)}
                            </span>
                            <span className="ml-1 text-[11px] text-gray-500">คนยังไม่เข้า</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500"
                            style={{ width: `${percentCheckedIn}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          สแกนตั๋วด้วยกล้องมือถือสตาฟฟ์หน้าประตู (Gate Scanner)
                        </p>
                      </div>
                    </div>

                    {/* ── Zone-by-Zone Detailed Breakdown Table ── */}
                    <div className="border-t border-white/10 p-5 sm:p-6 bg-[#0a0b10]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Layers size={14} className="text-cyan-300" />
                          <span>แจกแจงตามโซนบัตร ({c.zones?.length || 0} โซน)</span>
                        </h4>
                        <span className="text-[11px] text-gray-500">
                          คลิกดูรายละเอียดราคา ความจุ ยอดขาย และรายได้ของแต่ละโซน
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                              <th className="py-2.5 px-3">ชื่อโซน</th>
                              <th className="py-2.5 px-3">ประเภท</th>
                              <th className="py-2.5 px-3 text-right">ราคา/ใบ</th>
                              <th className="py-2.5 px-3 text-center">ขายแล้ว / ความจุ</th>
                              <th className="py-2.5 px-3 text-center">คงเหลือ</th>
                              <th className="py-2.5 px-3 text-center">สแกนเข้างาน</th>
                              <th className="py-2.5 px-3 text-right">รายได้โซน</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {(c.zoneStats || c.zones || []).map((z, idx) => {
                              const zoneSold = z.sold ?? z._count?.tickets ?? 0;
                              const zoneCap = z.totalCapacity || 1;
                              const zoneAvail = z.available ?? (zoneCap - zoneSold);
                              const zoneRevenue = z.revenue ?? (zoneSold * z.price);
                              const zoneCheckedIn = z.checkedIn ?? 0;

                              return (
                                <tr key={z.id || idx} className="hover:bg-white/[0.02]">
                                  <td className="py-2.5 px-3 font-bold text-white">
                                    {z.name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-gray-300 border border-white/10">
                                      {categoryLabel(z.category)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-cyan-200">
                                    {money(z.price)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono">
                                    <strong className="text-white">{zoneSold}</strong> / {zoneCap} ใบ
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono">
                                    <span className={zoneAvail > 0 ? 'text-emerald-300 font-bold' : 'text-rose-400'}>
                                      {zoneAvail > 0 ? `${zoneAvail} ใบ` : 'บัตรหมด'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-purple-300">
                                    {zoneCheckedIn} คน
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                                    {money(zoneRevenue)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!loading && concerts.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
                  <CalendarDays size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm font-bold text-gray-300">ยังไม่มีคอนเสิร์ตในระบบ</p>
                  <p className="text-xs text-gray-500 mt-1">
                    คลิกแท็บ "+ เพิ่มคอนเสิร์ตใหม่" ด้านบนเพื่อสร้างคอนเสิร์ตแรกของคุณ
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="mt-4 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-bold text-black"
                  >
                    + สร้างคอนเสิร์ตใหม่
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            VIEW 2: SPACIOUS 2-COLUMN NEW CONCERT FORM (NO MORE CRAMPING!)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'create' && (
          <section className="rounded-3xl border border-white/15 bg-[#101018] p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-white">สร้างคอนเสิร์ตและกำหนดโซนบัตรใหม่</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  กรอกข้อมูลงาน วันเวลาแสดง แผนที่สถานที่จัดงาน และกำหนดราคาของแต่ละโซน
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-xs text-gray-400 hover:text-white"
              >
                ✕ ปิดฟอร์ม
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* ── LEFT COLUMN: Basic Info, Date & Map ── */}
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <span>1. ข้อมูลทั่วไปของคอนเสิร์ต</span>
                    </h3>

                    <Field label="ชื่อคอนเสิร์ต" required>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className={inputClass}
                        placeholder="เช่น SOUNDWAVE MUSIC FESTIVAL 2026"
                      />
                    </Field>

                    <Field label="Slug สำหรับ URL (ภาษาอังกฤษ)">
                      <input
                        value={form.slug}
                        onChange={(e) => updateField('slug', e.target.value)}
                        className={inputClass}
                        placeholder="soundwave-festival (เว้นว่างไว้เพื่อสร้างอัตโนมัติ)"
                      />
                    </Field>

                    <Field label="คำอธิบายรายละเอียดคอนเสิร์ต">
                      <textarea
                        rows="3"
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        className={`${inputClass} resize-y`}
                        placeholder="ระบุจุดเด่น แนวเพลง กิจกรรมในงาน หรือสิ่งอำนวยความสะดวก..."
                      />
                    </Field>
                  </div>

                  {/* Clean DateTimePicker with full space */}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <span>2. วันที่และเวลาเริ่มแสดง</span>
                      <span className="text-rose-400">*</span>
                    </h3>
                    <ConcertDateTimePicker
                      value={form.eventDate}
                      onChange={(value) => updateField('eventDate', value)}
                    />
                  </div>

                  {/* Location & Map with full space */}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <MapPin size={16} />
                      <span>3. สถานที่จัดงานและพิกัดแผนที่</span>
                      <span className="text-rose-400">*</span>
                    </h3>
                    <LocationPicker
                      province={form.province}
                      venue={form.venue}
                      location={form.location}
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onProvinceChange={(province) => updateField('province', province)}
                      onVenueChange={(venue) => updateField('venue', venue)}
                      onLocationSelect={({ location, latitude, longitude }) => {
                        setForm((current) => ({ ...current, location, latitude, longitude }));
                      }}
                    />
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Poster & Ticket Zones ── */}
                <div className="space-y-5">
                  {/* Poster Image Upload */}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <span>4. รูปโปสเตอร์คอนเสิร์ต</span>
                      <span className="text-rose-400">*</span>
                    </h3>

                    {/* Preview + Upload Button */}
                    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-4 hover:border-cyan-300/50 transition-all">
                      {posterPreview ? (
                        <div className="relative shrink-0">
                          <img
                            src={posterPreview}
                            alt="ตัวอย่างโปสเตอร์"
                            className="h-28 w-20 rounded-xl object-cover shadow-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPosterPreview('');
                              updateField('bannerUrl', '');
                              setPosterUrlInput('');
                            }}
                            className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-0.5 text-white hover:bg-rose-400"
                            aria-label="ลบรูปโปสเตอร์"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="flex h-28 w-20 items-center justify-center rounded-xl bg-white/5 text-gray-500 border border-white/10">
                          {uploading ? <LoaderCircle className="animate-spin" size={20} /> : <ImagePlus size={22} />}
                        </span>
                      )}
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-white">
                          {uploading ? 'กำลังอัปโหลดรูปภาพ…' : posterPreview ? 'เปลี่ยนรูปโปสเตอร์' : 'เลือกรูปภาพโปสเตอร์งาน'}
                        </span>
                        <span className="mt-1 block text-xs text-gray-400">
                          แนะนำขนาด 4:5 (1000×1250 px) — JPG, PNG, WebP ไม่เกิน 4 MB
                        </span>
                      </div>
                      <Upload size={18} className="text-cyan-300 mr-2" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => startCrop(event, { type: 'poster' })}
                        className="sr-only"
                      />
                    </label>

                    {/* Direct URL paste */}
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                        <Link2 size={13} className="text-cyan-400" />
                        หรือวาง URL รูปภาพโดยตรง
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={posterUrlInput}
                          onChange={(e) => setPosterUrlInput(e.target.value)}
                          className={`${inputClass} flex-1`}
                          placeholder="https://example.com/poster.jpg"
                        />
                        <button
                          type="button"
                          disabled={!posterUrlInput.trim()}
                          onClick={() => {
                            const url = posterUrlInput.trim();
                            if (!url) return;
                            updateField('bannerUrl', url);
                            setPosterPreview(url);
                          }}
                          className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/20 disabled:opacity-40 transition-all"
                        >
                          ใช้ URL นี้
                        </button>
                      </div>
                      {posterPreview && (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Check size={11} /> ตั้งค่ารูปโปสเตอร์แล้ว
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Zones Setup */}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-cyan-300">
                        <span>5. โซนบัตรและความจุ</span>
                        <span className="text-rose-400 ml-1">*</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, zones: [...current.zones, emptyZone()] }))
                        }
                        className="text-xs font-bold text-cyan-300 hover:text-white"
                      >
                        + เพิ่มโซนอีก
                      </button>
                    </div>

                    <div className="space-y-3">
                      {form.zones.map((zone, index) => (
                        <div key={index} className="rounded-xl border border-white/10 bg-[#0c0d14] p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                              โซนที่ {index + 1}
                            </span>
                            {form.zones.length > 1 && (
                              <button
                                type="button"
                                aria-label="ลบโซน"
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    zones: current.zones.filter((_, i) => i !== index),
                                  }))
                                }
                                className="text-gray-500 hover:text-rose-300 text-xs flex items-center gap-1"
                              >
                                <Trash2 size={13} /> ลบโซนนี้
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-gray-400 block mb-1">ชื่อโซน</span>
                              <input
                                required
                                value={zone.name}
                                onChange={(e) => updateZone(index, 'name', e.target.value)}
                                className={inputClass}
                                placeholder="เช่น Standing Pit A"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block mb-1">ประเภทบัตร</span>
                              {/* Category Preset Chips */}
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {PRESET_CATEGORIES.map((preset) => {
                                  const isActive = zone.category === preset.value;
                                  return (
                                    <button
                                      key={preset.value}
                                      type="button"
                                      onClick={() => {
                                        updateZone(index, 'category', preset.value);
                                        setCustomCatInputs((prev) => ({ ...prev, [index]: '' }));
                                      }}
                                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                                        isActive
                                          ? 'border-cyan-300 bg-cyan-300 text-black shadow-md'
                                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/25 hover:bg-white/10'
                                      }`}
                                    >
                                      {preset.emoji} {preset.label}
                                    </button>
                                  );
                                })}
                              </div>
                              {/* Custom category input */}
                              <div className="flex items-center gap-1.5">
                                <PenLine size={12} className="text-gray-500 shrink-0" />
                                <input
                                  type="text"
                                  value={customCatInputs[index] ?? (PRESET_CATEGORIES.some(p => p.value === zone.category) ? '' : zone.category)}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomCatInputs((prev) => ({ ...prev, [index]: val }));
                                    if (val.trim()) updateZone(index, 'category', val.trim().toUpperCase().replace(/\s+/g, '_'));
                                  }}
                                  className={`${inputClass} text-[11px]`}
                                  placeholder="หรือพิมพ์ประเภทเอง เช่น FESTIVAL_GA"
                                />
                              </div>
                              {zone.category && !PRESET_CATEGORIES.some((p) => p.value === zone.category) && (
                                <p className="mt-1 text-[10px] text-cyan-300 font-mono">
                                  ✎ Custom: {zone.category}
                                </p>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block mb-1">ราคา (บาท)</span>
                              <input
                                required
                                min="0"
                                type="number"
                                value={zone.price}
                                onChange={(e) => updateZone(index, 'price', e.target.value)}
                                className={inputClass}
                                placeholder="เช่น 2500"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block mb-1">จำนวนบัตรทั้งหมด</span>
                              <input
                                required
                                min="1"
                                type="number"
                                value={zone.capacity}
                                onChange={(e) => updateZone(index, 'capacity', e.target.value)}
                                className={inputClass}
                                placeholder="เช่น 500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      disabled={saving || uploading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 py-4 text-sm font-black text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 shadow-xl shadow-cyan-400/20"
                    >
                      {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}
                      <span>{saving ? 'กำลังบันทึกคอนเสิร์ต…' : 'สร้างและเผยแพร่คอนเสิร์ต'}</span>
                    </button>
                    <p className="mt-2 text-center text-[11px] text-gray-500">
                      หลังจากสร้างคอนเสิร์ตแล้ว คุณสามารถเพิ่มรายชื่อศิลปินในหน้ารายงานได้ทันที
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}
      </div>

      {/* Artist Editor Modal */}
      {artistEditor && (
        <ArtistEditorModal
          editor={artistEditor}
          error={error}
          onClose={() => setArtistEditor(null)}
          onAdd={() =>
            setArtistEditor((current) => ({
              ...current,
              artists: [...current.artists, { name: '', genre: '', time: '', stage: 'Main Stage', image: '' }],
            }))
          }
          onRemove={(index) =>
            setArtistEditor((current) => ({
              ...current,
              artists: current.artists.filter((_, artistIndex) => artistIndex !== index),
            }))
          }
          onUpdate={updateArtist}
          onSave={saveArtists}
          saving={saving}
          uploading={uploading}
          onPhoto={(event, index) => startCrop(event, { type: 'artist', index })}
        />
      )}

      {cropFile && (
        <CropImageModal
          file={cropFile}
          initialRatio={cropTarget?.type === 'artist' ? 'square' : 'poster'}
          onCancel={() => {
            setCropFile(null);
            setCropTarget(null);
          }}
          onApply={uploadCroppedImage}
        />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60 transition-all';

function Field({ label, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-300">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatCard({ label, value, detail, subTag, icon: Icon, color = 'text-cyan-300' }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#101018] p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400">{label}</p>
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-black text-white font-mono">{value}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-2">
        <span>{detail}</span>
        {subTag && <span className="font-semibold text-cyan-200">{subTag}</span>}
      </div>
    </article>
  );
}

function ArtistEditorModal({ editor, error, onClose, onAdd, onRemove, onUpdate, onSave, saving, uploading, onPhoto }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="artist-modal-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#111119] shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-300">Artist studio</p>
            <h2 id="artist-modal-title" className="mt-1 text-xl font-black">
              รายชื่อศิลปิน · {editor.name}
            </h2>
            <p className="mt-1 text-xs text-gray-400">เพิ่มชื่อ เวที เวลา แนวเพลง และครอบตัดรูปศิลปินได้</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {!editor.artists.length && (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-gray-500">
              ยังไม่มีศิลปิน เพิ่มรายชื่อแรกได้เลย
            </div>
          )}
          {editor.artists.map((artist, index) => (
            <article key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5 border border-white/10">
                  {artist.image ? (
                    <img src={artist.image} alt={`รูป ${artist.name || 'ศิลปิน'}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-pink-200">
                      <Mic2 size={21} />
                    </span>
                  )}
                </div>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input
                    value={artist.name}
                    onChange={(event) => onUpdate(index, 'name', event.target.value)}
                    className={inputClass}
                    placeholder="ชื่อศิลปิน"
                  />
                  <input
                    value={artist.stage}
                    onChange={(event) => onUpdate(index, 'stage', event.target.value)}
                    className={inputClass}
                    placeholder="ชื่อเวที"
                  />
                  <input
                    value={artist.genre}
                    onChange={(event) => onUpdate(index, 'genre', event.target.value)}
                    className={inputClass}
                    placeholder="แนวเพลง (ไม่บังคับ)"
                  />
                  <input
                    value={artist.time}
                    onChange={(event) => onUpdate(index, 'time', event.target.value)}
                    className={inputClass}
                    placeholder="เวลาแสดง เช่น 19:00–20:00 น."
                  />
                  {/* Artist image URL paste */}
                  <div className="sm:col-span-2 flex gap-2 items-center">
                    <Link2 size={13} className="text-gray-500 shrink-0" />
                    <input
                      type="url"
                      value={artist.imageUrl ?? ''}
                      onChange={(event) => onUpdate(index, 'imageUrl', event.target.value)}
                      className={`${inputClass} flex-1 text-[11px]`}
                      placeholder="วาง URL รูปศิลปิน (ถ้าไม่ต้องการอัปโหลดไฟล์)"
                    />
                    {artist.imageUrl?.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate(index, 'image', artist.imageUrl.trim());
                          onUpdate(index, 'imageUrl', '');
                        }}
                        className="shrink-0 rounded-lg border border-pink-300/30 bg-pink-300/10 px-2.5 py-1.5 text-[10px] font-bold text-pink-200 hover:bg-pink-300/20 transition-all"
                      >
                        ใช้ URL นี้
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] font-semibold text-gray-300 hover:bg-white/5">
                    <Upload size={12} />
                    <span>อัปโหลดรูป</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => onPhoto(event, index)}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label="ลบศิลปิน"
                    className="rounded-lg border border-white/10 px-2.5 py-2 text-gray-500 hover:text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
        </div>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl border border-pink-200/20 px-4 py-2 text-xs font-bold text-pink-100 hover:bg-pink-200/5"
          >
            + เพิ่มศิลปิน
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || uploading}
              className="rounded-xl bg-pink-300 px-4 py-2 text-xs font-black text-black hover:bg-pink-200 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึกรายชื่อ'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
