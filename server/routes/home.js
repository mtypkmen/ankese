'use strict';
const express = require('express');
const config = require('../config');
const pool = require('../db');
const PATHS = require('../lib/paths');
const SPRITE = require('../lib/sprite');
const footer = require('../lib/footer');
const { esc } = require('../lib/html');
const { page, slugify, publicName } = require('../lib/page');

// Ana sayfa (2026-11-10'da public/preview/hero-d.html tasarimina gecti).
// Verisi olan bolumler DB'den gelir (son sikayetler, kategoriler, sayilar). Verisi henuz tutulmayan bolumler
// (trend = goruntulenme, en basarili firmalar = puan, Top 20 = ziyaret, belgeli oran, ziyaretci sayisi)
// "bos durum" gosterir; o veriler toplanmaya baslayinca buralar doldurulacak.
const router = express.Router();
const H = {
  sq: {
    title: 'Ankesa për kompanitë në Shqipëri dhe Kosovë',
    desc: 'Ankese.com: vend ku konsumatorët shkruajnë ankesat ndaj kompanive në Shqipëri dhe Kosovë dhe kompanitë përgjigjen publikisht.',
    h1: 'Të ka bërë keq një kompani? <span>Shkruaje këtu.</span>',
    eyebrow: 'Shqipëri & Kosovë',
    lead: 'Ankese.com është faqja ku konsumatorët në Shqipëri dhe Kosovë publikojnë ankesat ndaj kompanive dhe kompanitë përgjigjen hapur. Çdo ankesë ka një adresë të qartë dhe një përgjigje.',
    ph: 'Kërko kompani ose markë…', go: 'Kërko', write: 'Shkruaj ankesë', soon: 'Platforma po hapet. Regjistrimi do të jetë i disponueshëm së shpejti.',
    popL: 'Më të kërkuarat:',
    soonH: 'Së shpejti',
    trendH: 'Ankesat në trend', trendSoon: 'Ankesat në trend do të shfaqen sapo të kemi mjaftueshëm shikime.',
    latestH: 'Ankesat e fundit', prev: 'Ankesa e mëparshme', next: 'Ankesa tjetër', empty: 'Ende nuk ka ankesa të publikuara. Bëhu i pari që shkruan.',
    bestH: 'Kompanitë më të suksesshme në zgjidhjen e ankesave', cat: 'Kategoria', catSearch: 'Kërko kategori…', cats: 'Kategoritë', catNone: 'Asnjë kategori nuk u gjet.',
    period: '6 muajt e fundit',
    bestNote: 'Kjo renditje tregon vetëm se si kompanitë u përgjigjen dhe i zgjidhin ankesat në Ankese.com. Nuk tregon nëse një kompani është e mirë apo e keqe, as madhësinë e saj.',
    bestSoon: 'Renditja do të shfaqet sapo kompanitë të marrin vlerësimet e para.',
    corpEy: 'Për biznese', corpH: 'Kthejeni çdo ankesë në një klient besnik',
    corpP: 'Me anëtarësimin për biznese u përgjigjeni ankesave më shpejt, tregoni se kujdeseni për klientët dhe e bëni markën tuaj të dallohet para mijëra njerëzve që kërkojnë në Ankese.com përpara se të blejnë.',
    corpBtn: 'Shiko anëtarësimin për biznese', corpHref: '/biznes',
    awEy: 'Çmimet vjetore', awH: 'Më të mirët e vitit shpërblehen',
    awP: 'Çdo vit, kompania që zë vendin e parë në secilën kategori, sipas mënyrës si u përgjigjet dhe i zgjidh ankesat, fiton çmimin vjetor të Ankese.com.',
    awItems: [['Anëtarësim Pro falas', 'Një vit i plotë me të gjitha veçoritë Pro, pa pagesë.'], ['Reklamë nga Ankese.com', 'E promovojmë kompaninë fituese para mijëra vizitorëve tanë.']],
    awNote: 'Çmimet e para do të ndahen pas një viti.', awAlt: 'Dy të rinj festojnë, njëri mban një trofe të artë',
    statsH: 'Ankese.com në shifra', stMembers: 'Anëtarë individualë', stCompanies: 'Kompani të regjistruara', stDocs: 'Ankesa me dëshmi',
    stResolved: 'Ankesa të zgjidhura gjithsej', stVisitors: 'Vizitorë në 30 ditë', stSoon: 'Së shpejti',
    topSub: 'Ndiqni kompanitë më popullore dhe me më shumë ndërveprim këtë javë.', topSoon: 'Top 20 do të shfaqet sapo të kemi mjaftueshëm të dhëna për vizitat.', topMore: 'Shiko më shumë',
    oneEy: 'Kush qëndron pas Ankese.com', oneH: 'Një projekt i One Community',
    oneP: 'Ankese.com ndërtohet dhe drejtohet nga One Community, një ekip me qendër në Prishtinë, Kosovë. Punojmë që zëri i konsumatorëve në Kosovë dhe Shqipëri të dëgjohet dhe kompanitë t’u përgjigjen.',
    oneLoc: 'Prishtinë, Kosovë',
  },
  en: {
    title: 'Consumer complaints about companies in Albania and Kosovo',
    desc: 'Ankese.com is where consumers in Albania and Kosovo publish complaints about companies and companies reply in public.',
    h1: 'Let down by a company? <span>Say it here.</span>',
    eyebrow: 'Albania & Kosovo',
    lead: 'Ankese.com is where consumers in Albania and Kosovo publish complaints about companies and companies reply in the open. Every complaint gets a clear address and an answer.',
    ph: 'Search a company or brand…', go: 'Search', write: 'Write a complaint', soon: 'The platform is opening. Sign-up will be available soon.',
    popL: 'Popular:',
    soonH: 'Coming soon',
    trendH: 'Trending complaints', trendSoon: 'Trending complaints will appear once we have enough views.',
    latestH: 'Latest complaints', prev: 'Previous complaint', next: 'Next complaint', empty: 'No complaints published yet. Be the first to write one.',
    bestH: 'The most successful companies at resolving complaints', cat: 'Category', catSearch: 'Search categories…', cats: 'Categories', catNone: 'No category found.',
    period: 'Last 6 months',
    bestNote: 'This ranking only shows how companies reply to and resolve complaints on Ankese.com. It does not say whether a company is good or bad, nor how big it is.',
    bestSoon: 'The ranking will appear once companies receive their first ratings.',
    corpEy: 'For businesses', corpH: 'Turn every complaint into a loyal customer',
    corpP: 'With a business membership you reply to complaints faster, show that you care about your customers and make your brand stand out to the thousands of people who search Ankese.com before they buy.',
    corpBtn: 'See business membership', corpHref: '/en/business',
    awEy: 'Annual awards', awH: 'The best of the year are rewarded',
    awP: 'Every year, the company that ranks first in each category, based on how it replies to and resolves complaints, wins the Ankese.com annual award.',
    awItems: [['Free Pro membership', 'A full year with every Pro feature, free of charge.'], ['Promotion by Ankese.com', 'We promote the winning company to thousands of our visitors.']],
    awNote: 'The first awards will be given after one year.', awAlt: 'Two young people celebrating, one holding a gold trophy',
    statsH: 'Ankese.com in numbers', stMembers: 'Individual members', stCompanies: 'Registered companies', stDocs: 'Complaints with evidence',
    stResolved: 'Complaints resolved in total', stVisitors: 'Visitors in 30 days', stSoon: 'Coming soon',
    topSub: 'Follow the most popular companies with the most engagement this week.', topSoon: 'The Top 20 will appear once we have enough visit data.', topMore: 'See more',
    oneEy: 'Who is behind Ankese.com', oneH: 'A project by One Community',
    oneP: 'Ankese.com is built and run by One Community, a team based in Prishtina, Kosovo. We work so that consumers in Kosovo and Albania are heard and companies answer them.',
    oneLoc: 'Prishtina, Kosovo',
  },
};

