import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  Ticket,
  Armchair,
  Users,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import StadiumZoneMap from './StadiumZoneMap';
import AuthModal from '../../components/AuthModal';
import LineConnectCard from '../../components/booking/LineConnectCard';
import Button from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';

// Realistic Arena / Stadium Seated Rows & Wing Columns (like ThaiTicketMajor / AllTicket)
const STADIUM_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const COLS_LEFT_WING = [1, 2, 3, 4];
const COLS_CENTER = [5, 6, 7, 8, 9, 10];
const COLS_RIGHT_WING = [11, 12, 13, 14];
const ALL_COLS = [...COLS_LEFT_WING, ...COLS_CENTER, ...COLS_RIGHT_WING];

function isZoneStanding(zone) {
  if (!zone) return false;
  const cat = String(zone.category || '').toUpperCase();
  const name = String(zone.name || '').toLowerCase();
  if (cat === 'SEATED' || cat === 'VIP') return false;
  if (cat === 'STANDING') return true;
  return /standing|ยืน|หลุม|pit|ga\b/i.test(name);
}

export default function ZoneSelectPage() {
  const { t, trData } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const concertId = searchParams.get('concertId');
  const bookingDraftKey = `soundwave_booking_draft:${concertId || 'default'}`;
  const [bookingDraft] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(bookingDraftKey) || 'null');
    } catch {
      return null;
    }
  });

  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [quantity, setQuantity] = useState(() => Math.max(0, Number(bookingDraft?.quantity) || 0));
  const [customerName, setCustomerName] = useState(() => bookingDraft?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(() => bookingDraft?.customerPhone || '');
  const [customerLineId, setCustomerLineId] = useState('');
  const [lineUser, setLineUser] = useState(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [lineConfig, setLineConfig] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // Real-time Occupied Seats from Backend
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Selected Seat / Queue Codes (e.g. ['A-05', 'A-06'] or ['STD-001', 'STD-002'])
  const [selectedSeats, setSelectedSeats] = useState([]);

  const isStanding = useMemo(() => isZoneStanding(selectedZone), [selectedZone]);

  // Fetch LINE Auth Config
  useEffect(() => {
    fetch('/api/auth/line/config')
      .then((res) => res.json())
      .then((data) => {
        setLineConfig(data);
        if (data.officialAccountUrl) {
          localStorage.setItem('soundwave_line_bot_url', data.officialAccountUrl);
        }
      })
      .catch((err) => console.warn('Could not load line config:', err));
  }, []);

  // Handle LINE Login OAuth Callback (?code=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setLineLoading(true);
      fetch('/api/auth/line/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('soundwave_session')
            ? {
                Authorization: `Bearer ${localStorage.getItem('soundwave_session')}`,
                'x-soundwave-session': localStorage.getItem('soundwave_session'),
              }
            : {}),
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setLineUser(data.user);
            setCustomerName(data.user.displayName || '');
            setCustomerLineId(data.user.userId || '');
            localStorage.setItem('soundwave_line_user', JSON.stringify(data.user));
          } else {
            console.error('LINE verification failed:', data.message);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          setLineLoading(false);
          const nextUrl = window.location.pathname + (concertId ? `?concertId=${concertId}` : '');
          window.history.replaceState({}, document.title, nextUrl);
        });
    } else {
      try {
        const savedLine = localStorage.getItem('soundwave_line_user');
        if (savedLine) {
          const u = JSON.parse(savedLine);
          setLineUser(u);
          if (!bookingDraft?.customerName) setCustomerName(u.displayName || '');
          setCustomerLineId(u.userId || '');
        } else {
          const account = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
          if (account) {
            if (!bookingDraft?.customerName) setCustomerName(account.username || '');
            setCustomerLineId(account.lineUserId || '');
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, [concertId, bookingDraft?.customerName]);

  // Load Concert & Zones
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch(concertId ? `/api/concerts/${encodeURIComponent(concertId)}` : '/api/concerts');
        const data = await response.json();
        const event = concertId ? data.data : data.data?.[0];
        if (!response.ok || !data.success || !event) throw new Error(data.message || 'ไม่พบคอนเสิร์ตที่เลือก');
        if (!mounted) return;
        setConcert(event);
        const availableZones = event.zones?.filter((zone) => zone.available > 0) || [];
        const zoneToSelect = bookingDraft?.zoneId
          ? availableZones.find((zone) => zone.id === bookingDraft.zoneId) || null
          : null;
        setSelectedZone(zoneToSelect);
      } catch (err) {
        if (mounted) setLoadError(err.message || 'โหลดข้อมูลคอนเสิร์ตไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [concertId, bookingDraft?.zoneId]);

  // Helper: Format seat code as ROW-COL e.g. "A-01"
  const formatSeatCode = useCallback((row, col) => {
    return `${row}-${String(col).padStart(2, '0')}`;
  }, []);

  // Helper: Check if seat or queue code is occupied in current zone
  const isSeatTaken = useCallback(
    (code) => {
      return occupiedSeats.some((s) => {
        if (s === code) return true;
        if (s === `ROW-${code}`) return true;
        if (s.endsWith(`-${code}`) || s.endsWith(code)) return true;
        return false;
      });
    },
    [occupiedSeats]
  );

  // Helper: Generate next N available Standing Queue codes (e.g. STD-001, STD-002)
  const getStandingQueueCodes = useCallback(
    (count) => {
      const codes = [];
      let qNum = 1;
      while (codes.length < count && qNum <= 9999) {
        const candidate = `STD-${String(qNum).padStart(3, '0')}`;
        if (!isSeatTaken(candidate)) {
          codes.push(candidate);
        }
        qNum++;
      }
      return codes;
    },
    [isSeatTaken]
  );

  // Helper: Fetch occupied seats
  const fetchOccupiedSeats = useCallback(
    async (isInitial = false) => {
      if (!selectedZone?.id) return;
      if (isInitial) setLoadingSeats(true);
      try {
        const res = await fetch(`/api/bookings/zones/${selectedZone.id}/occupied-seats`);
        const data = await res.json();
        const taken = Array.isArray(data.occupiedSeats) ? data.occupiedSeats : [];
        setOccupiedSeats(taken);

        if (isInitial) {
          setSelectedSeats((prev) => {
            if (prev.length > 0) {
              const stillValid = prev.filter((s) => !taken.includes(s));
              setQuantity(stillValid.length);
              return stillValid;
            }
            if (bookingDraft?.selectedSeats?.length && bookingDraft?.zoneId === selectedZone.id) {
              const validDraftSeats = bookingDraft.selectedSeats.filter((s) => !taken.includes(s));
              setQuantity(validDraftSeats.length);
              return validDraftSeats;
            }
            setQuantity(0);
            return [];
          });
        } else {
          setSelectedSeats((prev) => {
            const valid = prev.filter((s) => !taken.includes(s));
            if (valid.length < prev.length) {
              setErrorMsg('บางที่นั่งที่คุณเลือกถูกจองไปแล้ว ระบบได้นำออกจากรายการให้แล้ว');
            }
            return valid;
          });
        }
      } catch (err) {
        console.warn('Failed to refresh occupied seats:', err);
      } finally {
        if (isInitial) setLoadingSeats(false);
      }
    },
    [selectedZone?.id, bookingDraft?.selectedSeats, bookingDraft?.zoneId]
  );

  // Fetch Occupied Seats on Zone change & Auto-poll every 18 seconds
  useEffect(() => {
    if (!selectedZone) {
      setOccupiedSeats([]);
      setSelectedSeats([]);
      return;
    }

    fetchOccupiedSeats(true);

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchOccupiedSeats(false);
      }
    }, 18000);

    return () => clearInterval(interval);
  }, [selectedZone?.id, fetchOccupiedSeats]);

  // Handle Zone Switching (Step 1 -> Step 2)
  const selectZone = (zone) => {
    if (zone.isActive === false) {
      setErrorMsg(t(`โซน ${zone.name} พักการจำหน่ายบัตรชั่วคราว`, `Zone ${zone.name} is temporarily paused`));
      return;
    }
    if (zone.available <= 0) return;
    setSelectedZone(zone);
    setSelectedSeats([]);
    setQuantity(0);
    setErrorMsg('');
    setTimeout(() => {
      document.getElementById('seat-picker-step2')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  };

  // Seat Click Handler (Toggle or Pick up to 6 seats)
  const handleSeatClick = (seatCode) => {
    if (isSeatTaken(seatCode)) {
      setErrorMsg(
        t(`ที่นั่ง ${seatCode} มีผู้จองแล้ว ไม่สามารถเลือกได้`, `Seat ${seatCode} is already reserved`)
      );
      return;
    }

    setErrorMsg('');

    if (selectedSeats.includes(seatCode)) {
      const next = selectedSeats.filter((s) => s !== seatCode);
      setSelectedSeats(next);
      setQuantity(next.length);
    } else {
      if (selectedSeats.length >= 6) {
        setErrorMsg(t('สามารถเลือกที่นั่งได้สูงสุด 6 ที่นั่งต่อรายการ', 'Maximum 6 tickets per booking'));
        return;
      }
      const next = [...selectedSeats, seatCode];
      setSelectedSeats(next);
      setQuantity(next.length);
    }
  };

  // Best-Available Adjacent Seats Helper (like ThaiTicketMajor / Ticketmaster quick pick)
  const handleQuickAdjacentPick = (count) => {
    const clamped = Math.max(0, Math.min(count, 6, selectedZone?.available || 6));
    setErrorMsg('');
    if (clamped === 0) {
      setSelectedSeats([]);
      setQuantity(0);
      return;
    }
    if (isStanding) {
      const codes = getStandingQueueCodes(clamped);
      setSelectedSeats(codes);
      setQuantity(codes.length);
      return;
    }

    // Try to find `clamped` adjacent seats in the same row (preferring Center block first, then wings)
    for (const row of STADIUM_ROWS) {
      for (const block of [COLS_CENTER, COLS_LEFT_WING, COLS_RIGHT_WING, ALL_COLS]) {
        for (let i = 0; i <= block.length - clamped; i++) {
          const slice = block.slice(i, i + clamped).map((col) => formatSeatCode(row, col));
          if (slice.every((code) => !isSeatTaken(code))) {
            setSelectedSeats(slice);
            setQuantity(slice.length);
            return;
          }
        }
      }
    }

    // Fallback: pick first N available seats across rows
    const fallback = [];
    for (const row of STADIUM_ROWS) {
      for (const col of ALL_COLS) {
        const code = formatSeatCode(row, col);
        if (!isSeatTaken(code)) {
          fallback.push(code);
          if (fallback.length === clamped) break;
        }
      }
      if (fallback.length === clamped) break;
    }
    setSelectedSeats(fallback);
    setQuantity(fallback.length);
  };

  // Plus / Minus Quantity Buttons Handler
  const handleQuantityChange = (newQty) => {
    const clamped = Math.max(0, Math.min(newQty, 6, selectedZone?.available || 6));
    if (clamped === selectedSeats.length) return;

    if (isStanding) {
      const codes = getStandingQueueCodes(clamped);
      setSelectedSeats(codes);
      setQuantity(codes.length);
      return;
    }

    if (clamped > selectedSeats.length) {
      const needed = clamped - selectedSeats.length;
      const candidates = [];
      for (const row of STADIUM_ROWS) {
        for (const col of ALL_COLS) {
          const code = formatSeatCode(row, col);
          if (!isSeatTaken(code) && !selectedSeats.includes(code) && !candidates.includes(code)) {
            candidates.push(code);
            if (candidates.length === needed) break;
          }
        }
        if (candidates.length === needed) break;
      }
      const next = [...selectedSeats, ...candidates];
      setSelectedSeats(next);
      setQuantity(next.length);
    } else {
      const next = selectedSeats.slice(0, clamped);
      setSelectedSeats(next);
      setQuantity(next.length);
    }
  };

  // Trigger LINE OAuth Redirect
  const handleLineLogin = () => {
    const clientId = lineConfig?.channelId || '2012117630';
    const callbackUrl = lineConfig?.callbackUrl || `${window.location.origin}/booking/zone-select`;
    const state = 'swp_' + Math.random().toString(36).substring(7);
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&state=${state}&scope=profile%20openid`;
    window.location.href = lineAuthUrl;
  };

  // Mock LINE Login for fast demo
  const handleMockLineLogin = () => {
    const mockUser = {
      userId: 'U' + Math.random().toString(36).substring(2, 12) + 'alpha',
      displayName: 'สมชาย รักเสียงเพลง (LINE Test)',
      pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    };
    setLineUser(mockUser);
    setCustomerName(mockUser.displayName);
    setCustomerLineId(mockUser.userId);
    localStorage.setItem('soundwave_line_user', JSON.stringify(mockUser));
  };

  const handleDisconnectLine = () => {
    setLineUser(null);
    setCustomerLineId('');
    localStorage.removeItem('soundwave_line_user');
  };

  const cleanPhone = customerPhone.replace(/\D/g, '');
  const totalPrice = useMemo(
    () => (selectedZone ? selectedZone.price * selectedSeats.length : 0),
    [selectedZone, selectedSeats]
  );

  // Submit Booking Reservation
  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!selectedZone) return;

    if (!localStorage.getItem('soundwave_session')) {
      setErrorMsg(
        t(
          'กรุณาเข้าสู่ระบบก่อนซื้อบัตร ระบบจะเก็บโซนและที่นั่งที่คุณเลือกไว้ให้',
          'Please sign in before checkout. Your selected zone and seats will be saved.'
        )
      );
      sessionStorage.setItem(
        bookingDraftKey,
        JSON.stringify({ concertId, zoneId: selectedZone.id, quantity, customerName, customerPhone, selectedSeats })
      );
      setAuthOpen(true);
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMsg(t('กรุณาเลือกที่นั่งหรือจำนวนบัตรอย่างน้อย 1 ใบ', 'Please select at least 1 seat or ticket'));
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg(t('กรุณากรอกชื่อผู้ซื้อบัตร', 'Please enter buyer full name'));
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg(t('หมายเลขโทรศัพท์ต้องมีครบ 10 หลัก (เช่น 0812345678)', 'Phone number must be 10 digits'));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('soundwave_session')
            ? {
                Authorization: `Bearer ${localStorage.getItem('soundwave_session')}`,
                'x-soundwave-session': localStorage.getItem('soundwave_session'),
              }
            : {}),
        },
        body: JSON.stringify({
          concertId: concert.id,
          zoneId: selectedZone.id,
          quantity: selectedSeats.length,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerLineId: customerLineId.trim() || undefined,
          selectedSeats,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'จองบัตรไม่สำเร็จ');
      }

      localStorage.setItem(`soundwave_seats_${data.data.bookingCode}`, JSON.stringify(selectedSeats));
      sessionStorage.removeItem(bookingDraftKey);

      navigate(`/booking/payment/${data.data.bookingCode}`);
    } catch (err) {
      setErrorMsg(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
      if (selectedZone?.id) {
        fetch(`/api/bookings/zones/${selectedZone.id}/occupied-seats`)
          .then((r) => r.json())
          .then((d) => setOccupiedSeats(d.occupiedSeats || []))
          .catch(() => {});
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center text-sm text-gray-400">
        <LoaderCircle className="mr-2 animate-spin" size={18} />
        {t('กำลังโหลดผังคอนเสิร์ต…', 'Loading venue map…')}
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-gray-400">{loadError || t('ไม่พบคอนเสิร์ต', 'Concert not found')}</p>
        <Link to="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm">
          {t('กลับหน้าแรก', 'Back to Home')}
        </Link>
      </div>
    );
  }

  const zoneColor = selectedZone?.colorCode || '#00f0ff';

  // Render an individual realistic stadium seat button with harmonious Slate & Cyan-Teal palette
  const renderStadiumSeat = (rowLetter, colNum) => {
    const seatCode = formatSeatCode(rowLetter, colNum);
    const isOccupied = isSeatTaken(seatCode);
    const isSelected = selectedSeats.includes(seatCode);

    return (
      <button
        key={seatCode}
        type="button"
        disabled={isOccupied}
        onClick={() => handleSeatClick(seatCode)}
        onMouseEnter={() => setHoveredSeat({ code: seatCode, row: rowLetter, col: colNum, occupied: isOccupied })}
        onMouseLeave={() => setHoveredSeat(null)}
        title={
          isOccupied
            ? t(`ที่นั่ง ${seatCode} จำหน่ายแล้ว`, `Seat ${seatCode} Sold Out`)
            : isSelected
            ? t(`เลือกแล้ว: ${seatCode} (฿${selectedZone.price.toLocaleString()})`, `Selected: ${seatCode} (฿${selectedZone.price.toLocaleString()})`)
            : t(`แถว ${rowLetter} ที่นั่ง ${String(colNum).padStart(2, '0')} · ฿${selectedZone.price.toLocaleString()}`, `Row ${rowLetter} Seat ${String(colNum).padStart(2, '0')} · ฿${selectedZone.price.toLocaleString()}`)
        }
        className={`group relative flex flex-col items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-t-xl rounded-b-md font-mono text-[10px] font-bold transition-all duration-150 select-none ${
          isOccupied
            ? 'bg-[#0f1018] border border-white/[0.06] text-slate-600 cursor-not-allowed opacity-50'
            : isSelected
            ? 'bg-gradient-to-b from-cyan-300 to-teal-400 text-slate-950 border border-white shadow-[0_0_14px_rgba(34,211,238,0.55)] scale-110 z-10 font-black'
            : 'bg-[#171b29] border border-slate-700/70 text-slate-300 hover:bg-cyan-500/15 hover:border-cyan-400/60 hover:text-white hover:scale-105 active:scale-95 cursor-pointer'
        }`}
      >
        {/* Realistic Stadium Seat Backrest Curve */}
        <span
          className={`w-4 sm:w-5 h-1 rounded-full mb-0.5 transition-all ${
            isOccupied
              ? 'bg-slate-800'
              : isSelected
              ? 'bg-slate-950/45'
              : 'bg-cyan-400/40 group-hover:bg-cyan-300/80'
          }`}
        />

        {isOccupied ? (
          <span className="text-[9px] text-slate-600 font-bold leading-none">–</span>
        ) : isSelected ? (
          <Check size={11} className="stroke-[3.5] text-slate-950 leading-none" />
        ) : (
          <span className="leading-none text-[9px] sm:text-[10px] tracking-tighter">
            {String(colNum).padStart(2, '0')}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#07070b] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Navigation Breadcrumb */}
        <Link
          to={`/concerts/${concert.id}`}
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white"
        >
          <ArrowLeft size={14} /> {t('รายละเอียดคอนเสิร์ต', 'Concert Details')}
        </Link>

        {/* Page Header + 2-Step Indicator */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
              {t('ระบบจองบัตรตามผังสถานที่จริง (2 ขั้นตอน)', 'Venue-Realistic 2-Step Booking')}
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              {t('เลือกโซนก่อน → แล้วเลือกที่นั่ง', 'Select Zone First → Then Pick Seats')} · {concert.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin size={13} className="text-pink-400" />
              <span>{t('สถานที่จัดงานจริง:', 'Official Venue:')}</span>
              <strong className="text-gray-200">{concert.venue || concert.location}</strong>
            </p>
          </div>

          {/* 2-Step Progress Pills */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span
              className={`rounded-xl px-3.5 py-2 border transition-all ${
                !selectedZone
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200 ring-2 ring-cyan-400/40'
                  : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
              }`}
            >
              {selectedZone ? `✓ 1. ${trData(selectedZone.name)}` : t('① เลือกโซนจากผังสนาม', '① Select Zone on Map')}
            </span>
            <ArrowRight size={14} className="text-gray-500" />
            <span
              className={`rounded-xl px-3.5 py-2 border transition-all ${
                selectedZone
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200 ring-2 ring-cyan-400/40'
                  : 'border-white/10 bg-white/5 text-gray-500'
              }`}
            >
              {isStanding
                ? t('② เลือกจำนวนบัตรยืน (Run Queue)', '② Select Standing Quantity')
                : t('② เลือกที่นั่งในโซน', '② Pick Seats in Zone')}
            </span>
          </div>
        </header>

        {concert.status === 'PAUSED' && (
          <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs font-bold text-amber-200 flex items-center gap-2.5 shadow-lg shadow-amber-950/30">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <span>
              {t(
                'คอนเสิร์ตนี้กำลังพักการจำหน่ายบัตรชั่วคราว (PAUSED) ไม่สามารถทำรายการสั่งซื้อได้ในขณะนี้',
                'Ticket sales for this concert are temporarily paused (PAUSED).'
              )}
            </span>
          </div>
        )}
        {concert.status === 'CLOSED' && (
          <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-bold text-rose-200 flex items-center gap-2.5 shadow-lg shadow-rose-950/30">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{t('คอนเสิร์ตนี้ปิดการจำหน่ายบัตรแล้ว (CLOSED)', 'Ticket sales for this concert are closed (CLOSED).')}</span>
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
          {/* ── Left Column: Step 1 Venue Map -> Step 2 Seat Matrix / Standing Pit ── */}
          <div className="space-y-6">
            {/* 1. Macro Real Venue Map (Step 1) */}
            <StadiumZoneMap
              zones={concert.zones || []}
              selectedZoneId={selectedZone?.id}
              onSelect={selectZone}
              venueName={concert.venue || concert.location}
              concertName={concert.name}
            />

            {/* Quick Zone Cards Selector (Step 1 Helper) */}
            <div className="rounded-3xl border border-white/10 bg-[#111119] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-300">
                  {t(
                    'รายการโซนทั้งหมดของสถานที่นี้ (คลิกเลือกโซนเพื่อเปิดผังที่นั่ง):',
                    'All Available Venue Zones (Click a zone to open its seat/standing map):'
                  )}
                </span>
                {selectedZone && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedZone(null);
                      setSelectedSeats([]);
                      setQuantity(0);
                    }}
                    className="text-[11px] font-bold text-cyan-300 hover:underline cursor-pointer"
                  >
                    {t('↺ เปลี่ยนโซนใหม่', '↺ Change Zone')}
                  </button>
                )}
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {(concert.zones || []).map((z) => {
                  const active = selectedZone?.id === z.id;
                  const disabled = z.available <= 0 || z.isActive === false;
                  const zStanding = isZoneStanding(z);
                  return (
                    <button
                      key={z.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectZone(z)}
                      className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                        disabled
                          ? 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed'
                          : active
                          ? 'border-cyan-400 bg-cyan-400/15 ring-2 ring-cyan-400/40 shadow-lg'
                          : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black text-white flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: z.colorCode || '#00f0ff' }}
                          />
                          <span>{trData(z.name)}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {zStanding ? t('บัตรยืน (Standing)', 'Standing Pit') : t('บัตรนั่งระบุที่ (Seated)', 'Reserved Seating')} ·{' '}
                          {z.available > 0 ? t(`ว่าง ${z.available} ที่`, `${z.available} left`) : 'SOLD OUT'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-cyan-300 font-mono">฿{z.price.toLocaleString()}</span>
                        <span className="block text-[10px] text-cyan-200 font-bold">
                          {active ? t('✓ เลือกอยู่', '✓ Active') : t('เลือกโซน →', 'Select →')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt when no zone is selected yet */}
            {!selectedZone && (
              <div className="rounded-3xl border-2 border-dashed border-cyan-400/35 bg-cyan-400/5 p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                  <Armchair size={24} />
                </div>
                <h3 className="text-base font-black text-white">
                  {t(
                    'กรุณาคลิกเลือกโซนบนผังสถานที่ด้านบนก่อน (ขั้นตอนที่ 1)',
                    'Please Select a Zone on the Venue Map Above First (Step 1)'
                  )}
                </h3>
                <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">
                  {t(
                    'เมื่อคลิกเลือกโซนแล้ว ระบบจะเปิดผังเก้าอี้ตามสีโซน (สำหรับบัตรนั่ง) หรือผังหลุมรันคิว (สำหรับบัตรยืน) ให้เหมือนเว็บกดบัตรจริง',
                    'Click any zone above to open its color-coded stadium seat map (for Seated zones) or Standing Queue selector (for Standing pits).'
                  )}
                </p>
              </div>
            )}

            {/* ── STEP 2: REALISTIC CONCERT SEAT PICKER OR STANDING PIT ── */}
            {selectedZone && (
              <div
                id="seat-picker-step2"
                className="rounded-3xl border border-cyan-400/35 bg-[#111119] p-5 sm:p-6 shadow-2xl scroll-mt-24"
              >
                {/* Step 2 Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${zoneColor}20`,
                        borderColor: `${zoneColor}70`,
                        color: zoneColor,
                      }}
                    >
                      {isStanding ? <Users size={18} /> : <Armchair size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: zoneColor }}
                        />
                        <h3 className="text-sm font-black text-white">
                          {trData(selectedZone.name)} ·{' '}
                          <span className="text-cyan-300 font-mono">฿{selectedZone.price.toLocaleString()}</span>
                        </h3>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-200">
                          {isStanding ? t('โซนบัตรยืน (รันคิว)', 'Standing Pit') : t('โซนบัตรนั่ง (ล็อกที่นั่ง)', 'Reserved Seating')}
                        </span>
                        {loadingSeats && <LoaderCircle size={13} className="animate-spin text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isStanding
                          ? t(
                              'บัตรยืนไม่ต้องเลือกเก้าอี้ — เลือกจำนวนบัตรเพื่อรับหมายเลขคิวเข้าฮอลล์ (Standing Queue No.)',
                              'Standing tickets do not use seats — choose quantity to receive sequential entry queue numbers.'
                            )
                          : t(
                              'คลิกเลือกเก้าอี้สีประจำโซนด้านล่าง หรือใช้ปุ่มเลือกที่นั่งติดกันอัตโนมัติ (สูงสุด 6 ที่นั่ง)',
                              'Click individual color-coded seats below, or use Quick Auto-Pick for adjacent seats (max 6).'
                            )}
                      </p>
                    </div>
                  </div>

                  {/* Refresh + Quick Auto-Pick Adjacent Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                      <span className="px-2 text-[10px] font-bold text-gray-400">
                        {isStanding ? t('จำนวนบัตร:', 'Qty:') : t('เลือกติดกัน:', 'Auto-Pick:')}
                      </span>
                      {[1, 2, 3, 4, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleQuickAdjacentPick(n)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                            selectedSeats.length === n
                              ? 'bg-cyan-400 text-black shadow-sm'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {n} {t('ใบ', 'x')}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={loadingSeats}
                      onClick={() => fetchOccupiedSeats(false)}
                      title={t('รีเฟรชสถานะที่นั่งล่าสุด', 'Refresh Seat Status')}
                      className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <RotateCcw size={12} className={loadingSeats ? 'animate-spin text-cyan-300' : ''} />
                      <span className="hidden sm:inline">{t('รีเฟรช', 'Refresh')}</span>
                    </button>
                  </div>
                </div>

                {/* ── STAGE / CATWALK DIRECTION BANNER ── */}
                <div className="relative mb-6 text-center px-4">
                  <div className="mx-auto max-w-md rounded-b-2xl border-x border-b border-white/15 bg-gradient-to-b from-white/15 to-white/[0.03] py-2 px-6 shadow-[0_6px_25px_rgba(0,240,255,0.18)]">
                    <span className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-200">
                      {t('▲ STAGE / ทิศทางหน้าเวทีการแสดง ▲', '▲ STAGE DIRECTION ▲')}
                    </span>
                  </div>
                </div>

                {/* ── MODE A: STANDING PIT SELECTOR (โซนบัตรยืน) ── */}
                {isStanding ? (
                  <div className="space-y-5">
                    <div
                      className="relative mx-auto max-w-xl rounded-3xl border-2 p-6 text-center transition-all overflow-hidden"
                      style={{
                        borderColor: `${zoneColor}88`,
                        background: `radial-gradient(circle at 50% 0%, ${zoneColor}28, rgba(15,15,24,0.92) 75%)`,
                      }}
                    >
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-1 text-xs font-black text-white mb-3">
                        <Users size={14} style={{ color: zoneColor }} />
                        <span>{trData(selectedZone.name)} — STANDING PIT</span>
                      </div>

                      <p className="text-xs text-gray-300 max-w-md mx-auto">
                        {t(
                          'โซนยืนหน้าเวที (Festival / Concert Standing Pit) ระบบจะรันเลขลำดับคิวเข้าฮอลล์ (Queue No.) ให้อัตโนมัติตามจำนวนบัตรที่คุณเลือก',
                          'Standing Pit Zone — Sequential entry queue numbers (Queue No.) are automatically assigned based on your ticket count.'
                        )}
                      </p>

                      {/* Quantity Stepper inside Standing Pit */}
                      <div className="mt-5 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(selectedSeats.length - 1)}
                          disabled={selectedSeats.length <= 0}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/50 text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus size={18} />
                        </button>
                        <div className="min-w-36 rounded-2xl border border-white/15 bg-black/60 px-5 py-2.5">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t('จำนวนบัตรยืนที่เลือก', 'Standing Tickets')}
                          </span>
                          <span className="text-2xl font-black text-cyan-300 font-mono">
                            {selectedSeats.length} <span className="text-xs font-normal text-gray-400">/ 6</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(selectedSeats.length + 1)}
                          disabled={selectedSeats.length >= Math.min(6, selectedZone.available || 6)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/30 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Assigned Queue Badges */}
                      <div className="mt-5">
                        {selectedSeats.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {selectedSeats.map((qCode, i) => (
                              <span
                                key={qCode}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white text-black px-3 py-1.5 font-mono text-xs font-black shadow-md"
                              >
                                <Ticket size={13} className="text-cyan-600" />
                                <span>
                                  {t('คิวที่', 'Queue')} #{i + 1}: {qCode}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-300 font-semibold">
                            {t(
                              '👆 กดปุ่ม + หรือเลือกจำนวนบัตร (1–6 ใบ) เพื่อรับเลขคิวเข้าฮอลล์',
                              '👆 Click + or select ticket count (1–6) above to get your entry queue numbers'
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── MODE B: REALISTIC STADIUM / ARENA BOWL SEATED MATRIX (โซนบัตรนั่ง) ── */
                  <div>
                    {/* Live Hover Seat Inspector Pill */}
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{t('ข้อมูลที่นั่ง:', 'Seat Info:')}</span>
                        {hoveredSeat ? (
                          <span className="font-mono font-bold text-white">
                            {t('โซน', 'Zone')} <span style={{ color: zoneColor }}>{trData(selectedZone.name)}</span> ·{' '}
                            {t('แถว', 'Row')} <strong className="text-cyan-300">{hoveredSeat.row}</strong> ·{' '}
                            {t('ที่นั่ง', 'Seat')}{' '}
                            <strong className="text-cyan-300">{String(hoveredSeat.col).padStart(2, '0')}</strong> ·{' '}
                            {hoveredSeat.occupied ? (
                              <span className="text-rose-400">{t('(จำหน่ายแล้ว)', '(Sold Out)')}</span>
                            ) : (
                              <span className="text-emerald-400">฿{selectedZone.price.toLocaleString()}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {t(
                              'เลื่อนเมาส์ชี้หรือคลิกที่เก้าอี้เพื่อดูเลขแถวและที่นั่ง (แถว A อยู่ใกล้เวทีที่สุด)',
                              'Hover or click any seat to inspect Row & Seat number (Row A is closest to stage)'
                            )}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-gray-400">
                        {t('ว่าง', 'Available')}: <strong className="text-white">{selectedZone.available}</strong>
                      </span>
                    </div>

                    {/* Stadium Bowl Seat Rows (Rows A - G, Left Wing / Center / Right Wing) */}
                    <div className="space-y-2.5 overflow-x-auto py-3 px-2 rounded-2xl bg-[#0b0b12] border border-white/10">
                      {/* Column Wing Headers */}
                      <div className="flex items-center justify-center gap-3 min-w-[580px] text-[10px] font-bold uppercase tracking-wider text-gray-500 pb-1">
                        <span className="w-7 text-center">ROW</span>
                        <span className="w-[132px] text-center">{t('ฝั่งซ้าย (01-04)', 'Left Wing (01-04)')}</span>
                        <span className="w-4" />
                        <span className="w-[200px] text-center text-cyan-300/80">
                          {t('โซนกลางหน้าเวที (05-10)', 'Center Block (05-10)')}
                        </span>
                        <span className="w-4" />
                        <span className="w-[132px] text-center">{t('ฝั่งขวา (11-14)', 'Right Wing (11-14)')}</span>
                        <span className="w-7 text-center">ROW</span>
                      </div>

                      {STADIUM_ROWS.map((rowLetter, rowIdx) => (
                        <div
                          key={rowLetter}
                          className="flex items-center justify-center gap-2 sm:gap-2.5 min-w-[580px]"
                        >
                          {/* Left Row Badge */}
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-black text-gray-300 flex items-center justify-center select-none">
                            {rowLetter}
                          </span>

                          {/* Left Wing (01 - 04) */}
                          <div className="flex items-center gap-1 sm:gap-1.5 -rotate-2">
                            {COLS_LEFT_WING.map((colNum) => renderStadiumSeat(rowLetter, colNum))}
                          </div>

                          {/* Left Aisle Walkway */}
                          <div className="w-3 sm:w-4 h-7 flex items-center justify-center select-none">
                            <span className="w-0.5 h-5 bg-white/10 rounded-full" />
                          </div>

                          {/* Center Block (05 - 10) */}
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            {COLS_CENTER.map((colNum) => renderStadiumSeat(rowLetter, colNum))}
                          </div>

                          {/* Right Aisle Walkway */}
                          <div className="w-3 sm:w-4 h-7 flex items-center justify-center select-none">
                            <span className="w-0.5 h-5 bg-white/10 rounded-full" />
                          </div>

                          {/* Right Wing (11 - 14) */}
                          <div className="flex items-center gap-1 sm:gap-1.5 rotate-2">
                            {COLS_RIGHT_WING.map((colNum) => renderStadiumSeat(rowLetter, colNum))}
                          </div>

                          {/* Right Row Badge */}
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-black text-gray-300 flex items-center justify-center select-none">
                            {rowLetter}
                          </span>

                          {/* Row distance hint on Row A and Row G */}
                          {rowIdx === 0 && (
                            <span className="hidden lg:inline-block text-[9px] font-bold text-amber-300/90 w-16">
                              ← {t('ติดเวที', 'Front Row')}
                            </span>
                          )}
                          {rowIdx !== 0 && <span className="hidden lg:inline-block w-16" />}
                        </div>
                      ))}
                    </div>

                    {/* Selected Seat Chips Bar (removable pills like real ticketing sites) */}
                    {selectedSeats.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-cyan-200 mr-1">
                            {t(`ที่นั่งที่เลือก (${selectedSeats.length}/6):`, `Selected Seats (${selectedSeats.length}/6):`)}
                          </span>
                          {selectedSeats.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSeatClick(s)}
                              title={t('คลิกเพื่อยกเลิกที่นั่งนี้', 'Click to remove seat')}
                              className="inline-flex items-center gap-1 rounded-lg bg-white text-black px-2.5 py-1 font-mono text-xs font-black hover:bg-rose-200 transition-colors cursor-pointer"
                            >
                              <span>{s}</span>
                              <X size={12} className="text-gray-600" />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeats([]);
                            setQuantity(0);
                          }}
                          className="text-[11px] font-bold text-rose-300 hover:underline cursor-pointer"
                        >
                          {t('ล้างทั้งหมด', 'Clear All')}
                        </button>
                      </div>
                    )}

                    {/* ── REALISTIC CONCERT SEAT LEGEND ── */}
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-5 sm:gap-8 border-t border-white/10 pt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-t-lg rounded-b-sm bg-[#171b29] border border-slate-700/70 flex flex-col items-center justify-center text-[9px] font-mono font-bold text-slate-300">
                          <span className="w-3.5 h-1 rounded-full mb-0.5 bg-cyan-400/40" />
                          01
                        </span>
                        <span className="text-gray-300">
                          {t('ที่นั่งว่าง (พร้อมจอง)', 'Available Seat')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-t-lg rounded-b-sm bg-gradient-to-b from-cyan-300 to-teal-400 border border-white text-slate-950 font-black flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                          <Check size={12} className="stroke-[3]" />
                        </span>
                        <span className="font-bold text-cyan-200">
                          {t(`ที่นั่งที่คุณเลือก (${selectedSeats.length})`, `Your Selection (${selectedSeats.length})`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-t-lg rounded-b-sm border border-white/[0.06] bg-[#0f1018] text-slate-600 flex items-center justify-center text-[10px] font-bold opacity-60">
                          –
                        </span>
                        <span className="text-gray-400 font-semibold">
                          {t('จำหน่ายแล้ว (Sold Out)', 'Occupied / Sold')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column: Booking Summary & Checkout Form ── */}
          <aside className="rounded-[26px] border border-white/10 bg-[#111119] p-5 shadow-2xl sm:p-6 xl:sticky xl:top-24">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-xl bg-cyan-200/10 p-2.5 text-cyan-100">
                <Ticket size={19} />
              </span>
              <div>
                <h2 className="font-black text-white">{t('สรุปรายการจอง', 'Booking Summary')}</h2>
                <p className="text-xs text-gray-500">
                  {t('ตรวจสอบโซน ที่นั่ง และยอดชำระ', 'Review selected zone, seats & total')}
                </p>
              </div>
            </div>

            {/* Zone & Seats Summary Box */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Selected zone</p>
                  <p className="mt-1 font-bold text-white">
                    {selectedZone
                      ? trData(selectedZone.name)
                      : t('ยังไม่ได้เลือกโซน (คลิกเลือกโซนบนผัง)', 'No zone selected yet')}
                  </p>
                  {selectedSeats.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat}
                          className="inline-flex items-center gap-1 rounded-md bg-cyan-400/20 px-2 py-0.5 font-mono text-[11px] font-black text-cyan-300 border border-cyan-400/30"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-lg font-black text-cyan-100">
                  ฿{selectedZone?.price?.toLocaleString() || 0}
                </span>
              </div>

              {selectedZone && (
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-gray-400">
                    {isStanding ? t('จำนวนบัตรยืน', 'Standing Tickets') : t('จำนวนที่นั่ง', 'Tickets')}{' '}
                    <span className="text-gray-500">
                      {isStanding ? t('(รันเลขคิวอัตโนมัติ)', '(Auto Queue No.)') : t('(คลิกเลือกบนผังได้)', '(or click on map)')}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="ลดจำนวนบัตร"
                      onClick={() => handleQuantityChange(selectedSeats.length - 1)}
                      disabled={selectedSeats.length <= 0}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus size={15} />
                    </button>
                    <span aria-live="polite" className="min-w-6 text-center text-base font-black text-cyan-300">
                      {selectedSeats.length}
                    </span>
                    <button
                      type="button"
                      aria-label="เพิ่มจำนวนบัตร"
                      onClick={() => handleQuantityChange(selectedSeats.length + 1)}
                      disabled={selectedSeats.length >= Math.min(6, selectedZone?.available || 6)}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs font-semibold text-gray-300">{t('ยอดชำระสุทธิ', 'Total Amount')}</span>
                <span className="text-2xl font-black text-cyan-200">฿{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* ── LINE CONNECT INTEGRATION ── */}
            <LineConnectCard
              lineUser={lineUser}
              customerLineId={customerLineId}
              customerName={customerName}
              lineLoading={lineLoading}
              onLineLogin={handleLineLogin}
              onMockLineLogin={handleMockLineLogin}
              onDisconnectLine={handleDisconnectLine}
            />

            {/* Buyer Info Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t('ข้อมูลผู้ซื้อบัตร', 'Buyer Information')}</span>
                  {customerName && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
                      <Check size={12} /> {customerName}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block mb-1">
                    {t('ชื่อ-นามสกุล', 'Full Name')} <span className="text-rose-400">*</span>
                  </span>
                  <input
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleBookingSubmit(event);
                      }
                    }}
                    className={inputClass}
                    placeholder={t('เช่น สมชาย สุขสันต์', 'e.g. John Doe')}
                  />
                </div>

                {/* Phone with 10-digit validation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">
                      {t('เบอร์โทรศัพท์ (10 หลัก)', 'Phone Number (10 digits)')} <span className="text-rose-400">*</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        cleanPhone.length === 10 ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    >
                      {cleanPhone.length === 10 ? t('✓ ครบ 10 หลัก', '✓ 10/10 digits') : `${cleanPhone.length}/10`}
                    </span>
                  </div>
                  <input
                    required
                    type="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(event) => {
                      const onlyNums = event.target.value.replace(/\D/g, '');
                      setCustomerPhone(onlyNums);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleBookingSubmit(event);
                      }
                    }}
                    className={`${inputClass} ${cleanPhone.length === 10 ? 'border-emerald-400/50' : ''}`}
                    placeholder="0812345678"
                  />
                  <p className="mt-1 text-[9px] text-gray-500">
                    {t('กรอกตัวเลข 10 หลักติดกัน เช่น 0812345678', 'Enter 10 digits without dashes, e.g. 0812345678')}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={
                  submitting ||
                  !selectedZone ||
                  selectedSeats.length === 0 ||
                  concert.status === 'PAUSED' ||
                  concert.status === 'CLOSED' ||
                  selectedZone?.isActive === false
                }
                className="w-full"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    {t('กำลังล็อกที่นั่งและสร้างรายการ…', 'Locking seats & creating booking…')}
                  </>
                ) : concert.status === 'PAUSED' ? (
                  <span>{t('คอนเสิร์ตพักการจำหน่ายชั่วคราว', 'Sales Temporarily Paused')}</span>
                ) : concert.status === 'CLOSED' ? (
                  <span>{t('คอนเสิร์ตปิดการจำหน่ายแล้ว', 'Ticket Sales Closed')}</span>
                ) : !selectedZone ? (
                  <span>{t('กรุณาเลือกโซนในขั้นตอนที่ 1 ก่อน', 'Please select a zone in Step 1 first')}</span>
                ) : selectedZone?.isActive === false ? (
                  <span>{t('โซนนี้พักการจำหน่ายชั่วคราว', 'Zone Temporarily Paused')}</span>
                ) : selectedSeats.length === 0 ? (
                  <span>
                    {isStanding
                      ? t('กรุณาเลือกจำนวนบัตรยืนในขั้นตอนที่ 2', 'Please select standing ticket quantity in Step 2')
                      : t('กรุณาคลิกเลือกที่นั่งในขั้นตอนที่ 2', 'Please pick seats on the map in Step 2')}
                  </span>
                ) : (
                  <>
                    <span>
                      {t('ยืนยันการจองและไปชำระเงิน', 'Confirm & Proceed to Payment')}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-[10px] text-gray-500">
                {t(
                  'ระบบล็อกที่นั่ง/คิวที่เลือกไว้ให้ 10 นาที ห้ามคนอื่นเลือกซ้ำ',
                  'Selected seats/queue numbers are locked exclusively for 10 minutes.'
                )}
              </p>
            </form>
          </aside>
        </div>
      </div>
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticated={({ user, token }) => {
            localStorage.setItem('soundwave_session', token);
            localStorage.setItem('soundwave_user', JSON.stringify(user));
            setCustomerName(user.username || '');
            setCustomerLineId(user.lineUserId || '');
            setAuthOpen(false);
          }}
        />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-cyan-200/60 transition-all';
