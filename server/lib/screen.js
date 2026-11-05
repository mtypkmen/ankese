'use strict';
// Moderasyon on incelemesi. KARAR VERMEZ: risk skoru ve gerekceleri uretir, karari moderator verir.
const pool = require('../db');
const { sha256 } = require('./crypto');

// ---------- sozluk (DB'den, 60 sn onbellek) ----------
let cache = { at: 0, exact: new Map(), stems: [], phrases: [] };
async function loadBlocklist(force = false) {
  if (!force && Date.now() - cache.at < 60000) return cache;
  const [rows] = await pool.query('SELECT term, kind, severity, mode FROM blocklist');
  const exact = new Map(), stems = [], phrases = [];
  for (const r of rows) {
    const e = { term: r.term, kind: r.kind, sev: r.severity };
    if (r.term.includes(' ')) phrases.push({ ...e, words: r.term.split(' ').map(collapse) });
    else if (r.mode === 'stem') stems.push({ ...e, key: collapse(r.term) });
    else exact.set(collapse(r.term), e);
  }
  cache = { at: Date.now(), exact, stems, phrases };
  return cache;
}
const invalidate = () => { cache.at = 0; };

// ---------- normalizasyon ----------
const collapse = (s) => s.replace(/(.)\1+/gu, '$1');
const HOMO = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'к': 'k', 'т': 't', 'і': 'i', 'м': 'm', 'ѕ': 's', 'ј': 'j',
  'α': 'a', 'ο': 'o', 'ρ': 'p', 'ν': 'v', 'ι': 'i', 'κ': 'k', 'τ': 't' };
const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

// Orijinal metni karakter karakter normalize eder; her normal karakter icin orijinaldeki konumu tutar.
// strToMc: p.s icindeki her UTF-16 konumu -> mc dizisindeki indeks
function prepare(text) {
  const mc = [], os = [], oe = [];
  let i = 0;
  for (const ch of text) {
    const start = i, end = i + ch.length; i = end;
    const b = ch.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
    for (const c of b) { const h = HOMO[c] || c; mc.push(h); os.push(start); oe.push(end); }
  }
  const strToMc = [];
  mc.forEach((c, k) => { for (let j = 0; j < c.length; j++) strToMc.push(k); });
  return { mc, os, oe, s: mc.join(''), strToMc };
}

const TOKEN = /[\p{L}\p{N}@$]+/gu;

function tokenize(p) {
  const toks = [];
  for (const m of p.s.matchAll(TOKEN)) {
    const a = p.strToMc[m.index], b = p.strToMc[m.index + m[0].length - 1];
    const raw = m[0];
    const cands = new Set([collapse(raw)]);
    if (/\p{L}/u.test(raw) && /[0-9@$]/.test(raw)) cands.add(collapse([...raw].map((c) => LEET[c] || c).join('')));
    toks.push({ cands: [...cands].filter((c) => c.length >= 2), s: p.os[a], e: p.oe[b] });
  }
  return toks;
}

function matchToken(cands, bl) {
  for (const c of cands) {
    const e = bl.exact.get(c);
    if (e) return e;
    for (const st of bl.stems) if (c.startsWith(st.key) && c.length <= st.key.length + 6) return st;
  }
  return null;
}

// "k u r v e", "k.u.r.v.e", "k-u-r-v-e" gibi harf harf yazimlar
const SPACED = /(?<![\p{L}])((?:\p{L}[\s.\-_*,]){3,}\p{L})(?![\p{L}])/gu;