const cache = {};
async function data(loc) {
  const c = cache[loc];
  if (c && Date.now() - c.at < 60000) return c.d;
  const [[st]] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM complaints WHERE status = 'resolved') AS resolved,
    (SELECT COUNT(*) FROM companies WHERE status = 'active') AS companies,
    (SELECT COUNT(*) FROM users WHERE role = 'member' AND status = 'active') AS members`);
  const [cats] = await pool.query(`SELECT slug, name_${loc} AS name FROM categories ORDER BY sort`);
  const [latest] = await pool.query(
    `SELECT x.id, x.title, DATE_FORMAT(x.published_at, '%d.%m.%Y') AS pub, c.slug, c.name AS cname, u.display_name AS author
       FROM complaints x JOIN companies c ON c.id = x.company_id JOIN users u ON u.id = x.user_id
      WHERE x.status IN ('published','resolved') AND c.status = 'active' ORDER BY x.published_at DESC, x.id DESC LIMIT 10`);
  const [top] = await pool.query(
    `SELECT c.slug, c.name, COUNT(x.id) AS n FROM companies c JOIN complaints x ON x.company_id = c.id AND x.status IN ('published','resolved')
      WHERE c.status = 'active' GROUP BY c.id ORDER BY n DESC, c.name LIMIT 3`);
  const d = { st, cats, latest, top };
  cache[loc] = { at: Date.now(), d };
  return d;
}

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHECK = '<span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>';
const num = (n, loc) => Number(n).toLocaleString(loc === 'sq' ? 'de-DE' : 'en-US'); // 12345 -> 12.345 / 12,345
const initials = (name) => String(name).trim().split(/\s+/).map((w) => [...w][0] || '').join('').slice(0, 2).toUpperCase();
const soonBox = (t, text, dark = false, cls = '') => `<div class="empty-st${dark ? ' dark' : ''}${cls ? ` ${cls}` : ''}"><b>${esc(t.soonH)}</b><p>${esc(text)}</p></div>`;

function mount(loc) {
  const t = H[loc], p = PATHS[loc], o = PATHS[loc === 'sq' ? 'en' : 'sq'];
  router.get(p.home, async (req, res, next) => {
    try {
      const [{ st, cats, latest, top }] = await Promise.all([data(loc), footer.refresh()]);
      const cta = config.showAuth ? `<p class="cta2"><a class="btn" href="${p.write}">${esc(t.write)}</a></p>` : `<p class="soon">${esc(t.soon)}</p>`;
      const cUrl = (x) => `${p.company}/${esc(x.slug)}/${x.id}-${slugify(x.title)}`;

      const latestCards = latest.map((x, i) => `<article class="lc">
