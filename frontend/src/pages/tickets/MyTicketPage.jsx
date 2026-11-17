import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Printer, CheckCircle2, XCircle, ArrowLeft, User, Armchair, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getConcertBannerUrl, handleImageError, FALLBACK_CONCERT_IMAGE } from '../../utils/imageUrl';
import TaxInvoiceModal from '../../components/TaxInvoiceModal';

export default function MyTicketPage() {
  const { ticketCode } = useParams();
  const navigate = useNavigate();
  const { lang, t, trData } = useLanguage();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaxInvoice, setShowTaxInvoice] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    fetch(`/api/tickets/${ticketCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTicket(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [ticketCode]);

  useEffect(() => {
    const handleLogout = () => {
      setShowTaxInvoice(false);
      setTicket(null);
      navigate('/', { replace: true });
    };
    window.addEventListener('soundwave:logout', handleLogout);
    return () => window.removeEventListener('soundwave:logout', handleLogout);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-xs">
        {t('กำลังโหลดข้อมูลบัตรคอนเสิร์ต...', 'Loading concert ticket...')}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <XCircle className="w-10 h-10 text-pink-400 mb-2" />
        <h2 className="text-base font-bold text-white">
          {t('ไม่พบตั๋วใบนี้ในระบบ', 'Ticket not found in system')}
        </h2>
        <Link to="/" className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-xs text-white">
          {t('กลับสู่หน้าแรก', 'Back to Home')}
        </Link>
      </div>
    );
  }

  const isValid = ticket.status === 'VALID';

  return (
    <div className="my-ticket-page max-w-md mx-auto px-3.5 sm:px-4 py-6 sm:py-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 rounded-lg hover:bg-white/5 px-2 py-1 -ml-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('ย้อนกลับ', 'Back')}
        </button>
        <Link
          to={`/tickets/${ticket.ticketCode}/print`}
          className="px-3 py-1.5 rounded-xl bg-cyan-300 text-black font-black text-[11px] sm:text-xs uppercase flex items-center gap-1.5 hover:bg-cyan-200 transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          {t('พิมพ์บัตร A4 ที่ระลึก', 'Print A4 Souvenir Ticket')}
        </Link>
      </div>

      {/* ── CONCERT TICKET PASS ──────────────────────────── */}
      <div className="ticket-pass-card relative rounded-3xl overflow-hidden bg-[#12121a] border border-white/15 shadow-2xl">
        <div className="relative h-36 sm:h-40 overflow-hidden">
          <img
            src={getConcertBannerUrl(ticket.concert)}
            alt="Concert"
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, FALLBACK_CONCERT_IMAGE, ticket.concert?.slug || ticket.concert?.name)}
            className="w-full h-full object-cover"
          />
          <div className="ticket-banner-gradient absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/55 to-black/35" />

          {/* Compact, High-Contrast Status Badges (No Overflow!) */}
          <div className="ticket-top-badges absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5">
            <span className="ticket-badge-pill inline-flex items-center gap-1 rounded-full bg-slate-950/90 px-2.5 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 border border-cyan-400/40 shadow-md whitespace-nowrap">
              ⚡ SoundWave Pass
            </span>

            <div className="flex flex-wrap items-center gap-1">
              <span className="ticket-badge-pill inline-flex items-center rounded-full bg-slate-950/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-cyan-200 border border-cyan-400/40 shadow-md whitespace-nowrap">
                {t('จองแล้ว', 'BOOKED')}
              </span>
              <span
                className={`ticket-badge-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold shadow-md whitespace-nowrap ${
                  isValid
                    ? 'bg-emerald-950/95 text-emerald-300 border border-emerald-400/50'
                    : 'bg-rose-950/95 text-rose-300 border border-rose-400/50'
                }`}
              >
                {isValid ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                <span>{isValid ? t('พร้อมเข้างาน (VALID)', 'VALID') : t('ใช้แล้ว (USED)', 'USED')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Info Section */}
        <div className="p-4 sm:p-6 text-center -mt-4 relative z-10">
          <h1 className="text-lg sm:text-xl font-black text-white leading-snug break-words">
            {trData(ticket.concert.name)}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-300 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {new Date(ticket.concert.eventDate).toLocaleDateString(
                lang === 'en' ? 'en-GB' : 'th-TH',
                { dateStyle: 'medium' }
              )}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              {trData(ticket.concert.location)}
            </span>
          </div>

          {/* Attendee & Zone Badge Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4 sm:my-5 text-left text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase">
                <User className="w-3 h-3" /> {t('ผู้ถือบัตร', 'Attendee')}
              </span>
              <p className="font-bold text-white mt-0.5 truncate">{ticket.attendeeName}</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase">
                <Armchair className="w-3 h-3" /> {t('โซน / ที่นั่ง', 'Zone / Seat')}
              </span>
              <p className="font-bold text-cyan-300 mt-0.5 truncate">
                {trData(ticket.zone.name)}
                {ticket.seatNumber && <span className="text-white ml-1">({ticket.seatNumber})</span>}
              </p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="my-4 sm:my-5 flex flex-col items-center">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white shadow-xl inline-block border border-slate-200">
              <QRCodeSVG value={ticket.ticketCode} size={170} level="H" includeMargin={false} />
            </div>
            <p className="font-mono font-bold text-xs text-white tracking-widest mt-3">
              {ticket.ticketCode}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('แสดง QR Code นี้ที่ประตูทางเข้างานเพื่อตัดสิทธิ์', 'Present this QR Code at the gate for entry check-in')}
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            <Link
              to={`/tickets/${ticket.ticketCode}/print`}
              className="flex-1 py-2.5 rounded-xl bg-cyan-300 text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-cyan-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> {t('พิมพ์บัตร A4 ที่ระลึก', 'Print A4 Souvenir Ticket')}
            </Link>
            {ticket.booking &&
              (ticket.booking.taxInvoiceRequested || ticket.booking.taxId || ticket.booking.whtAmount > 0) && (
                <button
                  type="button"
                  onClick={() => setShowTaxInvoice(true)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-300" />
                  {t('ใบกำกับภาษี / ใบเสร็จ', 'Tax Invoice / Receipt')}
                </button>
              )}
          </div>
        </div>
      </div>

      {showTaxInvoice && ticket.booking && (
        <TaxInvoiceModal
          booking={{
            ...ticket.booking,
            concertName: ticket.concert?.name,
            zoneName: ticket.zone?.name,
          }}
          onClose={() => setShowTaxInvoice(false)}
        />
      )}
    </div>
  );
}
