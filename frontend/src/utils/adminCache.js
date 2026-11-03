// In-memory cache for Admin Dashboard & Admin Insight views
// Enables instant (0ms) route transitions between Dashboard and Insights
// with automatic background revalidation (Stale-While-Revalidate).

let adminCache = null;

export function getAdminCache() {
  return adminCache;
}

export function setAdminCache(data) {
  if (!data) return;
  adminCache = {
    ...(adminCache || {}),
    ...data,
    timestamp: Date.now(),
  };
  return adminCache;
}

export function clearAdminCache() {
  adminCache = null;
}

export function hasValidAdminCache() {
  return !!(adminCache && adminCache.stats);
}
