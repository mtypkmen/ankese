'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../server/lib/i18n');
const L = require('../server/lib/legal_text');
const PATHS = require('../server/lib/paths');

test('Albanian and English UI strings have the same keys', () => {
  const sq = Object.keys(S.sq).sort(), en = Object.keys(S.en).sort();
  assert.deepEqual(sq.filter((k) => !en.includes(k)), [], 'missing in en');
  assert.deepEqual(en.filter((k) => !sq.includes(k)), [], 'missing in sq');
});

test('legal pages exist in both languages with the same structure', () => {
  for (const page of ['terms', 'privacy', 'rules', 'cookies']) {
    assert.equal(L.sq[page].sections.length, L.en[page].sections.length, page);
  }
});

test('route paths exist in both languages', () => {
  assert.deepEqual(Object.keys(PATHS.sq).sort(), Object.keys(PATHS.en).sort());
});
