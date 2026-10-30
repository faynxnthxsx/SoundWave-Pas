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
  const [authUser, setAuthUser] = useState(null);
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
            <div className="flex items-center gap-2.5">
              <LanguageSwitch />
              <Link
                to="/team"
                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
              >
                {t('พื้นที่ทีมงาน', 'Team Portal')}
              </Link>
              <Link to="/" className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black">
                {t('กลับหน้าร้าน', 'Back to Store')}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitch />

              <Link
                to="/"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/')
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('หน้าแรก', 'Home')}
              </Link>

              {authUser && (
                <Button variant="outline" size="sm" onClick={openHistoryModal}>
                  <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('ประวัติการซื้อบัตร', 'My Tickets')}</span>
                </Button>
              )}

              {authUser ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5">
                  <UserRound size={14} className="text-emerald-300" />
                  <span className="max-w-24 text-left text-[10px] leading-tight">
                    <span className="block truncate font-bold text-white">{authUser.username}</span>
                    <span className="text-emerald-300">{t('ออนไลน์', 'Online')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    aria-label={t('ออกจากระบบ', 'Logout')}
                    title={t('ออกจากระบบ', 'Logout')}
                    className="ml-1 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Button variant="cyanOutline" size="sm" onClick={() => setAuthOpen(true)}>
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
