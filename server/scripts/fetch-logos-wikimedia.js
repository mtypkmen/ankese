'use strict';
// Kullanim: node server/scripts/fetch-logos-wikimedia.js <calisma-klasoru>
// brands.json'daki her marka icin Wikidata'da "logo image" (P154) arar, Wikimedia Commons'tan 512px gorsel indirir.
// Ham gorseller <calisma-klasoru>/raw/<slug>.<ext> olur; eslesme bilgisi server/data/logo-wikidata.json'a yazilir.
// Sonraki adim: normalize-logos.py (PNG'ye cevirir, kalite kontrolu yapar, logos/ ve brands.json'u gunceller).
const fs = require('fs');
const path = require('path');

const work = process.argv[2];
if (!work) { console.error('calisma klasoru ver'); process.exit(1); }
const RAW = path.join(work, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const UA = 'AnkeseLogoBot/1.0 (https://ankese.com; consumer complaints site; logo lookup via Wikidata)';
const brands = require('../data/brands.json');

// Wikidata'da yerel adiyla bulunmayanlar icin Ingilizce karsiliklar
const ALIAS = {
  'Universiteti i Tiranës': 'University of Tirana', 'Universiteti Politeknik i Tiranës': 'Polytechnic University of Tirana',
  'Universiteti Epoka': 'Epoka University', 'Universiteti Europian i Tiranës': 'European University of Tirana',
  'Universiteti Marin Barleti': 'Marin Barleti University', 'Universiteti Aleksandër Moisiu Durrës': 'Aleksandër Moisiu University',
  'Universiteti Mesdhetar i Shqipërisë': 'Mediterranean University of Albania', 'Universiteti Bedër': 'Beder University',
  'Universiteti New York Tirana': 'University of New York Tirana', 'Universiteti Aleksandër Xhuvani': 'University of Elbasan',
  'Universiteti Fan S. Noli': 'University of Korçë', 'Universiteti Ismail Qemali Vlorë': 'University of Vlorë',
  'Universiteti Luigj Gurakuqi': 'University of Shkodër', 'Universiteti i Prishtinës': 'University of Pristina',
  'Kolegji AAB': 'AAB College', 'Universiteti UBT': 'UBT', 'Universiteti i Prizrenit': 'University of Prizren',
  'Universiteti i Gjakovës': 'University of Gjakova', 'Universiteti i Pejës': 'University of Peja',
  'Universiteti i Mitrovicës': 'University of Mitrovica', 'Universiteti i Gjilanit': 'University of Gjilan',
  'Posta Shqiptare': 'Albanian Post', 'Posta e Kosovës': 'Post of Kosovo', 'Hekurudha Shqiptare': 'Hekurudha Shqiptare',
  'Aeroporti Ndërkombëtar i Tiranës': 'Tirana International Airport', 'Aeroporti Ndërkombëtar i Prishtinës': 'Pristina International Airport',
  'Banka Kombëtare Tregtare (BKT)': 'Banka Kombëtare Tregtare', 'ALBtelecom': 'Albtelecom', 'PLUS Communication': 'Plus Communication',
};
const STRIP = /\b(shqip[eë]ri|kosov[eë]|albania|kosovo|kosova|prishtin[eë]|tirana|tir[aë]n[eë]s?)\b/gi;
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function queries(name) {
  if (ALIAS[name]) return [ALIAS[name]];
  const inner = /\(([^)]+)\)/.exec(name)?.[1];
  const base = name.replace(/\([^)]*\)/g, '').replace(STRIP, '').replace(/\s+/g, ' ').trim();
  return [...new Set([base, name.replace(/\([^)]*\)/g, '').trim(), inner].filter(Boolean))];
}

async function api(params) {
  const u = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u, { headers: { 'user-agent': UA } });
    if (r.ok) return r.json();
    await new Promise((s) => setTimeout(s, 1500 * (i + 1)));
  }
  return null;
}

async function find(name) {
  for (const q of queries(name)) {
    const nq = norm(q);
    if (nq.length < 2) continue;
    const s = await api({ action: 'wbsearchentities', search: q, language: 'en', limit: '8' });
    const ids = (s?.search || []).map((x) => x.id);
    if (!ids.length) continue;
    const e = await api({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels|aliases', languages: 'en|sq' });
    for (const id of ids) {
      const ent = e?.entities?.[id]; if (!ent) continue;
      const file = ent.claims?.P154?.[0]?.mainsnak?.datavalue?.value; if (!file) continue;
      const names = [...Object.values(ent.labels || {}).map((l) => l.value), ...Object.values(ent.aliases || {}).flat().map((a) => a.value)].map(norm);
      // etiket sorguyla birebir ya da biri digerini kapsiyorsa (en az 4 harf) eslesir; yanlis varlik riskine karsi siki
      if (names.some((n) => n === nq || (n.length >= 4 && nq.length >= 4 && (n.includes(nq) || nq.includes(n)) && Math.abs(n.length - nq.length) <= 12))) {
        return { qid: id, label: ent.labels?.en?.value || ent.labels?.sq?.value || id, file };
      }
    }
  }
  return null;
}

// ayni marka iki ulke icin (Adidas Shqiperi/Kosove) tekrar sorgulanmasin: sonuclar onbellekte
const findMemo = new Map(), dlMemo = new Map();
const memo = (m, k, fn) => { if (!m.has(k)) m.set(k, fn()); return m.get(k); };
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));

async function fetchFile(file) {
  const u = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=512`;
  for (let i = 0; i < 5; i++) {
    const r = await fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow' });
    if (r.status === 429 || r.status >= 500) { await sleep((Number(r.headers.get('retry-after')) || 2 * (i + 1)) * 1000); continue; }
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200 || buf.length > 4 * 1024 * 1024) return null;
    const ct = r.headers.get('content-type') || '';
    const ext = /png/.test(ct) ? 'png' : /jpe?g/.test(ct) ? 'jpg' : /webp/.test(ct) ? 'webp' : /gif/.test(ct) ? 'gif' : null;
    return ext ? { buf, ext } : null; // svg/baska tur gelirse reddet
  }
  return null;
}
async function download(file, slug) {
  const d = await memo(dlMemo, file, () => fetchFile(file));
  if (!d) return null;
  fs.writeFileSync(path.join(RAW, `${slug}.${d.ext}`), d.buf);
  return d.ext;
}

(async () => {
  const out = {}, miss = [];
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < brands.length) {
      const b = brands[i++];
      try {
        const m = await memo(findMemo, queries(b.name).join('|'), () => find(b.name));
        const ext = m && await download(m.file, b.slug);
        if (m && ext) out[b.slug] = { ...m, ext, filePage: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(m.file.replace(/ /g, '_'))}` };
        else miss.push(b.name);
      } catch (e) { miss.push(`${b.name} (${e.message})`); }
      await sleep(150);
    }
  }));
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'logo-wikidata.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(work, 'miss.txt'), miss.sort().join('\n') + '\n');
  console.log(`marka ${brands.length} | wikidata logosu bulunan ${Object.keys(out).length} | bulunamayan ${miss.length}`);
})();
