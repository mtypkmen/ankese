'use strict';
// Bellek ici sabit pencere. Anahtar sayisi sinirli, periyodik temizlenir.
const buckets = new Map();
const MAX_KEYS = 20000;

function hit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset <= now) {
    if (buckets.size >= MAX_KEYS) return { ok: false, retry: windowMs };
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  return { ok: b.count <= limit, retry: b.reset - now };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
}, 60000).unref();

module.exports = { hit };