<div class="lhead"><span class="av av${i % 6}" aria-hidden="true">${esc(initials(publicName(x.author)))}</span><div><b class="nm">${esc(publicName(x.author))}</b><p class="views"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>${esc(x.pub)}</p></div></div>
<h3><a href="${cUrl(x)}">${esc(x.title)}</a></h3>
<p class="co"><svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5"/></svg><a href="${p.company}/${esc(x.slug)}">${esc(x.cname)}</a></p>
</article>`).join('');

      const stats = [
        ['users', 66, 83, t.stMembers, st.members],
        ['companies', 70, 81, t.stCompanies, st.companies],
        ['documented', 68, 84, t.stDocs, null],
        ['resolved', 73, 82, t.stResolved, st.resolved],
        ['visitors', 103, 82, t.stVisitors, null],
      ].map(([ic, w, h, label, v]) => `<li><img class="st-ic" src="/assets/img/stat-${ic}.svg" width="${w}" height="${h}" alt=""><span>${esc(label)}</span>${v === null ? `<b class="na" title="${esc(t.stSoon)}">—</b>` : `<b>${num(v, loc)}</b>`}</li>`).join('');

      const body = `<div class="home">${SPRITE}
<section class="hero">
<div class="mosaic" aria-hidden="true">
<div class="t ph1"><img src="/assets/img/tile-woman.webp" width="1300" height="1300" alt="" fetchpriority="high"></div>
<div class="t ph2"><div class="disc"><img src="/assets/img/tile-man.webp" width="546" height="638" alt=""></div></div>
<div class="t ph3"><img src="/assets/img/tile-phone.webp" width="689" height="532" alt=""></div>
<div class="t a1"></div><div class="t bub"><i></i><i></i><i></i></div><div class="t hd"></div>
<div class="t star"><img src="/assets/img/one-logo.png" width="300" height="113" alt=""></div>
<div class="t g1"></div><div class="t q1"></div><div class="t g2"></div><div class="t q2"></div>
<div class="t hr"></div><div class="t pbar"></div><div class="t q3"></div><div class="t q4"></div><div class="t lk1"></div>
</div>
<div class="w"><div class="txt">
<p class="eyebrow"><i></i>${esc(t.eyebrow)}</p>
<h1>${t.h1}</h1><p class="lead">${esc(t.lead)}</p>
<form class="search" method="get" action="${p.search}" role="search"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-search"/></svg>
<input type="search" name="q" placeholder="${esc(t.ph)}" aria-label="${esc(t.ph)}" maxlength="80" required><button type="submit">${esc(t.go)}</button></form>
${top.length ? `<p class="pop"><span>${esc(t.popL)}</span>${top.map((c) => `<a href="${p.company}/${esc(c.slug)}">${esc(c.name)}</a>`).join('')}</p>` : ''}
${cta}
</div></div></section>

<section class="scards" aria-labelledby="trend-h">
<div class="w"><h2 id="trend-h">${esc(t.trendH)}</h2>${soonBox(t, t.trendSoon)}</div>
</section>

