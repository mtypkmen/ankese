'use strict';
const express = require('express');
const config = require('../config');
const pool = require('../db');
const PATHS = require('../lib/paths');
const SPRITE = require('../lib/sprite');
const { esc } = require('../lib/html');
const { page, slugify, publicName } = require('../lib/page');

const router = express.Router();
const ICON = { 'telefoni-internet': 'phone', 'banka-hua': 'bank', sigurime: 'shield', 'blerje-online': 'cart', 'energji-uje': 'bolt', 'transport-poste': 'truck',
  shendetesi: 'heart', 'restorante-ushqim': 'food', 'pasuri-paluajtshme': 'home', arsim: 'book' };

const H = {
  sq: {
    title: 'Ankesa për kompanitë në Shqipëri dhe Kosovë',
    desc: 'Ankese.com: vend ku konsumatorët shkruajnë ankesat ndaj kompanive në Shqipëri dhe Kosovë dhe kompanitë përgjigjen publikisht.',
    h1: 'Të ka bërë keq një kompani?<br><span>Shkruaje këtu.</span>',
    lead: 'Ankese.com është faqja ku konsumatorët në Shqipëri dhe Kosovë publikojnë ankesat ndaj kompanive dhe kompanitë përgjigjen hapur. Çdo ankesë ka një adresë të qartë dhe një përgjigje.',
    ph: 'Kërko kompani ose markë…', go: 'Kërko', write: 'Shkruaj ankesë', soon: 'Platforma po hapet. Regjistrimi do të jetë i disponueshëm së shpejti.',
    nums: { complaints: 'ankesa të publikuara', companies: 'kompani', resolved: 'të zgjidhura' },
    catsH: 'Sektorët', catsP: 'Gjej ankesat sipas fushës së kompanisë.', companies: 'kompani',
    latestH: 'Ankesat e fundit', all: 'Të gjitha sektorët →', on: 'më',
    howH: 'Si funksionon', howP: 'Katër hapa nga problemi te zgjidhja.',
    steps: [['Shkruaj', 'Zgjidh kompaninë dhe përshkruaj çfarë ndodhi, me datë dhe detaje.'], ['Moderimi', 'Ankesa kontrollohet para se të publikohet.'], ['Përgjigjja', 'Kompania njoftohet dhe përgjigjet publikisht në të njëjtën faqe.'], ['Zgjidhja', 'Ti e shënon si të zgjidhur ose vazhdon bisedën me kompaninë.']],
    c1h: 'Për konsumatorët', c1p: 'Publiko ankesën tënde falas, ndiq përgjigjen e kompanisë dhe lexo përvojat e të tjerëve para se të blesh ose nënshkruash.',
    c2h: 'Për kompanitë', c2p: 'Përgjigju klientëve para të gjithëve, zgjidh problemet dhe tregoji publikut se si i trajton ankesat. Na shkruaj te info@ankese.com.',
    rulesH: 'Rregullat e publikimit', rulesP: 'Vetëm fakte, pa të dhëna personale, me të drejtë përgjigjeje për kompaninë.', rulesLink: 'Lexo rregullat →',
  },
  en: {
    title: 'Consumer complaints about companies in Albania and Kosovo',
    desc: 'Ankese.com is where consumers in Albania and Kosovo publish complaints about companies and companies reply in public.',
    h1: 'Let down by a company?<br><span>Say it here.</span>',
    lead: 'Ankese.com is where consumers in Albania and Kosovo publish complaints about companies and companies reply in the open. Every complaint gets a clear address and an answer.',
    ph: 'Search a company or brand…', go: 'Search', write: 'Write a complaint', soon: 'The platform is opening. Sign-up will be available soon.',
    nums: { complaints: 'published complaints', companies: 'companies', resolved: 'resolved' },
    catsH: 'Categories', catsP: "Find complaints by the company's industry.", companies: 'companies',
    latestH: 'Latest complaints', all: 'All categories →', on: 'on',
    howH: 'How it works', howP: 'Four steps from problem to solution.',
    steps: [['Write', 'Pick the company and describe what happened, with dates and details.'], ['Moderation', 'The complaint is reviewed before it is published.'], ['Reply', 'The company is notified and answers publicly on the same page.'], ['Resolution', 'You mark it as resolved or keep talking to the company.']],
    c1h: 'For consumers', c1p: 'Publish your complaint for free, follow the company\'s reply and read other people\'s experiences before you buy or sign.',
    c2h: 'For companies', c2p: 'Be the first to answer customers, fix problems and show the public how you handle complaints. Write to us at info@ankese.com.',
    rulesH: 'Publishing rules', rulesP: 'Facts only, no personal data, and a right of reply for the company.', rulesLink: 'Read the rules →',
  },
};

