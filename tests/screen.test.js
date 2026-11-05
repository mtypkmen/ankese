'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const screen = require('../server/lib/screen');
const { BLOCKLIST } = require('./helpers');

screen.setBlocklistForTests(BLOCKLIST);
const run = (body, title = 'Titull i zakonshem per testim') => screen.screenText({ title, body });
const types = (flags) => flags.map((f) => f.t);

test('clean complaint scores 0', async () => {
  const f = await run('Kompania nuk ma ktheu paret per sherbimin e pa kryer edhe pse kam telefonuar tre here.');
  assert.equal(screen.score(f), 0);
});

test('obfuscated profanity is caught', async () => {
  const f = await run('jane k u r v e dhe k.u.r.v.e dhe kurrrrve dhe KURVË dhe f u c k them');
  assert.equal(f.filter((x) => x.t === 'profanity').length, 5);
});

test('diacritics and leetspeak are normalized', async () => {
  const f = await run('Kurvë, pidhi dhe bythë; ppun0nj3si k u r v e');
  assert.ok(f.filter((x) => x.t === 'profanity').length >= 4);
});

test('threat phrases are detected', async () => {
  const f = await run('Nese nuk me kthejne paret do te vras drejtorin. I will kill you.');
  assert.ok(types(f).includes('threat'));
  assert.ok(screen.score(f) >= 40);
});

test('personal data: Albanian and Kosovar phones, email, IBAN, ID', async () => {
  const f = await run('Telefon +355 69 123 4567 dhe 0691234567; Kosove +383 44 123 456; arben@example.com; AL47 2121 1009 0000 0002 3569 8741; ID J05101999A');
  const t = types(f);
  assert.equal(t.filter((x) => x === 'pii_phone').length, 3);
  assert.ok(t.includes('pii_email') && t.includes('pii_iban') && t.includes('pii_id'));
});

test('named person + crime accusation raises defamation risk', async () => {
  const f = await run('Zoti Arben Hoxha eshte nje hajdut dhe mashtrues, vodhi paret e mia.');
  assert.ok(types(f).includes('person_named'));
  assert.ok(types(f).includes('defamation_risk'));
});

test('everyday "fraud" words alone stay low risk', async () => {
  const f = await run('Kompania me mashtroi me faturen. Ky eshte mashtrim, kerkoj sqarim.');
  assert.ok(screen.score(f) < 15);
});

test('no false positives on common words', async () => {
  const f = await run('Kam blere nje karrige, nje kartele dhe nje kartë telefoni. Pasqyra, mutlak, shqiponja, skuter, bukuri.');
  assert.equal(f.filter((x) => x.t === 'profanity').length, 0);
});

test('mask replaces flagged spans with ***', async () => {
  const body = 'Me thirrni ne +355 69 123 4567 ose arben@example.com tani.';
  const flags = await run(body);
  const masked = screen.mask(body, flags, 'body', ['pii_phone', 'pii_email']);
  assert.equal(masked, 'Me thirrni ne *** ose *** tani.');
});

test('score levels', () => {
  assert.equal(screen.level(0), 'green');
  assert.equal(screen.level(20), 'yellow');
  assert.equal(screen.level(60), 'red');
});

test('hashBody ignores case and whitespace', () => {
  assert.equal(screen.hashBody('Tekst  Test'), screen.hashBody('tekst test'));
});
