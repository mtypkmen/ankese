'use strict';
const express = require('express');
const config = require('../config');
const pool = require('../db');
const S = require('../lib/i18n');
const PATHS = require('../lib/paths');
const { esc, field, layout } = require('../lib/html');
const pw = require('../lib/password');
const { sha256, token } = require('../lib/crypto');
const rl = require('../lib/ratelimit');
const mailer = require('../lib/mailer');
const sess = require('../session');

const router = express.Router();
const COMMON = new Set(['password123', '1234567890', 'qwertyuiop', 'password12', 'iloveyou12', 'passw0rd123', '0123456789', 'abcdefghij']);
const hasCtl = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]/;

const str = (v) => (typeof v === 'string' ? v : '');
const normName = (v) => str(v).normalize('NFKC').replace(/\s+/g, ' ').trim();
const nameOk = (n) => /^[\p{L}][\p{L}\p{M} .'-]{1,39}$/u.test(n);
const normEmail = (v) => str(v).normalize('NFKC').trim().toLowerCase();
const emailOk = (e) => e.length <= 254 && !hasCtl.test(e) && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\],;:"\\]+\.[a-z]{2,}$/i.test(e);
const pwOk = (p, email) => p.length >= 10 && p.length <= 128 && !hasCtl.test(p) && !COMMON.has(p.toLowerCase()) && p.toLowerCase() !== email;

function send(res, req, loc, status, title, body) {
  res.status(status).set('Cache-Control', 'no-store').type('html').send(
    layout({ loc, title, body, user: req.user, csrf: req.csrfToken, otherPath: PATHS[loc === 'sq' ? 'en' : 'sq'][req._route] || PATHS[loc === 'sq' ? 'en' : 'sq'].home }));
}
const csrfInput = (req) => `<input type="hidden" name="_csrf" value="${esc(req.csrfToken)}">`;
const honey = '<div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>';
const msg = (cls, text) => `<p class="msg ${cls}" role="status">${esc(text)}</p>`;

async function audit(req, userId, action, meta) {
  try {
    await pool.query('INSERT INTO audit_log (user_id, action, meta, ip_hmac) VALUES (?,?,?,?)',
      [userId || null, action, meta ? JSON.stringify(meta) : null, sess.ipHmac(req)]);
  } catch (e) { console.error('audit hatasi:', e.code); }
}

async function issueToken(userId, purpose, hours) {
  const raw = token(32);
  await pool.query("UPDATE email_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND purpose = ? AND used_at IS NULL", [userId, purpose]);
  await pool.query(
    'INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at) VALUES (?,?,?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR))',
    [userId, purpose, sha256(raw), hours]);
  return raw;
}

function limited(req, name, limit, windowMs) {
  return !rl.hit(`${name}:${sess.clientIp(req)}`, limit, windowMs).ok;
}

