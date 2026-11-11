'use strict';
// Site footer (tum sayfalar). Koyu gri: logo; kurumsal linkler + sosyal medya; 5 sutun; yasal metinler + dil secimi.
// Sutun listeleri DB'den gelir ve bellekte tutulur: layout() senkron oldugu icin render() son veriyi kullanir,
// veri 5 dakikadan eskiyse arka planda yenilenir. Ana sayfa render'dan once refresh()'i bekler.
const PATHS = require('./paths');

const T = {
  sq: {
    links: [['about', 'Rreth nesh'], ['business', 'Anëtarësimi për biznese'], ['awards', 'Çmimet vjetore'], ['transparency', 'Raporti i transparencës'], ['faq', 'Pyetje të shpeshta'], ['contact', 'Kontakt']],
    complaints: 'Ankesat', allComplaints: 'Shiko të gjitha ankesat',
    brands: 'Markat', allBrands: 'Shiko të gjitha markat', newBrands: 'Shiko markat e reja',
    searched: 'Më të kërkuarat', search: 'Kërko',
    top: 'Top 20', allTop: 'Shiko Top 20',
    topics: 'Temat', allTopics: 'Të gjitha temat',
    soon: 'Së shpejti.', noComplaints: 'Ende nuk ka ankesa.', noBrands: 'Ende nuk ka marka.',
    legal: [['memberPrivacy', 'Njoftimi i privatësisë për anëtarët'], ['visitorPrivacy', 'Njoftimi i privatësisë për vizitorët'], ['terms', 'Kushtet e përdorimit'],
      ['rules', 'Rregullat e komunitetit'], ['cookies', 'Politika e cookies'], ['reviewGuide', 'Udhëzuesi i vlerësimit']],
    rights: 'Të gjitha të drejtat e rezervuara.', made: 'Një projekt i', city: 'Prishtinë',
    social: 'Rrjetet sociale', legalNav: 'Informacione ligjore', lang: 'Gjuha',
  },
  en: {
    links: [['about', 'About us'], ['business', 'Business membership'], ['awards', 'Annual awards'], ['transparency', 'Transparency report'], ['faq', 'FAQ'], ['contact', 'Contact']],
    complaints: 'Complaints', allComplaints: 'See all complaints',
    brands: 'Brands', allBrands: 'See all brands', newBrands: 'See new brands',
    searched: 'Most searched', search: 'Search',
    top: 'Top 20', allTop: 'See Top 20',
    topics: 'Topics', allTopics: 'All topics',
    soon: 'Coming soon.', noComplaints: 'No complaints yet.', noBrands: 'No brands yet.',
    legal: [['memberPrivacy', 'Privacy notice for members'], ['visitorPrivacy', 'Privacy notice for visitors'], ['terms', 'Terms of use'],
      ['rules', 'Community rules'], ['cookies', 'Cookie policy'], ['reviewGuide', 'Review guidelines']],
    rights: 'All rights reserved.', made: 'A project by', city: 'Prishtina',
    social: 'Social media', legalNav: 'Legal information', lang: 'Language',
  },
};

// Henuz olmayan sayfalar (rreth-nesh, biznes, cmimet, transparenca, pyetje, aydinlatma metinleri, degerlendirme kilavuzu):
// adresler simdiden sabit, sayfalar yazilinca buraya bagli kalir.
const EXTRA = {
  sq: { about: '/rreth-nesh', business: '/biznes', awards: '/cmimet', transparency: '/transparenca', faq: '/pyetje',
        memberPrivacy: '/privatesia/anetaret', visitorPrivacy: '/privatesia/vizitoret', reviewGuide: '/udhezuesi-i-vleresimit', newBrands: '/kompani?rendit=te-rejat' },
  en: { about: '/en/about', business: '/en/business', awards: '/en/awards', transparency: '/en/transparency', faq: '/en/faq',
        memberPrivacy: '/en/privacy/members', visitorPrivacy: '/en/privacy/visitors', reviewGuide: '/en/review-guidelines', newBrands: '/en/company?sort=new' },
};

const LANGS = [['sq', 'Shqip', 'al'], ['en', 'English', 'gb']];

const SOC = {
  Facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8z"/>',
  Instagram: '<rect x="4" y="4" width="16" height="16" rx="5" class="o"/><circle cx="12" cy="12" r="3.6" class="o"/><circle cx="16.6" cy="7.4" r="1.1"/>',
  X: '<path d="M5 4h4l10 16h-4z"/><path d="M5.5 20 11 13.4M13 10.6 18.5 4" class="o"/>',
  LinkedIn: '<rect x="4.5" y="9" width="3" height="10.5"/><circle cx="6" cy="5.6" r="1.8"/><path d="M10 9h3v1.6c.7-1.1 1.9-1.9 3.6-1.9 2.6 0 3.9 1.7 3.9 4.6v6.2h-3.1v-5.6c0-1.5-.6-2.4-1.9-2.4s-2.3.9-2.3 2.5v5.5H10z"/>',
  TikTok: '<path d="M14 3h3c.2 2 1.6 3.5 3.6 3.7v3.1c-1.4 0-2.6-.4-3.6-1.1v6.3a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.2a2.4 2.4 0 1 0 1.6 2.2z"/>',
};
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';

