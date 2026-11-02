import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Armchair,
  RotateCcw,
  Users,
  MapPinned,
  Plus,
} from 'lucide-react';
import { useToast } from './Toast';
import { useLanguage } from '../context/LanguageContext';
import StadiumZoneMap from '../pages/booking/StadiumZoneMap';
import {
  STADIUM_ROWS,
  COLS_LEFT_WING,
  COLS_CENTER,
  COLS_RIGHT_WING,
  ALL_COLS,
  isZoneStanding,
} from '../utils/seatLayout';

export default function AdminSeatMapModal({
  zone,
  allZones = [],
  onSelectZone,
  tickets = [],
  activePending = [],
  onClose,
  api,
  onRefresh,
}) {
  const toast = useToast();
  const { t, trData } = useLanguage();

  const isStanding = useMemo(() => isZoneStanding(zone), [zone]);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'venue' | 'table'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'SOLD' | 'PENDING' | 'RESERVED'
  const [selectedSeatDetail, setSelectedSeatDetail] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [quickReserveName, setQuickReserveName] = useState('Admin Reserved');

  // Capacity & Price edit states
  const [capacityInput, setCapacityInput] = useState(String(zone?.totalCapacity || ''));
  const [priceInput, setPriceInput] = useState(String(zone?.price ?? ''));
  const [savingCapacity, setSavingCapacity] = useState(false);

  useEffect(() => {
    setCapacityInput(String(zone?.totalCapacity || ''));
    setPriceInput(String(zone?.price ?? ''));
    setSelectedSeatDetail(null);
  }, [zone?.id, zone?.totalCapacity, zone?.price]);

  const zoneColor = zone?.colorCode || '#00f0ff';

  // Determine Stadium Rows (minimum A–G like customer page, or expand if tickets/capacity need more rows)
  const rows = useMemo(() => {
    const totalCap = zone?.totalCapacity || 98;
    const neededRows = Math.max(STADIUM_ROWS.length, Math.ceil(totalCap / ALL_COLS.length));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const baseRows = [];
    for (let i = 0; i < Math.min(neededRows, alphabet.length); i++) {
      baseRows.push(alphabet[i]);
    }
    tickets.forEach((tk) => {
      const m = String(tk.seatNumber || '').trim().toUpperCase().match(/^([A-Z])-\d+$/);
      if (m && !baseRows.includes(m[1])) {
        baseRows.push(m[1]);
      }
    });
    return baseRows;
  }, [zone?.totalCapacity, tickets]);

  // Build fast lookup map for all seats / standing queues in this zone
  const seatMap = useMemo(() => {
    const map = new Map();

    // 1. Valid, Used or Reserved Tickets
    tickets.forEach((ticket) => {
      if (ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') return;
      if (ticket.seatNumber) {
        const cleanCode = ticket.seatNumber.trim().toUpperCase();
        map.set(cleanCode, {
          seatCode: cleanCode,
          status: ticket.status === 'RESERVED' ? 'RESERVED' : 'SOLD',
          ticket,
          attendeeName: ticket.attendeeName,
          booking: ticket.booking,
          type: 'ticket',
        });
      }
    });

    // 2. Pending Bookings (Held temporarily for 10 mins)
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

  // Standing Pit Queue Slots (STD-001 .. STD-XXX) matching Customer ZoneSelectPage.jsx
  const standingSlots = useMemo(() => {
    if (!isStanding) return [];
    const maxDisplay = Math.min(Math.max(zone?.totalCapacity || 60, 40), 120);
    const list = [];
    for (let i = 1; i <= maxDisplay; i++) {
      list.push(`STD-${String(i).padStart(3, '0')}`);
    }
    // Include any non-standard ticket codes in standing zone
    seatMap.forEach((_, code) => {
      if (!list.includes(code)) list.push(code);
    });
    return list;
  }, [isStanding, zone?.totalCapacity, seatMap]);

  // Stats calculation
  const stats = useMemo(() => {
    let soldCount = 0;
    let pendingCount = 0;
    let reservedCount = 0;

    tickets.forEach((tk) => {
      if (tk.status === 'CANCELLED' || tk.status === 'REFUNDED') return;
      if (tk.status === 'RESERVED') reservedCount++;
      else soldCount++;
    });

    seatMap.forEach((info) => {
      if (info.status === 'PENDING') pendingCount++;
    });

    const totalSeats = zone?.totalCapacity || rows.length * ALL_COLS.length;
    const availableCount = Math.max(0, zone?.available ?? totalSeats - soldCount - reservedCount);

    return {
      total: totalSeats,
      available: availableCount,
      sold: soldCount,
      pending: pendingCount,
      reserved: reservedCount,
    };
  }, [tickets, seatMap, rows.length, zone]);

  // Helper: Format seat number as "A-01"
  const formatSeatCode = (row, col) => `${row}-${String(col).padStart(2, '0')}`;

  // Handle Single Seat / Queue Click
  const handleSeatClick = (seatCode) => {
    const seatInfo = seatMap.get(seatCode);
    if (!seatInfo) {
      setSelectedSeatDetail({
        seatCode,
        status: 'AVAILABLE',
      });
    } else {
      setSelectedSeatDetail(seatInfo);
    }
  };

  // Reserve a single seat or standing queue
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
      toast.success(
        t(
          `ล็อกสำรองที่นั่ง/คิว ${seatCode} สำเร็จแล้ว`,
          `Reserved seat/queue ${seatCode} successfully`
        )
      );
      await onRefresh();
    } catch (err) {
      toast.error(err.message || t('ไม่สามารถล็อกที่นั่งได้', 'Failed to reserve seat'));
    } finally {
      setActionLoading(false);
    }
  };

  // Quick lock next available standing queue slot (STD-xxx)
  const handleLockNextStandingQueue = async () => {
    let qNum = 1;
    let nextCode = 'STD-001';
    while (qNum <= 9999) {
      const candidate = `STD-${String(qNum).padStart(3, '0')}`;
      if (!seatMap.has(candidate)) {
        nextCode = candidate;
        break;
      }
      qNum++;
    }
    await reserveSingleSeat(nextCode);
  };

  // Release a single reserved seat
  const releaseSingleSeat = async (seatInfo) => {
    if (!seatInfo.ticket?.id) {
      toast.error(t('ไม่พบข้อมูลตั๋วสำรอง', 'Reserved ticket not found'));
      return;
    }
    setActionLoading(true);
    try {
      await api(`/tickets/${seatInfo.ticket.id}/release-reservation`, {
        method: 'POST',
      });
      toast.success(
        t(
          `ปลดล็อกที่นั่ง ${seatInfo.seatCode} คืนโควตาเรียบร้อย`,
          `Released ${seatInfo.seatCode} and restored quota`
        )
      );
      if (selectedSeatDetail?.seatCode === seatInfo.seatCode) {
        setSelectedSeatDetail(null);
      }
      await onRefresh();
    } catch (err) {
      toast.error(err.message || t('ปลดล็อกที่นั่งไม่สำเร็จ', 'Failed to release seat'));
    } finally {
      setActionLoading(false);
    }
  };

  // Refund / Cancel valid ticket
  const handleRefundTicket = async (ticketId, seatCode) => {
    if (
      !window.confirm(
        t(
          `ยืนยันการยกเลิกตั๋วที่นั่ง ${seatCode || ''} และคืนโควตาบัตร?`,
          `Confirm cancelling ticket ${seatCode || ''} and refunding seat quota?`
        )
      )
    )
      return;
    setActionLoading(true);
    try {
      await api(`/tickets/${ticketId}/refund`, { method: 'POST' });
      toast.success(
        t(
          `ยกเลิกตั๋วที่นั่ง ${seatCode || ''} และคืนโควตาสำเร็จ`,
          `Cancelled ticket ${seatCode || ''} and restored seat quota`
        )
      );
      setSelectedSeatDetail(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.message || t('คืนเงิน/ยกเลิกตั๋วไม่สำเร็จ', 'Refund failed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Row Lock (All 14 columns 01–14 in rowLetter)
  const handleBatchRowLock = async (rowLetter) => {
    const rowSeats = ALL_COLS.map((col) => formatSeatCode(rowLetter, col));
    const availableSeatsInRow = rowSeats.filter((code) => !seatMap.has(code));

    if (availableSeatsInRow.length === 0) {
      toast.info(
        t(
          `ที่นั่งในแถว ${rowLetter} ถูกใช้งานหรือล็อกเต็มแล้ว`,
          `All seats in Row ${rowLetter} are already occupied or locked`
        )
      );
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
      toast.success(
        t(
          `ล็อกสำรองที่นั่งแถว ${rowLetter} ทั้งหมด ${availableSeatsInRow.length} ที่นั่งสำเร็จ`,
          `Locked ${availableSeatsInRow.length} seats in Row ${rowLetter}`
        )
      );
      await onRefresh();
    } catch (err) {
      toast.error(err.message || t(`ไม่สามารถล็อกแถว ${rowLetter} ได้`, `Failed to lock Row ${rowLetter}`));
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Row Release (All 14 columns 01–14 in rowLetter)
  const handleBatchRowRelease = async (rowLetter) => {
    const rowSeats = ALL_COLS.map((col) => formatSeatCode(rowLetter, col));
    const reservedSeatsInRow = rowSeats.filter((code) => seatMap.get(code)?.status === 'RESERVED');

    if (reservedSeatsInRow.length === 0) {
      toast.info(
        t(
          `ไม่มีที่นั่งสำรองในแถว ${rowLetter}`,
          `No admin-reserved seats in Row ${rowLetter}`
        )
      );
      return;
    }

    setActionLoading(true);
    try {
      await api(`/zones/${zone.id}/seats/batch-release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumbers: reservedSeatsInRow }),
      });
      toast.success(
        t(
          `ปลดล็อกที่นั่งแถว ${rowLetter} ทั้งหมด ${reservedSeatsInRow.length} ที่นั่งเรียบร้อย`,
          `Released ${reservedSeatsInRow.length} seats in Row ${rowLetter}`
        )
      );
      await onRefresh();
    } catch (err) {
      toast.error(err.message || t(`ไม่สามารถปลดล็อกแถว ${rowLetter} ได้`, `Failed to release Row ${rowLetter}`));
    } finally {
      setActionLoading(false);
    }
  };

  // Update Capacity & Price
  const handleSaveCapacity = async () => {
    const cap = parseInt(capacityInput, 10);
    const prc = parseFloat(priceInput);
    if (isNaN(cap) || cap < 1) {
      toast.error(t('กรุณาระบุความจุเป็นจำนวนเต็มบวก', 'Please enter a positive integer for capacity'));
      return;
    }
    if (isNaN(prc) || prc < 0) {
      toast.error(t('กรุณาระบุราคาที่ถูกต้อง', 'Please enter a valid price'));
      return;
    }

    setSavingCapacity(true);
    try {
      await api(`/zones/${zone.id}/capacity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalCapacity: cap, price: prc }),
      });
      toast.success(t('อัปเดตความจุและราคาโซนเรียบร้อยแล้ว', 'Updated zone capacity and price'));
      await onRefresh();
    } catch (err) {
      toast.error(err.message || t('บันทึกความจุไม่สำเร็จ', 'Failed to update capacity'));
    } finally {
      setSavingCapacity(false);
    }
  };

  // Render an individual realistic stadium seat button matching Customer ZoneSelectPage.jsx
  const renderAdminStadiumSeat = (rowLetter, colNum) => {
    const seatCode = formatSeatCode(rowLetter, colNum);
    const seatInfo = seatMap.get(seatCode);
    const status = seatInfo?.status || 'AVAILABLE';
    const isDimmed = statusFilter !== 'ALL' && statusFilter !== status;
    const isSelected = selectedSeatDetail?.seatCode === seatCode;

    return (
      <button
        key={seatCode}
        type="button"
        disabled={actionLoading}
        onClick={() => handleSeatClick(seatCode)}
        onMouseEnter={() =>
          setHoveredSeat({
            code: seatCode,
            row: rowLetter,
            col: colNum,
            status,
            attendeeName: seatInfo?.attendeeName,
          })
        }
        onMouseLeave={() => setHoveredSeat(null)}
        title={
          status === 'AVAILABLE'
            ? t(
                `ที่นั่ง ${seatCode} (ว่าง) - คลิกเพื่อล็อกสำรอง`,
                `Seat ${seatCode} (Available) - Click to lock/reserve`
              )
            : status === 'RESERVED'
            ? t(
                `ที่นั่ง ${seatCode} (สำรองโดย: ${seatInfo.attendeeName}) - คลิกเพื่อปลดล็อก`,
                `Seat ${seatCode} (Reserved: ${seatInfo.attendeeName}) - Click to release`
              )
            : status === 'SOLD'
            ? t(
                `ที่นั่ง ${seatCode} (ขายแล้ว: ${seatInfo.attendeeName}) - คลิกดูรายละเอียด`,
                `Seat ${seatCode} (Sold: ${seatInfo.attendeeName}) - Click for details`
              )
            : t(
                `ที่นั่ง ${seatCode} (รอชำระเงิน: ${seatInfo.attendeeName}) - คลิกดูรายละเอียด`,
                `Seat ${seatCode} (Pending Hold: ${seatInfo.attendeeName}) - Click for details`
              )
        }
        className={`group/seat relative flex flex-col items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-t-xl rounded-b-md font-mono text-[10px] font-bold transition-all duration-150 select-none cursor-pointer ${
          isDimmed ? 'opacity-20 scale-95' : 'hover:scale-110 active:scale-95'
        } ${
          isSelected ? 'ring-2 ring-white scale-110 z-10' : ''
        } ${
          status === 'AVAILABLE'
            ? 'bg-[#171b29] border border-emerald-500/45 text-emerald-200 hover:bg-emerald-500/25 hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(52,211,153,0.45)]'
            : status === 'RESERVED'
            ? 'border border-orange-500/60 bg-orange-500/25 text-orange-200 hover:border-orange-400 hover:bg-orange-500/40 hover:shadow-[0_0_12px_rgba(251,146,60,0.6)]'
            : status === 'PENDING'
            ? 'border border-amber-400/60 bg-amber-400/25 text-amber-200 hover:border-amber-300 hover:bg-amber-400/40'
            : 'border border-purple-500/60 bg-purple-500/25 text-purple-200 hover:border-purple-400 hover:bg-purple-500/40 hover:shadow-[0_0_12px_rgba(192,132,252,0.6)]'
        }`}
      >
        {/* Realistic Stadium Seat Backrest Curve */}
        <span
          className={`w-4 sm:w-5 h-1 rounded-full mb-0.5 transition-all ${
            status === 'AVAILABLE'
              ? 'bg-emerald-400/60 group-hover/seat:bg-emerald-300'
              : status === 'RESERVED'
              ? 'bg-orange-400'
              : status === 'PENDING'
              ? 'bg-amber-400'
              : 'bg-purple-400'
          }`}
        />
        <span className="leading-none text-[9px] sm:text-[10px] tracking-tighter">
          {String(colNum).padStart(2, '0')}
        </span>
      </button>
    );
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
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-inner"
              style={{
                backgroundColor: `${zoneColor}20`,
                borderColor: `${zoneColor}60`,
                color: zoneColor,
              }}
            >
              {isStanding ? <Users size={22} /> : <Armchair size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 border border-cyan-400/30">
                  {t('ผังที่นั่งเชื่อมหน้าลูกค้า (Real-time Sync)', 'Customer-Synced Seat Map (Real-time)')}
                </span>
                <span className="text-xs text-gray-400">
                  {trData(zone?.concert?.name || 'SoundWave Live')}
                </span>
              </div>
              <h2 id="zone-seat-map-title" className="mt-0.5 text-xl font-black text-white">
                {t('ผังที่นั่งแอดมิน', 'Admin Seat Map')} · {trData(zone?.name)}
              </h2>
            </div>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              {allZones.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('venue')}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
                    viewMode === 'venue' ? 'bg-cyan-300 text-black shadow-md' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <MapPinned size={13} />
                  <span>{t('ผังโซนสนามจริง (Step 1)', 'Venue Map (Step 1)')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  viewMode === 'visual' ? 'bg-cyan-300 text-black shadow-md' : 'text-gray-300 hover:text-white'
                }`}
              >
                {isStanding
                  ? t('ผังหลุมบัตรยืน (Step 2)', 'Standing Pit (Step 2)')
                  : t('ผังเก้าอี้ 3 บล็อก (Step 2)', '3-Wing Seat Map (Step 2)')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-cyan-300 text-black shadow-md' : 'text-gray-300 hover:text-white'
                }`}
              >
                {t(`ตารางรายการ (${tickets.length})`, `Ticket List (${tickets.length})`)}
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              title={t('รีเฟรชข้อมูล', 'Refresh Data')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('ปิด', 'Close')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ── Quick Zone Switcher Pills (if concert has multiple zones) ── */}
        {allZones.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0b0c13] px-5 py-2.5 text-xs">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">
              {t('สลับโซนในงานนี้:', 'Switch Zone:')}
            </span>
            {allZones.map((z) => {
              const active = z.id === zone?.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => onSelectZone && onSelectZone(z)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 font-bold transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'border-cyan-400 bg-cyan-400/20 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: z.colorCode || '#00f0ff' }}
                  />
                  <span>{trData(z.name)}</span>
                  <span className="font-mono text-[10px] text-cyan-300">
                    ({z.available}/{z.totalCapacity})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Status KPI Bar & Color Legend ── */}
        <div className="border-b border-white/10 bg-black/40 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'border-white/30 bg-white/15 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>{t('ทั้งหมด', 'All')}</span>
                <span className="font-mono text-[11px] text-gray-300">({stats.total})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('AVAILABLE')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  statusFilter === 'AVAILABLE'
                    ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>{t('🟢 ว่าง (คลิกเพื่อล็อก)', '🟢 Available (Click to Lock)')}</span>
                <span className="font-mono text-[11px]">({stats.available})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('SOLD')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  statusFilter === 'SOLD'
                    ? 'border-purple-400/50 bg-purple-400/20 text-purple-200'
                    : 'border-white/10 bg-white/5 text-purple-400/80 hover:text-purple-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                <span>{t('🟪 ขายแล้ว', '🟪 Sold')}</span>
                <span className="font-mono text-[11px]">({stats.sold})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'border-amber-400/50 bg-amber-400/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span>{t('🟡 รอจ่ายเงิน', '🟡 Pending Hold')}</span>
                <span className="font-mono text-[11px]">({stats.pending})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('RESERVED')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold transition-all cursor-pointer ${
                  statusFilter === 'RESERVED'
                    ? 'border-orange-400/50 bg-orange-400/20 text-orange-200'
                    : 'border-white/10 bg-white/5 text-orange-400/80 hover:text-orange-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                <span>{t('🟧 สำรองไว้ (คลิกเพื่อปลด)', '🟧 Reserved (Click to Release)')}</span>
                <span className="font-mono text-[11px]">({stats.reserved})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="rounded-lg bg-cyan-400/10 px-2 py-0.5 text-cyan-300 font-bold border border-cyan-400/20">
                1-Click Sync
              </span>
              <span>
                {t(
                  'อิงผังเดียวกับหน้าลูกค้า (ล็อกปุ๊บ หน้าเว็บลูกค้าขึ้น Sold Out ทันที)',
                  'Synced with customer map (locked seats immediately show as occupied)'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Content Area (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Reserve Preset Tag + Capacity Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-300">
                {t('ชื่อผู้จองสำรองด่วน:', 'Quick Reserve Label:')}
              </span>
              <input
                type="text"
                value={quickReserveName}
                onChange={(e) => setQuickReserveName(e.target.value)}
                placeholder={t('เช่น ผู้สนับสนุน, แขก VIP, ล็อกหน้างาน', 'e.g. VIP Sponsor, Artist Guest, Admin Lock')}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-cyan-300"
              />
            </div>

            {/* Capacity & Price Editor */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">{t('ความจุ:', 'Capacity:')}</span>
                <input
                  type="number"
                  min="1"
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(e.target.value)}
                  className="w-20 rounded-xl border border-white/15 bg-black/40 px-2.5 py-1 text-xs font-mono text-white outline-none focus:border-cyan-300"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">{t('ราคา:', 'Price:')}</span>
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
                className="rounded-xl bg-cyan-300 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-cyan-200 disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingCapacity ? t('กำลังบันทึก…', 'Saving…') : t('อัปเดต', 'Update')}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              VIEW 0: STEP 1 REAL VENUE ZONE MAP (SAME AS CUSTOMER STEP 1)
          ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'venue' && allZones.length > 0 && (
            <div className="space-y-3">
              <StadiumZoneMap
                zones={allZones}
                selectedZoneId={zone?.id}
                onSelect={(z) => {
                  if (onSelectZone) onSelectZone(z);
                  setViewMode('visual');
                }}
                venueName={zone?.concert?.venue || zone?.concert?.location || ''}
                concertName={zone?.concert?.name || ''}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              VIEW 1: CUSTOMER-SYNCED 3-WING STADIUM MATRIX OR STANDING PIT
          ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'visual' && (
            <div className="rounded-3xl border border-cyan-400/25 bg-[#0b0b12] p-5 sm:p-6 shadow-inner space-y-5">
              {/* Stage / Catwalk Direction Banner (Identical to Customer ZoneSelectPage.jsx) */}
              <div className="relative text-center px-4">
                <div className="mx-auto max-w-md rounded-b-2xl border-x border-b border-white/15 bg-gradient-to-b from-white/15 to-white/[0.03] py-2 px-6 shadow-[0_6px_25px_rgba(0,240,255,0.18)]">
                  <span className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-200">
                    {t('▲ STAGE / ทิศทางหน้าเวทีการแสดง ▲', '▲ STAGE DIRECTION ▲')}
                  </span>
                </div>
              </div>

              {isStanding ? (
                /* ── MODE A: STANDING PIT & QUEUE NO. GRID (Matches Customer Standing Pit) ── */
                <div className="space-y-5">
                  <div
                    className="relative mx-auto max-w-3xl rounded-3xl border-2 p-5 sm:p-6 text-center transition-all overflow-hidden"
                    style={{
                      borderColor: `${zoneColor}88`,
                      background: `radial-gradient(circle at 50% 0%, ${zoneColor}28, rgba(15,15,24,0.95) 75%)`,
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-1 text-xs font-black text-white">
                        <Users size={14} style={{ color: zoneColor }} />
                        <span>{trData(zone?.name)} — STANDING PIT QUEUE (STD-xxx)</span>
                      </div>

                      <button
                        type="button"
                        disabled={actionLoading || stats.available <= 0}
                        onClick={handleLockNextStandingQueue}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-400 px-3.5 py-1.5 text-xs font-black text-black hover:bg-orange-300 disabled:opacity-40 transition-all cursor-pointer shadow-md"
                      >
                        <Plus size={14} />
                        <span>{t('ล็อกคิวบัตรยืนถัดไป (+1 คิว)', 'Lock Next Standing Queue (+1)')}</span>
                      </button>
                    </div>

                    <p className="text-xs text-gray-300 max-w-xl mx-auto mb-4">
                      {t(
                        'โซนบัตรยืนหน้าเวทีใช้ระบบรันหมายเลขคิวเข้าฮอลล์ (STD-001, STD-002, ...) เหมือนหน้าจองของลูกค้า คลิกที่หมายเลขคิวด้านล่างเพื่อล็อกสำรองหรือตรวจสอบผู้ถือบัตร',
                        'Standing Pit uses sequential entry queue numbers (STD-001, STD-002, ...) matching customer checkout. Click any queue badge below to reserve or inspect attendee details.'
                      )}
                    </p>

                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-72 overflow-y-auto p-2 rounded-2xl bg-black/40 border border-white/10">
                      {standingSlots.map((qCode) => {
                        const seatInfo = seatMap.get(qCode);
                        const status = seatInfo?.status || 'AVAILABLE';
                        const isDimmed = statusFilter !== 'ALL' && statusFilter !== status;
                        const isSelected = selectedSeatDetail?.seatCode === qCode;

                        return (
                          <button
                            key={qCode}
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleSeatClick(qCode)}
                            className={`rounded-xl py-2 px-1.5 font-mono text-[10px] font-bold transition-all cursor-pointer ${
                              isDimmed ? 'opacity-20' : 'hover:scale-105'
                            } ${isSelected ? 'ring-2 ring-white' : ''} ${
                              status === 'AVAILABLE'
                                ? 'bg-[#171b29] border border-emerald-500/35 text-emerald-200 hover:bg-emerald-500/20'
                                : status === 'RESERVED'
                                ? 'bg-orange-500/25 border border-orange-400/60 text-orange-200'
                                : status === 'PENDING'
                                ? 'bg-amber-400/25 border border-amber-400/60 text-amber-200'
                                : 'bg-purple-500/25 border border-purple-400/60 text-purple-200'
                            }`}
                          >
                            <div>{qCode}</div>
                            <div className="text-[8px] opacity-80 truncate">
                              {status === 'AVAILABLE'
                                ? t('ว่าง', 'Free')
                                : seatInfo?.attendeeName || status}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── MODE B: 3-WING STADIUM BOWL SEATED MATRIX (Matches Customer ZoneSelectPage.jsx 100%) ── */
                <div className="space-y-3">
                  {/* Live Hover Seat Inspector Pill (Identical to Customer ZoneSelectPage.jsx) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{t('ข้อมูลที่นั่ง:', 'Seat Info:')}</span>
                      {hoveredSeat ? (
                        <span className="font-mono font-bold text-white">
                          {t('โซน', 'Zone')}{' '}
                          <span style={{ color: zoneColor }}>{trData(zone?.name)}</span> ·{' '}
                          {t('แถว', 'Row')} <strong className="text-cyan-300">{hoveredSeat.row}</strong> ·{' '}
                          {t('ที่นั่ง', 'Seat')}{' '}
                          <strong className="text-cyan-300">{String(hoveredSeat.col).padStart(2, '0')}</strong> ·{' '}
                          {hoveredSeat.status === 'AVAILABLE' ? (
                            <span className="text-emerald-400">
                              {t('ว่าง', 'Available')} (฿{zone?.price?.toLocaleString() || 0})
                            </span>
                          ) : hoveredSeat.status === 'RESERVED' ? (
                            <span className="text-orange-300">
                              {t('สำรองโดย', 'Reserved by')}: {hoveredSeat.attendeeName}
                            </span>
                          ) : hoveredSeat.status === 'PENDING' ? (
                            <span className="text-amber-300">
                              {t('รอชำระเงิน', 'Pending')}: {hoveredSeat.attendeeName}
                            </span>
                          ) : (
                            <span className="text-purple-300">
                              {t('ขายแล้ว', 'Sold')}: {hoveredSeat.attendeeName}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          {t(
                            'ชี้หรือคลิกที่เก้าอี้เพื่อดูผู้ถือตั๋ว หรือล็อก/ปลดล็อกที่นั่ง (ผัง 3 บล็อก 14 ที่นั่ง/แถว เหมือนหน้าลูกค้า)',
                            'Hover or click any seat to inspect holder or lock/release (3-Wing 14-seat layout synced with customer view)'
                          )}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-gray-400">
                      {t('ว่าง', 'Available')}: <strong className="text-white">{stats.available}</strong> / {stats.total}
                    </span>
                  </div>

                  {/* 3-Wing Column Headers (01-04 Left Wing | 05-10 Center Block | 11-14 Right Wing) */}
                  <div className="space-y-2.5 overflow-x-auto py-3 px-2">
                    <div className="flex items-center justify-center gap-2.5 min-w-[760px] text-[10px] font-bold uppercase tracking-wider text-gray-500 pb-1">
                      <span className="w-20 text-center">{t('ล็อกยกแถว', 'Lock Row')}</span>
                      <span className="w-7 text-center">ROW</span>
                      <span className="w-[132px] text-center">{t('ฝั่งซ้าย (01-04)', 'Left Wing (01-04)')}</span>
                      <span className="w-4" />
                      <span className="w-[200px] text-center text-cyan-300/80">
                        {t('โซนกลางหน้าเวที (05-10)', 'Center Block (05-10)')}
                      </span>
                      <span className="w-4" />
                      <span className="w-[132px] text-center">{t('ฝั่งขวา (11-14)', 'Right Wing (11-14)')}</span>
                      <span className="w-7 text-center">ROW</span>
                      <span className="w-20 text-center">{t('ปลดยกแถว', 'Unlock Row')}</span>
                    </div>

                    {rows.map((rowLetter, rowIdx) => {
                      const rowSeats = ALL_COLS.map((col) => formatSeatCode(rowLetter, col));
                      const availableInRow = rowSeats.filter((c) => !seatMap.has(c)).length;
                      const reservedInRow = rowSeats.filter((c) => seatMap.get(c)?.status === 'RESERVED').length;

                      return (
                        <div
                          key={rowLetter}
                          className="flex items-center justify-center gap-2 sm:gap-2.5 min-w-[760px]"
                        >
                          {/* Left Action: Lock Entire Row (01-14) */}
                          <button
                            type="button"
                            disabled={actionLoading || availableInRow === 0}
                            onClick={() => handleBatchRowLock(rowLetter)}
                            title={t(
                              `ล็อกทั้งแถว ${rowLetter} (${availableInRow} ที่นั่งว่าง)`,
                              `Lock entire Row ${rowLetter} (${availableInRow} available)`
                            )}
                            className="w-20 flex items-center justify-center gap-1 rounded-lg border border-orange-400/25 bg-orange-400/10 px-2 py-1 text-[10px] font-bold text-orange-200 hover:bg-orange-400/20 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          >
                            <Lock size={10} />
                            <span>
                              {t('ล็อก', 'Lock')} {rowLetter}
                            </span>
                          </button>

                          {/* Left Row Badge */}
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-black text-cyan-300 flex items-center justify-center select-none">
                            {rowLetter}
                          </span>

                          {/* Left Wing (01 - 04) with Stadium Curve (-rotate-2) */}
                          <div className="flex items-center gap-1 sm:gap-1.5 -rotate-2">
                            {COLS_LEFT_WING.map((colNum) => renderAdminStadiumSeat(rowLetter, colNum))}
                          </div>

                          {/* Left Aisle Walkway */}
                          <div className="w-3 sm:w-4 h-7 flex items-center justify-center select-none">
                            <span className="w-0.5 h-5 bg-white/10 rounded-full" />
                          </div>

                          {/* Center Block (05 - 10) */}
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            {COLS_CENTER.map((colNum) => renderAdminStadiumSeat(rowLetter, colNum))}
                          </div>

                          {/* Right Aisle Walkway */}
                          <div className="w-3 sm:w-4 h-7 flex items-center justify-center select-none">
                            <span className="w-0.5 h-5 bg-white/10 rounded-full" />
                          </div>

                          {/* Right Wing (11 - 14) with Stadium Curve (rotate-2) */}
                          <div className="flex items-center gap-1 sm:gap-1.5 rotate-2">
                            {COLS_RIGHT_WING.map((colNum) => renderAdminStadiumSeat(rowLetter, colNum))}
                          </div>

                          {/* Right Row Badge */}
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-black text-cyan-300 flex items-center justify-center select-none">
                            {rowLetter}
                          </span>

                          {/* Right Action: Release Entire Row (01-14) */}
                          <button
                            type="button"
                            disabled={actionLoading || reservedInRow === 0}
                            onClick={() => handleBatchRowRelease(rowLetter)}
                            title={t(
                              `ปลดล็อกทั้งแถว ${rowLetter} (${reservedInRow} ที่นั่งสำรอง)`,
                              `Release entire Row ${rowLetter} (${reservedInRow} reserved)`
                            )}
                            className="w-20 flex items-center justify-center gap-1 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          >
                            <Unlock size={10} />
                            <span>
                              {t('ปลด', 'Free')} {rowLetter}
                            </span>
                          </button>

                          {rowIdx === 0 && (
                            <span className="hidden xl:inline-block text-[9px] font-bold text-amber-300/90 w-14">
                              ← {t('ติดเวที', 'Front')}
                            </span>
                          )}
                          {rowIdx !== 0 && <span className="hidden xl:inline-block w-14" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                    <th className="p-3">{t('รหัสตั๋ว', 'Ticket Code')}</th>
                    <th className="p-3">{t('ที่นั่ง / คิว', 'Seat / Queue')}</th>
                    <th className="p-3">{t('ชื่อผู้ถือตั๋ว', 'Attendee Name')}</th>
                    <th className="p-3">{t('รหัสการจอง', 'Booking Code')}</th>
                    <th className="p-3 text-center">{t('สถานะ', 'Status')}</th>
                    <th className="p-3 text-right">{t('การจัดการ', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map((tk) => (
                    <tr key={tk.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-cyan-200">{tk.ticketCode}</td>
                      <td className="p-3 font-mono font-bold text-white">{tk.seatNumber || '—'}</td>
                      <td className="p-3 text-gray-200">{tk.attendeeName}</td>
                      <td className="p-3 font-mono text-gray-400">{tk.booking?.bookingCode || '—'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tk.status === 'USED'
                              ? 'bg-purple-400/10 text-purple-300'
                              : tk.status === 'VALID'
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : tk.status === 'RESERVED'
                              ? 'bg-orange-400/10 text-orange-300'
                              : 'bg-white/5 text-gray-400'
                          }`}
                        >
                          {tk.status === 'RESERVED'
                            ? t('สำรอง', 'RESERVED')
                            : tk.status === 'USED'
                            ? t('ใช้แล้ว', 'USED')
                            : tk.status === 'VALID'
                            ? t('พร้อมใช้', 'VALID')
                            : tk.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {tk.status === 'RESERVED' ? (
                          <button
                            type="button"
                            onClick={() => releaseSingleSeat({ seatCode: tk.seatNumber, ticket: tk })}
                            className="rounded-lg border border-orange-400/30 px-2.5 py-1 text-[11px] font-bold text-orange-200 hover:bg-orange-400/10 cursor-pointer"
                          >
                            {t('ปลดสำรอง', 'Release')}
                          </button>
                        ) : tk.status === 'VALID' ? (
                          <button
                            type="button"
                            onClick={() => handleRefundTicket(tk.id, tk.seatNumber)}
                            className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10 cursor-pointer"
                          >
                            {t('คืนเงิน / ยกเลิก', 'Refund / Cancel')}
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
                        {t('ยังไม่มีตั๋วหรือที่นั่งที่ถูกจองในโซนนี้', 'No tickets or reserved seats in this zone yet')}
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
                  <div className="flex h-12 min-w-12 px-2 items-center justify-center rounded-2xl bg-cyan-400/15 border border-cyan-400/30 font-mono text-base font-black text-cyan-200">
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
                          ? t('ขายแล้ว (ออกตั๋วสำเร็จ)', 'Sold (Ticket Issued)')
                          : selectedSeatDetail.status === 'RESERVED'
                          ? t('ที่นั่งสำรอง (ล็อกโดยแอดมิน)', 'Reserved (Locked by Admin)')
                          : selectedSeatDetail.status === 'AVAILABLE'
                          ? t('ที่นั่งว่าง (พร้อมเปิดขาย)', 'Available (Ready for Sale)')
                          : t('กำลังรอชำระเงิน (Hold 10 นาที)', 'Pending Payment (10m Hold)')}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-white">
                      {selectedSeatDetail.status === 'AVAILABLE'
                        ? t(
                            `ที่นั่ง/คิว ${selectedSeatDetail.seatCode} ว่างสำหรับจำหน่าย (ราคา ฿${zone?.price?.toLocaleString() || 0})`,
                            `Seat/Queue ${selectedSeatDetail.seatCode} is available (Price ฿${zone?.price?.toLocaleString() || 0})`
                          )
                        : `${t('ข้อมูลผู้ถือตั๋ว:', 'Attendee:')} ${selectedSeatDetail.attendeeName || '—'}`}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSeatDetail(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Detail Items or Lock Form */}
              {selectedSeatDetail.status === 'AVAILABLE' ? (
                <div className="mt-4 rounded-xl border border-white/5 bg-black/30 p-4">
                  <span className="text-xs text-gray-300 font-semibold block mb-2">
                    {t(
                      `ต้องการล็อกสำรองที่นั่ง/คิว ${selectedSeatDetail.seatCode} หรือไม่?`,
                      `Do you want to lock/reserve ${selectedSeatDetail.seatCode}?`
                    )}
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={quickReserveName}
                        onChange={(e) => setQuickReserveName(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && !actionLoading) {
                            e.preventDefault();
                            await reserveSingleSeat(selectedSeatDetail.seatCode);
                            setSelectedSeatDetail(null);
                          }
                        }}
                        placeholder={t(
                          'ระบุชื่อผู้ขอสำรอง (เช่น VIP Sponsor, บัตรศิลปิน, หรือ Admin)',
                          'Enter reservation holder (e.g. VIP Sponsor, Artist Guest, Admin)'
                        )}
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
                      <span>
                        {actionLoading
                          ? t('กำลังล็อก…', 'Locking…')
                          : t(`ยืนยันล็อก ${selectedSeatDetail.seatCode}`, `Confirm Lock ${selectedSeatDetail.seatCode}`)}
                      </span>
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-500">
                    {t(
                      '* เมื่อล็อกแล้ว ลูกค้าในหน้าร้านจะไม่สามารถคลิกเลือกที่นั่งนี้ได้ทันที',
                      '* Once locked, customers on the booking page cannot select this seat.'
                    )}
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
                  <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                    <span className="text-[10px] text-gray-400 block mb-1">
                      {t('รหัสตั๋ว (Ticket Code):', 'Ticket Code:')}
                    </span>
                    <span className="font-mono font-bold text-cyan-200">
                      {selectedSeatDetail.ticket?.ticketCode || '—'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                    <span className="text-[10px] text-gray-400 block mb-1">
                      {t('รหัสการจอง (Booking Code):', 'Booking Code:')}
                    </span>
                    <span className="font-mono font-bold text-emerald-200">
                      {selectedSeatDetail.booking?.bookingCode ||
                        selectedSeatDetail.ticket?.booking?.bookingCode ||
                        '—'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                    <span className="text-[10px] text-gray-400 block mb-1">
                      {t('เบอร์โทรศัพท์:', 'Phone Number:')}
                    </span>
                    <span className="font-mono text-gray-200">
                      {selectedSeatDetail.booking?.customerPhone ||
                        selectedSeatDetail.ticket?.booking?.customerPhone ||
                        '—'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                    <span className="text-[10px] text-gray-400 block mb-1">
                      {t('สถานะการเข้างาน (Gate):', 'Gate Check-in Status:')}
                    </span>
                    <span
                      className={`font-bold ${
                        selectedSeatDetail.ticket?.status === 'USED' ? 'text-purple-300' : 'text-gray-300'
                      }`}
                    >
                      {selectedSeatDetail.ticket?.status === 'USED'
                        ? t('สแกนเข้างานแล้ว', 'Checked In')
                        : t('ยังไม่เข้างาน', 'Not Checked In')}
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
                    className="flex items-center gap-1.5 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-xs font-bold text-orange-200 hover:bg-orange-400/20 cursor-pointer"
                  >
                    <Unlock size={14} />
                    <span>{t('ปลดล็อกที่นั่งนี้', 'Release Reservation')}</span>
                  </button>
                )}

                {selectedSeatDetail.status === 'SOLD' && selectedSeatDetail.ticket?.status === 'VALID' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRefundTicket(selectedSeatDetail.ticket.id, selectedSeatDetail.seatCode)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/20 cursor-pointer"
                  >
                    <span>{t('คืนเงินและยกเลิกตั๋วใบนี้', 'Refund & Cancel Ticket')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedSeatDetail(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  {t('ปิด', 'Close')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
