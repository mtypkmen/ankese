'use strict';
const express = require('express');
const config = require('../config');
const pool = require('../db');
const S = require('../lib/i18n');
const PATHS = require('../lib/paths');
const { esc } = require('../lib/html');
const { page, slugify, publicName } = require('../lib/page');

const router = express.Router();
const PER = 20;
const slugOk = (s) => /^[a-z0-9-]{1,120}$/.test(s);
const pageNo = (q) => Math.min(Math.max(parseInt(q, 10) || 1, 1), 500);
const likeEsc = (q) => q.replace(/[!%_]/g, '!$&');
const oneLine = (v) => (typeof v === 'string' ? v.normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').replace(/\s+/g, ' ').trim() : '');
const excerpt = (s, n = 200) => { const a = [...s.replace(/\s+/g, ' ')]; return a.length > n ? a.slice(0, n).join('') + '…' : a.join(''); };
const paras = (s) => s.split(/\n{2,}/).map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('');

function pager(base, pg, hasNext, t) {
  const j = (n) => `${base}${base.includes('?') ? '&' : '?'}page=${n}`;
  if (pg <= 1 && !hasNext) return '';
  return `<nav class="pager">${pg > 1 ? `<a href="${j(pg - 1)}">← ${esc(t.prev)}</a>` : '<span></span>'}${hasNext ? `<a href="${j(pg + 1)}">${esc(t.next)} →</a>` : ''}</nav>`;
}

// logo varsa gosterir, yoksa bas harfli daire; dosya adi DB'den gelir ama yine de kisitli desenle dogrulanir
const logoOk = (s) => typeof s === 'string' && /^[a-z0-9-]{1,100}\.(png|jpg|webp|gif|ico)$/.test(s);
const logoTag = (r, size = 44) => logoOk(r.logo)
  ? `<img class="clogo" src="/assets/logos/${r.logo}" width="${size}" height="${size}" alt="${esc(r.name)}" loading="lazy">`
  : `<span class="clogo ph" aria-hidden="true">${esc([...r.name][0].toUpperCase())}</span>`;

function companyList(rows, t, p) {
  if (!rows.length) return `<p>${esc(t.no_companies)}</p>`;
  return `<ul class="plist">${rows.map((r) => `<li>${logoTag(r)}<span><b><a href="${p.company}/${esc(r.slug)}">${esc(r.name)}</a></b><small>${esc(r.city || '')}${r.city ? ', ' : ''}${esc(t.countries[r.country_code])} · ${r.n} ${esc(t.complaints.toLowerCase())}</small></span></li>`).join('')}</ul>`;
}

const COMPANY_SQL = `SELECT c.id, c.slug, c.name, c.logo, c.country_code, ci.name AS city,
  (SELECT COUNT(*) FROM complaints x WHERE x.company_id = c.id AND x.status IN ('published','resolved')) AS n
  FROM companies c LEFT JOIN cities ci ON ci.id = c.city_id`;

function mount(loc) {
  const t = S[loc], p = PATHS[loc], oth = loc === 'sq' ? 'en' : 'sq', o = PATHS[oth];
  const out = (req, res, o2) => page(req, res, loc, o2);
  const notFound = (req, res) => out(req, res, { status: 404, title: t.not_found, body: `<h1>${esc(t.not_found)}</h1><p><a href="${p.home}">${esc(t.back_home)}</a></p>`, otherPath: o.home, robots: 'noindex,nofollow' });
  const wide = (b) => `<div class="pub">${b}</div>`;

  // ---------- sirket sayfasi ----------
  router.get(`${p.company}/:slug`, async (req, res, next) => {
    try {
      if (!slugOk(req.params.slug)) return notFound(req, res);
      const [cr] = await pool.query(
        `SELECT c.id, c.slug, c.name, c.logo, c.country_code, c.website, ci.name AS city, ci.slug AS city_slug, k.slug AS cat_slug, k.name_${loc} AS cat
           FROM companies c LEFT JOIN cities ci ON ci.id = c.city_id JOIN categories k ON k.id = c.category_id
          WHERE c.slug = ? AND c.status = 'active'`, [req.params.slug]);
      const c = cr[0]; if (!c) return notFound(req, res);
      const pg = pageNo(req.query.page);
      const [[st]] = await pool.query(`SELECT COUNT(*) total, SUM(status = 'resolved') resolved FROM complaints WHERE company_id = ? AND status IN ('published','resolved')`, [c.id]);
      const [rows] = await pool.query(
        `SELECT id, title, body, status, user_id, DATE_FORMAT(published_at, '%d.%m.%Y') AS pub, (SELECT display_name FROM users u WHERE u.id = complaints.user_id) AS author
           FROM complaints WHERE company_id = ? AND status IN ('published','resolved') ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
        [c.id, PER + 1, (pg - 1) * PER]);
      const hasNext = rows.length > PER;
      const list = rows.slice(0, PER).map((r) => `<article class="cmp"><h3><a href="${p.company}/${esc(c.slug)}/${r.id}-${slugify(r.title)}">${esc(r.title)}</a></h3>
<p class="meta">${esc(publicName(r.author))} · ${esc(r.pub)}${r.status === 'resolved' ? ` · <span class="tag ok">${esc(t.st_resolved)}</span>` : ''}</p><p>${esc(excerpt(r.body))}</p></article>`).join('');
      const body = wide(`<nav class="crumbs"><a href="${p.home}">${esc(t.home)}</a> › <a href="${p.category}/${esc(c.cat_slug)}">${esc(c.cat)}</a></nav>
<div class="chead">${logoTag(c, 72)}<h1>${esc(c.name)}</h1></div><p class="meta">${esc(c.city || '')}${c.city ? ', ' : ''}${esc(t.countries[c.country_code])} · ${esc(c.cat)}</p>
<p class="stats"><b>${st.total}</b> ${esc(t.complaints.toLowerCase())} · <b>${st.resolved || 0}</b> ${esc(t.resolved_count)}</p>
<p><a class="btn" href="${p.write}/${c.id}">${esc(t.write_for_company)}</a></p>
<h2 class="sec">${esc(t.published_complaints)}</h2>${list || `<p>${esc(t.no_complaints)}</p>`}${pager(`${p.company}/${c.slug}`, pg, hasNext, t)}
<p class="brandnote">${esc(t.brand_note)}</p>`);
      out(req, res, { title: c.name, body, otherPath: `${o.company}/${c.slug}`, canonical: `${config.siteOrigin}${p.company}/${c.slug}`,
        robots: st.total > 0 ? 'index,follow' : 'noindex,follow', description: `${c.name}: ${st.total} ${t.complaints.toLowerCase()}` });
    } catch (e) { next(e); }
  });

  // ---------- sikayet detayi ----------
  router.get(`${p.company}/:slug/:idslug`, async (req, res, next) => {
    try {
      const m = /^(\d{1,12})(?:-[a-z0-9-]*)?$/.exec(req.params.idslug);
      if (!m || !slugOk(req.params.slug)) return notFound(req, res);
      const [r] = await pool.query(
        `SELECT x.id, x.title, x.body, x.status, DATE_FORMAT(x.published_at, '%d.%m.%Y') AS pub, DATE_FORMAT(x.incident_date, '%d.%m.%Y') AS inc,
                x.amount, x.currency, u.display_name AS author, c.slug, c.name AS cname, c.id AS cid
           FROM complaints x JOIN companies c ON c.id = x.company_id JOIN users u ON u.id = x.user_id
          WHERE x.id = ? AND x.status IN ('published','resolved') AND c.status = 'active'`, [Number(m[1])]);
      const x = r[0];
      if (!x || x.slug !== req.params.slug) return notFound(req, res);
      const canonicalPath = `${p.company}/${x.slug}/${x.id}-${slugify(x.title)}`;
      if (req.path !== canonicalPath) return res.redirect(301, canonicalPath);
      const body = wide(`<nav class="crumbs"><a href="${p.home}">${esc(t.home)}</a> › <a href="${p.company}/${esc(x.slug)}">${esc(x.cname)}</a></nav>
<h1>${esc(x.title)}</h1>
<p class="meta">${esc(publicName(x.author))} ${esc(t.on)} ${esc(x.pub)}${x.status === 'resolved' ? ` · <span class="tag ok">${esc(t.st_resolved)}</span>` : ''}</p>
<dl class="kv"><dt>${esc(t.company)}</dt><dd><a href="${p.company}/${esc(x.slug)}">${esc(x.cname)}</a></dd><dt>${esc(t.incident)}</dt><dd>${esc(x.inc)}</dd>${x.amount ? `<dt>${esc(t.amount)}</dt><dd>${esc(x.amount)} ${esc(x.currency)}</dd>` : ''}</dl>
<div class="ctext">${paras(x.body)}</div>`);
      out(req, res, { title: x.title, body, otherPath: `${o.company}/${x.slug}/${x.id}-${slugify(x.title)}`,
        canonical: `${config.siteOrigin}${canonicalPath}`, robots: 'index,follow', description: excerpt(x.body, 155) });
    } catch (e) { next(e); }
  });

  // ---------- sektor / sehir ----------
  async function listPage(req, res, kind) {
    const slug = req.params.slug;
    if (!slugOk(slug)) return notFound(req, res);
    let name, where, args;
    if (kind === 'category') {
      const [r] = await pool.query(`SELECT id, name_${loc} AS name FROM categories WHERE slug = ?`, [slug]);
      if (!r[0]) return notFound(req, res);
      name = r[0].name; where = 'c.category_id = ?'; args = [r[0].id];
    } else {
      const [r] = await pool.query('SELECT id, name FROM cities WHERE slug = ?', [slug]);
      if (!r[0]) return notFound(req, res);
      name = r[0].name; where = 'c.city_id = ?'; args = [r[0].id];
    }
    const pg = pageNo(req.query.page);
    const [rows] = await pool.query(`${COMPANY_SQL} WHERE c.status = 'active' AND ${where} ORDER BY n DESC, c.name LIMIT ? OFFSET ?`, [...args, PER + 1, (pg - 1) * PER]);
    const hasNext = rows.length > PER;
    const base = `${p[kind]}/${slug}`;
    out(req, res, { title: name, otherPath: `${o[kind]}/${slug}`, canonical: `${config.siteOrigin}${base}`,
      robots: rows.length ? 'index,follow' : 'noindex,follow', description: `${name} – ${t.companies}`,
      body: wide(`<nav class="crumbs"><a href="${p.home}">${esc(t.home)}</a></nav><h1>${esc(name)}</h1><h2 class="sec">${esc(t.companies)}</h2>${companyList(rows.slice(0, PER), t, p)}${pager(base, pg, hasNext, t)}`) });
  }
  router.get(`${p.category}/:slug`, (req, res, next) => listPage(req, res, 'category').catch(next));
  router.get(`${p.city}/:slug`, (req, res, next) => listPage(req, res, 'city').catch(next));

  // ---------- arama ----------
  router.get(p.search, async (req, res, next) => {
    try {
      const q = oneLine(req.query.q).slice(0, 80);
      let list = '';
      if (q.length >= 2) {
        const like = `%${likeEsc(q)}%`;
        const [rows] = await pool.query(
          `${COMPANY_SQL} WHERE c.status = 'active' AND (c.name LIKE ? ESCAPE '!' OR EXISTS (SELECT 1 FROM company_aliases a WHERE a.company_id = c.id AND a.alias LIKE ? ESCAPE '!')) ORDER BY n DESC, c.name LIMIT 30`, [like, like]);
        list = `<h2 class="sec">${esc(t.results)}</h2>${rows.length ? companyList(rows, t, p) : `<p>${esc(t.no_results)}</p>`}`;
      }
      out(req, res, { title: t.search, otherPath: `${o.search}${q ? `?q=${encodeURIComponent(q)}` : ''}`, robots: 'noindex,follow',
        body: wide(`<h1>${esc(t.search)}</h1><form method="get" action="${p.search}" class="searchrow"><input type="search" name="q" value="${esc(q)}" placeholder="${esc(t.search_ph)}" maxlength="80" aria-label="${esc(t.search_ph)}" required><button class="btn" type="submit">${esc(t.search)}</button></form>${list}`) });
    } catch (e) { next(e); }
  });

  // ---------- header menusu: tum ankesalar / top 20 / ayin en iyileri ----------
  const L = LISTS[loc];
  const rankList = (rows, unit) => `<ol class="plist rankl">${rows.map((r, i) => `<li>${logoTag(r)}<span><b><span class="rk">${i + 1}</span><a href="${p.company}/${esc(r.slug)}">${esc(r.name)}</a></b><small>${esc(r.city || '')}${r.city ? ', ' : ''}${esc(t.countries[r.country_code])} · ${r.n} ${esc(unit)}</small></span></li>`).join('')}</ol>`;

  router.get(p.complaints, async (req, res, next) => {
    try {
      const pg = pageNo(req.query.page);
      const [rows] = await pool.query(
        `SELECT x.id, x.title, x.body, x.status, DATE_FORMAT(x.published_at, '%d.%m.%Y') AS pub, c.slug, c.name AS cname, u.display_name AS author
           FROM complaints x JOIN companies c ON c.id = x.company_id JOIN users u ON u.id = x.user_id
          WHERE x.status IN ('published','resolved') AND c.status = 'active'
          ORDER BY x.published_at DESC, x.id DESC LIMIT ? OFFSET ?`, [PER + 1, (pg - 1) * PER]);
      const hasNext = rows.length > PER;
      const list = rows.length ? rows.slice(0, PER).map((x) => `<article class="cmp"><h3><a href="${p.company}/${esc(x.slug)}/${x.id}-${slugify(x.title)}">${esc(x.title)}</a></h3><p class="meta"><a href="${p.company}/${esc(x.slug)}">${esc(x.cname)}</a> · ${esc(publicName(x.author))} · ${esc(x.pub)}${x.status === 'resolved' ? ` · <span class="tag ok">${esc(t.st_resolved)}</span>` : ''}</p><p>${esc(excerpt(x.body, 180))}</p></article>`).join('') : `<p>${esc(L.empty)}</p>`;
      out(req, res, { title: L.allH, otherPath: o.complaints, canonical: `${config.siteOrigin}${p.complaints}`, robots: rows.length ? 'index,follow' : 'noindex,follow', description: L.allP,
        body: wide(`<h1>${esc(L.allH)}</h1><p class="lead2">${esc(L.allP)}</p>${list}${pager(p.complaints, pg, hasNext, t)}`) });
    } catch (e) { next(e); }
  });

  router.get(p.top, async (req, res, next) => {
    try {
      const [rows] = await pool.query(`${COMPANY_SQL} WHERE c.status = 'active' ORDER BY n DESC, CRC32(CONCAT(c.id, YEARWEEK(UTC_DATE(), 3))), c.id LIMIT 20`); // sikayet yokken esitlikte haftalik sabit rastgele 20
      out(req, res, { title: L.topH, otherPath: o.top, canonical: `${config.siteOrigin}${p.top}`, robots: rows.length ? 'index,follow' : 'noindex,follow', description: L.topP,
        body: wide(`<h1>${esc(L.topH)}</h1><p class="lead2">${esc(L.topP)}</p>${rows.length ? rankList(rows, t.complaints.toLowerCase()) : `<p>${esc(L.empty)}</p>`}`) });
    } catch (e) { next(e); }
  });

  router.get(p.best, async (req, res, next) => {
    try {
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const [rows] = await pool.query(
        `SELECT c.slug, c.name, c.logo, c.country_code, ci.name AS city, COUNT(*) AS n
           FROM complaints x JOIN companies c ON c.id = x.company_id LEFT JOIN cities ci ON ci.id = c.city_id
          WHERE x.status = 'resolved' AND c.status = 'active' AND x.resolved_at >= ? AND x.resolved_at < ?
          GROUP BY c.id ORDER BY n DESC, c.name LIMIT 20`, [from, to]);
      const month = `${L.months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
      out(req, res, { title: L.bestH, otherPath: o.best, canonical: `${config.siteOrigin}${p.best}`, robots: rows.length ? 'index,follow' : 'noindex,follow', description: L.bestP(month),
        body: wide(`<h1>${esc(L.bestH)}</h1><p class="lead2">${esc(L.bestP(month))}</p>${rows.length ? rankList(rows, L.resolvedN) : `<p>${esc(L.bestEmpty)}</p>`}`) });
    } catch (e) { next(e); }
  });

  // ---------- tum markalar / yeni markalar (?c=al|xk ulke filtresi) ----------
  const BPER = 48;
  async function brandsPage(req, res, kind) {
    const cc = { al: 'AL', xk: 'XK' }[String(req.query.c || '').toLowerCase()];
    const pg = pageNo(req.query.page);
    const where = `c.status = 'active'${kind === 'new' ? ' AND c.created_at >= UTC_TIMESTAMP() - INTERVAL 1 MONTH' : ''}${cc ? ' AND c.country_code = ?' : ''}`, args = cc ? [cc] : [];
    const [rows] = await pool.query(
      `${COMPANY_SQL} WHERE ${where} ORDER BY ${kind === 'new' ? 'c.created_at DESC, c.id DESC' : 'c.name'} LIMIT ? OFFSET ?`, [...args, BPER + 1, (pg - 1) * BPER]);
    const [[tot]] = await pool.query(`SELECT COUNT(*) AS n FROM companies c WHERE ${where}`, args);
    const path = kind === 'new' ? p.newBrands : p.brands, other = kind === 'new' ? o.newBrands : o.brands;
    const q = cc ? `?c=${cc.toLowerCase()}` : '';
    const chip = (label, code) => `<a href="${path}${code ? `?c=${code}` : ''}"${(cc || '').toLowerCase() === code ? ' aria-current="true"' : ''}>${esc(label)}</a>`;
    const H = kind === 'new' ? L.newH : L.brandsH, P = kind === 'new' ? L.newP : L.brandsP;
    out(req, res, { title: H, otherPath: `${other}${q}`, canonical: `${config.siteOrigin}${path}`, robots: cc || pg > 1 ? 'noindex,follow' : 'index,follow', description: P,
      body: wide(`<h1>${esc(H)}</h1><p class="lead2">${esc(P)} <b>${tot.n}</b> ${esc(L.brandsN)}.</p>
<nav class="chips" aria-label="${esc(t.country)}">${chip(L.all, '')}${chip(t.countries.AL, 'al')}${chip(t.countries.XK, 'xk')}</nav>
${companyList(rows.slice(0, BPER), t, p)}${pager(`${path}${q}`, pg, rows.length > BPER, t)}`) });
  }
  // ---------- tum temalar (markasi olan sektorler) ----------
  router.get(p.category, async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT k.slug, k.name_${loc} AS name, COUNT(c.id) AS n FROM categories k JOIN companies c ON c.category_id = k.id AND c.status = 'active'
          GROUP BY k.id ORDER BY k.sort`);
      out(req, res, { title: L.topicsH, otherPath: o.category, canonical: `${config.siteOrigin}${p.category}`, robots: rows.length ? 'index,follow' : 'noindex,follow', description: L.topicsP,
        body: wide(`<h1>${esc(L.topicsH)}</h1><p class="lead2">${esc(L.topicsP)}</p><ul class="plist">${rows.map((r) =>
          `<li><span><b><a href="${p.category}/${esc(r.slug)}">${esc(r.name)}</a></b><small>${r.n} ${esc(L.brandsN)}</small></span></li>`).join('')}</ul>`) });
    } catch (e) { next(e); }
  });
  router.get(p.brands, (req, res, next) => brandsPage(req, res, 'all').catch(next));
  router.get(p.newBrands, (req, res, next) => brandsPage(req, res, 'new').catch(next));
}

const LISTS = {
  sq: {
    allH: 'Të gjitha ankesat', allP: 'Ankesat e publikuara, nga më e reja te më e vjetra.', empty: 'Ende nuk ka ankesa të publikuara.',
    topH: 'Top 20', topP: '20 kompanitë me më shumë ankesa të publikuara.',
    bestH: 'Më të mirët e muajit', bestP: (m) => `Kompanitë që zgjidhën më shumë ankesa në ${m}.`, bestEmpty: 'Këtë muaj ende nuk është zgjidhur asnjë ankesë.', resolvedN: 'të zgjidhura',
    brandsH: 'Të gjitha markat', brandsP: 'Kompanitë dhe markat në Shqipëri e Kosovë, në rend alfabetik. Gjithsej', newH: 'Markat e reja', newP: 'Markat e shtuara gjatë një muajit të fundit, nga më e reja. Gjithsej', brandsN: 'marka', all: 'Të gjitha',
    topicsH: 'Të gjitha temat', topicsP: 'Sektorët me kompani dhe marka në Ankese.com.',
    months: ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'],
  },
  en: {
    allH: 'All complaints', allP: 'Published complaints, newest first.', empty: 'No complaints published yet.',
    topH: 'Top 20', topP: 'The 20 companies with the most published complaints.',
    bestH: 'Best of Month', bestP: (m) => `Companies that resolved the most complaints in ${m}.`, bestEmpty: 'No complaints have been resolved this month yet.', resolvedN: 'resolved',
    brandsH: 'All brands', brandsP: 'Companies and brands in Albania and Kosovo, in alphabetical order. In total', newH: 'New brands', newP: 'Brands added in the last month, newest first. In total', brandsN: 'brands', all: 'All',
    topicsH: 'All topics', topicsP: 'Sectors with companies and brands on Ankese.com.',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

mount('sq');
mount('en');
module.exports = router;
