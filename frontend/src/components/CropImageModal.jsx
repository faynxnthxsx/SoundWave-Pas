import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ImagePlus, RotateCcw, X, ZoomIn, Move, Maximize2, Smartphone, Monitor, User } from 'lucide-react';

const RATIO_CONFIGS = {
  poster: { label: '4:5 โปสเตอร์', icon: Smartphone, width: 320, height: 400, canvasW: 1200, canvasH: 1500 },
  banner: { label: '16:9 แบนเนอร์', icon: Monitor, width: 360, height: 202.5, canvasW: 1600, canvasH: 900 },
  square: { label: '1:1 จัตุรัส/ศิลปิน', icon: User, width: 320, height: 320, canvasW: 1000, canvasH: 1000 },
  original: { label: 'เต็มรูป (ไม่ตัดขอบ)', icon: Maximize2, width: 340, height: 340, canvasW: 1200, canvasH: 1200 },
};

export default function CropImageModal({ file, initialRatio = 'poster', onCancel, onApply }) {
  const [source, setSource] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [selectedRatio, setSelectedRatio] = useState(initialRatio || 'poster');
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState('cover'); // 'cover' | 'contain'
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const currentBox = RATIO_CONFIGS[selectedRatio] || RATIO_CONFIGS.poster;
  const boxW = currentBox.width;
  const boxH = currentBox.height;

  // Calculate scaling
  const baseScale = useMemo(() => {
    if (!dimensions) return 1;
    if (selectedRatio === 'original' || fitMode === 'contain') {
      return Math.min(boxW / dimensions.width, boxH / dimensions.height);
    }
    return Math.max(boxW / dimensions.width, boxH / dimensions.height);
  }, [dimensions, boxW, boxH, selectedRatio, fitMode]);

  const imageWidth = dimensions ? dimensions.width * baseScale * zoom : boxW;
  const imageHeight = dimensions ? dimensions.height * baseScale * zoom : boxH;
  const left = (boxW - imageWidth) / 2 + offset.x;
  const top = (boxH - imageHeight) / 2 + offset.y;

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || !dimensions) return;
    const nextX = dragRef.current.offsetX + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.offsetY + event.clientY - dragRef.current.y;
    const maxX = Math.max(0, (imageWidth - boxW) / 2);
    const maxY = Math.max(0, (imageHeight - boxH) / 2);
    setOffset({
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    });
  };

  const changeZoom = (value) => {
    const nextZoom = Number(value);
    if (!dimensions || zoom === 0) {
      setZoom(nextZoom);
      return;
    }
    const ratio = nextZoom / zoom;
    const nextWidth = dimensions.width * baseScale * nextZoom;
    const nextHeight = dimensions.height * baseScale * nextZoom;
    const maxX = Math.max(0, (nextWidth - boxW) / 2);
    const maxY = Math.max(0, (nextHeight - boxH) / 2);
    setOffset({
      x: Math.min(maxX, Math.max(-maxX, offset.x * ratio)),
      y: Math.min(maxY, Math.max(-maxY, offset.y * ratio)),
    });
    setZoom(nextZoom);
  };

  const handleRatioSwitch = (ratioKey) => {
    setSelectedRatio(ratioKey);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (ratioKey === 'original') setFitMode('contain');
    else setFitMode('cover');
  };

  const crop = async () => {
    if (!imageRef.current || !dimensions) return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = currentBox.canvasW;
      canvas.height = currentBox.canvasH;
      const context = canvas.getContext('2d');
      context.fillStyle = '#0a0a10';
      context.fillStyle = '#08080e';
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (fitMode === 'contain' || selectedRatio === 'original') {
        // Draw subtle blurred ambient background so empty borders look polished instead of harsh black
        try {
          context.save();
          context.filter = 'blur(40px) brightness(0.35)';
          context.drawImage(imageRef.current, -40, -40, canvas.width + 80, canvas.height + 80);
          context.restore();
        } catch { /* ignore fallback */ }
      }

      // Draw proportionally onto high-res export canvas
      const drawX = (left * canvas.width) / boxW;
      const drawY = (top * canvas.height) / boxH;
      const drawW = (imageWidth * canvas.width) / boxW;
      const drawH = (imageHeight * canvas.height) / boxH;

      context.drawImage(imageRef.current, drawX, drawY, drawW, drawH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      await onApply(dataUrl);
    } catch {
      setError('บันทึกรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  const useOriginalFile = () => {
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await onApply(e.target.result);
      } finally {
        setBusy(false);
      }
    };
    reader.onerror = () => {
      setError('ไม่สามารถอ่านไฟล์ต้นฉบับได้');
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-[#101018] p-5 sm:p-6 shadow-2xl"
      >
        <header className="mb-4 flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              Image Framing Studio
            </span>
            <h2 id="crop-title" className="mt-0.5 text-lg sm:text-xl font-black text-white">
              ปรับแต่งและจัดสัดส่วนรูปภาพ
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              เลือกสัดส่วนที่ต้องการ และลากภาพเพื่อเลือกส่วนสำคัญ ไม่ให้โดนตัดขอบ
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── Aspect Ratio Switcher ── */}
        <div className="mb-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            เลือกสัดส่วนรูปภาพ (Aspect Ratio):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(RATIO_CONFIGS).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = selectedRatio === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRatioSwitch(key)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'border-cyan-300 bg-cyan-300 text-black shadow-md shadow-cyan-300/30'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Visual Crop Frame ── */}
        <div className="relative mx-auto flex items-center justify-center p-3 rounded-2xl bg-black/40 border border-white/5 overflow-hidden">
          <div
            className="group relative cursor-grab overflow-hidden rounded-xl border-2 border-dashed border-cyan-400/60 bg-[#07070b] shadow-2xl active:cursor-grabbing transition-all"
            style={{
              width: `${boxW}px`,
              height: `${boxH}px`,
              touchAction: 'none',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            {source && (
              <img
                ref={imageRef}
                src={source}
                alt="พรีวิวรูปภาพ"
                draggable="false"
                onLoad={(event) =>
                  setDimensions({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
                className="pointer-events-none absolute max-w-none select-none transition-transform"
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  left,
                  top,
                }}
              />
            )}

            {/* Rule of Thirds Grid */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
              <i className="border-b border-r border-white/30" />
              <i className="border-b border-r border-white/30" />
              <i className="border-b border-white/30" />
              <i className="border-b border-r border-white/30" />
              <i className="border-b border-r border-white/30" />
              <i className="border-b border-white/30" />
              <i className="border-r border-white/30" />
              <i className="border-r border-white/30" />
              <i />
            </div>

            {/* Overlay hint */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur border border-white/10 flex items-center gap-1.5 whitespace-nowrap">
              <Move size={12} className="text-cyan-300" />
              <span>คลิกลากเพื่อเลื่อนตำแหน่งภาพ</span>
            </div>
          </div>
        </div>

        {/* ── Fit Mode & Zoom Controls ── */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400">การแสดงผล:</span>
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setFitMode('contain');
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  fitMode === 'contain' ? 'bg-white text-black font-bold shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                เห็นทั้งรูป (ไม่ตัดขอบ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode('cover');
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  fitMode === 'cover' ? 'bg-cyan-300 text-black font-bold shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                เต็มกรอบ (Crop)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[160px] justify-end">
            <ZoomIn size={14} className="text-gray-400" />
            <input
              aria-label="ซูมรูปภาพ"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => changeZoom(event.target.value)}
              className="w-28 sm:w-36 accent-cyan-300 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-gray-300 min-w-8 text-right">
              {zoom.toFixed(1)}×
            </span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-400/10 p-2 text-xs text-rose-200 border border-rose-400/20">
            {error}
          </p>
        )}

        {/* ── Footer Actions ── */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10"
          >
            <RotateCcw size={13} />
            <span>รีเซ็ตตำแหน่ง</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={useOriginalFile}
              disabled={busy}
              title="ใช้ภาพขนาดและสัดส่วนต้นฉบับ 100% โดยไม่ต้องตัดขอบใดๆ"
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-50"
            >
              <Maximize2 size={13} className="text-cyan-300" />
              <span>ใช้รูปต้นฉบับ (ไม่ตัดขอบ)</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={crop}
              disabled={!dimensions || busy}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-2 text-xs font-black text-black shadow-lg shadow-cyan-400/25 transition-all hover:brightness-110 disabled:opacity-50"
            >
              <ImagePlus size={14} />
              <span>{busy ? 'กำลังบันทึก…' : 'ใช้รูปที่ครอบตัดนี้'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
