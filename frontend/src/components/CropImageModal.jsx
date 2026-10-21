import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, RotateCcw, X, ZoomIn, Move } from 'lucide-react';

const BOX_WIDTH = 320;
const BOX_HEIGHT = 400;

export default function CropImageModal({ file, onCancel, onApply }) {
  const [source, setSource] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState('cover');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = dimensions
    ? (fitMode === 'cover' ? Math.max(BOX_WIDTH / dimensions.width, BOX_HEIGHT / dimensions.height) : Math.min(BOX_WIDTH / dimensions.width, BOX_HEIGHT / dimensions.height))
    : 1;
  const imageWidth = dimensions ? dimensions.width * baseScale * zoom : BOX_WIDTH;
  const imageHeight = dimensions ? dimensions.height * baseScale * zoom : BOX_HEIGHT;
  const left = (BOX_WIDTH - imageWidth) / 2 + offset.x;
  const top = (BOX_HEIGHT - imageHeight) / 2 + offset.y;

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  };
  const onPointerMove = (event) => {
    if (!dragRef.current || !dimensions) return;
    const nextX = dragRef.current.offsetX + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.offsetY + event.clientY - dragRef.current.y;
    const maxX = Math.max(0, (imageWidth - BOX_WIDTH) / 2);
    const maxY = Math.max(0, (imageHeight - BOX_HEIGHT) / 2);
    setOffset({ x: Math.min(maxX, Math.max(-maxX, nextX)), y: Math.min(maxY, Math.max(-maxY, nextY)) });
  };
  const changeZoom = (value) => {
    const nextZoom = Number(value);
    if (!dimensions || zoom === 0) { setZoom(nextZoom); return; }
    const ratio = nextZoom / zoom;
    const nextWidth = dimensions.width * baseScale * nextZoom;
    const nextHeight = dimensions.height * baseScale * nextZoom;
    const maxX = Math.max(0, (nextWidth - BOX_WIDTH) / 2);
    const maxY = Math.max(0, (nextHeight - BOX_HEIGHT) / 2);
    setOffset({ x: Math.min(maxX, Math.max(-maxX, offset.x * ratio)), y: Math.min(maxY, Math.max(-maxY, offset.y * ratio)) });
    setZoom(nextZoom);
  };

  const crop = async () => {
    if (!imageRef.current || !dimensions) return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1500;
      const context = canvas.getContext('2d');
      context.fillStyle = '#111119';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(imageRef.current, left * canvas.width / BOX_WIDTH, top * canvas.height / BOX_HEIGHT, imageWidth * canvas.width / BOX_WIDTH, imageHeight * canvas.height / BOX_HEIGHT);
      await onApply(canvas.toDataURL('image/jpeg', 0.88));
    } catch {
      setError('ครอปรูปไม่สำเร็จ ลองเลือกไฟล์ใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="crop-title" className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-100/15 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,211,238,0.12),_transparent_42%),#101018] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:p-6">
        <header className="mb-4 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Poster studio</p><h2 id="crop-title" className="mt-1 text-xl font-black">จัดกรอบรูปด้วยตัวเอง</h2><p className="mt-1 text-xs text-gray-400">ลากภาพเพื่อเลือกส่วนที่ต้องการแสดง แล้วปรับซูมได้ · 4:5</p></div><button type="button" onClick={onCancel} aria-label="ปิดหน้าครอบรูป" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={17} /></button></header>

        <div className="group relative mx-auto w-full max-w-[320px] cursor-grab overflow-hidden rounded-2xl border border-white/20 bg-[radial-gradient(ellipse_at_center,_#24303b,_#090b10)] shadow-[0_18px_55px_rgba(0,0,0,0.55)] active:cursor-grabbing" style={{ aspectRatio: '4 / 5', touchAction: 'none' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
          {source && <img ref={imageRef} src={source} alt="ครอบตัดโปสเตอร์" draggable="false" onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="pointer-events-none absolute max-w-none select-none" style={{ width: imageWidth, height: imageHeight, left, top }} />}
          <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 opacity-70"><i className="border-b border-r border-white/35" /><i className="border-b border-r border-white/35" /><i className="border-b border-white/35" /><i className="border-b border-r border-white/35" /><i className="border-b border-r border-white/35" /><i className="border-b border-white/35" /><i className="border-r border-white/35" /><i className="border-r border-white/35" /><i /></div>
          <div className="pointer-events-none absolute inset-0 z-20"><span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-black/65 px-3 py-2 text-[10px] font-semibold text-white/90 shadow-lg backdrop-blur"><Move size={13} />ลากภาพเพื่อจัดองค์ประกอบ</span><span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-bold tracking-wider text-white/80">4:5 POSTER</span></div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">จัดวางภาพ</span><div className="flex rounded-xl border border-white/10 bg-black/30 p-1"><button type="button" onClick={() => { setFitMode('contain'); setZoom(1); setOffset({ x: 0, y: 0 }); }} className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${fitMode === 'contain' ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}>เห็นทั้งรูป</button><button type="button" onClick={() => { setFitMode('cover'); setZoom(1); setOffset({ x: 0, y: 0 }); }} className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${fitMode === 'cover' ? 'bg-cyan-200 text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}>เต็มกรอบ</button></div></div>

        <div className="mt-5 flex items-center gap-3"><ZoomIn size={16} className="shrink-0 text-gray-400" /><input aria-label="ซูมโปสเตอร์" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => changeZoom(event.target.value)} className="w-full accent-cyan-200" /><span className="w-10 text-right text-[10px] text-gray-400">{zoom.toFixed(1)}×</span></div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-rose-400/10 p-2 text-xs text-rose-200">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-between gap-2"><button type="button" onClick={() => { setFitMode('cover'); setZoom(1); setOffset({ x: 0, y: 0 }); }} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"><RotateCcw size={13} />รีเซ็ต</button><div className="flex gap-2"><button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5">ยกเลิก</button><button type="button" onClick={crop} disabled={!dimensions || busy} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-200 to-sky-300 px-4 py-2 text-xs font-black text-[#071016] shadow-lg shadow-cyan-950/40 transition hover:brightness-110 disabled:opacity-50"><ImagePlus size={14} />{busy ? 'กำลังบันทึก…' : 'ใช้กรอบนี้'}</button></div></div>
      </section>
    </div>
  );
}
