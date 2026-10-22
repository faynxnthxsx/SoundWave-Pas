import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Ticket, Copy, Printer } from 'lucide-react';

export default function PaymentPage() {
  const { bookingCode } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isExpired, setIsExpired] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [lineDelivery, setLineDelivery] = useState(null);
  const [retryingLine, setRetryingLine] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${bookingCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBooking(data.data);
          setLineDelivery({ status: data.data.lineDeliveryStatus || (data.data.customerLineId ? 'UNKNOWN' : 'NOT_LINKED'), error: data.data.lineDeliveryError || null });
          if (data.data.status === 'PAID') {
            setPaidSuccess(true);
            const tList = data.data.tickets || [];
            setTickets(tList);
            try {
              const history = JSON.parse(localStorage.getItem('soundwave_purchase_history') || '[]');
              const newEntry = {
                bookingCode: data.data.bookingCode,
                customerName: data.data.customerName,
                customerPhone: data.data.customerPhone,
                zoneName: data.data.items?.[0]?.zone?.name || 'Festival Zone',
                totalAmount: data.data.totalAmount,
                tickets: tList,
                paidAt: data.data.paidAt || new Date().toISOString()
              };
              const updatedHistory = [newEntry, ...history.filter((h) => h.bookingCode !== data.data.bookingCode)];
              localStorage.setItem('soundwave_purchase_history', JSON.stringify(updatedHistory));
            } catch (err) {}
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
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paidSuccess, isExpired]);

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      // Check if user selected specific seat numbers in ZoneSelectPage
      let selectedSeats = [];
      try {
        const savedSeats = localStorage.getItem(`soundwave_seats_${bookingCode}`);
        if (savedSeats) selectedSeats = JSON.parse(savedSeats);
      } catch (e) {}

      const res = await fetch(`/api/bookings/${bookingCode}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSeats })
      });
      const data = await res.json();
      if (data.success) {
        setPaidSuccess(true);
        const issuedTickets = data.data?.tickets || [];
        setTickets(issuedTickets);
        setLineDelivery(data.data?.lineDelivery || { status: booking.customerLineId ? 'UNKNOWN' : 'NOT_LINKED' });

        // ── SAVE PURCHASE TO LOCAL STORAGE HISTORY ──
        try {
          const history = JSON.parse(localStorage.getItem('soundwave_purchase_history') || '[]');
          const newEntry = {
            bookingCode: booking.bookingCode,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            zoneName: booking.items?.[0]?.zone?.name || 'Festival Zone',
            totalAmount: booking.totalAmount,
            tickets: issuedTickets,
            paidAt: new Date().toISOString()
          };
          const updatedHistory = [newEntry, ...history.filter(h => h.bookingCode !== booking.bookingCode)];
          localStorage.setItem('soundwave_purchase_history', JSON.stringify(updatedHistory));
        } catch (err) {
          console.error('Failed to save order history:', err);
        }

      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการชำระเงิน');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setPaying(false);
    }
  };

  const retryLineDelivery = async () => {
    setRetryingLine(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/line-resend`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'ส่งตั๋วเข้า LINE ไม่สำเร็จ');
      setLineDelivery(result.data?.lineDelivery || { status: 'UNKNOWN' });
    } catch (error) {
      setLineDelivery({ status: 'FAILED', error: error.message });
    } finally {
      setRetryingLine(false);
    }
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="w-10 h-10 text-pink-400 mb-2" />
      <h2 className="text-lg font-bold text-white">ไม่พบรายการจองนี้</h2>
      <Link to="/" className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-white text-xs">
        กลับหน้าแรก
      </Link>
    </div>
  );

  // ── SUCCESS SCREEN ──────────────────────────────────────────────
  if (paidSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
          Payment Completed
        </span>
        <h1 className="text-2xl font-black text-white mt-1">ชำระเงินเรียบร้อยแล้ว!</h1>
        <p className="text-xs text-gray-400 mt-1">
          รหัสการจอง: <span className="font-mono text-white font-bold">{booking.bookingCode}</span>
        </p>

        {/* Issued Tickets List */}
        <div className="space-y-3 mt-6 text-left">
          {tickets.map(tkt => (
            <div
              key={tkt.id}
              className="p-4 rounded-2xl bg-[#12121a] border border-white/10 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase">TICKET NUMBER</span>
                <p className="font-mono font-bold text-white text-sm mt-0.5">{tkt.ticketCode}</p>
                {tkt.seatNumber && (
                  <p className="text-xs font-mono text-cyan-300 font-bold mt-0.5">ที่นั่ง: {tkt.seatNumber}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{tkt.attendeeName}</p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <Link
                  to={`/tickets/${tkt.ticketCode}`}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5 text-cyan-400" /> เปิดดูตั๋ว
                </Link>
                <Link
                  to={`/tickets/${tkt.ticketCode}/print`}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-pink-400" /> พิมพ์ A4
                </Link>
              </div>
            </div>
          ))}
        </div>

        {copied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
            คัดลอกรหัสตั๋วแล้ว ✓
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <Link
            to={`/tickets/${tickets[0]?.ticketCode || ''}`}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
          >
            เปิดหน้าตั๋วเข้างานทันที
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open_soundwave_history'))}
            className="w-full py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-cyan-400/20 transition-colors cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            ดูประวัติการซื้อตั๋วทั้งหมดในเครื่องนี้
          </button>
          <Link
            to="/"
            className="w-full py-2 rounded-xl text-gray-400 text-xs hover:text-white"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // ── EXPIRED SCREEN ──────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">หมดเวลาทำรายการ</h1>
        <p className="text-xs text-gray-400 mt-2 mb-6">
          ระบบได้ยกเลิกคำสั่งจอง {booking.bookingCode} และคืนโควต้าที่นั่งแล้ว
        </p>
        <Link
          to="/booking/zone-select"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-gray-200"
        >
          ทำรายการใหม่อีกครั้ง
        </Link>
      </div>
    );
  }

  // ── COMPACT & PROFESSIONAL CHECKOUT SCREEN ─────────────────────
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      
      {/* Sleek, Professional Countdown Bar */}
      <div className="mb-4 p-3 rounded-2xl bg-[#12121a] border border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>โปรดชำระเงินภายใน:</span>
        </div>
        <div className="flex items-center gap-1 font-mono font-black text-sm text-cyan-300 bg-white/5 px-2.5 py-1 rounded-lg">
          {fmt(timeLeft)} นาที
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="bg-[#111119] border border-white/10 rounded-3xl p-6 shadow-2xl">
        
        {/* Header Title */}
        <div className="text-center pb-4 border-b border-white/10">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
            SoundWave Pass Checkout
          </span>
          <h1 className="text-xl font-bold text-white mt-0.5">
            สแกนชำระเงิน PromptPay
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            รหัสการจอง: <span className="font-mono text-white font-semibold">{booking.bookingCode}</span>
          </p>
        </div>

        {/* Compact PromptPay QR Card */}
        <div className="my-5 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-md text-center max-w-[220px]">
            {/* PromptPay Official Style Header */}
            <div className="bg-[#003d79] text-white text-[9px] font-bold px-2 py-0.5 rounded mb-2 tracking-wider">
              PROMPTPAY · พร้อมเพย์
            </div>

            <QRCodeSVG
              value={`https://promptpay.io/0812345678/${booking.totalAmount}`}
              size={170}
              level="M"
              includeMargin={false}
            />

            <p className="text-[9px] text-gray-500 font-mono mt-2">
              สแกนผ่านแอปธนาคารทุกธนาคาร
            </p>
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5 mb-5">
          <div className="flex justify-between">
            <span className="text-gray-400">ผู้จอง:</span>
            <span className="font-medium text-white">{booking.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">โซน:</span>
            <span className="font-medium text-white">{booking.items?.[0]?.zone?.name}</span>
          </div>
          {(booking.selectedSeatsList?.length > 0 || booking.selectedSeats) && (
            <div className="flex justify-between">
              <span className="text-gray-400">ที่นั่งที่ระบุ:</span>
              <span className="font-mono font-bold text-cyan-300">
                {(booking.selectedSeatsList || (booking.selectedSeats ? JSON.parse(booking.selectedSeats) : [])).join(', ')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">จำนวน:</span>
            <span className="font-medium text-white">{booking.items?.[0]?.quantity} ใบ</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
            <span className="font-bold text-gray-300">ยอดชำระ:</span>
            <span className="font-mono font-black text-cyan-300 text-base">
              ฿{booking.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Simulated Payment Action */}
        <button
          type="button"
          disabled={paying}
          onClick={handleSimulatePayment}
          className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {paying ? 'กำลังตรวจสอบยอดเงิน...' : 'ยืนยันการโอนเงินเรียบร้อยแล้ว'}
        </button>

        <p className="text-center text-[10px] text-gray-500 mt-3">
          * ระบบจำลอง: กดเพื่อยืนยันการรับเงินและออกตั๋วเข้า LINE ทันที
        </p>
      </div>

    </div>
  );
}
