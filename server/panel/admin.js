'use strict';
const express = require('express');
const pool = require('../db');
const { esc } = require('../lib/html');
const { slugify } = require('../lib/page');
const screen = require('../lib/screen');
const sess = require('../session');
const { layout, highlight, flagChips, TYPE_LABEL } = require('./views');
const U = require('./util');

const router = express.Router();
const csrf = (req) => `<input type="hidden" name="_csrf" value="${esc(req.csrfToken)}">`;
const html = (req, res, status, title, body, active) => res.status(status).type('html').send(layout({ user: req.user, csrf: req.csrfToken, title, body, active, flash: req.query.ok || '' }));
const guard = (req, res) => { if (sess.checkPost(req)) { res.status(403).type('text/plain').send('Forbidden'); return false; } return true; };
const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : html(req, res, 403, 'Yetkisiz', '<h1>Yetkisiz</h1><p>Bu bölüm yalnızca yöneticiler içindir.</p>'));
const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '');

// ====================== SIRKETLER (moderator + admin) ======================
async function lookups() {
  const [cities] = await pool.query('SELECT id, name, country_code FROM cities ORDER BY country_code, name');
  const [cats] = await pool.query('SELECT id, name_sq AS name FROM categories ORDER BY sort');
  return { cities: cities.map((c) => ({ value: c.id, label: `${c.name} (${c.country_code})` })), cats: cats.map((c) => ({ value: c.id, label: c.name })) };
}

