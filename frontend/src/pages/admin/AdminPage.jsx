import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Lock,
  Eye,
  EyeOff,
  Unlock,
  Settings2,
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
  schedule: [{ time: '', stage: 'Main Stage', artist: '' }],
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

async function getOrganizerSession() {
  try {
    const saved = JSON.parse(localStorage.getItem('soundwave_organizer') || 'null');
    if (saved?.sessionToken) return saved;
  } catch {
    localStorage.removeItem('soundwave_organizer');
  }
  throw new Error('กรุณาเข้าสู่ระบบด้วยบัญชี Supervisor ที่หน้า /scanner ก่อนเปิด Admin');
}

async function api(path, options = {}) {
  const session = await getOrganizerSession();
  const response = await fetch(`/api/admin${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${session.sessionToken}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    const error = new Error(result.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    error.status = response.status;
    throw error;
  }
  return result.data;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('soundwave_organizer') || 'null'); }
    catch { localStorage.removeItem('soundwave_organizer'); return null; }
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'create'
  const [stats, setStats] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [kpiDetail, setKpiDetail] = useState(null);
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
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [expandedConcerts, setExpandedConcerts] = useState({});
  // Per-zone custom category text input state: { [zoneIndex]: string }
  const [customCatInputs, setCustomCatInputs] = useState({});

  // ── Seat Management State ────────────────────────────────────────────────────
  const [zoneSeatsModal, setZoneSeatsModal] = useState(null); // { zoneId, zoneName, data }
  const [zoneSeatsLoading, setZoneSeatsLoading] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null); // ticket object
  const [editSeatInput, setEditSeatInput] = useState('');
  const [editNameInput, setEditNameInput] = useState('');
  const [blockSeatInput, setBlockSeatInput] = useState('');
  const [blockNameInput, setBlockNameInput] = useState('');
  const [capacityEditInput, setCapacityEditInput] = useState('');
  const [zonePriceEditInput, setZonePriceEditInput] = useState('');
  const [seatActionLoading, setSeatActionLoading] = useState(false);
  const [seatActionError, setSeatActionError] = useState('');

  const toggleExpand = (id) => {
    setExpandedConcerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const askConfirm = (title, message, onConfirm) => setConfirmDialog({ title, message, onConfirm });

  // ── Seat Management Functions ────────────────────────────────────────────────
  const openZoneSeats = async (zoneId, zoneName) => {
    setZoneSeatsLoading(true);
    setSeatActionError('');
    try {
      const data = await api(`/zones/${zoneId}/seats`);
      setZoneSeatsModal({ zoneId, zoneName, data });
      setCapacityEditInput(String(data.zone?.totalCapacity || ''));
      setZonePriceEditInput(String(data.zone?.price ?? ''));
      setBlockSeatInput('');
      setBlockNameInput('');
      setEditingTicket(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setZoneSeatsLoading(false);
    }
  };

  const refreshZoneSeats = async () => {
    if (!zoneSeatsModal) return;
    try {
      const data = await api(`/zones/${zoneSeatsModal.zoneId}/seats`);
      setZoneSeatsModal((prev) => ({ ...prev, data }));
    } catch (err) {
      setSeatActionError(err.message);
    }
  };

  const handleBlockSeat = async () => {
    if (!zoneSeatsModal || !blockSeatInput.trim()) return;
    setSeatActionLoading(true);
    setSeatActionError('');
    try {
      await api(`/zones/${zoneSeatsModal.zoneId}/seats/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: blockSeatInput.trim(), attendeeName: blockNameInput.trim() || 'ล็อกโดยแอดมิน' }),
      });
      setBlockSeatInput('');
      setBlockNameInput('');
      await refreshZoneSeats();
    } catch (err) {
      setSeatActionError(err.message);
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('ยืนยันบันทึกการคืนเงินและยกเลิกตั๋ว? ระบบนี้บันทึกสถานะคืนเงินเท่านั้น ไม่ได้โอนเงินกลับผ่านธนาคาร')) return;
    setSeatActionLoading(true);
    setSeatActionError('');
    try {
      await api(`/tickets/${ticketId}/refund`, { method: 'POST' });
      await refreshZoneSeats();
      if (editingTicket?.id === ticketId) setEditingTicket(null);
    } catch (err) {
      setSeatActionError(err.message);
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleEditTicket = async () => {
    if (!editingTicket) return;
    setSeatActionLoading(true);
    setSeatActionError('');
    try {
      await api(`/tickets/${editingTicket.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: editSeatInput.trim(), attendeeName: editNameInput.trim() }),
      });
      setEditingTicket(null);
      await refreshZoneSeats();
    } catch (err) {
      setSeatActionError(err.message);
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleUpdateCapacity = async () => {
    if (!zoneSeatsModal || !capacityEditInput) return;
    const cap = parseInt(capacityEditInput, 10);
    if (isNaN(cap) || cap < 1) { setSeatActionError('ความจุต้องเป็นตัวเลขมากกว่า 0'); return; }
    setSeatActionLoading(true);
    setSeatActionError('');
    try {
      await api(`/zones/${zoneSeatsModal.zoneId}/capacity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalCapacity: cap, price: Number(zonePriceEditInput) }),
      });
      await refreshZoneSeats();
      await loadDashboard();
    } catch (err) {
      setSeatActionError(err.message);
    } finally {
      setSeatActionLoading(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, eventList, bookingList] = await Promise.all([api('/stats'), api('/concerts'), api('/bookings')]);
      setStats(summary);
      setConcerts(eventList);
      setBookings(bookingList);
      setError('');
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('soundwave_organizer');
        setOrganizer(null);
        setLoginError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบเจ้าของงานอีกครั้ง');
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (organizer?.sessionToken) loadDashboard();
    else setLoading(false);
  }, [loadDashboard, organizer]);

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
          scheduleJson: JSON.stringify(form.schedule.filter((item) => item.time && item.artist.trim())),
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
  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    if (bookingFilter === 'paid') return ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(booking.status);
    if (bookingFilter === 'checked-in') return booking.tickets?.some((ticket) => ticket.status === 'USED');
    return true;
  }), [bookings, bookingFilter]);

  const showBookingDetails = (filter) => {
    setBookingFilter(filter);
    setKpiDetail(filter === 'checked-in' ? 'checked-in' : 'sales');
  };

  const handleOrganizerLogin = async (event) => {
    event.preventDefault();
    if (!loginUsername.trim() || !loginPassword) { setLoginError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`/api/organizer/${loginMode === 'forgot' ? 'forgot-password' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
      if (loginMode === 'forgot') { setLoginMode('login'); setLoginPassword(''); setLoginError(result.message); return; }
      const session = { ...result.organizer, sessionToken: result.token, expiresAt: result.expiresAt };
      localStorage.setItem('soundwave_organizer', JSON.stringify(session));
      setOrganizer(session);
      setLoginPassword('');
      setError('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOrganizerLogout = async () => {
    try {
      if (organizer?.sessionToken) {
        await fetch('/api/organizer/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${organizer.sessionToken}` },
        });
      }
    } catch {
      // Clear the local session even if the backend is temporarily unavailable.
    } finally {
      localStorage.removeItem('soundwave_organizer');
      setOrganizer(null);
      setStats(null);
      setConcerts([]);
      setBookings([]);
    }
  };

  if (!organizer?.sessionToken) {
    return (
      <div className="min-h-screen bg-[#07070c] px-4 py-12 text-white sm:px-6">
        <section className="mx-auto max-w-md rounded-3xl border border-white/15 bg-[#101018] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><Lock size={20} /></span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Organizer Portal</p>
            <h1 className="mt-1 text-2xl font-black">เข้าสู่ระบบเจ้าของงาน</h1>
            <p className="mt-2 text-xs text-gray-400">บัญชีเจ้าของงานแยกจากบัญชีพนักงานสแกนบัตร</p>
          </div>
          {loginError && <div role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3"><p className="text-xs font-bold text-rose-100">เข้าสู่ระบบไม่สำเร็จ</p><p className="mt-1 text-xs leading-5 text-rose-200">{loginError}</p></div>}
          <form noValidate onSubmit={handleOrganizerLogin} className="space-y-4">
            <label className="block space-y-1.5"><span className="text-xs text-gray-300">Username เจ้าของงาน</span><input required autoComplete="username" value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} className={inputClass} /></label>
            <label className="block space-y-1.5"><span className="text-xs text-gray-300">{loginMode === 'forgot' ? 'รหัสผ่านใหม่' : 'Password'}</span><span className="relative block"><input required minLength={loginMode === 'forgot' ? 8 : undefined} type={showLoginPassword ? 'text' : 'password'} autoComplete={loginMode === 'forgot' ? 'new-password' : 'current-password'} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className={`${inputClass} pr-11`} /><button type="button" onClick={() => setShowLoginPassword((value) => !value)} aria-label={showLoginPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200">{showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <button disabled={loginLoading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-black hover:bg-cyan-200 disabled:opacity-50">{loginLoading ? 'กำลังดำเนินการ…' : loginMode === 'forgot' ? 'ตั้งรหัสผ่านใหม่' : 'เข้าสู่ระบบแดชบอร์ด'}</button>
          </form>
          <button type="button" onClick={() => { setLoginMode(loginMode === 'forgot' ? 'login' : 'forgot'); setLoginError(''); }} className="mt-4 w-full text-center text-xs font-bold text-cyan-200 hover:text-white">{loginMode === 'forgot' ? 'กลับเข้าสู่ระบบ' : 'ลืมรหัสผ่านเจ้าของงาน?'}</button>
          <Link to="/" className="mt-5 block text-center text-xs text-gray-400 hover:text-white">กลับหน้าร้าน</Link>
        </section>
      </div>
    );
  }

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
            <button
              type="button"
              onClick={handleOrganizerLogout}
              className="rounded-xl border border-rose-400/20 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/10"
            >
              ออกจากระบบ ({organizer.name})
            </button>
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
            onClick={() => navigate('/admin/insights/sales')}
          />
          <StatCard
            label="รายได้รวมทั้งหมด"
            value={loading ? '—' : money(stats?.revenue)}
            detail={`ราคาเฉลี่ยต่อใบ ${money(stats?.averageTicketPrice || (stats?.totalTickets ? stats.revenue / stats.totalTickets : 0))}`}
            subTag={`${stats?.paidBookings || 0} รายการชำระแล้ว`}
            icon={CircleDollarSign}
            color="text-emerald-300"
            onClick={() => navigate('/admin/insights/revenue')}
          />
          <StatCard
            label="สแกนเข้างานแล้ว (Check-in)"
            value={loading ? '—' : `${(stats?.checkedIn || 0).toLocaleString('th-TH')} คน`}
            detail={`จากตั๋วที่ขายแล้ว ${stats?.totalTickets || 0} ใบ`}
            subTag={`${stats?.totalTickets ? Math.round(((stats?.checkedIn || 0) / stats.totalTickets) * 100) : 0}% เข้างาน`}
            icon={Users}
            color="text-purple-300"
            onClick={() => navigate('/admin/insights/check-in')}
          />
          <StatCard
            label="คอนเสิร์ตในระบบ"
            value={loading ? '—' : `${(stats?.totalConcerts || concerts.length || 0).toLocaleString('th-TH')} งาน`}
            detail={`${stats?.pendingBookings || 0} รายการรอชำระเงิน`}
            subTag="กำลังเปิดจำหน่าย"
            icon={CalendarDays}
            color="text-pink-300"
            onClick={() => navigate('/admin/insights/concerts')}
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
            <div id="concert-reports" className="space-y-6">
              <section className="rounded-3xl border border-cyan-300/15 bg-[#101018] p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-sm font-black text-white">คอนเสิร์ตและไลน์อัปจริงในไทย · 2026</h3><p className="mt-1 text-[11px] text-gray-400">ข้อมูลอ้างอิงจากประกาศผู้จัด ไม่ใช่งานที่ SoundWave Pass เปิดขาย</p></div>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2.5 py-1 text-[10px] text-amber-200">ตรวจสอบ 22 ต.ค. 2026</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h4 className="font-bold text-cyan-200">Tomorrowland Thailand</h4><p className="mt-1 text-xs text-gray-300">11–13 ธ.ค. · Wisdom Valley, ชลบุรี</p>
                    <p className="mt-2 text-xs leading-5 text-gray-400">ไลน์อัปที่ประกาศแล้ว เช่น Alan Walker, Martin Garrix, Vini Vici, John Newman และ Aly & Fila</p>
                    <a href="https://thailand.tomorrowland.com/en/line-up/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-200 hover:text-white">ดูไลน์อัปทางการ <ExternalLink size={12} /></a>
                  </article>
                  <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h4 className="font-bold text-pink-200">EDC Thailand</h4><p className="mt-1 text-xs text-gray-300">18–20 ธ.ค. · Rhythm Park, ภูเก็ต</p>
                    <p className="mt-2 text-xs leading-5 text-gray-400">ไลน์อัปที่ประกาศแล้ว เช่น Martin Garrix, DJ Snake, Charlotte de Witte, Above & Beyond และ Tiësto</p>
                    <a href="https://thailand.edc.com/en/lineup/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-pink-200 hover:text-white">ดูไลน์อัปทางการ <ExternalLink size={12} /></a>
                  </article>
                </div>
              </section>
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
                              <th className="py-2.5 px-3 text-center">จัดการที่นั่ง</th>
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
                                  <td className="py-2.5 px-3 text-center">
                                    <button type="button" onClick={() => openZoneSeats(z.id, z.name)} className="rounded-lg border border-cyan-300/25 px-2.5 py-1.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-300/10">
                                      แก้ไขที่นั่ง
                                    </button>
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

            <section id="recent-bookings" className="rounded-3xl border border-white/10 bg-[#101018] p-5 sm:p-6 scroll-mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-white">รายการจองล่าสุด</h2>
                  <p className="mt-1 text-xs text-gray-400">แสดงรายการล่าสุดไม่เกิน 50 รายการ พร้อมสถานะชำระเงินและการส่งตั๋ว LINE</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={bookingFilter} onChange={(event) => setBookingFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#09090f] px-2.5 py-1.5 text-[11px] text-gray-200">
                    <option value="all">ทุกสถานะ</option>
                    <option value="paid">ชำระแล้ว / คืนเงินบางส่วน</option>
                    <option value="checked-in">สแกนเข้างานแล้ว</option>
                  </select>
                  <span className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-gray-300">{filteredBookings.length} / {bookings.length} รายการ</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] font-bold uppercase text-gray-400">
                    <tr>
                      <th className="px-3 py-2.5">รหัสจอง / วันเวลา</th>
                      <th className="px-3 py-2.5">ผู้จอง</th>
                      <th className="px-3 py-2.5">คอนเสิร์ต / โซน</th>
                      <th className="px-3 py-2.5 text-center">จำนวนตั๋ว</th>
                      <th className="px-3 py-2.5 text-right">ยอดรวม</th>
                      <th className="px-3 py-2.5 text-center">ชำระเงิน</th>
                      <th className="px-3 py-2.5 text-center">ส่ง LINE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map((booking) => {
                      const activeTicketCount = booking.tickets?.filter((ticket) => ['VALID', 'USED'].includes(ticket.status)).length;
                      const quantity = activeTicketCount ?? booking.items?.reduce((sum, item) => sum + item.quantity, 0) ?? booking._count?.tickets ?? 0;
                      const concertNames = [...new Set((booking.items || []).map((item) => item.zone?.concert?.name).filter(Boolean))];
                      const zoneNames = [...new Set((booking.items || []).map((item) => item.zone?.name).filter(Boolean))];
                      const deliveryLabel = booking.lineDeliveryStatus === 'SENT' ? 'ส่งแล้ว' : booking.lineDeliveryStatus === 'FAILED' ? 'ส่งไม่สำเร็จ' : booking.lineDeliveryStatus === 'NOT_LINKED' ? 'ยังไม่เชื่อม' : booking.customerLineId ? 'รอส่ง' : 'ไม่มี LINE';
                      return (
                        <tr key={booking.id} className="align-top hover:bg-white/[0.02]">
                          <td className="px-3 py-3">
                            <div className="font-mono font-bold text-cyan-200">{booking.bookingCode}</div>
                            <div className="mt-1 text-[10px] text-gray-500">{dateLabel(booking.createdAt)}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-white">{booking.customerName}</div>
                            <div className="mt-1 text-[10px] text-gray-400">{booking.customerPhone}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-gray-200">{concertNames.join(', ') || '—'}</div>
                            <div className="mt-1 text-[10px] text-gray-500">{zoneNames.join(', ') || 'ไม่ระบุโซน'}</div>
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-white">{quantity}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-300">{money(booking.totalAmount - (booking.refundedAmount || 0))}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${['PAID', 'PARTIALLY_REFUNDED'].includes(booking.status) ? 'bg-emerald-400/10 text-emerald-300' : booking.status === 'PENDING' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/5 text-gray-400'}`}>{booking.status}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-[10px] font-semibold ${booking.lineDeliveryStatus === 'SENT' ? 'text-emerald-300' : booking.lineDeliveryStatus === 'FAILED' ? 'text-rose-300' : 'text-gray-400'}`}>{deliveryLabel}</span>
                            {booking.lineDeliveryError && <p className="mt-1 max-w-36 text-[10px] text-rose-300">{booking.lineDeliveryError}</p>}
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && filteredBookings.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">ยังไม่มีรายการจอง</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-cyan-300">ตารางเวลาแสดง</h3>
                        <p className="mt-1 text-[11px] text-gray-400">เพิ่มเวลา ศิลปิน และเวที เพื่อแสดงกำหนดการในหน้ารายละเอียดงาน</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField('schedule', [...form.schedule, { time: '', stage: 'Main Stage', artist: '' }])}
                        className="shrink-0 rounded-lg border border-cyan-300/30 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/10"
                      >
                        + เพิ่มช่วงเวลา
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.schedule.map((item, index) => (
                        <div key={index} className="grid gap-2 sm:grid-cols-[120px_1fr_1fr_auto]">
                          <input
                            type="time"
                            value={item.time}
                            onChange={(event) => updateField('schedule', form.schedule.map((row, i) => i === index ? { ...row, time: event.target.value } : row))}
                            className={inputClass}
                            aria-label={`เวลาแสดง ${index + 1}`}
                          />
                          <input
                            value={item.artist}
                            onChange={(event) => updateField('schedule', form.schedule.map((row, i) => i === index ? { ...row, artist: event.target.value } : row))}
                            className={inputClass}
                            placeholder="ชื่อศิลปิน"
                          />
                          <input
                            value={item.stage}
                            onChange={(event) => updateField('schedule', form.schedule.map((row, i) => i === index ? { ...row, stage: event.target.value } : row))}
                            className={inputClass}
                            placeholder="เวที เช่น Main Stage"
                          />
                          <button
                            type="button"
                            disabled={form.schedule.length === 1}
                            onClick={() => updateField('schedule', form.schedule.filter((_, i) => i !== index))}
                            className="rounded-lg border border-white/10 px-3 text-gray-400 hover:text-rose-300 disabled:opacity-30"
                            aria-label={`ลบช่วงเวลา ${index + 1}`}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
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
                              askConfirm('ลบรูปโปสเตอร์', 'รูปโปสเตอร์จะถูกนำออกเมื่อกดบันทึก คุณต้องการดำเนินการต่อหรือไม่?', () => { setPosterPreview(''); updateField('bannerUrl', ''); setPosterUrlInput(''); });
                            }}
                            title="ลบรูปโปสเตอร์"
                            className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1 text-white shadow-lg hover:bg-rose-400"
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

      {kpiDetail && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#111119] shadow-2xl">
            <header className="flex items-start justify-between border-b border-white/10 p-5 sm:p-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Dashboard detail</p><h2 className="mt-1 text-xl font-black text-white">{kpiDetail === 'concerts' ? 'รายละเอียดคอนเสิร์ตในระบบ' : kpiDetail === 'checked-in' ? 'รายการผู้เข้างานแล้ว' : 'รายละเอียดตั๋วและยอดขาย'}</h2><p className="mt-1 text-xs text-gray-400">ข้อมูลล่าสุดจากระบบจองตั๋ว</p></div>
              <button type="button" onClick={() => setKpiDetail(null)} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </header>
            <div className="overflow-y-auto p-5 sm:p-6">
              {kpiDetail === 'concerts' && <div className="grid gap-4 sm:grid-cols-2">{concerts.map((concert) => <article key={concert.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="font-bold text-white">{concert.name}</h3><p className="mt-1 text-[11px] text-gray-400">{dateLabel(concert.eventDate)} · {concert.location || concert.venue || 'ไม่ระบุสถานที่'}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-lg font-black text-cyan-200">{concert.totalTicketsSold || 0}</p><p className="text-[10px] text-gray-500">ขายแล้ว</p></div><div><p className="text-lg font-black text-emerald-200">{concert.totalAvailable || 0}</p><p className="text-[10px] text-gray-500">คงเหลือ</p></div><div><p className="text-lg font-black text-purple-200">{concert.checkedIn || 0}</p><p className="text-[10px] text-gray-500">เช็กอิน</p></div></div></article>)}</div>}
              {kpiDetail !== 'concerts' && <div className="space-y-3">{(kpiDetail === 'checked-in' ? bookings.filter((booking) => booking.tickets?.some((ticket) => ticket.status === 'USED')) : bookings.filter((booking) => ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(booking.status))).map((booking) => <article key={booking.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono font-bold text-cyan-200">{booking.bookingCode}</p><p className="mt-1 text-xs text-white">{booking.customerName}</p></div><div className="text-right"><p className="font-mono font-bold text-emerald-200">{money(booking.totalAmount - (booking.refundedAmount || 0))}</p><p className="text-[10px] text-gray-400">{booking.tickets?.filter((ticket) => ['VALID', 'USED'].includes(ticket.status)).length || 0} ใบ · {booking.status}</p></div></div>{kpiDetail === 'checked-in' && <div className="mt-3 flex flex-wrap gap-2">{booking.tickets.filter((ticket) => ticket.status === 'USED').map((ticket) => <span key={ticket.id} className="rounded-lg bg-purple-400/10 px-2.5 py-1 text-[11px] text-purple-200">{ticket.ticketCode} · {ticket.attendeeName}</span>)}</div>}</article>)}{(kpiDetail === 'checked-in' ? bookings.filter((booking) => booking.tickets?.some((ticket) => ticket.status === 'USED')) : bookings.filter((booking) => ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(booking.status))).length === 0 && <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-gray-500">ยังไม่มีข้อมูลรายการ</div>}</div>}
            </div>
          </section>
        </div>
      )}

      {zoneSeatsModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="zone-seats-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#111119] shadow-2xl">
            <header className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Inventory & tickets</p>
                <h2 id="zone-seats-title" className="mt-1 text-xl font-black text-white">จัดการที่นั่ง · {zoneSeatsModal.zoneName}</h2>
                <p className="mt-1 text-xs text-gray-400">{zoneSeatsModal.data.zone?.concert?.name}</p>
              </div>
              <button type="button" onClick={() => setZoneSeatsModal(null)} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </header>
            <div className="space-y-5 overflow-y-auto p-5">
              {seatActionError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{seatActionError}</p>}
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <label className="text-xs text-gray-300">ความจุทั้งหมด
                  <input type="number" min="1" value={capacityEditInput} onChange={(event) => setCapacityEditInput(event.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <label className="text-xs text-gray-300">ราคาต่อใบ (บาท)
                  <input type="number" min="0" value={zonePriceEditInput} onChange={(event) => setZonePriceEditInput(event.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <button type="button" disabled={seatActionLoading} onClick={handleUpdateCapacity} className="self-end rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-black disabled:opacity-50">บันทึกความจุ / ราคา</button>
              </div>
              <p className="text-[11px] text-gray-500">ขายหรือสำรองแล้ว {Math.max(0, (zoneSeatsModal.data.zone?.totalCapacity || 0) - (zoneSeatsModal.data.zone?.available || 0))} ใบ · คงเหลือ {zoneSeatsModal.data.zone?.available ?? 0} ใบ · ไม่สามารถตั้งความจุต่ำกว่าที่ถูกใช้แล้ว</p>
              <form onSubmit={(event) => { event.preventDefault(); handleBlockSeat(); }} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input required value={blockSeatInput} onChange={(event) => setBlockSeatInput(event.target.value)} className={inputClass} placeholder="เลขที่นั่ง เช่น A-12" />
                <input value={blockNameInput} onChange={(event) => setBlockNameInput(event.target.value)} className={inputClass} placeholder="ชื่อผู้ถือ / เหตุผลสำรอง" />
                <button type="submit" disabled={seatActionLoading} className="rounded-xl border border-cyan-300/30 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/10 disabled:opacity-50">สำรองที่นั่ง</button>
              </form>
              {zoneSeatsModal.data.activePending?.length > 0 && <p className="text-xs text-amber-200">มี {zoneSeatsModal.data.activePending.length} รายการจองที่กำลังรอชำระเงิน ระบบกันจำนวนที่นั่งไว้ชั่วคราว</p>}
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-white/[0.04] text-[10px] uppercase text-gray-400"><tr><th className="p-3">รหัสตั๋ว</th><th className="p-3">ผู้ถือ</th><th className="p-3">ที่นั่ง</th><th className="p-3">สถานะ</th><th className="p-3 text-right">จัดการ</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {(zoneSeatsModal.data.tickets || []).map((ticket) => (
                      <tr key={ticket.id} className="text-gray-200">
                        <td className="p-3 font-mono text-cyan-200">{ticket.ticketCode}<div className="mt-1 text-[10px] text-gray-500">{ticket.booking?.bookingCode}</div></td>
                        <td className="p-3">{editingTicket?.id === ticket.id ? <input value={editNameInput} onChange={(event) => setEditNameInput(event.target.value)} className={inputClass} /> : ticket.attendeeName}</td>
                        <td className="p-3">{editingTicket?.id === ticket.id ? <input value={editSeatInput} onChange={(event) => setEditSeatInput(event.target.value)} className={`${inputClass} max-w-28`} placeholder="ไม่ระบุ" /> : (ticket.seatNumber || 'ไม่ระบุ')}</td>
                        <td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${ticket.status === 'USED' ? 'bg-purple-400/10 text-purple-200' : ticket.status === 'VALID' ? 'bg-emerald-400/10 text-emerald-200' : ticket.status === 'RESERVED' ? 'bg-amber-400/10 text-amber-200' : 'bg-white/5 text-gray-400'}`}>{ticket.status === 'RESERVED' ? 'สำรอง' : ticket.status}</span></td>
                        <td className="p-3 text-right">
                          {editingTicket?.id === ticket.id ? <div className="flex justify-end gap-2"><button type="button" disabled={seatActionLoading} onClick={handleEditTicket} className="text-emerald-300">บันทึก</button><button type="button" onClick={() => setEditingTicket(null)} className="text-gray-400">ยกเลิก</button></div> : ticket.status === 'VALID' || ticket.status === 'RESERVED' ? <div className="flex justify-end gap-3"><button type="button" onClick={() => { setEditingTicket(ticket); setEditNameInput(ticket.attendeeName); setEditSeatInput(ticket.seatNumber || ''); }} className="text-cyan-200">แก้ข้อมูล</button>{ticket.status === 'VALID' ? <button type="button" disabled={seatActionLoading} onClick={() => handleCancelTicket(ticket.id)} className="text-rose-300">คืนเงิน / ยกเลิก</button> : <button type="button" disabled={seatActionLoading} onClick={async () => { if (!window.confirm('ยืนยันปลดที่นั่งสำรองนี้?')) return; setSeatActionLoading(true); setSeatActionError(''); try { await api(`/tickets/${ticket.id}/release-reservation`, { method: 'POST' }); await refreshZoneSeats(); await loadDashboard(); } catch (err) { setSeatActionError(err.message); } finally { setSeatActionLoading(false); } }} className="text-amber-200">ปลดสำรอง</button>}</div> : <span className="text-gray-600">—</span>}
                        </td>
                      </tr>
                    ))}
                    {!zoneSeatsLoading && !(zoneSeatsModal.data.tickets || []).length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">ยังไม่มีตั๋วในโซนนี้</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-500">การคืนเงินในหน้าทดลองนี้เป็นการบันทึกสถานะและคืนโควตาบัตรในระบบเท่านั้น ไม่ได้โอนเงินคืนผ่านธนาคาร/PromptPay</p>
            </div>
          </section>
        </div>
      )}

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
            askConfirm('ลบศิลปินออกจากงาน', `ต้องการลบ ${artistEditor.artists[index]?.name || 'ศิลปินคนนี้'} ออกจากรายชื่อใช่หรือไม่?`, () => setArtistEditor((current) => ({ ...current, artists: current.artists.filter((_, artistIndex) => artistIndex !== index) })))
          }
          onDeleteImage={(index) => askConfirm('ลบรูปศิลปิน', `ต้องการลบรูปของ ${artistEditor.artists[index]?.name || 'ศิลปินคนนี้'} ใช่หรือไม่?`, () => { updateArtist(index, 'image', ''); updateArtist(index, 'imageUrl', ''); })}
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
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#151521] p-6 shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-400/10 text-rose-300"><Trash2 size={22} /></div>
            <h2 className="mt-4 text-center text-lg font-black text-white">{confirmDialog.title}</h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-400">{confirmDialog.message}</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setConfirmDialog(null)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/5">ยกเลิก</button><button type="button" onClick={() => { const action = confirmDialog.onConfirm; setConfirmDialog(null); action(); }} className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-400">ยืนยันการลบ</button></div>
          </section>
        </div>
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

function StatCard({ label, value, detail, subTag, icon: Icon, color = 'text-cyan-300', onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-2xl border border-white/10 bg-[#101018] p-5 text-left shadow-lg transition hover:border-white/20 hover:bg-[#14141e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
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
      {onClick && <p className="mt-2 text-[10px] text-gray-500">לחץเพื่อดูรายละเอียด</p>}
    </button>
  );
}

function ArtistEditorModal({ editor, error, onClose, onAdd, onRemove, onDeleteImage, onUpdate, onSave, saving, uploading, onPhoto }) {
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
                  {artist.image && <button type="button" onClick={() => onDeleteImage(index)} aria-label="ลบรูปศิลปิน" title="ลบรูปศิลปิน" className="absolute right-1 top-1 rounded-full bg-rose-500/90 p-1 text-white shadow-lg hover:bg-rose-400"><X size={11} /></button>}
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
                    title="ลบศิลปิน"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-rose-400/20 bg-rose-400/5 p-0 text-gray-500 hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-300"
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
