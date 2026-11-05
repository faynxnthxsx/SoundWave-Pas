import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

// Eager load all pages for instant 0ms page transitions
import HomePage from './pages/booking/HomePage';
import ZoneSelectPage from './pages/booking/ZoneSelectPage';
import PaymentPage from './pages/booking/PaymentPage';
import ConcertDetailPage from './pages/booking/ConcertDetailPage';
import MyTicketPage from './pages/tickets/MyTicketPage';
import SouvenirPrintPage from './pages/tickets/SouvenirPrintPage';
import GateScannerPage from './pages/scanner/GateScannerPage';
import AdminPage from './pages/admin/AdminPage';
import AdminInsightPage from './pages/admin/AdminInsightPage';
import TeamPortalPage from './pages/TeamPortalPage';

export default function App() {
  const [googleProcessing, setGoogleProcessing] = useState(() => {
    return Boolean(
      typeof window !== 'undefined' &&
        window.location.hash &&
        (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))
    );
  });

  // Listen for Google OAuth standard redirect callback in URL hash
  useEffect(() => {
    if (
      window.location.hash &&
      (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))
    ) {
      setGoogleProcessing(true);
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');

      // Clear the hash from address bar immediately
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (accessToken || idToken) {
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
                if (savedRoute && savedRoute !== window.location.pathname) {
                  sessionStorage.removeItem('sw_google_auth_state');
                  window.location.href = savedRoute;
                  return;
                }
              } catch {}
              window.location.reload();
            } else {
              setGoogleProcessing(false);
            }
          })
          .catch((err) => {
            console.error('Google OAuth callback failed:', err);
            setGoogleProcessing(false);
          });
      } else {
        setGoogleProcessing(false);
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <div className="theme-app-container min-h-screen flex flex-col bg-[#07070b] text-gray-100 selection:bg-[#00f0ff] selection:text-black overflow-x-hidden w-full max-w-full">
              {/* Google Login Overlay (Dark themed, prevents white screen) */}
              {googleProcessing && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07070b]/95 backdrop-blur-md">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4" />
                  <p className="text-sm font-semibold text-white">กำลังเข้าสู่ระบบด้วย Google…</p>
                  <p className="text-xs text-gray-400 mt-1">กรุณารอสักครู่ ระบบกำลังนำท่านเข้าใช้งาน</p>
                </div>
              )}

              {/* Navigation Bar */}
              <Navbar />

              {/* Main App Content - Instant Navigation */}
              <main className="flex-1 w-full max-w-full overflow-x-hidden pb-16 md:pb-0">
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
