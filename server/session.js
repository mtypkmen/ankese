'use strict';
const config = require('./config');
const pool = require('./db');
const { sha256, hmac, token, safeEq } = require('./lib/crypto');

const SID = '__Host-ank';
const CSRF = '__Host-ank-c';
const SESSION_DAYS = 14;

function parseCookies(h) {
  const out = {};
  if (!h) return out;
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function setCookie(res, name, value, maxAgeSec) {
  res.append('Set-Cookie',
    `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`);
}
const clearCookie = (res, name) => setCookie(res, name, '', 0);

function clientIp(req) {
  const ip = String(req.headers['x-real-ip'] || req.ip || '').trim();
  return /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : '0.0.0.0';
}
const ipHmac = (req) => hmac('ip:' + clientIp(req));

// Her istekte: CSRF cerezi garanti et, oturum varsa kullaniciyi yukle
async function load(req, res, next) {
  try {
    req.cookies = parseCookies(req.headers.cookie);
    let c = req.cookies[CSRF];
    if (!/^[A-Za-z0-9_-]{32}$/.test(c || '')) {
      c = token(24);
      setCookie(res, CSRF, c, 60 * 60 * 24 * 30);
    }
    req.csrfToken = hmac('csrf:' + c);

    req.user = null;
    const sid = req.cookies[SID];
    if (/^[A-Za-z0-9_-]{43}$/.test(sid || '')) {
      const scope = req.isPanel ? 'panel' : 'site';
      const [rows] = await pool.query(
        `SELECT u.id, u.email, u.display_name, u.role, u.status, u.locale, u.email_verified_at
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.scope = ? AND s.expires_at > UTC_TIMESTAMP() AND u.status = 'active'
            AND (s.scope = 'site' OR u.role IN ('moderator','admin')) LIMIT 1`,
        [sha256(sid), scope]);
      if (rows[0]) req.user = rows[0];
    }
    next();
  } catch (e) { next(e); }
}

// scope 'site': 14 gun. scope 'panel': 8 saat
async function createSession(req, res, userId, scope = 'site') {
  const raw = token(32); // 43 karakter
  const hours = scope === 'panel' ? 8 : SESSION_DAYS * 24;
  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, ip_hmac, scope, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR))`,
    [userId, sha256(raw), ipHmac(req), scope, hours]);
  setCookie(res, SID, raw, hours * 3600);
}

// Panel girisinde parola sonrasi 2. adim icin kisa omurlu (5 dk), imzali cerez
const PRE = '__Host-ank-pre';
function setPre(res, userId) {
  const exp = Math.floor(Date.now() / 1000) + 300;
  const body = `${userId}.${exp}`;
  setCookie(res, PRE, `${body}.${hmac('pre:' + body)}`, 300);
}
function getPre(req) {
  const v = (req.cookies || {})[PRE] || '';
  const m = /^(\d{1,15})\.(\d{10})\.([0-9a-f]{64})$/.exec(v);
  if (!m || !safeEq(m[3], hmac(`pre:${m[1]}.${m[2]}`)) || Number(m[2]) < Date.now() / 1000) return null;
  return Number(m[1]);
}
const clearPre = (res) => clearCookie(res, PRE);

async function destroySession(req, res) {
  const sid = req.cookies && req.cookies[SID];
  if (sid) await pool.query('DELETE FROM sessions WHERE token_hash = ?', [sha256(sid)]);
  clearCookie(res, SID);
}

// Durum degistiren isteklerde: Origin/Referer + CSRF token
function checkPost(req) {
  const src = req.headers.origin || req.headers.referer;
  if (!src) return 'csrf';
  try {
    // Host zaten hostGuard ile izinli listeden dogrulandi; Origin ayni host olmali
    if (new URL(src).host !== req.headers.host || new URL(src).protocol !== 'https:') return 'csrf';
  } catch { return 'csrf'; }
  const c = (req.cookies || {})[CSRF];
  if (!c || !safeEq(String((req.body || {})._csrf || ''), hmac('csrf:' + c))) return 'csrf';
  return null;
}

module.exports = { load, createSession, destroySession, checkPost, clientIp, ipHmac, parseCookies, setPre, getPre, clearPre };
