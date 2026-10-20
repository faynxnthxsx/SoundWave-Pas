import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, LogOut, Zap, Users, Armchair } from 'lucide-react';

// Pre-reserved seats to make the map look realistic
const TAKEN_SEATS = ['A-02', 'A-06', 'B-01', 'B-04', 'C-03', 'C-07', 'D-05'];

export default function ZoneSelectPage() {
  const navigate = useNavigate();
  const [concert, setConcert] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLineId, setCustomerLineId] = useState('');
  const [lineUser, setLineUser] = useState(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1); // 1 = select zone/seat, 2 = fill details

  const LINE_CLIENT_ID = '2012117630';
  const LINE_CALLBACK_URL = window.location.origin + '/booking/zone-select';

  useEffect(() => {
    fetch('/api/concerts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const c = data.data[0];
          setConcert(c);
          setZones(c.zones || []);
          if (c.zones && c.zones.length > 0) {
            setSelectedZone(c.zones[0]);
          }
        }
      })
      .catch(console.error);

    // Handle LINE Login callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setLineLoading(true);
      fetch('/api/auth/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setLineUser(data.user);
            setCustomerName(data.user.displayName || '');
            setCustomerLineId(data.user.userId || '');
            localStorage.setItem('soundwave_line_user', JSON.stringify(data.user));
          }
        })
        .catch(console.error)
        .finally(() => {
          setLineLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else {
      try {
        const saved = localStorage.getItem('soundwave_line_user');
        if (saved) {
          const u = JSON.parse(saved);
          setLineUser(u);
          setCustomerName(u.displayName || '');
          setCustomerLineId(u.userId || '');
        }
      } catch (e) {}
    }
  }, []);

  // When zone changes, reset selected seats or set default
  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    setSelectedSeats([]);
    setQuantity(1);
    setErrorMsg('');
  };

  // Toggle seat selection for SEATED zones
  const handleToggleSeat = (seatCode) => {
    if (TAKEN_SEATS.includes(seatCode)) return;

    if (selectedSeats.includes(seatCode)) {
      const updated = selectedSeats.filter(s => s !== seatCode);
      setSelectedSeats(updated);
      setQuantity(Math.max(1, updated.length));
    } else {
      if (selectedSeats.length >= 4) {
        setErrorMsg('สามารถเลือกที่นั่งได้สูงสุด 4 ที่นั่งต่อการจอง');
        return;
      }
      const updated = [...selectedSeats, seatCode];
      setSelectedSeats(updated);
      setQuantity(updated.length);
      setErrorMsg('');
    }
  };

  const handleLineLogin = () => {
    const state = 'swp_' + Math.random().toString(36).substring(7);
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINE_CALLBACK_URL)}&state=${state}&scope=profile%20openid`;
  };

  const handleDisconnectLine = () => {
    setLineUser(null);
    setCustomerLineId('');
    localStorage.removeItem('soundwave_line_user');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZone) return;

    const isSeated = selectedZone.category === 'SEATED';
    if (isSeated && selectedSeats.length === 0) {
      setErrorMsg('กรุณาคลิกเลือกเก้าอี้ที่ต้องการนั่งบนผังอย่างน้อย 1 ที่นั่ง');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const finalQty = isSeated ? selectedSeats.length : quantity;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concertId: concert.id,
          zoneId: selectedZone.id,
          quantity: finalQty,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerLineId: customerLineId.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        // Save selected seats to localStorage so PaymentPage can send it to pay endpoint
        if (isSeated && selectedSeats.length > 0) {
          localStorage.setItem(`soundwave_seats_${data.data.bookingCode}`, JSON.stringify(selectedSeats));
        }
        navigate(`/booking/payment/${data.data.bookingCode}`);
      } else {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการจอง');
        setSubmitting(false);
      }
    } catch {
      setErrorMsg('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
      setSubmitting(false);
    }
  };

  if (!concert) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isSeatedZone = selectedZone?.category === 'SEATED';
  const effectiveQty = isSeatedZone ? Math.max(1, selectedSeats.length) : quantity;
  const totalPrice = selectedZone ? selectedZone.price * effectiveQty : 0;

  // Generate 4 rows of seats: A, B, C, D with 8 seats each
  const rows = ['A', 'B', 'C', 'D'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      
      {/* Page Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          SoundWave Festival 2026
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          เลือกโซนและที่นั่ง
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {concert.name} · {concert.venue}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT: Interactive Festival Stage & Seat Map ───────────────── */}
        <div className="lg:col-span-7 bg-[#111119] border border-white/10 rounded-3xl p-6 shadow-xl">
          
          {/* Main Stage Representation */}
          <div className="w-full py-3.5 mb-6 rounded-2xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-white/20 text-center font-black text-xs uppercase tracking-widest text-white shadow-inner">
            🎸 [ MAIN STAGE — เวทีหลัก ]
          </div>

          {/* Zones Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {zones.map(z => {
              const isSelected = selectedZone?.id === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => handleZoneChange(z)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-white/10 shadow-lg'
                      : 'border-white/10 bg-[#161622] hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-bold text-white truncate">{z.name}</p>
                  <p className="text-xs font-mono font-black text-cyan-300 mt-1">
                    ฿{z.price.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {z.category === 'SEATED' ? 'มีเลขที่นั่ง' : 'บัตรยืน/แคมป์'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Seat Map ONLY if SEATED, or Standing Info if STANDING */}
          {isSeatedZone ? (
            <div className="p-6 rounded-2xl bg-[#0c0c14] border border-white/10 text-center">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                  <Armchair className="w-4 h-4 text-amber-300" />
                  ผังเลือกที่นั่งโซน VIP Seated (คลิกเลือกเลขที่นั่ง)
                </div>
                <span className="text-[11px] text-gray-400">
                  เลือกแล้ว: <strong className="text-cyan-300 font-mono">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'ยังไม่ได้เลือก'}</strong>
                </span>
              </div>

              {/* Seating Grid */}
              <div className="space-y-2.5 max-w-sm mx-auto my-4">
                {rows.map(r => (
                  <div key={r} className="flex items-center justify-center gap-2">
                    <span className="w-5 text-xs font-mono font-bold text-gray-400">{r}</span>
                    <div className="flex gap-1.5">
                      {cols.map(c => {
                        const code = `${r}-${String(c).padStart(2, '0')}`;
                        const isTaken = TAKEN_SEATS.includes(code);
                        const isChosen = selectedSeats.includes(code);

                        return (
                          <button
                            key={code}
                            type="button"
                            disabled={isTaken}
                            onClick={() => handleToggleSeat(code)}
                            title={isTaken ? `ที่นั่ง ${code} มีผู้จองแล้ว` : `เลือกที่นั่ง ${code}`}
                            className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                              isTaken
                                ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                                : isChosen
                                ? 'bg-cyan-400 text-black border border-cyan-300 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                : 'bg-[#1a1a28] text-gray-300 border border-white/15 hover:border-cyan-400 hover:text-white'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 border-t border-white/10 pt-3 mt-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#1a1a28] border border-white/20 inline-block" />
                  ว่าง
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cyan-400 inline-block" />
                  เลือกอยู่
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-800 border border-gray-700 inline-block" />
                  มีผู้จองแล้ว
                </span>
              </div>
            </div>
          ) : (
            /* Standing / Camping Zone View — Simple Quantity, No Seat Numbers Needed! */
            <div className="p-6 rounded-2xl bg-[#0c0c14] border border-white/10 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                {selectedZone?.name} (โซนบัตรยืนอิสระ)
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 mb-5">
                บัตรโซนนี้เป็นบัตรยืน/แคมป์ ไม่จำเป็นต้องเลือกเลขที่นั่ง สามารถเดินเข้างานและเลือกจุดยืนชมได้อย่างอิสระ
              </p>

              {/* Quantity Selector */}
              <div className="inline-flex items-center gap-4 p-2 rounded-2xl bg-[#161622] border border-white/15">
                <span className="text-xs text-gray-400 pl-3">จำนวนบัตร:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        quantity === num
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Summary & Booking Form ───────────────────────────── */}
        <div className="lg:col-span-5 bg-[#111119] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-black text-white mb-4 pb-3 border-b border-white/10">
            สรุปการจอง & กรอกข้อมูลผู้ซื้อ
          </h2>

          {/* Booking Summary Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">โซนที่เลือก:</span>
              <span className="font-bold text-white">{selectedZone?.name}</span>
            </div>
            {isSeatedZone && (
              <div className="flex justify-between">
                <span className="text-gray-400">เลขที่นั่ง:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'ยังไม่ได้เลือก'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">จำนวน:</span>
              <span className="font-bold text-white">{effectiveQty} ใบ</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
              <span className="font-bold text-gray-300">ยอดรวมทั้งหมด:</span>
              <span className="font-black text-cyan-400 text-base">฿{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Optional LINE Connection Status */}
          <div className="mb-6 p-3 rounded-2xl bg-[#06c755]/10 border border-[#06c755]/30">
            {lineUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#06c755]" />
                  <span className="text-xs text-[#06c755] font-semibold">
                    เชื่อมต่อ LINE: {lineUser.displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectLine}
                  className="text-[10px] text-gray-400 hover:text-white"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">
                  ต้องการรับตั๋วทาง LINE อัตโนมัติ?
                </span>
                <button
                  type="button"
                  onClick={handleLineLogin}
                  className="px-3 py-1 rounded-lg bg-[#06c755] text-white font-bold text-xs hover:bg-[#05b04b] transition-colors"
                >
                  เชื่อม LINE
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                ชื่อ - นามสกุลผู้ซื้อ *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สมชาย รักเสียงเพลง"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#161622] border border-white/15 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                เบอร์โทรศัพท์มือถือ *
              </label>
              <input
                type="tel"
                required
                placeholder="เช่น 081-234-5678"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#161622] border border-white/15 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer mt-4"
            >
              {submitting ? 'กำลังสร้างการจอง...' : 'ไปหน้าชำระเงิน (Next Step)'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
