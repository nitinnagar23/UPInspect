// Guards the design tokens: every text/surface pair used in the UI must meet WCAG AA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8');

/** Custom properties declared in the first block whose selector matches `selector`. */
function tokens(selector) {
  const start = css.indexOf(selector + ' {');
  assert.ok(start >= 0, `${selector} block not found`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(m => [m[1], m[2]]));
}

const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const dark = tokens(':root');
const light = { ...dark, ...tokens('body.light') };

// [foreground token, background token, minimum ratio]
const PAIRS = [
  ['text',        'bg',        7],
  ['text',        'bg-raised', 7],
  ['text-muted',  'bg',        4.5],
  ['text-muted',  'bg-raised', 4.5],
  ['text-muted',  'bg-sunk',   4.5],
  ['text-faint',  'bg',        4.5],
  ['text-faint',  'bg-raised', 4.5],
  ['accent-text', 'bg',        4.5],
  ['accent-text', 'bg-raised', 4.5],
  ['warn-text',   'bg',        4.5],
  ['warn-text',   'bg-raised', 4.5],
  ['info-text',   'bg-raised', 4.5],
  ['on-accent',   'accent',    7],
];

for (const [name, theme] of [['dark', dark], ['light', light]]) {
  test(`${name} theme: text colours meet WCAG AA`, () => {
    for (const [fg, bg, min] of PAIRS) {
      const r = ratio(theme[fg], theme[bg]);
      assert.ok(r >= min, `${name}: --${fg} on --${bg} is ${r.toFixed(2)}:1 (needs ${min}:1)`);
    }
  });
}

test('danger is readable on both themes', () => {
  assert.ok(ratio(dark.danger, dark.bg) >= 4.5);
  assert.ok(ratio(light.danger, light['bg-raised']) >= 4.5);
});
