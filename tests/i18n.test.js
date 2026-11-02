import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../js/locales/en.js';
import hi from '../js/locales/hi.js';

const placeholders = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

test('every locale has exactly the keys of en.js', () => {
  const base = Object.keys(en).sort();
  assert.deepEqual(Object.keys(hi).sort(), base);
});

test('{placeholders} match between locales', () => {
  for (const key of Object.keys(en)) {
    assert.equal(placeholders(hi[key]), placeholders(en[key]), `placeholders differ for "${key}"`);
  }
});

test('no empty strings', () => {
  for (const [name, loc] of Object.entries({ en, hi })) {
    for (const [k, v] of Object.entries(loc)) assert.ok(String(v).length > 0, `${name}.${k} is empty`);
  }
});
