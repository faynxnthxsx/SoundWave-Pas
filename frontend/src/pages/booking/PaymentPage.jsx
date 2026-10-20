import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Ticket, Zap, Copy } from 'lucide-react';

export default function PaymentPage() {
  const { bookingCode } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isExpired, setIsExpired] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${bookingCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBooking(data.data);
          if (data.data.status === 'PAID') {
            setPaidSuccess(true);
            setTickets(data.data.tickets || []);
          } else if (data.data.status === 'EXPIRED') {
            setIsExpired(true);
          } else {
            const diffSec = Math.floor((new Date(data.data.expiresAt).getTime() - Date.now()) / 1000);
            if (diffSec <= 0) setIsExpired(true);
            else setTimeLeft(diffSec);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingCode]);

  useEffect(() => {
    if (paidSuccess || isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); setIsExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paidSuccess, isExpired]);

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/bookings/${bookingCode}/pay`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPaidSuccess(true);
        setTickets(data.data.tickets || []);
        // Confetti-like effect using CSS
        triggerConfetti();
      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch { alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
    finally { setPaying(false); }
  };

  const triggerConfetti = () => {
    try {
      import('canvas-confetti').then(m => {
        m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 },
          colors: ['#00f0ff','#ff007f','#ffe600','#39ff14','#ffffff'] });
      });
    } catch {}
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const urgentTime = timeLeft <= 120; // Last 2 minutes

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="w-12 h-12 text-[#ff007f] mb-3" />
      <h2 className="text-xl font-bold text-white">ไม่พบรหัสการจองนี้</h2>
      <Link to="/" className="mt-4 px-5 py-2.5 rounded-xl bg-[#1a1a28] text-[#00f0ff] border border-[#00f0ff]/30 text-sm">
        กลับหน้าแรก
      </Link>
    </div>
  );

  // ── SUCCESS SCREEN ──────────────────────────────────────────────
  if (paidSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* Success animation */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-full bg-[#39ff14]/10 border-2 border-[#39ff14] flex items-center justify-center mx-auto"
            style={{ boxShadow: '0 0 40px rgba(57,255,20,0.4), 0 0 80px rgba(57,255,20,0.1)' }}>
            <CheckCircle2 className="w-12 h-12 text-[#39ff14]" />
          </div>
          {/* Orbiting rings */}
          {[1,2,3].map(i => (
            <div key={i} className="absolute rounded-full border border-[#39ff14]/20 animate-ping"
              style={{ inset: `-${i*16}px`, animationDuration: `${1.5 + i*0.5}s`, animationDelay: `${i*0.2}s` }} />
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] text-xs font-black uppercase tracking-widest mb-4">
          PAYMENT SUCCESSFUL ✓
        </div>

        <h1 className="text-4xl font-black text-white mb-2">ชำระเงินสำเร็จ!</h1>
        <p className="text-gray-400 text-sm mb-2">
          รหัสการจอง: <span className="text-[#00f0ff] font-bold font-mono">{booking.bookingCode}</span>
        </p>

        {booking.customerLineId && (
          <div className="mt-4 mb-8 inline-flex items-center gap-2 px-4 py-2.5 bg-[#06c755]/15 border border-[#06c755]/40 rounded-xl text-sm text-[#06c755] font-semibold">
            <svg className="w-5 h-5 fill-[#06c755]" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.3 3.63 7.9 8.52 8.62.33.07.78.22.89.51.1.26.07.67.03 1.04-.08.76-.36 2.9-.4 3.32-.07.64.24.78.68.54.43-.24 4.7-2.77 6.42-3.79 3.65-2.15 5.86-5.46 5.86-9.24C22 5.92 17.52 2 12 2z" />
            </svg>
            ส่งการ์ดตั๋วเข้า LINE ของคุณเรียบร้อยแล้ว!
          </div>
        )}

        {/* Tickets issued */}
        <div className="space-y-3 mt-6 text-left">
          {tickets.map(tkt => (
            <div key={tkt.id}
              className="p-4 rounded-2xl border border-[#2a2a40] relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#111120,#1a1030)' }}>
              {/* Dashed separator line (like physical ticket) */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[#ffffff10] pointer-events-none" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Ticket Code</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-black text-white font-mono text-lg">{tkt.ticketCode}</p>
                    <button onClick={() => copyCode(tkt.ticketCode)}
                      className="text-gray-500 hover:text-[#00f0ff] transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#00f0ff] mt-0.5">{tkt.attendeeName}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link to={`/tickets/${tkt.ticketCode}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg,#00f0ff30,#00f0ff15)', border: '1px solid #00f0ff50', color: '#00f0ff' }}>
                    <Ticket className="w-3.5 h-3.5" /> ดูบัตร
                  </Link>
                  <Link to={`/tickets/${tkt.ticketCode}/print`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg,#ffe60030,#ffe60015)', border: '1px solid #ffe60050', color: '#ffe600' }}>
                    🖨️ พิมพ์ A4
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {copied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#39ff14] text-black text-xs font-bold px-4 py-2 rounded-xl">
            คัดลอกรหัสตั๋วเรียบร้อย ✓
          </div>
        )}

        <Link to={`/tickets/${tickets[0]?.ticketCode || ''}`}
          className="mt-8 inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-black text-sm uppercase tracking-wider transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#00f0ff,#ff007f)', boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}>
          <Zap className="w-5 h-5" />
          เปิดดูบัตรเข้างานทันที
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // ── EXPIRED SCREEN ──────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-[#ff007f]/10 border-2 border-[#ff007f] flex items-center justify-center mx-auto mb-6"
          style={{ boxShadow: '0 0 30px rgba(255,0,127,0.3)' }}>
          <AlertTriangle className="w-10 h-10 text-[#ff007f]" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] text-xs font-black uppercase tracking-widest mb-4">
          หมดเวลาชำระเงิน
        </div>
        <h1 className="text-3xl font-black text-white mb-3">เกินระยะเวลา 10 นาที</h1>
        <p className="text-gray-400 text-sm mb-8">
          รายการจอง <span className="font-mono text-white">{booking.bookingCode}</span> ถูกยกเลิกอัตโนมัติ
          ระบบได้คืนที่นั่งกลับสู่ระบบเรียบร้อยแล้ว
        </p>
        <Link to="/booking/zone-select"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-black text-sm uppercase transition-all hover:scale-105"
          style={{ background: '#00f0ff', boxShadow: '0 0 25px rgba(0,240,255,0.4)' }}>
          <ArrowRight className="w-4 h-4" />
          จองบัตรใหม่อีกครั้ง
        </Link>
      </div>
    );
  }

  // ── PAYMENT SCREEN ──────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black tracking-wider mb-4 transition-all ${
            urgentTime
              ? 'bg-red-500/20 border-2 border-red-500/60 text-red-400 animate-pulse'
              : 'bg-[#ff007f]/10 border border-[#ff007f]/40 text-[#ff007f]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ล็อกสิทธิ์: </span>
          <span className="font-mono text-xl font-black">{fmt(timeLeft)}</span>
          {urgentTime && <span className="text-xs">⚠ เหลือน้อยแล้ว!</span>}
        </div>

        <h1 className="text-3xl font-black text-white">ชำระเงินผ่าน PromptPay</h1>
        <p className="text-xs text-gray-400 mt-1">รหัสการจอง: <span className="text-white font-mono">{booking.bookingCode}</span></p>
      </div>

      {/* Main Card */}
      <div
        className="rounded-3xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(160deg, #12121e, #1a1030)',
          border: '1px solid #2a2a40',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* QR Code */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="bg-white p-5 rounded-2xl relative"
            style={{ boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
          >
            {/* PromptPay header */}
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#003d79] text-white text-[10px] font-black tracking-widest">
                <span>💳</span> PROMPTPAY · พร้อมเพย์
              </div>
            </div>

            <QRCodeSVG
              value={`https://promptpay.io/0812345678/${booking.totalAmount}`}
              size={220}
              level="M"
              includeMargin={false}
            />

            {/* Bottom label */}
            <div className="text-center mt-3">
              <p className="text-[10px] text-gray-500 font-mono">SoundWave Pass · ชำระผ่านแอปธนาคาร</p>
            </div>
          </div>
        </div>

        {/* Amount & Info */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">ยอดที่ต้องชำระ</p>
          <div className="text-5xl font-black text-[#00f0ff] mt-1"
            style={{ textShadow: '0 0 20px rgba(0,240,255,0.4)' }}>
            ฿{booking.totalAmount.toLocaleString()}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {booking.customerName} · {booking.customerPhone}
          </p>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-[#0e0e18] border border-[#222234]">
          {booking.items?.map((item, i) => (
            <React.Fragment key={i}>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">โซนบัตร</p>
                <p className="text-white font-bold text-sm mt-0.5">{item.zone?.name || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">จำนวน</p>
                <p className="text-white font-bold text-sm mt-0.5">{item.quantity} ใบ × ฿{item.pricePerUnit?.toLocaleString()}</p>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* CTA — simulate payment */}
        <button
          type="button"
          disabled={paying}
          onClick={handleSimulatePayment}
          className="w-full py-4 rounded-2xl font-black text-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: paying ? '#555' : 'linear-gradient(135deg,#39ff14,#00f0ff)',
            boxShadow: paying ? 'none' : '0 0 30px rgba(57,255,20,0.35)',
          }}
        >
          <CheckCircle2 className="w-5 h-5" />
          {paying ? 'กำลังยืนยันการชำระเงิน...' : '[จำลอง] ฉันโอนเงินเรียบร้อยแล้ว!'}
        </button>

        <p className="text-center text-[11px] text-gray-600 mt-3">
          * ในโหมดทดสอบ: กดปุ่มนี้เพื่อจำลองการยืนยันยอดเงินจากธนาคาร
        </p>
      </div>
    </div>
  );
}
