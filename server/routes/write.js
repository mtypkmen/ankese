'use strict';
const express = require('express');
const pool = require('../db');
const S = require('../lib/i18n');
const PATHS = require('../lib/paths');
const { esc, field, textarea, select } = require('../lib/html');
const { page } = require('../lib/page');
const rl = require('../lib/ratelimit');
const sess = require('../session');
const screen = require('../lib/screen');

const router = express.Router();
const str = (v) => (typeof v === 'string' ? v : '');
const CTL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]/g;
const len = (s) => [...s].length;

const oneLine = (v) => str(v).normalize('NFKC').replace(CTL, '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
const multiLine = (v) => str(v).normalize('NFKC').replace(/\r\n?/g, '\n').replace(CTL, '').replace(/[ \t]+/g, ' ')
  .replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const msg = (cls, text) => `<p class="msg ${cls}" role="status">${esc(text)}</p>`;
const csrfInput = (req) => `<input type="hidden" name="_csrf" value="${esc(req.csrfToken)}">`;
const likeEsc = (q) => q.replace(/[!%_]/g, '!$&');

function parseComplaint(b) {
  const title = oneLine(b.title), body = multiLine(b.body);
  if (len(title) < 10 || len(title) > 140) return { err: 'err_title' };
  if (len(body) < 80 || len(body) > 5000) return { err: 'err_body' };
  const d = str(b.incident_date);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return { err: 'err_date' };
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (dt.getUTCFullYear() !== +m[1] || dt.getUTCMonth() !== +m[2] - 1 || dt.getUTCDate() !== +m[3]) return { err: 'err_date' };
  const now = new Date(), min = new Date(Date.UTC(now.getUTCFullYear() - 3, now.getUTCMonth(), now.getUTCDate()));
  if (dt > now || dt < min) return { err: 'err_date' };
  let amount = null, currency = null;
  const a = str(b.amount).trim().replace(',', '.');
  if (a !== '') {
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(a)) return { err: 'err_amount' };
    amount = a;
    currency = ['ALL', 'EUR'].includes(str(b.currency)) ? str(b.currency) : null;
    if (!currency) return { err: 'err_amount' };
  }
  if (str(b.rules) !== '1') return { err: 'err_rules' };
  return { data: { title, body, date: d, amount, currency } };
}

// Moderasyon on incelemesi: icerik + baglam sinyalleri. Hata olursa sikayet yine kaydedilir (skor bos kalir, moderator gorur)
async function riskFor(req, d, companyId) {
  try {
    const bodyHash = screen.hashBody(d.body);
    const flags = [...(await screen.screenText({ title: d.title, body: d.body })),
      ...(await screen.contextFlags({ userId: req.user.id, companyId, ipHmac: sess.ipHmac(req), bodyHash }))];
    return { score: screen.score(flags), flags: JSON.stringify(flags), bodyHash };
  } catch (e) {
    console.error('tarama hatasi:', e.code || e.message);
    return { score: null, flags: null, bodyHash: null };
  }
}

async function audit(req, userId, action, meta) {
  try {
    await pool.query('INSERT INTO audit_log (user_id, action, meta, ip_hmac) VALUES (?,?,?,?)',
      [userId, action, meta ? JSON.stringify(meta) : null, sess.ipHmac(req)]);
  } catch (e) { console.error('audit hatasi:', e.code); }
}