<section class="latest2" aria-labelledby="latest-h">
<div class="purple-bg" aria-hidden="true"></div>
<div class="green-qc" aria-hidden="true"></div>
${latest.length ? `<div class="lnav">
<button type="button" class="lbtn lprev" aria-label="${esc(t.prev)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
<button type="button" class="lbtn lnext" aria-label="${esc(t.next)}"><svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle class="rbg" cx="24" cy="24" r="22"/><circle class="rfg" cx="24" cy="24" r="22"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
</div>` : ''}
<div class="w"><h2 id="latest-h">${esc(t.latestH)}</h2>
${latest.length ? `<div class="ltrack-wrap" role="region" aria-roledescription="carousel" aria-label="${esc(t.latestH)}"><div class="ltrack">${latestCards}</div></div>`
    : `<div class="latest-empty empty-st"><p>${esc(t.empty)}</p></div>`}
</div></section>

<section class="best" aria-labelledby="best-h">
<div class="w">
<h2 id="best-h">${esc(t.bestH)}</h2>
${cats.length ? `<div class="best-ctl"><div class="dd" data-dd>
<button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="dd-panel"><span class="dd-lbl">${esc(t.cat)}</span><span class="dd-val">${esc(cats[0].name)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
<div class="dd-panel" id="dd-panel" hidden>
<div class="dd-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="text" placeholder="${esc(t.catSearch)}" aria-label="${esc(t.catSearch)}" role="combobox" aria-expanded="true" aria-controls="dd-list" aria-autocomplete="list" autocomplete="off"></div>
<ul class="dd-list" id="dd-list" role="listbox" aria-label="${esc(t.cats)}">${cats.map((k) => `<li role="option" data-v="${esc(k.slug)}">${esc(k.name)}</li>`).join('')}</ul>
<p class="dd-empty" hidden>${esc(t.catNone)}</p>
</div></div><span class="best-per">${esc(t.period)}</span></div>` : ''}
<p class="best-note">${esc(t.bestNote)}</p>
${soonBox(t, t.bestSoon, true, 'lb-empty')}
</div></section>

<section class="corp" aria-labelledby="corp-h"><div class="w"><div class="corp-box">
<p class="corp-eyebrow">${esc(t.corpEy)}</p><h2 id="corp-h">${esc(t.corpH)}</h2><p class="corp-txt">${esc(t.corpP)}</p>
<a class="corp-btn" href="${t.corpHref}">${esc(t.corpBtn)}${ARROW}</a>
</div></div></section>

<section class="awards" aria-labelledby="awards-h"><div class="w awards-in">
<div class="awards-txt"><p class="awards-eyebrow">${esc(t.awEy)}</p><h2 id="awards-h">${esc(t.awH)}</h2><p>${esc(t.awP)}</p>
<ul class="awards-list">${t.awItems.map(([b, s]) => `<li>${CHECK}<div><b>${esc(b)}</b><small>${esc(s)}</small></div></li>`).join('')}</ul>
<p class="awards-note">${esc(t.awNote)}</p></div>
<img class="awards-img" src="/assets/img/awards-celebrating.webp" width="960" height="538" alt="${esc(t.awAlt)}" loading="lazy" decoding="async">
</div></section>

<section class="stats" aria-labelledby="stats-h"><div class="w"><h2 id="stats-h">${esc(t.statsH)}</h2><ul class="stats-grid">${stats}</ul></div></section>

<section class="top20" aria-labelledby="top20-h"><div class="w">
<h2 id="top20-h">Top <span>20</span></h2><p class="top20-sub">${esc(t.topSub)}</p>
<div class="top20-box">${soonBox(t, t.topSoon)}</div>
<div class="top20-more"><a class="t20-more" href="${p.top}">${esc(t.topMore)}${ARROW}</a></div>
</div></section>

<section class="onec" aria-labelledby="onec-h"><div class="w"><div class="onec-box">
<div class="onec-logo"><img src="/assets/img/one-logo.png" width="300" height="113" alt="One Community" loading="lazy"></div>
<div class="onec-txt"><p class="onec-eyebrow">${esc(t.oneEy)}</p><h2 id="onec-h">${esc(t.oneH)}</h2><p>${esc(t.oneP)}</p>
<div class="onec-ctl"><span class="onec-loc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>${esc(t.oneLoc)}</span>
<a class="onec-link" href="https://joinonecommunity.com" target="_blank" rel="noopener">joinonecommunity.com</a></div></div>
</div></div></section></div>`;
      page(req, res, loc, { title: t.title, body, otherPath: o.home, robots: 'index,follow', canonical: `${config.siteOrigin}${p.home}`, description: t.desc,
        head: '\n<link rel="stylesheet" href="/assets/css/home.css?v=1">\n<script src="/assets/js/home.js?v=1" defer></script>',
        alternates: [{ lang: 'sq', href: `${config.siteOrigin}/` }, { lang: 'en', href: `${config.siteOrigin}/en/` }, { lang: 'x-default', href: `${config.siteOrigin}/` }] });
    } catch (e) { next(e); }
  });
}
mount('sq');
mount('en');
module.exports = router;
