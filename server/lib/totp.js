'use strict';
// RFC 6238 TOTP (SHA-1, 6 hane, 30 sn). Gizli anahtar DB'de AES-256-GCM ile sifreli tutulur.
const crypto = require('crypto');
const config = require('../config');

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc(buf) {
  let bits = '', out = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
function b32dec(str) {
  let bits = '';
  for (const c of str.replace(/=+$/, '')) bits += B32.indexOf(c).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

const key = () => crypto.createHash('sha256').update('totp-key:' + config.sessionSecret).digest();
function encrypt(plain) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
function decrypt(blob) {
  const [iv, tag, enc] = String(blob).split('.').map((x) => Buffer.from(x, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

const newSecret = () => b32enc(crypto.randomBytes(20));
const stepNow = () => Math.floor(Date.now() / 30000);

function codeAt(secretB32, step) {
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac('sha1', b32dec(secretB32)).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}

// Basariliysa kullanilan adimi doner (tekrar kullanimi engellemek icin), degilse null
function verify(secretB32, code, lastStep) {
  if (!/^\d{6}$/.test(code)) return null;
  const now = stepNow();
  for (const d of [0, -1, 1]) {
    const st = now + d;
    if (lastStep && st <= Number(lastStep)) continue;
    if (crypto.timingSafeEqual(Buffer.from(codeAt(secretB32, st)), Buffer.from(code))) return st;
  }
  return null;
}

const uri = (secret, email) => `otpauth://totp/Ankese%20Panel:${encodeURIComponent(email)}?secret=${secret}&issuer=Ankese%20Panel&digits=6&period=30`;

module.exports = { newSecret, encrypt, decrypt, verify, uri, codeAt, stepNow };
