import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';

// Eager load critical home and booking page
import HomePage from './pages/booking/HomePage';
import ZoneSelectPage from './pages/booking/ZoneSelectPage';

// Lazy load secondary pages for blazing fast mobile performance
const PaymentPage = lazy(() => import('./pages/booking/PaymentPage'));
const ConcertDetailPage = lazy(() => import('./pages/booking/ConcertDetailPage'));
const MyTicketPage = lazy(() => import('./pages/tickets/MyTicketPage'));
const SouvenirPrintPage = lazy(() => import('./pages/tickets/SouvenirPrintPage'));
const GateScannerPage = lazy(() => import('./pages/scanner/GateScannerPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminInsightPage = lazy(() => import('./pages/admin/AdminInsightPage'));
const TeamPortalPage = lazy(() => import('./pages/TeamPortalPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
    </div>
  );
}

export default function App() {
  // Listen for Google OAuth standard redirect callback in URL hash
  useEffect(() => {
    if (
      window.location.hash &&
      (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))
    ) {
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
            }
          })
          .catch((err) => console.error('Google OAuth callback failed:', err));
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-[#07070b] text-gray-100 selection:bg-[#00f0ff] selection:text-black overflow-x-hidden w-full max-w-full">
            {/* Navigation Bar */}
            <Navbar />

            {/* Dynamic Pages with Code Splitting */}
            <main className="flex-1 w-full max-w-full overflow-x-hidden">
              <Suspense fallback={<PageLoader />}>
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
      </LanguageProvider>
    </BrowserRouter>
  );
}
