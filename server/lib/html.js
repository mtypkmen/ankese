'use strict';
const PATHS = require('./paths');
const S = require('./i18n');
const config = require('../config');

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

const FOOT = { sq: { terms: 'Kushtet', privacy: 'Privatësia', rules: 'Rregullat', cookies: 'Cookies', contact: 'Kontakt', source: 'Kodi burimor' }, en: { terms: 'Terms', privacy: 'Privacy', rules: 'Rules', cookies: 'Cookies', contact: 'Contact', source: 'Source code' } };

function layout({ loc, title, body, user, csrf, otherPath, robots = 'noindex,nofollow', canonical = '', description = '', alternates = [] }) {
  const t = S[loc], p = PATHS[loc];
  const userNav = user
    ? `<a class="navlink" href="${p.profile}">${esc(t.profile)}</a>` +
      `<form method="post" action="${p.logout}" class="inline"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="linkbtn" type="submit">${esc(t.logout)}</button></form>`
    : config.mailLive ? `<a class="navlink" href="${p.login}">${esc(t.login)}</a><a class="btn" href="${p.register}">${esc(t.register)}</a>` : '';
  const f = FOOT[loc];
  const footNav = ['terms', 'privacy', 'rules', 'cookies', 'contact'].map((k) => `<a href="${p[k]}">${esc(f[k])}</a>`).join('') +
    `<a href="https://github.com/mtypkmen/ankese" rel="noopener">${esc(f.source)}</a>`;
  const alt = alternates.map((a) => `\n<link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.href)}">`).join('');
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${robots}">
<title>${esc(title)} – Ankese.com</title>${description ? `\n<meta name="description" content="${esc(description)}">` : ''}${canonical ? `\n<link rel="canonical" href="${esc(canonical)}">` : ''}${alt}
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="stylesheet" href="/assets/css/site.css?v=9">
</head>
<body>
<header class="bar"><div class="w row">
<a class="logo" href="${p.home}"><i>A</i>Ankese<em>.com</em></a>
<div class="right"><span class="lang"><b>${loc.toUpperCase()}</b><a href="${esc(otherPath)}">${t.other}</a></span>${userNav}</div>
</div></header>
${body.startsWith('<div class="home">') ? `<main>${body}</main>` : `<main class="w ${body.startsWith('<div class="pub">') ? 'pubmain' : 'auth'}">${body}</main>`}
<footer class="foot"><div class="w row"><span>© ${new Date().getUTCFullYear()} Ankese.com · ${esc(t.footer)}</span><nav class="fnav">${footNav}<a href="mailto:info@ankese.com">info@ankese.com</a></nav></div></footer>
</body>
</html>`;
}

module.exports = { esc, field, textarea, select, layout };
