'use strict';
const express = require('express');
const pool = require('../db');
const { esc } = require('../lib/html');
const { slugify } = require('../lib/page');
const screen = require('../lib/screen');
const { layout, highlight, riskBadge, flagChips, parseFlags, TYPE_LABEL, STATUS_LABEL } = require('./views');
const U = require('./util');
const notify = require('./notify');

const router = express.Router();
const PER = 30;
const csrf = (req) => `<input type="hidden" name="_csrf" value="${esc(req.csrfToken)}">`;
const html = (req, res, status, title, body, active) => res.status(status).type('html').send(layout({ user: req.user, csrf: req.csrfToken, title, body, active, flash: req.query.ok || '' }));
const forbidden = (res) => res.status(403).type('text/plain').send('Forbidden');
const sess = require('../session');
const guard = (req, res) => { if (sess.checkPost(req)) { forbidden(res); return false; } return true; };
const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '');

// ====================== SIKAYETLER ======================
const STATUSES = ['pending', 'awaiting_company', 'published', 'rejected', 'removed', 'resolved'];

router.get('/complaints', async (req, res, next) => {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : 'pending';
    const high = req.query.risk === 'high';
    const pg = U.pageNo(req.query.page);
    const [counts] = await pool.query('SELECT status, COUNT(*) n FROM complaints GROUP BY status');
    const cnt = Object.fromEntries(counts.map((c) => [c.status, c.n]));
    const [rows] = await pool.query(
      `SELECT x.id, x.title, x.status, x.risk_score, x.risk_flags, x.created_at, c.name AS cname, s.name AS sname, u.display_name AS author
         FROM complaints x LEFT JOIN companies c ON c.id = x.company_id LEFT JOIN company_suggestions s ON s.id = x.suggestion_id JOIN users u ON u.id = x.user_id
        WHERE x.status = ? ${high ? 'AND x.risk_score >= 40' : ''}
        ORDER BY ${status === 'pending' ? 'COALESCE(x.risk_score, 100) DESC, x.created_at ASC' : 'x.created_at DESC'} LIMIT ? OFFSET ?`,
      [status, PER + 1, (pg - 1) * PER]);
    const tabs = STATUSES.map((s) => `<a href="/complaints?status=${s}"${s === status && !high ? ' class="on"' : ''}>${esc(STATUS_LABEL[s])} (${cnt[s] || 0})</a>`).join('');
    const body = `<h1>Şikayetler</h1><div class="tabs">${tabs}<a href="/complaints?status=pending&risk=high"${high ? ' class="on"' : ''}>Yüksek risk</a></div>
${rows.length ? `<table><tr><th>Risk</th><th>Şikayet</th><th>Şirket</th><th>Yazan</th><th>Tarih</th></tr>${rows.slice(0, PER).map((r) => `<tr>
<td>${riskBadge(r.risk_score)}</td><td><a href="/complaints/${r.id}"><b>${esc(r.title)}</b></a><div>${flagChips(parseFlags(r.risk_flags))}</div></td>
<td>${esc(r.cname || (r.sname ? r.sname + ' (öneri)' : '—'))}</td><td>${esc(r.author)}</td><td class="mute">${esc(fmt(r.created_at))}</td></tr>`).join('')}</table>`
      : '<p class="mute">Bu listede şikayet yok.</p>'}
<div class="row" style="margin-top:14px">${pg > 1 ? `<a class="btn gray sm" href="/complaints?status=${status}${high ? '&risk=high' : ''}&page=${pg - 1}">← Önceki</a>` : ''}${rows.length > PER ? `<a class="btn gray sm" href="/complaints?status=${status}${high ? '&risk=high' : ''}&page=${pg + 1}">Sonraki →</a>` : ''}</div>`;
    html(req, res, 200, 'Şikayetler', body, 'complaints');
  } catch (e) { next(e); }
});

