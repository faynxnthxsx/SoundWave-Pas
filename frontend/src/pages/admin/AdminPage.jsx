import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
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
  TrendingUp,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Link2,
  X,
  PenLine,
  Lock,
  Eye,
  EyeOff,
  Search,
  Copy,
  Send,
  Download,
  Armchair,
  FileSpreadsheet,
  Play,
  Pause,
  StopCircle,
  Radar,
} from 'lucide-react';
import CropImageModal from '../../components/CropImageModal';
import LocationPicker from '../../components/LocationPicker';
import ConcertDateTimePicker from '../../components/ConcertDateTimePicker';
import AdminSeatMapModal from '../../components/AdminSeatMapModal';
import ConcertDiscoveryModal from '../../components/ConcertDiscoveryModal';
import EditConcertModal from '../../components/EditConcertModal';
import BookingTicketsModal from '../../components/BookingTicketsModal';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../context/LanguageContext';

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
  return result.data ?? result;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lang, t, trData } = useLanguage();

  const dateLabel = useCallback((date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (lang === 'en') {
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} · ${timeStr}`;
    }
    const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} · ${timeStr} น.`;
  }, [lang]);

  const categoryLabel = useCallback((cat) => {
    if (!cat) return '—';
    const preset = PRESET_CATEGORIES.find((p) => p.value === cat);
    return preset ? `${preset.emoji} ${trData(preset.label)}` : cat;
  }, [trData]);

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

  // 3 Core Tabs + Create Sub-view:
  // 'overview' = 📊 ภาพรวม & ยอดขาย
  // 'events'   = 🎸 คอนเสิร์ต & ผังที่นั่ง
  // 'orders'   = 🧾 รายการจอง & ตั๋วลูกค้า
  // 'create'   = + เพิ่มคอนเสิร์ตใหม่
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');

  // Universal Quick Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Image states
  const [form, setForm] = useState(emptyForm);
  const [posterPreview, setPosterPreview] = useState('');
  const [posterUrlInput, setPosterUrlInput] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [artistEditor, setArtistEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [expandedConcerts, setExpandedConcerts] = useState({});
  const [customCatInputs, setCustomCatInputs] = useState({});

  // Seat Management Modal state
  const [zoneSeatsModal, setZoneSeatsModal] = useState(null); // { zone, tickets, activePending }
  const [lineResendingId, setLineResendingId] = useState(null);

  // Discovery Radar Modal state
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [discoveryPendingCount, setDiscoveryPendingCount] = useState(0);

  // Edit Concert Modal state
  const [editConcertModal, setEditConcertModal] = useState(null);

  // Booking Individual Tickets Modal state
  const [viewBookingTickets, setViewBookingTickets] = useState(null);

  const toggleExpand = (id) => {
    setExpandedConcerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const askConfirm = (title, message, onConfirm) => setConfirmDialog({ title, message, onConfirm });

  // ── Load Dashboard Data ───────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, eventList, bookingList, discoveryData] = await Promise.all([
        api('/stats'),
        api('/concerts'),
        api('/bookings'),
        api('/discovery').catch(() => null),
      ]);
      setStats(summary);
      setConcerts(eventList);
      setBookings(bookingList);
      if (discoveryData?.pendingCount !== undefined) {
        setDiscoveryPendingCount(discoveryData.pendingCount);
      }
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('soundwave_organizer');
        setOrganizer(null);
        setLoginError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบเจ้าของงานอีกครั้ง');
      }
      toast.error(err.message || 'โหลดข้อมูลล้มเหลว');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (organizer?.sessionToken) loadDashboard();
    else setLoading(false);
  }, [loadDashboard, organizer]);

  // ── Seat Management Open / Refresh ────────────────────────────────────────
  const openZoneSeats = async (zoneId) => {
    try {
      const data = await api(`/zones/${zoneId}/seats`);
      setZoneSeatsModal(data);
    } catch (err) {
      toast.error(err.message || 'ไม่สามารถโหลดข้อมูลที่นั่งได้');
    }
  };

  const refreshZoneSeats = async () => {
    if (!zoneSeatsModal?.zone?.id) return;
    try {
      const data = await api(`/zones/${zoneSeatsModal.zone.id}/seats`);
      setZoneSeatsModal(data);
      // Also refresh dashboard in background
      const [summary, eventList] = await Promise.all([api('/stats'), api('/concerts')]);
      setStats(summary);
      setConcerts(eventList);
    } catch (err) {
      console.warn('Failed to refresh zone seats:', err);
    }
  };

  // ── Sales Toggle Switch: Concert Status (ON_SALE / PAUSED / CLOSED) ───────
  const handleToggleConcertStatus = async (concertId, newStatus) => {
    try {
      await api(`/concerts/${concertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const statusLabels = {
        ON_SALE: 'เปิดจำหน่ายบัตร (ON_SALE)',
        PAUSED: 'พักการจำหน่ายชั่วคราว (PAUSED)',
        CLOSED: 'ปิดการจำหน่าย (CLOSED)',
        UPCOMING: 'เร็วๆ นี้ (UPCOMING)',
        COMPLETED: 'จบงานแล้ว (COMPLETED)',
      };
      toast.success(`เปลี่ยนสถานะคอนเสิร์ตเป็น "${statusLabels[newStatus] || newStatus}" เรียบร้อยแล้ว`);
      setConcerts((prev) =>
        prev.map((c) => (c.id === concertId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      toast.error(err.message || 'เปลี่ยนสถานะคอนเสิร์ตไม่สำเร็จ');
    }
  };

  // ── Sales Toggle Switch: Zone Level (Active / Paused) ─────────────────────
  const handleToggleZoneActive = async (zoneId, currentActive) => {
    try {
      const res = await api(`/zones/${zoneId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      toast.success(res.message || 'เปลี่ยนสถานะโซนสำเร็จ');
      setConcerts((prev) =>
        prev.map((c) => ({
          ...c,
          zones: (c.zones || []).map((z) => (z.id === zoneId ? { ...z, isActive: !currentActive } : z)),
          zoneStats: (c.zoneStats || []).map((z) => (z.id === zoneId ? { ...z, isActive: !currentActive } : z)),
        }))
      );
    } catch (err) {
      toast.error(err.message || 'เปลี่ยนสถานะโซนไม่สำเร็จ');
    }
  };

  // ── Quick Action: Copy Store Link ─────────────────────────────────────────
  const handleCopyStoreLink = (concert) => {
    const url = `${window.location.origin}/concerts/${concert.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(`คัดลอกลิงก์ร้านคอนเสิร์ต "${concert.name}" แล้ว พร้อมส่งต่อให้ลูกค้า!`);
    } else {
      toast.info(`ลิงก์ร้านค้า: ${url}`);
    }
  };

  // ── Quick Action: Resend Ticket to LINE ────────────────────────────────────
  const handleResendLineTicket = async (booking) => {
    if (!booking.customerLineId) {
      toast.warning('รายการจองนี้ไม่มี LINE ID ของลูกค้า');
      return;
    }
    setLineResendingId(booking.id);
    try {
      await api(`/bookings/${booking.id}/resend-line`, { method: 'POST' });
      toast.success(`ส่งตั๋วเข้า LINE ลูกค้า (${booking.customerName}) สำเร็จแล้ว!`);
      await loadDashboard();
    } catch (err) {
      toast.error(err.message || 'ส่งตั๋วเข้า LINE ไม่สำเร็จ');
    } finally {
      setLineResendingId(null);
    }
  };

  // ── Quick Action: Export Attendees CSV ────────────────────────────────────
  const handleExportCSV = (targetConcertId = null) => {
    const exportTickets = [];
    bookings.forEach((b) => {
      (b.tickets || []).forEach((t) => {
        const item = b.items?.find((i) => i.zoneId === t.zoneId);
        const concert = item?.zone?.concert;
        if (!targetConcertId || concert?.id === targetConcertId) {
          exportTickets.push({
            ticketCode: t.ticketCode,
            concertName: concert?.name || 'SoundWave Live',
            zoneName: item?.zone?.name || '—',
            category: item?.zone?.category || '—',
            seatNumber: t.seatNumber || 'N/A',
            attendeeName: t.attendeeName,
            customerPhone: b.customerPhone || '—',
            bookingCode: b.bookingCode,
            totalAmount: b.totalAmount,
            bookingStatus: b.status,
            ticketStatus: t.status,
            checkedIn: t.status === 'USED' ? 'YES' : 'NO',
            usedAt: t.usedAt ? new Date(t.usedAt).toLocaleString('th-TH') : '—',
            createdAt: new Date(b.createdAt).toLocaleString('th-TH'),
          });
        }
      });
    });

    if (exportTickets.length === 0) {
      toast.info('ยังไม่มีข้อมูลผู้ถือตั๋วสำหรับส่งออก');
      return;
    }

    const headers = [
      'รหัสตั๋ว',
      'คอนเสิร์ต',
      'โซน',
      'ประเภทบัตร',
      'ที่นั่ง',
      'ชื่อผู้ถือตั๋ว',
      'เบอร์โทรศัพท์',
      'รหัสการจอง',
      'ยอดชำระ',
      'สถานะจอง',
      'สถานะตั๋ว',
      'สแกนเข้างาน',
      'เวลาสแกน',
      'วันเวลาที่จอง',
    ];

    const csvRows = exportTickets.map((row) =>
      [
        `"${row.ticketCode}"`,
        `"${row.concertName.replace(/"/g, '""')}"`,
        `"${row.zoneName.replace(/"/g, '""')}"`,
        `"${row.category}"`,
        `"${row.seatNumber}"`,
        `"${row.attendeeName.replace(/"/g, '""')}"`,
        `"${row.customerPhone}"`,
        `"${row.bookingCode}"`,
        row.totalAmount,
        `"${row.bookingStatus}"`,
        `"${row.ticketStatus}"`,
        `"${row.checkedIn}"`,
        `"${row.usedAt}"`,
        `"${row.createdAt}"`,
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soundwave-attendees-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`ส่งออกรายชื่อผู้เข้างาน ${exportTickets.length} รายการเป็น CSV เรียบร้อยแล้ว`);
  };

  // ── Universal Quick Search Filtering ─────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let list = bookings;

    // Status Filter
    if (bookingFilter === 'paid') {
      list = list.filter((b) => ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(b.status));
    } else if (bookingFilter === 'checked-in') {
      list = list.filter((b) => b.tickets?.some((t) => t.status === 'USED'));
    }

    // Universal Search Filter (Booking Code, Ticket Code, Phone, Name)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((b) => {
        const matchBookingCode = b.bookingCode?.toLowerCase().includes(q);
        const matchName = b.customerName?.toLowerCase().includes(q);
        const matchPhone = b.customerPhone?.toLowerCase().includes(q);
        const matchLineId = b.customerLineId?.toLowerCase().includes(q);
        const matchTicket = b.tickets?.some(
          (t) =>
            t.ticketCode?.toLowerCase().includes(q) ||
            t.attendeeName?.toLowerCase().includes(q) ||
            t.seatNumber?.toLowerCase().includes(q)
        );
        return matchBookingCode || matchName || matchPhone || matchLineId || matchTicket;
      });
    }

    return list;
  }, [bookings, bookingFilter, searchQuery]);

  // Aggregated system totals
  const totalSystemCapacity = useMemo(
    () => concerts.reduce((sum, c) => sum + (c.totalCapacity || 0), 0),
    [concerts]
  );
  const totalSystemAvailable = useMemo(
    () => concerts.reduce((sum, c) => sum + (c.totalAvailable || 0), 0),
    [concerts]
  );

  // ── Create Concert Form Helpers ──────────────────────────────────────────
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
      toast.error('เลือกไฟล์ JPG, PNG หรือ WebP เท่านั้น');
      event.target.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('ขนาดไฟล์โปสเตอร์ต้องไม่เกิน 4 MB');
      event.target.value = '';
      return;
    }
    setCropTarget(target);
    setCropFile(file);
    event.target.value = '';
  };

  const uploadCroppedImage = async (image) => {
    setUploading(true);
    try {
      const result = await api('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      if (cropTarget?.type === 'poster') {
        updateField('bannerUrl', result.url);
        setPosterPreview(result.url);
        toast.success('อัปโหลดรูปโปสเตอร์สำเร็จ');
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
        toast.success('อัปโหลดรูปศิลปินสำเร็จ');
      }
      setCropFile(null);
      setCropTarget(null);
    } catch (err) {
      toast.error(err.message || 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(form.eventDate)) {
      toast.error('เลือกวันและเวลาแสดงก่อนสร้างคอนเสิร์ต');
      return;
    }
    if (!form.location) {
      toast.error('เลือกจังหวัดและสถานที่จัดงานก่อนสร้างคอนเสิร์ต');
      return;
    }
    if (!form.bannerUrl) {
      toast.error('อัปโหลดโปสเตอร์ก่อนสร้างคอนเสิร์ต');
      return;
    }
    setSaving(true);
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
      toast.success('สร้างและเผยแพร่คอนเสิร์ตใหม่เรียบร้อยแล้ว');
      setActiveTab('events');
      await loadDashboard();
    } catch (err) {
      toast.error(err.message || 'สร้างคอนเสิร์ตไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // ── Artist Editor Save ────────────────────────────────────────────────────
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
      toast.error('กรอกชื่อศิลปินทุกคนก่อนบันทึก');
      return;
    }
    setSaving(true);
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
      toast.success('บันทึกรายชื่อศิลปินเรียบร้อยแล้ว');
      await loadDashboard();
    } catch (err) {
      toast.error(err.message || 'บันทึกศิลปินไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // ── Login / Logout Handlers ───────────────────────────────────────────────
  const handleOrganizerLogin = async (event) => {
    event.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }
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
      if (loginMode === 'forgot') {
        setLoginMode('login');
        setLoginPassword('');
        setLoginError(result.message);
        return;
      }
      const session = { ...result.organizer, sessionToken: result.token, expiresAt: result.expiresAt };
      localStorage.setItem('soundwave_organizer', JSON.stringify(session));
      setOrganizer(session);
      setLoginPassword('');
      toast.success(`ยินดีต้อนรับคุณ ${session.name}`);
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
    } catch {}
    localStorage.removeItem('soundwave_organizer');
    setOrganizer(null);
    setStats(null);
    setConcerts([]);
    setBookings([]);
    toast.info('ออกจากระบบเรียบร้อยแล้ว');
  };

  if (!organizer?.sessionToken) {
    return (
      <div className="min-h-screen bg-[#07070c] px-4 py-12 text-white sm:px-6">
        <section className="mx-auto max-w-md rounded-3xl border border-white/15 bg-[#101018] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <Lock size={20} />
            </span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Organizer Portal</p>
            <h1 className="mt-1 text-2xl font-black">เข้าสู่ระบบเจ้าของงาน</h1>
            <p className="mt-2 text-xs text-gray-400">บัญชีเจ้าของงานแยกจากบัญชีพนักงานสแกนบัตร</p>
          </div>
          {loginError && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3">
              <p className="text-xs font-bold text-rose-100">เข้าสู่ระบบไม่สำเร็จ</p>
              <p className="mt-1 text-xs leading-5 text-rose-200">{loginError}</p>
            </div>
          )}
          <form noValidate onSubmit={handleOrganizerLogin} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-300">Username เจ้าของงาน</span>
              <input
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-300">{loginMode === 'forgot' ? 'รหัสผ่านใหม่' : 'Password'}</span>
              <span className="relative block">
                <input
                  required
                  minLength={loginMode === 'forgot' ? 8 : undefined}
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete={loginMode === 'forgot' ? 'new-password' : 'current-password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label={showLoginPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200"
                >
                  {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <button
              disabled={loginLoading}
              className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-black hover:bg-cyan-200 disabled:opacity-50"
            >
              {loginLoading ? 'กำลังดำเนินการ…' : loginMode === 'forgot' ? 'ตั้งรหัสผ่านใหม่' : 'เข้าสู่ระบบแดชบอร์ด'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setLoginMode(loginMode === 'forgot' ? 'login' : 'forgot'); setLoginError(''); }}
            className="mt-4 w-full text-center text-xs font-bold text-cyan-200 hover:text-white"
          >
            {loginMode === 'forgot' ? 'กลับเข้าสู่ระบบ' : 'ลืมรหัสผ่านเจ้าของงาน?'}
          </button>
          <Link to="/" className="mt-5 block text-center text-xs text-gray-400 hover:text-white">
            กลับหน้าร้าน
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070c] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Top Header & Tab Navigation Bar ── */}
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* ── 3 Main Navigation Tabs ── */}
            <nav className="flex rounded-xl bg-white/5 p-1 border border-white/10">
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
                <span>📊 ภาพรวม & ยอดขาย</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'events'
                    ? 'bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>🎸 คอนเสิร์ต & ผังที่นั่ง</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet size={14} />
                <span>🧾 รายการจอง & ตั๋วลูกค้า</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  activeTab === 'create'
                    ? 'bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Plus size={14} />
                <span>+ เพิ่มงานใหม่</span>
              </button>
            </nav>

            {/* Event Discovery Radar Button */}
            <button
              type="button"
              onClick={() => setDiscoveryOpen(true)}
              title="Event Discovery Radar: ตรวจจับคอนเสิร์ตจริงในไทย พร้อมนำเข้าใน 1 คลิก"
              className="relative flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all shadow-lg shadow-cyan-400/10 cursor-pointer"
            >
              <Radar size={14} className="text-cyan-300" />
              <span>เรดาร์คอนเสิร์ต 🔔</span>
              {discoveryPendingCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white animate-pulse">
                  {discoveryPendingCount}
                </span>
              )}
            </button>

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
              {t(`ออก (${organizer.name})`, `Sign Out (${organizer.name})`)}
            </button>
          </div>
        </header>

        {/* ── Top Executive KPI Metrics (Always accessible overview) ── */}
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
            detail={`ราคาเฉลี่ยต่อใบ ${money(
              stats?.averageTicketPrice || (stats?.totalTickets ? stats.revenue / stats.totalTickets : 0)
            )}`}
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
            TAB 1: 📊 ภาพรวม & ยอดขาย (Dashboard & Financial Analytics)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">รายงานสรุปภาพรวมและการเงิน (Financial Summary)</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  ตรวจสอบสัดส่วนรายได้ ยอดขาย และความเคลื่อนไหวล่าสุดของทุกคอนเสิร์ต
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCSV()}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/20"
                >
                  <Download size={13} />
                  <span>ส่งออก CSV ทั้งหมด</span>
                </button>
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="rounded-xl border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/5"
                >
                  รีเฟรชข้อมูล
                </button>
              </div>
            </div>

            {/* Concerts Revenue Quick Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {concerts.map((c) => {
                const sold = c.totalTicketsSold || 0;
                const capacity = c.totalCapacity || 1;
                const percentSold = Math.min(100, Math.round((sold / capacity) * 100));

                return (
                  <article
                    key={c.id}
                    className="rounded-3xl border border-white/10 bg-[#101018] p-5 shadow-xl transition hover:border-cyan-400/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            c.status === 'ON_SALE'
                              ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
                              : c.status === 'PAUSED'
                              ? 'border-amber-400/30 bg-amber-400/15 text-amber-200'
                              : c.status === 'CLOSED'
                              ? 'border-rose-400/30 bg-rose-400/15 text-rose-200'
                              : 'border-cyan-400/30 bg-cyan-400/15 text-cyan-200'
                          }`}
                        >
                          {c.status || 'UPCOMING'}
                        </span>
                        <h3 className="mt-2 text-base font-black text-white truncate">{c.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{dateLabel(c.eventDate)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyStoreLink(c)}
                        title="คัดลอกลิงก์ร้าน"
                        className="rounded-xl border border-white/10 p-2 text-gray-400 hover:text-cyan-300 hover:bg-white/5"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl bg-black/30 p-3.5 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-400">รายได้รวม:</span>
                        <span className="font-mono text-lg font-black text-emerald-300">{money(c.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">ตั๋วที่ขายแล้ว:</span>
                        <span className="font-mono font-bold text-white">
                          {sold.toLocaleString()} / {capacity.toLocaleString()} {t('ใบ', 'tickets')} ({percentSold}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('events');
                          setExpandedConcerts((prev) => ({ ...prev, [c.id]: true }));
                        }}
                        className="text-cyan-300 hover:text-white font-bold flex items-center gap-1"
                      >
                        <span>จัดการโซน & ที่นั่ง</span>
                        <ChevronRight size={13} />
                      </button>
                      <Link
                        to={`/concerts/${c.id}`}
                        target="_blank"
                        className="text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        <span>หน้าร้าน</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: 🎸 คอนเสิร์ต & ผังที่นั่ง (Events & Seat Inventory)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">จัดการคอนเสิร์ต, ผังที่นั่ง และสถานะการขาย</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  สลับสถานะเปิด-ปิดขายตั๋วทั้งระดับคอนเสิร์ตและระดับโซน พร้อมเปิดผังเก้าอี้ Interactive
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-300 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-cyan-200"
                >
                  <Plus size={14} />
                  <span>+ สร้างคอนเสิร์ตใหม่</span>
                </button>
              </div>
            </div>

            {/* Concert Cards with Sales Toggles & Seat Map */}
            <div className="space-y-6">
              {concerts.map((c) => {
                const isExpanded = expandedConcerts[c.id] !== false; // expanded by default

                return (
                  <article
                    key={c.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#101018] shadow-2xl transition-all"
                  >
                    {/* Header Bar */}
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
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Concert Sales Status Toggle Switch */}
                            <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/15">
                              <button
                                type="button"
                                onClick={() => handleToggleConcertStatus(c.id, 'ON_SALE')}
                                title="เปิดจำหน่ายบัตร"
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                  c.status === 'ON_SALE'
                                    ? 'bg-emerald-400 text-black shadow-md'
                                    : 'text-gray-400 hover:text-emerald-300'
                                }`}
                              >
                                <Play size={10} className="fill-current" />
                                <span>เปิดขาย</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleConcertStatus(c.id, 'PAUSED')}
                                title="พักการจำหน่ายชั่วคราว"
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                  c.status === 'PAUSED'
                                    ? 'bg-amber-400 text-black shadow-md'
                                    : 'text-gray-400 hover:text-amber-300'
                                }`}
                              >
                                <Pause size={10} className="fill-current" />
                                <span>พักการขาย</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleConcertStatus(c.id, 'CLOSED')}
                                title="ปิดการจำหน่าย"
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                  c.status === 'CLOSED'
                                    ? 'bg-rose-500 text-white shadow-md'
                                    : 'text-gray-400 hover:text-rose-400'
                                }`}
                              >
                                <StopCircle size={10} className="fill-current" />
                                <span>ปิดขาย</span>
                              </button>
                            </div>

                            <span className="text-[11px] text-gray-400 font-mono">
                              #{c.id} · {c.slug}
                            </span>
                          </div>

                          <h3 className="mt-1.5 text-lg sm:text-xl font-black text-white truncate">
                            {c.name}
                          </h3>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CalendarDays size={13} className="text-cyan-300" />
                              {dateLabel(c.eventDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-pink-300" />
                              {trData(c.venue || c.location)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Header Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
                        {/* Edit Concert Button */}
                        <button
                          type="button"
                          onClick={() => setEditConcertModal(c)}
                          title="แก้ไขชื่อ วันแสดง สถานที่ รูปภาพ และรายละเอียดคอนเสิร์ต"
                          className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                        >
                          <PenLine size={13} className="text-cyan-300" />
                          <span>แก้ไขข้อมูล</span>
                        </button>

                        {/* Copy Store Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyStoreLink(c)}
                          className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20"
                        >
                          <Copy size={13} />
                          <span>คัดลอกลิงก์ร้าน</span>
                        </button>

                        {/* Export CSV for this concert */}
                        <button
                          type="button"
                          onClick={() => handleExportCSV(c.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/20"
                        >
                          <Download size={13} />
                          <span>ส่งออก CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openArtistEditor(c)}
                          className="flex items-center gap-1.5 rounded-xl border border-pink-400/30 bg-pink-400/10 px-3 py-2 text-xs font-bold text-pink-200 hover:bg-pink-400/20"
                        >
                          <Mic2 size={13} />
                          <span>จัดการศิลปิน</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleExpand(c.id)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-gray-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 sm:p-6 space-y-6">
                        {/* Zone Table with Sales Switch and Seat Map Button */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                              <Layers size={14} className="text-cyan-300" />
                              <span>{t(`โซนบัตร และผังที่นั่งจำลอง (${c.zones?.length || 0} โซน)`, `Ticket Zones & Seat Maps (${c.zones?.length || 0} zones)`)}</span>
                            </h4>
                            <span className="text-[11px] text-gray-500">
                              คลิกสวิตช์เพื่อเปิด/ปิดขายโซน หรือคลิก "ผังที่นั่ง Interactive" เพื่อล็อกเก้าอี้
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-white/10">
                            <table className="w-full text-left text-xs">
                              <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] uppercase font-bold text-gray-400">
                                <tr>
                                  <th className="py-2.5 px-3">สถานะขาย</th>
                                  <th className="py-2.5 px-3">ชื่อโซน</th>
                                  <th className="py-2.5 px-3">ประเภท</th>
                                  <th className="py-2.5 px-3 text-right">ราคา</th>
                                  <th className="py-2.5 px-3 text-center">ขายแล้ว / ความจุ</th>
                                  <th className="py-2.5 px-3 text-center">คงเหลือ</th>
                                  <th className="py-2.5 px-3 text-right">รายได้โซน</th>
                                  <th className="py-2.5 px-3 text-center">ผังเก้าอี้แอดมิน</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {(c.zoneStats || c.zones || []).map((z) => {
                                  const zoneSold = z.sold ?? z._count?.tickets ?? 0;
                                  const zoneCap = z.totalCapacity || 1;
                                  const zoneAvail = z.available ?? (zoneCap - zoneSold);
                                  const zoneRevenue = z.revenue ?? zoneSold * z.price;
                                  const isActive = z.isActive !== false;

                                  return (
                                    <tr key={z.id} className="hover:bg-white/[0.02]">
                                      {/* Zone Sales Toggle Switch */}
                                      <td className="py-2.5 px-3">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleZoneActive(z.id, isActive)}
                                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                                            isActive
                                              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-400/30'
                                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                                          }`}
                                        >
                                          <span
                                            className={`h-2 w-2 rounded-full ${
                                              isActive ? 'bg-emerald-400' : 'bg-amber-400'
                                            }`}
                                          />
                                          <span>{isActive ? 'เปิดขาย' : 'พักการขาย'}</span>
                                        </button>
                                      </td>

                                      <td className="py-2.5 px-3 font-bold text-white">{trData(z.name)}</td>
                                      <td className="py-2.5 px-3">
                                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-gray-300 border border-white/10">
                                          {categoryLabel(z.category)}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono text-cyan-200">
                                        {money(z.price)}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-mono">
                                        <strong className="text-white">{zoneSold}</strong> / {zoneCap} {t('ใบ', 'tickets')}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-mono">
                                        <span className={zoneAvail > 0 ? 'text-emerald-300 font-bold' : 'text-rose-400'}>
                                          {zoneAvail > 0 ? `${zoneAvail} ใบ` : 'บัตรหมด'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                                        {money(zoneRevenue)}
                                      </td>

                                      {/* Button to open Visual Interactive Seat Map */}
                                      <td className="py-2.5 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => openZoneSeats(z.id)}
                                          className="flex items-center justify-center gap-1.5 mx-auto rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                        >
                                          <Armchair size={13} className="text-cyan-300" />
                                          <span>ผังที่นั่ง Interactive</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: 🧾 รายการจอง & ตั๋วลูกค้า (Orders & Attendees)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">รายการจองและข้อมูลผู้ถือตั๋ว (Orders & Attendees)</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  ค้นหาด่วนจากรหัสจอง รหัสตั๋ว เบอร์โทร หรือชื่อลูกค้า พร้อมส่งตั๋ว LINE ซ้ำและส่งออกไฟล์
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCSV()}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/20"
                >
                  <Download size={14} />
                  <span>ส่งออก CSV รายชื่อผู้เข้างาน</span>
                </button>
              </div>
            </div>

            {/* ── Universal Quick Search Bar ── */}
            <div className="rounded-3xl border border-cyan-400/20 bg-[#101018] p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300" size={17} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ค้นหาได้ทันที: รหัสจอง (SW-...), รหัสตั๋ว (SWP-...), เบอร์โทรศัพท์ หรือชื่อลูกค้า..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-gray-200 outline-none focus:border-cyan-300"
                  >
                    <option value="all">ทุกสถานะการจอง</option>
                    <option value="paid">ชำระแล้ว / คืนเงินบางส่วน</option>
                    <option value="checked-in">สแกนเข้างานแล้ว (Check-in)</option>
                  </select>

                  <span className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-mono text-gray-300">
                    {t('พบ', 'Found')} {filteredBookings.length} / {bookings.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Bookings & Attendees Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#101018] shadow-2xl">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] font-bold uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3">รหัสจอง / วันเวลา</th>
                    <th className="px-4 py-3">ลูกค้า / เบอร์โทร</th>
                    <th className="px-4 py-3">คอนเสิร์ต / โซน</th>
                    <th className="px-4 py-3 text-center">ตั๋ว & ที่นั่ง</th>
                    <th className="px-4 py-3 text-right">ยอดชำระ</th>
                    <th className="px-4 py-3 text-center">สถานะ</th>
                    <th className="px-4 py-3 text-center">ส่งตั๋ว LINE</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map((booking) => {
                    const concertNames = [
                      ...new Set((booking.items || []).map((item) => item.zone?.concert?.name).filter(Boolean)),
                    ];
                    const zoneNames = [
                      ...new Set((booking.items || []).map((item) => item.zone?.name).filter(Boolean)),
                    ];
                    const isPaid = ['PAID', 'PARTIALLY_REFUNDED'].includes(booking.status);
                    const isResending = lineResendingId === booking.id;

                    return (
                      <tr key={booking.id} className="align-top hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-cyan-200">{booking.bookingCode}</div>
                          <div className="mt-1 text-[10px] text-gray-500">{dateLabel(booking.createdAt)}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{booking.customerName}</div>
                          <div className="mt-0.5 text-[11px] font-mono text-gray-400">{booking.customerPhone}</div>
                          {booking.customerLineId && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span>ผูก LINE แล้ว</span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-gray-200">{concertNames.join(', ') || '—'}</div>
                          <div className="mt-1 text-[10px] text-gray-500">{zoneNames.map(trData).join(', ') || t('ไม่ระบุโซน', 'Unspecified Zone')}</div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => booking.tickets?.length > 0 && setViewBookingTickets(booking)}
                            disabled={!booking.tickets?.length}
                            title={booking.tickets?.length > 0 ? "คลิกเพื่อขยายดูตั๋วทุกใบพร้อม QR Code และที่นั่งแยกรายคน" : "ไม่มีข้อมูลตั๋ว"}
                            className="group inline-flex flex-col items-center hover:opacity-80 transition-all cursor-pointer disabled:cursor-default"
                          >
                            <span className="font-mono font-bold text-cyan-200 group-hover:underline flex items-center gap-1">
                              <span>{booking.tickets?.length || 0} ใบ</span>
                              {booking.tickets?.length > 0 && <span className="text-[10px] text-cyan-400">🔍</span>}
                            </span>
                            {booking.tickets?.length > 0 && (
                              <div className="mt-1 flex flex-wrap justify-center gap-1 max-w-[130px]">
                                {booking.tickets.slice(0, 3).map((t) => (
                                  <span
                                    key={t.id}
                                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                                      t.status === 'USED'
                                        ? 'bg-purple-400/20 text-purple-300'
                                        : 'bg-white/5 text-gray-300'
                                    }`}
                                  >
                                    {t.seatNumber || t.ticketCode.slice(-4)}
                                  </span>
                                ))}
                                {booking.tickets.length > 3 && (
                                  <span className="text-[9px] text-gray-400">+{booking.tickets.length - 3}</span>
                                )}
                              </div>
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-300">
                          {money(booking.totalAmount - (booking.refundedAmount || 0))}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : booking.status === 'PENDING'
                                ? 'bg-amber-400/10 text-amber-300'
                                : 'bg-white/5 text-gray-400'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>

                        {/* LINE Delivery Status & Resend */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`text-[10px] font-semibold ${
                              booking.lineDeliveryStatus === 'SENT'
                                ? 'text-emerald-300'
                                : booking.lineDeliveryStatus === 'FAILED'
                                ? 'text-rose-300'
                                : 'text-gray-400'
                            }`}
                          >
                            {booking.lineDeliveryStatus === 'SENT'
                              ? '✓ ส่งแล้ว'
                              : booking.lineDeliveryStatus === 'FAILED'
                              ? 'ส่งไม่สำเร็จ'
                              : booking.customerLineId
                              ? 'รอส่ง'
                              : 'ไม่มี LINE'}
                          </span>
                          {booking.lineDeliveryError && (
                            <p className="mt-1 max-w-28 text-[9px] text-rose-300 truncate mx-auto">
                              {booking.lineDeliveryError}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* View individual tickets with QR codes */}
                            {booking.tickets?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewBookingTickets(booking)}
                                title="เปิดดูตั๋วรายใบพร้อม QR Code และที่นั่งแยกรายคน"
                                className="flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/20 transition-all cursor-pointer"
                              >
                                <Ticket size={11} />
                                <span>{t(`ดูตั๋ว (${booking.tickets.length})`, `View Tickets (${booking.tickets.length})`)}</span>
                              </button>
                            )}

                            {/* Re-send to LINE 1-Click Button */}
                            {isPaid && booking.customerLineId && (
                              <button
                                type="button"
                                disabled={isResending}
                                onClick={() => handleResendLineTicket(booking)}
                                title="ส่งตั๋วเข้า LINE ซ้ำ"
                                className="flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50"
                              >
                                {isResending ? <LoaderCircle size={11} className="animate-spin" /> : <Send size={11} />}
                                <span>ส่ง LINE ซ้ำ</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        {searchQuery ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"` : 'ยังไม่มีรายการจองในระบบ'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4 / VIEW: + เพิ่มคอนเสิร์ตใหม่ (CREATE NEW CONCERT)
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
                onClick={() => setActiveTab('events')}
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
                    <h3 className="text-sm font-bold text-cyan-300">1. ข้อมูลทั่วไปของคอนเสิร์ต</h3>

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
                        <p className="mt-1 text-[11px] text-gray-400">เพิ่มเวลา ศิลปิน และเวที</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateField('schedule', [
                            ...form.schedule,
                            { time: '', stage: 'Main Stage', artist: '' },
                          ])
                        }
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
                            onChange={(event) =>
                              updateField(
                                'schedule',
                                form.schedule.map((row, i) => (i === index ? { ...row, time: event.target.value } : row))
                              )
                            }
                            className={inputClass}
                            aria-label={`เวลาแสดง ${index + 1}`}
                          />
                          <input
                            value={item.artist}
                            onChange={(event) =>
                              updateField(
                                'schedule',
                                form.schedule.map((row, i) => (i === index ? { ...row, artist: event.target.value } : row))
                              )
                            }
                            className={inputClass}
                            placeholder="ชื่อศิลปิน"
                          />
                          <input
                            value={item.stage}
                            onChange={(event) =>
                              updateField(
                                'schedule',
                                form.schedule.map((row, i) => (i === index ? { ...row, stage: event.target.value } : row))
                              )
                            }
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
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <span>4. รูปโปสเตอร์คอนเสิร์ต</span>
                      <span className="text-rose-400">*</span>
                    </h3>

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
                              askConfirm('ลบรูปโปสเตอร์', 'คุณต้องการนำรูปโปสเตอร์ออกใช่หรือไม่?', () => {
                                setPosterPreview('');
                                updateField('bannerUrl', '');
                                setPosterUrlInput('');
                              });
                            }}
                            className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1 text-white shadow-lg hover:bg-rose-400"
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
                            toast.success('ตั้งค่ารูปภาพจาก URL สำเร็จ');
                          }}
                          className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/20 disabled:opacity-40"
                        >
                          ใช้ URL นี้
                        </button>
                      </div>
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
                              {t(`โซนที่ ${index + 1}`, `Zone ${index + 1}`)}
                            </span>
                            {form.zones.length > 1 && (
                              <button
                                type="button"
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
                                      {preset.emoji} {trData(preset.label)}
                                    </button>
                                  );
                                })}
                              </div>
                              <input
                                type="text"
                                value={
                                  customCatInputs[index] ??
                                  (PRESET_CATEGORIES.some((p) => p.value === zone.category) ? '' : zone.category)
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomCatInputs((prev) => ({ ...prev, [index]: val }));
                                  if (val.trim()) updateZone(index, 'category', val.trim().toUpperCase().replace(/\s+/g, '_'));
                                }}
                                className={`${inputClass} text-[11px]`}
                                placeholder="หรือพิมพ์ประเภทเอง เช่น VIP_LOUNGE"
                              />
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

                  <div className="pt-2">
                    <button
                      disabled={saving || uploading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 py-4 text-sm font-black text-black hover:brightness-110 disabled:opacity-50 shadow-xl shadow-cyan-400/20"
                    >
                      {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}
                      <span>{saving ? 'กำลังบันทึกคอนเสิร์ต…' : 'สร้างและเผยแพร่คอนเสิร์ต'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}
      </div>

      {/* ── Interactive Admin Seat Map Modal (Requirement 2) ── */}
      {zoneSeatsModal && (
        <AdminSeatMapModal
          zone={zoneSeatsModal.zone}
          tickets={zoneSeatsModal.tickets || []}
          activePending={zoneSeatsModal.activePending || []}
          onClose={() => setZoneSeatsModal(null)}
          api={api}
          onRefresh={refreshZoneSeats}
        />
      )}

      {/* ── Event Discovery Radar Modal ── */}
      {discoveryOpen && (
        <ConcertDiscoveryModal
          onClose={() => setDiscoveryOpen(false)}
          api={api}
          onImportSuccess={async () => {
            await loadDashboard();
          }}
        />
      )}

      {/* ── Edit Concert Modal ── */}
      {editConcertModal && (
        <EditConcertModal
          concert={editConcertModal}
          onClose={() => setEditConcertModal(null)}
          api={api}
          onSaveSuccess={async () => {
            setEditConcertModal(null);
            await loadDashboard();
          }}
        />
      )}

      {/* ── Individual Tickets Breakdown Modal ── */}
      {viewBookingTickets && (
        <BookingTicketsModal
          booking={viewBookingTickets}
          onClose={() => setViewBookingTickets(null)}
        />
      )}

      {/* Artist Editor Modal */}
      {artistEditor && (
        <ArtistEditorModal
          editor={artistEditor}
          onClose={() => setArtistEditor(null)}
          onAdd={() =>
            setArtistEditor((current) => ({
              ...current,
              artists: [...current.artists, { name: '', genre: '', time: '', stage: 'Main Stage', image: '' }],
            }))
          }
          onRemove={(index) =>
            askConfirm('ลบศิลปินออกจากงาน', `ต้องการลบ ${artistEditor.artists[index]?.name || 'ศิลปินคนนี้'} ออกจากรายชื่อใช่หรือไม่?`, () =>
              setArtistEditor((current) => ({ ...current, artists: current.artists.filter((_, i) => i !== index) }))
            )
          }
          onDeleteImage={(index) =>
            askConfirm('ลบรูปศิลปิน', `ต้องการลบรูปใช่หรือไม่?`, () => {
              updateArtist(index, 'image', '');
              updateArtist(index, 'imageUrl', '');
            })
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

      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#151521] p-6 shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-400/10 text-rose-300">
              <Trash2 size={22} />
            </div>
            <h2 className="mt-4 text-center text-lg font-black text-white">{confirmDialog.title}</h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-400">{confirmDialog.message}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/5"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  action();
                }}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-400"
              >
                ยืนยันการลบ
              </button>
            </div>
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
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-white/10 bg-[#101018] p-5 text-left shadow-lg transition hover:border-white/20 hover:bg-[#14141e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
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
    </button>
  );
}

function ArtistEditorModal({ editor, onClose, onAdd, onRemove, onDeleteImage, onUpdate, onSave, saving, uploading, onPhoto }) {
  const { trData } = useLanguage();
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
              {trData('รายชื่อศิลปิน ·')} {editor.name}
            </h2>
            <p className="mt-1 text-xs text-gray-400">เพิ่มชื่อ เวที เวลา แนวเพลง และรูปภาพศิลปิน</p>
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
                  {artist.image && (
                    <button
                      type="button"
                      onClick={() => onDeleteImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-rose-500/90 p-1 text-white shadow-lg hover:bg-rose-400"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input
                    value={artist.name}
                    onChange={(e) => onUpdate(index, 'name', e.target.value)}
                    className={inputClass}
                    placeholder="ชื่อศิลปิน"
                  />
                  <input
                    value={artist.stage}
                    onChange={(e) => onUpdate(index, 'stage', e.target.value)}
                    className={inputClass}
                    placeholder="ชื่อเวที"
                  />
                  <input
                    value={artist.genre}
                    onChange={(e) => onUpdate(index, 'genre', e.target.value)}
                    className={inputClass}
                    placeholder="แนวเพลง (ไม่บังคับ)"
                  />
                  <input
                    value={artist.time}
                    onChange={(e) => onUpdate(index, 'time', e.target.value)}
                    className={inputClass}
                    placeholder="เวลาแสดง เช่น 19:00–20:00 น."
                  />
                  <div className="sm:col-span-2 flex gap-2 items-center">
                    <Link2 size={13} className="text-gray-500 shrink-0" />
                    <input
                      type="url"
                      value={artist.imageUrl ?? ''}
                      onChange={(e) => onUpdate(index, 'imageUrl', e.target.value)}
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
                        className="shrink-0 rounded-lg border border-pink-300/30 bg-pink-300/10 px-2.5 py-1.5 text-[10px] font-bold text-pink-200 hover:bg-pink-300/20"
                      >
                        ใช้ URL
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] font-semibold text-gray-300 hover:bg-white/5">
                    <Upload size={12} />
                    <span>อัปโหลด</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => onPhoto(e, index)}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-rose-400/20 bg-rose-400/5 p-0 text-gray-500 hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
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
