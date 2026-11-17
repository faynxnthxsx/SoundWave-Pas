import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Ticket,
  Printer,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Code2,
  ExternalLink,
  Tag,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import TaxInvoiceModal from '../../components/TaxInvoiceModal';

const TEST_CARDS = [
  {
    id: 'jcb_ok',
    labelTh: '🇯🇵 บัตร JCB ทดสอบ (อนุมัติสำเร็จ)',
    labelEn: '🇯🇵 JCB Test Card (Approved)',
    brand: 'JCB',
    number: '3528 0000 0000 0007',
    holder: 'TARO YAMADA',
    expiry: '12/29',
    cvv: '888',
    badgeTh: 'แนะนำ · ลดเพิ่ม 5%',
    badgeEn: 'Recommended · +5% Off',
    isSuccess: true,
  },
  {
    id: 'visa_ok',
    labelTh: '💳 บัตร Visa ทดสอบ (อนุมัติสำเร็จ)',
    labelEn: '💳 Visa Test Card (Approved)',
    brand: 'VISA',
    number: '4242 4242 4242 4242',
    holder: 'SOMCHAI RAKDONTREE',
    expiry: '08/28',
    cvv: '123',
    badgeTh: 'ผ่าน 100%',
    badgeEn: '100% Pass',
    isSuccess: true,
  },
  {
    id: 'card_fail',
    labelTh: '⚠️ บัตรทดสอบวงเงินไม่พอ (จำลองถูกปฏิเสธ)',
    labelEn: '⚠️ Declined Test Card (Insufficient Funds)',
    brand: 'VISA',
    number: '4000 0000 0000 0000',
    holder: 'TEST DECLINED CARD',
    expiry: '05/27',
    cvv: '999',
    badgeTh: 'ทดสอบ Error',
    badgeEn: 'Test Error',
    isSuccess: false,
  },
];

