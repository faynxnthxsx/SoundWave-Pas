import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChartNoAxesColumnIncreasing, QrCode, ShieldCheck } from 'lucide-react';

export default function TeamPortalPage() {
  return (
    <main className="flex min-h-[78vh] items-center justify-center bg-[#080a10] px-4 py-12 text-white">
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100"><ShieldCheck size={26} /></div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200">SoundWave Pass · Team Access</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">พื้นที่สำหรับทีมงาน</h1><p className="mt-2 text-sm text-gray-400">เลือกหน้าระบบตามหน้าที่ของคุณ</p></header>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/admin" className="group rounded-[26px] border border-white/10 bg-gradient-to-br from-[#141a25] to-[#101018] p-6 transition hover:-translate-y-1 hover:border-cyan-200/40 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-200/10 text-cyan-100"><ChartNoAxesColumnIncreasing size={23} /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Organizer</p><h2 className="mt-1 text-2xl font-black">เจ้าของงาน</h2><p className="mt-2 text-xs leading-6 text-gray-400">จัดการคอนเสิร์ต โปสเตอร์ รายชื่อศิลปิน โซนบัตร และดูยอดขาย</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-white">ไปหน้าแดชบอร์ด<ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></Link>
          <Link to="/scanner" className="group rounded-[26px] border border-white/10 bg-gradient-to-br from-[#141a20] to-[#101018] p-6 transition hover:-translate-y-1 hover:border-emerald-200/40 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-200/10 text-emerald-100"><QrCode size={23} /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Gate Staff</p><h2 className="mt-1 text-2xl font-black">พนักงานหน้างาน</h2><p className="mt-2 text-xs leading-6 text-gray-400">เข้าสู่ระบบตรวจสอบ QR และเช็กอินผู้เข้าร่วมงาน</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-white">ไปหน้าเครื่องสแกน<ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></Link>
        </div>
        <div className="mt-6 text-center"><Link to="/" className="text-xs text-gray-500 hover:text-gray-300">กลับเว็บไซต์ SoundWave Pass</Link></div>
      </div>
    </main>
  );
}