// ---------- kisisel veri ----------
const PII = [
  { t: 'pii_email', sev: 3, re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { t: 'pii_phone', sev: 3, re: /(?:\+|00)\s?(?:355|383)[\s().-]*\d(?:[\s().-]*\d){7,8}/g },
  { t: 'pii_phone', sev: 3, re: /(?<![\d.,])0\d{2}(?:[\s.-]?\d){6,7}(?!\d)/g },
  { t: 'pii_iban', sev: 3, re: /\b(?:AL\d{2}(?:\s?[A-Z0-9]{4}){6}|XK\d{2}(?:\s?\d{4}){4})\b/gi },
  { t: 'pii_id', sev: 2, re: /\b[A-Z]\d{8}[A-Z]\b/g },
  { t: 'pii_id', sev: 3, re: /(?:numri personal|nr\.? personal|personal number|leternjoftim|letërnjoftim|pasaport|passport|id card)[^\d\n]{0,25}\d{6,12}/gi },
  { t: 'link', sev: 1, re: /(?:https?:\/\/|www\.)\S+/gi },
  { t: 'handle', sev: 1, re: /(?<![\w.])@[A-Za-z0-9_.]{3,}/g },
  { t: 'plate', sev: 1, re: /\b(?:[A-Z]{2}\s?\d{3}\s?[A-Z]{2}|\d{2}[-\s]\d{3}[-\s][A-Z]{2})\b/g },
  { t: 'address', sev: 1, re: /\b(?:rruga|rr\.|str\.?|street|lagjja)\s+[^\n,.]{2,40}?\s*(?:nr\.?\s*)?\d+\b/gi },
];

// Kisi adi + unvan (calisan ismi gecmesi): unvan buyuk/kucuk fark etmez, ad buyuk harfle baslamali
const PERSON = /(?<![\p{L}])(?:zoti|zonja|znj\.?|z\.|mr\.?|mrs\.?|ms\.?|drejtori|drejtoresha|punonjesi|punonjësi|nëpunësi|nepunesi|shitësi|shitesi|menaxheri|mjeku|doktori|dr\.?|agjenti|operatori|operatorja)\s+(\p{L}[\p{L}'-]{2,}(?:\s+\p{L}[\p{L}'-]{2,})?)/giu;
const isUpper = (c) => c !== c.toLowerCase();
function findPersons(f, text, flags) {
  for (const m of text.matchAll(PERSON)) {
    const first = m[1].trim()[0];
    if (!first || !isUpper(first)) continue;
    flags.push({ f, t: 'person_named', sev: 2, m: m[0].slice(0, 60), s: m.index, e: m.index + m[0].length });
  }
}

function addMatches(flags, f, text, t, sev, re) {
  for (const m of text.matchAll(re)) flags.push({ f, t, sev, m: m[0].slice(0, 60), s: m.index, e: m.index + m[0].length });
}

async function scanField(field, text, flags) {
  const bl = await loadBlocklist();
  const p = prepare(text);
  const toks = tokenize(p);
  const seen = new Set();
  const push = (e, s, en) => { const k = `${s}:${en}`; if (seen.has(k)) return; seen.add(k); flags.push({ f: field, t: e.kind, sev: e.sev, m: text.slice(s, en).slice(0, 60), s, e: en }); };
  // tek kelime
  for (const tk of toks) { const e = matchToken(tk.cands, bl); if (e) push(e, tk.s, tk.e); }
  // cok kelimeli ifadeler
  for (const ph of bl.phrases) {
    const n = ph.words.length;
    for (let i = 0; i + n <= toks.length; i++) {
      if (ph.words.every((w, k) => toks[i + k].cands.includes(w))) push(ph, toks[i].s, toks[i + n - 1].e);
    }
  }
  // harf harf yazim: "k u r v e", "k.u.r.v.e"
  for (const m of p.s.matchAll(SPACED)) {
    const letters = collapse([...m[1]].filter((c) => /\p{L}/u.test(c)).join(''));
    const e = matchToken([letters], bl);
    if (!e) continue;
    const a = p.strToMc[m.index], b = p.strToMc[m.index + m[1].length - 1];
    push(e, p.os[a], p.oe[b]);
  }
}

function spamSignals(field, text, flags) {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  if (letters.length > 40) {
    const up = letters.filter((c) => c !== c.toLowerCase() && c === c.toUpperCase()).length;
    if (up / letters.length > 0.55) flags.push({ f: field, t: 'caps', sev: 1, m: 'SHUME LETER TE MEDHA', s: 0, e: 0 });
  }
  if (/(.)\1{7,}/u.test(text)) flags.push({ f: field, t: 'repeat', sev: 1, m: 'karakter tekrari', s: 0, e: 0 });
  const urls = (text.match(/(?:https?:\/\/|www\.)\S+/gi) || []).length;
  if (urls >= 3) flags.push({ f: field, t: 'spam_links', sev: 2, m: `${urls} link`, s: 0, e: 0 });
}

