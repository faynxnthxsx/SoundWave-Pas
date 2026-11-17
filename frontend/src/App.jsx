import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
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

function decodeBase64UrlJson(encoded) {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function getValidatedDesktopCallback(rawState) {
  if (!rawState || !rawState.startsWith('__sw_desktop__')) return null;
  const parsedState = decodeBase64UrlJson(rawState.slice('__sw_desktop__'.length));
  if (!parsedState?.callbackUrl) return null;
  try {
    const dest = new URL(parsedState.callbackUrl);
    const isLoopback = dest.hostname === '127.0.0.1' || dest.hostname === 'localhost';
    if (dest.protocol === 'http:' && isLoopback && dest.pathname === '/oauth-callback') {
      return dest;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function GoogleOAuthHandler() {
  const { t } = useLanguage();
  const toast = useToast();
  const [nativeRedirectUrl, setNativeRedirectUrl] = useState('');
  const [googleProcessing, setGoogleProcessing] = useState(() => {
    return Boolean(
      typeof window !== 'undefined' &&
        window.location.hash &&
        (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))
    );
  });

  const completeGoogleLogin = useCallback(
    async ({ accessToken, idToken, isNativeDeepLink = false }) => {
      setGoogleProcessing(true);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, credential: idToken }),
        });
        const data = await res.json();
        if (data?.success && data?.user) {
          localStorage.setItem('soundwave_session', data.token);
          localStorage.setItem('soundwave_user', JSON.stringify(data.user));
          window.dispatchEvent(
            new CustomEvent('soundwave:auth-updated', {
              detail: { user: data.user, token: data.token, expiresAt: data.expiresAt },
            })
          );

          if (isNativeDeepLink) {
            setGoogleProcessing(false);
            toast.success(
              t(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${data.user.username}`, `Signed in as ${data.user.username}`)
            );
            return;
          }

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
          const msg =
            data?.message || t('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่', 'Google Sign-In failed. Please try again.');
          toast.error(msg);
          if (isNativeDeepLink) {
            window.dispatchEvent(new CustomEvent('soundwave:auth-error', { detail: { message: msg } }));
          }
          setGoogleProcessing(false);
        }
      } catch (err) {
        console.error('Google OAuth callback failed:', err);
        const msg = t('เชื่อมต่อเซิร์ฟเวอร์สำหรับ Google Login ไม่สำเร็จ', 'Could not complete Google Sign-In');
        toast.error(msg);
        if (isNativeDeepLink) {
          window.dispatchEvent(new CustomEvent('soundwave:auth-error', { detail: { message: msg } }));
        }
        setGoogleProcessing(false);
      }
    },
    [t, toast]
  );

  // Handle web / OAuth relay callbacks (normal browser, Electron relay, Capacitor relay)
  useEffect(() => {
    const hashRaw = (window.location.hash || '').replace(/^#/, '');
    const hashParams = new URLSearchParams(hashRaw);
    const searchParams = new URLSearchParams(window.location.search || '');
    const oauthError = hashParams.get('error') || searchParams.get('error');
    const oauthErrorDesc = hashParams.get('error_description') || searchParams.get('error_description') || '';
    const oauthState = hashParams.get('state') || searchParams.get('state') || '';
    const accessToken = hashParams.get('access_token') || '';
    const idToken = hashParams.get('id_token') || '';

    // 1. Electron Desktop OAuth relay -> forward tokens back to local loopback callback
    const desktopDest = getValidatedDesktopCallback(oauthState);
    if (desktopDest && (accessToken || idToken || oauthError)) {
      if (accessToken) desktopDest.searchParams.set('access_token', accessToken);
      if (idToken) desktopDest.searchParams.set('id_token', idToken);
      if (oauthError) desktopDest.searchParams.set('error', oauthError);
      if (oauthErrorDesc) desktopDest.searchParams.set('error_description', oauthErrorDesc);
      desktopDest.searchParams.set('state', oauthState);
      window.history.replaceState(null, '', window.location.pathname);
      setGoogleProcessing(true);
      window.location.replace(desktopDest.toString());
      return;
    }

    // 2. Capacitor Native OAuth relay -> forward tokens back to soundwavepass://auth
    if (oauthState.startsWith('__sw_cap__') && (accessToken || idToken || oauthError)) {
      const forwardParams = new URLSearchParams();
      if (accessToken) forwardParams.set('access_token', accessToken);
      if (idToken) forwardParams.set('id_token', idToken);
      if (oauthError) forwardParams.set('error', oauthError);
      if (oauthErrorDesc) forwardParams.set('error_description', oauthErrorDesc);
      forwardParams.set('state', oauthState);

      const appUrl = `soundwavepass://auth#${forwardParams.toString()}`;
      window.history.replaceState(null, '', window.location.pathname);
      setGoogleProcessing(false);
      setNativeRedirectUrl(appUrl);
      window.location.href = appUrl;
      return;
    }

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

    if (!accessToken && !idToken) return;

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    completeGoogleLogin({ accessToken, idToken, isNativeDeepLink: false });
  }, [completeGoogleLogin, t, toast]);

  // Handle Capacitor Deep Link return (soundwavepass://auth#...)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Capacitor?.isNativePlatform?.()) return;

    let active = true;
    const handleNativeCallbackUrl = async (url) => {
      if (!active || !url || !url.startsWith('soundwavepass://auth')) return;
      Browser.close().catch(() => {});

      let hashParams = new URLSearchParams();
      let searchParams = new URLSearchParams();
      try {
        const parsed = new URL(url);
        hashParams = new URLSearchParams((parsed.hash || '').replace(/^#/, ''));
        searchParams = parsed.searchParams;
      } catch {
        const [, queryOrHash = ''] = url.split('#');
        hashParams = new URLSearchParams(queryOrHash);
      }

      const err = hashParams.get('error') || searchParams.get('error');
      const errDesc = hashParams.get('error_description') || searchParams.get('error_description');
      if (err) {
        const message =
          err === 'access_denied'
            ? ''
            : errDesc || t(`เข้าสู่ระบบด้วย Google ไม่สำเร็จ (${err})`, `Google Sign-In failed (${err})`);
        if (message) toast.error(message);
        window.dispatchEvent(new CustomEvent('soundwave:auth-error', { detail: { message } }));
        return;
      }

      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || '';
      const idToken = hashParams.get('id_token') || searchParams.get('id_token') || '';
      if (!accessToken && !idToken) return;

      await completeGoogleLogin({ accessToken, idToken, isNativeDeepLink: true });
    };

    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      handleNativeCallbackUrl(url);
    });

    CapacitorApp.getLaunchUrl()
      .then((launch) => {
        if (launch?.url) handleNativeCallbackUrl(launch.url);
      })
      .catch(() => {});

    return () => {
      active = false;
      listenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [completeGoogleLogin, t, toast]);

  if (nativeRedirectUrl) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07070b] px-6 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#11131d] p-6 shadow-2xl">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4" />
          <p className="text-base font-semibold text-white">
            {t('เข้าสู่ระบบด้วย Google สำเร็จ', 'Google Sign-In Complete')}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            {t(
              'กำลังพากลับเข้าแอป SoundWave Pass หากยังไม่เด้งกลับให้กดปุ่มด้านล่าง',
              'Returning to SoundWave Pass app. Tap below if it does not open automatically.'
            )}
          </p>
          <a
            href={nativeRedirectUrl}
            className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#07070b] hover:bg-cyan-300 transition"
          >
            {t('กลับเข้าแอป SoundWave Pass', 'Open SoundWave Pass App')}
          </a>
        </div>
      </div>
    );
  }

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
