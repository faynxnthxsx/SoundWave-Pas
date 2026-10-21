import React from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

export default function ConcertDateTimePicker({ value, onChange }) {
  const day = value?.slice(0, 10) || '';
  const time = value?.slice(11, 16) || '';
  const formatted = day
    ? new Date(`${day}T${time || '00:00'}`).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'เลือกวันที่จัดงาน';
  const updateDay = (nextDay) => onChange(`${nextDay}T${time || '18:00'}`);
  const updateTime = (nextTime) => onChange(`${day}T${nextTime}`);

  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111c27] via-[#10121c] to-[#191426] shadow-lg shadow-black/20">
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200">Event schedule</p><p className="mt-1 text-sm font-bold text-white">{formatted}</p></div><span className="rounded-full border border-cyan-200/15 bg-cyan-200/[.06] px-3 py-1.5 text-[9px] font-bold tracking-wider text-cyan-100">THAILAND · ICT</span></div>
    <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
      <label className="group rounded-xl border border-white/10 bg-black/20 p-3 transition focus-within:border-cyan-200/40 focus-within:bg-cyan-200/[.04]"><span className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-gray-400"><CalendarDays size={14} className="text-cyan-200"/>วันที่จัดงาน</span><input required type="date" value={day} onChange={(event) => updateDay(event.target.value)} className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2.5 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-cyan-200/40" /></label>
      <label className="group rounded-xl border border-white/10 bg-black/20 p-3 transition focus-within:border-violet-200/40 focus-within:bg-violet-200/[.04]"><span className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-gray-400"><Clock3 size={14} className="text-violet-200"/>เวลาเริ่มแสดง</span><input required type="time" value={time || '18:00'} onChange={(event) => updateTime(event.target.value)} className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2.5 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-violet-200/40" /></label>
    </div>
    <p className="px-4 pb-3 text-[10px] text-gray-500 sm:px-5">กดช่องวันที่เพื่อเปิดปฏิทิน และเลือกเวลาเริ่มงานจากตัวเลือกของเครื่อง</p>
  </div>;
}
