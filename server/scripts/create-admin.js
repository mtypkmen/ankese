'use strict';
// Kullanim (root, gizli giris):
//   set -a; . /root/ankese-migrate.env; set +a
//   ADMIN_EMAIL=ben@ornek.com ADMIN_NAME="Ad Soyad" node server/scripts/create-admin.js
// Parola: terminalde gizli sorulur. (TTY yoksa ADMIN_PASSWORD kullanilir, yoksa rastgele uretilip bir kez yazdirilir.)
const readline = require('readline');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const pw = require('../lib/password');

function askHidden(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); resolve(a); });
  });
}

(async () => {
  const e = process.env;
  const email = String(e.ADMIN_EMAIL || '').trim().toLowerCase();
  const name = String(e.ADMIN_NAME || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || name.length < 2) { console.error('ADMIN_EMAIL ve ADMIN_NAME gerekli'); process.exit(1); }
  let pass = e.ADMIN_PASSWORD || '', generated = false;
  if (!pass && process.stdin.isTTY) {
    pass = await askHidden('Parola (en az 12 karakter): ');
    const again = await askHidden('Tekrar: ');
    if (pass !== again) { console.error('Parolalar uyusmuyor'); process.exit(1); }
  }
  if (!pass) { pass = crypto.randomBytes(18).toString('base64url'); generated = true; }
  const minLen = Number(e.ADMIN_MIN_LEN) || 12;
  if (pass.length < minLen || pass.length > 128) { console.error(`Parola ${minLen}-128 karakter olmali`); process.exit(1); }
  const hash = await pw.hash(pass);
  const conn = await mysql.createConnection({ host: e.DB_HOST || '127.0.0.1', port: Number(e.DB_PORT) || 3306, user: e.DB_USER, password: e.DB_PASSWORD, database: e.DB_NAME || 'ankese', charset: 'utf8mb4' });
  await conn.query(
    `INSERT INTO users (email, pass_hash, display_name, role, email_verified_at, locale) VALUES (?,?,?,'admin', UTC_TIMESTAMP(), 'sq')
     ON DUPLICATE KEY UPDATE pass_hash = VALUES(pass_hash), role = 'admin', status = 'active', failed_logins = 0, locked_until = NULL,
       email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP())`, [email, hash, name]);
  await conn.end();
  console.log(`Admin hazir: ${email}`);
  if (generated) console.log(`Rastgele parola (bir kez gosterilir, simdi kaydedin): ${pass}`);
  console.log('Ilk giriste panel 2 adimli dogrulamayi (TOTP) kurmanizi isteyecek.');
})().catch((err) => { console.error('hata:', err.message); process.exit(1); });
