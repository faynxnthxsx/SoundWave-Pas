import React, { useState, useEffect } from 'react';
import {
  X,
  Radar,
  Sparkles,
  Download,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Music2,
  Ticket,
  LoaderCircle,
  ExternalLink,
  RotateCcw,
  Zap
} from 'lucide-react';
import { useToast } from './Toast';

export default function ConcertDiscoveryModal({ onClose, api, onImportSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ items: [], pendingCount: 0, total: 0 });
  const [importingId, setImportingId] = useState(null);

  const fetchDiscovery = async () => {
    setLoading(true);
    try {
      const res = await api('/discovery');
      setData(res || { items: [], pendingCount: 0, total: 0 });
    } catch (err) {
      toast.error(err.message || 'ตรวจหาคอนเสิร์ตไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscovery();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImport = async (externalId, concertName) => {
    setImportingId(externalId);
    try {
      const result = await api('/discovery/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalId }),
      });
      toast.success(`นำเข้าคอนเสิร์ต "${concertName}" สำเร็จ พร้อมเปิดขายทันที!`);
      // Immediately remove the imported item so it disappears right away
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.externalId !== externalId),
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }));
      if (onImportSuccess) onImportSuccess(result.data);
    } catch (err) {
      toast.error(err.message || 'นำเข้าคอนเสิร์ตไม่สำเร็จ');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-modal-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#0f1017] shadow-2xl animate-in fade-in"
      >
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
              <Radar size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-200 border border-cyan-400/40">
                  Radar Auto-Discovery
                </span>
                <span className="text-xs text-gray-400">ตรวจจับคอนเสิร์ตและเฟสติวัลจริงในไทย 2026</span>
              </div>
              <h2 id="discovery-modal-title" className="mt-0.5 text-xl font-black text-white flex items-center gap-2">
                <span>ศูนย์ตรวจจับคอนเสิร์ตใหม่ในไทย</span>
                {data.pendingCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/40">
                    ค้นพบ {data.pendingCount} งานใหม่
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={fetchDiscovery}
              title="สแกนหาคอนเสิร์ตใหม่"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
              <span>สแกนเรดาร์</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs text-cyan-100 flex items-start gap-3">
            <Zap size={18} className="text-cyan-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ระบบเรดาร์ซิงก์ข้อมูลงานจริง (Live Concert Feeds)</p>
              <p className="mt-0.5 text-gray-300 leading-relaxed text-[11px]">
                ระบบตรวจพบคอนเสิร์ตจริงที่จัดขึ้นในประเทศไทย คุณสามารถกด <strong>"นำเข้าสู่ระบบใน 1 คลิก"</strong> เพื่อสร้างคอนเสิร์ต โซนที่นั่ง ราคา และไลน์อัปศิลปินจริงเข้าสู่ระบบ SoundWave Pass ได้ทันที
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-xs">
              <LoaderCircle className="animate-spin text-cyan-400 mb-2" size={24} />
              <span>กำลังสแกนค้นหาคอนเสิร์ตจริงในไทย…</span>
            </div>
          )}

          {!loading && (
            <>
              {data.items.filter((c) => !c.isImported).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-base font-bold text-white">นำเข้าคอนเสิร์ตจริงทั้งหมดเข้าสู่ระบบแล้ว!</h3>
                  <p className="mt-1 text-xs text-gray-400 max-w-sm">
                    คอนเสิร์ตที่ตรวจพบบนเรดาร์ทั้งหมดถูกนำเข้าสู่ระบบ SoundWave Pass เรียบร้อยแล้ว สามารถดูและจัดการได้ที่แท็บ "คอนเสิร์ต & ผังที่นั่ง"
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-black text-black hover:bg-cyan-200 transition-all cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.items
                    .filter((c) => !c.isImported)
                    .map((c) => {
                      const isImporting = importingId === c.externalId;
                      return (
                        <article
                          key={c.externalId}
                          className="rounded-3xl border border-cyan-400/30 bg-[#12131d] hover:border-cyan-400/60 ring-1 ring-cyan-400/20 p-4 sm:p-5 transition-all shadow-xl flex flex-col justify-between"
                        >
                          <div>
                            {/* Banner + Header */}
                            <div className="flex gap-4">
                              <div className="h-24 w-20 rounded-2xl bg-white/10 overflow-hidden shrink-0 border border-white/10">
                                <img src={c.bannerUrl} alt={c.name} className="h-full w-full object-cover" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40 animate-pulse">
                                    <Sparkles size={11} /> งานใหม่พร้อมนำเข้า
                                  </span>
                                </div>

                                <h3 className="mt-1 text-sm sm:text-base font-black text-white leading-tight">
                                  {c.name}
                                </h3>

                                <div className="mt-1 text-[11px] text-gray-400 space-y-0.5">
                                  <p className="flex items-center gap-1 text-cyan-200">
                                    <CalendarDays size={12} className="text-cyan-400 shrink-0" />
                                    <span>{new Date(c.eventDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  </p>
                                  <p className="flex items-center gap-1 truncate text-pink-200">
                                    <MapPin size={12} className="text-pink-400 shrink-0" />
                                    <span className="truncate">{c.venue || c.location}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Lineup & Zones Preview */}
                            <div className="mt-3.5 space-y-2 border-t border-white/5 pt-3 text-[11px]">
                              <div>
                                <span className="text-gray-400 font-semibold">ไฮไลท์ศิลปิน: </span>
                                <span className="text-gray-200">
                                  {c.lineup?.flatMap((s) => s.bands || []).map((b) => b.name).slice(0, 4).join(', ')}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {c.zones?.map((z, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-gray-300 border border-white/10"
                                  >
                                    {z.name} (฿{z.price.toLocaleString()})
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action button */}
                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-mono">
                              ID: {c.externalId}
                            </span>

                            <button
                              type="button"
                              disabled={isImporting}
                              onClick={() => handleImport(c.externalId, c.name)}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-3.5 py-2 text-xs font-black text-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
                            >
                              {isImporting ? <LoaderCircle size={13} className="animate-spin" /> : <Download size={13} />}
                              <span>{isImporting ? 'กำลังนำเข้า…' : '📥 นำเข้าสู่ระบบ (1 คลิก)'}</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
