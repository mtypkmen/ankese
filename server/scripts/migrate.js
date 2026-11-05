'use strict';
// Kullanim: set -a; . /root/ankese-migrate.env; set +a; node server/scripts/migrate.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const e = process.env;
  const conn = await mysql.createConnection({
    host: e.DB_HOST || '127.0.0.1',
    port: Number(e.DB_PORT) || 3306,
    user: e.DB_USER,
    password: e.DB_PASSWORD,
    database: e.DB_NAME || 'ankese',
    charset: 'utf8mb4',
    multipleStatements: true, // yalnizca guvenilir migration dosyalari icin, uygulamada KAPALI
  });
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(190) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const [rows] = await conn.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));
  const dir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let n = 0;
  for (const f of files) {
    if (done.has(f)) continue;
    console.log('uygulaniyor:', f);
    await conn.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [f]);
    n++;
  }
  console.log(n ? `${n} migration uygulandi` : 'yapilacak migration yok');
  await conn.end();
})().catch((err) => { console.error('migration hatasi:', err.message); process.exit(1); });
