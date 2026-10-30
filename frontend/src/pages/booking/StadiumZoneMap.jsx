import React from 'react';
import { MapPinned, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const truncate = (text = '', max = 20) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function detectVenueProfile(venue = '', concertName = '', zones = []) {
  const combined = `${venue} ${concertName}`.toLowerCase();
  const hasCamping = zones.some((z) => z.category === 'CAMPING');

  if (
    hasCamping ||
    combined.includes('oasis') ||
    combined.includes('festival') ||
    combined.includes('wonderfruit') ||
    combined.includes('big mountain') ||
    combined.includes('หาด') ||
    combined.includes('wisdom valley') ||
    combined.includes('rhythm park')
  ) {
    return {
      type: 'FESTIVAL',
      titleTh: 'ผังลานเทศกาลดนตรีกลางแจ้ง (Outdoor Festival Grounds)',
      titleEn: 'Outdoor Festival & Camping Grounds Layout',
      badgeTh: 'ผังตามสถานที่จริง: ลานเอาต์ดอร์ & แคมป์ปิ้ง',
      badgeEn: 'Real Venue: Outdoor Festival Arena',
      stageLabel: 'MAIN NEON STAGE & SIDE STAGES',
    };
  }

  if (
    combined.includes('ราชมัง') ||
    combined.includes('rajamangala') ||
    combined.includes('สเตเดียม') ||
    combined.includes('stadium') ||
    combined.includes('ศุภชลาศัย') ||
    combined.includes('bigbang') ||
    combined.includes('bts')
  ) {
    return {
      type: 'STADIUM',
      titleTh: 'ผังสนามกีฬาสเตเดียมใหญ่ (Stadium Bowl & Pitch Layout)',
      titleEn: 'Grand Stadium Bowl & Pitch Layout',
      badgeTh: 'ผังตามสถานที่จริง: สนามราชมังคลา / สเตเดียม',
      badgeEn: 'Real Venue: Grand Stadium Bowl',
      stageLabel: 'GRAND STADIUM MAIN STAGE',
    };
  }

  return {
    type: 'ARENA',
    titleTh: 'ผังอินดอร์อารีน่าฮอลล์ & เวทีแคทวอล์ก (Indoor Arena & T-Stage)',
    titleEn: 'Indoor Arena Hall & Extended T-Stage Layout',
    badgeTh: 'ผังตามสถานที่จริง: อิมแพ็ค อารีน่า / ฮอลล์ในร่ม',
    badgeEn: 'Real Venue: Indoor Arena Hall',
    stageLabel: 'ARENA MAIN STAGE + EXTENDED CATWALK',
  };
}

export default function StadiumZoneMap({ zones = [], selectedZoneId, onSelect, venueName = '', concertName = '' }) {
  const { t } = useLanguage();
  const profile = detectVenueProfile(venueName, concertName, zones);

  const seats = zones.filter((zone) => ['SEATED', 'VIP', 'VVIP'].includes(zone.category));
  const standing = zones.filter((zone) => zone.category === 'STANDING');
  const camping = zones.filter((zone) => zone.category === 'CAMPING');
  const other = zones.filter((zone) => !['SEATED', 'VIP', 'VVIP', 'STANDING', 'CAMPING'].includes(zone.category));

  const zoneProps = (zone) => {
    const isPaused = zone.isActive === false;
    const canSelect = zone.available > 0 && !isPaused;
    return {
      role: 'button',
      tabIndex: canSelect ? 0 : -1,
      'aria-label': `${zone.name}, ฿${zone.price}, ${isPaused ? 'Paused' : zone.available > 0 ? `${zone.available} available` : 'Sold out'}`,
      onClick: () => canSelect && onSelect(zone),
      onKeyDown: (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && canSelect) {
          event.preventDefault();
          onSelect(zone);
        }
      },
      style: { cursor: canSelect ? 'pointer' : 'not-allowed' },
    };
  };

  const zoneColor = (zone, fallback) => zone.colorCode || fallback;
  const zoneFill = (zone, fallback) =>
    zone.isActive === false
      ? '#2e303d'
      : zone.available <= 0
      ? '#414653'
      : zone.id === selectedZoneId
      ? '#f8d477'
      : zoneColor(zone, fallback);
  const labelColor = (zone) => (zone.id === selectedZoneId ? '#151105' : '#ffffff');

  // Position Standing zones depending on venue profile
  const getStandingBox = (index, count) => {
    if (profile.type === 'ARENA' && count >= 2) {
      // Split left and right around the central T-Stage catwalk!
      const isLeft = index % 2 === 0;
      const row = Math.floor(index / 2);
      return {
        x: isLeft ? 150 : 445,
        y: 175 + row * 70,
        width: 205,
        height: 62,
      };
    }
    const width = 500 / Math.max(count, 1) - 10;
    return { x: 150 + index * (500 / Math.max(count, 1)) + 5, y: 195, width, height: 68 };
  };

  // Position Seated / VIP zones around the stadium/arena bowl
  const getSeatedBox = (index, count) => {
    if (profile.type === 'STADIUM' && count >= 2) {
      // Curved stadium bowl: Left Wing, Center Grandstand, Right Wing
      if (count === 2) {
        return index === 0
          ? { x: 135, y: 295, width: 255, height: 86 }
          : { x: 410, y: 295, width: 255, height: 86 };
      }
    }
    const columns = Math.min(3, Math.max(count, 1));
    const rows = Math.ceil(count / columns);
    const col = index % columns;
    const row = Math.floor(index / columns);
    const width = 520 / columns - 12;
    const height = Math.min(64, 136 / rows - 8);
    return { x: 140 + col * (520 / columns) + 6, y: 295 + row * (136 / rows) + 5, width, height };
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-cyan-400/25 bg-[#0e121a] shadow-2xl">
      {/* Venue Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
              <Compass size={11} />
              {t(profile.badgeTh, profile.badgeEn)}
            </span>
            {venueName && (
              <span className="text-xs font-semibold text-pink-300">
                📍 {venueName}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg sm:text-xl font-black text-white">
            {t('ขั้นตอนที่ 1: คลิกเลือกโซนจากผังสถานที่จัดงานจริง', 'Step 1: Select a Zone on the Real Venue Map')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {t(
              'คลิกโซนที่ต้องการบนผังด้านล่าง เพื่อเปิดผังเลือกเก้าอี้/ที่นั่งของโซนนั้นในขั้นตอนที่ 2',
              'Click any zone on the venue map below to open the interactive seat picker in Step 2'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-2 text-xs font-bold text-cyan-100">
          <MapPinned size={15} className="text-cyan-300" />
          <span>{t(profile.titleTh.split('(')[0], profile.titleEn)}</span>
        </div>
      </div>

      {/* Interactive SVG Venue Layout */}
      <div className="overflow-x-auto bg-[radial-gradient(ellipse_at_top,_#1e2638_0%,_#090d14_72%)] p-3 sm:p-5">
        <svg
          viewBox="0 0 800 580"
          role="img"
          aria-label={t('ผังเวทีคอนเสิร์ตและโซนบัตรตามสถานที่จริง', 'Concert venue stage and zone layout')}
          className="mx-auto min-w-[600px] max-w-[860px]"
        >
          <defs>
            <linearGradient id="concert-floor" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#232036" />
              <stop offset="1" stopColor="#121520" />
            </linearGradient>
            <linearGradient id="concert-stage" x1="0" x2="1">
              <stop stopColor="#06b6d4" />
              <stop offset=".5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
            <radialGradient id="stage-light">
              <stop stopColor="#38bdf8" stopOpacity=".28" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <pattern id="seats" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.3" fill="#fff" fillOpacity=".22" />
            </pattern>
          </defs>

          {/* Outer Stadium / Arena Architecture */}
          {profile.type === 'STADIUM' ? (
            <>
              {/* Curved Grand Stadium Bowl */}
              <path
                d="M 80 120 Q 400 20 720 120 L 740 460 Q 400 565 60 460 Z"
                fill="url(#concert-floor)"
                stroke="#4b5563"
                strokeWidth="2.5"
              />
              {/* Running Track / Stadium Field Inner Ring */}
              <rect x="125" y="150" width="550" height="310" rx="95" fill="#13221c" fillOpacity="0.55" stroke="#34d399" strokeOpacity="0.25" strokeDasharray="6 6" />
            </>
          ) : (
            <rect x="76" y="32" width="648" height="512" rx="42" fill="url(#concert-floor)" stroke="#414558" strokeWidth="2.5" />
          )}

          {/* Stage Spotlight Cone */}
          <path d="M140 195 L250 100 L550 100 L660 195" fill="url(#stage-light)" />

          {/* Main Stage Structure */}
          <rect x="235" y="48" width="330" height="72" rx="18" fill="#090b12" stroke="#93c5fd" strokeOpacity=".5" strokeWidth="2" />
          <rect x="247" y="57" width="306" height="52" rx="12" fill="url(#concert-stage)" />
          <text x="400" y="81" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900" letterSpacing="2">
            {profile.stageLabel}
          </text>
          <text x="400" y="98" textAnchor="middle" fill="#fff" fillOpacity=".9" fontSize="8.5" fontWeight="700" letterSpacing="1.5">
            {truncate(venueName || concertName || 'SOUNDWAVE LIVE', 42)}
          </text>

          {/* Extended T-Stage Catwalk for Indoor Arena */}
          {profile.type === 'ARENA' && (
            <g>
              <rect x="366" y="118" width="68" height="122" rx="8" fill="url(#concert-stage)" stroke="#e0f2fe" strokeWidth="1.5" />
              <circle cx="400" cy="236" r="24" fill="url(#concert-stage)" stroke="#fff" strokeWidth="2" />
              <text x="400" y="182" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900" letterSpacing="1.5" transform="rotate(-90 400 182)">
                CATWALK
              </text>
              <text x="400" y="239" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="900">
                B-STAGE
              </text>
            </g>
          )}

          {/* Side Screens (L / R LED Towers) */}
          <rect x="180" y="65" width="42" height="32" rx="6" fill="#0f172a" stroke="#38bdf8" strokeOpacity=".6" />
          <rect x="578" y="65" width="42" height="32" rx="6" fill="#0f172a" stroke="#38bdf8" strokeOpacity=".6" />
          <text x="201" y="84" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontWeight="800">LED L</text>
          <text x="599" y="84" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontWeight="800">LED R</text>

          {/* Section Label: Front of Stage / Standing Pits */}
          {standing.length > 0 && (
            <text x="400" y="162" textAnchor="middle" fill="#bae6fd" fontSize="9.5" fontWeight="800" letterSpacing="2.5">
              {t('โซนยืนชิดขอบเวที (STANDING / PIT ZONES)', 'FRONT OF STAGE — STANDING PITS')}
            </text>
          )}

          {/* Standing Zones */}
          {standing.map((zone, index) => {
            const b = getStandingBox(index, standing.length);
            const selected = zone.id === selectedZoneId;
            return (
              <g key={zone.id} {...zoneProps(zone)}>
                <rect
                  {...b}
                  rx="16"
                  fill={zoneFill(zone, '#06b6d4')}
                  fillOpacity={zone.available <= 0 ? 0.4 : selected ? 0.98 : 0.82}
                  stroke={selected ? '#ffffff' : '#bae6fd'}
                  strokeOpacity={selected ? 1 : 0.55}
                  strokeWidth={selected ? 3.5 : 1.5}
                  className="transition-all hover:brightness-125 focus:outline-none"
                />
                <rect x={b.x + 7} y={b.y + 7} width={b.width - 14} height={b.height - 14} rx="11" fill="url(#seats)" pointerEvents="none" />
                <text x={b.x + b.width / 2} y={b.y + 24} textAnchor="middle" fill={labelColor(zone)} fontSize="11.5" fontWeight="900" pointerEvents="none">
                  {truncate(zone.name, 22)}
                </text>
                <text x={b.x + b.width / 2} y={b.y + 42} textAnchor="middle" fill={labelColor(zone)} fontSize="10.5" fontWeight="800" pointerEvents="none">
                  {zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()} · ${t(`ว่าง ${zone.available}`, `${zone.available} left`)}`}
                </text>
                <text x={b.x + b.width / 2} y={b.y + 56} textAnchor="middle" fill={labelColor(zone)} fillOpacity="0.85" fontSize="8.5" fontWeight="700" pointerEvents="none">
                  {selected ? t('✓ เลือกโซนนี้แล้ว (ดูที่นั่งด้านล่าง)', '✓ Selected (Pick below)') : t('👆 คลิกเพื่อเลือกโซนนี้', '👆 Click to select zone')}
                </text>
              </g>
            );
          })}

          {/* FOH Sound Mixing Booth */}
          <rect x="355" y="268" width="90" height="18" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
          <text x="400" y="280" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="700" letterSpacing="1.5">
            FOH SOUND & LIGHT CONTROL
          </text>

          {/* Seated / VIP Grandstand Zones */}
          {seats.map((zone, index) => {
            const b = getSeatedBox(index, seats.length);
            const selected = zone.id === selectedZoneId;
            return (
              <g key={zone.id} {...zoneProps(zone)}>
                <rect
                  {...b}
                  rx="16"
                  fill={zoneFill(zone, '#ec4899')}
                  fillOpacity={zone.available <= 0 ? 0.45 : selected ? 0.98 : 0.85}
                  stroke={selected ? '#ffffff' : '#fbcfe8'}
                  strokeOpacity={selected ? 1 : 0.55}
                  strokeWidth={selected ? 3.5 : 1.5}
                  className="transition-all hover:brightness-125 focus:outline-none"
                />
                <rect x={b.x + 6} y={b.y + 6} width={b.width - 12} height={b.height - 12} rx="11" fill="url(#seats)" pointerEvents="none" />
                <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 6} textAnchor="middle" fill={labelColor(zone)} fontSize="11" fontWeight="900" pointerEvents="none">
                  💺 {truncate(zone.name, 24)}
                </text>
                <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 11} textAnchor="middle" fill={labelColor(zone)} fontSize="10" fontWeight="800" pointerEvents="none">
                  {zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()} · ${t(`ว่าง ${zone.available} ที่นั่ง`, `${zone.available} seats left`)}`}
                </text>
                <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 25} textAnchor="middle" fill={labelColor(zone)} fillOpacity="0.9" fontSize="8" fontWeight="700" pointerEvents="none">
                  {selected ? t('✓ กำลังเลือกที่นั่งในโซนนี้', '✓ Picking seats in this zone') : t('👆 คลิกเพื่อเปิดผังที่นั่งโซนนี้', '👆 Click to pick seats')}
                </text>
              </g>
            );
          })}

          {/* Other Special Zones */}
          {other.map((zone, index) => {
            const b = {
              x: 140 + index * (520 / Math.max(other.length, 1)) + 5,
              y: 438,
              width: 520 / Math.max(other.length, 1) - 10,
              height: 44,
            };
            const selected = zone.id === selectedZoneId;
            return (
              <g key={zone.id} {...zoneProps(zone)}>
                <rect
                  {...b}
                  rx="13"
                  fill={zoneFill(zone, '#8b5cf6')}
                  stroke={selected ? '#fff' : '#ddd6fe'}
                  strokeWidth={selected ? 3 : 1.2}
                />
                <text x={b.x + b.width / 2} y="457" textAnchor="middle" fill={labelColor(zone)} fontSize="9.5" fontWeight="800" pointerEvents="none">
                  {truncate(zone.name, 20)}
                </text>
                <text x={b.x + b.width / 2} y="472" textAnchor="middle" fill={labelColor(zone)} fontSize="8.5" pointerEvents="none">
                  {zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()}`}
                </text>
              </g>
            );
          })}

          {/* Camping Grounds */}
          {camping.map((zone, index) => {
            const b = {
              x: 140 + index * (520 / Math.max(camping.length, 1)) + 5,
              y: 490,
              width: 520 / Math.max(camping.length, 1) - 10,
              height: 42,
            };
            const selected = zone.id === selectedZoneId;
            return (
              <g key={zone.id} {...zoneProps(zone)}>
                <rect
                  {...b}
                  rx="14"
                  fill={zoneFill(zone, '#10b981')}
                  stroke={selected ? '#fff' : '#a7f3d0'}
                  strokeWidth={selected ? 3 : 1.5}
                />
                <text x={b.x + b.width / 2} y="510" textAnchor="middle" fill={labelColor(zone)} fontSize="10" fontWeight="900" pointerEvents="none">
                  ⛺ {truncate(zone.name, 24)} · {zone.available <= 0 ? 'SOLD OUT' : `฿${zone.price.toLocaleString()}`}
                </text>
                <text x={b.x + b.width / 2} y="524" textAnchor="middle" fill={labelColor(zone)} fontSize="8" fontWeight="700" pointerEvents="none">
                  {t('คลิกเพื่อเลือกโซนแคมป์ปิ้ง', 'Click to select camping zone')}
                </text>
              </g>
            );
          })}

          {/* Entrance Gates Indicator */}
          <text x="400" y="558" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="700" letterSpacing="2">
            ▲ MAIN ENTRANCE GATES & SECURITY CHECK-IN ▲
          </text>
        </svg>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 bg-black/30 px-5 py-3 text-[11px] text-gray-300">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-cyan-400" />
          {t('โซนยืน (Standing Pit)', 'Standing Pit')}
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-pink-500" />
          {t('อัฒจันทร์นั่ง / VIP (Seated / VIP)', 'Seated / VIP Stand')}
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-emerald-400" />
          {t('โซนแคมป์ปิ้ง (Camping)', 'Camping Zone')}
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-[#f8d477] ring-2 ring-white" />
          {t('โซนที่เลือกอยู่', 'Selected Zone')}
        </span>
        <span className="ml-auto font-bold text-cyan-300">
          {t('💡 คลิกที่โซนบนผังเพื่อเปิดเลือกที่นั่งในขั้นตอนที่ 2', '💡 Click a zone on the map to pick seats in Step 2')}
        </span>
      </div>
    </section>
  );
}
