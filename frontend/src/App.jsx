import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';

// Booking Flow Pages (Time)
import HomePage from './pages/booking/HomePage';
import ZoneSelectPage from './pages/booking/ZoneSelectPage';
import PaymentPage from './pages/booking/PaymentPage';

// Tickets Experience Pages (May)
import MyTicketPage from './pages/tickets/MyTicketPage';
import SouvenirPrintPage from './pages/tickets/SouvenirPrintPage';

// Gate Staff Scanner Page (Nam)
import GateScannerPage from './pages/scanner/GateScannerPage';
import AdminPage from './pages/admin/AdminPage';
import AdminInsightPage from './pages/admin/AdminInsightPage';
import ConcertDetailPage from './pages/booking/ConcertDetailPage';
import TeamPortalPage from './pages/TeamPortalPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col bg-[#07070b] text-gray-100 selection:bg-[#00f0ff] selection:text-black">
          {/* Navigation Bar */}
          <Navbar />

          {/* Dynamic Pages */}
          <main className="flex-1">
            <Routes>
              {/* Booking Flow (ทาม) */}
              <Route path="/" element={<HomePage />} />
              <Route path="/concerts/:id" element={<ConcertDetailPage />} />
              <Route path="/booking/zone-select" element={<ZoneSelectPage />} />
              <Route path="/booking/payment/:bookingCode" element={<PaymentPage />} />

              {/* Ticket & Printing (เมย์) */}
              <Route path="/tickets/:ticketCode" element={<MyTicketPage />} />
              <Route path="/tickets/:ticketCode/print" element={<SouvenirPrintPage />} />

              {/* Gate Scanner (น้ำ) */}
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
      </LanguageProvider>
    </BrowserRouter>
  );
}
