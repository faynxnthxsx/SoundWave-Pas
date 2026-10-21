import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  Check,
  RotateCcw
} from 'lucide-react';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_DAYS_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

const CLEAN_TIME_PRESETS = [
  { time: '16:00', label: '16:00', desc: 'เปิดประตู' },
  { time: '18:00', label: '18:00', desc: 'เริ่มงาน' },
  { time: '19:30', label: '19:30', desc: 'วงหลัก' },
  { time: '21:00', label: '21:00', desc: 'เฮดไลเนอร์' },
];

const POPULAR_HOURS = [15, 16, 17, 18, 19, 20, 21, 22, 23];
const CLEAN_MINUTES = [0, 15, 30, 45];

const pad2 = (n) => String(n).padStart(2, '0');
const formatDateStr = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export default function ConcertDateTimePicker({ value, onChange }) {
  // Parse incoming value: 'YYYY-MM-DDTHH:mm'
  const parsed = useMemo(() => {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split('T');
    const dStr = parts[0];
    const tStr = parts[1] || '18:00';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return null;

    const [y, m, d] = dStr.split('-').map(Number);
    const [hh, mm] = tStr.split(':').map(Number);

    return {
      dateStr: dStr,
      timeStr: tStr,
      year: y,
      month: m - 1,
      day: d,
      hour: Number.isFinite(hh) ? hh : 18,
      minute: Number.isFinite(mm) ? mm : 0,
    };
  }, [value]);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateStr(today), [today]);

  const [viewYear, setViewYear] = useState(() => parsed?.year || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.month ?? today.getMonth());
  const [activeTab, setActiveTab] = useState('date'); // 'date' | 'time'

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [parsed?.dateStr]);

  const selectedDateStr = parsed?.dateStr || '';
  const selectedHour = parsed?.hour ?? 18;
  const selectedMinute = parsed?.minute ?? 0;
  const selectedTimeStr = `${pad2(selectedHour)}:${pad2(selectedMinute)}`;

  const emitDateTime = (nextDateStr, nextHour, nextMinute) => {
    const d = nextDateStr || todayStr;
    const h = pad2(nextHour ?? selectedHour);
    const m = pad2(nextMinute ?? selectedMinute);
    onChange(`${d}T${h}:${m}`);
  };

  const handleDaySelect = (dayDateStr) => {
    emitDateTime(dayDateStr, selectedHour, selectedMinute);
  };

  const handleTimeSelect = (hour, minute) => {
    emitDateTime(selectedDateStr || todayStr, hour, minute);
  };

  const handlePresetDate = (daysToAdd) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    const dateStr = formatDateStr(target);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    emitDateTime(dateStr, selectedHour, selectedMinute);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const resetToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    emitDateTime(todayStr, selectedHour, selectedMinute);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        day: dayNum,
        dateStr: `${prevY}-${pad2(prevM + 1)}-${pad2(dayNum)}`,
        isCurrentMonth: false,
        year: prevY,
        month: prevM,
      });
    }

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        dateStr: `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`,
        isCurrentMonth: true,
        year: viewYear,
        month: viewMonth,
      });
    }

    const totalFilled = days.length;
    const targetCells = totalFilled <= 35 ? 35 : 42;
    const remaining = targetCells - totalFilled;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        day: d,
        dateStr: `${nextY}-${pad2(nextM + 1)}-${pad2(d)}`,
        isCurrentMonth: false,
        year: nextY,
        month: nextM,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const formattedSummary = useMemo(() => {
    if (!selectedDateStr) return null;
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = THAI_DAYS_FULL[dateObj.getDay()] || '';
    const monthName = THAI_MONTHS[m - 1] || '';
    const buddhistYear = y + 543;

    return {
      fullDateText: `${dayName}ที่ ${d} ${monthName} ${buddhistYear}`,
      timeText: `${selectedTimeStr} น.`,
    };
  }, [selectedDateStr, selectedTimeStr]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e15] shadow-xl">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-cyan-300" />
          <span className="text-xs font-bold text-white">
            {formattedSummary ? `${formattedSummary.fullDateText} · ${selectedTimeStr} น.` : 'เลือกวันและเวลาแสดง'}
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('date')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'date'
                ? 'bg-cyan-300 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CalendarDays size={13} />
            <span>วันที่</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'time'
                ? 'bg-purple-400 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>เวลา ({selectedTimeStr})</span>
          </button>
        </div>
      </div>

      {/* ── Date Tab ── */}
      {activeTab === 'date' && (
        <div className="p-4">
          {/* Quick Presets */}
          <div className="mb-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePresetDate(0)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-cyan-300 hover:text-white"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate(1)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-cyan-300 hover:text-white"
              >
                พรุ่งนี้
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate(7)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-cyan-300 hover:text-white"
              >
                +7 วัน
              </button>
            </div>
            <button
              type="button"
              onClick={resetToToday}
              className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={11} /> รีเซ็ต
            </button>
          </div>

          {/* Month Navigation */}
          <div className="mb-3 flex items-center justify-between rounded-xl bg-black/30 px-3 py-1.5 border border-white/5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-gray-400 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-white">
              {THAI_MONTHS[viewMonth]} {viewYear + 543}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-gray-400 hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {THAI_DAYS_SHORT.map((d, i) => (
              <span
                key={d}
                className={`text-[10px] font-bold ${
                  i === 0 ? 'text-rose-400' : i === 6 ? 'text-purple-400' : 'text-gray-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateStr === selectedDateStr;
              const isToday = item.dateStr === todayStr;

              return (
                <button
                  key={`${item.dateStr}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (!item.isCurrentMonth) {
                      setViewMonth(item.month);
                      setViewYear(item.year);
                    }
                    handleDaySelect(item.dateStr);
                  }}
                  className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                      : item.isCurrentMonth
                      ? isToday
                        ? 'border border-cyan-400/40 text-cyan-300 bg-cyan-400/10'
                        : 'text-gray-200 hover:bg-white/10'
                      : 'text-gray-600 hover:bg-white/5'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
            <span className="text-[11px] text-gray-400">
              {selectedDateStr || 'คลิกเลือกวันที่'}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('time')}
              className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1"
            >
              <span>ตั้งเวลาต่อ →</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Time Tab: Ultra Clean & Minimal ── */}
      {activeTab === 'time' && (
        <div className="p-4 sm:p-5">
          {/* Minimal Digital Display with Steppers */}
          <div className="flex items-center justify-center gap-4 py-4 rounded-xl bg-black/30 border border-white/5 mb-4">
            {/* Hour Block */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTimeSelect((selectedHour + 23) % 24, selectedMinute)}
                className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white flex items-center justify-center font-bold"
              >
                -
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-center min-w-[56px]">
                <span className="font-mono text-3xl font-black text-cyan-300">
                  {pad2(selectedHour)}
                </span>
                <span className="block text-[9px] text-gray-400 font-semibold uppercase">ชั่วโมง</span>
              </div>
              <button
                type="button"
                onClick={() => handleTimeSelect((selectedHour + 1) % 24, selectedMinute)}
                className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>

            <span className="font-mono text-3xl font-bold text-gray-600">:</span>

            {/* Minute Block */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTimeSelect(selectedHour, (selectedMinute + 45) % 60)}
                className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white flex items-center justify-center font-bold"
              >
                -
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-purple-400/15 border border-purple-400/30 text-center min-w-[56px]">
                <span className="font-mono text-3xl font-black text-purple-300">
                  {pad2(selectedMinute)}
                </span>
                <span className="block text-[9px] text-gray-400 font-semibold uppercase">นาที</span>
              </div>
              <button
                type="button"
                onClick={() => handleTimeSelect(selectedHour, (selectedMinute + 15) % 60)}
                className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Clean Presets */}
          <div className="mb-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              เวลากิจกรรมยอดนิยม:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLEAN_TIME_PRESETS.map((p) => {
                const isActive = selectedTimeStr === p.time;
                return (
                  <button
                    key={p.time}
                    type="button"
                    onClick={() => {
                      const [h, m] = p.time.split(':').map(Number);
                      handleTimeSelect(h, m);
                    }}
                    className={`rounded-xl border p-2 text-center transition-all ${
                      isActive
                        ? 'border-purple-400 bg-purple-500/20 text-white font-bold ring-1 ring-purple-300'
                        : 'border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="block font-mono text-xs font-black">{p.label}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Minute Chips */}
          <div className="mb-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              เลือกนาที:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {CLEAN_MINUTES.map((m) => {
                const isActive = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour, m)}
                    className={`rounded-xl border py-2 text-center font-mono text-xs font-bold transition-all ${
                      isActive
                        ? 'border-cyan-300 bg-cyan-300 text-black shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    :{pad2(m)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className="text-xs font-bold text-gray-400 hover:text-white"
            >
              ← ย้อนกลับไปวันที่
            </button>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <Check size={14} /> บันทึกเวลาแล้ว
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
