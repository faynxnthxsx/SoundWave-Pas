import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, MapPin, Minus, Plus, Ticket, UserRound, Armchair, Users, Tent } from 'lucide-react';
import StadiumZoneMap from './StadiumZoneMap';

export default function ZoneSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const concertId = searchParams.get('concertId');
  const bookingDraftKey = `soundwave_booking_draft:${concertId || 'default'}`;
  const [bookingDraft] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(bookingDraftKey) || 'null'); }
    catch { return null; }
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
  const [officialAccountUrl, setOfficialAccountUrl] = useState(() => localStorage.getItem('soundwave_line_bot_url') || '');
  const [lineLoading, setLineLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Seat / Standing / Camping Position Numbers
  const [selectedSeats, setSelectedSeats] = useState([]);

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
        if (zoneToSelect) setQuantity(Math.min(Math.max(1, Number(bookingDraft?.quantity) || 1), 6, zoneToSelect.available));
      } catch (err) {
        if (mounted) setLoadError(err.message || 'โหลดข้อมูลคอนเสิร์ตไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    try {
      const account = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
      if (account) {
        if (!bookingDraft?.customerName) setCustomerName(account.username || '');
        setCustomerLineId(account.lineUserId || '');
      }
      const savedLine = JSON.parse(localStorage.getItem('soundwave_line_user') || 'null');
      if (savedLine) {
        setLineUser(savedLine);
        if (!bookingDraft?.customerName) setCustomerName(savedLine.displayName || account?.username || '');
        setCustomerLineId(savedLine.userId || account?.lineUserId || '');
      }
    } catch { /* ignore */ }

    fetch('/api/auth/line/config').then((response) => response.json()).then((config) => {
      if (config.officialAccountUrl) {
        setOfficialAccountUrl(config.officialAccountUrl);
        localStorage.setItem('soundwave_line_bot_url', config.officialAccountUrl);
      }
    }).catch(() => {});
  }, [concertId]);

  // Sync Seat / Position Numbers based on Zone and Quantity
  useEffect(() => {
    if (!selectedZone) {
      setSelectedSeats([]);
      return;
    }

    const cat = selectedZone.category;
    const isSeated = cat === 'SEATED' || /seat|chair|นั่ง/i.test(cat);
    const isCamping = cat === 'CAMPING' || /camp|เต็นท์/i.test(cat);
    const isVip = /vip/i.test(cat);
    const prefix = isSeated ? 'ROW-A' : isCamping ? 'CAMP-ZONE' : isVip ? 'VIP' : 'PIT-A';

    const defaultSeats = Array.from({ length: quantity }, (_, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      return `${prefix}-${num}`;
    });
    setSelectedSeats(defaultSeats);
  }, [selectedZone?.id, quantity]);

  const available = selectedZone?.available || 0;
  const maxQuantity = Math.min(6, available);
  const totalPrice = useMemo(() => selectedZone ? selectedZone.price * quantity : 0, [selectedZone, quantity]);

  const selectZone = (zone) => {
    if (zone.available <= 0) return;
    setSelectedZone(zone);
    setQuantity(1);
    setErrorMsg('');
  };

  const handleSeatClick = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      if (selectedSeats.length > 1) {
        const next = selectedSeats.filter((s) => s !== seatCode);
        setSelectedSeats(next);
        setQuantity(next.length);
      }
    } else {
      if (selectedSeats.length < maxQuantity) {
        const next = [...selectedSeats, seatCode];
        setSelectedSeats(next);
        setQuantity(next.length);
      } else {
        const next = [...selectedSeats.slice(1), seatCode];
        setSelectedSeats(next);
      }
    }
  };

  const cleanPhone = customerPhone.replace(/\D/g, '');

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!selectedZone || maxQuantity < 1) return;
    if (!customerName.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ซื้อบัตร');
      return;
    }
    if (cleanPhone.length !== 10) {
      setErrorMsg('หมายเลขโทรศัพท์ต้องมีครบ 10 หลัก (เช่น 0812345678)');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
      setErrorMsg('จำนวนบัตรเกินสต็อกที่เหลือ กรุณาเลือกจำนวนใหม่');
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
          quantity,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerLineId: customerLineId.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'จองบัตรไม่สำเร็จ');

      // Save selected seats for Payment & Ticket print
      if (selectedSeats.length > 0) {
        localStorage.setItem(`soundwave_seats_${data.data.bookingCode}`, JSON.stringify(selectedSeats));
      }

      sessionStorage.removeItem(bookingDraftKey);
      navigate(`/booking/payment/${data.data.bookingCode}`);
    } catch (err) {
      setErrorMsg(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center text-sm text-gray-400"><LoaderCircle className="mr-2 animate-spin" size={18} />กำลังโหลดผังงาน…</div>;
  if (!concert) return <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-center"><p className="text-sm text-gray-400">{loadError || 'ไม่พบคอนเสิร์ต'}</p><Link to="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm">กลับหน้าแรก</Link></div>;

  return (
    <div className="min-h-screen bg-[#07070b] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to={`/concerts/${concert.id}`} className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white">
          <ArrowLeft size={14} /> รายละเอียดคอนเสิร์ต
        </Link>

        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Choose your zone & seat</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">เลือกโซนและระบุตำแหน่ง · {concert.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin size={13} />{concert.venue || concert.location}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
            <Ticket size={15} className="text-cyan-200" />1–6 ใบต่อรายการ
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
          {/* ── Left Column: Stadium Map & Seat/Position Matrix ── */}
          <div className="space-y-6">
            <StadiumZoneMap zones={concert.zones || []} selectedZoneId={selectedZone?.id} onSelect={selectZone} />

            {/* ── Interactive Position / Seat Selection Box ── */}
            {selectedZone && (() => {
              const cat = selectedZone.category;
              const isSeated = cat === 'SEATED' || /seat|chair|นั่ง/i.test(cat);
              const isCamping = cat === 'CAMPING' || /camp|เต็นท์/i.test(cat);
              return (
                <div className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      {isSeated ? (
                        <Armchair className="text-amber-300" size={18} />
                      ) : isCamping ? (
                        <Tent className="text-emerald-300" size={18} />
                      ) : (
                        <Users className="text-cyan-300" size={18} />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {isSeated
                            ? 'ผังที่นั่งประจำโซน (Seat Number Selection)'
                            : isCamping
                            ? 'จุดกางเต็นท์ประจำโซน (Camping Pitch)'
                            : 'จุดยืนและลำดับคิวเข้างาน (Standing Queue & Spot)'}
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          {selectedZone.name} · เลือกแล้ว {selectedSeats.length} ตำแหน่ง
                          {cat !== 'SEATED' && cat !== 'STANDING' && cat !== 'CAMPING' && (
                            <span className="ml-2 font-mono text-cyan-400">[{cat}]</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-cyan-400/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300 border border-cyan-400/20">
                        {selectedSeats.join(', ') || 'ยังไม่ได้เลือก'}
                      </span>
                    </div>
                  </div>

                  {/* ── SEATED (or seat-like) ZONE: Interactive Rows & Numbers ── */}
                  {isSeated && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-gray-400 text-center mb-2">
                        เวทีคอนเสิร์ตอยู่ทางด้านบน ↑ (คลิกเก้าอี้เพื่อเปลี่ยนตำแหน่งที่นั่ง)
                      </p>

                      {['A', 'B', 'C'].map((rowLetter) => (
                        <div key={rowLetter} className="flex items-center gap-2">
                          <span className="w-8 font-mono text-xs font-bold text-gray-400 text-center">
                            แถว {rowLetter}
                          </span>
                          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 flex-1">
                            {Array.from({ length: 10 }, (_, i) => {
                              const num = String(i + 1).padStart(2, '0');
                              const seatCode = `ROW-${rowLetter}-${num}`;
                              const isChosen = selectedSeats.includes(seatCode);

                              return (
                                <button
                                  key={seatCode}
                                  type="button"
                                  onClick={() => handleSeatClick(seatCode)}
                                  className={`rounded-lg py-1.5 font-mono text-[11px] font-bold transition-all ${
                                    isChosen
                                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/40 ring-2 ring-white scale-105'
                                      : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-amber-300'
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 mt-3 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-amber-400" /> ที่นั่งที่คุณเลือก
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded bg-white/10 border border-white/20" /> ที่นั่งว่างพร้อมจอง
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── CAMPING ZONE: Numbered Pitch ── */}
                  {isCamping && !isSeated && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-gray-300">
                        ⛺ <strong>หมายเลขจุดกางเต็นท์ประจำตัว:</strong>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedSeats.map((plot, idx) => (
                          <div
                            key={plot}
                            className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-2.5 text-center"
                          >
                            <span className="text-[9px] uppercase tracking-wider text-emerald-200 block">
                              เต็นท์หลังที่ {idx + 1}
                            </span>
                            <span className="font-mono text-sm font-black text-white mt-0.5 block">
                              จุดกางเต็นท์: {plot}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── STANDING / CUSTOM ZONE: Numbered Spots & Entry Queue ── */}
                  {!isSeated && !isCamping && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-gray-300">
                        🎯 <strong>หมายเลขจุดยืน & คิวรันนิ่งเข้างาน:</strong>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedSeats.map((spot, idx) => (
                          <div
                            key={spot}
                            className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-2.5 text-center"
                          >
                            <span className="text-[9px] uppercase tracking-wider text-cyan-200 block">
                              ตั๋วใบที่ {idx + 1}
                            </span>
                            <span className="font-mono text-sm font-black text-white mt-0.5 block">
                              จุดยืน: {spot}
                            </span>
                            <span className="text-[9px] text-gray-400 mt-0.5 block">
                              คิวเข้าประตู #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2">
                        * หมายเลขจุดยืนจะถูกพิมพ์ลงบนบัตรดิจิทัล สำหรับแสดงต่อสตาฟฟ์หน้าประตูเข้าสู่โซนยืน
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
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

            {/* Zone & Quantity Summary */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Selected zone</p>
                  <p className="mt-1 font-bold text-white">{selectedZone?.name || 'ไม่มีบัตรว่าง'}</p>
                  {selectedSeats.length > 0 && (
                    <p className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      ตำแหน่ง: {selectedSeats.join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-lg font-black text-cyan-100">฿{selectedZone?.price?.toLocaleString() || 0}</span>
              </div>

              {selectedZone && (
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-gray-400">
                    จำนวนบัตร <span className="text-gray-600">(เหลือ {available.toLocaleString()} ใบ)</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="ลดจำนวนบัตร"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={quantity <= 1}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 disabled:opacity-35"
                    >
                      <Minus size={15} />
                    </button>
                    <span aria-live="polite" className="min-w-5 text-center text-base font-black">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="เพิ่มจำนวนบัตร"
                      onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                      disabled={quantity >= maxQuantity}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 disabled:opacity-35"
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

            {/* Buyer Info Form */}
            <div className="my-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
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
                  placeholder="เช่น อารียา สุขสันต์"
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
              <p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-200">
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              onClick={handleBookingSubmit}
              disabled={submitting || !selectedZone || !maxQuantity}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 px-4 py-3.5 text-sm font-black text-[#071016] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 shadow-lg shadow-cyan-400/20"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  กำลังสร้างรายการ…
                </>
              ) : (
                <>
                  <span>ยืนยันที่นั่งและไปหน้าชำระเงิน</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-[10px] text-gray-500">ระบบล็อกโควต้าและหมายเลขไว้ให้ 10 นาที</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-cyan-200/60 transition-all';
