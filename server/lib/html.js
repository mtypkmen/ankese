'use strict';
const PATHS = require('./paths');
const S = require('./i18n');
const config = require('../config');
const footer = require('./footer');

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
const esc = (v) => String(v ?? '').replace(/[&<>"'`]/g, (c) => MAP[c]);

// Girdi alanlari: deger her zaman kacisli
function field(id, label, { type = 'text', value = '', autocomplete = '', hint = '', required = true, maxlength = 254 } = {}) {
  return `<div class="field"><label for="${id}">${esc(label)}</label>` +
    `<input id="${id}" name="${id}" type="${type}" value="${esc(value)}" maxlength="${maxlength}"` +
    `${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${required ? ' required' : ''}>` +
    `${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
}

function textarea(id, label, { value = '', hint = '', rows = 10, maxlength = 5000 } = {}) {
  return `<div class="field"><label for="${id}">${esc(label)}</label>` +
    `<textarea id="${id}" name="${id}" rows="${rows}" maxlength="${maxlength}" required>${esc(value)}</textarea>` +
    `${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
}

// options: [{value,label,group?}] ; group varsa optgroup
function select(id, label, options, { value = '', required = true, placeholder = '' } = {}) {
  let html = placeholder ? `<option value="">${esc(placeholder)}</option>` : '';
  const groups = new Map();
  for (const o of options) { const g = o.group || ''; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(o); }
  for (const [g, list] of groups) {
    const opts = list.map((o) => `<option value="${esc(o.value)}"${String(o.value) === String(value) ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
    html += g ? `<optgroup label="${esc(g)}">${opts}</optgroup>` : opts;
  }
  return `<div class="field"><label for="${id}">${esc(label)}</label><select id="${id}" name="${id}"${required ? ' required' : ''}>${html}</select></div>`;
}

const NAV = { sq: { complaints: 'Ankesat', top: 'Top 20', best: 'Më të mirët e muajit', write: 'Shkruaj ankesë' }, en: { complaints: 'Complaints', top: 'Top 20', best: 'Best of Month', write: 'Write a complaint' } };

// head: sayfaya ozel ek <link>/<script> etiketleri (ana sayfa home.css + home.js)
function layout({ loc, title, body, user, csrf, otherPath, robots = 'noindex,nofollow', canonical = '', description = '', alternates = [], head = '' }) {
  const t = S[loc], p = PATHS[loc];
  const userNav = user
    ? `<a class="navlink" href="${p.profile}">${esc(t.profile)}</a>` +
      `<form method="post" action="${p.logout}" class="inline"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="linkbtn" type="submit">${esc(t.logout)}</button></form>`
    : config.showAuth ? `<span class="acc"><a href="${p.login}">${esc(t.login)}</a><i aria-hidden="true">/</i><a href="${p.register}">${esc(t.register)}</a></span><a class="btn" href="${p.write}">${esc(NAV[loc].write)}</a>` : '';
  const nav = NAV[loc];
  const menu = `<nav class="menu" aria-label="Menu"><a href="${p.complaints}">${esc(nav.complaints)}</a><a href="${p.top}">${esc(nav.top)}</a><a href="${p.best}">${esc(nav.best)}</a></nav>`;
  const isHome = body.startsWith('<div class="home">');
  // AL / EN: aktif dil koyu, digeri gri baglanti
  const langItem = (code, label) => (code === loc ? `<b aria-current="true">${label}</b>` : `<a href="${esc(otherPath)}" hreflang="${code}" lang="${code}">${label}</a>`);
  const langSwitch = `<span class="lng">${langItem('sq', 'AL')}<i aria-hidden="true">/</i>${langItem('en', 'EN')}</span>`;
  const alt = alternates.map((a) => `\n<link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.href)}">`).join('');
  const d = description ? `\n<meta property="og:description" content="${esc(description)}">\n<meta name="twitter:description" content="${esc(description)}">` : '';
  const og = `\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Ankese.com">\n<meta property="og:locale" content="${loc === 'sq' ? 'sq_AL' : 'en_US'}">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:image" content="${config.siteOrigin}/assets/favicon-512.png">${canonical ? `\n<meta property="og:url" content="${esc(canonical)}">` : ''}${d}\n<meta name="twitter:card" content="summary">`;
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${robots}">
<title>${esc(title)} – Ankese.com</title>${description ? `\n<meta name="description" content="${esc(description)}">` : ''}${canonical ? `\n<link rel="canonical" href="${esc(canonical)}">` : ''}${alt}${og}
<link rel="icon" href="/assets/favicon.ico?v=3" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=3">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=3">
<link rel="stylesheet" href="/assets/css/site.css?v=23">
<script src="/assets/js/header.js?v=3" defer></script>${head}
</head>
<body>
<header class="bar${isHome ? ' bar-home' : ''}">${isHome ? '<span class="bar-tint" aria-hidden="true"></span>' : ''}<div class="w row">
<a class="logo" href="${p.home}"><img src="/assets/img/logo-ankese-128.png" width="139" height="128" alt=""><span>Ankese<em>.com</em></span></a>
${menu}
<div class="right">${userNav}${langSwitch}</div>
</div></header>
${isHome ? `<main>${body}</main>` : `<main class="w ${body.startsWith('<div class="pub">') ? 'pubmain' : 'auth'}">${body}</main>`}
${footer.render(loc, otherPath)}
</body>
</html>`;
}

module.exports = { esc, field, textarea, select, layout };
