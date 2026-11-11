'use strict';
const express = require('express');
const config = require('./config');
const pool = require('./db');
const { securityHeaders, hostGuard } = require('./security');
const session = require('./session');
const authRoutes = require('./routes/auth');
const writeRoutes = require('./routes/write');
const publicRoutes = require('./routes/public');
const legalRoutes = require('./routes/legal');
const homeRoutes = require('./routes/home');
const sitemapRoutes = require('./routes/sitemap');
const panelRouter = require('./panel');
const panelHost = new URL(config.panelOrigin).host;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.set('etag', false);

app.use(hostGuard);
app.use((req, res, next) => { req.isPanel = (req.headers.host || '').toLowerCase() === panelHost; next(); });
app.use(securityHeaders);
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '4kb', parameterLimit: 20 }));

// Saglik kontrolu: ayrinti sizdirmaz, yalnizca durum kodu ve ok alani
app.get('/healthz', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    console.error('healthz db hatasi:', err.code || err.message);
    res.status(503).json({ ok: false });
  }
});

// Yalnizca gelistirme: uretimde public/ nginx tarafindan sunulur
if (!config.prod) {
  app.use('/assets', express.static(require('path').join(__dirname, '..', 'public', 'assets')));
  app.get('/preview/', (req, res) => res.redirect('/preview/hero-d.html'));
  app.use('/preview', express.static(require('path').join(__dirname, '..', 'public', 'preview')));
}

app.use(session.load);
const site = (r) => (req, res, next) => (req.isPanel ? next() : r(req, res, next));
app.use((req, res, next) => (req.isPanel ? panelRouter(req, res, next) : next()));
app.use(site(authRoutes));
app.use(site(writeRoutes));
app.use(site(publicRoutes));
app.use(site(legalRoutes));
app.use(site(homeRoutes));
app.use(site(sitemapRoutes));

app.use((req, res) => res.status(404).type('text/plain').send('Not found'));

// Hata yanitinda yigin izi, yol veya SQL hatasi gosterilmez
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status === 400 || err.type === 'entity.parse.failed' ? 400 : err.status === 413 ? 413 : 500;
  if (status === 500) console.error('hata:', err.code || err.message);
  res.status(status).type('text/plain').send(status === 500 ? 'Server error' : 'Bad request');
});

const server = app.listen(config.port, config.host, () => {
  console.log(`ankese dinliyor ${config.host}:${config.port}`);
});
// Suresi dolan oturum ve tokenlari 15 dakikada bir temizle
setInterval(async () => {
  try {
    await pool.query('DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()');
    await pool.query('DELETE FROM email_tokens WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)');
  } catch (e) { console.error('temizlik hatasi:', e.code); }
}, 15 * 60 * 1000).unref();

// Slowloris'e karsi
server.headersTimeout = 20000;
server.requestTimeout = 30000;
server.keepAliveTimeout = 5000;

function shutdown() {
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