const cache = {};
async function data(loc) {
  const c = cache[loc];
  if (c && Date.now() - c.at < 60000) return c.d;
  const [[st]] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM complaints WHERE status IN ('published','resolved')) AS complaints,
    (SELECT COUNT(*) FROM complaints WHERE status = 'resolved') AS resolved,
    (SELECT COUNT(*) FROM companies WHERE status = 'active') AS companies`);
  const [cats] = await pool.query(
    `SELECT k.slug, k.name_${loc} AS name, COUNT(c.id) AS n FROM categories k LEFT JOIN companies c ON c.category_id = k.id AND c.status = 'active' GROUP BY k.id ORDER BY k.sort`);
  const [latest] = await pool.query(
    `SELECT x.id, x.title, x.body, DATE_FORMAT(x.published_at, '%d.%m.%Y') AS pub, c.slug, c.name AS cname, u.display_name AS author
       FROM complaints x JOIN companies c ON c.id = x.company_id JOIN users u ON u.id = x.user_id
      WHERE x.status IN ('published','resolved') AND c.status = 'active' ORDER BY x.published_at DESC, x.id DESC LIMIT 6`);
  const d = { st, cats, latest };
  cache[loc] = { at: Date.now(), d };
  return d;
}

const excerpt = (s, n = 150) => { const a = [...s.replace(/\s+/g, ' ')]; return a.length > n ? a.slice(0, n).join('') + '…' : a.join(''); };

function mount(loc) {
  const t = H[loc], p = PATHS[loc], o = PATHS[loc === 'sq' ? 'en' : 'sq'];
  router.get(p.home, async (req, res, next) => {
    try {
      const { st, cats, latest } = await data(loc);
      const nums = [[st.complaints, t.nums.complaints], [st.companies, t.nums.companies], [st.resolved, t.nums.resolved]].filter(([n]) => n > 0);
      const cta = config.mailLive ? `<p class="cta2"><a class="btn" href="${p.write}">${esc(t.write)}</a></p>` : `<p class="soon">${esc(t.soon)}</p>`;
      const body = `<div class="home">${SPRITE}
<section class="hero"><div class="w">
<h1>${t.h1}</h1><p class="lead">${esc(t.lead)}</p>
<form class="search" method="get" action="${p.search}" role="search"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-search"/></svg>
<input type="search" name="q" placeholder="${esc(t.ph)}" aria-label="${esc(t.ph)}" maxlength="80" required><button type="submit">${esc(t.go)}</button></form>
${cta}
${nums.length ? `<div class="nums">${nums.map(([n, l]) => `<div><b>${n}</b>${esc(l)}</div>`).join('')}</div>` : ''}
</div></section>

<section class="blk"><div class="w"><h2>${esc(t.catsH)}</h2><p class="sub">${esc(t.catsP)}</p>
<ul class="cats link">${cats.map((k) => `<li><a href="${p.category}/${esc(k.slug)}"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${ICON[k.slug] || 'shield'}"/></svg></span>${esc(k.name)}${k.n ? `<small>${k.n} ${esc(t.companies)}</small>` : ''}</a></li>`).join('')}</ul></div></section>

${latest.length ? `<section class="blk alt"><div class="w"><h2>${esc(t.latestH)}</h2><div class="latest">${latest.map((x) => `<article class="cmp"><h3><a href="${p.company}/${esc(x.slug)}/${x.id}-${slugify(x.title)}">${esc(x.title)}</a></h3><p class="meta"><a href="${p.company}/${esc(x.slug)}">${esc(x.cname)}</a> · ${esc(publicName(x.author))} · ${esc(x.pub)}</p><p>${esc(excerpt(x.body))}</p></article>`).join('')}</div></div></section>` : ''}

<section class="blk${latest.length ? '' : ' alt'}"><div class="w"><h2>${esc(t.howH)}</h2><p class="sub">${esc(t.howP)}</p>
<ol class="steps">${t.steps.map(([h, x], i) => `<li><b>${i + 1}</b><h3>${esc(h)}</h3><p>${esc(x)}</p></li>`).join('')}</ol></div></section>

<section class="blk${latest.length ? ' alt' : ''}"><div class="w two">
<div class="panel"><h3>${esc(t.c1h)}</h3><p>${esc(t.c1p)}</p></div>
<div class="panel dark"><h3>${esc(t.c2h)}</h3><p>${esc(t.c2p)}</p></div></div></section>

<section class="blk${latest.length ? '' : ' alt'}"><div class="w"><h2>${esc(t.rulesH)}</h2><p class="sub">${esc(t.rulesP)}</p><p class="more"><a href="${p.rules}">${esc(t.rulesLink)}</a></p></div></section></div>`;
      page(req, res, loc, { title: t.title, body, otherPath: o.home, robots: 'index,follow', canonical: `${config.siteOrigin}${p.home}`, description: t.desc,
        alternates: [{ lang: 'sq', href: `${config.siteOrigin}/` }, { lang: 'en', href: `${config.siteOrigin}/en/` }, { lang: 'x-default', href: `${config.siteOrigin}/` }] });
    } catch (e) { next(e); }
  });
}
mount('sq');
mount('en');
module.exports = router;
