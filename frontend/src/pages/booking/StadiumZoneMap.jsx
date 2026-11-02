import React, { useState } from 'react';
import { MapPinned, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const truncate = (text = '', max = 22) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

// Convert polar angle (0 deg = right/east, 90 deg = bottom/south, 180 deg = left/west, 270 deg = top/north)
function ellipsePoint(cx, cy, rx, ry, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + rx * Math.cos(rad),
    y: cy + ry * Math.sin(rad),
  };
}

// Generate an SVG path for an elliptical annular sector (curved stadium/arena block)
function createEllipticalSectorPath(cx, cy, rxIn, ryIn, rxOut, ryOut, startDeg, endDeg) {
  const p1 = ellipsePoint(cx, cy, rxOut, ryOut, startDeg);
  const p2 = ellipsePoint(cx, cy, rxOut, ryOut, endDeg);
  const p3 = ellipsePoint(cx, cy, rxIn, ryIn, endDeg);
  const p4 = ellipsePoint(cx, cy, rxIn, ryIn, startDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweepOut = endDeg >= startDeg ? 1 : 0;
  const sweepIn = endDeg >= startDeg ? 0 : 1;

  return [
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `A ${rxOut} ${ryOut} 0 ${largeArc} ${sweepOut} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `A ${rxIn} ${ryIn} 0 ${largeArc} ${sweepIn} ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function getSectorCenter(cx, cy, rxIn, ryIn, rxOut, ryOut, startDeg, endDeg) {
  const midDeg = (startDeg + endDeg) / 2;
  const midRx = (rxIn + rxOut) / 2;
  const midRy = (ryIn + ryOut) / 2;
  return ellipsePoint(cx, cy, midRx, midRy, midDeg);
}

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
    combined.includes('tomorrowland') ||
    combined.includes('rhythm park')
  ) {
    return {
      type: 'FESTIVAL',
      titleTh: 'ผังลานเทศกาลดนตรีกลางแจ้ง (Outdoor Festival Grounds)',
      titleEn: 'Outdoor Festival & Camping Grounds Layout',
      badgeTh: 'ผังตามสถานที่จริง: ลานเอาต์ดอร์ & แคมป์ปิ้ง',
      badgeEn: 'Real Venue: Outdoor Festival Arena',
      stageLabel: 'MAIN NEON STAGE',
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
      titleTh: 'ผังสนามกีฬาสเตเดียมใหญ่ (Grand Stadium Bowl)',
      titleEn: 'Grand Stadium Bowl & Pitch Layout',
      badgeTh: 'ผังตามสถานที่จริง: ราชมังคลากีฬาสถาน / สเตเดียม',
      badgeEn: 'Real Venue: Grand Stadium Bowl',
      stageLabel: 'GRAND STADIUM MAIN STAGE',
    };
  }

  return {
    type: 'ARENA',
    titleTh: 'ผังอินดอร์อารีน่าฮอลล์ (Indoor Arena Bowl & T-Stage)',
    titleEn: 'Indoor Arena Horseshoe Bowl & T-Stage Layout',
    badgeTh: 'ผังตามสถานที่จริง: อิมแพ็ค อารีน่า / ฮอลล์ในร่ม',
    badgeEn: 'Real Venue: Indoor Arena Hall',
    stageLabel: 'MAIN STAGE',
  };
}

export default function StadiumZoneMap({
  zones = [],
  selectedZoneId,
  onSelect,
  venueName = '',
  concertName = '',
}) {
  const { t, trData } = useLanguage();
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const profile = detectVenueProfile(venueName, concertName, zones);

  const seats = zones.filter((zone) => ['SEATED', 'VIP', 'VVIP'].includes(zone.category));
  const standing = zones.filter((zone) => zone.category === 'STANDING');
  const camping = zones.filter((zone) => zone.category === 'CAMPING');
  const other = zones.filter(
    (zone) => !['SEATED', 'VIP', 'VVIP', 'STANDING', 'CAMPING'].includes(zone.category)
  );
  const seatedPool = seats.length > 0 ? seats : other.length > 0 ? other : zones;

  const zoneProps = (zone) => {
    if (!zone) return {};
    const isPaused = zone.isActive === false;
    const canSelect = zone.available > 0 && !isPaused;
    return {
      role: 'button',
      tabIndex: canSelect ? 0 : -1,
      'aria-label': `${zone.name}, ฿${zone.price}, ${
        isPaused ? 'Paused' : zone.available > 0 ? `${zone.available} available` : 'Sold out'
      }`,
      onClick: () => canSelect && onSelect(zone),
      onMouseEnter: () => setHoveredZoneId(zone.id),
      onMouseLeave: () => setHoveredZoneId(null),
      onKeyDown: (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && canSelect) {
          event.preventDefault();
          onSelect(zone);
        }
      },
      style: { cursor: canSelect ? 'pointer' : 'not-allowed' },
    };
  };

  const getZoneFill = (zone, fallback) => {
    if (!zone) return '#272a36';
    if (zone.isActive === false) return '#2e303d';
    if (zone.available <= 0) return '#3b3f4e';
    return zone.colorCode || fallback;
  };

  const getZoneStroke = (zone) => {
    if (!zone) return '#181b24';
    if (zone.id === selectedZoneId) return '#ffffff';
    if (zone.id === hoveredZoneId) return '#fef08a';
    return '#0d111a';
  };

  const getZoneOpacity = (zone, baseOpacity = 0.92) => {
    if (!zone) return 0.4;
    if (zone.available <= 0 || zone.isActive === false) return 0.38;
    if (zone.id === selectedZoneId) return 1;
    if (zone.id === hoveredZoneId) return 0.98;
    return baseOpacity;
  };

  // Helper to assign seated zones across Lower Tier & Upper Tier sectors naturally
  const pickSeatedZone = (tierIndex, sectorIndex) => {
    if (seatedPool.length === 0) return null;
    if (seatedPool.length === 1) return seatedPool[0];
    // Sort seated zones by price descending (VIP/closest to stage first, upper tier later)
    const sorted = [...seatedPool].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sorted.length === 2) {
      // Tier 0 (Lower bowl / VIP center) vs Tier 1 (Upper bowl / Wings)
      if (tierIndex === 0) return sorted[0];
      return sorted[1];
    }
    const idx = (tierIndex + (sectorIndex % sorted.length)) % sorted.length;
    return sorted[idx];
  };

  // Renders a ring of curved seat sectors (shared by Arena, Stadium and Festival layouts)
  const renderSectorRing = ({
    codes,
    tier,
    keyPrefix,
    ring,
    startAngle,
    span,
    gap,
    fallback,
    baseOpacity,
    fontSize = 11,
    prefix = '',
    darkLabel = false,
  }) => {
    const [rcx, rcy, rxIn, ryIn, rxOut, ryOut] = ring;
    const step = span / codes.length;
    return codes.map((code, idx) => {
      const a1 = startAngle + (codes.length - 1 - idx) * step + gap;
      const a2 = a1 + step - gap * 2;
      const zone = pickSeatedZone(tier, idx);
      const selected = zone?.id === selectedZoneId;
      const hovered = zone?.id === hoveredZoneId;
      const pathD = createEllipticalSectorPath(rcx, rcy, rxIn, ryIn, rxOut, ryOut, a1, a2);
      const center = getSectorCenter(rcx, rcy, rxIn, ryIn, rxOut, ryOut, a1, a2);
      const labelFill = darkLabel && !selected ? '#0f172a' : '#ffffff';
      const labelStroke = darkLabel ? (selected ? '#000' : 'rgba(255,255,255,0.65)') : '#090d16';

      return (
        <g key={`${keyPrefix}-${code}`} {...zoneProps(zone)}>
          <path
            d={pathD}
            fill={getZoneFill(zone, fallback)}
            fillOpacity={getZoneOpacity(zone, baseOpacity)}
            stroke={getZoneStroke(zone)}
            strokeWidth={selected ? 3.2 : hovered ? 2.3 : 1.6}
            className="transition-all duration-150 hover:brightness-115"
          />
          <path d={pathD} fill="url(#seats)" pointerEvents="none" />
          <text
            x={center.x}
            y={center.y + 4}
            textAnchor="middle"
            fill={labelFill}
            fontSize={fontSize}
            fontWeight="900"
            pointerEvents="none"
            style={{ paintOrder: 'stroke', stroke: labelStroke, strokeWidth: '2.8px' }}
          >
            {prefix}
            {code}
          </text>
        </g>
      );
    });
  };

  // ─── 1. INDOOR ARENA (IMPACT ARENA / UOB LIVE / UNION HALL) ────────────────
  // Horseshoe U-shape bowl (from -20 deg on right around 90 deg bottom to 200 deg on left)
  const renderArenaMap = () => {
    const cx = 400;
    const cy = 225;
    const lowerCodes = ['SB', 'SC', 'SD', 'SE', 'SF', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN'];
    const upperCodes = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const startAngle = -18;
    const endAngle = 198;
    const totalSpan = endAngle - startAngle;

    const leftStanding = standing[0] || zones[0];
    const rightStanding = standing[1] || standing[0] || zones[0];
    const extraStanding = standing.slice(2);

    return (
      <g>
        {/* Outer Arena Bowl Shell */}
        <path
          d={createEllipticalSectorPath(cx, cy, 0, 0, 362, 326, -24, 204)}
          fill="url(#arena-shell)"
          stroke="#334155"
          strokeWidth="2.5"
        />
        <rect x="135" y="18" width="530" height="120" rx="26" fill="#0f1420" stroke="#334155" strokeWidth="2" />

        {/* Stage Glow Cone */}
        <ellipse cx="400" cy="180" rx="220" ry="135" fill="url(#stage-light)" />

        {/* Upper Tier Horseshoe Sectors (B - P) */}
        {renderSectorRing({ codes: upperCodes, tier: 1, keyPrefix: 'upper', ring: [cx, cy, 272, 238, 344, 306], startAngle, span: totalSpan, gap: 0.5, fallback: '#38bdf8', baseOpacity: 0.85, darkLabel: true })}

        {/* Lower Tier VIP / Seated Horseshoe Sectors (SB - SN) */}
        {renderSectorRing({ codes: lowerCodes, tier: 0, keyPrefix: 'lower', ring: [cx, cy, 196, 166, 264, 230], startAngle, span: totalSpan, gap: 0.6, fallback: '#ec4899', baseOpacity: 0.92 })}

        {/* Arena Inner Floor Well */}
        <path
          d={createEllipticalSectorPath(cx, cy, 0, 0, 186, 156, -20, 200)}
          fill="#0b0f19"
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Main Stage + Side LED Screens */}
        <g>
          <polygon
            points="210,42 590,42 560,96 240,96"
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth="2"
          />
          <polygon
            points="250,48 550,48 530,90 270,90"
            fill="url(#concert-stage)"
          />
          <text x="400" y="72" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900" letterSpacing="3">
            STAGE
          </text>
          <text x="400" y="85" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="700" letterSpacing="1.5">
            {truncate(venueName || concertName, 38)}
          </text>

          {/* Extended T-Stage Catwalk & Center Sub-Stage */}
          <rect x="378" y="88" width="44" height="128" fill="url(#concert-stage)" stroke="#e2e8f0" strokeWidth="1.5" />
          <polygon
            points="356,210 444,210 456,246 344,246"
            fill="url(#concert-stage)"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <text x="400" y="156" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900" letterSpacing="2" transform="rotate(-90 400 156)">
            WALKWAY
          </text>
          <text x="400" y="232" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" letterSpacing="1">
            B-STAGE
          </text>
        </g>

        {/* Left Standing Pit (STANDING AL / Zone 1) */}
        {leftStanding && (
          <g {...zoneProps(leftStanding)}>
            <path
              d="M 235 110 L 368 110 L 368 202 L 334 202 L 334 256 L 235 256 Q 218 185 235 110 Z"
              fill={getZoneFill(leftStanding, '#06b6d4')}
              fillOpacity={getZoneOpacity(leftStanding, 0.9)}
              stroke={getZoneStroke(leftStanding)}
              strokeWidth={leftStanding.id === selectedZoneId ? 3.5 : 1.8}
              className="transition-all duration-150 hover:brightness-115"
            />
            <text x="296" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
              {standing.length > 1 ? 'STANDING A' : truncate(leftStanding.name, 14)}
            </text>
            <text x="296" y="175" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
              ฿{leftStanding.price?.toLocaleString()}
            </text>
            <text x="296" y="191" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700" pointerEvents="none">
              {leftStanding.available <= 0 ? 'SOLD OUT' : t(`ว่าง ${leftStanding.available}`, `${leftStanding.available} left`)}
            </text>
          </g>
        )}

        {/* Right Standing Pit (STANDING AR / Zone 2) */}
        {rightStanding && (
          <g {...zoneProps(rightStanding)}>
            <path
              d="M 432 110 L 565 110 Q 582 185 565 256 L 466 256 L 466 202 L 432 202 Z"
              fill={getZoneFill(rightStanding, '#a855f7')}
              fillOpacity={getZoneOpacity(rightStanding, 0.9)}
              stroke={getZoneStroke(rightStanding)}
              strokeWidth={rightStanding.id === selectedZoneId ? 3.5 : 1.8}
              className="transition-all duration-150 hover:brightness-115"
            />
            <text x="504" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
              {standing.length > 1 ? 'STANDING B' : truncate(rightStanding.name, 14)}
            </text>
            <text x="504" y="175" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
              ฿{rightStanding.price?.toLocaleString()}
            </text>
            <text x="504" y="191" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700" pointerEvents="none">
              {rightStanding.available <= 0 ? 'SOLD OUT' : t(`ว่าง ${rightStanding.available}`, `${rightStanding.available} left`)}
            </text>
          </g>
        )}

        {/* Additional Floor Zones if more than 2 standing zones exist */}
        {extraStanding.map((z, idx) => {
          const w = 280 / extraStanding.length - 8;
          const x = 260 + idx * (280 / extraStanding.length) + 4;
          return (
            <g key={z.id} {...zoneProps(z)}>
              <rect
                x={x}
                y={264}
                width={w}
                height={42}
                rx="8"
                fill={getZoneFill(z, '#22d3ee')}
                fillOpacity={getZoneOpacity(z, 0.9)}
                stroke={getZoneStroke(z)}
                strokeWidth={z.id === selectedZoneId ? 3 : 1.5}
              />
              <text x={x + w / 2} y={283} textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="900" pointerEvents="none">
                {truncate(z.name, 15)}
              </text>
              <text x={x + w / 2} y={297} textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="800" pointerEvents="none">
                ฿{z.price?.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* FOH Sound & Lighting Control Booth */}
        <rect x="338" y={extraStanding.length > 0 ? 314 : 268} width="124" height="34" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
        <text x="400" y={extraStanding.length > 0 ? 335 : 289} textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="900" letterSpacing="2">
          CONTROL / FOH
        </text>

        {/* Seated Bowl Floating Label */}
        {seatedPool.length > 0 && (
          <g pointerEvents="none">
            <rect x="295" y="422" width="210" height="24" rx="12" fill="#090d16" fillOpacity="0.82" stroke="#ffffff" strokeOpacity="0.25" />
            <text x="400" y="438" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="800">
              💺 {t('คลิกที่บล็อกอัฒจันทร์เพื่อเลือกที่นั่ง', 'Click any bowl sector to pick seats')}
            </text>
          </g>
        )}
      </g>
    );
  };

  // ─── 2. GRAND STADIUM (RAJAMANGALA / SUPHACHALASAI STADIUM) ────────────────
  // Full Oval Stadium with Running Track, Football Pitch, and Multi-Tier Grandstands
  const renderStadiumMap = () => {
    const cx = 400;
    const cy = 285;
    const lowerSectors = ['W1', 'W2', 'W3', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'E1', 'E2', 'E3'];
    const upperSectors = ['UW1', 'UW2', 'UW3', 'US1', 'US2', 'US3', 'US4', 'US5', 'US6', 'US7', 'UE1', 'UE2', 'UE3'];
    const startAngle = -15;
    const endAngle = 195;
    const span = endAngle - startAngle;

    return (
      <g>
        {/* Outer Stadium Roof Canopy */}
        <ellipse cx={cx} cy={cy} rx="368" ry="255" fill="url(#arena-shell)" stroke="#475569" strokeWidth="3" />
        <ellipse cx={cx} cy={cy} rx="355" ry="242" fill="none" stroke="#64748b" strokeOpacity="0.3" strokeDasharray="8 6" />

        {/* Upper Stadium Bowl (Tier 2 & Tier 3) */}
        {renderSectorRing({ codes: upperSectors, tier: 1, keyPrefix: 'upper', ring: [cx, cy, 278, 178, 342, 228], startAngle, span, gap: 0.5, fallback: '#38bdf8', baseOpacity: 0.86, fontSize: 10 })}

        {/* Lower Stadium Bowl (Tier 1 Grandstand) */}
        {renderSectorRing({ codes: lowerSectors, tier: 0, keyPrefix: 'lower', ring: [cx, cy, 212, 128, 270, 172], startAngle, span, gap: 0.6, fallback: '#f43f5e', baseOpacity: 0.92 })}

        {/* Olympic Running Track */}
        <ellipse cx={cx} cy={cy} rx="198" ry="118" fill="#7c2d12" fillOpacity="0.65" stroke="#fb923c" strokeOpacity="0.45" strokeWidth="2" />
        <ellipse cx={cx} cy={cy} rx="188" ry="108" fill="none" stroke="#fdba74" strokeOpacity="0.25" strokeDasharray="5 5" />

        {/* Football Pitch / Turf Field */}
        <rect x="235" y="185" width="330" height="190" rx="22" fill="#064e3b" stroke="#34d399" strokeOpacity="0.5" strokeWidth="1.8" />
        <line x1="400" y1="185" x2="400" y2="375" stroke="#34d399" strokeOpacity="0.2" strokeWidth="1.5" />
        <circle cx="400" cy="280" r="36" fill="none" stroke="#34d399" strokeOpacity="0.2" strokeWidth="1.5" />

        {/* North Grand Stage on Stadium Pitch */}
        <polygon points="240,68 560,68 535,126 265,126" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <polygon points="268,75 532,75 515,118 285,118" fill="url(#concert-stage)" />
        <text x="400" y="97" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="900" letterSpacing="2.5">
          {profile.stageLabel}
        </text>
        <text x="400" y="111" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700">
          {truncate(venueName || concertName, 42)}
        </text>

        {/* Stadium Pitch Standing Zones */}
        {(standing.length > 0 ? standing : zones.slice(0, 2)).map((zone, index, arr) => {
          const count = Math.max(arr.length, 1);
          const w = 304 / count - 8;
          const x = 248 + index * (304 / count) + 4;
          const selected = zone.id === selectedZoneId;
          return (
            <g key={zone.id} {...zoneProps(zone)}>
              <rect
                x={x}
                y={196}
                width={w}
                height={118}
                rx="14"
                fill={getZoneFill(zone, '#06b6d4')}
                fillOpacity={getZoneOpacity(zone, 0.9)}
                stroke={getZoneStroke(zone)}
                strokeWidth={selected ? 3.5 : 1.8}
                className="transition-all hover:brightness-115"
              />
              <rect x={x + 6} y={202} width={w - 12} height={106} rx="10" fill="url(#seats)" pointerEvents="none" />
              <text x={x + w / 2} y="242" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
                {truncate(zone.name, 18)}
              </text>
              <text x={x + w / 2} y="262" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
                ฿{zone.price?.toLocaleString()}
              </text>
              <text x={x + w / 2} y="280" textAnchor="middle" fill="#f8fafc" fontSize="8.5" fontWeight="700" pointerEvents="none">
                {zone.available <= 0 ? 'SOLD OUT' : t(`ว่าง ${zone.available}`, `${zone.available} left`)}
              </text>
            </g>
          );
        })}

        {/* FOH Sound Tower on Pitch */}
        <rect x="345" y="326" width="110" height="32" rx="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="400" y="346" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="900" letterSpacing="1.5">
          FOH TOWER
        </text>
      </g>
    );
  };

  // ─── 3. OUTDOOR FESTIVAL & CAMPING GROUNDS (OASIS / WISDOM VALLEY) ─────────
  const renderFestivalMap = () => {
    const cx = 400;
    const vipSectors = ['VIP-L2', 'VIP-L1', 'VIP-C1', 'VIP-C2', 'VIP-R1', 'VIP-R2'];

    return (
      <g>
        {/* Outdoor Park & Mountain Horizon */}
        <rect x="44" y="20" width="712" height="525" rx="38" fill="url(#festival-ground)" stroke="#10b981" strokeOpacity="0.35" strokeWidth="2.5" />
        <path d="M 48 115 L 155 58 L 265 102 L 400 42 L 535 98 L 650 55 L 752 115 Z" fill="#0f2922" fillOpacity="0.7" />

        {/* Main Festival Pyramid Stage & Side Stages */}
        <polygon points="260,38 540,38 518,98 282,98" fill="url(#concert-stage)" stroke="#e2e8f0" strokeWidth="1.8" />
        <text x="400" y="66" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="900" letterSpacing="2.5">
          {profile.stageLabel}
        </text>
        <text x="400" y="83" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="800">
          {truncate(venueName || concertName, 40)}
        </text>

        {/* Side Stages */}
        <rect x="82" y="64" width="128" height="44" rx="10" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
        <text x="146" y="85" textAnchor="middle" fill="#c7d2fe" fontSize="8.5" fontWeight="900">INDIE SYNTH STAGE</text>
        <text x="146" y="98" textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="700">STAGE 2</text>

        <rect x="590" y="64" width="128" height="44" rx="10" fill="#3b0764" stroke="#f472b6" strokeWidth="1.5" />
        <text x="654" y="85" textAnchor="middle" fill="#fbcfe8" fontSize="8.5" fontWeight="900">ACOUSTIC STAGE</text>
        <text x="654" y="98" textAnchor="middle" fill="#f472b6" fontSize="7" fontWeight="700">STAGE 3</text>

        {/* Curved Standing Pits in Front of Main Stage */}
        {standing.map((zone, idx) => {
          const isFront = idx === 0;
          const pathD = isFront
            ? createEllipticalSectorPath(cx, 105, 58, 38, 165, 102, 18, 162)
            : createEllipticalSectorPath(cx, 105, 174, 108, 255, 166, 22, 158);
          const center = isFront
            ? { x: 400, y: 175 }
            : { x: 400, y: 242 };
          const selected = zone.id === selectedZoneId;

          return (
            <g key={zone.id} {...zoneProps(zone)}>
              <path
                d={pathD}
                fill={getZoneFill(zone, isFront ? '#06b6d4' : '#3b82f6')}
                fillOpacity={getZoneOpacity(zone, 0.9)}
                stroke={getZoneStroke(zone)}
                strokeWidth={selected ? 3.5 : 1.8}
                className="transition-all hover:brightness-115"
              />
              <path d={pathD} fill="url(#seats)" pointerEvents="none" />
              <text x={center.x} y={center.y - 4} textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
                {truncate(zone.name, 26)}
              </text>
              <text x={center.x} y={center.y + 13} textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: '3px' }}>
                ฿{zone.price?.toLocaleString()} · {zone.available <= 0 ? 'SOLD OUT' : t(`ว่าง ${zone.available}`, `${zone.available} left`)}
              </text>
            </g>
          );
        })}

        {/* Curved Elevated VIP Grandstand Terrace */}
        {renderSectorRing({ codes: vipSectors, tier: 0, keyPrefix: 'vip', ring: [cx, 115, 272, 178, 336, 226], startAngle: 24, span: 132, gap: 0.8, fallback: '#ec4899', baseOpacity: 0.92, fontSize: 10, prefix: '💺 ' })}

        {/* Starlight Camping Grounds Village */}
        {camping.map((zone, idx) => {
          const selected = zone.id === selectedZoneId;
          const w = 620 / Math.max(camping.length, 1) - 12;
          const x = 90 + idx * (620 / Math.max(camping.length, 1)) + 6;
          return (
            <g key={zone.id} {...zoneProps(zone)}>
              <rect
                x={x}
                y={442}
                width={w}
                height={76}
                rx="20"
                fill={getZoneFill(zone, '#10b981')}
                fillOpacity={getZoneOpacity(zone, 0.88)}
                stroke={getZoneStroke(zone)}
                strokeWidth={selected ? 3.5 : 1.8}
                className="transition-all hover:brightness-115"
              />
              <rect x={x + 8} y={450} width={w - 16} height={60} rx="14" fill="url(#seats)" pointerEvents="none" />
              <text x={x + w / 2} y="476" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#06281e', strokeWidth: '3px' }}>
                ⛺ {truncate(zone.name, 30)}
              </text>
              <text x={x + w / 2} y="496" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#06281e', strokeWidth: '3px' }}>
                ฿{zone.price?.toLocaleString()} · {zone.available <= 0 ? 'SOLD OUT' : t(`ว่าง ${zone.available} หลัง`, `${zone.available} plots left`)}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const activeZone = zones.find((z) => z.id === (hoveredZoneId || selectedZoneId));

  return (
    <section className="overflow-hidden rounded-[28px] border border-cyan-400/25 bg-[#0b0f17] shadow-2xl">
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
                📍 {trData(venueName)}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg sm:text-xl font-black text-white">
            {t('ขั้นตอนที่ 1: คลิกเลือกโซนจากผังสถานที่จัดงานจริง', 'Step 1: Select a Zone on the Official Venue Seating Plan')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {t(
              'คลิกที่บล็อกโซนสีบนผังเพื่อเปิดเลือกเก้าอี้รายที่นั่งในขั้นตอนที่ 2',
              'Click any colored zone block on the arena chart to pick individual seats in Step 2'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-2 text-xs font-bold text-cyan-100">
          <MapPinned size={15} className="text-cyan-300" />
          <span>{t(profile.titleTh.split('(')[0], profile.titleEn)}</span>
        </div>
      </div>

      {/* Main Content: Interactive SVG Seating Plan */}
      <div className="bg-[radial-gradient(ellipse_at_top,_#172033_0%,_#070a10_78%)]">
        <div className="overflow-x-auto p-3 sm:p-5 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 800 565"
            role="img"
            aria-label={t('ผังเวทีคอนเสิร์ตและโซนบัตรตามสถานที่จริง', 'Concert venue stage and zone layout')}
            className="w-full min-w-[540px] max-w-[780px] drop-shadow-[0_18px_40px_rgba(0,0,0,0.65)]"
          >
            <defs>
              <linearGradient id="arena-shell" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#1e293b" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="festival-ground" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#0f2922" />
                <stop offset="0.5" stopColor="#0c1926" />
                <stop offset="1" stopColor="#09101a" />
              </linearGradient>
              <linearGradient id="concert-stage" x1="0" x2="1">
                <stop stopColor="#06b6d4" />
                <stop offset=".5" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
              <radialGradient id="stage-light">
                <stop stopColor="#38bdf8" stopOpacity=".28" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
              <pattern id="seats" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2.5" cy="2.5" r="1.1" fill="#ffffff" fillOpacity=".2" />
              </pattern>
            </defs>

            {profile.type === 'STADIUM'
              ? renderStadiumMap()
              : profile.type === 'FESTIVAL'
              ? renderFestivalMap()
              : renderArenaMap()}
          </svg>

          {/* Live Hovered / Selected Zone Quick Banner */}
          {activeZone && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 w-full max-w-[720px] rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 rounded-md shadow-sm ring-2 ring-white/40"
                  style={{ backgroundColor: activeZone.colorCode || '#06b6d4' }}
                />
                <span className="font-black text-white text-sm">{trData(activeZone.name)}</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                  {activeZone.category}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-amber-300 text-sm">
                  ฿{Number(activeZone.price || 0).toLocaleString()}
                </span>
                <span className="text-gray-300 font-semibold">
                  {activeZone.available <= 0
                    ? t('บัตรหมด (SOLD OUT)', 'SOLD OUT')
                    : t(`คงเหลือ ${activeZone.available} ที่นั่ง`, `${activeZone.available} available`)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
