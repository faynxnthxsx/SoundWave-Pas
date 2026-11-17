import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider, useToast } from './components/Toast';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

// Eager load all pages for instant 0ms page transitions
import HomePage from './pages/booking/HomePage';
import ZoneSelectPage from './pages/booking/ZoneSelectPage';
import PaymentPage from './pages/booking/PaymentPage';
import ConcertDetailPage from './pages/booking/ConcertDetailPage';
import MyTicketPage from './pages/tickets/MyTicketPage';

// Lazy load heavy / staff-only pages (split out of the main bundle)
const SouvenirPrintPage = lazy(() => import('./pages/tickets/SouvenirPrintPage'));
const GateScannerPage = lazy(() => import('./pages/scanner/GateScannerPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminInsightPage = lazy(() => import('./pages/admin/AdminInsightPage'));
const TeamPortalPage = lazy(() => import('./pages/TeamPortalPage'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-cyan-400 animate-spin" />
  </div>
);

function GoogleOAuthHandler() {
  const { t } = useLanguage();
  const toast = useToast();
  const [googleProcessing, setGoogleProcessing] = useState(() => {
    return Boolean(
      typeof window !== 'undefined' &&
        window.location.hash &&
        (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))
    );
  });

  useEffect(() => {
    const hashRaw = (window.location.hash || '').replace(/^#/, '');
    const hashParams = new URLSearchParams(hashRaw);
    const searchParams = new URLSearchParams(window.location.search || '');
    const oauthError = hashParams.get('error') || searchParams.get('error');

    if (oauthError) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setGoogleProcessing(false);
      if (oauthError !== 'access_denied') {
        toast.error(
          t(`เข้าสู่ระบบด้วย Google ไม่สำเร็จ (${oauthError})`, `Google Sign-In failed (${oauthError})`)
        );
      }
      return;
    }

    const accessToken = hashParams.get('access_token');
    const idToken = hashParams.get('id_token');
    if (!accessToken && !idToken) return;

    setGoogleProcessing(true);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, credential: idToken }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.user) {
          localStorage.setItem('soundwave_session', data.token);
          localStorage.setItem('soundwave_user', JSON.stringify(data.user));

          try {
            const savedRoute = sessionStorage.getItem('sw_google_auth_state');
            if (savedRoute && savedRoute !== window.location.pathname + window.location.search) {
              sessionStorage.removeItem('sw_google_auth_state');
              window.location.href = savedRoute;
              return;
            }
          } catch {
            /* ignore */
          }
          window.location.reload();
        } else {
          toast.error(
            data?.message || t('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่', 'Google Sign-In failed. Please try again.')
          );
          setGoogleProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Google OAuth callback failed:', err);
        toast.error(t('เชื่อมต่อเซิร์ฟเวอร์สำหรับ Google Login ไม่สำเร็จ', 'Could not complete Google Sign-In'));
        setGoogleProcessing(false);
      });
  }, []);

  if (!googleProcessing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07070b]/95 backdrop-blur-md">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4" />
      <p className="text-sm font-semibold text-white">{t('กำลังเข้าสู่ระบบด้วย Google…', 'Signing in with Google…')}</p>
      <p className="text-xs text-gray-400 mt-1">
        {t('กรุณารอสักครู่ ระบบกำลังนำท่านเข้าใช้งาน', 'Please wait a moment while we sign you in')}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <div className="theme-app-container min-h-screen flex flex-col bg-[#07070b] text-gray-100 selection:bg-[#00f0ff] selection:text-black overflow-x-hidden w-full max-w-full">
              <GoogleOAuthHandler />

              {/* Navigation Bar */}
              <Navbar />

              {/* Main App Content - Instant Navigation */}
              <main className="flex-1 w-full max-w-full overflow-x-hidden pb-16 md:pb-0">
                <Suspense fallback={<PageFallback />}>
                <Routes>
                  {/* Booking Flow */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/concerts/:id" element={<ConcertDetailPage />} />
                  <Route path="/booking/zone-select" element={<ZoneSelectPage />} />
                  <Route path="/booking/payment/:bookingCode" element={<PaymentPage />} />

                  {/* Ticket & Printing */}
                  <Route path="/tickets/:ticketCode" element={<MyTicketPage />} />
                  <Route path="/tickets/:ticketCode/print" element={<SouvenirPrintPage />} />

                  {/* Gate Scanner & Admin */}
                  <Route path="/scanner" element={<GateScannerPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/insights/:type" element={<AdminInsightPage />} />
                  <Route path="/team" element={<TeamPortalPage />} />
                </Routes>
                </Suspense>
              </main>

              {/* Global Footer */}
              <Footer />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
