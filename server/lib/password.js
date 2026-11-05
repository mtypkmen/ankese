'use strict';
// scrypt (N=2^15, r=8, p=1). Ayni anda en fazla 2 hesaplama: her biri ~32 MB bellek kullanir.
const crypto = require('crypto');
const N = 32768, R = 8, P = 1, KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

let active = 0;
const waiting = [];
function acquire() {
  return new Promise((res) => {
    const go = () => { active++; res(); };
    active < 2 ? go() : waiting.push(go);
  });
}
function release() { active--; const n = waiting.shift(); if (n) n(); }

function scrypt(pw, salt) {
  return new Promise((resolve, reject) =>
    crypto.scrypt(pw, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM }, (e, k) => (e ? reject(e) : resolve(k))));
}

async function hash(password) {
  await acquire();
  try {
    const salt = crypto.randomBytes(16);
    const key = await scrypt(password, salt);
    return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
  } finally { release(); }
}

async function verify(password, stored) {
  const [alg, n, r, p, s, k] = String(stored).split('$');
  if (alg !== 'scrypt' || Number(n) !== N || Number(r) !== R || Number(p) !== P) return false;
  await acquire();
  try {
    const key = await scrypt(password, Buffer.from(s, 'base64'));
    const want = Buffer.from(k, 'base64');
    return key.length === want.length && crypto.timingSafeEqual(key, want);
  } finally { release(); }
}

// Var olmayan hesap icin de gercek bir scrypt calistirilir (zamanlama sizintisi yok)
let dummy = null;
async function dummyVerify(password) {
  if (!dummy) dummy = await hash(crypto.randomBytes(8).toString('hex'));
  await verify(password, dummy);
  return false;
}

module.exports = { hash, verify, dummyVerify };
