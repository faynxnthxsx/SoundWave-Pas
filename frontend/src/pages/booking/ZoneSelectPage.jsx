import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tent, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ZoneSelectPage() {
  const navigate = useNavigate();
  const [concert, setConcert] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLineId, setCustomerLineId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      .catch(err => {
        console.error('Failed to load zones:', err);
      });
  }, []);

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
            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              คลิกที่โซนเพื่อเลือกซื้อบัตร
            </span>
          </div>

          {/* Interactive Concert Stage Plan */}
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Stage */}
            <div className="w-full py-4 bg-gradient-to-r from-[#202035] via-[#2f1f45] to-[#202035] border-2 border-[#ff007f] rounded-2xl text-center shadow-[0_0_20px_rgba(255,0,127,0.3)]">
              <span className="text-sm font-black tracking-widest text-white uppercase flex items-center justify-center gap-2">
                ⚡ MAIN STAGE (เวทีหลัก) 🎸
              </span>
            </div>

            {/* Standing Pit A */}
            {zones.filter(z => z.name.includes('Pit A')).map(zone => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone)}
                className={`w-full p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedZone?.id === zone.id
                    ? 'border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                    : 'border-[#00f0ff]/40 bg-[#00f0ff]/5 hover:bg-[#00f0ff]/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm sm:text-base">{zone.name}</span>
                  <span className="font-extrabold text-[#00f0ff]">฿{zone.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                  <span>บัตรยืนหน้าเวทีขอบติดรั้ว</span>
                  <span className="text-[#39ff14]">ว่าง {zone.available} ใบ</span>
                </div>
              </button>
            ))}

            {/* Standing Pit B */}
            {zones.filter(z => z.name.includes('Pit B')).map(zone => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone)}
                className={`w-full p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedZone?.id === zone.id
                    ? 'border-[#ff007f] bg-[#ff007f]/15 shadow-[0_0_20px_rgba(255,0,127,0.3)]'
                    : 'border-[#ff007f]/40 bg-[#ff007f]/5 hover:bg-[#ff007f]/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm sm:text-base">{zone.name}</span>
                  <span className="font-extrabold text-[#ff007f]">฿{zone.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                  <span>โซนยืนกึ่งกลาง กระโดดมันส์</span>
                  <span className="text-[#39ff14]">ว่าง {zone.available} ใบ</span>
                </div>
              </button>
            ))}

            {/* Grandstand Seated & Camping Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {zones.filter(z => z.category === 'SEATED').map(zone => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedZone?.id === zone.id
                      ? 'border-[#ffe600] bg-[#ffe600]/15 shadow-[0_0_20px_rgba(255,230,0,0.3)]'
                      : 'border-[#ffe600]/40 bg-[#ffe600]/5 hover:bg-[#ffe600]/10'
                  }`}
                >
                  <span className="font-bold text-white text-sm block">{zone.name}</span>
                  <span className="font-extrabold text-[#ffe600] text-sm mt-1 block">฿{zone.price.toLocaleString()}</span>
                  <span className="text-[11px] text-gray-400 mt-1 block">อัฒจันทร์ยกระดับ มีที่นั่ง</span>
                </button>
              ))}

              {zones.filter(z => z.category === 'CAMPING').map(zone => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedZone?.id === zone.id
                      ? 'border-[#39ff14] bg-[#39ff14]/15 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                      : 'border-[#39ff14]/40 bg-[#39ff14]/5 hover:bg-[#39ff14]/10'
                  }`}
                >
                  <span className="font-bold text-white text-sm block">{zone.name}</span>
                  <span className="font-extrabold text-[#39ff14] text-sm mt-1 block">฿{zone.price.toLocaleString()}</span>
                  <span className="text-[11px] text-gray-400 mt-1 block">ลานกางเต็นท์ 2 วัน 1 คืน</span>
                </button>
              ))}
            </div>
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

            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">
                LINE User ID (ไม่บังคับ - สำหรับรับบัตรเข้าแชท)
              </label>
              <input
                type="text"
                placeholder="เช่น U1234567890abcdef..."
                value={customerLineId}
                onChange={e => setCustomerLineId(e.target.value)}
                className="w-full bg-[#181827] border border-[#2c2c42] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                ระบบจะส่งการ์ดตั๋วเรืองแสง (LINE Flex Message) เข้าแชทคุณโดยอัตโนมัติ
              </span>
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
