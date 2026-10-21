import React from 'react';
import { MapPinned } from 'lucide-react';

const truncate = (text, max = 17) => text.length > max ? `${text.slice(0, max - 1)}…` : text;

export default function StadiumZoneMap({ zones, selectedZoneId, onSelect }) {
  const seats = zones.filter((zone) => zone.category === 'SEATED');
  const standing = zones.filter((zone) => zone.category === 'STANDING');
  const camping = zones.filter((zone) => zone.category === 'CAMPING');
  const other = zones.filter((zone) => !['SEATED', 'STANDING', 'CAMPING'].includes(zone.category));
  const zoneProps = (zone) => ({
    role: 'button', tabIndex: zone.available > 0 ? 0 : -1,
    'aria-label': `${zone.name}, ฿${zone.price}, ${zone.available > 0 ? `เหลือ ${zone.available} ใบ` : 'บัตรหมด'}`,
    onClick: () => zone.available > 0 && onSelect(zone),
    onKeyDown: (event) => { if ((event.key === 'Enter' || event.key === ' ') && zone.available > 0) { event.preventDefault(); onSelect(zone); } },
    style: { cursor: zone.available > 0 ? 'pointer' : 'not-allowed' },
  });
  const zoneColor = (zone, fallback) => zone.colorCode || fallback;
  const zoneFill = (zone, fallback) => zone.available <= 0 ? '#414653' : zone.id === selectedZoneId ? '#f8d477' : zoneColor(zone, fallback);
  const labelColor = (zone) => zone.id === selectedZoneId ? '#211a0a' : '#fff';
  const seatedBox = (zone, index, count) => {
    const columns = Math.min(4, count);
    const rows = Math.ceil(count / columns);
    const col = index % columns;
    const row = Math.floor(index / columns);
    const width = 500 / columns - 12;
    const height = Math.min(48, 126 / rows - 8);
    return { x: 150 + col * (500 / columns) + 6, y: 294 + row * 126 / rows + 5, width, height };
  };
  const standingBox = (index, count) => {
    const width = 500 / count - 10;
    return { x: 150 + index * (500 / count) + 5, y: 213, width, height: 64 };
  };

  return <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10141a] shadow-2xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">SOUNDWAVE LIVE ARENA</p><h2 className="mt-1 text-lg font-black text-white">เลือกโซนจากผังคอนเสิร์ต</h2><p className="mt-1 text-[10px] text-gray-400">แตะพื้นที่บนผังเพื่อดูราคาและเลือกบัตร</p></div><div className="flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-200/[0.06] px-3 py-1.5 text-[10px] font-semibold text-cyan-50"><MapPinned size={13} className="text-cyan-200"/>LIVE STAGE MAP</div></div>
    <div className="overflow-x-auto bg-[radial-gradient(ellipse_at_top,_#202533_0%,_#0d1218_70%)] p-2 sm:p-4">
      <svg viewBox="0 0 800 570" role="img" aria-label="ผังเวทีคอนเสิร์ตและโซนบัตร" className="mx-auto min-w-[580px] max-w-[850px]">
        <defs><linearGradient id="concert-floor" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#282437"/><stop offset="1" stopColor="#171a25"/></linearGradient><linearGradient id="concert-stage" x1="0" x2="1"><stop stopColor="#a855f7"/><stop offset=".5" stopColor="#e879f9"/><stop offset="1" stopColor="#22d3ee"/></linearGradient><radialGradient id="stage-light"><stop stopColor="#df8fff" stopOpacity=".26"/><stop offset="1" stopColor="#df8fff" stopOpacity="0"/></radialGradient><pattern id="seats" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#fff" fillOpacity=".19"/></pattern></defs>
        <rect x="84" y="36" width="632" height="500" rx="38" fill="url(#concert-floor)" stroke="#414253" strokeWidth="2"/>
        <path d="M150 190 L250 104 L550 104 L650 190" fill="url(#stage-light)"/>
        <path d="M270 124 L400 211 L530 124" fill="none" stroke="#d78bff" strokeOpacity=".25" strokeWidth="2" strokeDasharray="5 8"/>
        <rect x="268" y="55" width="264" height="74" rx="18" fill="#0c0e16" stroke="#8e78a9" strokeWidth="2"/>
        <rect x="279" y="64" width="242" height="51" rx="12" fill="url(#concert-stage)"/>
        <path d="M304 106 Q400 80 496 106" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2"/>
        <text x="400" y="88" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900" letterSpacing="2">MAIN STAGE</text><text x="400" y="104" textAnchor="middle" fill="#fff" fillOpacity=".82" fontSize="8" fontWeight="700" letterSpacing="2">SOUNDWAVE LIVE</text>
        <rect x="221" y="145" width="26" height="37" rx="5" fill="#0b101a" stroke="#7f8295"/><rect x="553" y="145" width="26" height="37" rx="5" fill="#0b101a" stroke="#7f8295"/><text x="234" y="168" textAnchor="middle" fill="#aeb4c6" fontSize="7">L</text><text x="566" y="168" textAnchor="middle" fill="#aeb4c6" fontSize="7">R</text>
        <text x="400" y="199" textAnchor="middle" fill="#c3c1d0" fontSize="9" fontWeight="700" letterSpacing="3">FRONT OF STAGE</text>
        {standing.map((zone, index) => { const b = standingBox(index, standing.length); const selected = zone.id === selectedZoneId; return <g key={zone.id} {...zoneProps(zone)}><rect {...b} rx="17" fill={zoneFill(zone, '#ce668d')} fillOpacity={zone.available <= 0 ? .4 : selected ? .98 : .8} stroke={selected ? '#fff4c9' : '#ffd4e4'} strokeOpacity={selected ? 1 : .45} strokeWidth={selected ? 3 : 1.3} className="transition-all hover:brightness-125 focus:outline-none"/><rect x={b.x+8} y={b.y+8} width={b.width-16} height={b.height-16} rx="11" fill="url(#seats)" pointerEvents="none"/><text x={b.x+b.width/2} y={b.y+27} textAnchor="middle" fill={labelColor(zone)} fontSize="11" fontWeight="900" pointerEvents="none">{truncate(zone.name)}</text><text x={b.x+b.width/2} y={b.y+46} textAnchor="middle" fill={labelColor(zone)} fontSize="10" fontWeight="700" pointerEvents="none">{zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()}`}</text></g>; })}
        <text x="400" y="293" textAnchor="middle" fill="#8f91a1" fontSize="8" fontWeight="700" letterSpacing="3">SEATED VIEWING</text>
        {seats.map((zone, index) => { const b = seatedBox(zone, index, seats.length); const selected = zone.id === selectedZoneId; return <g key={zone.id} {...zoneProps(zone)}><rect {...b} rx="13" fill={zoneFill(zone, '#687d9d')} fillOpacity={zone.available <= 0 ? .45 : selected ? .98 : .8} stroke={selected ? '#fff4c9' : '#b5c7df'} strokeOpacity={selected ? 1 : .42} strokeWidth={selected ? 3 : 1.2} className="transition-all hover:brightness-125 focus:outline-none"/><rect x={b.x+5} y={b.y+5} width={b.width-10} height={b.height-10} rx="9" fill="url(#seats)" pointerEvents="none"/><text x={b.x+b.width/2} y={b.y+b.height/2-2} textAnchor="middle" fill={labelColor(zone)} fontSize={b.width < 125 ? 8 : 10} fontWeight="800" pointerEvents="none">{truncate(zone.name, b.width < 125 ? 13 : 17)}</text><text x={b.x+b.width/2} y={b.y+b.height/2+13} textAnchor="middle" fill={labelColor(zone)} fontSize="9" fontWeight="700" pointerEvents="none">{zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()}`}</text></g>; })}
        {other.map((zone, index) => { const b = { x: 150 + index * (500 / Math.max(other.length,1)) + 5, y: 437, width: 500 / Math.max(other.length,1) - 10, height: 43 }; const selected = zone.id === selectedZoneId; return <g key={zone.id} {...zoneProps(zone)}><rect {...b} rx="13" fill={zoneFill(zone, '#777090')} stroke={selected ? '#fff4c9' : '#dad4ef'} strokeOpacity=".55" strokeWidth={selected ? 3 : 1.2} className="hover:brightness-125"/><text x={b.x+b.width/2} y="455" textAnchor="middle" fill={labelColor(zone)} fontSize="9" fontWeight="800" pointerEvents="none">{truncate(zone.name, 15)}</text><text x={b.x+b.width/2} y="470" textAnchor="middle" fill={labelColor(zone)} fontSize="8" pointerEvents="none">{zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()}`}</text></g>; })}
        {camping.map((zone, index) => { const b = { x: 150 + index * (500 / Math.max(camping.length,1)) + 5, y: 489, width: 500 / Math.max(camping.length,1) - 10, height: 34 }; const selected = zone.id === selectedZoneId; return <g key={zone.id} {...zoneProps(zone)}><rect {...b} rx="12" fill={zoneFill(zone, '#598d73')} stroke={selected ? '#fff4c9' : '#a8d4b7'} strokeOpacity=".55" strokeWidth={selected ? 3 : 1}/><text x={b.x+b.width/2} y="511" textAnchor="middle" fill={labelColor(zone)} fontSize="9" fontWeight="800" pointerEvents="none">{truncate(zone.name, 16)} · {zone.available <= 0 ? 'หมด' : `฿${zone.price.toLocaleString()}`}</text></g>; })}
        <path d="M118 502 L118 456" stroke="#8e91a1" strokeWidth="2"/><path d="M110 465 L118 455 L126 465" fill="none" stroke="#8e91a1" strokeWidth="2"/><text x="118" y="520" textAnchor="middle" fill="#aeb0bf" fontSize="8" fontWeight="700">ENTRANCE</text>
      </svg>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 px-5 py-3 text-[10px] text-gray-400"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#ce668d]"/>โซนยืนหน้าเวที</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#687d9d]"/>โซนนั่ง</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#598d73]"/>โซนแคมป์</span><span className="ml-auto">คลิกพื้นที่บนผังเพื่อเลือกโซน</span></div>
  </section>;
}
