'use strict';
// Kullanim: node server/scripts/fetch-logos.js
// brand-candidates.tsv -> alan adini dogrular, logoyu indirir -> brands.json + public/assets/logos/
// Yalnizca PNG/JPEG/WEBP/GIF/ICO kabul edilir (SVG yok: ayni origin'den dogrudan acilirsa script calistirabilir).
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const OUT = path.join(__dirname, '..', '..', 'public', 'assets', 'logos');
const MAX_BYTES = 300 * 1024;
// Kimligimizi saklamiyoruz; botu engelleyen siteler icin gstatic yedegi var, UA taklidi yok.
const UA = 'Mozilla/5.0 (compatible; AnkeseLogoBot/1.0; +https://ankese.com)';
const gstatic = (origin) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(origin)}&size=128`;

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);

async function get(url, { text = false, timeout = 10000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': UA, accept: text ? 'text/html' : 'image/*' } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > (text ? 600 * 1024 : MAX_BYTES)) return null;
    return { buf, url: r.url };
  } catch { return null; } finally { clearTimeout(timer); }
}

function sniff(b) {
  if (b.length < 16) return null;
  if (b.readUInt32BE(0) === 0x89504e47) return { ext: 'png', w: b.readUInt32BE(16) };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', w: 999 };
  if (b.toString('ascii', 0, 4) === 'GIF8') return { ext: 'gif', w: b.readUInt16LE(6) };
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', w: 999 };
  if (b.readUInt32LE(0) === 0x00010000) return { ext: 'ico', w: b[6] || 256 };
  return null;
}

function iconCandidates(html, base) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = /rel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1].toLowerCase() || '';
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || !/icon/.test(rel) || href.startsWith('data:')) continue;
    if (/\.svg(\?|$)/i.test(href)) continue;
    const size = parseInt(/sizes\s*=\s*["'](\d+)/i.exec(tag)?.[1] || '0', 10);
    let abs; try { abs = new URL(href, base).href; } catch { continue; }
    out.push({ abs, score: (rel.includes('apple-touch') ? 1000 : 0) + size });
  }
  return out.sort((a, b) => b.score - a.score).map((x) => x.abs);
}

async function logoFor(domains) {
  for (const d of domains) {
    let page = null;
    for (const host of [d, `www.${d}`]) { page = await get(`https://${host}/`, { text: true }); if (page) break; }
    const base = page ? page.url : `https://${d}/`;
    const origin = new URL(base).origin;
    const urls = [...(page ? iconCandidates(page.buf.toString('utf8'), base) : []), ...(page ? [`${origin}/apple-touch-icon.png`] : []), gstatic(origin)];
    for (const u of urls) {
      const r = await get(u); if (!r) continue;
      const s = sniff(r.buf); if (!s || s.w < 32) continue;
      return { domain: d, website: origin, buf: r.buf, ext: s.ext, source: u };
    }
    if (page) return { domain: d, website: origin, buf: null };
  }
  return null;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const rows = fs.readFileSync(path.join(DATA, 'brand-candidates.tsv'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => {
    const [name, cc, city, cat, doms] = l.split('\t');
    return { name, cc, city, cat, domains: doms.split(',') };
  });
  // ayni marka+ulke iki kez girildiyse ilki kalir
  const dup = new Set();
  rows.splice(0, rows.length, ...rows.filter((r) => {
    const k1 = `n:${slugify(r.name)}`, k2 = `d:${r.cc}:${r.domains[0]}:${r.cat}`;
    if (dup.has(k1) || dup.has(k2)) return false;
    dup.add(k1); dup.add(k2); return true;
  }));
  const cache = new Map();
  const result = [], dead = [];
  let i = 0;
  await Promise.all(Array.from({ length: 10 }, async () => {
    while (i < rows.length) {
      const r = rows[i++];
      const key = r.domains.join(',');
      if (!cache.has(key)) cache.set(key, logoFor(r.domains));
      const f = await cache.get(key);
      if (!f) { dead.push(r.name); continue; }
      const slug = slugify(r.name);
      let logo = null;
      if (f.buf) { logo = `${slug}.${f.ext}`; fs.writeFileSync(path.join(OUT, logo), f.buf); }
      result.push({ name: r.name, slug, country: r.cc, city: r.city, category: r.cat, website: f.website, logo, logoSource: f.buf ? f.source : null });
    }
  }));
  const seen = new Set();
  result.sort((a, b) => a.name.localeCompare(b.name));
  for (const b of result) if (seen.has(b.slug)) throw new Error(`slug cakismasi: ${b.slug}`); else seen.add(b.slug);
  fs.writeFileSync(path.join(DATA, 'brands.json'), JSON.stringify(result, null, 1));
  fs.writeFileSync(path.join(DATA, 'brands-dead.txt'), dead.sort().join('\n') + '\n');
  console.log(`aday ${rows.length} | dogrulanan ${result.length} | logolu ${result.filter((b) => b.logo).length} | ulasilamayan ${dead.length}`);
})();
