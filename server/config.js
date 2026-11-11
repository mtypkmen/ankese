'use strict';
const e = process.env;
const prod = e.NODE_ENV === 'production';

const config = {
  prod,
  host: e.HOST || '127.0.0.1',
  port: Number(e.PORT) || 3200,
  siteOrigin: e.SITE_ORIGIN || 'https://ankese.com',
  panelOrigin: e.PANEL_ORIGIN || 'https://panel.ankese.com',
  sessionSecret: e.SESSION_SECRET || '',
  resendKey: e.RESEND_API_KEY || '',
  // E-posta gercekten gidiyorsa true. Degilse giris/kayit baglantilari gizlenir (dogrulama maili ulasmaz)
  mailLive: e.MAIL_MODE !== 'log' && !!e.RESEND_API_KEY,
  // Giris/kayit/ankese yaz baglantilari: uretimde yalnizca mail canliysa, gelistirmede her zaman
  get showAuth() { return this.mailLive || !this.prod; },
  db: {
    host: e.DB_HOST || '127.0.0.1',
    port: Number(e.DB_PORT) || 3306,
    database: e.DB_NAME || 'ankese',
    user: e.DB_USER || '',
    password: e.DB_PASSWORD || '',
  },
};

// Uretimde eksik/zayif gizli degerle baslamayi reddet
if (prod) {
  const problems = [];
  if (config.sessionSecret.length < 32) problems.push('SESSION_SECRET en az 32 karakter olmali');
  if (!config.db.user) problems.push('DB_USER bos');
  if (!config.db.password) problems.push('DB_PASSWORD bos');
  if (problems.length) {
    console.error('Config hatasi:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
}

const hostOf = (o) => new URL(o).host;
config.allowedHosts = new Set([hostOf(config.siteOrigin), hostOf(config.panelOrigin)]);

module.exports = config;
