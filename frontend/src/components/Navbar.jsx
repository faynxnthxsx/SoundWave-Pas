import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Music, Clock, X, ExternalLink, Printer, LogOut, UserRound } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Navbar() {
  const location = useLocation();
  const isTeamSurface = ['/admin', '/scanner', '/team'].some((path) => location.pathname.startsWith(path));
  const [showHistory, setShowHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('soundwave_session');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error('Session expired');
        setAuthUser(data.user);
        localStorage.setItem('soundwave_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('soundwave_session');
        localStorage.removeItem('soundwave_user');
        setAuthUser(null);
      });
  }, []);

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

  const finishLogin = ({ user, token }) => {
    localStorage.setItem('soundwave_session', token);
    localStorage.setItem('soundwave_user', JSON.stringify(user));
    setAuthUser(user);
  };

  const logout = async () => {
    const token = localStorage.getItem('soundwave_session');
    if (token) {
      try { await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch { /* clear local session while offline */ }
    }
    localStorage.removeItem('soundwave_session');
    localStorage.removeItem('soundwave_user');
    setAuthUser(null);
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

          {isTeamSurface ? (
            <div className="flex items-center gap-2"><Link to="/team" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">พื้นที่ทีมงาน</Link><Link to="/" className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black">กลับหน้าร้าน</Link></div>
          ) : (
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

            {authUser ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5">
                <UserRound size={14} className="text-emerald-300" />
                <span className="max-w-24 text-left text-[10px] leading-tight"><span className="block truncate font-bold text-white">{authUser.username}</span><span className="text-emerald-300">ออนไลน์</span></span>
                <button type="button" onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ" className="ml-1 text-gray-400 hover:text-white"><LogOut size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => setAuthOpen(true)} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20">เข้าสู่ระบบ</button>
            )}
          </div>
          )}
        </div>
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={finishLogin} />}

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
