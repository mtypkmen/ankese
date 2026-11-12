'use strict';
const express = require('express');
const config = require('../config');
const pool = require('../db');
const PATHS = require('../lib/paths');
const { slugify } = require('../lib/page');

const router = express.Router();
const MAX = 45000; // sitemap sinirinin (50k) altinda; asilirsa sitemap indeksine gecilmeli
let cache = { at: 0, xml: '' };
const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function entry(sqPath, enPath, lastmod) {
  const o = config.siteOrigin;
  const alt = `<xhtml:link rel="alternate" hreflang="sq" href="${x(o + sqPath)}"/><xhtml:link rel="alternate" hreflang="en" href="${x(o + enPath)}"/>`;
  const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `<url><loc>${x(o + sqPath)}</loc>${lm}${alt}</url>\n<url><loc>${x(o + enPath)}</loc>${lm}${alt}</url>`;
}

async function build() {
  const out = [], S = PATHS.sq, E = PATHS.en;
  out.push(entry(S.home, E.home));
  for (const k of ['brands', 'category', 'terms', 'privacy', 'rules', 'cookies', 'contact', 'about', 'faq', 'privacyMembers', 'privacyVisitors', 'reviewGuide', 'transparency']) out.push(entry(S[k], E[k]));
  const [cats] = await pool.query("SELECT slug FROM categories WHERE id IN (SELECT category_id FROM companies WHERE status = 'active') ORDER BY sort");
  for (const c of cats) out.push(entry(`${S.category}/${c.slug}`, `${E.category}/${c.slug}`));
  const [cities] = await pool.query("SELECT DISTINCT ci.slug FROM cities ci JOIN companies c ON c.city_id = ci.id AND c.status = 'active'");
  for (const c of cities) out.push(entry(`${S.city}/${c.slug}`, `${E.city}/${c.slug}`));
  const [comps] = await pool.query(
    `SELECT c.slug, DATE_FORMAT(MAX(x.published_at), '%Y-%m-%d') AS lm FROM companies c JOIN complaints x ON x.company_id = c.id AND x.status IN ('published','resolved')
      WHERE c.status = 'active' GROUP BY c.id`);
  for (const c of comps) out.push(entry(`${S.company}/${c.slug}`, `${E.company}/${c.slug}`, c.lm));
  const [cs] = await pool.query(
    `SELECT x.id, x.title, c.slug, DATE_FORMAT(x.published_at, '%Y-%m-%d') AS lm FROM complaints x JOIN companies c ON c.id = x.company_id
      WHERE x.status IN ('published','resolved') AND c.status = 'active' ORDER BY x.published_at DESC LIMIT ?`, [MAX]);
  for (const r of cs) { const s = `${r.id}-${slugify(r.title)}`; out.push(entry(`${S.company}/${r.slug}/${s}`, `${E.company}/${r.slug}/${s}`, r.lm)); }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${out.join('\n')}\n</urlset>\n`;
}

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    if (Date.now() - cache.at > 600000) cache = { at: Date.now(), xml: await build() };
    res.type('application/xml').set('Cache-Control', 'public, max-age=600').send(cache.xml);
  } catch (e) { next(e); }
});

module.exports = router;