async function loadComplaint(id) {
  const [r] = await pool.query(
    `SELECT x.*, DATE_FORMAT(x.incident_date, '%d.%m.%Y') AS inc, c.name AS cname, c.slug AS cslug, c.id AS cid,
            s.name AS sname, s.id AS sid, u.id AS uid, u.email, u.display_name, u.locale, u.status AS ustatus,
            TIMESTAMPDIFF(DAY, u.created_at, UTC_TIMESTAMP()) AS uage
       FROM complaints x LEFT JOIN companies c ON c.id = x.company_id LEFT JOIN company_suggestions s ON s.id = x.suggestion_id JOIN users u ON u.id = x.user_id
      WHERE x.id = ?`, [id]);
  return r[0];
}

const MASK_KINDS = ['pii_email', 'pii_phone', 'pii_iban', 'pii_id', 'profanity', 'insult', 'link', 'handle', 'plate', 'address'];

async function detail(req, res, x, { title, body, error } = {}) {
  const flags = parseFlags(x.risk_flags);
  const [[hist]] = await pool.query("SELECT SUM(status IN ('published','resolved')) pub, SUM(status = 'rejected') rej, COUNT(*) n FROM complaints WHERE user_id = ?", [x.uid]);
  const editable = x.status === 'pending' && x.company_id;
  const finalTitle = title ?? x.title, finalBody = body ?? x.body;
  const rejectOpts = notify.REASONS.map((r) => `<option value="${r.k}">${esc(r.tr)}</option>`).join('');
  const ctxFlags = flags.filter((f) => f.f === 'ctx');
  const pageHtml = `<p><a href="/complaints?status=${esc(x.status)}">← Listeye dön</a></p>
<h1>${highlight(x.title, flags, 'title')}</h1>
<p>${riskBadge(x.risk_score)} <span class="chip">${esc(STATUS_LABEL[x.status])}</span> ${flagChips(flags)}</p>
${error ? `<p class="err">${esc(error)}</p>` : ''}
<div class="card"><h2>Metin <span class="mute" style="font-weight:400">(vurgular: sarı=düşük, turuncu=orta, kırmızı=yüksek)</span></h2>
<div class="text">${highlight(x.body, flags, 'body')}</div>
<dl class="kv" style="margin-top:12px"><dt>Olay tarihi</dt><dd>${esc(x.inc)}</dd>${x.amount ? `<dt>Tutar</dt><dd>${esc(x.amount)} ${esc(x.currency)}</dd>` : ''}</dl></div>
<div class="card"><h2>Bağlam</h2><dl class="kv">
<dt>Şirket</dt><dd>${x.cname ? `<a href="/companies/${x.cid}">${esc(x.cname)}</a>` : x.sname ? `Öneri: <a href="/suggestions/${x.sid}">${esc(x.sname)}</a> (önce şirket onaylanmalı)` : '—'}</dd>
<dt>Yazan</dt><dd>${esc(x.display_name)} · ${esc(x.email)} · ${x.uage} günlük hesap${x.ustatus === 'blocked' ? ' · <b>ENGELLİ</b>' : ''}</dd>
<dt>Geçmişi</dt><dd>${hist.n} şikayet · ${hist.pub || 0} yayında · ${hist.rej || 0} reddedildi</dd>
${ctxFlags.length ? `<dt>Uyarılar</dt><dd>${ctxFlags.map((f) => esc((TYPE_LABEL[f.t] || f.t) + ': ' + f.m)).join('<br>')}</dd>` : ''}
${x.reject_reason ? `<dt>Ret nedeni</dt><dd>${esc(x.reject_reason)}</dd>` : ''}</dl></div>
${editable ? `<div class="card"><h2>Karar</h2>
<form method="post" action="/complaints/${x.id}/publish">${csrf(req)}
<div class="field"><label for="title">Başlık (gerekirse düzeltin)</label><input id="title" name="title" type="text" value="${esc(finalTitle)}" maxlength="140" required></div>
<div class="field"><label for="body">Metin (yayınlanacak hali)</label><textarea id="body" name="body" required maxlength="5000">${esc(finalBody)}</textarea></div>
<div class="row"><button class="btn green" type="submit">Yayınla</button></div></form>
<form method="post" action="/complaints/${x.id}/mask" style="margin-top:10px">${csrf(req)}<button class="btn gray sm" type="submit">Otomatik maskele (önizle)</button> <span class="mute">kişisel veri, küfür, link → ***; yayınlamadan önce kontrol edin</span></form></div>` : ''}
${['pending', 'awaiting_company'].includes(x.status) ? `<div class="card"><h2>Reddet</h2><form method="post" action="/complaints/${x.id}/reject">${csrf(req)}
<div class="field"><label for="reason">Neden (kullanıcıya gider)</label><select id="reason" name="reason">${rejectOpts}</select></div>
<div class="field"><label for="note">Ek not (opsiyonel, kullanıcıya gider)</label><input id="note" name="note" type="text" maxlength="300"></div>
<button class="btn red" type="submit">Reddet</button></form></div>` : ''}
${['published', 'resolved'].includes(x.status) ? `<div class="card"><h2>Yayından kaldır</h2><form method="post" action="/complaints/${x.id}/remove">${csrf(req)}
<div class="field"><label for="note">Neden (iç not)</label><input id="note" name="note" type="text" maxlength="300" required></div><button class="btn red" type="submit">Kaldır</button></form></div>` : ''}
${x.status === 'published' || x.status === 'resolved' ? `<p><a href="/go/complaint/${x.id}" target="_blank" rel="noopener">Sitede aç ↗</a></p>` : ''}`;
  html(req, res, error ? 400 : 200, 'Şikayet #' + x.id, pageHtml, 'complaints');
}

