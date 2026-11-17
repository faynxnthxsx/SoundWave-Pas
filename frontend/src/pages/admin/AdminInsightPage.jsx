import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  LoaderCircle,
  Ticket,
  Users,
  CheckCircle2,
  Percent,
  FileSpreadsheet,
  ShieldCheck,
  QrCode,
  CreditCard,
  FileText,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCache, setAdminCache } from '../../utils/adminCache';
import TaxInvoiceModal from '../../components/TaxInvoiceModal';

const money = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value || 0);

export default function AdminInsightPage() {
  const { lang, t, trData } = useLanguage();
  const { type } = useParams();
  const cached = getAdminCache();
  const [data, setData] = useState(() => ({
    stats: cached?.stats || null,
    concerts: cached?.concerts || [],
    bookings: cached?.bookings || [],
    promotions: [],
  }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !cached?.stats);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);

  const dateLabel = (value) =>
    value
      ? new Date(value).toLocaleDateString(lang === 'en' ? 'en-US' : 'th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : t('ไม่ระบุวันที่', 'Date TBD');

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('soundwave_organizer') || 'null');
    if (!session?.sessionToken) {
      setError(t('กรุณาเข้าสู่ระบบเจ้าของงานก่อน', 'Please sign in as Organizer first'));
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${session.sessionToken}` };
    Promise.all(
      ['/api/admin/stats', '/api/admin/concerts', '/api/admin/bookings', '/api/admin/promotions'].map((url) =>
        fetch(url, { headers }).then(async (r) => {
          const result = await r.json();
          if (!r.ok || !result.success) throw new Error(result.message || t('โหลดข้อมูลไม่สำเร็จ', 'Failed to load data'));
          return result.data;
        })
      )
    )
      .then(([stats, concerts, bookings, promotions]) => {
        setData({ stats, concerts, bookings, promotions: promotions || [] });
        setAdminCache({ stats, concerts, bookings });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const paidBookings = useMemo(
    () => data.bookings.filter((b) => ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(b.status)),
    [data.bookings]
  );

  // Discounted bookings only (for 'discounts' view)
  const discountedBookings = useMemo(
    () => paidBookings.filter((b) => (b.discountAmount || 0) > 0 || b.promoCode),
    [paidBookings]
  );

  // All valid/used tickets for 'sales' view
  const soldTickets = useMemo(() => {
    const list = [];
    for (const b of paidBookings) {
      const fallbackConcert = b.items?.[0]?.zone?.concert?.name || 'SoundWave Concert';
      const fallbackZone = b.items?.[0]?.zone?.name || 'General Zone';
      for (const tk of b.tickets || []) {
        if (['VALID', 'USED'].includes(tk.status)) {
          list.push({
            id: tk.id,
            ticketCode: tk.ticketCode,
            seatNumber: tk.seatNumber || 'Standing',
            attendeeName: tk.attendeeName || b.customerName,
            concertName: tk.zone?.concert?.name || fallbackConcert,
            zoneName: tk.zone?.name || fallbackZone,
            bookingCode: b.bookingCode,
            createdAt: b.createdAt,
          });
        }
      }
    }
    return list;
  }, [paidBookings]);

  // Only USED (checked-in) tickets for 'check-in' view
  const checkedInTickets = useMemo(() => {
    const list = [];
    for (const b of data.bookings) {
      const fallbackConcert = b.items?.[0]?.zone?.concert?.name || 'SoundWave Concert';
      const fallbackZone = b.items?.[0]?.zone?.name || 'General Zone';
      for (const tk of b.tickets || []) {
        if (tk.status === 'USED') {
          list.push({
            id: tk.id,
            ticketCode: tk.ticketCode,
            seatNumber: tk.seatNumber || 'Standing',
            attendeeName: tk.attendeeName || b.customerName,
            concertName: tk.zone?.concert?.name || fallbackConcert,
            zoneName: tk.zone?.name || fallbackZone,
            usedAt: tk.usedAt,
          });
        }
      }
    }
    return list;
  }, [data.bookings]);

  const totalCapacity = useMemo(
    () => data.concerts.reduce((sum, c) => sum + (c.totalCapacity || 0), 0),
    [data.concerts]
  );
  const totalAvailable = useMemo(
    () => data.concerts.reduce((sum, c) => sum + (c.totalAvailable || 0), 0),
    [data.concerts]
  );

  const viewConfig = {
    sales: {
      title: t('ตั๋วที่ขายแล้วทั้งหมด', 'Total Tickets Sold'),
      subtitle: t('แสดงเฉพาะข้อมูลจำนวนตั๋วที่จำหน่ายแล้วและรายชื่อตั๋วแต่ละใบ', 'Dedicated report for sold tickets and seat inventory'),
      icon: Ticket,
    },
    revenue: {
      title: t('รายได้รวมทั้งหมด', 'Total Net Revenue'),
      subtitle: t('แสดงเฉพาะข้อมูลรายได้สุทธิจากรายการชำระเงิน', 'Dedicated financial report for net revenue'),
      icon: CircleDollarSign,
    },
    'check-in': {
      title: t('สแกนเข้างานแล้ว (Check-in)', 'Attendance & Gate Check-in'),
      subtitle: t('แสดงเฉพาะข้อมูลผู้เข้างานที่สแกนตั๋วผ่านประตูแล้วเท่านั้น', 'Dedicated report for scanned gate check-ins only'),
      icon: Users,
    },
    concerts: {
      title: t('คอนเสิร์ตในระบบ', 'Active Concerts'),
      subtitle: t('แสดงเฉพาะข้อมูลคอนเสิร์ต กำหนดการ และจำนวนโซนในระบบ', 'Dedicated report for concerts in the system'),
      icon: CalendarDays,
    },
    gross: {
      title: t('ยอดขายก่อนหักส่วนลด (Gross Sales)', 'Gross Sales Before Discount'),
      subtitle: t('แสดงเฉพาะยอดราคาบัตรตั้งต้นก่อนหักส่วนลดโปรโมชัน', 'Dedicated report for gross ticket sales before discounts'),
      icon: CircleDollarSign,
    },
    discounts: {
      title: t('ส่วนลดที่ใช้ไปทั้งหมด (Discounts Used)', 'Promotional Discounts Used'),
      subtitle: t('แสดงเฉพาะยอดส่วนลดโปรโมชันและรายการคูปองที่ถูกใช้งาน', 'Dedicated report for promotional discounts and coupon usage'),
      icon: Percent,
    },
    taxes: {
      title: t('ภาษีมูลค่าเพิ่ม (VAT 7%) & หัก ณ ที่จ่าย (WHT 3%)', 'VAT 7% & Withholding Tax 3% Report'),
      subtitle: t('แสดงเฉพาะยอดภาษีมูลค่าเพิ่มและภาษีหัก ณ ที่จ่ายของแต่ละรายการ', 'Dedicated tax report for VAT 7% and Withholding Tax 3%'),
      icon: FileSpreadsheet,
    },
    channels: {
      title: t('ช่องทางชำระเงิน VeriTrans Gateway', 'VeriTrans Payment Channels'),
      subtitle: t('แสดงเฉพาะสัดส่วนและรายการชำระเงินแยกตามช่องทาง QR PromptPay และบัตรเครดิต', 'Dedicated report for VeriTrans payment methods'),
      icon: ShieldCheck,
    },
  };

  const activeConfig = viewConfig[type] || viewConfig.sales;
  const Icon = activeConfig.icon;

  return (
    <main className="admin-dashboard-screen min-h-screen w-full max-w-full overflow-x-hidden bg-[#09090f] px-3 py-5 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl w-full">
        <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white">
          <ArrowLeft size={15} /> {t('กลับหน้าภาพรวมแดชบอร์ด', 'Back to Dashboard Overview')}
        </Link>

        <header className="mt-5 sm:mt-8 flex items-start gap-3 sm:gap-4 border-b border-white/10 pb-5 sm:pb-6">
          <div className="rounded-2xl bg-cyan-300/10 p-2.5 sm:p-3 text-cyan-200 shrink-0">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Dedicated Insight View</p>
            <h1 className="mt-1 text-xl font-black sm:text-[28px] break-words">{activeConfig.title}</h1>
            <p className="mt-1.5 sm:mt-2 text-xs text-gray-400">{activeConfig.subtitle}</p>
          </div>
        </header>

        {loading && !data.stats && !error && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 py-16 text-cyan-400">
            <LoaderCircle className="animate-spin" size={32} />
            <p className="text-xs font-mono tracking-wider text-gray-400">LOADING INSIGHT REPORT...</p>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
            {trData(error)}
          </p>
        )}

        {/* ── 1. SALES (ตั๋วที่ขายแล้วทั้งหมด) ── */}
        {!error && (!type || type === 'sales') && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-cyan-400/30 bg-[#101018] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    {t('สรุปยอดตั๋วที่ขายแล้ว (Tickets Sold Only)', 'Total Tickets Sold Summary')}
                  </span>
                  <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-white">
                    {(data.stats?.totalTickets || 0).toLocaleString('th-TH')}{' '}
                    <span className="text-base font-normal text-gray-400">{t('ใบ', 'tickets')}</span>
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-gray-300 space-y-1">
                  <p>
                    {t('ความจุรวมทั้งหมด:', 'Total Capacity:')}{' '}
                    <strong className="text-white">
                      {totalCapacity.toLocaleString()} {t('ใบ', 'tickets')}
                    </strong>
                  </p>
                  <p>
                    {t('ตั๋วคงเหลือว่าง:', 'Available Remaining:')}{' '}
                    <strong className="text-cyan-300">
                      {totalAvailable.toLocaleString()} {t('ใบ', 'tickets')}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`รายการตั๋วที่ออกแล้วทั้งหมด (${soldTickets.length} ใบ)`, `All Issued Tickets (${soldTickets.length})`)}
              </h2>
              {soldTickets.map((tk) => (
                <article
                  key={tk.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-3.5 sm:p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black text-cyan-300">{tk.ticketCode}</span>
                      <span className="rounded-lg bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
                        {t('ที่นั่ง/คิว:', 'Seat/Queue:')} {tk.seatNumber}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white font-semibold truncate">
                      {trData(tk.concertName)} · {t('โซน', 'Zone')} {trData(tk.zoneName)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-xs">
                    <p className="font-bold text-gray-200">{tk.attendeeName}</p>
                    <p className="text-[10px] font-mono text-gray-500">
                      {t('ใบจอง:', 'Booking:')} {tk.bookingCode}
                    </p>
                  </div>
                </article>
              ))}
              {soldTickets.length === 0 && (
                <p className="py-12 text-center text-gray-500">{t('ยังไม่มีตั๋วที่ขายแล้ว', 'No sold tickets yet')}</p>
              )}
            </div>
          </section>
        )}

        {/* ── 2. REVENUE (รายได้รวมทั้งหมด) ── */}
        {!error && type === 'revenue' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-emerald-400/30 bg-[#101018] p-5 sm:p-7">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                {t('รายได้สุทธิทั้งหมด (Net Revenue Only)', 'Total Net Revenue')}
              </span>
              <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-emerald-300">
                {money(data.stats?.revenue)}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`รายการรับชำระเงินสุทธิ (${paidBookings.length} รายการ)`, `Paid Orders (${paidBookings.length})`)}
              </h2>
              {paidBookings.map((b) => (
                <article
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-3.5 sm:p-4"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300">{b.bookingCode}</span>
                    <p className="mt-0.5 text-xs text-gray-300 truncate">{b.customerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base font-black text-emerald-300">
                      {money(b.totalAmount - (b.refundedAmount || 0))}
                    </p>
                  </div>
                </article>
              ))}
              {paidBookings.length === 0 && (
                <p className="py-12 text-center text-gray-500">{t('ยังไม่มีรายการรับชำระเงิน', 'No payment records found')}</p>
              )}
            </div>
          </section>
        )}

        {/* ── 3. CHECK-IN (สแกนเข้างานแล้ว) ── */}
        {!error && type === 'check-in' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-purple-400/30 bg-[#101018] p-5 sm:p-7">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                {t('ผู้สแกนเข้างานแล้ว (Checked-In Attendees Only)', 'Checked-In Attendees')}
              </span>
              <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-purple-200">
                {(data.stats?.checkedIn || 0).toLocaleString('th-TH')}{' '}
                <span className="text-base font-normal text-gray-400">{t('คน', 'attendees')}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`รายชื่อผู้ที่สแกนตั๋วเข้างานแล้ว (${checkedInTickets.length} คน)`, `Checked-In Attendees (${checkedInTickets.length})`)}
              </h2>
              {checkedInTickets.map((tk) => (
                <article
                  key={tk.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-400/20 bg-[#12121a] p-3.5 sm:p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-purple-300 shrink-0" />
                      <span className="font-mono text-xs sm:text-sm font-bold text-purple-200">{tk.ticketCode}</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white">
                        {tk.seatNumber}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white font-semibold truncate">
                      {t('ผู้เข้างาน:', 'Attendee:')} {tk.attendeeName} · {trData(tk.concertName)} ({trData(tk.zoneName)})
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-xs font-mono text-purple-300">
                    <p>{t('USED (เข้างานแล้ว)', 'USED (Checked In)')}</p>
                    <p className="text-[10px] text-gray-400">
                      {tk.usedAt ? new Date(tk.usedAt).toLocaleString('th-TH') : t('สแกนผ่านประตูแล้ว', 'Gate Scanned')}
                    </p>
                  </div>
                </article>
              ))}
              {checkedInTickets.length === 0 && (
                <p className="py-12 text-center text-gray-500">{t('ยังไม่มีผู้สแกนตั๋วเข้างาน', 'No checked-in attendees yet')}</p>
              )}
            </div>
          </section>
        )}

        {/* ── 4. CONCERTS (คอนเสิร์ตในระบบ) ── */}
        {!error && type === 'concerts' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-pink-400/30 bg-[#101018] p-5 sm:p-7">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
                {t('จำนวนคอนเสิร์ตในระบบทั้งหมด (Concerts Only)', 'Total Concerts in System')}
              </span>
              <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-white">
                {data.concerts.length.toLocaleString('th-TH')}{' '}
                <span className="text-base font-normal text-gray-400">{t('งาน', 'events')}</span>
              </p>
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {data.concerts.map((c) => (
                <article key={c.id} className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-full bg-pink-400/15 border border-pink-400/30 px-2.5 py-0.5 text-[10px] font-bold text-pink-200">
                      {c.status || 'ON_SALE'}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {c.totalZones || c.zones?.length || 0} {t('โซนที่นั่ง', 'Zones')}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black break-words">{trData(c.name)}</h2>
                  <p className="mt-1 text-xs text-gray-400">
                    📅 {dateLabel(c.eventDate)} · 📍 {trData(c.location || c.venue || t('ไม่ระบุสถานที่', 'Venue TBD'))}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. GROSS SALES (ยอดขายก่อนหักส่วนลด) ── */}
        {!error && type === 'gross' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-cyan-400/30 bg-[#101018] p-5 sm:p-7">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                {t('ยอดขายก่อนหักส่วนลดทั้งหมด (Gross Sales Only)', 'Gross Sales Before Discount')}
              </span>
              <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-white">
                {money(data.stats?.grossSubtotal || data.stats?.revenue || 0)}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`รายละเอียดยอดตั้งต้นรายใบจอง (${paidBookings.length} รายการ)`, `Gross Subtotal by Booking (${paidBookings.length})`)}
              </h2>
              {paidBookings.map((b) => (
                <article
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-3.5 sm:p-4"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs sm:text-sm font-bold text-cyan-300">{b.bookingCode}</span>
                    <p className="mt-0.5 text-xs text-gray-300 truncate">
                      {b.customerName} ({b.items?.[0]?.quantity || b.tickets?.length || 1} {t('ใบ', 'tickets')})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base font-black text-white">
                      {money(b.subtotalAmount > 0 ? b.subtotalAmount : b.totalAmount)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── 6. DISCOUNTS (ส่วนลดที่ใช้ไปทั้งหมด) ── */}
        {!error && type === 'discounts' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-pink-400/30 bg-[#101018] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
                    {t('ส่วนลดที่ใช้ไปทั้งหมด (Discounts Only)', 'Total Promotional Discounts Given')}
                  </span>
                  <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-pink-300">
                    -{money(data.stats?.totalDiscountsGiven || 0)}
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-gray-300 space-y-1">
                  <p>
                    {t('โปรแก๊งเพื่อน:', 'Squad Bundle:')} <strong className="text-emerald-300">-{money(data.stats?.bundleDiscountTotal || 0)}</strong>
                  </p>
                  <p>
                    {t('โค้ดคูปอง:', 'Coupon Code:')} <strong className="text-cyan-300">-{money(data.stats?.couponDiscountTotal || 0)}</strong> ·{' '}
                    {t('พาร์ทเนอร์ VeriTrans:', 'VeriTrans Partner:')} <strong className="text-pink-300">-{money(data.stats?.partnerDiscountTotal || 0)}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`รายการจองที่ใช้ส่วนลด (${discountedBookings.length} รายการ)`, `Discounted Bookings (${discountedBookings.length})`)}
              </h2>
              {discountedBookings.map((b) => (
                <article
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-3.5 sm:p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-pink-300">{b.bookingCode}</span>
                      {b.promoCode && (
                        <span className="rounded bg-pink-500/20 border border-pink-400/30 px-2 py-0.5 font-mono text-[10px] font-bold text-pink-200">
                          {b.promoCode}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-300 truncate">{b.customerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base font-black text-pink-300">
                      -{money(b.discountAmount || 0)}
                    </p>
                  </div>
                </article>
              ))}
              {discountedBookings.length === 0 && (
                <p className="py-12 text-center text-gray-500">
                  {t('ยังไม่มีรายการที่ใช้ส่วนลด', 'No discounted orders yet')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── 7. TAXES (ภาษีมูลค่าเพิ่ม VAT 7% & หัก ณ ที่จ่าย WHT 3%) ── */}
        {!error && type === 'taxes' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="rounded-3xl border border-amber-400/30 bg-[#101018] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    {t('ภาษีมูลค่าเพิ่มสะสม (VAT 7% Only)', 'Total VAT 7% Collected')}
                  </span>
                  <p className="mt-1 font-mono text-3xl sm:text-4xl font-black text-amber-300">
                    +{money(data.stats?.totalVatCollected || 0)}
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-gray-300 space-y-1">
                  <p>
                    {t('ภาษีหัก ณ ที่จ่ายสะสม (WHT 3%):', 'Total Withholding Tax (WHT 3%):')}{' '}
                    <strong className="text-purple-300">-{money(data.stats?.totalWhtDeducted || 0)}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`รายละเอียดภาษีรายใบจอง (${paidBookings.length} รายการ)`, `Tax Breakdown by Booking (${paidBookings.length})`)}
              </h2>
              {paidBookings.map((b) => {
                const vat = b.vatAmount > 0 ? b.vatAmount : Math.round(((b.totalAmount || 0) * 7) / 107);
                return (
                  <article
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-3.5 sm:p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-amber-300">{b.bookingCode}</span>
                        {(b.taxInvoiceRequested || b.taxId || b.whtAmount > 0) && (
                          <span className="rounded bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                            {t('ขอใบกำกับภาษี', 'Tax Invoice Requested')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-300 truncate">
                        {b.taxCompanyName || b.customerName}
                        {b.taxId ? ` · Tax ID: ${b.taxId}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono">
                        <p className="text-sm font-black text-amber-300">VAT 7%: +{money(vat)}</p>
                        {b.whtAmount > 0 && (
                          <p className="text-[11px] font-bold text-purple-300">WHT 3%: -{money(b.whtAmount)}</p>
                        )}
                      </div>
                      {(b.taxInvoiceRequested || b.taxId || b.whtAmount > 0) && (
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceBooking(b)}
                          className="flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 cursor-pointer"
                        >
                          <FileText size={13} />
                          <span>{t('ใบกำกับภาษี', 'Tax Invoice')}</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {selectedInvoiceBooking && (
          <TaxInvoiceModal
            booking={selectedInvoiceBooking}
            onClose={() => setSelectedInvoiceBooking(null)}
          />
        )}

        {/* ── 8. CHANNELS (ช่องทางชำระเงิน VeriTrans) ── */}
        {!error && type === 'channels' && (
          <section className="mt-6 sm:mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-cyan-400/30 bg-[#101018] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase">
                  <QrCode size={16} />
                  <span>VeriTrans · QR PromptPay</span>
                </div>
                <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-white">
                  {money(data.stats?.paymentChannels?.promptPayRevenue || 0)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {data.stats?.paymentChannels?.promptPayCount || 0} {t('รายการชำระสำเร็จ', 'completed transactions')}
                </p>
              </div>

              <div className="rounded-3xl border border-pink-400/30 bg-[#101018] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-pink-300 text-xs font-bold uppercase">
                  <CreditCard size={16} />
                  <span>VeriTrans · Credit / Debit Card</span>
                </div>
                <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-white">
                  {money(data.stats?.paymentChannels?.creditCardRevenue || 0)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {data.stats?.paymentChannels?.creditCardCount || 0} {t('รายการชำระสำเร็จ', 'completed transactions')}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6 space-y-3">
              <h2 className="text-sm font-black text-white mb-2">
                {t(`ประวัติช่องทางชำระเงินทั้งหมด (${paidBookings.length} รายการ)`, `Transactions by Channel (${paidBookings.length})`)}
              </h2>
              {paidBookings.map((b) => {
                const isCard =
                  String(b.paymentMethod || '').toUpperCase().includes('CARD') ||
                  String(b.paymentMethod || '').toUpperCase().includes('CREDIT');
                return (
                  <article
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-3.5 sm:p-4"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs sm:text-sm font-bold text-cyan-300">{b.bookingCode}</span>
                      <p className="mt-0.5 text-xs text-gray-300 truncate">{b.customerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          isCard
                            ? 'bg-pink-400/15 border-pink-400/30 text-pink-300'
                            : 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300'
                        }`}
                      >
                        {isCard ? <CreditCard size={11} /> : <QrCode size={11} />}
                        {isCard ? t('บัตรเครดิต/เดบิต', 'Credit/Debit Card') : 'QR PromptPay'}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
