const NATIVE_ASSET_BASE = 'https://soundwave-pas.vercel.app';

export const FALLBACK_CONCERT_IMAGE =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';

export const FALLBACK_ARTIST_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80';

export const CONCERT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
];

export const ARTIST_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1000&q=80',
];

function hashString(str = '') {
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getUniqueImageFromPool(seed, pool = CONCERT_IMAGE_POOL) {
  const idx = hashString(seed) % pool.length;
  return pool[idx];
}

/**
 * Returns a distinct banner image for each concert, avoiding duplicate default Unsplash banners
 * (e.g. when LANY and SoundWave Music Festival share the same default Unsplash URL).
 */
export function getConcertBannerUrl(concert) {
  if (!concert) return FALLBACK_CONCERT_IMAGE;
  const raw = (concert.bannerUrl || '').trim();
  const slugOrName = (concert.slug || concert.name || String(concert.id || '')).toLowerCase();

  // Differentiate concerts that were seeded with the exact same generic Unsplash photo
  if (!raw || (raw.includes('photo-1470225620780-dba8ba36b745') && !slugOrName.includes('soundwave'))) {
    if (slugOrName.includes('lany')) {
      return 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80';
    }
    return getUniqueImageFromPool(slugOrName || concert.id, CONCERT_IMAGE_POOL);
  }
  return resolveImageUrl(raw);
}

function isCapacitorNative() {
  return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.());
}

/**
 * Admin-uploaded images are stored as relative paths (e.g. /uploads/abc.jpg).
 * Inside Electron Desktop, the built-in static server serves /uploads directly from backend/uploads.
 * Inside Capacitor Android/iOS, relative /uploads paths point at the cloud server.
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_CONCERT_IMAGE;
  if (trimmed.startsWith('/uploads') && isCapacitorNative()) {
    return NATIVE_ASSET_BASE + trimmed;
  }
  return trimmed;
}

/**
 * Fallback handler for <img> onError events so broken or offline images always render a distinct concert visual.
 */
export function handleImageError(e, fallbackUrl, seedKey = '') {
  const img = e?.currentTarget;
  if (!img) return;
  const currentSrc = img.getAttribute('src') || '';
  // If local /uploads failed in Electron (e.g. file only exists on cloud), try cloud once before fallback
  if (currentSrc.startsWith('/uploads') && !img.dataset.triedCloud) {
    img.dataset.triedCloud = '1';
    img.src = NATIVE_ASSET_BASE + currentSrc;
    return;
  }
  const chosenFallback =
    seedKey
      ? getUniqueImageFromPool(seedKey, CONCERT_IMAGE_POOL)
      : fallbackUrl || getUniqueImageFromPool(img.alt || currentSrc, CONCERT_IMAGE_POOL);
  if (img.src !== chosenFallback && !img.dataset.triedFallback) {
    img.dataset.triedFallback = '1';
    img.src = chosenFallback;
  }
}

/**
 * Optimize image URLs by applying CDN parameters (e.g. Unsplash dynamic resizing and WebP compression)
 */
export function optimizeImageUrl(url, width = 600, quality = 75) {
  if (!url || typeof url !== 'string') return FALLBACK_CONCERT_IMAGE;
  url = resolveImageUrl(url);
  try {
    if (url.includes('images.unsplash.com')) {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      return u.toString();
    }
  } catch {
    // Return original url if parsing fails
  }
  return url;
}
