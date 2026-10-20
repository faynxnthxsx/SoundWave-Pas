import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tent, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Check, LogOut } from 'lucide-react';

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

  // LINE Login Channel Config
  const LINE_CLIENT_ID = '2012117630';
  const LINE_CALLBACK_URL = window.location.origin + '/booking/zone-select';

  useEffect(() => {
    // 1. Fetch concert & zones
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
      .catch(err => {
        console.error('Failed to load zones:', err);
      });

    // 2. Check for LINE Login callback authorization code (?code=...)
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
            // Save in localStorage for ease
            localStorage.setItem('soundwave_line_user', JSON.stringify(data.user));
          } else {
            console.error('LINE verification failed:', data.message);
          }
        })
        .catch(err => console.error(err))
        .finally(() => {
          setLineLoading(false);
          // Clean query string from browser bar
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else {
      // Check existing session in localStorage
      try {
        const saved = localStorage.getItem('soundwave_line_user');
        if (saved) {
          const u = JSON.parse(saved);
          setLineUser(u);
          setCustomerName(u.displayName || '');
          setCustomerLineId(u.userId || '');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Trigger LINE OAuth Redirect
  const handleLineLogin = () => {
    const state = 'swp_' + Math.random().toString(36).substring(7);
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINE_CALLBACK_URL)}&state=${state}&scope=profile%20openid`;
    window.location.href = lineAuthUrl;
  };

  // Mock LINE login for instant demo testing
  const handleMockLineLogin = () => {
    const mockUser = {
      userId: 'U' + Math.random().toString(36).substring(2, 12) + 'demo',
      displayName: 'สมชาย รักเสียงเพลง (LINE User)',
      pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
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

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZone) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์');
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
    } catch (err) {
      console.error(err);
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      setSubmitting(false);
    }
  };

  if (!concert) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400">
        กำลังโหลดแผนผังโซนบัตร...
      </div>
    );
  }

  const totalPrice = selectedZone ? selectedZone.price * quantity : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <span className="text-xs uppercase font-bold tracking-widest text-[#00f0ff]">
          SOUNDWAVE STAGE & SEATING MAP
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          เลือกโซนบัตรคอนเสิร์ต
        </h1>
        <p className="text-gray-400 text-sm mt-1">{concert.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Interactive Zone Map */}
        <div className="lg:col-span-7 bg-[#10101a] border border-[#232338] rounded-3xl p-6">
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
              คลิกที่โซนในแผนที่เพื่อเลือกบัตร
            </span>
          </div>

          {/* Interactive Concert Stage Diagram */}
          <div className="relative border-2 border-[#2a2a40] rounded-2xl p-5 bg-[#08080f] overflow-hidden">
            {/* Stage Banner */}
            <div className="w-full py-3 mb-6 rounded-xl bg-gradient-to-r from-[#00f0ff] via-[#ff007f] to-[#ffe600] text-black font-black text-center text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              🎸 MAIN STAGE (เวทีการแสดงหลัก) ⚡
            </div>

            {/* Standing Pit A & B */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {zones.filter(z => z.category === 'STANDING').map(zone => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`p-4 rounded-xl text-left border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#14142b] border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-[1.02]'
                        : 'bg-[#10101e] border-[#25253e] hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-[#00f0ff]">{zone.name}</span>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-lg font-black text-white">฿{zone.price.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400 mt-1">คงเหลือ: {zone.available} ใบ</div>
                  </button>
                );
              })}
            </div>

            {/* Grandstand Seated */}
            {zones.filter(z => z.category === 'SEATED').map(zone => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`w-full p-4 mb-3 rounded-xl text-left border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1b1910] border-[#ffe600] shadow-[0_0_20px_rgba(255,230,0,0.3)] scale-[1.01]'
                      : 'bg-[#12121a] border-[#25253e] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase text-[#ffe600]">{zone.name}</span>
                    <Sparkles className="w-4 h-4 text-[#ffe600]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black text-white">฿{zone.price.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400">คงเหลือ: {zone.available} ที่นั่ง</div>
                  </div>
                </button>
              );
            })}

            {/* Camping Zone */}
            {zones.filter(z => z.category === 'CAMPING').map(zone => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`w-full p-4 rounded-xl text-left border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0f1f14] border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.3)] scale-[1.01]'
                      : 'bg-[#0e1610] border-[#1d2d20] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase text-[#39ff14]">{zone.name}</span>
                    <Tent className="w-4 h-4 text-[#39ff14]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black text-white">฿{zone.price.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400">คงเหลือ: {zone.available} จุดกางเต็นท์</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Booking Form & Summary */}
        <div className="lg:col-span-5 bg-[#12121e] border border-[#26263d] rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white pb-3 border-b border-[#26263d] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00f0ff]" />
            รายละเอียดคำสั่งซื้อ
          </h2>

          {selectedZone && (
            <div className="mt-4 p-4 rounded-2xl bg-[#181827] border border-[#2c2c42]">
              <span className="text-xs text-gray-400 uppercase font-semibold">โซนที่เลือก:</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-white text-lg">{selectedZone.name}</span>
                <span className="font-extrabold text-[#00f0ff] text-lg">฿{selectedZone.price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{selectedZone.description}</p>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mt-5">
            <label className="text-xs text-gray-400 uppercase font-semibold block mb-2">จำนวนบัตร (สูงสุด 4 ใบ)</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#181827] border border-[#2c2c42] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-[#252538] text-white font-bold hover:bg-[#35354e] transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-white text-lg">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(4, quantity + 1))}
                  className="w-10 h-10 rounded-lg bg-[#252538] text-white font-bold hover:bg-[#35354e] transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">ใบ</span>
            </div>
          </div>

          <form onSubmit={handleBookingSubmit} className="mt-6 space-y-4">
            {/* LINE Login Action Banner */}
            {lineLoading ? (
              <div className="p-3.5 bg-[#06c755]/10 border border-[#06c755]/30 rounded-2xl text-center text-xs text-[#06c755] font-semibold">
                กำลังยืนยันตัวตนกับ LINE...
              </div>
            ) : lineUser ? (
              <div className="p-3.5 bg-[#06c755]/15 border border-[#06c755]/40 rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(6,199,85,0.15)]">
                <div className="flex items-center gap-3 min-w-0">
                  {lineUser.pictureUrl ? (
                    <img src={lineUser.pictureUrl} alt={lineUser.displayName} className="w-10 h-10 rounded-full border-2 border-[#06c755] shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#06c755] text-white font-bold flex items-center justify-center shrink-0">
                      L
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{lineUser.displayName}</p>
                      <span className="text-[9px] bg-[#06c755] text-black font-black px-1.5 py-0.5 rounded">CONNECTED</span>
                    </div>
                    <p className="text-[10px] text-[#06c755] font-mono truncate mt-0.5">
                      🟢 บัตรคอนเสิร์ตจะเด้งเข้าแชท LINE นี้อัตโนมัติ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectLine}
                  title="เปลี่ยนบัญชี LINE"
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-[#06c755]/10 border border-[#06c755]/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#06c755] animate-ping" />
                    ต้องการรับตั๋วเข้าแอป LINE โดยตรง?
                  </span>
                  <span className="text-[10px] bg-[#06c755]/20 text-[#06c755] font-bold px-2 py-0.5 rounded-full">แนะนำ</span>
                </div>
                <button
                  type="button"
                  onClick={handleLineLogin}
                  className="w-full py-2.5 rounded-xl bg-[#06c755] text-white font-extrabold text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#05b34c] transition-colors cursor-pointer shadow-[0_0_15px_rgba(6,199,85,0.3)]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.3 3.63 7.9 8.52 8.62.33.07.78.22.89.51.1.26.07.67.03 1.04-.08.76-.36 2.9-.4 3.32-.07.64.24.78.68.54.43-.24 4.7-2.77 6.42-3.79 3.65-2.15 5.86-5.46 5.86-9.24C22 5.92 17.52 2 12 2z" />
                  </svg>
                  เข้าสู่ระบบด้วย LINE (Log in with LINE)
                </button>
                <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-1">
                  <span>ไม่ต้องพิมพ์ชื่อ ระบบจะดึงโปรไฟล์ LINE ให้อัตโนมัติ</span>
                  <button
                    type="button"
                    onClick={handleMockLineLogin}
                    className="text-[#00f0ff] hover:underline cursor-pointer"
                  >
                    (คลิกทดสอบทันที)
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">
                ชื่อ - นามสกุล ผู้รับตั๋ว <span className="text-[#ff007f]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สมชาย ใจร็อก"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-[#181827] border border-[#2c2c42] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">
                เบอร์โทรศัพท์ <span className="text-[#ff007f]">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="เช่น 0812345678"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-[#181827] border border-[#2c2c42] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#ff007f]/15 border border-[#ff007f]/40 text-[#ff007f] rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Total Summary */}
            <div className="pt-4 border-t border-[#26263d] flex items-center justify-between">
              <span className="text-gray-400 text-sm">ยอดชำระสุทธิ:</span>
              <span className="text-2xl font-black text-[#00f0ff]">
                ฿{totalPrice.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#ff007f] text-black font-extrabold uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'กำลังล็อกสิทธิ์...' : 'ดำเนินการชำระเงิน (ล็อกสิทธิ์ 10 นาที)'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
