/**
 * Optimize image URLs by applying CDN parameters (e.g. Unsplash dynamic resizing and WebP compression)
 */
export function optimizeImageUrl(url, width = 600, quality = 75) {
  if (!url || typeof url !== 'string') return url;
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
