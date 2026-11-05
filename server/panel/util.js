'use strict';
const { esc } = require('../lib/html');
const { createHash } = require('crypto');

const str = (v) => (typeof v === 'string' ? v : '');
const normEmail = (v) => str(v).normalize('NFKC').trim().toLowerCase().slice(0, 254);
const oneLine = (v, max = 200) => str(v).normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const multiLine = (v, max = 5000) => str(v).normalize('NFKC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060\ufeff]/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
const likeEsc = (q) => q.replace(/[!%_]/g, '!$&');
const id = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 1e12 ? n : 0; };
const pageNo = (q) => Math.min(Math.max(parseInt(q, 10) || 1, 1), 1000);

function selectEl(name, label, options, value, { required = true, placeholder = '' } = {}) {
  const opts = (placeholder ? `<option value="">${esc(placeholder)}</option>` : '') +
    options.map((o) => `<option value="${esc(o.value)}"${String(o.value) === String(value) ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
  return `<div class="field"><label for="${name}">${esc(label)}</label><select id="${name}" name="${name}"${required ? ' required' : ''}>${opts}</select></div>`;
}
const inputEl = (name, label, value = '', { type = 'text', required = true, max = 200 } = {}) =>
  `<div class="field"><label for="${name}">${esc(label)}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" maxlength="${max}"${required ? ' required' : ''}></div>`;

async function modlog(pool, actorId, type, targetId, action, note) {
  await pool.query('INSERT INTO moderation_log (actor_id, target_type, target_id, action, note) VALUES (?,?,?,?,?)', [actorId, type, targetId, action, note ? String(note).slice(0, 500) : null]);
}

module.exports = { str, normEmail, oneLine, multiLine, likeEsc, id, pageNo, selectEl, inputEl, modlog, sha: (s) => createHash('sha256').update(s).digest('hex') };
