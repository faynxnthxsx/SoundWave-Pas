import React from 'react';
import { Heart, Disc } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#1e1e2d] bg-[#09090f] text-gray-400 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Disc className="w-5 h-5 text-[#00f0ff] animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-white font-bold tracking-wide">SoundWave Pass</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ระบบจองตั๋วคอนเสิร์ตและเทศกาลดนตรีแบบครบวงจร พร้อมระบบพิมพ์บัตร A4 & LINE Flex Message
          </p>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            พัฒนาโดย <span className="text-[#00f0ff] font-semibold">Team Alpha</span> (เฟย์, ทาม, เมย์, น้ำ)
          </p>
          <p className="mt-0.5">ประกาศนียบัตรวิชาชีพชั้นปีที่ 2 (ปวช. 2) © 2026 SoundWave Pass</p>
        </div>
      </div>
    </footer>
  );
}
