import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Ticket } from 'lucide-react';

export default function PaymentPage() {
  const { bookingCode } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [tickets, setTickets] = useState([]);

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
            // Calculate remaining seconds
            const expiryTime = new Date(data.data.expiresAt).getTime();
            const now = Date.now();
            const diffSec = Math.floor((expiryTime - now) / 1000);
            if (diffSec <= 0) {
              setIsExpired(true);
            } else {
              setTimeLeft(diffSec);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [bookingCode]);

  // Countdown Interval
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
      const res = await fetch(`/api/bookings/${bookingCode}/pay`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setPaidSuccess(true);
        setTickets(data.data.tickets || []);

        // Blast Confetti!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการชำระเงิน');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setPaying(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400">
        กำลังโหลดข้อมูลการชำระเงิน...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle className="w-12 h-12 text-[#ff007f] mb-2" />
        <h2 className="text-xl font-bold text-white">ไม่พบรหัสการจองนี้</h2>
        <Link to="/" className="mt-4 px-4 py-2 rounded-lg bg-[#1a1a28] text-[#00f0ff] border border-[#00f0ff]/30 text-sm">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  // Success Screen
  if (paidSuccess) {
    const primaryTicket = tickets[0];
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#39ff14]/20 border-2 border-[#39ff14] text-[#39ff14] flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(57,255,20,0.5)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-[#39ff14] font-bold text-xs uppercase tracking-widest">
          PAYMENT SUCCESSFUL
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">
          ชำระเงินเสร็จสมบูรณ์!
        </h1>
        <p className="text-gray-300 mt-2 text-sm">
          ยินดีด้วยครับ บัตรคอนเสิร์ต <span className="text-[#00f0ff] font-bold">{booking.bookingCode}</span> ของคุณพร้อมใช้งานแล้ว
        </p>

        {booking.customerLineId && (
          <div className="mt-4 p-3 bg-[#06c755]/15 border border-[#06c755]/40 rounded-xl text-xs text-[#06c755] max-w-md mx-auto">
            🟢 ระบบได้ส่งการ์ดตั๋ว SoundWave Pass เข้า LINE ของคุณเรียบร้อยแล้ว
          </div>
        )}

        {/* Issued Tickets List */}
        <div className="mt-8 space-y-3">
          {tickets.map(tkt => (
            <div key={tkt.id} className="bg-[#141422] border border-[#2b2b40] rounded-2xl p-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-gray-500 uppercase font-mono">TICKET CODE</span>
                <p className="font-bold text-white text-base font-mono">{tkt.ticketCode}</p>
                <span className="text-xs text-[#00f0ff]">{tkt.attendeeName}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/tickets/${tkt.ticketCode}`}
                  className="px-3.5 py-2 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-bold hover:bg-[#00f0ff]/25 transition-all flex items-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  ดูบัตรดิจิทัล
                </Link>
                <Link
                  to={`/tickets/${tkt.ticketCode}/print`}
                  className="px-3.5 py-2 rounded-xl bg-[#ffe600]/15 border border-[#ffe600]/40 text-[#ffe600] text-xs font-bold hover:bg-[#ffe600]/25 transition-all"
                >
                  🖨️ พิมพ์ A4
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            to={`/tickets/${primaryTicket?.ticketCode || ''}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#ff007f] text-black font-extrabold uppercase hover:opacity-90 transition-opacity"
          >
            เปิดดูบัตรเข้างานทันที
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Expired Screen
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ff007f]/20 border-2 border-[#ff007f] text-[#ff007f] flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">หมดเวลาชำระเงิน</h1>
        <p className="text-gray-400 text-sm mt-2">
          รายการจอง {booking.bookingCode} เกินระยะเวลา 10 นาที ระบบได้คืนโควต้าที่นั่งแล้ว กรุณาทำรายการใหม่อีกครั้ง
        </p>
        <Link
          to="/booking/zone-select"
          className="mt-6 inline-block px-6 py-3 rounded-xl bg-[#00f0ff] text-black font-bold text-sm"
        >
          จองบัตรใหม่อีกครั้ง
        </Link>
      </div>
    );
  }

  // Active Payment Screen
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-6">
        {/* Countdown Timer Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff007f]/15 border border-[#ff007f]/40 text-[#ff007f] text-sm font-black tracking-wider mb-3 animate-pulse">
          <Clock className="w-4 h-4" />
          <span>เวลาล็อกสิทธิ์คงเหลือ: {formatTimer(timeLeft)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          สแกนชำระเงินผ่าน PromptPay
        </h1>
        <p className="text-xs text-gray-400 mt-1">รหัสการจอง: {booking.bookingCode}</p>
      </div>

      <div className="bg-[#12121e] border border-[#27273d] rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl inline-block mx-auto shadow-lg">
          <div className="mb-2 text-center">
            <span className="text-[11px] font-black tracking-widest text-[#003d79] uppercase block">
              PROMPTPAY QR
            </span>
          </div>
          <QRCodeSVG
            value={`https://promptpay.io/0812345678/${booking.totalAmount}.png`}
            size={200}
            level="M"
          />
          <div className="mt-2 text-center">
            <span className="text-[10px] text-gray-600 block">SoundWave Pass Official</span>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-6">
          <span className="text-xs text-gray-400 uppercase font-semibold">ยอดเงินที่ต้องชำระ:</span>
          <div className="text-4xl font-black text-[#00f0ff] mt-0.5">
            ฿{booking.totalAmount.toLocaleString()}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ผู้จอง: <span className="text-white font-semibold">{booking.customerName}</span> ({booking.customerPhone})
          </p>
        </div>

        {/* Mock Payment Action Button */}
        <div className="mt-8 pt-6 border-t border-[#232338]">
          <button
            type="button"
            disabled={paying}
            onClick={handleSimulatePayment}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#39ff14] to-[#00f0ff] text-black font-black uppercase text-sm tracking-wide hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-50"
          >
            {paying ? 'กำลังตรวจสอบยอดเงิน...' : '💳 [จำลอง] ฉันโอนเงินเรียบร้อยแล้ว'}
          </button>
          <span className="text-[11px] text-gray-500 mt-2 block">
            * ในโหมดทดสอบ กดปุ่มนี้เพื่อจำลองการยืนยันยอดเงินจากธนาคารทันที
          </span>
        </div>
      </div>
    </div>
  );
}
