'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const pw = require('../server/lib/password');

test('hash verifies only the right password', async () => {
  const h = await pw.hash('correct horse battery staple');
  assert.match(h, /^scrypt\$32768\$8\$1\$/);
  assert.equal(await pw.verify('correct horse battery staple', h), true);
  assert.equal(await pw.verify('wrong password', h), false);
});

test('same password hashes differently (random salt)', async () => {
  assert.notEqual(await pw.hash('same-password-1'), await pw.hash('same-password-1'));
});

test('malformed stored hash never verifies', async () => {
  assert.equal(await pw.verify('x', 'not-a-hash'), false);
  assert.equal(await pw.verify('x', 'scrypt$1$1$1$AAAA$AAAA'), false);
});

test('dummyVerify always returns false', async () => {
  assert.equal(await pw.dummyVerify('anything'), false);
});