router.get('/companies', async (req, res, next) => {
  try {
    const q = U.oneLine(req.query.q, 80), pg = U.pageNo(req.query.page), PER = 40;
    const like = `%${U.likeEsc(q)}%`;
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.status, c.country_code, ci.name AS city, k.name_sq AS cat,
              (SELECT COUNT(*) FROM complaints x WHERE x.company_id = c.id AND x.status IN ('published','resolved')) AS n
         FROM companies c LEFT JOIN cities ci ON ci.id = c.city_id JOIN categories k ON k.id = c.category_id
        ${q ? "WHERE c.name LIKE ? ESCAPE '!'" : ''} ORDER BY c.name LIMIT ? OFFSET ?`, q ? [like, PER + 1, (pg - 1) * PER] : [PER + 1, (pg - 1) * PER]);
    html(req, res, 200, 'Şirketler', `<h1>Şirketler</h1>
<form method="get" action="/companies" class="row" style="margin-bottom:14px"><input type="search" name="q" value="${esc(q)}" placeholder="Ad ara…" style="max-width:320px"><button class="btn" type="submit">Ara</button><a class="btn green" href="/companies/new">+ Yeni şirket</a></form>
${rows.length ? `<table><tr><th>Ad</th><th>Şehir</th><th>Sektör</th><th>Yayında</th><th>Durum</th></tr>${rows.slice(0, PER).map((r) => `<tr><td><a href="/companies/${r.id}"><b>${esc(r.name)}</b></a> <span class="mute">#${r.id}</span></td><td>${esc(r.city || '')} ${esc(r.country_code)}</td><td>${esc(r.cat)}</td><td>${r.n}</td><td>${esc(r.status)}</td></tr>`).join('')}</table>` : '<p class="mute">Kayıt yok.</p>'}
<div class="row" style="margin-top:14px">${pg > 1 ? `<a class="btn gray sm" href="/companies?q=${encodeURIComponent(q)}&page=${pg - 1}">← Önceki</a>` : ''}${rows.length > PER ? `<a class="btn gray sm" href="/companies?q=${encodeURIComponent(q)}&page=${pg + 1}">Sonraki →</a>` : ''}</div>`, 'companies');
  } catch (e) { next(e); }
});

async function companyForm(req, c = {}, aliases = '', error = '') {
  const { cities, cats } = await lookups();
  const action = c.id ? `/companies/${c.id}` : '/companies/new';
  return `<p><a href="/companies">← Şirketler</a></p><h1>${c.id ? esc(c.name) : 'Yeni şirket'}</h1>${error ? `<p class="err">${esc(error)}</p>` : ''}
<div class="card"><form method="post" action="${action}">${csrf(req)}
${U.inputEl('name', 'Şirket adı', c.name || '', { max: 120 })}
${U.selectEl('city_id', 'Şehir', cities, c.city_id, { placeholder: '— seç —' })}${U.selectEl('category_id', 'Sektör', cats, c.category_id, { placeholder: '— seç —' })}
${U.inputEl('website', 'Web sitesi', c.website || '', { required: false })}${U.inputEl('registry_no', 'Sicil no (NIPT / iş no)', c.registry_no || '', { required: false, max: 20 })}
${c.id ? U.selectEl('status', 'Durum', [{ value: 'active', label: 'Aktif' }, { value: 'hidden', label: 'Gizli' }], c.status) : ''}
<div class="field"><label for="aliases">Takma adlar (satır başına bir, en fazla 5)</label><textarea id="aliases" name="aliases" style="min-height:80px" maxlength="600">${esc(aliases)}</textarea></div>
<button class="btn green" type="submit">Kaydet</button></form></div>`;
}

router.get('/companies/new', async (req, res, next) => { try { html(req, res, 200, 'Yeni şirket', await companyForm(req), 'companies'); } catch (e) { next(e); } });

async function saveCompany(req, res, next, id) {
  try {
    if (!guard(req, res)) return;
    const b = req.body || {};
    const name = U.oneLine(b.name, 120), website = U.oneLine(b.website, 200) || null, reg = U.oneLine(b.registry_no, 20) || null;
    const [cr] = await pool.query('SELECT id, country_code FROM cities WHERE id = ?', [U.id(b.city_id)]);
    const [kr] = await pool.query('SELECT id FROM categories WHERE id = ?', [U.id(b.category_id)]);
    const aliases = U.multiLine(b.aliases, 600);
    const fail = async (m) => html(req, res, 400, 'Şirket', await companyForm(req, { id, name, city_id: b.city_id, category_id: b.category_id, website, registry_no: reg, status: b.status }, aliases, m), 'companies');
    if (name.length < 2) return fail('Ad en az 2 karakter olmalı.');
    if (!cr[0]) return fail('Şehir seçin.');
    if (!kr[0]) return fail('Sektör seçin.');
    if (website && !/^https?:\/\/[^\s<>"']{3,190}$/.test(website)) return fail('Web adresi https://… biçiminde olmalı.');
    if (reg && !/^[A-Za-z0-9]{5,20}$/.test(reg)) return fail('Sicil no geçersiz.');
    const list = aliases.split('\n').map((x) => U.oneLine(x, 120)).filter(Boolean).slice(0, 5);
    const conn = await pool.getConnection();
    let cid = id;
    try {
      await conn.beginTransaction();
      if (id) {
        await conn.query('UPDATE companies SET name = ?, city_id = ?, country_code = ?, category_id = ?, website = ?, registry_no = ?, status = ? WHERE id = ?',
          [name, cr[0].id, cr[0].country_code, kr[0].id, website, reg, b.status === 'hidden' ? 'hidden' : 'active', id]);
        await conn.query('DELETE FROM company_aliases WHERE company_id = ?', [id]);
      } else {
        const base = slugify(name).slice(0, 100) || 'kompani';
        let slug = base;
        for (let i = 2; i < 60; i++) { const [e] = await conn.query('SELECT 1 FROM companies WHERE slug = ?', [slug]); if (!e[0]) break; slug = `${base}-${i}`; }
        const [ins] = await conn.query('INSERT INTO companies (slug, name, country_code, city_id, category_id, website, registry_no) VALUES (?,?,?,?,?,?,?)', [slug, name, cr[0].country_code, cr[0].id, kr[0].id, website, reg]);
        cid = ins.insertId;
      }
      for (const a of list) await conn.query('INSERT INTO company_aliases (company_id, alias) VALUES (?,?)', [cid, a]);
      await U.modlog(conn, req.user.id, 'company', cid, id ? 'update' : 'create', name);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    res.redirect(303, `/companies/${cid}?ok=saved`);
  } catch (e) { next(e); }
}
router.post('/companies/new', (req, res, next) => saveCompany(req, res, next, 0));
router.post('/companies/:id(\\d+)', (req, res, next) => saveCompany(req, res, next, U.id(req.params.id)));

router.get('/companies/:id(\\d+)', async (req, res, next) => {
  try {
    const [r] = await pool.query('SELECT * FROM companies WHERE id = ?', [U.id(req.params.id)]);
    if (!r[0]) return html(req, res, 404, 'Bulunamadı', '<h1>Bulunamadı</h1>', 'companies');
    const [al] = await pool.query('SELECT alias FROM company_aliases WHERE company_id = ? ORDER BY id', [r[0].id]);
    const [[st]] = await pool.query("SELECT COUNT(*) n FROM complaints WHERE company_id = ? AND status IN ('published','resolved')", [r[0].id]);
    html(req, res, 200, r[0].name, `${await companyForm(req, r[0], al.map((a) => a.alias).join('\n'))}<p class="mute">Yayında ${st.n} şikayet · <a href="${require('../config').siteOrigin}/kompani/${esc(r[0].slug)}" target="_blank" rel="noopener">Sitede aç ↗</a></p>`, 'companies');
  } catch (e) { next(e); }
});

// ====================== TALEPLER (iletisim / kaldirma) ======================
const REQ_TYPE = { removal: 'Kaldırma/düzeltme', reply: 'Şirket temsilcisi', data: 'Kişisel veri', other: 'Diğer' };
router.get('/requests', async (req, res, next) => {
  try {
    const status = req.query.status === 'closed' ? 'closed' : 'open';
    const [rows] = await pool.query('SELECT * FROM legal_requests WHERE status = ? ORDER BY created_at ' + (status === 'open' ? 'ASC' : 'DESC') + ' LIMIT 100', [status]);
    const tabs = [['open', 'Açık'], ['closed', 'Kapalı']].map(([k, l]) => `<a href="/requests?status=${k}"${k === status ? ' class="on"' : ''}>${l}</a>`).join('');
    html(req, res, 200, 'Talepler', `<h1>Talepler</h1><div class="tabs">${tabs}</div>
${rows.length ? rows.map((r) => `<div class="card"><h2>${esc(REQ_TYPE[r.type])} <span class="mute" style="font-weight:400">· ${esc(fmt(r.created_at))}</span></h2>
<dl class="kv"><dt>Kimden</dt><dd>${esc(r.name)} · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a></dd>${r.url ? `<dt>Bağlantı</dt><dd>${esc(r.url)}</dd>` : ''}</dl>
<div class="text" style="margin:10px 0">${esc(r.message).replace(/\n/g, '<br>')}</div>
${status === 'open' ? `<form method="post" action="/requests/${r.id}/close">${csrf(req)}<button class="btn green sm" type="submit">Kapat (yanıtlandı)</button></form>` : ''}</div>`).join('') : '<p class="mute">Talep yok.</p>'}`, 'requests');
  } catch (e) { next(e); }
});
router.post('/requests/:id(\\d+)/close', async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id);
    const [u] = await pool.query("UPDATE legal_requests SET status = 'closed', closed_by = ?, closed_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'open'", [req.user.id, id]);
    if (u.affectedRows) await U.modlog(pool, req.user.id, 'request', id, 'close');
    res.redirect(303, '/requests?ok=closed');
  } catch (e) { next(e); }
});

// ====================== SOZLUK (yalniz admin) ======================
const norm = (t) => U.oneLine(t, 80).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const KINDS = ['profanity', 'insult', 'threat', 'hate', 'accusation'];

router.get('/blocklist', adminOnly, async (req, res, next) => {
  try {
    const kind = KINDS.includes(req.query.kind) ? req.query.kind : '';
    const [rows] = await pool.query(`SELECT id, term, kind, severity, mode, lang FROM blocklist ${kind ? 'WHERE kind = ?' : ''} ORDER BY kind, term`, kind ? [kind] : []);
    const tabs = [['', 'Tümü'], ...KINDS.map((k) => [k, TYPE_LABEL[k]])].map(([k, l]) => `<a href="/blocklist${k ? '?kind=' + k : ''}"${k === kind ? ' class="on"' : ''}>${esc(l)}</a>`).join('');
    html(req, res, 200, 'Sözlük', `<h1>Sözlük</h1>
<p class="mute">Terimler küçük harf, aksansız ve tekrarsız yazılır (ë→e). "stem" = kelime bu ile başlıyorsa eşleşir (ek almış halleri yakalar). Çok kelimeli ifadeler tam eşleşir. <b>Başlangıç listesi bir yerel okuyucu tarafından gözden geçirilmelidir.</b></p>
<div class="card"><h2>Metni test et</h2><form method="post" action="/blocklist/test">${csrf(req)}<div class="field"><textarea name="text" style="min-height:90px" maxlength="3000" required placeholder="Bir şikayet metni yapıştırın…"></textarea></div><button class="btn" type="submit">Tara</button></form></div>
<div class="card"><h2>Terim ekle</h2><form method="post" action="/blocklist" class="row">${csrf(req)}
<input name="term" type="text" placeholder="terim" maxlength="80" required style="max-width:200px">
<select name="kind" style="max-width:150px">${KINDS.map((k) => `<option value="${k}">${esc(TYPE_LABEL[k])}</option>`).join('')}</select>
<select name="severity" style="max-width:110px"><option value="1">Düşük</option><option value="2" selected>Orta</option><option value="3">Yüksek</option></select>
<select name="mode" style="max-width:110px"><option value="exact">tam</option><option value="stem">stem</option></select>
<input name="lang" type="text" value="sq" maxlength="8" style="max-width:70px"><button class="btn green" type="submit">Ekle</button></form></div>
<div class="tabs">${tabs}</div>
<table><tr><th>Terim</th><th>Tür</th><th>Önem</th><th>Mod</th><th>Dil</th><th></th></tr>${rows.map((r) => `<tr><td><b>${esc(r.term)}</b></td><td>${esc(TYPE_LABEL[r.kind])}</td><td>${r.severity}</td><td>${esc(r.mode)}</td><td>${esc(r.lang)}</td>
<td><form method="post" action="/blocklist/${r.id}/delete">${csrf(req)}<button class="btn red sm" type="submit">Sil</button></form></td></tr>`).join('')}</table>`, 'blocklist');
  } catch (e) { next(e); }
});

router.post('/blocklist', adminOnly, async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const term = norm(req.body.term), kind = KINDS.includes(req.body.kind) ? req.body.kind : null;
    const sev = [1, 2, 3].includes(Number(req.body.severity)) ? Number(req.body.severity) : 2;
    const mode = req.body.mode === 'stem' ? 'stem' : 'exact';
    if (term.length < 2 || !kind || (mode === 'stem' && term.includes(' '))) return res.redirect(303, '/blocklist');
    await pool.query('INSERT INTO blocklist (term, kind, severity, mode, lang) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE severity = VALUES(severity), mode = VALUES(mode), lang = VALUES(lang)',
      [term, kind, sev, mode, U.oneLine(req.body.lang, 8) || 'sq']);
    await U.modlog(pool, req.user.id, 'blocklist', 0, 'add', `${kind}:${term}`);
    screen.invalidate();
    res.redirect(303, '/blocklist?ok=created');
  } catch (e) { next(e); }
});

router.post('/blocklist/:id(\\d+)/delete', adminOnly, async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id);
    await pool.query('DELETE FROM blocklist WHERE id = ?', [id]);
    await U.modlog(pool, req.user.id, 'blocklist', id, 'delete');
    screen.invalidate();
    res.redirect(303, '/blocklist?ok=deleted');
  } catch (e) { next(e); }
});

router.post('/blocklist/test', adminOnly, async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const text = U.multiLine(req.body.text, 3000);
    const flags = await screen.screenText({ title: '', body: text });
    const sc = screen.score(flags);
    html(req, res, 200, 'Tarama sonucu', `<p><a href="/blocklist">← Sözlük</a></p><h1>Tarama sonucu</h1>
<p><span class="risk ${sc >= 40 ? 'red' : sc >= 15 ? 'yellow' : 'green'}">${sc}</span> ${flagChips(flags)}</p>
<div class="card"><div class="text">${highlight(text, flags, 'body')}</div></div>`, 'blocklist');
  } catch (e) { next(e); }
});

// ====================== KULLANICILAR (yalniz admin) ======================
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const q = U.oneLine(req.query.q, 80), like = `%${U.likeEsc(q)}%`;
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role, u.status, u.email_verified_at, u.created_at,
              (SELECT COUNT(*) FROM complaints x WHERE x.user_id = u.id) AS n
         FROM users u ${q ? "WHERE u.email LIKE ? ESCAPE '!' OR u.display_name LIKE ? ESCAPE '!'" : ''} ORDER BY u.id DESC LIMIT 100`, q ? [like, like] : []);
    html(req, res, 200, 'Kullanıcılar', `<h1>Kullanıcılar</h1>
<form method="get" action="/users" class="row" style="margin-bottom:14px"><input type="search" name="q" value="${esc(q)}" placeholder="E-posta veya ad" style="max-width:320px"><button class="btn" type="submit">Ara</button></form>
<table><tr><th>Kullanıcı</th><th>Rol</th><th>Durum</th><th>Şikayet</th><th>Kayıt</th><th></th></tr>${rows.map((r) => `<tr>
<td><b>${esc(r.display_name)}</b><div class="mute">${esc(r.email)} ${r.email_verified_at ? '' : '(doğrulanmamış)'}</div></td>
<td>${esc(r.role)}</td><td>${esc(r.status)}</td><td>${r.n}</td><td class="mute">${esc(fmt(r.created_at))}</td>
<td>${r.id === req.user.id ? '<span class="mute">siz</span>' : `<div class="row">
<form method="post" action="/users/${r.id}/${r.status === 'blocked' ? 'unblock' : 'block'}">${csrf(req)}<button class="btn ${r.status === 'blocked' ? 'green' : 'red'} sm" type="submit">${r.status === 'blocked' ? 'Engeli kaldır' : 'Engelle'}</button></form>
<form method="post" action="/users/${r.id}/role">${csrf(req)}<select name="role" style="width:auto;padding:4px"><option value="member"${r.role === 'member' ? ' selected' : ''}>üye</option><option value="moderator"${r.role === 'moderator' ? ' selected' : ''}>moderatör</option><option value="admin"${r.role === 'admin' ? ' selected' : ''}>admin</option></select> <button class="btn gray sm" type="submit">Rol</button></form></div>`}</td></tr>`).join('')}</table>`, 'users');
  } catch (e) { next(e); }
});

