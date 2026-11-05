'use strict';
const express = require('express');
const path = require('path');
const pool = require('../db');
const { esc } = require('../lib/html');
const pw = require('../lib/password');
const totp = require('../lib/totp');
const rl = require('../lib/ratelimit');
const sess = require('../session');
const { layout } = require('./views');
const { normEmail } = require('./util');

const router = express.Router();
const str = (v) => (typeof v === 'string' ? v : '');

router.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: '1h', index: false, dotfiles: 'ignore' }));
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });

const html = (req, res, status, title, body, opts = {}) =>
  res.status(status).type('html').send(layout({ user: req.user, csrf: req.csrfToken, title, body, ...opts }));
const csrf = (req) => `<input type="hidden" name="_csrf" value="${esc(req.csrfToken)}">`;
const err = (m) => `<p class="err" role="alert">${esc(m)}</p>`;
const limited = (req, name, n, ms) => !rl.hit(`p-${name}:${sess.clientIp(req)}`, n, ms).ok;
async function audit(req, uid, action, meta) {
  try { await pool.query('INSERT INTO audit_log (user_id, action, meta, ip_hmac) VALUES (?,?,?,?)', [uid || null, action, meta ? JSON.stringify(meta) : null, sess.ipHmac(req)]); } catch (e) { console.error('audit', e.code); }
}

// ---------- giris: 1) parola ----------
const loginForm = (req, e = '', email = '') => `<div class="card login"><h1>Panel girişi</h1>${e}
<form method="post" action="/login" autocomplete="off">${csrf(req)}
<div class="field"><label for="email">E-posta</label><input id="email" name="email" type="email" value="${esc(email)}" required autocomplete="username"></div>
<div class="field"><label for="password">Parola</label><input id="password" name="password" type="password" required autocomplete="current-password" maxlength="128"></div>
<button class="btn" type="submit">Devam</button></form></div>`;

router.get('/login', (req, res) => { if (req.user) return res.redirect('/'); html(req, res, 200, 'Giriş', loginForm(req)); });

router.post('/login', async (req, res, next) => {
  try {
    if (sess.checkPost(req)) return html(req, res, 403, 'Giriş', loginForm(req, err('Oturum süresi doldu. Sayfayı yenileyin.')));
    if (limited(req, 'login', 8, 900000)) return html(req, res, 429, 'Giriş', loginForm(req, err('Çok fazla deneme. Biraz bekleyin.')));
    const email = normEmail(req.body.email), pass = str(req.body.password);
    const bad = async (uid) => { await audit(req, uid, 'panel_login_fail'); return html(req, res, 401, 'Giriş', loginForm(req, err('E-posta veya parola hatalı, ya da hesap geçici olarak kilitli.'), email)); };
    if (!email || !pass || pass.length > 128) { await pw.dummyVerify(pass); return bad(null); }
    const [rows] = await pool.query(
      "SELECT id, pass_hash, role, status, failed_logins, totp_enabled_at, (locked_until > UTC_TIMESTAMP()) AS locked FROM users WHERE email = ? LIMIT 1", [email]);
    const u = rows[0];
    if (!u) { await pw.dummyVerify(pass); return bad(null); }
    const ok = await pw.verify(pass, u.pass_hash);
    if (u.locked || u.status !== 'active' || !['moderator', 'admin'].includes(u.role)) return bad(u.id);
    if (!ok) {
      const n = u.failed_logins + 1;
      await pool.query('UPDATE users SET failed_logins = ?, locked_until = IF(? >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), NULL) WHERE id = ?', [n >= 5 ? 0 : n, n, u.id]);
      return bad(u.id);
    }
    sess.setPre(res, u.id);
    res.redirect(303, u.totp_enabled_at ? '/login/2fa' : '/login/setup');
  } catch (e) { next(e); }
});

// ---------- giris: 2) TOTP ----------
async function preUser(req) {
  const id = sess.getPre(req);
  if (!id) return null;
  const [r] = await pool.query("SELECT id, email, role, status, totp_secret, totp_enabled_at, totp_last_step FROM users WHERE id = ? AND status = 'active' AND role IN ('moderator','admin')", [id]);
  return r[0] || null;
}
const codeForm = (req, title, intro, action, e = '') => `<div class="card login"><h1>${esc(title)}</h1>${intro}${e}
<form method="post" action="${action}" autocomplete="off">${csrf(req)}
<div class="field"><label for="code">6 haneli kod</label><input id="code" name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autofocus autocomplete="one-time-code"></div>
<button class="btn" type="submit">Doğrula</button></form></div>`;

async function finish(req, res, u, step) {
  await pool.query('UPDATE users SET totp_last_step = ?, failed_logins = 0, locked_until = NULL, last_login_at = UTC_TIMESTAMP() WHERE id = ?', [step, u.id]);
  sess.clearPre(res);
  await sess.createSession(req, res, u.id, 'panel');
  await audit(req, u.id, 'panel_login');
  res.redirect(303, '/');
}

