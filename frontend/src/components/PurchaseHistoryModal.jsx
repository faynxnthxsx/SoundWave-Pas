import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, X, ExternalLink, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from './ui/Button';

export default function PurchaseHistoryModal({ open, onClose, purchaseHistory, setPurchaseHistory }) {
  const { lang, t, trData } = useLanguage();
  const [historySearch, setHistorySearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  if (!open) return null;

  const handleLookupBooking = async (codeToSearch) => {
    const query = (codeToSearch || historySearch).trim();
    if (!query) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || t('ไม่พบรายการจองนี้ในระบบ', 'Booking code not found'));
      }
      const b = data.data;
      if (b.status !== 'PAID') {
        throw new Error(
          t(`รายการจองนี้ยังไม่สำเร็จ (สถานะ: ${b.status})`, `Booking is not completed yet (Status: ${b.status})`)
        );
      }
      const newEntry = {
        bookingCode: b.bookingCode,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        zoneName: b.items?.[0]?.zone?.name || 'Festival Zone',
        totalAmount: b.totalAmount,
        tickets: b.tickets || [],
        paidAt: b.paidAt || new Date().toISOString(),
      };
      const saved = JSON.parse(localStorage.getItem('soundwave_purchase_history') || '[]');
      const updated = [newEntry, ...saved.filter((item) => item.bookingCode !== b.bookingCode)];
      localStorage.setItem('soundwave_purchase_history', JSON.stringify(updated));
      setPurchaseHistory(updated);
      setHistorySearch('');
    } catch (err) {
      setSearchError(err.message || t('ค้นหาไม่สำเร็จ', 'Search failed'));
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12121a] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {t('ประวัติการซื้อตั๋วของฉัน', 'My Ticket Purchase History')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Search or Lookup by Booking Code */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <span className="text-[11px] text-gray-300 font-bold block">
              {t('ค้นหารายการจอง / กู้คืนตั๋ว:', 'Lookup Booking / Restore Tickets:')}
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setSearchError('');
                }}
                placeholder={t('พิมพ์รหัสจอง เช่น SW-2026-...', 'Enter booking code e.g. SW-2026-...')}
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupBooking();
                  }
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleLookupBooking()}
                disabled={searchLoading || !historySearch.trim()}
              >
                {searchLoading ? t('ค้นหา…', 'Searching…') : t('ค้นหา', 'Search')}
              </Button>
            </div>
            {searchError && <p className="text-[10px] text-rose-400 font-semibold">{searchError}</p>}
          </div>

          {purchaseHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <Ticket className="w-10 h-10 mx-auto text-gray-600 mb-2 opacity-50" />
              <p>{t('ยังไม่มีประวัติการซื้อตั๋วในเครื่องนี้', 'No ticket purchase history found on this device')}</p>
              <Link
                to="/booking/zone-select"
                onClick={onClose}
                className="inline-block mt-4 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-gray-200"
              >
                {t('จองบัตรคอนเสิร์ตเลย', 'Book Concert Tickets Now')}
              </Link>
            </div>
          ) : (
            purchaseHistory.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-mono text-cyan-300 font-bold">{item.bookingCode}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(item.paidAt).toLocaleString(lang === 'en' ? 'en-US' : 'th-TH')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 py-1 text-[11px]">
                  <div>
                    <span className="text-gray-400">{t('โซน: ', 'Zone: ')}</span>
                    <strong className="text-white">{trData(item.zoneName)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">{t('ยอดชำระ: ', 'Total Paid: ')}</span>
                    <strong className="text-cyan-400 font-mono">฿{item.totalAmount?.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">
                    {t(
                      `ตั๋วในคำสั่งซื้อนี้ (${item.tickets?.length || 0} ใบ):`,
                      `Tickets in this order (${item.tickets?.length || 0}):`
                    )}
                  </span>
                  {item.tickets?.map((ticketItem) => (
                    <div
                      key={ticketItem.id || ticketItem.ticketCode}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 text-[11px]"
                    >
                      <div>
                        <p className="font-mono font-bold text-white">{ticketItem.ticketCode}</p>
                        {ticketItem.seatNumber && (
                          <p className="text-[10px] text-amber-300 font-mono font-semibold">
                            {t('ที่นั่ง', 'Seat')}: {ticketItem.seatNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/tickets/${ticketItem.ticketCode}`}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-cyan-400" /> {t('ตั๋ว', 'Ticket')}
                        </Link>
                        <Link
                          to={`/tickets/${ticketItem.ticketCode}/print`}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-pink-400" /> {t('พิมพ์', 'Print')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