function mount(loc) {
  const t = S[loc], p = PATHS[loc], o = PATHS[loc === 'sq' ? 'en' : 'sq'];
  const suggestPath = `${p.write}/${loc === 'sq' ? 'shto-kompani' : 'new-company'}`;
  const suggestOther = `${o.write}/${loc === 'sq' ? 'new-company' : 'shto-kompani'}`;
  const ptitle = (x) => `${x}`;

  const out = (req, res, status, title, body, otherPath) => page(req, res, loc, { status, title, body, otherPath: otherPath || o.write });

  // giris + dogrulanmis e-posta gerekli
  function gate(req, res) {
    if (!req.user) { res.redirect(303, p.login); return false; }
    if (!req.user.email_verified_at) {
      out(req, res, 403, t.h_write, `<h1>${esc(t.h_write)}</h1>${msg('err', t.err_verify)}<p><a href="${p.profile}">${esc(t.profile)}</a></p>`);
      return false;
    }
    return true;
  }

  async function complaintFields(req, v = {}, currencyDefault = 'ALL') {
    const cur = v.currency || currencyDefault;
    const today = new Date().toISOString().slice(0, 10);
    return `${field('title', t.f_title, { value: v.title, hint: t.f_title_hint, maxlength: 140 })}
${textarea('body', t.f_body, { value: v.body, hint: t.f_body_hint, rows: 10 })}
<div class="field"><label for="incident_date">${esc(t.f_date)}</label><input id="incident_date" name="incident_date" type="date" value="${esc(v.incident_date)}" max="${today}" required></div>
<div class="two-col">${field('amount', t.f_amount, { value: v.amount, required: false, maxlength: 12 })}
${select('currency', t.f_currency, [{ value: 'ALL', label: 'ALL (lek)' }, { value: 'EUR', label: 'EUR' }], { value: cur, required: false })}</div>
<label class="check"><input type="checkbox" name="rules" value="1" required> <span>${esc(t.rules_accept)}</span></label>`;
  }

  // ---- 1. adim: sirket ara ----
  router.get(p.write, async (req, res, next) => {
    try {
      if (!gate(req, res)) return;
      const q = oneLine(req.query.q).slice(0, 80);
      let list = '';
      if (q.length >= 2) {
        const like = `%${likeEsc(q)}%`;
        const [rows] = await pool.query(
          `SELECT c.id, c.name, c.country_code, ci.name AS city FROM companies c LEFT JOIN cities ci ON ci.id = c.city_id
            WHERE c.status = 'active' AND (c.name LIKE ? ESCAPE '!' OR EXISTS (SELECT 1 FROM company_aliases a WHERE a.company_id = c.id AND a.alias LIKE ? ESCAPE '!'))
            ORDER BY c.name LIMIT 20`, [like, like]);
        list = rows.length
          ? `<ul class="plist">${rows.map((r) => `<li><span><b>${esc(r.name)}</b><small>${esc(r.city || '')}${r.city ? ', ' : ''}${esc(t.countries[r.country_code])}</small></span><a class="btn" href="${p.write}/${r.id}">${esc(t.select)}</a></li>`).join('')}</ul>`
          : `<p>${esc(t.no_results)}</p>`;
      }
      out(req, res, 200, t.write, `<h1>${esc(t.write)}</h1><p>${esc(t.choose_company)}</p>
<form method="get" action="${p.write}" class="searchrow"><input type="search" name="q" value="${esc(q)}" placeholder="${esc(t.search_ph)}" maxlength="80" aria-label="${esc(t.search_ph)}" required><button class="btn" type="submit">${esc(t.search)}</button></form>
${list}<p class="alt"><a href="${suggestPath}">${esc(t.suggest_link)}</a></p>`);
    } catch (e) { next(e); }
  });

  // ---- 2a. adim: mevcut sirket icin form ----
  const loadCompany = async (id) => {
    const [r] = await pool.query(`SELECT c.id, c.name, c.country_code FROM companies c WHERE c.id = ? AND c.status = 'active'`, [id]);
    return r[0];
  };
  const companyForm = async (req, co, v = {}, m = '') => `<h1>${esc(t.h_write)}</h1><p class="lead2">${esc(t.company)}: <b>${esc(co.name)}</b></p>${m}
<form method="post" action="${p.write}/${co.id}" class="form" novalidate>${csrfInput(req)}
${await complaintFields(req, v, co.country_code === 'XK' ? 'EUR' : 'ALL')}
<button class="btn block" type="submit">${esc(t.submit_complaint)}</button></form>`;

  router.get(`${p.write}/:id(\\d+)`, async (req, res, next) => {
    try {
      if (!gate(req, res)) return;
      const co = await loadCompany(Number(req.params.id));
      if (!co) return out(req, res, 404, t.not_found, `<h1>${esc(t.not_found)}</h1><p><a href="${p.write}">${esc(t.write)}</a></p>`);
      out(req, res, 200, t.h_write, await companyForm(req, co), `${o.write}/${co.id}`);
    } catch (e) { next(e); }
  });

  router.post(`${p.write}/:id(\\d+)`, async (req, res, next) => {
    try {
      if (sess.checkPost(req)) return out(req, res, 403, t.h_write, `<h1>${esc(t.h_write)}</h1>${msg('err', t.err_csrf)}`);
      if (!gate(req, res)) return;
      const co = await loadCompany(Number(req.params.id));
      if (!co) return out(req, res, 404, t.not_found, `<h1>${esc(t.not_found)}</h1>`);
      const b = req.body || {};
      const fail = async (key, status = 400) => out(req, res, status, t.h_write, await companyForm(req, co, b, msg('err', t[key])), `${o.write}/${co.id}`);
      if (!rl.hit(`write:${sess.clientIp(req)}`, 10, 3600000).ok) return fail('err_rate', 429);
      const pc = parseComplaint(b);
      if (pc.err) return fail(pc.err);
      const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM complaints WHERE user_id = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)", [req.user.id]);
      if (n >= 3) return fail('err_limit', 429);
      const [dup] = await pool.query("SELECT 1 FROM complaints WHERE user_id = ? AND company_id = ? AND status IN ('awaiting_company','pending','published') LIMIT 1", [req.user.id, co.id]);
      if (dup[0]) return fail('err_dup');
      const d = pc.data;
      const rk = await riskFor(req, d, co.id);
      const [ins] = await pool.query(
        `INSERT INTO complaints (user_id, company_id, title, body, incident_date, amount, currency, status, ip_hmac, risk_score, risk_flags, body_hash) VALUES (?,?,?,?,?,?,?,'pending',?,?,?,?)`,
        [req.user.id, co.id, d.title, d.body, d.date, d.amount, d.currency, sess.ipHmac(req), rk.score, rk.flags, rk.bodyHash]);
      await audit(req, req.user.id, 'complaint_created', { id: ins.insertId });
      res.redirect(303, `${p.profile}?ok=received`);
    } catch (e) { next(e); }
  });

  // ---- 2b. adim: yeni sirket onerisi + sikayet ----
  async function lists() {
    const [cities] = await pool.query('SELECT id, name, country_code FROM cities ORDER BY country_code, name');
    const [cats] = await pool.query(`SELECT id, name_${loc} AS name FROM categories ORDER BY sort`);
    return { cities, cats };
  }
  const suggestForm = async (req, v = {}, m = '') => {
    const { cities, cats } = await lists();
    return `<h1>${esc(t.h_suggest)}</h1><p>${esc(t.suggest_intro)}</p>${m}
<form method="post" action="${suggestPath}" class="form" novalidate>${csrfInput(req)}
<h2 class="sec">${esc(t.company)}</h2>
${field('cname', t.company_name, { value: v.cname, maxlength: 120 })}
${select('city_id', t.city, cities.map((c) => ({ value: c.id, label: c.name, group: t.countries[c.country_code] })), { value: v.city_id, placeholder: t.choose })}
${select('category_id', t.sector, cats.map((c) => ({ value: c.id, label: c.name })), { value: v.category_id, placeholder: t.choose })}
${field('website', t.website, { type: 'url', value: v.website, required: false, maxlength: 200 })}
${field('registry_no', t.registry, { value: v.registry_no, required: false, maxlength: 20 })}
<h2 class="sec">${esc(t.complaints)}</h2>
${await complaintFields(req, v)}
<button class="btn block" type="submit">${esc(t.submit_suggest)}</button></form>`;
  };

  router.get(suggestPath, async (req, res, next) => {
    try {
      if (!gate(req, res)) return;
      out(req, res, 200, t.h_suggest, await suggestForm(req), suggestOther);
    } catch (e) { next(e); }
  });

  router.post(suggestPath, async (req, res, next) => {
    try {
      if (sess.checkPost(req)) return out(req, res, 403, t.h_suggest, `<h1>${esc(t.h_suggest)}</h1>${msg('err', t.err_csrf)}`, suggestOther);
      if (!gate(req, res)) return;
      const b = req.body || {};
      const fail = async (key, status = 400) => out(req, res, status, t.h_suggest, await suggestForm(req, b, msg('err', t[key])), suggestOther);
      if (!rl.hit(`write:${sess.clientIp(req)}`, 10, 3600000).ok) return fail('err_rate', 429);

      const cname = oneLine(b.cname);
      if (len(cname) < 2 || len(cname) > 120) return fail('err_cname');
      const [cr] = await pool.query('SELECT id, country_code FROM cities WHERE id = ?', [Number(b.city_id) || 0]);
      if (!cr[0]) return fail('err_city');
      const [kr] = await pool.query('SELECT id FROM categories WHERE id = ?', [Number(b.category_id) || 0]);
      if (!kr[0]) return fail('err_sector');
      let website = oneLine(b.website) || null;
      if (website) {
        let u; try { u = new URL(website); } catch { return fail('err_website'); }
        if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || website.length > 200 || /[<>"'\s]/.test(website)) return fail('err_website');
      }
      const registry = oneLine(b.registry_no) || null;
      if (registry && !/^[A-Za-z0-9]{5,20}$/.test(registry)) return fail('err_registry');

      const pc = parseComplaint(b);
      if (pc.err) return fail(pc.err);
      const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM complaints WHERE user_id = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)", [req.user.id]);
      if (n >= 3) return fail('err_limit', 429);
      const [ex] = await pool.query("SELECT id FROM companies WHERE name = ? LIMIT 1", [cname]);
      if (ex[0]) return fail('err_exists');

      const d = pc.data, rk = await riskFor(req, d, null), conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [s] = await conn.query(
          'INSERT INTO company_suggestions (user_id, name, country_code, city_id, category_id, website, registry_no) VALUES (?,?,?,?,?,?,?)',
          [req.user.id, cname, cr[0].country_code, cr[0].id, kr[0].id, website, registry]);
        const [c] = await conn.query(
          `INSERT INTO complaints (user_id, suggestion_id, title, body, incident_date, amount, currency, status, ip_hmac, risk_score, risk_flags, body_hash) VALUES (?,?,?,?,?,?,?,'awaiting_company',?,?,?,?)`,
          [req.user.id, s.insertId, d.title, d.body, d.date, d.amount, d.currency, sess.ipHmac(req), rk.score, rk.flags, rk.bodyHash]);
        await conn.commit();
        await audit(req, req.user.id, 'complaint_created', { id: c.insertId, suggestion: s.insertId });
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
      res.redirect(303, `${p.profile}?ok=received_sugg`);
    } catch (e) { next(e); }
  });
}

mount('sq');
mount('en');
module.exports = router;