router.get('/complaints/:id(\\d+)', async (req, res, next) => {
  try { const x = await loadComplaint(U.id(req.params.id)); if (!x) return html(req, res, 404, 'Bulunamadı', '<h1>Bulunamadı</h1>', 'complaints'); await detail(req, res, x); } catch (e) { next(e); }
});

router.post('/complaints/:id(\\d+)/mask', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const x = await loadComplaint(U.id(req.params.id));
    if (!x) return html(req, res, 404, 'Bulunamadı', '<h1>Bulunamadı</h1>', 'complaints');
    const flags = parseFlags(x.risk_flags);
    await detail(req, res, x, { title: screen.mask(x.title, flags, 'title', MASK_KINDS), body: screen.mask(x.body, flags, 'body', MASK_KINDS) });
  } catch (e) { next(e); }
});

router.post('/complaints/:id(\\d+)/publish', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id);
    const x = await loadComplaint(id);
    if (!x || x.status !== 'pending' || !x.company_id) return res.redirect(303, '/complaints');
    const title = U.oneLine(req.body.title, 140), body = U.multiLine(req.body.body, 5000);
    if ([...title].length < 5 || [...body].length < 20) return detail(req, res, x, { title, body, error: 'Başlık en az 5, metin en az 20 karakter olmalı.' });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (title !== x.title || body !== x.body) await conn.query('INSERT INTO complaint_edits (complaint_id, editor_id, old_title, old_body) VALUES (?,?,?,?)', [id, req.user.id, x.title, x.body]);
      const [u] = await conn.query(
        "UPDATE complaints SET title = ?, body = ?, status = 'published', published_at = UTC_TIMESTAMP(), reviewed_by = ?, reviewed_at = UTC_TIMESTAMP(), reject_reason = NULL WHERE id = ? AND status = 'pending'",
        [title, body, req.user.id, id]);
      if (!u.affectedRows) { await conn.rollback(); return res.redirect(303, '/complaints'); }
      await U.modlog(conn, req.user.id, 'complaint', id, title !== x.title || body !== x.body ? 'publish_edited' : 'publish');
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    notify.published({ email: x.email, locale: x.locale, title, slug: x.cslug, id }).catch(() => {});
    res.redirect(303, '/complaints?status=pending&ok=published');
  } catch (e) { next(e); }
});