const WEIGHT = { 1: 8, 2: 20, 3: 40 };
function score(flags) {
  let sc = 0, acc = 0;
  for (const f of flags) {
    if (f.t === 'accusation') { acc = Math.min(6, acc + 3); continue; } // tek basina bilgi niteliginde
    sc += WEIGHT[f.sev] || 8;
  }
  return Math.min(100, sc + acc);
}
const level = (sc) => (sc >= 40 ? 'red' : sc >= 15 ? 'yellow' : 'green');

// Ana giris: {title, body} + baglam (userId, companyId, ipHmac). Veritabani bagimlilari yalniz baglam sinyallerinde
async function screenText({ title, body }) {
  const flags = [];
  await scanField('title', title, flags);
  await scanField('body', body, flags);
  for (const [f, text] of [['title', title], ['body', body]]) {
    for (const r of PII) addMatches(flags, f, text, r.t, r.sev, r.re);
    findPersons(f, text, flags);
    spamSignals(f, text, flags);
  }
  // iftira riski: kisi adi + suc iddiasi birlikte
  const hasPerson = flags.some((f) => f.t === 'person_named');
  const acc = flags.filter((f) => f.t === 'accusation');
  if (hasPerson && acc.length) flags.push({ f: 'body', t: 'defamation_risk', sev: 2, m: 'kisi adi + suc iddiasi', s: 0, e: 0 });
  // cakisan ayni konum bayraklarini (ornek: telefon iki regex) tekilleştir
  const uniq = [], seen = new Set();
  for (const f of flags) { const k = `${f.f}:${f.s}:${f.e}:${f.t}`; if (!seen.has(k)) { seen.add(k); uniq.push(f); } }
  uniq.sort((a, b) => (a.f === b.f ? a.s - b.s : a.f < b.f ? 1 : -1));
  return uniq;
}

// Baglam sinyalleri (hesap yasi, onceki redler, ayni metin, toplu saldiri)
async function contextFlags({ userId, companyId, ipHmac, bodyHash }) {
  const flags = [];
  const add = (t, sev, m) => flags.push({ f: 'ctx', t, sev, m, s: 0, e: 0 });
  const [[u]] = await pool.query('SELECT TIMESTAMPDIFF(MINUTE, created_at, UTC_TIMESTAMP()) AS age FROM users WHERE id = ?', [userId]);
  if (u && u.age < 30) add('new_account', 1, `hesap ${u.age} dk once acildi`);
  const [[rj]] = await pool.query("SELECT COUNT(*) n FROM complaints WHERE user_id = ? AND status = 'rejected'", [userId]);
  if (rj.n >= 2) add('prior_rejects', 2, `${rj.n} onceki red`);
  if (bodyHash) {
    const [[d]] = await pool.query('SELECT COUNT(*) n FROM complaints WHERE body_hash = ?', [bodyHash]);
    if (d.n > 0) add('duplicate_text', 3, 'ayni metin daha once gonderilmis');
  }
  if (companyId) {
    const [[b]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) n FROM complaints WHERE company_id = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)", [companyId]);
    if (b.n >= 4) add('burst', 2, `son 24 saatte ${b.n} farkli kullanici`);
  }
  if (ipHmac) {
    const [[i]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) n FROM complaints WHERE ip_hmac = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)", [ipHmac]);
    if (i.n >= 2) add('shared_ip', 2, `ayni IP'den ${i.n} farkli hesap`);
  }
  return flags;
}

const hashBody = (body) => sha256(body.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim());

// Maskeleme: secilen turlerdeki eslesmeleri *** ile degistirir
function mask(text, flags, field, kinds) {
  const spans = flags.filter((f) => f.f === field && kinds.includes(f.t) && f.e > f.s).sort((a, b) => b.s - a.s);
  let out = text;
  let lastStart = Infinity;
  for (const f of spans) {
    if (f.e > lastStart) continue; // ust uste binenleri atla
    out = out.slice(0, f.s) + '***' + out.slice(f.e);
    lastStart = f.s;
  }
  return out;
}

module.exports = { screenText, contextFlags, score, level, mask, hashBody, invalidate, loadBlocklist };
