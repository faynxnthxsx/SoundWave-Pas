import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, LogOut, Zap } from 'lucide-react';

const ZONE_META = {
  STANDING: { emoji: '🎸', label: 'Standing Zone', accent: '#00f0ff' },
  SEATED:   { emoji: '⭐', label: 'VIP Seated',    accent: '#ffe600' },
  CAMPING:  { emoji: '⛺', label: 'Camping Pass',  accent: '#39ff14' },
};

export default function ZoneSelectPage() {
  const navigate = useNavigate();
  const [concert, setConcert] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLineId, setCustomerLineId] = useState('');
  const [lineUser, setLineUser] = useState(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1); // 1=zone select, 2=fill form

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

  const handleLineLogin = () => {
    const state = 'swp_' + Math.random().toString(36).substring(7);
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINE_CALLBACK_URL)}&state=${state}&scope=profile%20openid`;
  };

  const handleMockLineLogin = () => {
    const u = {
      userId: 'U' + Math.random().toString(36).substring(2, 18),
      displayName: 'สมชาย รักเสียงเพลง',
      pictureUrl: null,
    };
    setLineUser(u);
    setCustomerName(u.displayName);
    setCustomerLineId(u.userId);
    localStorage.setItem('soundwave_line_user', JSON.stringify(u));
  };

  const handleDisconnectLine = () => {
    setLineUser(null);
    setCustomerLineId('');
    localStorage.removeItem('soundwave_line_user');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZone || !customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concertId: concert.id,
          zoneId: selectedZone.id,
          quantity,
          customerName,
          customerPhone,
          customerLineId: customerLineId.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/booking/payment/${data.data.bookingCode}`);
      } else {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการจอง');
        setSubmitting(false);
      }
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      setSubmitting(false);
    }
  };

  const totalPrice = selectedZone ? selectedZone.price * quantity : 0;
  const standing = zones.filter(z => z.category === 'STANDING');
  const seated   = zones.filter(z => z.category === 'SEATED');
  const camping  = zones.filter(z => z.category === 'CAMPING');

  if (!concert) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Page title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-black uppercase tracking-widest mb-4">
          <Zap className="w-3.5 h-3.5" />
          SOUNDWAVE PASS · TICKET ZONE SELECTION
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white">
          เลือก<span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#00f0ff,#ff007f)' }}>โซนบัตร</span>คอนเสิร์ต
        </h1>
        <p className="text-gray-400 text-sm mt-2">{concert.name}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* ── LEFT: Interactive Stage Map ─────────────────────────── */}
        <div className="xl:col-span-7">
          <div
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #0e0e1c 0%, #12102a 100%)',
              border: '1px solid #2a2a40',
              boxShadow: '0 0 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* BG glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#ff007f]/10 blur-3xl pointer-events-none" />

            {/* ── Main Stage Banner ── */}
            <div
              className="w-full py-4 mb-8 rounded-2xl text-center font-black text-sm uppercase tracking-[4px] text-black relative overflow-hidden"
              style={{
                background: 'linear-gradient(90deg,#ff007f,#ffe600,#00f0ff)',
                boxShadow: '0 0 30px rgba(255,0,127,0.5)',
              }}
            >
              <span className="relative z-10 drop-shadow">🎸 STAGE AREA — MAIN NEON STAGE ⚡</span>
            </div>

            {/* ── Standing Pit A & B (row) ── */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {standing.map(zone => {
                const isSelected = selectedZone?.id === zone.id;
                const meta = ZONE_META[zone.category];
                return (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    meta={meta}
                    isSelected={isSelected}
                    onClick={() => { setSelectedZone(zone); setStep(2); }}
                    size="md"
                  />
                );
              })}
            </div>

            {/* ── Grandstand Seated (full width) ── */}
            {seated.map(zone => {
              const isSelected = selectedZone?.id === zone.id;
              const meta = ZONE_META[zone.category];
              return (
                <div key={zone.id} className="mb-3">
                  <ZoneCard
                    zone={zone}
                    meta={meta}
                    isSelected={isSelected}
                    onClick={() => { setSelectedZone(zone); setStep(2); }}
                    size="lg"
                  />
                </div>
              );
            })}

            {/* ── Camping (full width) ── */}
            {camping.map(zone => {
              const isSelected = selectedZone?.id === zone.id;
              const meta = ZONE_META[zone.category];
              return (
                <div key={zone.id}>
                  <ZoneCard
                    zone={zone}
                    meta={meta}
                    isSelected={isSelected}
                    onClick={() => { setSelectedZone(zone); setStep(2); }}
                    size="lg"
                    dashed
                  />
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-[#222238]">
              {Object.values(ZONE_META).map(m => (
                <div key={m.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: m.accent }} />
                  {m.emoji} {m.label}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
                <span className="w-2.5 h-2.5 rounded-sm bg-white/20" />
                คลิกเพื่อเลือก
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Order Summary + Form ─────────────────────────── */}
        <div className="xl:col-span-5 space-y-4">

          {/* Selected Zone Card */}
          {selectedZone ? (
            <div
              className="rounded-2xl p-5 border-2 transition-all"
              style={{
                borderColor: ZONE_META[selectedZone.category].accent + '60',
                background: `linear-gradient(135deg, #12121e, ${ZONE_META[selectedZone.category].accent}10)`,
                boxShadow: `0 0 30px ${ZONE_META[selectedZone.category].accent}20`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: ZONE_META[selectedZone.category].accent }}>
                    {ZONE_META[selectedZone.category].emoji} โซนที่เลือก
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">{selectedZone.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{selectedZone.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-2xl font-black" style={{ color: ZONE_META[selectedZone.category].accent }}>
                    ฿{selectedZone.price.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">เหลือ {selectedZone.available} ใบ</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 border-2 border-dashed border-[#2a2a40] text-center">
              <p className="text-gray-500 text-sm">👈 กดเลือกโซนบัตรจากแผนที่ทางซ้าย</p>
            </div>
          )}

          {/* Quantity */}
          {selectedZone && (
            <div className="bg-[#12121e] border border-[#26263d] rounded-2xl p-5">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-3">
                จำนวนบัตร (สูงสุด 4 ใบ)
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0 bg-[#1a1a2c] rounded-xl overflow-hidden border border-[#2a2a40]">
                  <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-12 text-white font-black text-xl hover:bg-[#ff007f]/20 transition-colors">–</button>
                  <span className="w-12 text-center font-black text-xl text-white">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(q => Math.min(4, q + 1))}
                    className="w-12 h-12 text-white font-black text-xl hover:bg-[#00f0ff]/20 transition-colors">+</button>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">รวมทั้งสิ้น</div>
                  <div className="text-2xl font-black text-[#00f0ff]">฿{totalPrice.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* LINE Login section */}
          <div className="bg-[#12121e] border border-[#26263d] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-gray-300">รับตั๋วผ่าน LINE</span>
              <span className="text-[10px] bg-[#06c755]/20 text-[#06c755] font-black px-2 py-0.5 rounded-full">แนะนำ</span>
            </div>

            {lineLoading ? (
              <div className="py-3 text-center text-xs text-[#06c755] animate-pulse">กำลังยืนยันตัวตนกับ LINE...</div>
            ) : lineUser ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#06c755]/10 border border-[#06c755]/30">
                {lineUser.pictureUrl ? (
                  <img src={lineUser.pictureUrl} alt="" className="w-10 h-10 rounded-full border-2 border-[#06c755] shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#06c755]/30 flex items-center justify-center text-lg shrink-0">💚</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{lineUser.displayName}</p>
                  <p className="text-[#06c755] text-[10px]">🟢 บัตรจะเด้งเข้าแชท LINE อัตโนมัติ</p>
                </div>
                <button onClick={handleDisconnectLine} title="ยกเลิกการเชื่อมต่อ"
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors shrink-0">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button type="button" onClick={handleLineLogin}
                  className="w-full py-3 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: '#06c755', boxShadow: '0 0 20px rgba(6,199,85,0.3)' }}>
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.3 3.63 7.9 8.52 8.62.33.07.78.22.89.51.1.26.07.67.03 1.04-.08.76-.36 2.9-.4 3.32-.07.64.24.78.68.54.43-.24 4.7-2.77 6.42-3.79 3.65-2.15 5.86-5.46 5.86-9.24C22 5.92 17.52 2 12 2z" />
                  </svg>
                  เข้าสู่ระบบด้วย LINE
                </button>
                <button type="button" onClick={handleMockLineLogin}
                  className="w-full py-2 rounded-xl text-xs text-gray-400 border border-[#2a2a40] hover:border-[#06c755]/40 hover:text-[#06c755] transition-all">
                  ⚡ (ทดสอบด่วน — จำลองการเชื่อมต่อ LINE)
                </button>
              </div>
            )}
          </div>

          {/* Customer Form */}
          <form onSubmit={handleBookingSubmit} className="bg-[#12121e] border border-[#26263d] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">ข้อมูลผู้รับตั๋ว</h3>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">ชื่อ - นามสกุล <span className="text-[#ff007f]">*</span></label>
              <input type="text" required
                placeholder="เช่น สมชาย ใจร็อก"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-[#1a1a2c] border border-[#2c2c42] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">เบอร์โทรศัพท์ <span className="text-[#ff007f]">*</span></label>
              <input type="tel" required
                placeholder="เช่น 0812345678"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-[#1a1a2c] border border-[#2c2c42] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <button type="submit" disabled={submitting || !selectedZone}
              className="w-full py-4 rounded-xl font-extrabold text-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: selectedZone ? 'linear-gradient(135deg,#00f0ff,#ff007f)' : '#333',
                boxShadow: selectedZone ? '0 0 30px rgba(0,240,255,0.3)' : 'none',
              }}>
              {submitting ? 'กำลังล็อกสิทธิ์...' : selectedZone ? `ล็อกสิทธิ์ 10 นาที — ฿${totalPrice.toLocaleString()}` : 'กรุณาเลือกโซนก่อน'}
              {!submitting && selectedZone && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-[11px] text-gray-500">
              ⏱ บัตรจะถูกล็อกสิทธิ์ 10 นาทีเพื่อรอการชำระเงิน
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Zone Card Component ──────────────────────────────────────────────────────
function ZoneCard({ zone, meta, isSelected, onClick, size = 'md', dashed = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
        dashed ? 'border-dashed' : ''
      } ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
      style={{
        borderColor: isSelected ? meta.accent : meta.accent + '40',
        background: isSelected
          ? `linear-gradient(135deg, #12121e, ${meta.accent}18)`
          : `linear-gradient(135deg, #0e0e1a, ${meta.accent}08)`,
        boxShadow: isSelected ? `0 0 30px ${meta.accent}30, inset 0 0 30px ${meta.accent}05` : 'none',
      }}
    >
      {/* Selected glow overlay */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 40px ${meta.accent}15` }} />
      )}

      {/* Checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: meta.accent }}>
          <CheckCircle2 className="w-4 h-4 text-black" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{meta.emoji}</span>
            <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: meta.accent }}>
              {zone.category}
            </span>
          </div>
          <h4 className="font-black text-white text-sm leading-tight">{zone.name}</h4>
          {size === 'lg' && (
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{zone.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-black" style={{ color: meta.accent }}>
            ฿{zone.price.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">เหลือ {zone.available} ใบ</div>
        </div>
      </div>
    </button>
  );
}