router.post('/complaints/:id(\\d+)/reject', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id);
    const x = await loadComplaint(id);
    if (!x || !['pending', 'awaiting_company'].includes(x.status)) return res.redirect(303, '/complaints');
    const rs = notify.reasonOf(String(req.body.reason)), note = U.oneLine(req.body.note, 300);
    const [u] = await pool.query("UPDATE complaints SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = UTC_TIMESTAMP() WHERE id = ? AND status IN ('pending','awaiting_company')",
      [(rs.sq + (note ? ' ' + note : '')).slice(0, 300), req.user.id, id]);
    if (u.affectedRows) {
      await U.modlog(pool, req.user.id, 'complaint', id, 'reject', `${rs.k}${note ? ': ' + note : ''}`);
      notify.rejected({ email: x.email, locale: x.locale, title: x.title, reasonKey: rs.k, note }).catch(() => {});
    }
    res.redirect(303, '/complaints?status=pending&ok=rejected');
  } catch (e) { next(e); }
});

router.post('/complaints/:id(\\d+)/remove', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id), note = U.oneLine(req.body.note, 300);
    if (!note) return res.redirect(303, `/complaints/${id}`);
    const [u] = await pool.query("UPDATE complaints SET status = 'removed', reviewed_by = ?, reviewed_at = UTC_TIMESTAMP() WHERE id = ? AND status IN ('published','resolved')", [req.user.id, id]);
    if (u.affectedRows) await U.modlog(pool, req.user.id, 'complaint', id, 'remove', note);
    res.redirect(303, '/complaints?status=removed&ok=removed');
  } catch (e) { next(e); }
});

// Sitede ac (slug'i cozen yonlendirme; panel alan adindan ana siteye)
router.get('/go/complaint/:id(\\d+)', async (req, res, next) => {
  try {
    const [r] = await pool.query('SELECT x.id, c.slug FROM complaints x JOIN companies c ON c.id = x.company_id WHERE x.id = ?', [U.id(req.params.id)]);
    if (!r[0]) return res.redirect(303, '/complaints');
    res.redirect(302, `${require('../config').siteOrigin}/kompani/${r[0].slug}/${r[0].id}`);
  } catch (e) { next(e); }
});

