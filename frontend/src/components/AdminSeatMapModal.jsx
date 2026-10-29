import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Lock,
  Unlock,
  Armchair,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Ticket as TicketIcon,
  Search,
  Filter,
  Layers,
  ChevronRight,
  RotateCcw,
  Sparkles,
  LoaderCircle,
  HelpCircle
} from 'lucide-react';
import { useToast } from './Toast';

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS_LEFT = [1, 2, 3, 4, 5, 6];
const COLS_RIGHT = [7, 8, 9, 10, 11, 12];
const ALL_COLS = [...COLS_LEFT, ...COLS_RIGHT];

export default function AdminSeatMapModal({
  zone,
  tickets = [],
  activePending = [],
  onClose,
  api,
  onRefresh,
}) {
  const toast = useToast();
  const isSeatedCategory = zone?.category === 'SEATED';
  const [viewMode, setViewMode] = useState(isSeatedCategory ? 'visual' : 'table'); // 'visual' | 'table'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'SOLD' | 'PENDING' | 'RESERVED'
  const [seatQuery, setSeatQuery] = useState('');
  const [selectedSeatDetail, setSelectedSeatDetail] = useState(null); // seat object clicked
  const [actionLoading, setActionLoading] = useState(false);
  const [quickReserveName, setQuickReserveName] = useState('Admin Reserved');

  // Capacity & Price edit states
  const [capacityInput, setCapacityInput] = useState(String(zone?.totalCapacity || ''));
  const [priceInput, setPriceInput] = useState(String(zone?.price ?? ''));
  const [savingCapacity, setSavingCapacity] = useState(false);

  // Determine grid rows based on zone capacity (minimum 5 rows A-E, 12 seats each = 60 seats)
  const rows = useMemo(() => {
    const totalCap = zone?.totalCapacity || 60;
    const neededRows = Math.max(5, Math.ceil(totalCap / 12));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const result = [];
    for (let i = 0; i < Math.min(neededRows, alphabet.length); i++) {
      result.push(alphabet[i]);
    }
    return result;
  }, [zone?.totalCapacity]);

  // Build a fast lookup map for all seats in this zone
  const seatMap = useMemo(() => {
    const map = new Map();

    // 1. Valid, Used or Reserved Tickets
    tickets.forEach((ticket) => {
      if (ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') return;
      if (ticket.seatNumber) {
        const cleanCode = ticket.seatNumber.trim().toUpperCase();
        map.set(cleanCode, {
          seatCode: cleanCode,
          status: ticket.status === 'RESERVED' ? 'RESERVED' : 'SOLD', // 'SOLD' covers VALID and USED
          ticket,
          attendeeName: ticket.attendeeName,
          booking: ticket.booking,
          type: 'ticket',
        });
      }
    });

    // 2. Pending Bookings (Held temporarily)
    activePending.forEach((booking) => {
      if (booking.selectedSeats) {
        try {
          const parsed = JSON.parse(booking.selectedSeats);
          if (Array.isArray(parsed)) {
            parsed.forEach((seat) => {
              const cleanCode = String(seat).trim().toUpperCase();
              if (!map.has(cleanCode)) {
                map.set(cleanCode, {
                  seatCode: cleanCode,
                  status: 'PENDING',
                  booking,
                  attendeeName: booking.customerName,
                  type: 'pending',
                });
              }
            });
          }
        } catch {}
      }
    });

    return map;
  }, [tickets, activePending]);

  // Stats calculation
  const stats = useMemo(() => {
    let soldCount = 0;
    let pendingCount = 0;
    let reservedCount = 0;

    seatMap.forEach((info) => {
      if (info.status === 'SOLD') soldCount++;
      else if (info.status === 'PENDING') pendingCount++;
      else if (info.status === 'RESERVED') reservedCount++;
    });

    const totalSeatsInGrid = rows.length * ALL_COLS.length;
    const availableCount = Math.max(0, (zone?.available ?? (zone?.totalCapacity - soldCount - reservedCount)));

    return {
      total: zone?.totalCapacity || totalSeatsInGrid,
      available: availableCount,
      sold: soldCount,
      pending: pendingCount,
      reserved: reservedCount,
    };
  }, [seatMap, rows.length, zone]);

  // Helper: Format seat number as "A-01"
  const formatSeatCode = (row, col) => `${row}-${String(col).padStart(2, '0')}`;

  // ── Handle Single Seat Click (Open Detail & Action Drawer) ───────────────
  const handleSeatClick = (seatCode) => {
    const seatInfo = seatMap.get(seatCode);

    if (!seatInfo) {
      // 🟢 AVAILABLE -> Show Detail Drawer to Lock / Reserve with custom name
      setSelectedSeatDetail({
        seatCode,
        status: 'AVAILABLE',
      });
    } else {
      // 🟧 RESERVED, 🟪 SOLD or 🟡 PENDING -> Show Detail Drawer with full info & actions
      setSelectedSeatDetail(seatInfo);
    }
  };

  // Reserve a single seat
  const reserveSingleSeat = async (seatCode) => {
    setActionLoading(true);
    try {
      await api(`/zones/${zone.id}/seats/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber: seatCode,
          attendeeName: quickReserveName.trim() || 'Admin Reserved',
        }),
      });
      toast.success(`ล็อกสำรองที่นั่ง ${seatCode} สำเร็จแล้ว`);
      await onRefresh();
    } catch (err) {
      toast.error(err.message || 'ไม่สามารถล็อกที่นั่งได้');
    } finally {
      setActionLoading(false);
    }
  };

  // Release a single reserved seat
  const releaseSingleSeat = async (seatInfo) => {
    if (!seatInfo.ticket?.id) {
      toast.error('ไม่พบข้อมูลตั๋วสำรอง');
      return;
    }
    setActionLoading(true);
    try {
      await api(`/tickets/${seatInfo.ticket.id}/release-reservation`, {
        method: 'POST',
      });
      toast.success(`ปลดล็อกที่นั่ง ${seatInfo.seatCode} คืนโควตาเรียบร้อย`);
      if (selectedSeatDetail?.seatCode === seatInfo.seatCode) {
        setSelectedSeatDetail(null);
      }
      await onRefresh();
    } catch (err) {
      toast.error(err.message || 'ปลดล็อกที่นั่งไม่สำเร็จ');
    } finally {
      setActionLoading(false);
    }
  };

  // Refund / Cancel valid ticket
  const handleRefundTicket = async (ticketId, seatCode) => {
    if (!window.confirm(`ยืนยันการยกเลิกตั๋วที่นั่ง ${seatCode} และคืนโควตาบัตร?`)) return;
    setActionLoading(true);
    try {
      await api(`/tickets/${ticketId}/refund`, { method: 'POST' });
      toast.success(`ยกเลิกตั๋วที่นั่ง ${seatCode} และคืนโควตาสำเร็จ`);
      setSelectedSeatDetail(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.message || 'คืนเงิน/ยกเลิกตั๋วไม่สำเร็จ');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Batch Row Lock ────────────────────────────────────────────────────────
  const handleBatchRowLock = async (rowLetter) => {
    const rowSeats = ALL_COLS.map((col) => formatSeatCode(rowLetter, col));
    const availableSeatsInRow = rowSeats.filter((code) => !seatMap.has(code));

    if (availableSeatsInRow.length === 0) {
      toast.info(`ที่นั่งในแถว ${rowLetter} ถูกใช้งานหรือล็อกเต็มแล้ว`);
      return;
    }

    setActionLoading(true);
    try {
      await api(`/zones/${zone.id}/seats/batch-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumbers: availableSeatsInRow,
          attendeeName: quickReserveName.trim() || 'Admin Reserved',
        }),
      });
      toast.success(`ล็อกสำรองที่นั่งแถว ${rowLetter} ทั้งหมด ${availableSeatsInRow.length} ที่นั่งสำเร็จ`);
      await onRefresh();
    } catch (err) {
      toast.error(err.message || `ไม่สามารถล็อกแถว ${rowLetter} ได้`);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Batch Row Release ──────────────────────────────────────────────────────
  const handleBatchRowRelease = async (rowLetter) => {
    const rowSeats = ALL_COLS.map((col) => formatSeatCode(rowLetter, col));
    const reservedSeatsInRow = rowSeats.filter((code) => seatMap.get(code)?.status === 'RESERVED');

    if (reservedSeatsInRow.length === 0) {
      toast.info(`ไม่มีที่นั่งสำรองในแถว ${rowLetter}`);
      return;
    }

    setActionLoading(true);
    try {
      await api(`/zones/${zone.id}/seats/batch-release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumbers: reservedSeatsInRow }),
      });
      toast.success(`ปลดล็อกที่นั่งแถว ${rowLetter} ทั้งหมด ${reservedSeatsInRow.length} ที่นั่งเรียบร้อย`);
      await onRefresh();
    } catch (err) {
      toast.error(err.message || `ไม่สามารถปลดล็อกแถว ${rowLetter} ได้`);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Update Capacity & Price ───────────────────────────────────────────────
  const handleSaveCapacity = async () => {
    const cap = parseInt(capacityInput, 10);
    const prc = parseFloat(priceInput);
    if (isNaN(cap) || cap < 1) {
      toast.error('กรุณาระบุความจุเป็นจำนวนเต็มบวก');
      return;
    }
    if (isNaN(prc) || prc < 0) {
      toast.error('กรุณาระบุราคาที่ถูกต้อง');
      return;
    }

    setSavingCapacity(true);
    try {
      await api(`/zones/${zone.id}/capacity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalCapacity: cap, price: prc }),
      });
      toast.success('อัปเดตความจุและราคาโซนเรียบร้อยแล้ว');
      await onRefresh();
    } catch (err) {
      toast.error(err.message || 'บันทึกความจุไม่สำเร็จ');
    } finally {
      setSavingCapacity(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="zone-seat-map-title"
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0f1017] shadow-2xl"
      >
        {/* ── Modal Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Armchair size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 border border-cyan-400/30">
                  Interactive Seat Map
                </span>
                <span className="text-xs text-gray-400">{zone?.concert?.name || 'SoundWave Live'}</span>
              </div>
              <h2 id="zone-seat-map-title" className="mt-0.5 text-xl font-black text-white">
                ผังที่นั่งแอดมิน · {zone?.name}
              </h2>
            </div>
          </div>

          {/* Quick Settings & Close */}
          <div className="flex items-center gap-2">
            {/* View Switcher: Visual Map vs Table */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                  viewMode === 'visual' ? 'bg-cyan-300 text-black shadow-md' : 'text-gray-300 hover:text-white'
                }`}
              >
                ผังจำลอง (Visual Map)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                  viewMode === 'table' ? 'bg-cyan-300 text-black shadow-md' : 'text-gray-300 hover:text-white'
                }`}
              >
                ตารางรายการ ({tickets.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              title="รีเฟรชข้อมูล"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ── Status KPI Bar & Color Legend ── */}
        <div className="border-b border-white/10 bg-black/40 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Legend & Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'border-white/30 bg-white/15 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>ทั้งหมด</span>
                <span className="font-mono text-[11px] text-gray-300">({stats.total})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('AVAILABLE')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all ${
                  statusFilter === 'AVAILABLE'
                    ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>🟢 ว่าง (คลิกเพื่อล็อก)</span>
                <span className="font-mono text-[11px]">({stats.available})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('SOLD')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all ${
                  statusFilter === 'SOLD'
                    ? 'border-purple-400/50 bg-purple-400/20 text-purple-200'
                    : 'border-white/10 bg-white/5 text-purple-400/80 hover:text-purple-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                <span>🟪 ขายแล้ว</span>
                <span className="font-mono text-[11px]">({stats.sold})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all ${
                  statusFilter === 'PENDING'
                    ? 'border-amber-400/50 bg-amber-400/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span>🟡 รอจ่ายเงิน</span>
                <span className="font-mono text-[11px]">({stats.pending})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('RESERVED')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all ${
                  statusFilter === 'RESERVED'
                    ? 'border-orange-400/50 bg-orange-400/20 text-orange-200'
                    : 'border-white/10 bg-white/5 text-orange-400/80 hover:text-orange-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                <span>🟧 สำรองไว้ (คลิกเพื่อปลด)</span>
                <span className="font-mono text-[11px]">({stats.reserved})</span>
              </button>
            </div>

            {/* Quick Note */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="rounded-lg bg-cyan-400/10 px-2 py-0.5 text-cyan-300 font-bold border border-cyan-400/20">
                1-Click Action
              </span>
              <span>คลิกเก้าอี้ว่างเพื่อล็อก / คลิกสีส้มเพื่อปลดล็อกทันที</span>
            </div>
          </div>
        </div>

        {/* ── Main Content Area (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {!isSeatedCategory && (
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs text-cyan-100 flex items-start gap-3">
              <span className="text-lg">🎪</span>
              <div>
                <p className="font-bold">โซนบัตรยืน / แคมป์ปิ้ง (General Admission - {zone?.category})</p>
                <p className="mt-0.5 text-gray-300 leading-relaxed text-[11px]">
                  โซนนี้ไม่มีการระบุหมายเลขที่นั่งเฉพาะ ระบบจึงแสดงผลเป็นตารางจัดการโควตาและรายชื่อผู้ถือตั๋ว ({tickets.length} ใบ) เป็นค่าเริ่มต้น สามารถปรับเปลี่ยนความจุและราคาต่อใบได้ทันที
                </p>
              </div>
            </div>
          )}
          {/* Quick Reserve Preset Tag + Capacity Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-300">ชื่อผู้จองสำรองด่วน:</span>
              <input
                type="text"
                value={quickReserveName}
                onChange={(e) => setQuickReserveName(e.target.value)}
                placeholder="เช่น ผู้สนับสนุน, แขก VIP, ล็อกหน้างาน"
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-cyan-300"
              />
            </div>

            {/* Capacity & Price Editor */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">ความจุ:</span>
                <input
                  type="number"
                  min="1"
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(e.target.value)}
                  className="w-20 rounded-xl border border-white/15 bg-black/40 px-2.5 py-1 text-xs font-mono text-white outline-none focus:border-cyan-300"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">ราคา:</span>
                <input
                  type="number"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-24 rounded-xl border border-white/15 bg-black/40 px-2.5 py-1 text-xs font-mono text-white outline-none focus:border-cyan-300"
                />
              </div>

              <button
                type="button"
                disabled={savingCapacity}
                onClick={handleSaveCapacity}
                className="rounded-xl bg-cyan-300 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-cyan-200 disabled:opacity-50 transition-all"
              >
                {savingCapacity ? 'บันทึก…' : 'อัปเดต'}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              VIEW 1: VISUAL CINEMA / CONCERT SEAT MATRIX
          ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'visual' && (
            <div className="rounded-3xl border border-white/10 bg-[#07080d] p-5 sm:p-7 shadow-inner space-y-6">
              {/* Stage / Screen Curve */}
              <div className="relative text-center px-4">
                <div className="mx-auto h-3 w-4/5 rounded-t-full bg-gradient-to-r from-purple-500/20 via-cyan-400 to-pink-500/20 shadow-[0_0_30px_rgba(0,240,255,0.6)]" />
                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
                    🎸 MAIN STAGE / เวทีการแสดง (SCREEN VIEW) 🎬
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">ทิศทางด้านหน้าเวทีคอนเสิร์ต</p>
              </div>

              {/* Seat Matrix Rows */}
              <div className="space-y-3.5 overflow-x-auto py-3">
                {rows.map((rowLetter) => {
                  const rowSeats = ALL_COLS.map((col) => formatSeatCode(rowLetter, col));
                  const availableInRow = rowSeats.filter((c) => !seatMap.has(c)).length;
                  const reservedInRow = rowSeats.filter((c) => seatMap.get(c)?.status === 'RESERVED').length;

                  return (
                    <div
                      key={rowLetter}
                      className="flex items-center justify-center gap-2 sm:gap-3.5 min-w-[720px] group"
                    >
                      {/* Left Row Action: Batch Row Lock */}
                      <button
                        type="button"
                        disabled={actionLoading || availableInRow === 0}
                        onClick={() => handleBatchRowLock(rowLetter)}
                        title={`ล็อกทั้งแถว ${rowLetter} (${availableInRow} ที่นั่งว่าง)`}
                        className="flex items-center gap-1 rounded-lg border border-orange-400/20 bg-orange-400/10 px-2 py-1 text-[10px] font-bold text-orange-200 hover:bg-orange-400/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <Lock size={10} />
                        <span>ล็อกแถว {rowLetter}</span>
                      </button>

                      {/* Left Row Indicator */}
                      <span className="w-6 font-mono text-xs font-black text-cyan-300 text-center select-none">
                        {rowLetter}
                      </span>

                      {/* Left Seat Block (01 - 06) */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {COLS_LEFT.map((col) => {
                          const seatCode = formatSeatCode(rowLetter, col);
                          const seatInfo = seatMap.get(seatCode);
                          const status = seatInfo?.status || 'AVAILABLE';

                          // Status Filter check
                          const isDimmed = statusFilter !== 'ALL' && statusFilter !== status;

                          return (
                            <button
                              key={seatCode}
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSeatClick(seatCode)}
                              title={
                                status === 'AVAILABLE'
                                  ? `ที่นั่ง ${seatCode} (ว่าง) - คลิกเพื่อล็อกสำรอง`
                                  : status === 'RESERVED'
                                  ? `ที่นั่ง ${seatCode} (สำรองโดย: ${seatInfo.attendeeName}) - คลิกเพื่อปลดล็อก`
                                  : status === 'SOLD'
                                  ? `ที่นั่ง ${seatCode} (ขายแล้ว: ${seatInfo.attendeeName}) - คลิกดูรายละเอียด`
                                  : `ที่นั่ง ${seatCode} (รอชำระเงิน: ${seatInfo.attendeeName}) - คลิกดูรายละเอียด`
                              }
                              className={`group/seat relative flex flex-col items-center justify-center w-8 h-9 sm:w-10 sm:h-11 rounded-xl font-mono text-[11px] font-bold transition-all duration-150 select-none ${
                                isDimmed ? 'opacity-20 scale-95' : 'hover:scale-110 active:scale-95'
                              } ${
                                status === 'AVAILABLE'
                                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/30 hover:shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                                  : status === 'RESERVED'
                                  ? 'border border-orange-500/50 bg-orange-500/20 text-orange-200 hover:border-orange-400 hover:bg-orange-500/40 hover:shadow-[0_0_12px_rgba(251,146,60,0.6)]'
                                  : status === 'PENDING'
                                  ? 'border border-amber-400/50 bg-amber-400/20 text-amber-200 hover:border-amber-300 hover:bg-amber-400/40'
                                  : 'border border-purple-500/50 bg-purple-500/20 text-purple-200 hover:border-purple-400 hover:bg-purple-500/40 hover:shadow-[0_0_12px_rgba(192,132,252,0.6)]'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-5 h-1 rounded-full ${
                                  status === 'AVAILABLE'
                                    ? 'bg-emerald-400/60'
                                    : status === 'RESERVED'
                                    ? 'bg-orange-400'
                                    : status === 'PENDING'
                                    ? 'bg-amber-400'
                                    : 'bg-purple-400'
                                }`}
                              />
                              <span className="mt-1">{String(col).padStart(2, '0')}</span>
                              {status === 'RESERVED' && <Lock size={9} className="text-orange-300 -mt-0.5" />}
                              {status === 'SOLD' && <CheckCircle2 size={9} className="text-purple-300 -mt-0.5" />}
                              {status === 'PENDING' && <Clock size={9} className="text-amber-300 -mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Center Aisle Spacer */}
                      <div className="w-4 sm:w-6 flex items-center justify-center">
                        <span className="h-6 w-px bg-white/10" />
                      </div>

                      {/* Right Seat Block (07 - 12) */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {COLS_RIGHT.map((col) => {
                          const seatCode = formatSeatCode(rowLetter, col);
                          const seatInfo = seatMap.get(seatCode);
                          const status = seatInfo?.status || 'AVAILABLE';
                          const isDimmed = statusFilter !== 'ALL' && statusFilter !== status;

                          return (
                            <button
                              key={seatCode}
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSeatClick(seatCode)}
                              title={
                                status === 'AVAILABLE'
                                  ? `ที่นั่ง ${seatCode} (ว่าง) - คลิกเพื่อล็อกสำรอง`
                                  : status === 'RESERVED'
                                  ? `ที่นั่ง ${seatCode} (สำรองโดย: ${seatInfo.attendeeName}) - คลิกเพื่อปลดล็อก`
                                  : status === 'SOLD'
                                  ? `ที่นั่ง ${seatCode} (ขายแล้ว: ${seatInfo.attendeeName}) - คลิกดูรายละเอียด`
                                  : `ที่นั่ง ${seatCode} (รอชำระเงิน: ${seatInfo.attendeeName}) - คลิกดูรายละเอียด`
                              }
                              className={`group/seat relative flex flex-col items-center justify-center w-8 h-9 sm:w-10 sm:h-11 rounded-xl font-mono text-[11px] font-bold transition-all duration-150 select-none ${
                                isDimmed ? 'opacity-20 scale-95' : 'hover:scale-110 active:scale-95'
                              } ${
                                status === 'AVAILABLE'
                                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/30 hover:shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                                  : status === 'RESERVED'
                                  ? 'border border-orange-500/50 bg-orange-500/20 text-orange-200 hover:border-orange-400 hover:bg-orange-500/40 hover:shadow-[0_0_12px_rgba(251,146,60,0.6)]'
                                  : status === 'PENDING'
                                  ? 'border border-amber-400/50 bg-amber-400/20 text-amber-200 hover:border-amber-300 hover:bg-amber-400/40'
                                  : 'border border-purple-500/50 bg-purple-500/20 text-purple-200 hover:border-purple-400 hover:bg-purple-500/40 hover:shadow-[0_0_12px_rgba(192,132,252,0.6)]'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-5 h-1 rounded-full ${
                                  status === 'AVAILABLE'
                                    ? 'bg-emerald-400/60'
                                    : status === 'RESERVED'
                                    ? 'bg-orange-400'
                                    : status === 'PENDING'
                                    ? 'bg-amber-400'
                                    : 'bg-purple-400'
                                }`}
                              />
                              <span className="mt-1">{String(col).padStart(2, '0')}</span>
                              {status === 'RESERVED' && <Lock size={9} className="text-orange-300 -mt-0.5" />}
                              {status === 'SOLD' && <CheckCircle2 size={9} className="text-purple-300 -mt-0.5" />}
                              {status === 'PENDING' && <Clock size={9} className="text-amber-300 -mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Row Indicator */}
                      <span className="w-6 font-mono text-xs font-black text-cyan-300 text-center select-none">
                        {rowLetter}
                      </span>

                      {/* Right Row Action: Batch Row Release */}
                      <button
                        type="button"
                        disabled={actionLoading || reservedInRow === 0}
                        onClick={() => handleBatchRowRelease(rowLetter)}
                        title={`ปลดล็อกทั้งแถว ${rowLetter} (${reservedInRow} ที่นั่งสำรอง)`}
                        className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <Unlock size={10} />
                        <span>ปลดแถว {rowLetter}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              VIEW 2: FULL TABLE VIEW
          ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-[10px] uppercase font-bold text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">รหัสตั๋ว</th>
                    <th className="p-3">ที่นั่ง</th>
                    <th className="p-3">ชื่อผู้ถือตั๋ว</th>
                    <th className="p-3">รหัสการจอง</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-cyan-200">{t.ticketCode}</td>
                      <td className="p-3 font-mono font-bold text-white">{t.seatNumber || '—'}</td>
                      <td className="p-3 text-gray-200">{t.attendeeName}</td>
                      <td className="p-3 font-mono text-gray-400">{t.booking?.bookingCode || '—'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            t.status === 'USED'
                              ? 'bg-purple-400/10 text-purple-300'
                              : t.status === 'VALID'
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : t.status === 'RESERVED'
                              ? 'bg-orange-400/10 text-orange-300'
                              : 'bg-white/5 text-gray-400'
                          }`}
                        >
                          {t.status === 'RESERVED' ? 'สำรอง' : t.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {t.status === 'RESERVED' ? (
                          <button
                            type="button"
                            onClick={() => releaseSingleSeat({ seatCode: t.seatNumber, ticket: t })}
                            className="rounded-lg border border-orange-400/30 px-2.5 py-1 text-[11px] font-bold text-orange-200 hover:bg-orange-400/10"
                          >
                            ปลดสำรอง
                          </button>
                        ) : t.status === 'VALID' ? (
                          <button
                            type="button"
                            onClick={() => handleRefundTicket(t.id, t.seatNumber)}
                            className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10"
                          >
                            คืนเงิน / ยกเลิก
                          </button>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        ยังไม่มีตั๋วหรือที่นั่งที่ถูกจองในโซนนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Selected Seat Detail Drawer / Card ── */}
          {selectedSeatDetail && (
            <div className="rounded-2xl border border-cyan-400/30 bg-[#161724] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 border border-cyan-400/30 font-mono text-lg font-black text-cyan-200">
                    {selectedSeatDetail.seatCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          selectedSeatDetail.status === 'SOLD'
                            ? 'bg-purple-400/15 text-purple-200 border border-purple-400/30'
                            : selectedSeatDetail.status === 'RESERVED'
                            ? 'bg-orange-400/15 text-orange-200 border border-orange-400/30'
                            : selectedSeatDetail.status === 'AVAILABLE'
                            ? 'bg-emerald-400/15 text-emerald-200 border border-emerald-400/30'
                            : 'bg-amber-400/15 text-amber-200 border border-amber-400/30'
                        }`}
                      >
                        {selectedSeatDetail.status === 'SOLD'
                          ? 'ขายแล้ว (ออกตั๋วสำเร็จ)'
                          : selectedSeatDetail.status === 'RESERVED'
                          ? 'ที่นั่งสำรอง (ล็อกโดยแอดมิน)'
                          : selectedSeatDetail.status === 'AVAILABLE'
                          ? 'ที่นั่งว่าง (พร้อมเปิดขาย)'
                          : 'กำลังรอชำระเงิน (Hold 10 นาที)'}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-white">
                      {selectedSeatDetail.status === 'AVAILABLE'
                        ? `ที่นั่ง ${selectedSeatDetail.seatCode} ว่างสำหรับจำหน่าย (ราคา ฿${zone.price?.toLocaleString() || 0})`
                        : `ข้อมูลผู้ถือตั๋ว: ${selectedSeatDetail.attendeeName || '—'}`}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSeatDetail(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Detail Items or Lock Form */}
              {selectedSeatDetail.status === 'AVAILABLE' ? (
                <div className="mt-4 rounded-xl border border-white/5 bg-black/30 p-4">
                  <span className="text-xs text-gray-300 font-semibold block mb-2">
                    ต้องการล็อกสำรองที่นั่ง {selectedSeatDetail.seatCode} หรือไม่?
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={quickReserveName}
                        onChange={(e) => setQuickReserveName(e.target.value)}
                        onKeyDown={async (e) => { if (e.key === 'Enter' && !actionLoading) { e.preventDefault(); await reserveSingleSeat(selectedSeatDetail.seatCode); setSelectedSeatDetail(null); } }}
                        placeholder="ระบุชื่อผู้ขอสำรอง (เช่น VIP Sponsor, บัตรศิลปิน, หรือ Admin)"
                        className="w-full rounded-xl border border-white/10 bg-[#0c0d14] px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-orange-400 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        await reserveSingleSeat(selectedSeatDetail.seatCode);
                        setSelectedSeatDetail(null);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-orange-300 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Lock size={13} />
                      <span>{actionLoading ? 'กำลังล็อก…' : `ยืนยันล็อกที่นั่ง ${selectedSeatDetail.seatCode}`}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-500">
                    * เมื่อล็อกแล้ว ลูกค้าในหน้าร้านจะไม่สามารถคลิกเลือกที่นั่งนี้ได้
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
                <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] text-gray-400 block mb-1">รหัสตั๋ว (Ticket Code):</span>
                  <span className="font-mono font-bold text-cyan-200">
                    {selectedSeatDetail.ticket?.ticketCode || '—'}
                  </span>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] text-gray-400 block mb-1">รหัสการจอง (Booking Code):</span>
                  <span className="font-mono font-bold text-emerald-200">
                    {selectedSeatDetail.booking?.bookingCode || selectedSeatDetail.ticket?.booking?.bookingCode || '—'}
                  </span>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] text-gray-400 block mb-1">เบอร์โทรศัพท์:</span>
                  <span className="font-mono text-gray-200">
                    {selectedSeatDetail.booking?.customerPhone || selectedSeatDetail.ticket?.booking?.customerPhone || '—'}
                  </span>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] text-gray-400 block mb-1">สถานะการเข้างาน (Gate):</span>
                  <span
                    className={`font-bold ${
                      selectedSeatDetail.ticket?.status === 'USED' ? 'text-purple-300' : 'text-gray-300'
                    }`}
                  >
                    {selectedSeatDetail.ticket?.status === 'USED' ? 'สแกนเข้างานแล้ว' : 'ยังไม่เข้างาน'}
                  </span>
                </div>
              </div>
              )}

              {/* Action Buttons for this seat */}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-white/10">
                {selectedSeatDetail.status === 'RESERVED' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => releaseSingleSeat(selectedSeatDetail)}
                    className="flex items-center gap-1.5 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-xs font-bold text-orange-200 hover:bg-orange-400/20"
                  >
                    <Unlock size={14} />
                    <span>ปลดล็อกที่นั่งนี้</span>
                  </button>
                )}

                {selectedSeatDetail.status === 'SOLD' && selectedSeatDetail.ticket?.status === 'VALID' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRefundTicket(selectedSeatDetail.ticket.id, selectedSeatDetail.seatCode)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/20"
                  >
                    <span>คืนเงินและยกเลิกตั๋วใบนี้</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedSeatDetail(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  ปิด
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
