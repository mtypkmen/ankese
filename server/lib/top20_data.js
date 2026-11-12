'use strict';
// Top 20 trend verisi, tamami gercek: company_visits (gunluk firma sayfasi goruntulenmesi) ve complaints tablosu.
// Gunler UTC, 14 gun, en eskiden bugune. Veri yoksa seriler sifir kalir; uydurma deger uretilmez.
const pool = require('../db');
const { publicName, slugify } = require('./page');

const TEXT = {
  sq: { sep: '.', mon: ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'], wd: ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'],
    visitors: 'Vizita', complaints: 'Ankesa', twoWeeks: '2 javë', none: 'Asnjë ankesë në 7 ditët e fundit.',
    pctTitle: 'Ndryshimi i vizitave: 7 ditët e fundit kundrejt 7 ditëve më parë', chartAria: 'Vizitat dhe ankesat në 14 ditët e fundit',
    brandStats: 'Statistikat e markës', last14: '14 ditët e fundit', last7: 'Ankesat e 7 ditëve të fundit', prev: 'Ankesat e mëparshme', next: 'Ankesat e tjera' },
  en: { sep: ',', mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    visitors: 'Visits', complaints: 'Complaints', twoWeeks: '2 weeks', none: 'No complaints in the last 7 days.',
    pctTitle: 'Visit change: last 7 days vs the 7 days before', chartAria: 'Visits and complaints over the last 14 days',
    brandStats: 'Brand statistics', last14: 'Last 14 days', last7: 'Complaints of the last 7 days', prev: 'Previous complaints', next: 'More complaints' },
};
const LOGO_OK = /^[a-z0-9-]{1,100}\.(png|jpg|webp|gif|ico)$/;
const CARDS = 12;

// rows: top20 sorgusu satirlari (siraya gore). p: yol tablosu. catOf(r): satir alt metni.
async function build(rows, loc, p, catOf) {
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13 + i)).toISOString().slice(0, 10));
  const at = Object.fromEntries(days.map((d, i) => [d, i]));
  const items = rows.map((r) => ({ id: r.id, name: r.name, href: `${p.company}/${r.slug}`, logo: LOGO_OK.test(r.logo || '') ? r.logo : null, cat: catOf(r),
    vis: Array(14).fill(0), cmp: Array(14).fill(0), list: [] }));
  const byId = new Map(items.map((it) => [it.id, it]));
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const [v] = await pool.query(`SELECT company_id, DATE_FORMAT(day, '%Y-%m-%d') AS d, hits FROM company_visits WHERE company_id IN (?) AND day >= ?`, [ids, days[0]]);
    for (const x of v) if (x.d in at) byId.get(x.company_id).vis[at[x.d]] = Number(x.hits);
    const [c] = await pool.query(
      `SELECT company_id, DATE_FORMAT(published_at, '%Y-%m-%d') AS d, COUNT(*) AS n FROM complaints
        WHERE company_id IN (?) AND status IN ('published','resolved') AND published_at >= ? GROUP BY company_id, d`, [ids, days[0]]);
    for (const x of c) if (x.d in at) byId.get(x.company_id).cmp[at[x.d]] = Number(x.n);
    const [l] = await pool.query(
      `SELECT x.id, x.company_id, x.title, DATE_FORMAT(x.published_at, '%Y-%m-%d') AS d, u.display_name AS author
         FROM complaints x JOIN users u ON u.id = x.user_id
        WHERE x.company_id IN (?) AND x.status IN ('published','resolved') AND x.published_at >= ? ORDER BY x.published_at DESC, x.id DESC`, [ids, days[7]]);
    for (const x of l) {
      const it = byId.get(x.company_id);
      if (it.list.length < CARDS && x.d in at) it.list.push([publicName(x.author), x.title, 13 - at[x.d], `${it.href}/${x.id}-${slugify(x.title)}`]);
    }
  }
  return { s: { ...TEXT[loc], days }, items };
}

module.exports = { build };
