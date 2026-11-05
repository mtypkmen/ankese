'use strict';
const PATHS = require('./paths');
const { layout } = require('./html');

// Ortak sayfa yaniti. otherPath: dil degistirici hedefi
function page(req, res, loc, { status = 200, title, body, otherPath, robots, canonical, description, alternates }) {
  const other = loc === 'sq' ? 'en' : 'sq';
  res.status(status).set('Cache-Control', 'private, no-cache').type('html').send(
    layout({ loc, title, body, user: req.user, csrf: req.csrfToken, otherPath: otherPath || PATHS[other].home, robots, canonical, description, alternates }));
}

const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';

// Herkese gorunen ad: "Ardit H."
function publicName(full) {
  const parts = String(full).trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || '';
  return `${parts[0]} ${[...parts[parts.length - 1]][0].toUpperCase()}.`;
}

module.exports = { page, slugify, publicName };
