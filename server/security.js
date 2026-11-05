'use strict';
const config = require('./config');

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(config.prod ? ['upgrade-insecure-requests'] : []), // yerelde (http://localhost) tarayici alt kaynaklari https'e zorlamasin
].join('; ');

function securityHeaders(req, res, next) {
  res.removeHeader('X-Powered-By');
  res.set({
    'Content-Security-Policy': CSP,
    ...(config.prod ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' } : {}),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  });
  next();
}

// Bilinmeyen Host basligi -> 404 (dogrudan IP taramasi ve Host karistirma yuzeyi kapali)
function hostGuard(req, res, next) {
  const host = (req.headers.host || '').toLowerCase();
  if (!config.allowedHosts.has(host)) return res.status(404).type('text/plain').send('Not found');
  next();
}

module.exports = { securityHeaders, hostGuard };
