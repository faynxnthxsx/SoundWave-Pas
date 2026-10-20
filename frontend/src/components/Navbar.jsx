import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, QrCode, Music, Clock, X, ExternalLink, Printer } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const isActive = (path) => location.pathname === path;

  // Load history whenever modal opens
  const openHistoryModal = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('soundwave_purchase_history') || '[]');
      setPurchaseHistory(saved);
    } catch (e) {
      setPurchaseHistory([]);
    }
    setShowHistory(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#07070b]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm">
              <Music className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">
                SOUND<span className="text-cyan-400">WAVE</span>
                <span className="text-xs ml-1 text-gray-400 font-mono">PASS</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/') 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              หน้าแรก
            </Link>

            {/* Purchase History Button */}
            <button
              type="button"
              onClick={openHistoryModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>ประวัติการซื้อบัตร</span>
            </button>

            {/* Scanner Link */}
            <Link
              to="/scanner"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/scanner')
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>สแกนหน้างาน</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── PURCHASE HISTORY MODAL ────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121a] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">ประวัติการซื้อตั๋วของฉัน</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {purchaseHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  <Ticket className="w-10 h-10 mx-auto text-gray-600 mb-2 opacity-50" />
                  <p>ยังไม่มีประวัติการซื้อตั๋วในเครื่องนี้</p>
                  <Link
                    to="/booking/zone-select"
                    onClick={() => setShowHistory(false)}
                    className="inline-block mt-4 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-gray-200"
                  >
                    จองบัตรคอนเสิร์ตเลย
                  </Link>
                </div>
              ) : (
                purchaseHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-mono text-cyan-300 font-bold">
                        {item.bookingCode}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(item.paidAt).toLocaleString('th-TH')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 text-[11px]">
                      <div>
                        <span className="text-gray-400">โซน: </span>
                        <strong className="text-white">{item.zoneName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400">ยอดชำระ: </span>
                        <strong className="text-cyan-400 font-mono">฿{item.totalAmount?.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Issued Tickets Under this booking */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] text-gray-400 uppercase font-mono block">
                        ตั๋วในคำสั่งซื้อนี้ ({item.tickets?.length || 0} ใบ):
                      </span>
                      {item.tickets?.map(t => (
                        <div
                          key={t.id || t.ticketCode}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 text-[11px]"
                        >
                          <div>
                            <p className="font-mono font-bold text-white">{t.ticketCode}</p>
                            {t.seatNumber && (
                              <p className="text-[10px] text-amber-300 font-mono font-semibold">
                                ที่นั่ง: {t.seatNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/tickets/${t.ticketCode}`}
                              onClick={() => setShowHistory(false)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3 text-cyan-400" /> ตั๋ว
                            </Link>
                            <Link
                              to={`/tickets/${t.ticketCode}/print`}
                              onClick={() => setShowHistory(false)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3 text-pink-400" /> พิมพ์
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
      )}
    </>
  );
}
