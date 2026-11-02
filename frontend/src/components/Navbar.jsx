import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Music, LogOut, UserRound } from 'lucide-react';
import AuthModal from './AuthModal';
import PurchaseHistoryModal from './PurchaseHistoryModal';
import LanguageSwitch from './ui/LanguageSwitch';
import Button from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();
  const location = useLocation();
  const isTeamSurface = ['/admin', '/scanner', '/team'].some((path) => location.pathname.startsWith(path));
  const [showHistory, setShowHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('soundwave_user') || 'null');
    } catch {
      return null;
    }
  });
  const [authOpen, setAuthOpen] = useState(false);

  const openHistoryModal = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('soundwave_purchase_history') || '[]');
      setPurchaseHistory(saved);
    } catch {
      setPurchaseHistory([]);
    }
    setShowHistory(true);
  };

  useEffect(() => {
    const handleOpen = () => openHistoryModal();
    window.addEventListener('open_soundwave_history', handleOpen);
    return () => window.removeEventListener('open_soundwave_history', handleOpen);
  }, []);

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

  const finishLogin = ({ user, token }) => {
    localStorage.setItem('soundwave_session', token);
    localStorage.setItem('soundwave_user', JSON.stringify(user));
    setAuthUser(user);
  };

  const logout = async () => {
    const token = localStorage.getItem('soundwave_session');
    if (token) {
      try {
        await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      } catch {
        /* clear local session while offline */
      }
    }
    localStorage.removeItem('soundwave_session');
    localStorage.removeItem('soundwave_user');
    setAuthUser(null);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#07070b]/90 backdrop-blur-md border-b border-white/10 px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-all w-full max-w-full">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shrink-0">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-wider text-white">
                SOUND<span className="text-cyan-400">WAVE</span>
                <span className="text-xs ml-1 text-gray-400 font-mono hidden sm:inline">PASS</span>
              </span>
            </div>
          </Link>

          {isTeamSurface ? (
            <div className="flex items-center gap-2">
              <LanguageSwitch className="scale-90 sm:scale-100 origin-right" />
              <Link
                to="/team"
                className="rounded-xl border border-white/10 px-2.5 sm:px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 whitespace-nowrap"
              >
                {t('พื้นที่ทีมงาน', 'Team Portal')}
              </Link>
              <Link to="/" className="rounded-xl bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-black whitespace-nowrap">
                {t('กลับหน้าร้าน', 'Back to Store')}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <LanguageSwitch className="scale-90 sm:scale-100 origin-right" />
              
              <Link
                to="/"
                className={`hidden md:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/')
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('หน้าแรก', 'Home')}
              </Link>

              {authUser && (
                <Button variant="outline" size="sm" onClick={openHistoryModal} className="hidden md:inline-flex">
                  <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('ประวัติการซื้อบัตร', 'My Tickets')}</span>
                </Button>
              )}

              {authUser ? (
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-2 sm:px-2.5 py-1 shrink-0">
                  {authUser.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt={authUser.username}
                      className="h-5 w-5 rounded-full object-cover ring-1 ring-emerald-400/50 shrink-0"
                    />
                  ) : (
                    <UserRound size={13} className="text-emerald-300 shrink-0" />
                  )}
                  <span className="max-w-[65px] xs:max-w-[85px] sm:max-w-[110px] text-left text-[11px] font-bold text-white truncate shrink-0">
                    {authUser.username}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    aria-label={t('ออกจากระบบ', 'Logout')}
                    title={t('ออกจากระบบ', 'Logout')}
                    className="ml-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 text-rose-300 cursor-pointer shrink-0 transition-all"
                  >
                    <LogOut size={11} className="text-rose-400 shrink-0" />
                    <span className="text-[10px] font-bold tracking-tight text-rose-200">
                      <span className="hidden sm:inline">{t('ออกจากระบบ', 'Logout')}</span>
                      <span className="sm:hidden">{t('ออก', 'Exit')}</span>
                    </span>
                  </button>
                </div>
              ) : (
                <Button variant="cyanOutline" size="sm" onClick={() => setAuthOpen(true)} className="px-2.5 py-1 text-xs whitespace-nowrap shrink-0">
                  {t('เข้าสู่ระบบ', 'Sign In')}
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={finishLogin} />}

      <PurchaseHistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        purchaseHistory={purchaseHistory}
        setPurchaseHistory={setPurchaseHistory}
      />
    </>
  );
}
