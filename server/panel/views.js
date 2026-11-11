'use strict';
const { esc } = require('../lib/html');

const TYPE_LABEL = {
  profanity: 'Küfür', insult: 'Hakaret', threat: 'Tehdit', hate: 'Nefret söylemi', accusation: 'Suç iddiası',
  pii_email: 'E-posta', pii_phone: 'Telefon', pii_iban: 'IBAN', pii_id: 'Kimlik/NIPT', link: 'Link', handle: 'Sosyal medya',
  plate: 'Plaka', address: 'Adres', person_named: 'Kişi adı', defamation_risk: 'İftira riski', caps: 'BÜYÜK HARF', repeat: 'Tekrar',
  spam_links: 'Çok link', new_account: 'Yeni hesap', prior_rejects: 'Önceki redler', duplicate_text: 'Aynı metin',
  burst: 'Toplu saldırı', shared_ip: 'Ortak IP',
};
const STATUS_LABEL = {
  awaiting_company: 'Şirket bekliyor', pending: 'İncelemede', published: 'Yayında', rejected: 'Reddedildi', removed: 'Kaldırıldı', resolved: 'Çözüldü',
};
const MESSAGES = {
  published: 'Şikayet yayınlandı.', rejected: 'Şikayet reddedildi.', removed: 'Şikayet kaldırıldı.', saved: 'Kaydedildi.',
  approved: 'Şirket onaylandı ve oluşturuldu.', merged: 'Şirkete birleştirildi.', created: 'Oluşturuldu.', deleted: 'Silindi.',
  closed: 'Talep kapatıldı.', blocked: 'Kullanıcı engellendi.', unblocked: 'Engel kaldırıldı.', role: 'Rol güncellendi.',
};

function nav(user, active) {
  const items = [['/', 'Pano', 'home'], ['/complaints', 'Şikayetler', 'complaints'], ['/suggestions', 'Şirket önerileri', 'suggestions'], ['/companies', 'Şirketler', 'companies'], ['/requests', 'Talepler', 'requests']];
  if (user.role === 'admin') items.push(['/blocklist', 'Sözlük', 'blocklist'], ['/users', 'Kullanıcılar', 'users'], ['/audit', 'Kayıtlar', 'audit']);
  return items.map(([h, l, k]) => `<a href="${h}"${k === active ? ' class="on"' : ''}>${esc(l)}</a>`).join('');
}

function layout({ user, csrf, title, body, active = '', flash = '' }) {
  const side = user
    ? `<div class="who">${esc(user.display_name)}<small>${esc(user.role)}</small></div><nav>${nav(user, active)}</nav>
<form method="post" action="/logout"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="lo" type="submit">Çıkış</button></form>`
    : '';
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)} – Ankese Panel</title>
<link rel="icon" href="/assets/favicon.ico?v=3" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=3">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=3">
<link rel="stylesheet" href="/assets/panel.css?v=1">
</head>
<body class="${user ? '' : 'nologin'}">
${user ? `<aside class="side"><a class="brand" href="/">Ankese <b>Panel</b></a>${side}</aside>` : ''}
<main class="main">${flash ? `<p class="flash">${esc(MESSAGES[flash] || '')}</p>` : ''}${body}</main>
</body>
</html>`;
}

// Metin icinde bayrakli kisimlari <mark> ile vurgula (konumlar orijinal metne gore)
function highlight(text, flags, field) {
  const spans = flags.filter((f) => f.f === field && f.e > f.s).sort((a, b) => a.s - b.s);
  let out = '', last = 0;
  const html = (chunk) => esc(chunk).replace(/\n/g, '<br>');
  for (const f of spans) {
    if (f.s < last) continue;
    out += html(text.slice(last, f.s)) + `<mark class="m${f.sev}" title="${esc(TYPE_LABEL[f.t] || f.t)}">${html(text.slice(f.s, f.e))}</mark>`;
    last = f.e;
  }
  return out + html(text.slice(last));
}

const levelOf = (s) => (s == null ? 'none' : s >= 40 ? 'red' : s >= 15 ? 'yellow' : 'green');
const riskBadge = (s) => `<span class="risk ${levelOf(s)}">${s == null ? '?' : s}</span>`;
const flagChips = (flags) => {
  const seen = new Map();
  for (const f of flags) { const k = f.t; const cur = seen.get(k); if (!cur || f.sev > cur.sev) seen.set(k, { sev: f.sev, n: (cur ? cur.n : 0) + 1 }); else cur.n++; }
  return [...seen].map(([t, v]) => `<span class="chip s${v.sev}">${esc(TYPE_LABEL[t] || t)}${v.n > 1 ? ' ×' + v.n : ''}</span>`).join('');
};
const parseFlags = (v) => { try { const a = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(a) ? a : []; } catch { return []; } };

module.exports = { layout, highlight, riskBadge, flagChips, parseFlags, TYPE_LABEL, STATUS_LABEL, MESSAGES, levelOf };
