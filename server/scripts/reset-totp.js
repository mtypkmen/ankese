'use strict';
// Telefon kaybi vb.: ADMIN_EMAIL icin TOTP'yi sifirlar; sonraki girista yeniden kurulum istenir.
const mysql = require('mysql2/promise');
(async () => {
  const e = process.env, email = String(e.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) { console.error('ADMIN_EMAIL gerekli'); process.exit(1); }
  const conn = await mysql.createConnection({ host: e.DB_HOST || '127.0.0.1', port: Number(e.DB_PORT) || 3306, user: e.DB_USER, password: e.DB_PASSWORD, database: e.DB_NAME || 'ankese' });
  const [r] = await conn.query("UPDATE users SET totp_secret = NULL, totp_enabled_at = NULL, totp_last_step = NULL WHERE email = ? AND role IN ('moderator','admin')", [email]);
  await conn.query("DELETE s FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = ? AND s.scope = 'panel'", [email]);
  await conn.end();
  console.log(r.affectedRows ? 'TOTP sifirlandi, panel oturumlari kapatildi.' : 'Kullanici bulunamadi.');
})().catch((err) => { console.error('hata:', err.message); process.exit(1); });
