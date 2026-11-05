'use strict';
// Testlerde kullanilan kucuk baslangic sozlugu (migrations/0005_moderation.sql'in alt kumesi)
const BLOCKLIST = [
  { term: 'kurv', kind: 'profanity', severity: 2, mode: 'stem' }, { term: 'pidh', kind: 'profanity', severity: 2, mode: 'stem' },
  { term: 'byth', kind: 'profanity', severity: 2, mode: 'stem' }, { term: 'fuck', kind: 'profanity', severity: 2, mode: 'stem' },
  { term: 'dick', kind: 'profanity', severity: 2, mode: 'exact' }, { term: 'mut', kind: 'profanity', severity: 2, mode: 'exact' },
  { term: 'te vras', kind: 'threat', severity: 3, mode: 'exact' }, { term: 'do te vras', kind: 'threat', severity: 3, mode: 'exact' },
  { term: 'kill you', kind: 'threat', severity: 3, mode: 'exact' },
  { term: 'hajdut', kind: 'accusation', severity: 1, mode: 'stem' }, { term: 'mashtr', kind: 'accusation', severity: 1, mode: 'stem' },
];
module.exports = { BLOCKLIST };