// ====================== SIRKET ONERILERI ======================
router.get('/suggestions', async (req, res, next) => {
  try {
    const status = ['pending', 'approved', 'merged', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.country_code, s.created_at, ci.name AS city, k.name_sq AS cat, u.display_name AS author
         FROM company_suggestions s JOIN cities ci ON ci.id = s.city_id JOIN categories k ON k.id = s.category_id JOIN users u ON u.id = s.user_id
        WHERE s.status = ? ORDER BY s.created_at ASC LIMIT 100`, [status]);
    const tabs = ['pending', 'approved', 'merged', 'rejected'].map((s) => `<a href="/suggestions?status=${s}"${s === status ? ' class="on"' : ''}>${{ pending: 'Bekleyen', approved: 'Onaylanan', merged: 'Birleştirilen', rejected: 'Reddedilen' }[s]}</a>`).join('');
    html(req, res, 200, 'Şirket önerileri', `<h1>Şirket önerileri</h1><div class="tabs">${tabs}</div>
${rows.length ? `<table><tr><th>Şirket</th><th>Şehir</th><th>Sektör</th><th>Öneren</th><th>Tarih</th></tr>${rows.map((r) => `<tr><td><a href="/suggestions/${r.id}"><b>${esc(r.name)}</b></a></td><td>${esc(r.city)} (${esc(r.country_code)})</td><td>${esc(r.cat)}</td><td>${esc(r.author)}</td><td class="mute">${esc(fmt(r.created_at))}</td></tr>`).join('')}</table>` : '<p class="mute">Liste boş.</p>'}`, 'suggestions');
  } catch (e) { next(e); }
});

router.get('/suggestions/:id(\\d+)', async (req, res, next) => {
  try {
    const id = U.id(req.params.id);
    const [r] = await pool.query(
      `SELECT s.*, u.display_name, u.email FROM company_suggestions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`, [id]);
    const s = r[0];
    if (!s) return html(req, res, 404, 'Bulunamadı', '<h1>Bulunamadı</h1>', 'suggestions');
    const [cities] = await pool.query('SELECT id, name, country_code FROM cities ORDER BY country_code, name');
    const [cats] = await pool.query('SELECT id, name_sq AS name FROM categories ORDER BY sort');
    const first = s.name.split(' ')[0];
    const [dups] = await pool.query("SELECT id, name FROM companies WHERE name LIKE ? ESCAPE '!' ORDER BY name LIMIT 10", [`%${U.likeEsc(first)}%`]);
    const [cs] = await pool.query('SELECT id, title, risk_score, status FROM complaints WHERE suggestion_id = ?', [id]);
    const open = s.status === 'pending';
    html(req, res, 200, 'Öneri', `<p><a href="/suggestions">← Öneriler</a></p><h1>${esc(s.name)}</h1>
<div class="card"><dl class="kv"><dt>Durum</dt><dd>${esc(s.status)}</dd><dt>Öneren</dt><dd>${esc(s.display_name)} · ${esc(s.email)}</dd>
<dt>Web</dt><dd>${esc(s.website || '—')}</dd><dt>Sicil no</dt><dd>${esc(s.registry_no || '—')}</dd>
<dt>Şikayet</dt><dd>${cs.map((c) => `<a href="/complaints/${c.id}">${esc(c.title)}</a> ${riskBadge(c.risk_score)}`).join('<br>') || '—'}</dd></dl></div>
<div class="card"><h2>Benzer şirketler (mükerrer kontrolü)</h2>${dups.length ? dups.map((d) => `<div>${esc(d.name)} <span class="mute">#${d.id}</span></div>`).join('') : '<span class="mute">Benzer kayıt yok.</span>'}</div>
${open ? `<div class="card"><h2>Onayla ve oluştur</h2><form method="post" action="/suggestions/${id}/approve">${csrf(req)}
${U.inputEl('name', 'Şirket adı', s.name, { max: 120 })}
${U.selectEl('city_id', 'Şehir', cities.map((c) => ({ value: c.id, label: `${c.name} (${c.country_code})` })), s.city_id)}
${U.selectEl('category_id', 'Sektör', cats.map((c) => ({ value: c.id, label: c.name })), s.category_id)}
${U.inputEl('website', 'Web sitesi', s.website || '', { required: false })}${U.inputEl('registry_no', 'Sicil no', s.registry_no || '', { required: false, max: 20 })}
<div class="field"><label for="aliases">Takma adlar / yazım varyasyonları (satır başına bir)</label><textarea id="aliases" name="aliases" style="min-height:70px" maxlength="600"></textarea></div>
<button class="btn green" type="submit">Onayla</button></form></div>
<div class="card"><h2>Mevcut şirkete birleştir</h2><form method="post" action="/suggestions/${id}/merge">${csrf(req)}
${U.inputEl('company_id', 'Şirket ID (#)', '', { type: 'number', max: 12 })}<button class="btn" type="submit">Birleştir</button></form></div>
<div class="card"><h2>Reddet</h2><form method="post" action="/suggestions/${id}/reject">${csrf(req)}<button class="btn red" type="submit">Reddet (şikayet de reddedilir)</button></form></div>` : ''}`, 'suggestions');
  } catch (e) { next(e); }
});

async function uniqueSlug(conn, name) {
  const base = slugify(name).slice(0, 100) || 'kompani';
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [r] = await conn.query('SELECT 1 FROM companies WHERE slug = ?', [slug]);
    if (!r[0]) return slug;
  }
  return `${base}-${Date.now()}`;
}

router.post('/suggestions/:id(\\d+)/approve', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id), b = req.body || {};
    const [r] = await pool.query("SELECT * FROM company_suggestions WHERE id = ? AND status = 'pending'", [id]);
    if (!r[0]) return res.redirect(303, '/suggestions');
    const name = U.oneLine(b.name, 120);
    const [cr] = await pool.query('SELECT id, country_code FROM cities WHERE id = ?', [U.id(b.city_id)]);
    const [kr] = await pool.query('SELECT id FROM categories WHERE id = ?', [U.id(b.category_id)]);
    if (name.length < 2 || !cr[0] || !kr[0]) return res.redirect(303, `/suggestions/${id}`);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const slug = await uniqueSlug(conn, name);
      const [ins] = await conn.query('INSERT INTO companies (slug, name, country_code, city_id, category_id, website, registry_no) VALUES (?,?,?,?,?,?,?)',
        [slug, name, cr[0].country_code, cr[0].id, kr[0].id, U.oneLine(b.website, 200) || null, U.oneLine(b.registry_no, 20) || null]);
      for (const a of U.multiLine(b.aliases, 600).split('\n').map((x) => U.oneLine(x, 120)).filter(Boolean).slice(0, 5)) await conn.query('INSERT INTO company_aliases (company_id, alias) VALUES (?,?)', [ins.insertId, a]);
      await conn.query("UPDATE company_suggestions SET status = 'approved', merged_into_company_id = ? WHERE id = ?", [ins.insertId, id]);
      await conn.query("UPDATE complaints SET company_id = ?, status = 'pending' WHERE suggestion_id = ? AND status = 'awaiting_company'", [ins.insertId, id]);
      await U.modlog(conn, req.user.id, 'suggestion', id, 'approve', `company #${ins.insertId}`);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    res.redirect(303, '/suggestions?ok=approved');
  } catch (e) { next(e); }
});

router.post('/suggestions/:id(\\d+)/merge', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id), cid = U.id(req.body.company_id);
    const [c] = await pool.query("SELECT id FROM companies WHERE id = ? AND status = 'active'", [cid]);
    const [s] = await pool.query("SELECT id FROM company_suggestions WHERE id = ? AND status = 'pending'", [id]);
    if (!c[0] || !s[0]) return res.redirect(303, `/suggestions/${id}`);
    await pool.query("UPDATE company_suggestions SET status = 'merged', merged_into_company_id = ? WHERE id = ?", [cid, id]);
    await pool.query("UPDATE complaints SET company_id = ?, status = 'pending' WHERE suggestion_id = ? AND status = 'awaiting_company'", [cid, id]);
    await U.modlog(pool, req.user.id, 'suggestion', id, 'merge', `company #${cid}`);
    res.redirect(303, '/suggestions?ok=merged');
  } catch (e) { next(e); }
});

router.post('/suggestions/:id(\\d+)/reject', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id);
    const [s] = await pool.query("UPDATE company_suggestions SET status = 'rejected' WHERE id = ? AND status = 'pending'", [id]);
    if (s.affectedRows) {
      const rs = notify.reasonOf('company');
      const [cs] = await pool.query("SELECT x.id, x.title, u.email, u.locale FROM complaints x JOIN users u ON u.id = x.user_id WHERE x.suggestion_id = ? AND x.status = 'awaiting_company'", [id]);
      await pool.query("UPDATE complaints SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = UTC_TIMESTAMP() WHERE suggestion_id = ? AND status = 'awaiting_company'", [rs.sq, req.user.id, id]);
      await U.modlog(pool, req.user.id, 'suggestion', id, 'reject');
      for (const c of cs) notify.rejected({ email: c.email, locale: c.locale, title: c.title, reasonKey: 'company', note: '' }).catch(() => {});
    }
    res.redirect(303, '/suggestions?ok=rejected');
  } catch (e) { next(e); }
});

module.exports = router;