// --- veri: son 10 sikayet, en cok sikayet alan 10 marka, kategoriler (iki dilde) ---
const TTL = 5 * 60 * 1000;
let data = null, at = 0, loading = null;
function refresh() {
  if (data && Date.now() - at < TTL) return Promise.resolve(data);
  if (loading) return loading;
  const pool = require('../db');
  loading = (async () => {
    const [complaints] = await pool.query(
      `SELECT x.id, x.title, c.slug FROM complaints x JOIN companies c ON c.id = x.company_id
        WHERE x.status IN ('published','resolved') AND c.status = 'active' ORDER BY x.published_at DESC, x.id DESC LIMIT 10`);
    const [brands] = await pool.query(
      `SELECT c.slug, c.name, COUNT(x.id) AS n FROM companies c LEFT JOIN complaints x ON x.company_id = c.id AND x.status IN ('published','resolved')
        WHERE c.status = 'active' GROUP BY c.id ORDER BY n DESC, c.name LIMIT 10`);
    const [cats] = await pool.query('SELECT slug, name_sq, name_en FROM categories ORDER BY sort LIMIT 10');
    data = { complaints, brands, cats };
    at = Date.now();
    return data;
  })().catch((e) => { console.error('footer data', e.message); return data; }).finally(() => { loading = null; });
  return loading;
}

function col(title, items, empty, more) {
  const list = items.length ? `<ul>${items.map(([t, h]) => `<li><a href="${esc(h)}">${esc(t)}</a></li>`).join('')}</ul>` : `<p class="f2-empty">${esc(empty)}</p>`;
  return `<nav class="f2-col" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${list}${more.map(([t, h]) => `<a class="f2-more" href="${esc(h)}">${esc(t)}${ARROW}</a>`).join('')}</nav>`;
}

// otherPath: dil degistiricinin diger dildeki hedefi (sayfanin karsiligi)
function render(loc, otherPath) {
  if (!data || Date.now() - at >= TTL) refresh();
  const t = T[loc], p = PATHS[loc], x = EXTRA[loc];
  const d = data || { complaints: [], brands: [], cats: [] };
  const href = (k) => x[k] || p[k];
  const cols =
    col(t.complaints, d.complaints.map((c) => [c.title, `${p.company}/${c.slug}/${c.id}-${slugify(c.title)}`]), t.noComplaints, [[t.allComplaints, p.complaints]]) +
    col(t.brands, d.brands.map((b) => [b.name, `${p.company}/${b.slug}`]), t.noBrands, [[t.allBrands, p.company], [t.newBrands, x.newBrands]]) +
    col(t.searched, [], t.soon, [[t.search, p.search]]) +
    col(t.top, [], t.soon, [[t.allTop, p.top]]) +
    col(t.topics, d.cats.map((k) => [k[`name_${loc}`], `${p.category}/${k.slug}`]), t.soon, [[t.allTopics, p.category]]);
  const cur = LANGS.find((l) => l[0] === loc);
  const flag = (c) => `<img class="flag" src="/assets/img/flag-${c}.svg" width="21" height="15" alt="">`;
  const langs = LANGS.map(([code, name, fl]) => code === loc
    ? `<li><a href="${esc(p.home)}" lang="${code}" hreflang="${code}" aria-current="true">${flag(fl)}${name}</a></li>`
    : `<li><a href="${esc(otherPath)}" lang="${code}" hreflang="${code}">${flag(fl)}${name}</a></li>`).join('');
  return `<footer class="foot2"><div class="w">
<a class="logo f2-logo" href="${p.home}"><img src="/assets/img/logo-ankese-128.png" width="139" height="128" alt=""><span>Ankese<em>.com</em></span></a>
<div class="f2-nav"><nav class="f2-links" aria-label="Ankese.com">${t.links.map(([k, n]) => `<a href="${esc(href(k))}">${esc(n)}</a>`).join('')}</nav>
<div class="f2-soc" role="group" aria-label="${esc(t.social)}">${Object.entries(SOC).map(([k, v]) => `<a href="#" aria-label="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${v}</svg></a>`).join('')}</div></div>
<div class="f2-cols">${cols}</div>
<div class="f2-bot"><nav class="f2-legal" aria-label="${esc(t.legalNav)}">${t.legal.map(([k, n]) => `<a href="${esc(href(k))}">${esc(n)}</a>`).join('')}</nav>
<div class="f2-side"><div class="f2-line"><div class="f2-lang" data-lang>
<button type="button" class="f2-lang-btn" aria-haspopup="true" aria-expanded="false" aria-controls="f2-lang-list" aria-label="${esc(t.lang)}: ${cur[1]}">${flag(cur[2])}<span>${cur[1]}</span><svg class="chv" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>
<ul class="f2-lang-list" id="f2-lang-list" hidden>${langs}</ul></div>
<p class="f2-rights">© ${new Date().getUTCFullYear()} Ankese.com · ${esc(t.rights)}</p></div>
<p class="f2-made">${esc(t.made)} <a href="https://joinonecommunity.com" target="_blank" rel="noopener">One Community</a>, ${esc(t.city)}</p></div></div>
</div></footer>`;
}

module.exports = { render, refresh };
