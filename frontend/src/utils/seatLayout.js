// Shared seat-layout constants and helpers used by the customer zone picker and the admin seat map.
// 3-Wing Stadium Bowl: 14 seats per row (Rows A–G+), like ThaiTicketMajor / AllTicket.
export const STADIUM_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const COLS_LEFT_WING = [1, 2, 3, 4];
export const COLS_CENTER = [5, 6, 7, 8, 9, 10];
export const COLS_RIGHT_WING = [11, 12, 13, 14];
export const ALL_COLS = [...COLS_LEFT_WING, ...COLS_CENTER, ...COLS_RIGHT_WING];

export function isZoneStanding(zone) {
  if (!zone) return false;
  const cat = String(zone.category || '').toUpperCase();
  const name = String(zone.name || '').toLowerCase();
  if (cat === 'SEATED' || cat === 'VIP') return false;
  if (cat === 'STANDING' || cat === 'CAMPING') return true;
  return /standing|ยืน|หลุม|pit|ga\b|camping|แคมป์/i.test(name);
}
