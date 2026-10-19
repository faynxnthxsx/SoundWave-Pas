import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, QrCode, Music, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a10]/90 backdrop-blur-md border-b border-[#222235] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#ff007f] p-[2px] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#0d0d16] rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-[#00f0ff] group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-wider text-white">
              SOUND<span className="text-[#00f0ff]">WAVE</span>
              <span className="text-[#ff007f] text-xs ml-1.5 uppercase px-1.5 py-0.5 rounded bg-[#ff007f]/20 border border-[#ff007f]/40">Pass</span>
            </span>
            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Music Festival Pass</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isActive('/') 
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            หน้าแรก & คอนเสิร์ต
          </Link>

          <Link
            to="/tickets/SWP-VIP-889901"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              location.pathname.startsWith('/tickets')
                ? 'bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/40 shadow-[0_0_12px_rgba(255,0,127,0.2)]'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">ตัวอย่างตั๋ว</span>
          </Link>

          <Link
            to="/scanner"
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/scanner')
                ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/50 shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                : 'bg-[#181824] text-gray-200 border border-[#2e2e44] hover:border-[#39ff14]/40 hover:text-[#39ff14]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>สแกนหน้างาน</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
