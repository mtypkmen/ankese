'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const totp = require('../server/lib/totp');

test('matches the RFC 6238 test vector (SHA-1, T=59)', () => {
  assert.equal(totp.codeAt('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1), '287082');
});

test('secret encryption round-trips', () => {
  const s = totp.newSecret();
  assert.equal(totp.decrypt(totp.encrypt(s)), s);
  assert.notEqual(totp.encrypt(s), totp.encrypt(s));
});

test('verify accepts the current code once and rejects replay', () => {
  const s = totp.newSecret(), step = totp.stepNow();
  const got = totp.verify(s, totp.codeAt(s, step), 0);
  assert.equal(got, step);
  assert.equal(totp.verify(s, totp.codeAt(s, step), step), null);
});

test('verify rejects wrong and malformed codes', () => {
  const s = totp.newSecret();
  const far = totp.codeAt(s, totp.stepNow() + 100); // pencerenin cok disinda
  assert.equal(totp.verify(s, far, 0), null);
  assert.equal(totp.verify(s, 'abcdef', 0), null);
  assert.equal(totp.verify(s, '12345', 0), null);
});
