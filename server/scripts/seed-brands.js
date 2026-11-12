'use strict';
// Kullanim: set -a; . /root/ankese-migrate.env; set +a; node server/scripts/seed-brands.js
// server/data/brands.json -> companies (slug'a gore idempotent: varsa logo/website guncellenir, ad/kategori elle degistirildiyse dokunulmaz)
const path = require('path');
const mysql = require('mysql2/promise');
const brands = require('../data/brands.json');

const CAT = { tel: 'telefoni-internet', bank: 'banka-hua', ins: 'sigurime', shop: 'blerje-online', energy: 'energji-uje', trans: 'transport-poste',
  health: 'shendetesi', food: 'restorante-ushqim', real: 'pasuri-paluajtshme', edu: 'arsim', retail: 'shitje-me-pakice', auto: 'automjete', travel: 'hotele-udhetime' };

(async () => {
  const e = process.env;
  const conn = await mysql.createConnection({ host: e.DB_HOST || '127.0.0.1', port: Number(e.DB_PORT) || 3306, user: e.DB_USER, password: e.DB_PASSWORD, database: e.DB_NAME || 'ankese', charset: 'utf8mb4' });
  const [cats] = await conn.query('SELECT id, slug FROM categories');
  const [cities] = await conn.query('SELECT id, slug, country_code FROM cities');
  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  const cityId = new Map(cities.map((c) => [`${c.country_code}:${c.slug}`, c.id]));
  for (const b of brands) {
    const cat = catId.get(CAT[b.category]), city = cityId.get(`${b.country}:${b.city}`);
    if (!cat || !city) throw new Error(`kategori/sehir bulunamadi: ${b.name} (${b.category}, ${b.country}:${b.city})`);
    await conn.query(
      `INSERT INTO companies (slug, name, country_code, city_id, category_id, website, logo) VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE website = VALUES(website), logo = VALUES(logo)`,
      [b.slug, b.name, b.country, city, cat, b.website, b.logo]);
  }
  console.log(`${brands.length} marka islendi (yeni eklenenler + guncellenenler)`);
  await conn.end();
})().catch((err) => { console.error('seed hatasi:', err.message); process.exit(1); });
