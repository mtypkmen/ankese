'use strict';
const express = require('express');
const config = require('../config');
const pool = require('../db');
const PATHS = require('../lib/paths');
const L = require('../lib/legal_text');
const { esc, field, textarea, select } = require('../lib/html');
const { page } = require('../lib/page');
const rl = require('../lib/ratelimit');
const mailer = require('../lib/mailer');
const sess = require('../session');

const router = express.Router();
const str = (v) => (typeof v === 'string' ? v : '');
const one = (v, max) => str(v).normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const multi = (v, max) => str(v).normalize('NFKC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
const csrfInput = (req) => `<input type="hidden" name="_csrf" value="${esc(req.csrfToken)}">`;

const C = {
  sq: {
    title: 'Kontakt', intro: 'Për pyetje, kërkesa për heqje ose korrigjim të një ankese, përgjigje nga kompania ose kërkesa për të dhënat e tua, na shkruaj këtu ose në',
    type: 'Lloji i kërkesës', types: { removal: 'Kërkesë për heqje/korrigjim të një ankese', reply: 'Jam përfaqësues i një kompanie', data: 'Kërkesë për të dhënat e mia personale', other: 'Tjetër' },
    name: 'Emri', email: 'Email', url: 'Lidhja e ankesës (opsionale)', message: 'Mesazhi', hint: 'Të paktën 20 karaktere. Mos dërgo fjalëkalime.',
    send: 'Dërgo', ok: 'Faleminderit. E morëm kërkesën dhe do të të përgjigjemi sa më shpejt, zakonisht brenda 5 ditëve pune.',
    eName: 'Shkruaj emrin.', eEmail: 'Shkruaj një email të vlefshëm.', eMsg: 'Mesazhi duhet të ketë 20–3000 karaktere.', eUrl: 'Lidhja nuk është e vlefshme.',
    eRate: 'Shumë përpjekje. Provo më vonë.', eCsrf: 'Seanca e formularit skadoi. Rifresko faqen.', eType: 'Zgjidh llojin e kërkesës.',
  },
  en: {
    title: 'Contact', intro: 'For questions, takedown or correction requests about a complaint, company replies, or requests about your personal data, write to us here or at',
    type: 'Request type', types: { removal: 'Takedown/correction request about a complaint', reply: 'I represent a company', data: 'Request about my personal data', other: 'Other' },
    name: 'Name', email: 'Email', url: 'Complaint link (optional)', message: 'Message', hint: 'At least 20 characters. Do not send passwords.',
    send: 'Send', ok: 'Thank you. We received your request and will reply as soon as possible, usually within 5 business days.',
    eName: 'Enter your name.', eEmail: 'Enter a valid email address.', eMsg: 'Message must be 20–3000 characters.', eUrl: 'The link is not valid.',
    eRate: 'Too many attempts. Try again later.', eCsrf: 'Your form session expired. Refresh the page.', eType: 'Choose a request type.',
  },
};

const msg = (c, t) => `<p class="msg ${c}" role="status">${esc(t)}</p>`;
const prose = (d, loc) => {
  const sec = d.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((x) => (typeof x === 'string' ? `<p>${esc(x)}</p>` : `<ul>${x.ul.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>`)).join('')}`).join('');
  return `<div class="pub prose"><h1>${esc(d.title)}</h1><p class="meta">${esc(L.UPDATED[loc])}</p>${d.intro ? `<p class="lead2">${esc(d.intro)}</p>` : ''}${sec}</div>`;
};

function mount(loc) {
  const p = PATHS[loc], o = PATHS[loc === 'sq' ? 'en' : 'sq'], c = C[loc];
  for (const key of ['terms', 'privacy', 'rules', 'cookies']) {
    router.get(p[key], (req, res) => {
      const d = L[loc][key];
      page(req, res, loc, { title: d.title, body: prose(d, loc), otherPath: o[key], robots: 'index,follow', canonical: `${config.siteOrigin}${p[key]}`,
        description: d.intro || d.sections[0].p[0].slice(0, 150),
        alternates: [{ lang: 'sq', href: `${config.siteOrigin}${PATHS.sq[key]}` }, { lang: 'en', href: `${config.siteOrigin}${PATHS.en[key]}` }] });
    });
  }

  const form = (req, v = {}, m = '') => `<div class="pub"><h1>${esc(c.title)}</h1><p>${esc(c.intro)} <a href="mailto:info@ankese.com">info@ankese.com</a>.</p>${m}
<form method="post" action="${p.contact}" class="form" novalidate>${csrfInput(req)}
<div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
${select('type', c.type, Object.entries(c.types).map(([k, l]) => ({ value: k, label: l })), { value: v.type, placeholder: '—' })}
${field('name', c.name, { value: v.name, maxlength: 100, autocomplete: 'name' })}
${field('email', c.email, { type: 'email', value: v.email, autocomplete: 'email' })}
${field('url', c.url, { value: v.url, required: false, maxlength: 300 })}
${textarea('message', c.message, { value: v.message, hint: c.hint, rows: 7, maxlength: 3000 })}
<button class="btn block" type="submit">${esc(c.send)}</button></form></div>`;

  router.get(p.contact, (req, res) => {
    page(req, res, loc, { title: c.title, body: form(req), otherPath: o.contact, robots: 'index,follow', canonical: `${config.siteOrigin}${p.contact}`,
      alternates: [{ lang: 'sq', href: `${config.siteOrigin}${PATHS.sq.contact}` }, { lang: 'en', href: `${config.siteOrigin}${PATHS.en.contact}` }] });
  });

  router.post(p.contact, async (req, res, next) => {
    try {
      const b = req.body || {};
      const v = { type: str(b.type), name: str(b.name), email: str(b.email), url: str(b.url), message: str(b.message) };
      const fail = (key, status = 400) => page(req, res, loc, { status, title: c.title, body: form(req, v, msg('err', c[key])), otherPath: o.contact });
      if (sess.checkPost(req)) return fail('eCsrf', 403);
      if (!rl.hit(`contact:${sess.clientIp(req)}`, 8, 3600000).ok) return fail('eRate', 429);
      if (str(b.website) !== '') return page(req, res, loc, { title: c.title, body: `<div class="pub"><h1>${esc(c.title)}</h1>${msg('ok', c.ok)}</div>`, otherPath: o.contact });
      const type = Object.keys(c.types).includes(v.type) ? v.type : null;
      const name = one(b.name, 100), email = one(b.email, 254).toLowerCase(), message = multi(b.message, 3000);
      let url = one(b.url, 300) || null;
      if (!type) return fail('eType');
      if (name.length < 2) return fail('eName');
      if (!/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\],;:"\\]+\.[a-z]{2,}$/i.test(email)) return fail('eEmail');
      if ([...message].length < 20) return fail('eMsg');
      if (url) { try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return fail('eUrl'); } catch { return fail('eUrl'); } }
      await pool.query('INSERT INTO legal_requests (type, name, email, url, message, ip_hmac) VALUES (?,?,?,?,?,?)', [type, name, email, url, message, sess.ipHmac(req)]);
      mailer.send({ to: 'info@ankese.com', subject: `[Ankese] ${type}: ${name}`, text: `Tip: ${type}\nEmri: ${name}\nEmail: ${email}\nURL: ${url || '-'}\n\n${message}` }).catch(() => {});
      page(req, res, loc, { title: c.title, body: `<div class="pub"><h1>${esc(c.title)}</h1>${msg('ok', c.ok)}</div>`, otherPath: o.contact });
    } catch (e) { next(e); }
  });
}
mount('sq');
mount('en');
module.exports = router;
