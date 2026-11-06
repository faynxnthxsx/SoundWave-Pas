import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CircleDollarSign, LoaderCircle, Ticket, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCache, setAdminCache } from '../../utils/adminCache';

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
  }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !cached?.stats);

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
      setError('กรุณาเข้าสู่ระบบเจ้าของงานก่อน');
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${session.sessionToken}` };
    Promise.all(
      ['/api/admin/stats', '/api/admin/concerts', '/api/admin/bookings'].map((url) =>
        fetch(url, { headers }).then(async (r) => {
          const result = await r.json();
          if (!r.ok || !result.success) throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');
          return result.data;
        })
      )
    )
      .then(([stats, concerts, bookings]) => {
        setData({ stats, concerts, bookings });
        setAdminCache({ stats, concerts, bookings });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const paid = useMemo(
    () => data.bookings.filter((b) => ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(b.status)),
    [data.bookings]
  );
  const checkedIn = useMemo(
    () => data.bookings.filter((b) => b.tickets?.some((tk) => tk.status === 'USED')),
    [data.bookings]
  );

  const title =
    type === 'concerts'
      ? t('คอนเสิร์ตในระบบ', 'Active Concerts')
      : type === 'check-in'
      ? t('การเข้างานและ Check-in', 'Attendance & Gate Check-in')
      : type === 'revenue'
      ? t('รายได้และการชำระเงิน', 'Revenue & Payments')
      : t('ตั๋วที่ขายแล้ว', 'Tickets Sold');

  const Icon =
    type === 'concerts'
      ? CalendarDays
      : type === 'check-in'
      ? Users
      : type === 'revenue'
      ? CircleDollarSign
      : Ticket;

  return (
    <main className="admin-dashboard-screen min-h-screen w-full max-w-full overflow-x-hidden bg-[#09090f] px-3 py-5 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl w-full">
        <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white">
          <ArrowLeft size={15} /> {t('กลับแดชบอร์ด', 'Back to Dashboard')}
        </Link>
        <header className="mt-5 sm:mt-8 flex items-start gap-3 sm:gap-4 border-b border-white/10 pb-5 sm:pb-6">
          <div className="rounded-2xl bg-cyan-300/10 p-2.5 sm:p-3 text-cyan-200 shrink-0">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Organizer Report</p>
            <h1 className="mt-1 text-xl font-black sm:text-[28px] break-words">{title}</h1>
            <p className="mt-1.5 sm:mt-2 text-xs text-gray-400">
              {t(
                'รายละเอียดแบบเต็มหน้า สำหรับตรวจสอบข้อมูลและตัดสินใจจัดการงาน',
                'Full-page operational report for event monitoring and decision making'
              )}
            </p>
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
        {!error && type === 'concerts' && (
          <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
            {data.concerts.map((c) => (
              <article key={c.id} className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-black break-words">{trData(c.name)}</h2>
                <p className="mt-1 text-xs text-gray-400">
                  {dateLabel(c.eventDate)} · {trData(c.location || c.venue || t('ไม่ระบุสถานที่', 'Venue TBD'))}
                </p>
                <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl bg-black/30 p-3 text-center">
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-cyan-200 font-mono">{c.totalTicketsSold || 0}</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">{t('ขายแล้ว', 'Sold')}</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-emerald-200 font-mono">{c.totalAvailable || 0}</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">{t('คงเหลือ', 'Available')}</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-purple-200 font-mono">{c.checkedIn || 0}</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">{t('เช็กอิน', 'Checked In')}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!error && type !== 'concerts' && (
          <section className="mt-6 sm:mt-8 rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-7">
            <div className="mb-5 sm:mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 rounded-2xl bg-black/30 p-3.5 sm:p-4">
              <div className="flex sm:block items-baseline justify-between">
                <p className="text-xs text-gray-400">{t('ตั๋วที่ขายแล้ว', 'Tickets Sold')}</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-black text-cyan-200 font-mono">
                  {data.stats?.totalTickets || 0} {t('ใบ', 'tickets')}
                </p>
              </div>
              <div className="flex sm:block items-baseline justify-between border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
                <p className="text-xs text-gray-400">{t('รายได้สุทธิ', 'Net Revenue')}</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-black text-emerald-200 font-mono">{money(data.stats?.revenue)}</p>
              </div>
              <div className="flex sm:block items-baseline justify-between border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
                <p className="text-xs text-gray-400">{t('เข้างานแล้ว', 'Checked In')}</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-black text-purple-200 font-mono">
                  {data.stats?.checkedIn || 0} {t('คน', 'attendees')}
                </p>
              </div>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {(type === 'check-in' ? checkedIn : paid).map((b) => (
                <article
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs sm:text-sm font-bold text-cyan-200">{b.bookingCode}</p>
                    <p className="mt-0.5 text-xs sm:text-sm truncate">{b.customerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm sm:text-base font-bold text-emerald-200">
                      {money(b.totalAmount - (b.refundedAmount || 0))}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-400">
                      {b.tickets?.length || 0} {t('ใบ', 'tickets')} · {b.status}
                    </p>
                  </div>
                </article>
              ))}
              {(type === 'check-in' ? checkedIn : paid).length === 0 && (
                <p className="py-12 text-center text-gray-500">{t('ยังไม่มีข้อมูลรายการ', 'No records found')}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