router.get('/login/2fa', async (req, res, next) => {
  try { const u = await preUser(req); if (!u || !u.totp_enabled_at) return res.redirect('/login'); html(req, res, 200, '2 adımlı doğrulama', codeForm(req, '2 adımlı doğrulama', '<p class="mute">Doğrulayıcı uygulamanızdaki kodu girin.</p>', '/login/2fa')); } catch (e) { next(e); }
});
router.post('/login/2fa', async (req, res, next) => {
  try {
    const u = await preUser(req);
    if (!u || !u.totp_enabled_at) return res.redirect('/login');
    const again = (m, st) => html(req, res, st, '2 adımlı doğrulama', codeForm(req, '2 adımlı doğrulama', '', '/login/2fa', err(m)));
    if (sess.checkPost(req)) return again('Oturum süresi doldu.', 403);
    if (limited(req, 'totp', 10, 900000)) return again('Çok fazla deneme.', 429);
    const step = totp.verify(totp.decrypt(u.totp_secret), str(req.body.code).trim(), u.totp_last_step);
    if (!step) { await audit(req, u.id, 'panel_totp_fail'); return again('Kod hatalı.', 401); }
    await finish(req, res, u, step);
  } catch (e) { next(e); }
});

// ---------- ilk kurulum: TOTP ----------
router.get('/login/setup', async (req, res, next) => {
  try {
    const u = await preUser(req);
    if (!u || u.totp_enabled_at) return res.redirect('/login');
    let secret;
    if (u.totp_secret) secret = totp.decrypt(u.totp_secret);
    else { secret = totp.newSecret(); await pool.query('UPDATE users SET totp_secret = ? WHERE id = ?', [totp.encrypt(secret), u.id]); }
    const grouped = secret.match(/.{1,4}/g).join(' ');
    html(req, res, 200, '2 adımlı doğrulama kurulumu', codeForm(req, '2 adımlı doğrulamayı kur',
      `<p>Bir doğrulayıcı uygulamasına (Google Authenticator, Aegis, 1Password…) <b>manuel anahtar</b> olarak ekleyin:</p><p class="secret">${esc(grouped)}</p>
<p class="mute">Hesap: ${esc(u.email)} · Tür: zamana dayalı · 6 hane · 30 sn. Ekledikten sonra uygulamanın gösterdiği kodu girin.</p>`, '/login/setup'));
  } catch (e) { next(e); }
});
router.post('/login/setup', async (req, res, next) => {
  try {
    const u = await preUser(req);
    if (!u || u.totp_enabled_at || !u.totp_secret) return res.redirect('/login');
    const again = (m, st) => html(req, res, st, 'Kurulum', codeForm(req, '2 adımlı doğrulamayı kur', '<p class="mute">Anahtarı yeniden görmek için <a href="/login/setup">sayfayı yenileyin</a>.</p>', '/login/setup', err(m)));
    if (sess.checkPost(req)) return again('Oturum süresi doldu.', 403);
    if (limited(req, 'totp', 10, 900000)) return again('Çok fazla deneme.', 429);
    const step = totp.verify(totp.decrypt(u.totp_secret), str(req.body.code).trim(), 0);
    if (!step) return again('Kod hatalı.', 401);
    await pool.query('UPDATE users SET totp_enabled_at = UTC_TIMESTAMP() WHERE id = ?', [u.id]);
    await audit(req, u.id, 'panel_totp_enabled');
    await finish(req, res, u, step);
  } catch (e) { next(e); }
});

router.post('/logout', async (req, res, next) => {
  try {
    if (sess.checkPost(req)) return res.status(403).type('text/plain').send('Forbidden');
    await sess.destroySession(req, res); res.redirect(303, '/login');
  } catch (e) { next(e); }
});

// ---------- bundan sonrasi: yalniz personel ----------
router.use((req, res, next) => { if (!req.user) return res.redirect('/login'); next(); });

router.get('/', async (req, res, next) => {
  try {
    const [[c]] = await pool.query(`SELECT
      SUM(status='pending') pending, SUM(status='awaiting_company') awaiting, SUM(status='published') published,
      SUM(status='rejected') rejected, SUM(status='pending' AND risk_score >= 40) risky FROM complaints`);
    const [[s]] = await pool.query("SELECT COUNT(*) n FROM company_suggestions WHERE status = 'pending'");
    const [[rq]] = await pool.query("SELECT COUNT(*) n FROM legal_requests WHERE status = 'open'");
    const [[u]] = await pool.query('SELECT COUNT(*) n FROM users');
    const [[co]] = await pool.query("SELECT COUNT(*) n FROM companies WHERE status = 'active'");
    const stat = (href, n, label) => `<a class="stat" href="${href}"><b>${n || 0}</b><span>${esc(label)}</span></a>`;
    html(req, res, 200, 'Pano', `<h1>Pano</h1><div class="cards">
${stat('/complaints?status=pending', c.pending, 'İncelemede')}${stat('/complaints?status=pending&risk=high', c.risky, 'Yüksek riskli (bekleyen)')}
${stat('/suggestions', s.n, 'Şirket önerisi')}${stat('/complaints?status=awaiting_company', c.awaiting, 'Şirket bekleyen şikayet')}
${stat('/complaints?status=published', c.published, 'Yayında')}${stat('/complaints?status=rejected', c.rejected, 'Reddedilen')}
${stat('/requests', rq.n, 'Açık talep')}${stat('/companies', co.n, 'Şirket')}${stat('/users', u.n, 'Kullanıcı')}</div>`, { active: 'home' });
  } catch (e) { next(e); }
});

router.use(require('./moderation'));
router.use(require('./admin'));

router.use((req, res) => html(req, res, 404, 'Bulunamadı', '<h1>Sayfa bulunamadı</h1><p><a href="/">Pano</a></p>'));

module.exports = router;
