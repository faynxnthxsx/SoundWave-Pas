const express = require('express');

const router = express.Router();
const cache = new Map();
let nextRequestAt = 0;

async function waitForPublicGeocoderSlot() {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextRequestAt);
  nextRequestAt = scheduledAt + 1000;
  const wait = scheduledAt - now;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 3 || query.length > 160) {
    return res.status(400).json({ success: false, message: 'พิมพ์ชื่อสถานที่อย่างน้อย 3 ตัวอักษร' });
  }

  const key = query.toLocaleLowerCase('th-TH');
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return res.json({ success: true, data: cached.data });

  try {
    await waitForPublicGeocoderSlot();
    const base = (process.env.GEOCODER_URL || 'https://photon.komoot.io').replace(/\/$/, '');
    const url = new URL(`${base}/api/`);
    url.searchParams.set('q', query);
    // Photon currently supports default, German, English and French labels.
    // Keep its default language so Thai query text works without a 400 response.
    url.searchParams.set('limit', '6');
    url.searchParams.set('lat', '13.75');
    url.searchParams.set('lon', '100.5');

    const response = await fetch(url, {
      headers: { 'User-Agent': 'SoundWavePass/1.0 (concert venue picker)' },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const payload = await response.json();
    const features = (payload.features || []).filter((feature) => {
      const p = feature.properties || {};
      return String(p.country || '').toLowerCase() === 'thailand' || String(p.countrycode || '').toUpperCase() === 'TH';
    });
    const data = features.map((feature) => {
      const p = feature.properties || {};
      return {
        id: `${p.osm_type || p.type || 'place'}-${p.osm_id || p.name || Math.random()}`,
        name: p.name || p.street || p.city || '',
        displayName: [p.name, p.street, p.district, p.city, p.state, p.postcode, p.country].filter((part, index, all) => part && all.indexOf(part) === index).join(', '),
        latitude: Number(feature.geometry?.coordinates?.[1]),
        longitude: Number(feature.geometry?.coordinates?.[0]),
      };
    }).filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));

    cache.set(key, { data, expiresAt: Date.now() + 60 * 60 * 1000 });
    if (cache.size > 500) {
      for (const [cacheKey, value] of cache) if (value.expiresAt <= Date.now()) cache.delete(cacheKey);
      while (cache.size > 500) cache.delete(cache.keys().next().value);
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Venue search error:', error.message);
    res.status(502).json({ success: false, message: 'ค้นหาสถานที่ไม่สำเร็จ ลองอีกครั้งหรือกรอกชื่อสถานที่เองได้' });
  }
});

module.exports = router;