export default function PaymentPage() {
  const { bookingCode } = useParams();
  const { t, trData } = useLanguage();

  const [booking, setBooking] = useState(null);
  const [gatewayInfo, setGatewayInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isExpired, setIsExpired] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [paymentError, setPaymentError] = useState('');
  const [snapReady, setSnapReady] = useState(false);

  // Payment channel & Credit card state
  const [paymentChannel, setPaymentChannel] = useState('PROMPTPAY'); // PROMPTPAY | CREDIT_CARD
  const [cardNumber, setCardNumber] = useState('3528 0000 0000 0007');
  const [cardHolder, setCardHolder] = useState('TARO YAMADA');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('888');
  const [selectedTestCardId, setSelectedTestCardId] = useState('jcb_ok');

  // Promo & Tax state on checkout page
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [withholdingTax, setWithholdingTax] = useState(false);
  const [taxCompanyName, setTaxCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [showTaxInvoiceModal, setShowTaxInvoiceModal] = useState(false);

  // Live VeriTrans Step-by-Step Inspector state
  const [activeGatewayStep, setActiveGatewayStep] = useState(2);
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);
  const [gatewayCaptureResult, setGatewayCaptureResult] = useState(null);

  useEffect(() => {
    const handleLogout = () => {
      setShowTaxInvoiceModal(false);
      setTickets([]);
      setBooking(null);
      navigate('/', { replace: true });
    };
    window.addEventListener('soundwave:logout', handleLogout);
    return () => window.removeEventListener('soundwave:logout', handleLogout);
  }, [navigate]);

  const saveOrderToLocalHistory = (bookingObj, issuedTickets) => {
    try {
      const history = JSON.parse(localStorage.getItem('soundwave_purchase_history') || '[]');
      const newEntry = {
        bookingCode: bookingObj.bookingCode,
        customerName: bookingObj.customerName,
        customerPhone: bookingObj.customerPhone,
        zoneName: bookingObj.items?.[0]?.zone?.name || 'Festival Zone',
        totalAmount: bookingObj.totalAmount,
        tickets: issuedTickets,
        paidAt: bookingObj.paidAt || new Date().toISOString(),
      };
      const updatedHistory = [
        newEntry,
        ...history.filter((h) => h.bookingCode !== bookingObj.bookingCode),
      ];
      localStorage.setItem('soundwave_purchase_history', JSON.stringify(updatedHistory));
    } catch {
      /* ignore corrupted local history */
    }
  };

  // Dynamically load VeriTrans / Midtrans Snap.js SDK on Frontend with Client Key
  useEffect(() => {
    const clientKey = gatewayInfo?.clientKey || 'Mid-client-C0DQZivavb70ipzT';
    const snapSrc = gatewayInfo?.snapJsUrl || 'https://app.sandbox.midtrans.com/snap/snap.js';
    if (typeof window !== 'undefined' && window.snap) {
      setSnapReady(true);
      return;
    }
    const existing = document.getElementById('veritrans-snap-sdk');
    if (existing) {
      setSnapReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'veritrans-snap-sdk';
    script.src = snapSrc;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    script.onload = () => setSnapReady(true);
    document.body.appendChild(script);
  }, [gatewayInfo?.clientKey, gatewayInfo?.snapJsUrl]);

  useEffect(() => {
    fetch(`/api/bookings/${bookingCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBooking(data.data);
          setGatewayInfo(data.gateway || null);
          const initChannel =
            data.data.paymentMethod?.includes('CREDIT') || data.data.paymentMethod?.includes('CARD')
              ? 'CREDIT_CARD'
              : 'PROMPTPAY';
          setPaymentChannel(initChannel);
          setPromoCodeInput(data.data.promoCode || '');
          setWithholdingTax(Boolean(data.data.whtAmount > 0 || data.data.taxInvoiceRequested));
          setTaxCompanyName(data.data.taxCompanyName || '');
          setTaxId(data.data.taxId || '');

          if (data.data.status === 'PAID') {
            setPaidSuccess(true);
            setActiveGatewayStep(4);
            const tList = data.data.tickets || [];
            setTickets(tList);
            saveOrderToLocalHistory(data.data, tList);
          } else if (data.data.status === 'EXPIRED') {
            setIsExpired(true);
          } else {
            const diffSec = Math.floor((new Date(data.data.expiresAt).getTime() - Date.now()) / 1000);
            if (diffSec <= 0) {
              setIsExpired(true);
            } else {
              setTimeLeft(diffSec);
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingCode]);

  useEffect(() => {
    if (paidSuccess || isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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

  // Recalculate pricing when user switches payment channel, promo code, or withholding tax
  const handleRecalculateBooking = async ({
    nextChannel = paymentChannel,
    nextPromo = promoCodeInput,
    nextWht = withholdingTax,
    nextCompany = taxCompanyName,
    nextTaxId = taxId,
  }) => {
    setRecalculating(true);
    setPaymentError('');
    try {
      const res = await fetch(`/api/bookings/${bookingCode}/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentChannel: nextChannel,
          promoCode: nextPromo,
          withholdingTax: nextWht,
          taxInvoiceRequested: nextWht,
          taxCompanyName: nextCompany,
          taxId: nextTaxId,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBooking(data.data);
        if (data.gateway) setGatewayInfo(data.gateway);
      }
    } catch (err) {
      console.warn('Recalculate failed:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSelectChannel = (chan) => {
    setPaymentChannel(chan);
    setPaymentError('');
    handleRecalculateBooking({ nextChannel: chan });
  };

  const handleSelectTestCard = (card) => {
    setSelectedTestCardId(card.id);
    setCardNumber(card.number);
    setCardHolder(card.holder);
    setCardExpiry(card.expiry);
    setCardCvv(card.cvv);
    setPaymentError('');
  };

  // Trigger Frontend VeriTrans / Midtrans Snap Popup directly using Client Key + Snap Token
  const handleOpenSnapPopup = () => {
    const token = booking?.gatewaySnapToken;
    if (typeof window !== 'undefined' && window.snap && token && !token.startsWith('vt_snap_')) {
      setActiveGatewayStep(3);
      window.snap.pay(token, {
        onSuccess: () => {
          handleConfirmPayment();
        },
        onPending: () => {
          setActiveGatewayStep(3);
        },
        onError: () => {
          setPaymentError(t('การชำระเงินผ่านหน้าต่าง Snap ไม่สำเร็จ', 'Snap payment failed'));
        },
        onClose: () => {},
      });
    } else if (booking?.gatewayRedirectUrl) {
      window.open(booking.gatewayRedirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleConfirmPayment = async () => {
    setPaying(true);
    setPaymentError('');
    setActiveGatewayStep(3);
    try {
      let selectedSeats = [];
      try {
        const savedSeats = localStorage.getItem(`soundwave_seats_${bookingCode}`);
        if (savedSeats) selectedSeats = JSON.parse(savedSeats);
      } catch {
        /* ignore corrupted saved seats */
      }

      const res = await fetch(`/api/bookings/${bookingCode}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSeats,
          paymentChannel,
          cardNumber,
          cardHolder,
          cardExpiry,
          cardCvv,
        }),
      });
      const data = await res.json();
      if (data.data?.gatewayResult || data.gatewayResult) {
        setGatewayCaptureResult(data.data?.gatewayResult || data.gatewayResult);
      }

      if (data.success) {
        setActiveGatewayStep(4);
        setPaidSuccess(true);
        const issuedTickets = data.data?.tickets || [];
        setTickets(issuedTickets);
        saveOrderToLocalHistory(booking, issuedTickets);
      } else {
        setActiveGatewayStep(2);
        setPaymentError(data.message || t('เกิดข้อผิดพลาดในการชำระเงิน', 'Payment failed'));
      }
    } catch {
      setActiveGatewayStep(2);
      setPaymentError(t('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'Cannot connect to server'));
    } finally {
      setPaying(false);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading)
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle className="w-10 h-10 text-pink-400 mb-2" />
        <h2 className="text-lg font-bold text-white">{t('ไม่พบรายการจองนี้', 'Booking not found')}</h2>
        <Link to="/" className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-white text-xs">
          {t('กลับหน้าแรก', 'Back to Home')}
        </Link>
      </div>
    );

  const pricing = booking.pricing || {
    subtotalAmount: booking.subtotalAmount || booking.totalAmount,
    bundleDiscount: booking.bundleDiscount || 0,
    couponDiscount: booking.couponDiscount || 0,
    partnerDiscount: booking.partnerDiscount || 0,
    discountAmount: booking.discountAmount || 0,
    vatAmount: booking.vatAmount || 0,
    whtAmount: booking.whtAmount || 0,
    totalAmount: booking.totalAmount,
    availableCoupons: [],
  };
  const vtData = booking.veritrans || null;

  // ── SUCCESS SCREEN ──────────────────────────────────────────────
  if (paidSuccess) {
    return (
      <div className="payment-page-container max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
          VeriTrans Payment Captured · 200 OK
        </span>
        <h1 className="text-2xl font-black text-white mt-1">
          {t('ชำระเงินเรียบร้อยแล้ว!', 'Payment Completed!')}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {t('รหัสการจอง:', 'Booking Code:')}{' '}
          <span className="font-mono text-white font-bold">{booking.bookingCode}</span>
        </p>

        {/* VeriTrans Receipt & Tax Summary Card */}
        <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-[#101018] p-4 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck size={15} />
              {t('ใบเสร็จรับเงิน / สรุปภาษี VeriTrans Gateway', 'VeriTrans Gateway Receipt & Tax Summary')}
            </span>
            <span className="font-mono text-[10px] text-gray-400">
              {gatewayCaptureResult?.transaction_id || booking.gatewayOrderId || 'VT-CAPTURED'}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>{t('ช่องทางชำระเงิน:', 'Payment Method:')}</span>
            <span className="font-mono font-bold text-white">
              {paymentChannel === 'PROMPTPAY'
                ? 'VeriTrans QR PromptPay'
                : `VeriTrans Credit Card (${gatewayCaptureResult?.card_brand || 'JCB'})`}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>{t('ราคาบัตรตั้งต้น:', 'Ticket Subtotal:')}</span>
            <span className="font-mono text-white">฿{(pricing.subtotalAmount || booking.totalAmount).toLocaleString()}</span>
          </div>
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-300">
              <span>{t('หักส่วนลดโปรโมชันรวม:', 'Total Discounts:')}</span>
              <span className="font-mono font-bold">-฿{pricing.discountAmount.toLocaleString()}</span>
            </div>
          )}
          {pricing.vatAmount > 0 && (
            <div className="flex justify-between text-amber-200">
              <span>{t('ภาษีมูลค่าเพิ่ม (VAT 7%):', 'Value Added Tax (VAT 7%):')}</span>
              <span className="font-mono">+฿{pricing.vatAmount.toLocaleString()}</span>
            </div>
          )}
          {pricing.whtAmount > 0 && (
            <div className="flex justify-between text-purple-300">
              <span>{t('หักภาษี ณ ที่จ่าย (WHT 3%):', 'Withholding Tax (WHT 3%):')}</span>
              <span className="font-mono">-฿{pricing.whtAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
            <span className="text-white">{t('ยอดตัดชำระสุทธิ:', 'Net Amount Paid:')}</span>
            <span className="font-mono text-emerald-300">฿{booking.totalAmount.toLocaleString()}</span>
          </div>

          {(booking.taxInvoiceRequested || booking.taxId || booking.whtAmount > 0 || withholdingTax) && (
            <button
              type="button"
              onClick={() => setShowTaxInvoiceModal(true)}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-cyan-400/15 border border-cyan-400/40 hover:bg-cyan-400/25 text-cyan-200 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileText size={14} className="text-cyan-300 shrink-0" />
              <span>
                {t(
                  '📄 เปิดดู / พิมพ์ใบกำกับภาษีและใบเสร็จรับเงิน (Tax Invoice)',
                  '📄 View / Print Official Tax Invoice & Receipt'
                )}
              </span>
            </button>
          )}
        </div>

        {showTaxInvoiceModal && (
          <TaxInvoiceModal booking={booking} onClose={() => setShowTaxInvoiceModal(false)} />
        )}

        {/* Issued Tickets List */}
        <div className="space-y-3 mt-5 text-left">
          {tickets.map((tkt) => (
            <div
              key={tkt.id}
              className="p-4 rounded-2xl bg-[#12121a] border border-white/10 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-gray-400 font-mono uppercase">TICKET NUMBER</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={11} /> {t('จองแล้ว / ชำระแล้ว', 'BOOKED & PAID')}
                  </span>
                </div>
                <p className="font-mono font-bold text-white text-sm mt-0.5">{tkt.ticketCode}</p>
                {tkt.seatNumber && (
                  <p className="text-xs font-mono text-cyan-300 font-bold mt-0.5">
                    {t('ที่นั่ง / คิว:', 'Seat / Queue:')} {tkt.seatNumber}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{tkt.attendeeName}</p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <Link
                  to={`/tickets/${tkt.ticketCode}`}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5 text-cyan-400" /> {t('เปิดดูตั๋ว', 'View Pass')}
                </Link>
                <Link
                  to={`/tickets/${tkt.ticketCode}/print`}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-pink-400" /> {t('พิมพ์ A4', 'Print A4')}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Link
            to={`/tickets/${tickets[0]?.ticketCode || ''}`}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
          >
            {t('เปิดหน้าตั๋วเข้างานทันที', 'Open Entry Ticket Now')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open_soundwave_history'))}
            className="w-full py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-cyan-400/20 transition-colors cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            {t('ดูประวัติการซื้อตั๋วทั้งหมดในเครื่องนี้', 'View My Ticket Purchase History')}
          </button>
          <Link to="/" className="w-full py-2 rounded-xl text-gray-400 text-xs hover:text-white">
            {t('กลับสู่หน้าหลัก', 'Back to Home')}
          </Link>
        </div>
      </div>
    );
  }

  // ── EXPIRED SCREEN ──────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="payment-page-container max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">{t('หมดเวลาทำรายการ', 'Reservation Expired')}</h1>
        <p className="text-xs text-gray-400 mt-2 mb-6">
          {t(
            `ระบบได้ยกเลิกคำสั่งจอง ${booking.bookingCode} และคืนโควต้าที่นั่งแล้ว`,
            `Booking ${booking.bookingCode} has expired and seat quota has been released.`
          )}
        </p>
        <Link
          to="/booking/zone-select"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-gray-200"
        >
          {t('ทำรายการใหม่อีกครั้ง', 'Book Again')}
        </Link>
      </div>
    );
  }

  // ── CHECKOUT SCREEN (VERITRANS GATEWAY + TAX & DISCOUNT + LIVE FLOW VISUALIZER) ──
  return (
    <div className="payment-page-container max-w-4xl mx-auto px-4 py-8">
      {/* Top Countdown Bar */}
      <div className="mb-4 p-3 rounded-2xl bg-[#12121a] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>{t('โปรดชำระเงินภายใน:', 'Complete payment within:')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            🔒 VeriTrans 4G / Snap Sandbox
          </span>
          <div className="flex items-center gap-1 font-mono font-black text-sm text-cyan-300 bg-white/5 px-2.5 py-1 rounded-lg">
            {fmt(timeLeft)} {t('นาที', 'min')}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* ── LEFT COLUMN (7 cols): VERITRANS PAYMENT GATEWAY UI ── */}
        <div className="lg:col-span-7 bg-[#111119] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
          {/* VeriTrans Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-gradient-to-r from-cyan-400 to-blue-500 px-2 py-0.5 text-[10px] font-black text-black uppercase">
                  VeriTrans
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  DG Financial Technology · Sandbox
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white mt-1">
                {t('เลือกช่องทางชำระเงิน (VeriTrans Gateway)', 'Select Payment Method (VeriTrans Gateway)')}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Order ID</span>
              <span className="font-mono text-xs font-bold text-cyan-300">
                {booking.gatewayOrderId || booking.bookingCode}
              </span>
            </div>
          </div>

          {/* Payment Channel Switcher Tabs (QR PromptPay vs Credit/Debit Card) */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectChannel('PROMPTPAY')}
              className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                paymentChannel === 'PROMPTPAY'
                  ? 'border-cyan-400 bg-cyan-400/15 text-white shadow-lg shadow-cyan-400/10'
                  : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <QrCode size={18} className="text-cyan-300" />
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  {t('ฟรีค่าธรรมเนียม', '0% Fee')}
                </span>
              </div>
              <p className="text-sm font-black mt-1.5">QR PromptPay</p>
              <p className="text-[10px] text-gray-400">
                {t('สแกนจ่ายผ่านแอปธนาคารทันที', 'Scan with any mobile banking app')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectChannel('CREDIT_CARD')}
              className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                paymentChannel === 'CREDIT_CARD'
                  ? 'border-pink-400 bg-pink-500/15 text-white shadow-lg shadow-pink-500/10'
                  : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <CreditCard size={18} className="text-pink-300" />
                <span className="rounded-full bg-pink-400 px-2 py-0.5 text-[9px] font-black text-black">
                  {t('ลดเพิ่ม 5% ✨', '+5% Off ✨')}
                </span>
              </div>
              <p className="text-sm font-black mt-1.5">
                {t('บัตรเครดิต / เดบิต', 'Credit / Debit Card')}
              </p>
              <p className="text-[10px] text-gray-400">JCB · Visa · Mastercard (Test Card)</p>
            </button>
          </div>

          {paymentError && (
            <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300">
                  {t('การชำระเงินไม่สำเร็จ (Gateway Response)', 'Payment Failed (Gateway Response)')}
                </p>
                <p className="mt-0.5">{paymentError}</p>
              </div>
            </div>
          )}

          {/* ── CHANNEL A: QR PROMPTPAY VIEW ── */}
          {paymentChannel === 'PROMPTPAY' ? (
            <div className="my-5 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-md text-center max-w-[230px] w-full border border-slate-200">
                <div className="bg-[#003d79] text-white text-[9px] font-bold px-2 py-1 rounded mb-2 tracking-wider">
                  VERITRANS · THAI QR PROMPTPAY
                </div>

                <div className="flex justify-center">
                  <QRCodeSVG
                    value={`https://promptpay.io/0812345678/${booking.totalAmount}`}
                    size={170}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-800 font-bold">
                  <span>{t('ยอดสแกนจ่าย:', 'Amount:')}</span>
                  <span className="font-mono text-blue-800">฿{booking.totalAmount.toLocaleString()}</span>
                </div>
                <p className="text-[9px] text-gray-500 font-mono mt-1">
                  Order: {booking.gatewayOrderId || booking.bookingCode}
                </p>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                  {gatewayInfo?.mode || 'VERITRANS_SANDBOX_API'} · Token: {booking.gatewaySnapToken || 'vt_snap_ready'}
                </span>
              </div>
            </div>
          ) : (
            /* ── CHANNEL B: VERITRANS CREDIT / DEBIT CARD SANDBOX FORM ── */
            <div className="my-5 space-y-3.5">
              {/* 1-Click Test Card Selector (No manual typing needed!) */}
              <div className="rounded-2xl border border-pink-400/30 bg-pink-500/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-pink-200 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-pink-300" />
                    {t(
                      'คลิกเลือกบัตรเครดิตจำลอง (VeriTrans Test Cards — ไม่ต้องพิมพ์เอง!)',
                      '1-Click VeriTrans Sandbox Test Cards (Auto-fill)'
                    )}
                  </span>
                  <span className="text-[9px] font-mono text-pink-300">Sandbox Mode</span>
                </div>
                <div className="grid gap-1.5">
                  {TEST_CARDS.map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => handleSelectTestCard(tc)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition cursor-pointer ${
                        selectedTestCardId === tc.id
                          ? 'border-cyan-400 bg-cyan-400/15 text-white font-bold'
                          : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="block truncate">{t(tc.labelTh, tc.labelEn)}</span>
                        <span className="font-mono text-[10px] text-cyan-300">{tc.number}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-black ${
                          tc.isSuccess
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                        }`}
                      >
                        {t(tc.badgeTh, tc.badgeEn)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Form Fields */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">
                    {t('หมายเลขบัตรเครดิต / เดบิต (Card Number)', 'Credit / Debit Card Number')}
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2 font-mono text-sm text-white outline-none focus:border-cyan-300"
                    placeholder="3528 0000 0000 0007"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">
                    {t('ชื่อบนบัตร (Cardholder Name)', 'Cardholder Name')}
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2 font-mono text-xs text-white uppercase outline-none focus:border-cyan-300"
                    placeholder="TARO YAMADA"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {t('วันหมดอายุ (MM/YY)', 'Expiry Date (MM/YY)')}
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2 font-mono text-xs text-white outline-none focus:border-cyan-300"
                      placeholder="12/29"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {t('รหัส CVV (3 หลัก)', 'CVV (3 digits)')}
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2 font-mono text-xs text-white outline-none focus:border-cyan-300"
                      placeholder="888"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Frontend VeriTrans / Midtrans Snap Popup & Hosted Web App Button */}
          {(booking.gatewaySnapToken || booking.gatewayRedirectUrl) && (
            <button
              type="button"
              onClick={handleOpenSnapPopup}
              className="mb-2.5 w-full py-2.5 px-4 rounded-xl border border-pink-400/40 bg-pink-500/15 hover:bg-pink-500/25 text-pink-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink size={14} className="text-pink-300 shrink-0" />
              <span>
                {snapReady && booking.gatewaySnapToken && !booking.gatewaySnapToken.startsWith('vt_snap_')
                  ? t(
                      'เปิดหน้าต่างเว็บแอปจ่ายเงิน VeriTrans/Midtrans (Snap Popup)',
                      'Open VeriTrans/Midtrans Snap Payment Popup'
                    )
                  : t(
                      'เปิดหน้าเว็บจ่ายเงินจริงของ VeriTrans/Midtrans (Snap Hosted Page)',
                      'Open VeriTrans/Midtrans Hosted Payment Page'
                    )}
              </span>
            </button>
          )}

          {/* Confirm / Simulate Payment Button */}
          <button
            type="button"
            disabled={paying || recalculating}
            onClick={handleConfirmPayment}
            className="payment-confirm-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
            {paying
              ? t('กำลังส่งข้อมูลตัดยอดกับ VeriTrans Gateway...', 'Processing payment with VeriTrans Gateway...')
              : paymentChannel === 'PROMPTPAY'
              ? t(
                  `ยืนยันสแกนจ่าย QR PromptPay (฿${booking.totalAmount.toLocaleString()})`,
                  `Confirm QR PromptPay Payment (฿${booking.totalAmount.toLocaleString()})`
                )
              : t(
                  `ยืนยันตัดบัตรเครดิตผ่าน VeriTrans (฿${booking.totalAmount.toLocaleString()})`,
                  `Pay with Credit Card via VeriTrans (฿${booking.totalAmount.toLocaleString()})`
                )}
          </button>

          <p className="text-center text-[10px] text-gray-500 mt-2.5">
            {t(
              '* โหมดทดสอบ (VeriTrans Sandbox): ไม่มีการตัดเงินจริง กดปุ่มเพื่อจำลองการอนุมัติธุรกรรมและออกตั๋วทันที',
              '* VeriTrans Sandbox Mode: No real money is charged. Click to simulate payment approval & issue tickets.'
            )}
          </p>
        </div>

        {/* ── RIGHT COLUMN (5 cols): DISCOUNT, TAX & LIVE GATEWAY STEP VISUALIZER ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Order, Discount & Tax Breakdown */}
          <div className="rounded-3xl border border-white/10 bg-[#111119] p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <FileText size={15} className="text-cyan-300" />
                {t('สรุปยอด ส่วนลด และภาษี (Tax Invoice)', 'Order, Discount & Tax Summary')}
              </span>
              <span className="font-mono text-[11px] font-bold text-cyan-300">{booking.bookingCode}</span>
            </div>

            {/* Quick Promo Code & WHT Switcher on Checkout */}
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <label className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
                <Tag size={11} className="text-pink-400" />
                {t('เปลี่ยน/ใช้โค้ดส่วนลดในหน้าชำระเงิน:', 'Apply or Change Promo Code:')}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder={t('เช่น EARLYBIRD15 หรือ SOUNDWAVE300', 'e.g. EARLYBIRD15')}
                  className="flex-1 rounded-xl border border-white/15 bg-[#09090f] px-2.5 py-1.5 font-mono text-xs text-white uppercase outline-none focus:border-cyan-300"
                />
                <button
                  type="button"
                  disabled={recalculating}
                  onClick={() => handleRecalculateBooking({ nextPromo: promoCodeInput })}
                  className="rounded-xl bg-cyan-400/20 border border-cyan-400/40 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/30 cursor-pointer"
                >
                  {t('คำนวณใหม่', 'Apply')}
                </button>
              </div>

              {/* Quick clickable coupon pills */}
              {pricing.availableCoupons?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {pricing.availableCoupons.map((cp) => (
                    <button
                      key={cp.code}
                      type="button"
                      disabled={!cp.eligible}
                      onClick={() => {
                        setPromoCodeInput(cp.code);
                        handleRecalculateBooking({ nextPromo: cp.code });
                      }}
                      className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold border transition cursor-pointer ${
                        booking.promoCode === cp.code
                          ? 'border-cyan-300 bg-cyan-300 text-black'
                          : cp.eligible
                          ? 'border-white/15 bg-white/5 text-cyan-200 hover:border-cyan-400/50'
                          : 'border-white/5 bg-white/[0.02] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {cp.code} {cp.isBestDeal ? '✨' : ''}
                    </button>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 pt-1.5 text-[11px] text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withholdingTax}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setWithholdingTax(checked);
                    handleRecalculateBooking({ nextWht: checked });
                  }}
                  className="rounded border-white/20 bg-black text-cyan-400"
                />
                <span>
                  {t('ขอใบกำกับภาษี / หักภาษี ณ ที่จ่าย 3% (WHT 3%)', 'Request Tax Invoice / Withholding Tax 3%')}
                </span>
              </label>

              {withholdingTax && (
                <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <input
                    type="text"
                    value={taxCompanyName}
                    onChange={(e) => setTaxCompanyName(e.target.value)}
                    onBlur={() => handleRecalculateBooking({ nextCompany: taxCompanyName })}
                    placeholder={t('ชื่อบริษัท / นิติบุคคลสำหรับออกใบกำกับภาษี', 'Company / Legal Entity Name')}
                    className="w-full rounded-lg border border-white/10 bg-[#09090f] px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-300"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">
                        {t('เลขประจำตัวผู้เสียภาษี (13 หลัก)', 'Tax ID (13 digits)')}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          taxId.replace(/\D/g, '').length === 13 ? 'text-emerald-400' : 'text-cyan-300'
                        }`}
                      >
                        {taxId.replace(/\D/g, '').length === 13
                          ? t('✓ ครบ 13 หลัก (13/13)', '✓ 13/13 digits')
                          : `${taxId.replace(/\D/g, '').length}/13 ${t('หลัก', 'digits')}`}
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={13}
                      value={taxId.replace(/\D/g, '').slice(0, 13)}
                      onChange={(e) => setTaxId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                      onBlur={() => handleRecalculateBooking({ nextTaxId: taxId })}
                      placeholder="0105560012345"
                      className="w-full rounded-lg border border-white/10 bg-[#09090f] px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-300"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Line Items */}
            <div className="price-breakdown-box rounded-2xl border border-white/15 bg-[#12121a] p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="price-label text-gray-400">{t('ผู้จอง / โซน:', 'Buyer / Zone:')}</span>
                <span className="price-val font-semibold text-white text-right">
                  {booking.customerName} · {trData(booking.items?.[0]?.zone?.name)} ({booking.items?.[0]?.quantity}{' '}
                  {t('ใบ', 'tickets')})
                </span>
              </div>
              {(booking.selectedSeatsList?.length > 0 || booking.selectedSeats) && (
                <div className="flex justify-between gap-2">
                  <span className="price-label text-gray-400">{t('ที่นั่ง / คิว:', 'Seats / Queue:')}</span>
                  <span className="price-val-cyan font-mono font-bold text-cyan-300 text-right">
                    {(
                      booking.selectedSeatsList ||
                      (booking.selectedSeats ? JSON.parse(booking.selectedSeats) : [])
                    ).join(', ')}
                  </span>
                </div>
              )}

              <div className="border-t border-white/10 my-2 pt-2 space-y-1.5">
                <div className="flex justify-between text-gray-300">
                  <span className="price-label">{t('ราคาบัตรตั้งต้น (Subtotal):', 'Ticket Subtotal:')}</span>
                  <span className="price-val font-mono">฿{(pricing.subtotalAmount || booking.totalAmount).toLocaleString()}</span>
                </div>

                {pricing.bundleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span className="price-label-discount">{t('ส่วนลดโปรแก๊งเพื่อนอัตโนมัติ:', 'Squad Bundle Discount:')}</span>
                    <span className="price-val-emerald font-mono font-bold">-฿{pricing.bundleDiscount.toLocaleString()}</span>
                  </div>
                )}

                {pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-cyan-300">
                    <span className="price-label-coupon">
                      {t('ส่วนลดคูปอง', 'Coupon Discount')} ({booking.promoCode}):
                    </span>
                    <span className="price-val-cyan font-mono font-bold">-฿{pricing.couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                {pricing.partnerDiscount > 0 && (
                  <div className="flex justify-between text-pink-300">
                    <span className="price-label-partner">{t('ส่วนลดพาร์ทเนอร์บัตรเครดิต VeriTrans (5%):', 'VeriTrans Credit Card Promo (5%):')}</span>
                    <span className="price-val-pink font-mono font-bold">-฿{pricing.partnerDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-amber-200">
                  <span className="price-label-vat">{t('ภาษีมูลค่าเพิ่ม (VAT 7%):', 'Value Added Tax (VAT 7%):')}</span>
                  <span className="price-val-amber font-mono">+฿{(pricing.vatAmount || 0).toLocaleString()}</span>
                </div>

                {pricing.whtAmount > 0 && (
                  <div className="flex justify-between text-purple-300">
                    <span className="price-label-wht">{t('หักภาษี ณ ที่จ่าย (WHT 3%):', 'Withholding Tax (WHT 3%):')}</span>
                    <span className="price-val-purple font-mono font-bold">-฿{pricing.whtAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                  <span className="price-total-label font-black text-white">{t('ยอดชำระสุทธิ (gross_amount):', 'Net Payable (gross_amount):')}</span>
                  <span className="price-total-amount font-mono font-black text-cyan-300 text-lg">
                    ฿{booking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: LIVE VERITRANS STEP-BY-STEP WORKFLOW VISUALIZER */}
          <div className="rounded-3xl border border-cyan-400/25 bg-[#101018] p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Code2 size={15} />
                {t('ขั้นตอนการทำงานของ VeriTrans Gateway (สด)', 'Live VeriTrans Gateway Workflow')}
              </span>
              <span className="rounded bg-cyan-400/15 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-200">
                Step {activeGatewayStep}/4
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              {[
                {
                  step: 1,
                  title: t('1. คำนวณส่วนลด 3 ต่อ & ภาษี (Tax Engine)', '1. Calculate 3-Tier Discounts & Tax (VAT 7%)'),
                  desc: t(
                    `ราคาตั้งต้น ฿${(pricing.subtotalAmount || 0).toLocaleString()} หักส่วนลด ฿${(pricing.discountAmount || 0).toLocaleString()} + VAT 7% (฿${(pricing.vatAmount || 0).toLocaleString()})`,
                    `Subtotal ฿${(pricing.subtotalAmount || 0).toLocaleString()} - Discounts ฿${(pricing.discountAmount || 0).toLocaleString()} + VAT 7% (฿${(pricing.vatAmount || 0).toLocaleString()})`
                  ),
                },
                {
                  step: 2,
                  title: t('2. สร้างรายการไปที่ VeriTrans API (Snap Token)', '2. Create VeriTrans Transaction (Snap Token)'),
                  desc: t(
                    `สร้าง Order ${booking.gatewayOrderId || booking.bookingCode} พร้อมแนบ item_details ให้ยอดตรงกับ gross_amount (฿${booking.totalAmount.toLocaleString()})`,
                    `Order ${booking.gatewayOrderId || booking.bookingCode} created with item_details matching gross_amount (฿${booking.totalAmount.toLocaleString()})`
                  ),
                },
                {
                  step: 3,
                  title: t('3. เข้ารหัสบัตรเครดิต / สแกน QR PromptPay', '3. Card Tokenization / QR PromptPay Scan'),
                  desc:
                    paymentChannel === 'PROMPTPAY'
                      ? t('รอรับการสแกน QR PromptPay จากแอปธนาคาร', 'Waiting for QR PromptPay scan')
                      : t(
                          `แปลงเลขบัตร ${cardNumber.slice(0, 4)}•••• เป็น Token ปลอดภัยส่งให้ธนาคาร`,
                          `Tokenizing card ${cardNumber.slice(0, 4)}•••• securely for bank authorization`
                        ),
                },
                {
                  step: 4,
                  title: t('4. เกตเวย์อนุมัติ (200 OK) & ยิง Webhook ออกตั๋ว', '4. Gateway Capture (200 OK) & Issue Tickets'),
                  desc: t(
                    'เมื่อตัดเงินสำเร็จ VeriTrans ส่งสัญญาณกลับมาเปลี่ยนสถานะเป็น PAID และส่งตั๋วเข้า LINE',
                    'VeriTrans confirms settlement, transitions booking to PAID, and delivers tickets to LINE'
                  ),
                },
              ].map((s) => {
                const done = activeGatewayStep >= s.step;
                return (
                  <div
                    key={s.step}
                    className={`rounded-xl border p-2.5 transition ${
                      done
                        ? 'border-cyan-400/35 bg-cyan-400/10 text-white'
                        : 'border-white/5 bg-white/[0.02] text-gray-500'
                    }`}
                  >
                    <p className="font-bold flex items-center justify-between">
                      <span>{s.title}</span>
                      {done && <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Toggle JSON Payload Inspector */}
            <button
              type="button"
              onClick={() => setShowPayloadInspector((v) => !v)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-cyan-200 hover:bg-white/5 flex items-center justify-between cursor-pointer"
            >
              <span>
                {t(
                  '🔍 ดูข้อมูล JSON ที่ส่งไปหา VeriTrans API (item_details)',
                  '🔍 Inspect VeriTrans API JSON Payload (item_details)'
                )}
              </span>
              {showPayloadInspector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showPayloadInspector && (
              <div className="space-y-2">
                <pre className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-slate-900 p-3 font-mono text-[10px] text-emerald-300">
                  {JSON.stringify(
                    vtData?.requestPayload || {
                      transaction_details: {
                        order_id: booking.gatewayOrderId || booking.bookingCode,
                        gross_amount: booking.totalAmount,
                      },
                      item_details: pricing.veritransItemDetails || [],
                    },
                    null,
                    2
                  )}
                </pre>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <a
                    href="https://dashboard.midtrans.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:underline"
                  >
                    <ExternalLink size={11} />{' '}
                    {t('เปิดเว็บ Dashboard ของ VeriTrans/Midtrans', 'Open VeriTrans/Midtrans Dashboard')}
                  </a>
                  <a
                    href="https://simulator.sandbox.midtrans.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-pink-300 hover:underline"
                  >
                    <ExternalLink size={11} />{' '}
                    {t('เปิดเว็บ Simulator ทดสอบจ่ายเงิน', 'Open Sandbox Payment Simulator')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