router.post('/users/:id(\\d+)/:act(block|unblock)', adminOnly, async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id);
    if (id === req.user.id) return res.redirect(303, '/users');
    const blocked = req.params.act === 'block';
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [blocked ? 'blocked' : 'active', id]);
    if (blocked) await pool.query('DELETE FROM sessions WHERE user_id = ?', [id]);
    await U.modlog(pool, req.user.id, 'user', id, req.params.act);
    res.redirect(303, `/users?ok=${blocked ? 'blocked' : 'unblocked'}`);
  } catch (e) { next(e); }
});

router.post('/users/:id(\\d+)/role', adminOnly, async (req, res, next) => {
  try {
    if (!guard(req, res)) return;
    const id = U.id(req.params.id), role = ['member', 'moderator', 'admin'].includes(req.body.role) ? req.body.role : null;
    if (!role || id === req.user.id) return res.redirect(303, '/users');
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    if (role === 'member') await pool.query("DELETE FROM sessions WHERE user_id = ? AND scope = 'panel'", [id]);
    await U.modlog(pool, req.user.id, 'user', id, 'role', role);
    res.redirect(303, '/users?ok=role');
  } catch (e) { next(e); }
});

// ====================== KAYITLAR (yalniz admin) ======================
router.get('/audit', adminOnly, async (req, res, next) => {
  try {
    const [m] = await pool.query(`SELECT l.created_at, u.display_name, l.target_type, l.target_id, l.action, l.note FROM moderation_log l JOIN users u ON u.id = l.actor_id ORDER BY l.id DESC LIMIT 100`);
    const [a] = await pool.query(`SELECT a.created_at, u.email, a.action, a.meta FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 100`);
    html(req, res, 200, 'Kayıtlar', `<h1>Kayıtlar</h1><h2>Moderasyon</h2>
<table><tr><th>Zaman (UTC)</th><th>Kim</th><th>Hedef</th><th>İşlem</th><th>Not</th></tr>${m.map((r) => `<tr><td class="mute">${esc(fmt(r.created_at))}</td><td>${esc(r.display_name)}</td><td>${esc(r.target_type)} #${r.target_id}</td><td>${esc(r.action)}</td><td>${esc(r.note || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="mute">Kayıt yok</td></tr>'}</table>
<h2>Hesap / güvenlik olayları</h2>
<table><tr><th>Zaman (UTC)</th><th>Hesap</th><th>Olay</th></tr>${a.map((r) => `<tr><td class="mute">${esc(fmt(r.created_at))}</td><td>${esc(r.email || '—')}</td><td>${esc(r.action)}</td></tr>`).join('')}</table>`, 'audit');
  } catch (e) { next(e); }
});

module.exports = router;