function mount(loc) {
  const t = S[loc], p = PATHS[loc];
  const r = (name) => (req, res, next) => { req._route = name; next(); };
  const bad = (req, res, form, key, status = 400) => send(res, req, loc, status, form.title, form.render(msg('err', t[key])));

  // ---------- kayit ----------
  const registerForm = (req, v = {}, extra = '') => ({
    title: t.h_register,
    render: (m = '') => `<h1>${esc(t.h_register)}</h1>${m}${extra}
<form method="post" action="${p.register}" class="form" novalidate>${csrfInput(req)}${honey}
${field('name', t.name, { value: v.name, autocomplete: 'name', maxlength: 40 })}
${field('email', t.email, { type: 'email', value: v.email, autocomplete: 'email' })}
${field('password', t.password, { type: 'password', autocomplete: 'new-password', hint: t.password_hint, maxlength: 128 })}
<label class="check"><input type="checkbox" name="terms" value="1" required> <span>${esc(t.terms_accept)}</span></label>
<button class="btn block" type="submit">${esc(t.submit_register)}</button></form>
<p class="alt">${esc(t.have_account)} <a href="${p.login}">${esc(t.login)}</a></p>`,
  });

  router.get(p.register, r('register'), (req, res) => {
    if (req.user) return res.redirect(p.profile);
    const f = registerForm(req); send(res, req, loc, 200, f.title, f.render());
  });

  router.post(p.register, r('register'), async (req, res, next) => {
    try {
      const b = req.body || {};
      const f = registerForm(req, { name: str(b.name), email: str(b.email) });
      if (sess.checkPost(req)) return bad(req, res, f, 'err_csrf', 403);
      if (limited(req, 'register', 10, 3600000)) return bad(req, res, f, 'err_rate', 429);
      const done = () => send(res, req, loc, 200, t.h_register, `<h1>${esc(t.h_register)}</h1>${msg('ok', t.sent_register)}`);
      if (str(b.website) !== '') return done(); // bot tuzagi: sessizce yut

      const name = normName(b.name), email = normEmail(b.email), pass = str(b.password);
      if (!nameOk(name)) return bad(req, res, f, 'err_name');
      if (!emailOk(email)) return bad(req, res, f, 'err_email');
      if (!pwOk(pass, email)) return bad(req, res, f, 'err_password');
      if (b.terms !== '1') return bad(req, res, f, 'err_terms');

      const [ex] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (ex[0]) { await pw.dummyVerify(pass); await audit(req, ex[0].id, 'register_existing'); return done(); }

      const hash = await pw.hash(pass);
      let id;
      try {
        const [ins] = await pool.query('INSERT INTO users (email, pass_hash, display_name, locale, ip_hmac) VALUES (?,?,?,?,?)',
          [email, hash, name, loc, sess.ipHmac(req)]);
        id = ins.insertId;
      } catch (e) { if (e.code === 'ER_DUP_ENTRY') return done(); throw e; }
      const raw = await issueToken(id, 'verify', 24);
      await mailer.send({ to: email, subject: t.mail_verify_subject, text: t.mail_verify_body(`${config.siteOrigin}${p.verify}?token=${raw}`) });
      await audit(req, id, 'register');
      done();
    } catch (e) { next(e); }
  });

  // ---------- giris ----------
  const loginForm = (req, v = {}, notice = '') => ({
    title: t.h_login,
    render: (m = '') => `<h1>${esc(t.h_login)}</h1>${notice}${m}
<form method="post" action="${p.login}" class="form" novalidate>${csrfInput(req)}${honey}
${field('email', t.email, { type: 'email', value: v.email, autocomplete: 'username' })}
${field('password', t.password, { type: 'password', autocomplete: 'current-password', maxlength: 128 })}
<button class="btn block" type="submit">${esc(t.submit_login)}</button></form>
<p class="alt"><a href="${p.forgot}">${esc(t.forgot_link)}</a></p>
<p class="alt">${esc(t.no_account)} <a href="${p.register}">${esc(t.register)}</a></p>`,
  });

  router.get(p.login, r('login'), (req, res) => {
    if (req.user) return res.redirect(p.profile);
    const notice = req.query.ok === 'reset' ? msg('ok', t.ok_reset) : req.query.ok === 'verified' ? msg('ok', t.ok_verified) : '';
    const f = loginForm(req, {}, notice); send(res, req, loc, 200, f.title, f.render());
  });

  router.post(p.login, r('login'), async (req, res, next) => {
    try {
      const b = req.body || {};
      const f = loginForm(req, { email: str(b.email) });
      if (sess.checkPost(req)) return bad(req, res, f, 'err_csrf', 403);
      if (limited(req, 'login', 8, 900000)) return bad(req, res, f, 'err_rate', 429);
      if (str(b.website) !== '') return bad(req, res, f, 'err_login', 401);

      const email = normEmail(b.email), pass = str(b.password);
      const fail = async (uid) => { await audit(req, uid, 'login_fail'); return bad(req, res, f, 'err_login', 401); };
      if (!emailOk(email) || pass.length < 1 || pass.length > 128) { await pw.dummyVerify(pass); return fail(null); }

      const [rows] = await pool.query('SELECT id, pass_hash, status, failed_logins, (locked_until > UTC_TIMESTAMP()) AS locked FROM users WHERE email = ? LIMIT 1', [email]);
      const u = rows[0];
      if (!u) { await pw.dummyVerify(pass); return fail(null); }
      const good = await pw.verify(pass, u.pass_hash);
      if (u.locked || u.status !== 'active') return fail(u.id);
      if (!good) {
        const n = u.failed_logins + 1;
        await pool.query('UPDATE users SET failed_logins = ?, locked_until = IF(? >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), NULL) WHERE id = ?', [n >= 5 ? 0 : n, n, u.id]);
        return fail(u.id);
      }
      await pool.query('UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = UTC_TIMESTAMP() WHERE id = ?', [u.id]);
      await sess.createSession(req, res, u.id); // her giriste yeni token (oturum sabitleme yok)
      await audit(req, u.id, 'login');
      res.redirect(303, p.profile);
    } catch (e) { next(e); }
  });

  // ---------- cikis ----------
  router.post(p.logout, r('home'), async (req, res, next) => {
    try {
      if (sess.checkPost(req)) return res.status(403).type('text/plain').send('Forbidden');
      await sess.destroySession(req, res);
      res.redirect(303, p.home);
    } catch (e) { next(e); }
  });

  // ---------- e-posta dogrulama (GET sadece form gosterir; tarayicilarin on-yuklemesi token tuketmesin) ----------
  const tokenParam = (v) => (/^[A-Za-z0-9_-]{43}$/.test(str(v)) ? str(v) : '');

  router.get(p.verify, r('home'), (req, res) => {
    const tk = tokenParam(req.query.token);
    if (!tk) return send(res, req, loc, 400, t.h_verify, `<h1>${esc(t.h_verify)}</h1>${msg('err', t.err_token)}`);
    send(res, req, loc, 200, t.h_verify, `<h1>${esc(t.h_verify)}</h1><p>${esc(t.verify_intro)}</p>
<form method="post" action="${p.verify}" class="form">${csrfInput(req)}<input type="hidden" name="token" value="${esc(tk)}">
<button class="btn block" type="submit">${esc(t.submit_verify)}</button></form>`);
  });

  router.post(p.verify, r('home'), async (req, res, next) => {
    try {
      if (sess.checkPost(req)) return res.status(403).type('text/plain').send('Forbidden');
      if (limited(req, 'verify', 20, 3600000)) return res.status(429).type('text/plain').send('Too many requests');
      const tk = tokenParam((req.body || {}).token);
      const [upd] = tk ? await pool.query(
        `UPDATE email_tokens SET used_at = UTC_TIMESTAMP()
          WHERE token_hash = ? AND purpose = 'verify' AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()`, [sha256(tk)]) : [{ affectedRows: 0 }];
      if (!upd.affectedRows) return send(res, req, loc, 400, t.h_verify, `<h1>${esc(t.h_verify)}</h1>${msg('err', t.err_token)}`);
      const [row] = await pool.query('SELECT user_id FROM email_tokens WHERE token_hash = ?', [sha256(tk)]);
      await pool.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = ?', [row[0].user_id]);
      await audit(req, row[0].user_id, 'email_verified');
      res.redirect(303, `${p.login}?ok=verified`);
    } catch (e) { next(e); }
  });

  router.post(p.resend, r('profile'), async (req, res, next) => {
    try {
      if (sess.checkPost(req)) return res.status(403).type('text/plain').send('Forbidden');
      if (!req.user) return res.redirect(303, p.login);
      if (!req.user.email_verified_at && rl.hit(`resend:${req.user.id}`, 3, 3600000).ok) {
        const raw = await issueToken(req.user.id, 'verify', 24);
        await mailer.send({ to: req.user.email, subject: t.mail_verify_subject, text: t.mail_verify_body(`${config.siteOrigin}${p.verify}?token=${raw}`) });
      }
      res.redirect(303, `${p.profile}?ok=resent`);
    } catch (e) { next(e); }
  });

  // ---------- parola sifirlama ----------
  const forgotForm = (req, v = {}) => ({
    title: t.h_forgot,
    render: (m = '') => `<h1>${esc(t.h_forgot)}</h1>${m}
<form method="post" action="${p.forgot}" class="form" novalidate>${csrfInput(req)}${honey}
${field('email', t.email, { type: 'email', value: v.email, autocomplete: 'email' })}
<button class="btn block" type="submit">${esc(t.submit_forgot)}</button></form>
<p class="alt"><a href="${p.login}">${esc(t.login)}</a></p>`,
  });
  router.get(p.forgot, r('forgot'), (req, res) => { const f = forgotForm(req); send(res, req, loc, 200, f.title, f.render()); });
  router.post(p.forgot, r('forgot'), async (req, res, next) => {
    try {
      const b = req.body || {};
      const f = forgotForm(req, { email: str(b.email) });
      if (sess.checkPost(req)) return bad(req, res, f, 'err_csrf', 403);
      if (limited(req, 'forgot', 5, 3600000)) return bad(req, res, f, 'err_rate', 429);
      const generic = () => send(res, req, loc, 200, t.h_forgot, `<h1>${esc(t.h_forgot)}</h1>${msg('ok', t.sent_forgot)}`);
      const email = normEmail(b.email);
      if (str(b.website) !== '' || !emailOk(email)) return generic();
      const [rows] = await pool.query("SELECT id FROM users WHERE email = ? AND status = 'active' LIMIT 1", [email]);
      if (rows[0]) {
        const raw = await issueToken(rows[0].id, 'reset', 1);
        await mailer.send({ to: email, subject: t.mail_reset_subject, text: t.mail_reset_body(`${config.siteOrigin}${p.reset}?token=${raw}`) });
        await audit(req, rows[0].id, 'reset_requested');
      }
      generic();
    } catch (e) { next(e); }
  });

  const resetForm = (req, tk) => `<h1>${esc(t.h_reset)}</h1><p>${esc(t.reset_intro)}</p>
<form method="post" action="${p.reset}" class="form" novalidate>${csrfInput(req)}<input type="hidden" name="token" value="${esc(tk)}">
${field('password', t.password_new, { type: 'password', autocomplete: 'new-password', hint: t.password_hint, maxlength: 128 })}
<button class="btn block" type="submit">${esc(t.submit_reset)}</button></form>`;
  router.get(p.reset, r('home'), (req, res) => {
    const tk = tokenParam(req.query.token);
    if (!tk) return send(res, req, loc, 400, t.h_reset, `<h1>${esc(t.h_reset)}</h1>${msg('err', t.err_token)}`);
    send(res, req, loc, 200, t.h_reset, resetForm(req, tk));
  });
  router.post(p.reset, r('home'), async (req, res, next) => {
    try {
      const b = req.body || {};
      if (sess.checkPost(req)) return res.status(403).type('text/plain').send('Forbidden');
      if (limited(req, 'reset', 10, 3600000)) return res.status(429).type('text/plain').send('Too many requests');
      const tk = tokenParam(b.token), pass = str(b.password);
      if (!tk) return send(res, req, loc, 400, t.h_reset, `<h1>${esc(t.h_reset)}</h1>${msg('err', t.err_token)}`);
      const [rows] = await pool.query(
        `SELECT et.user_id, u.email FROM email_tokens et JOIN users u ON u.id = et.user_id
          WHERE et.token_hash = ? AND et.purpose = 'reset' AND et.used_at IS NULL AND et.expires_at > UTC_TIMESTAMP() LIMIT 1`, [sha256(tk)]);
      if (!rows[0]) return send(res, req, loc, 400, t.h_reset, `<h1>${esc(t.h_reset)}</h1>${msg('err', t.err_token)}`);
      if (!pwOk(pass, rows[0].email)) return send(res, req, loc, 400, t.h_reset, resetForm(req, tk).replace('</p>', `</p>${msg('err', t.err_password)}`));
      const hash = await pw.hash(pass);
      const [used] = await pool.query("UPDATE email_tokens SET used_at = UTC_TIMESTAMP() WHERE token_hash = ? AND used_at IS NULL", [sha256(tk)]);
      if (!used.affectedRows) return send(res, req, loc, 400, t.h_reset, `<h1>${esc(t.h_reset)}</h1>${msg('err', t.err_token)}`);
      await pool.query('UPDATE users SET pass_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?', [hash, rows[0].user_id]);
      await pool.query('DELETE FROM sessions WHERE user_id = ?', [rows[0].user_id]); // tum oturumlari kapat
      await audit(req, rows[0].user_id, 'password_reset');
      res.redirect(303, `${p.login}?ok=reset`);
    } catch (e) { next(e); }
  });

  // ---------- profil ----------
  router.get(p.profile, r('profile'), async (req, res, next) => {
    try {
      if (!req.user) return res.redirect(p.login);
      const u = req.user;
      const note = req.query.ok === 'resent' ? msg('ok', t.resent)
        : req.query.ok === 'received' ? msg('ok', t.received)
        : req.query.ok === 'received_sugg' ? msg('ok', t.received_sugg) : '';
      const verify = u.email_verified_at
        ? `<dd>${esc(t.verified)}</dd>`
        : `<dd>${esc(t.unverified)}</dd><form method="post" action="${p.resend}" class="form">${csrfInput(req)}<button class="btn" type="submit">${esc(t.resend)}</button></form>`;
      const [cs] = await pool.query(
        `SELECT x.id, x.title, x.status, DATE_FORMAT(x.created_at, '%d.%m.%Y') AS d, c.name AS cname, c.slug, s.name AS sname
           FROM complaints x LEFT JOIN companies c ON c.id = x.company_id LEFT JOIN company_suggestions s ON s.id = x.suggestion_id
          WHERE x.user_id = ? ORDER BY x.created_at DESC LIMIT 50`, [u.id]);
      const list = cs.length
        ? `<ul class="plist">${cs.map((x) => `<li><span><b>${['published', 'resolved'].includes(x.status) && x.slug ? `<a href="${p.company}/${esc(x.slug)}/${x.id}">${esc(x.title)}</a>` : esc(x.title)}</b><small>${esc(x.cname || x.sname || '')} · ${esc(x.d)}</small></span><span class="tag">${esc(t['st_' + x.status])}</span></li>`).join('')}</ul>`
        : `<p>${esc(t.none_yet)}</p>`;
      send(res, req, loc, 200, t.h_profile, `<div class="pub"><h1>${esc(t.h_profile)}</h1>${note}
<dl class="kv"><dt>${esc(t.name)}</dt><dd>${esc(u.display_name)}</dd><dt>${esc(t.email)}</dt><dd>${esc(u.email)}</dd><dt>${esc(t.verified)}</dt>${verify}</dl>
<p><a class="btn" href="${p.write}">${esc(t.write)}</a></p>
<h2 class="sec">${esc(t.my_complaints)}</h2>${list}</div>`);
    } catch (e) { next(e); }
  });
}

mount('sq');
mount('en');
module.exports = router;
