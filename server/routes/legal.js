'use strict';
const FAQ = require('../lib/faq_text');
const express = require('express');
const config = require('../config');
const PATHS = require('../lib/paths');
const L = require('../lib/legal_text');
const { esc } = require('../lib/html');
const { page } = require('../lib/page');

const router = express.Router();

const C = {
  sq: { title: 'Kontakt', intro: 'Zgjidh grupin tënd dhe na kontakto drejtpërdrejt.',
    members: { h: 'Për anëtarët', p: 'Pyetje, kërkesë për heqje ose korrigjim të një ankese, apo kërkesë për të dhënat e tua? Na shkruaj me email.', cta: 'Dërgo email', guest: 'Regjistrohu për të na shkruar' },
    help: "Si mund t'ju ndihmojmë?", ph: 'Kërko në pyetjet e shpeshta…', none: 'Nuk u gjet asnjë pyetje.',
    business: { h: 'Për kompanitë', p: 'Përgjigje ose korrigjim për një ankesë, anëtarësim apo bashkëpunim? Na shkruaj në WhatsApp.', cta: 'Shkruaj në WhatsApp' } },
  en: { title: 'Contact', intro: 'Pick your group and reach us directly.',
    members: { h: 'For members', p: 'Questions, takedown or correction requests about a complaint, or requests about your personal data? Email us.', cta: 'Send an email', guest: 'Sign up to write to us' },
    help: 'How can we help you?', ph: 'Search the FAQ…', none: 'No questions found.',
    business: { h: 'For businesses', p: 'A reply or correction on a complaint, membership or partnership? Message us on WhatsApp.', cta: 'Message on WhatsApp' } },
};
const MAIL = 'info@ankese.com', WA = '+34 643 113 844', WA_URL = 'https://wa.me/34643113844';

const TOC = { sq: 'Në këtë faqe', en: 'On this page' };
const shell = (loc, { title, intro, meta, toc = [], inner, band = '', extra = '', cls = '' }) => `<div class="lp ${cls}"><header class="lhero"><div class="w"><nav class="crumbs" aria-label="breadcrumb"><a href="${PATHS[loc].home}">Ankese.com</a> / <span>${esc(title)}</span></nav><h1>${esc(title)}</h1>${intro ? `<p class="lintro">${intro}</p>` : ''}${meta ? `<p class="lmeta">${esc(meta)}</p>` : ''}${extra}</div></header>${band ? `<div class="lband"><div class="w">${band}</div></div>` : ''}
<div class="w lbody${toc.length ? ' hastoc' : ''}">${toc.length ? `<aside class="ltoc"><b>${TOC[loc]}</b>${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</aside>` : ''}<div class="lmain">${inner}</div></div></div>`;
const prose = (d, loc) => {
  const sec = d.sections.map((s, i) => `<section class="lcard" id="s${i + 1}"><h2>${esc(s.h)}</h2>${s.p.map((x) => (typeof x === 'string' ? `<p>${esc(x)}</p>` : `<ul>${x.ul.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>`)).join('')}</section>`).join('');
  return shell(loc, { title: d.title, intro: d.intro ? esc(d.intro) : '', meta: L.UPDATED[loc], toc: d.sections.map((s, i) => ['s' + (i + 1), s.h]), inner: sec });
};

function mount(loc) {
  const p = PATHS[loc], o = PATHS[loc === 'sq' ? 'en' : 'sq'], c = C[loc];
  for (const key of ['terms', 'privacy', 'rules', 'cookies', 'about', 'privacyMembers', 'privacyVisitors', 'reviewGuide', 'transparency']) {
    router.get(p[key], (req, res) => {
      const d = L[loc][key];
      page(req, res, loc, { title: d.title, body: prose(d, loc), otherPath: o[key], robots: 'index,follow', canonical: `${config.siteOrigin}${p[key]}`,
        description: d.intro || d.sections[0].p[0].slice(0, 150),
        alternates: [{ lang: 'sq', href: `${config.siteOrigin}${PATHS.sq[key]}` }, { lang: 'en', href: `${config.siteOrigin}${PATHS.en[key]}` }] });
    });
  }

  router.get(p.faq, (req, res) => {
    const d = FAQ[loc];
    const body = shell(loc, { title: d.title, intro: esc(d.intro), cls: 'faq', toc: d.groups.map((g, i) => ['g' + (i + 1), g.h]), inner: d.groups.map((g, i) => `<section class="lcard" id="g${i + 1}"><h2>${esc(g.h)}</h2>${g.q.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`).join('') + `<p class="more"><a href="${p.contact}">${esc(c.title)} →</a></p>` });
    page(req, res, loc, { title: d.title, body, otherPath: o.faq, robots: 'index,follow', canonical: `${config.siteOrigin}${p.faq}`, description: d.intro,
      alternates: [{ lang: 'sq', href: `${config.siteOrigin}${PATHS.sq.faq}` }, { lang: 'en', href: `${config.siteOrigin}${PATHS.en.faq}` }] });
  });

  router.get(p.contact, (req, res) => {
    const card = (g, id, href, label, icon) => `<section class="lcard cbox" id="${id}"><h2>${esc(g.h)}</h2><p>${esc(g.p)}</p><a class="btn" href="${href}"${id === 'business' ? ' target="_blank" rel="noopener"' : ''}>${esc(g.cta)}</a><p class="cval">${esc(label)}</p></section>`;
    const d = FAQ[loc];
    const faq = d.groups.map((g, i) => `<section class="lcard" id="g${i + 1}"><h2>${esc(g.h)}</h2>${g.q.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`).join('') + `<p class="lcard" id="faqnone" hidden>${esc(c.none)}</p>`;
    const body = shell(loc, { title: c.title, intro: esc(c.intro), cls: 'contact faq', toc: d.groups.map((g, i) => ['g' + (i + 1), g.h]), extra: `<div class="lsearch"><h2>${esc(c.help)}</h2><input id="faqq" type="search" placeholder="${esc(c.ph)}" autocomplete="off" aria-label="${esc(c.ph)}"></div>`, band: `<div class="cgrid">${(req.user ? card(c.members, 'members', 'mailto:' + MAIL, MAIL) : card(c.members, 'members', p.register, c.members.guest))}${card(c.business, 'business', WA_URL, WA)}</div>`, inner: faq });
    page(req, res, loc, { title: c.title, body, head: '<script src="/assets/js/faq-search.js" defer></script>', otherPath: o.contact, robots: 'index,follow', canonical: `${config.siteOrigin}${p.contact}`,
      alternates: [{ lang: 'sq', href: `${config.siteOrigin}${PATHS.sq.contact}` }, { lang: 'en', href: `${config.siteOrigin}${PATHS.en.contact}` }] });
  });
}
mount('sq');
mount('en');
module.exports = router;
