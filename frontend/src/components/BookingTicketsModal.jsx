import React from 'react';
import { X, Ticket, Printer, ExternalLink, User, Armchair, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookingTicketsModal({ booking, onClose }) {
  if (!booking) return null;

  const tickets = booking.tickets || [];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-tickets-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#101019] shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-white/10 p-5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
              <Ticket size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                Booking Attendee Breakdown
              </span>
              <h2 id="booking-tickets-title" className="text-xl font-black text-white mt-0.5">
                รายการตั๋วทั้งหมดในคำสั่งซื้อ #{booking.bookingCode}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                ผู้จอง: <strong className="text-white">{booking.customerName}</strong> ({booking.customerPhone}) · {tickets.length} ใบ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-xl border border-white/10 p-2 text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {tickets.map((t, idx) => {
            const isUsed = t.status === 'USED';
            const isValid = t.status === 'VALID';

            return (
              <article
                key={t.id || idx}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-400/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-cyan-200">
                      {t.ticketCode}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isUsed
                          ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                          : isValid
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isUsed ? 'สแกนเข้างานแล้ว' : isValid ? 'บัตรพร้อมใช้งาน' : 'ยกเลิก / คืนเงิน'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-gray-400" />
                      <span>{t.attendeeName}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-cyan-300">
                      <Armchair size={13} />
                      <span>ที่นั่ง: {t.seatNumber || 'บัตรยืน (GA)'}</span>
                    </span>
                  </div>

                  {t.usedAt && (
                    <p className="text-[10px] text-purple-300 flex items-center gap-1">
                      <Clock size={11} />
                      <span>สแกนเมื่อ: {new Date(t.usedAt).toLocaleString('th-TH')} {t.scannedBy && `(สตาฟฟ์: ${t.scannedBy})`}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Link
                    to={`/tickets/${t.ticketCode}`}
                    target="_blank"
                    className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    <ExternalLink size={12} />
                    <span>ดูตั๋ว</span>
                  </Link>
                  <Link
                    to={`/tickets/${t.ticketCode}/print`}
                    target="_blank"
                    className="flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20"
                  >
                    <Printer size={12} />
                    <span>พิมพ์ตั๋ว</span>
                  </Link>
                </div>
              </article>
            );
          })}

          {tickets.length === 0 && (
            <div className="py-12 text-center text-xs text-gray-500">
              ไม่พบตั๋วในรายการจองนี้
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
