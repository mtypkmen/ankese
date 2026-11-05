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

function companyList(rows, t, p) {
  if (!rows.length) return `<p>${esc(t.no_companies)}</p>`;
  return `<ul class="plist">${rows.map((r) => `<li><span><b><a href="${p.company}/${esc(r.slug)}">${esc(r.name)}</a></b><small>${esc(r.city || '')}${r.city ? ', ' : ''}${esc(t.countries[r.country_code])} · ${r.n} ${esc(t.complaints.toLowerCase())}</small></span></li>`).join('')}</ul>`;
}

const COMPANY_SQL = `SELECT c.id, c.slug, c.name, c.country_code, ci.name AS city,
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
        `SELECT c.id, c.slug, c.name, c.country_code, c.website, ci.name AS city, ci.slug AS city_slug, k.slug AS cat_slug, k.name_${loc} AS cat
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
<h1>${esc(c.name)}</h1><p class="meta">${esc(c.city || '')}${c.city ? ', ' : ''}${esc(t.countries[c.country_code])} · ${esc(c.cat)}</p>
<p class="stats"><b>${st.total}</b> ${esc(t.complaints.toLowerCase())} · <b>${st.resolved || 0}</b> ${esc(t.resolved_count)}</p>
<p><a class="btn" href="${p.write}/${c.id}">${esc(t.write_for_company)}</a></p>
<h2 class="sec">${esc(t.published_complaints)}</h2>${list || `<p>${esc(t.no_complaints)}</p>`}${pager(`${p.company}/${c.slug}`, pg, hasNext, t)}`);
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
}

mount('sq');
mount('en');
module.exports = router;
