import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const EN_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const THAI_DAYS_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const EN_DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CLEAN_TIME_PRESETS = [
  { time: '16:00', label: '16:00', desc: 'เปิดประตู', descEn: 'Gates Open' },
  { time: '18:00', label: '18:00', desc: 'เริ่มงาน', descEn: 'Show Starts' },
  { time: '19:30', label: '19:30', desc: 'วงหลัก', descEn: 'Main Act' },
  { time: '21:00', label: '21:00', desc: 'เฮดไลเนอร์', descEn: 'Headliner' },
];

const CLEAN_MINUTES = [0, 15, 30, 45];

const pad2 = (n) => String(n).padStart(2, '0');
const formatDateStr = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export default function ConcertDateTimePicker({ value, onChange }) {
  const { lang, t } = useLanguage();
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
    if (lang === 'en') {
      const dayName = EN_DAYS_FULL[dateObj.getDay()] || '';
      const monthName = EN_MONTHS[m - 1] || '';
      return {
        fullDateText: `${dayName}, ${d} ${monthName} ${y}`,
        timeText: `${selectedTimeStr}`,
      };
    }
    const dayName = THAI_DAYS_FULL[dateObj.getDay()] || '';
    const monthName = THAI_MONTHS[m - 1] || '';
    const buddhistYear = y + 543;

    return {
      fullDateText: `${dayName}ที่ ${d} ${monthName} ${buddhistYear}`,
      timeText: `${selectedTimeStr} น.`,
    };
  }, [selectedDateStr, selectedTimeStr, lang]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e15] shadow-xl">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-cyan-300" />
          <span className="text-xs font-bold text-white">
            {formattedSummary
              ? `${formattedSummary.fullDateText} · ${formattedSummary.timeText}`
              : t('เลือกวันและเวลาแสดง', 'Select Show Date & Time')}
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
            <span>{t('วันที่', 'Date')}</span>
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
            <span>{t(`เวลา (${selectedTimeStr})`, `Time (${selectedTimeStr})`)}</span>
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
                {t('วันนี้', 'Today')}
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate(1)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-cyan-300 hover:text-white"
              >
                {t('พรุ่งนี้', 'Tomorrow')}
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate(7)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-cyan-300 hover:text-white"
              >
                {t('+7 วัน', '+7 Days')}
              </button>
            </div>
            <button
              type="button"
              onClick={resetToToday}
              className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={11} /> {t('รีเซ็ต', 'Reset')}
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
              {lang === 'en' ? `${EN_MONTHS[viewMonth]} ${viewYear}` : `${THAI_MONTHS[viewMonth]} ${viewYear + 543}`}
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
            {(lang === 'en' ? EN_DAYS_SHORT : THAI_DAYS_SHORT).map((d, i) => (
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
              {selectedDateStr || t('คลิกเลือกวันที่', 'Click to pick a date')}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('time')}
              className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1"
            >
              <span>{t('ตั้งเวลาต่อ →', 'Set Time →')}</span>
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
                <span className="block text-[9px] text-gray-400 font-semibold uppercase">{t('ชั่วโมง', 'Hour')}</span>
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
                <span className="block text-[9px] text-gray-400 font-semibold uppercase">{t('นาที', 'Minute')}</span>
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
              {t('เวลากิจกรรมยอดนิยม:', 'Popular Showtimes:')}
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
                    <span className="block text-[10px] text-gray-400 mt-0.5">{lang === 'en' ? p.descEn : p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Minute Chips */}
          <div className="mb-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              {t('เลือกนาที:', 'Select Minute:')}
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
              {t('← ย้อนกลับไปวันที่', '← Back to Calendar')}
            </button>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <Check size={14} /> {t('บันทึกเวลาแล้ว', 'Time Saved')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
