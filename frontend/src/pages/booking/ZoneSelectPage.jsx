import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  Ticket,
  Armchair,
  Users,
  Tent,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import StadiumZoneMap from './StadiumZoneMap';

// Cinema Theater Rows & Columns
const CINEMA_ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS_LEFT = [1, 2, 3, 4, 5, 6];
const COLS_RIGHT = [7, 8, 9, 10, 11, 12];

export default function ZoneSelectPage() {
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
  const [quantity, setQuantity] = useState(() => Math.max(1, Number(bookingDraft?.quantity) || 1));
  const [customerName, setCustomerName] = useState(() => bookingDraft?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(() => bookingDraft?.customerPhone || '');
  const [customerLineId, setCustomerLineId] = useState('');
  const [lineUser, setLineUser] = useState(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [lineConfig, setLineConfig] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time Cinema Occupied Seats from Backend
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Selected Cinema Seat Numbers (e.g. ['A-01', 'A-02'])
  const [selectedSeats, setSelectedSeats] = useState([]);

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
        headers: { 'Content-Type': 'application/json' },
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
          // Clean the code parameter from the browser address bar
          const nextUrl = window.location.pathname + (concertId ? `?concertId=${concertId}` : '');
          window.history.replaceState({}, document.title, nextUrl);
        });
    } else {
      // Check existing session in localStorage
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
        const zoneToSelect = availableZones.find((zone) => zone.id === bookingDraft?.zoneId) || availableZones[0] || null;
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

  // Helper: Check if seat is occupied in current zone
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

  // Helper: Find first N available seats
  const getFirstAvailableSeats = useCallback(
    (count, takenList) => {
      const result = [];
      for (const row of CINEMA_ROWS) {
        for (const col of [...COLS_LEFT, ...COLS_RIGHT]) {
          const code = formatSeatCode(row, col);
          const taken = takenList.some((s) => s === code || s === `ROW-${code}` || s.endsWith(code));
          if (!taken && !result.includes(code)) {
            result.push(code);
            if (result.length === count) return result;
          }
        }
      }
      return result;
    },
    [formatSeatCode]
  );

  // Fetch Occupied Seats whenever Selected Zone changes
  useEffect(() => {
    if (!selectedZone) {
      setOccupiedSeats([]);
      setSelectedSeats([]);
      return;
    }

    let active = true;
    setLoadingSeats(true);

    fetch(`/api/bookings/zones/${selectedZone.id}/occupied-seats`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const taken = Array.isArray(data.occupiedSeats) ? data.occupiedSeats : [];
        setOccupiedSeats(taken);

        // Pick initial available seat(s) that are definitely NOT taken
        const initialCount = Math.max(1, Math.min(quantity, 6));
        const initial = getFirstAvailableSeats(initialCount, taken);
        setSelectedSeats(initial);
        setQuantity(initial.length || 1);
      })
      .catch((err) => {
        console.error('Failed to load occupied seats:', err);
        if (active) {
          const fallback = getFirstAvailableSeats(1, []);
          setSelectedSeats(fallback);
        }
      })
      .finally(() => {
        if (active) setLoadingSeats(false);
      });

    return () => {
      active = false;
    };
  }, [selectedZone?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Zone Switching
  const selectZone = (zone) => {
    if (zone.available <= 0) return;
    setSelectedZone(zone);
    setErrorMsg('');
  };

  // Cinema Seat Click Handler (Toggle or Pick)
  const handleSeatClick = (seatCode) => {
    if (isSeatTaken(seatCode)) {
      setErrorMsg(`ที่นั่ง ${seatCode} มีผู้จองแล้ว ไม่สามารถเลือกได้ (ห้ามซ้ำกัน)`);
      return;
    }

    setErrorMsg('');

    if (selectedSeats.includes(seatCode)) {
      // Unselect this seat
      if (selectedSeats.length > 1) {
        const next = selectedSeats.filter((s) => s !== seatCode);
        setSelectedSeats(next);
        setQuantity(next.length);
      } else {
        // Keep at least 1 seat selected
        setErrorMsg('กรุณาเลือกที่นั่งอย่างน้อย 1 ที่');
      }
    } else {
      // Select new seat
      if (selectedSeats.length >= 6) {
        setErrorMsg('สามารถเลือกที่นั่งได้สูงสุด 6 ที่นั่งต่อครั้ง');
        return;
      }
      const next = [...selectedSeats, seatCode];
      setSelectedSeats(next);
      setQuantity(next.length);
    }
  };

  // Plus / Minus Quantity Buttons Handler
  const handleQuantityChange = (newQty) => {
    const clamped = Math.max(1, Math.min(newQty, 6, selectedZone?.available || 6));
    if (clamped === selectedSeats.length) return;

    if (clamped > selectedSeats.length) {
      // Find next available seats to add
      const needed = clamped - selectedSeats.length;
      const candidates = [];
      for (const row of CINEMA_ROWS) {
        for (const col of [...COLS_LEFT, ...COLS_RIGHT]) {
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
      // Remove from the end
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
  const totalPrice = useMemo(() => (selectedZone ? selectedZone.price * selectedSeats.length : 0), [selectedZone, selectedSeats]);

  // Submit Booking Reservation
  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!selectedZone) return;

    if (selectedSeats.length === 0) {
      setErrorMsg('กรุณาเลือกที่นั่งบนผังอย่างน้อย 1 ที่นั่ง');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ซื้อบัตร');
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg('หมายเลขโทรศัพท์ต้องมีครบ 10 หลัก (เช่น 0812345678)');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concertId: concert.id,
          zoneId: selectedZone.id,
          quantity: selectedSeats.length,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerLineId: customerLineId.trim() || undefined,
          selectedSeats, // Cinema unique seat codes
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'จองบัตรไม่สำเร็จ');
      }

      // Persist chosen seats to local storage
      localStorage.setItem(`soundwave_seats_${data.data.bookingCode}`, JSON.stringify(selectedSeats));
      sessionStorage.removeItem(bookingDraftKey);

      navigate(`/booking/payment/${data.data.bookingCode}`);
    } catch (err) {
      setErrorMsg(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
      // If conflict, refresh occupied seats immediately
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
        กำลังโหลดผังคอนเสิร์ต…
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-gray-400">{loadError || 'ไม่พบคอนเสิร์ต'}</p>
        <Link to="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Navigation Breadcrumb */}
        <Link
          to={`/concerts/${concert.id}`}
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white"
        >
          <ArrowLeft size={14} /> รายละเอียดคอนเสิร์ต
        </Link>

        {/* Page Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Cinema & Stadium Booking</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">เลือกโซนและระบุที่นั่ง · {concert.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin size={13} />
              {concert.venue || concert.location}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
            <Ticket size={15} className="text-cyan-200" />
            1–6 ที่นั่งต่อรายการ (ห้ามซ้ำ)
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
          {/* ── Left Column: Stadium Map & Cinema Theater Matrix ── */}
          <div className="space-y-6">
            {/* 1. Macro Stadium Map */}
            <StadiumZoneMap zones={concert.zones || []} selectedZoneId={selectedZone?.id} onSelect={selectZone} />

            {/* 2. Micro Cinema Theater Interactive Seat Matrix */}
            {selectedZone && (
              <div className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6 shadow-2xl">
                {/* Cinema Screen Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                      <Armchair size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        ผังเลือกที่นั่งแบบโรงภาพยนตร์ (Cinema Seat Map)
                        {loadingSeats && <LoaderCircle size={13} className="animate-spin text-cyan-400" />}
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        โซน: <strong className="text-cyan-300">{selectedZone.name}</strong> · ทุกที่นั่งมีเลขเฉพาะ{' '}
                        <span className="text-emerald-400 font-semibold">(ห้ามซ้ำกันเด็ดขาด)</span>
                      </p>
                    </div>
                  </div>

                  {/* Selected Seats Badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">เลือกแล้ว:</span>
                    <span className="rounded-lg bg-cyan-400/15 px-3 py-1 font-mono text-xs font-black text-cyan-300 border border-cyan-400/30">
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'ยังไม่ได้เลือก'}
                    </span>
                  </div>
                </div>

                {/* ── STAGE / SCREEN CURVE (Cinema Screen Effect) ── */}
                <div className="relative mb-8 text-center px-4">
                  <div className="mx-auto h-3 w-5/6 rounded-t-full bg-gradient-to-r from-cyan-500/20 via-cyan-400 to-cyan-500/20 shadow-[0_0_25px_rgba(0,240,255,0.7)]" />
                  <div className="mt-2.5 flex items-center justify-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-200">
                      🎸 MAIN STAGE / เวทีการแสดง (SCREEN) 🎬
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">ทิศทางด้านหน้าเวที (Stage View)</p>
                </div>

                {/* ── CINEMA SEAT ROWS & COLUMNS ── */}
                <div className="space-y-3.5 overflow-x-auto py-2">
                  {CINEMA_ROWS.map((rowLetter) => (
                    <div key={rowLetter} className="flex items-center justify-center gap-2 sm:gap-3 min-w-[520px]">
                      {/* Left Row Label */}
                      <span className="w-8 font-mono text-xs font-black text-cyan-300/80 text-center select-none">
                        {rowLetter}
                      </span>

                      {/* Left Block (Seats 01 - 06) */}
                      <div className="flex items-center gap-1.5">
                        {COLS_LEFT.map((colNum) => {
                          const seatCode = formatSeatCode(rowLetter, colNum);
                          const isOccupied = isSeatTaken(seatCode);
                          const isSelected = selectedSeats.includes(seatCode);

                          return (
                            <button
                              key={seatCode}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => handleSeatClick(seatCode)}
                              title={
                                isOccupied
                                  ? `ที่นั่ง ${seatCode} มีผู้จองแล้ว (ห้ามซ้ำ)`
                                  : isSelected
                                  ? `ที่นั่งที่คุณเลือก: ${seatCode}`
                                  : `ที่นั่งว่าง: ${seatCode} (คลิกเพื่อเลือก)`
                              }
                              className={`group relative flex flex-col items-center justify-center w-8 h-9 sm:w-9 sm:h-10 rounded-xl font-mono text-[11px] font-bold transition-all duration-150 select-none ${
                                isOccupied
                                  ? 'bg-[#1e1319] border border-rose-500/30 text-rose-500/50 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-cyan-400 text-black border-2 border-white shadow-[0_0_18px_rgba(0,240,255,0.85)] scale-110 z-10 font-black'
                                  : 'border border-white/15 bg-white/5 text-gray-200 hover:border-cyan-300 hover:bg-cyan-400/20 hover:scale-105 active:scale-95 cursor-pointer'
                              }`}
                            >
                              {/* Seat Top Armrest Accent */}
                              <span
                                className={`absolute top-1 w-5 h-1 rounded-full ${
                                  isOccupied ? 'bg-rose-500/30' : isSelected ? 'bg-black/40' : 'bg-white/20'
                                }`}
                              />
                              <span className="mt-1">{String(colNum).padStart(2, '0')}</span>
                              {isOccupied && <span className="text-[8px] text-rose-400 -mt-0.5">✕</span>}
                              {isSelected && <Check size={10} className="stroke-[3] -mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Center Walkway / Aisle */}
                      <div className="w-6 sm:w-8 flex flex-col items-center justify-center select-none opacity-40">
                        <span className="text-[8px] font-mono tracking-widest text-gray-400 rotate-90">AISLE</span>
                      </div>

                      {/* Right Block (Seats 07 - 12) */}
                      <div className="flex items-center gap-1.5">
                        {COLS_RIGHT.map((colNum) => {
                          const seatCode = formatSeatCode(rowLetter, colNum);
                          const isOccupied = isSeatTaken(seatCode);
                          const isSelected = selectedSeats.includes(seatCode);

                          return (
                            <button
                              key={seatCode}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => handleSeatClick(seatCode)}
                              title={
                                isOccupied
                                  ? `ที่นั่ง ${seatCode} มีผู้จองแล้ว (ห้ามซ้ำ)`
                                  : isSelected
                                  ? `ที่นั่งที่คุณเลือก: ${seatCode}`
                                  : `ที่นั่งว่าง: ${seatCode} (คลิกเพื่อเลือก)`
                              }
                              className={`group relative flex flex-col items-center justify-center w-8 h-9 sm:w-9 sm:h-10 rounded-xl font-mono text-[11px] font-bold transition-all duration-150 select-none ${
                                isOccupied
                                  ? 'bg-[#1e1319] border border-rose-500/30 text-rose-500/50 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-cyan-400 text-black border-2 border-white shadow-[0_0_18px_rgba(0,240,255,0.85)] scale-110 z-10 font-black'
                                  : 'border border-white/15 bg-white/5 text-gray-200 hover:border-cyan-300 hover:bg-cyan-400/20 hover:scale-105 active:scale-95 cursor-pointer'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-5 h-1 rounded-full ${
                                  isOccupied ? 'bg-rose-500/30' : isSelected ? 'bg-black/40' : 'bg-white/20'
                                }`}
                              />
                              <span className="mt-1">{String(colNum).padStart(2, '0')}</span>
                              {isOccupied && <span className="text-[8px] text-rose-400 -mt-0.5">✕</span>}
                              {isSelected && <Check size={10} className="stroke-[3] -mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Row Label */}
                      <span className="w-8 font-mono text-xs font-black text-cyan-300/80 text-center select-none">
                        {rowLetter}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── CINEMA SEAT LEGEND ── */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-8 border-t border-white/10 pt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center text-[10px] text-gray-300">
                      01
                    </span>
                    <span className="text-gray-300">ที่นั่งว่าง (พร้อมจอง)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-cyan-400 border border-white text-black font-black flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(0,240,255,0.7)]">
                      <Check size={11} className="stroke-[3]" />
                    </span>
                    <span className="font-bold text-cyan-200">
                      ที่นั่งที่คุณเลือก ({selectedSeats.length} ที่)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg border border-rose-500/40 bg-[#1e1319] text-rose-400 flex items-center justify-center text-[10px] line-through font-bold">
                      ✕
                    </span>
                    <span className="text-rose-300 font-semibold">จองแล้ว (ห้ามซ้ำ)</span>
                  </div>
                </div>
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
                <h2 className="font-black text-white">สรุปรายการจอง</h2>
                <p className="text-xs text-gray-500">ตรวจสอบโซน ที่นั่ง และยอดชำระ</p>
              </div>
            </div>

            {/* Zone & Seats Summary Box */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Selected zone</p>
                  <p className="mt-1 font-bold text-white">{selectedZone?.name || 'ไม่มีบัตรว่าง'}</p>
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
                    จำนวนที่นั่ง <span className="text-gray-500">(เลือกคลิกบนผังได้โดยตรง)</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="ลดจำนวนบัตร"
                      onClick={() => handleQuantityChange(selectedSeats.length - 1)}
                      disabled={selectedSeats.length <= 1}
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
                <span className="text-xs font-semibold text-gray-300">ยอดชำระสุทธิ</span>
                <span className="text-2xl font-black text-cyan-200">฿{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* ── LINE CONNECT INTEGRATION (อย่าเอาหน้าเชื่อมไลน์ออก) ── */}
            <div className="my-5 rounded-2xl border border-[#06c755]/30 bg-[#06c755]/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06c755] animate-ping" />
                  <span className="text-xs font-bold text-white">รับตั๋วคอนเสิร์ตเข้าแอป LINE โดยตรง</span>
                </div>
                <span className="text-[10px] bg-[#06c755]/20 text-[#06c755] font-black px-2 py-0.5 rounded-full border border-[#06c755]/30">
                  แนะนำ
                </span>
              </div>

              {lineUser || customerLineId ? (
                <div className="flex items-center justify-between bg-black/40 border border-[#06c755]/40 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        lineUser?.pictureUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                      }
                      alt="LINE Profile"
                      className="w-10 h-10 rounded-full border border-[#06c755] object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        {lineUser?.displayName || customerName || 'ผู้ใช้ LINE'}
                        <CheckCircle2 size={13} className="text-[#06c755]" />
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        LINE ID: {customerLineId ? `${customerLineId.slice(0, 10)}…` : 'เชื่อมต่อแล้ว'}
                      </p>
                      <p className="text-[10px] text-[#06c755] font-semibold">
                        ✓ ตั๋วจะถูกส่งเข้า LINE อัตโนมัติหลังจ่ายเงิน
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectLine}
                    className="text-[10px] text-gray-400 hover:text-rose-400 px-2 py-1 rounded-lg border border-white/10 hover:border-rose-400/40 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleLineLogin}
                    disabled={lineLoading}
                    className="w-full py-2.5 rounded-xl bg-[#06c755] hover:bg-[#05b34c] text-white font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,199,85,0.3)] cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.3 3.63 7.9 8.52 8.62.33.07.78.22.89.51.1.26.07.67.03 1.04-.08.76-.36 2.9-.4 3.32-.07.64.24.78.68.54.43-.24 4.7-2.77 6.42-3.79 3.65-2.15 5.86-5.46 5.86-9.24C22 5.92 17.52 2 12 2z" />
                    </svg>
                    {lineLoading ? 'กำลังเชื่อมต่อ LINE...' : 'เข้าสู่ระบบด้วย LINE (Log in with LINE)'}
                  </button>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-0.5">
                    <span>ดึงโปรไฟล์และยิงตั๋วเข้าแชตให้อัตโนมัติ</span>
                    <button
                      type="button"
                      onClick={handleMockLineLogin}
                      className="text-cyan-300 hover:underline cursor-pointer font-bold"
                    >
                      (คลิกทดสอบทันที - บัญชีจำลอง)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Buyer Info Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">ข้อมูลผู้ซื้อบัตร</span>
                  {customerName && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
                      <Check size={12} /> {customerName}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-400">*</span>
                  </span>
                  <input
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className={inputClass}
                    placeholder="เช่น สมชาย สุขสันต์"
                  />
                </div>

                {/* Phone with 10-digit validation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">
                      เบอร์โทรศัพท์ (10 หลัก) <span className="text-rose-400">*</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        cleanPhone.length === 10 ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    >
                      {cleanPhone.length === 10 ? '✓ ครบ 10 หลัก' : `${cleanPhone.length}/10 หลัก`}
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
                    className={`${inputClass} ${cleanPhone.length === 10 ? 'border-emerald-400/50' : ''}`}
                    placeholder="0812345678"
                  />
                  <p className="mt-1 text-[9px] text-gray-500">กรอกตัวเลข 10 หลักติดกัน เช่น 0812345678</p>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedZone || selectedSeats.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 px-4 py-3.5 text-sm font-black text-[#071016] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 shadow-lg shadow-cyan-400/20 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    กำลังล็อกที่นั่งและสร้างรายการ…
                  </>
                ) : (
                  <>
                    <span>ยืนยันที่นั่ง ({selectedSeats.join(', ')}) และไปชำระเงิน</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[10px] text-gray-500">ระบบล็อกที่นั่งที่เลือกไว้ให้ 10 นาที ห้ามคนอื่นเลือกซ้ำ</p>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-cyan-200/60 transition-all';
