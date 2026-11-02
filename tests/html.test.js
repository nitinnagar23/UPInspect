// Static checks on index.html / js / headers: catches drift that would only
// show up in a browser (dead buttons, wrong CSP hash, stale preload list …).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = p => readFileSync(join(root, p), 'utf8');
const html = read('index.html');
const jsFiles = readdirSync(join(root, 'js')).filter(f => f.endsWith('.js'));

test('no inline event handlers or style attributes (strict CSP friendly)', () => {
  assert.deepEqual(html.match(/\son[a-z]+="/g) ?? [], []);
  assert.deepEqual(html.match(/\sstyle="/g) ?? [], []);
});

test('viewport allows zoom', () => {
  assert.ok(!/user-scalable\s*=\s*no|maximum-scale/i.test(html));
});

test('no third-party <script> in the page except Google Analytics and the app', () => {
  const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(srcs.sort(), ['/js/main.js', 'https://www.googletagmanager.com/gtag/js?id=G-N5DDSRMXEK']);
});

test('every data-action has a handler in main.js', () => {
  const main = read('js/main.js');
  const used = new Set([...html.matchAll(/data-action="(\w+)"/g)].map(m => m[1]));
  for (const action of used) assert.match(main, new RegExp(`\\b${action}\\b`), `missing handler: ${action}`);
});

test('every element id used from JS exists in index.html', () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const dynamic = new Set(['reader']); // created by html5-qrcode inside #reader
  for (const f of jsFiles) {
    const src = read(`js/${f}`);
    for (const m of src.matchAll(/(?:\$|getElementById)\(\s*'([^']+)'\s*\)/g)) {
      assert.ok(ids.has(m[1]) || dynamic.has(m[1]), `${f}: no element with id "${m[1]}"`);
    }
  }
});

test('data-i18n* keys exist in en.js', async () => {
  const { default: en } = await import('../js/locales/en.js');
  for (const m of html.matchAll(/data-i18n(?:-placeholder|-label)?="(\w+)"/g)) {
    assert.ok(m[1] in en, `unknown i18n key "${m[1]}"`);
  }
});

test('modulepreload list matches the static import graph of main.js', () => {
  const seen = new Set();
  const walk = file => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = read(`js/${file}`);
    for (const m of src.matchAll(/^\s*(?:import|export)[^'"]*?from\s+'\.\/([\w/.]+)'/gm)) walk(m[1]);
    // `import ... from` spanning multiple lines
    for (const m of src.matchAll(/from\s+'\.\/([\w/.]+)'/g)) walk(m[1]);
  };
  walk('main.js');
  const preloaded = new Set([...html.matchAll(/rel="modulepreload" href="\/js\/([^"]+)"/g)].map(m => m[1]));
  assert.deepEqual([...preloaded].sort(), [...seen].sort());
});

test('service worker precache covers every css/js file', () => {
  const sw = read('sw.js');
  const files = [
    ...readdirSync(join(root, 'css')).map(f => `/css/${f}`),
    ...jsFiles.map(f => `/js/${f}`),
    ...readdirSync(join(root, 'js/locales')).map(f => `/js/locales/${f}`),
  ];
  for (const f of files) assert.ok(sw.includes(`'${f}'`), `sw.js PRECACHE is missing ${f}`);
});

test('CSP allows the inline Google Analytics snippet by hash', () => {
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const hash = createHash('sha256').update(inline, 'utf8').digest('base64');
  assert.ok(read('_headers').includes(`'sha256-${hash}'`),
    `_headers CSP must contain 'sha256-${hash}' (the inline script changed)`);
});

test('CSP connect-src covers every third-party host the service worker fetches', () => {
  // A worker's fetch() is checked against connect-src. If a host handled by
  // sw.js is missing there, its requests fail and the camera scanner shows
  // "Could not load a required component" even though the network is fine.
  const sw = read('sw.js');
  const hosts = [...sw.matchAll(/(?:IMMUTABLE|REVALIDATE)_HOSTS\s*=\s*new Set\(\[([^\]]*)\]\)/g)]
    .flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(h => h[1]));
  assert.ok(hosts.length >= 3, 'no third-party hosts found in sw.js');
  const csp = read('_headers').match(/Content-Security-Policy: (.*)/)[1];
  const connectSrc = csp.match(/connect-src ([^;]*)/)[1].split(/\s+/);
  for (const host of hosts) assert.ok(connectSrc.includes(`https://${host}`), `connect-src is missing https://${host} (needed by sw.js)`);
});

test('CSP forbids inline/eval scripts and framing', () => {
  const csp = read('_headers').match(/Content-Security-Policy: (.*)/)[1];
  const scriptSrc = csp.match(/script-src ([^;]*)/)[1];
  assert.ok(!scriptSrc.includes("'unsafe-inline'") && !scriptSrc.includes("'unsafe-eval'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
});

test('third-party libraries are pinned to exact versions', () => {
  const libs = read('js/libs.js');
  for (const m of libs.matchAll(/cdn:\s*'([^']+)'/g)) {
    assert.match(m[1], /@\d+\.\d+\.\d+\//, `${m[1]} is not pinned`);
  }
});

// ── Icon ────────────────────────────────────────────────────

/** The glyph = everything after the background <rect> inside an icon <svg>, whitespace/comments stripped. */
const glyphOf = svgMarkup => {
  const afterRect = svgMarkup.split(/<rect width="36" height="36" rx="10" fill="url\(#\w+\)"\/>/)[1];
  assert.ok(afterRect, 'icon background <rect> not found');
  return afterRect.replace(/<!--[\s\S]*?-->/g, '').replace(/<\/svg>[\s\S]*$/, '').replace(/\s+/g, ' ').trim();
};

test('brand icon, standee icon and favicon.svg draw the same glyph', () => {
  const favicon = glyphOf(read('assets/favicon/favicon.svg'));
  assert.ok(favicon.length > 200);
  const inline = [...html.matchAll(/<svg class="(brand-icon|standee-brand-icon)"[\s\S]*?<\/svg>/g)];
  assert.equal(inline.length, 2, 'expected the header and standee inline icons');
  for (const m of inline) assert.equal(glyphOf(m[0]), favicon, `${m[1]} differs from favicon.svg`);
});

test('every icon referenced by index.html and the manifest exists', () => {
  const refs = [...html.matchAll(/(?:href|content)="(?:https:\/\/upinspect\.pages\.dev)?(\/assets\/favicon\/[^"]+)"/g)].map(m => m[1]);
  const manifest = JSON.parse(read('assets/favicon/site.webmanifest'));
  refs.push(...manifest.icons.map(i => i.src));
  assert.ok(refs.length >= 8);
  for (const ref of new Set(refs)) assert.ok(readFileSync(join(root, ref.slice(1))).length > 0, `${ref} is missing`);
});

test('manifest has separate "any" and "maskable" icons', () => {
  const { icons } = JSON.parse(read('assets/favicon/site.webmanifest'));
  assert.ok(icons.every(i => i.purpose === 'any' || i.purpose === 'maskable'), 'no combined "any maskable"');
  for (const purpose of ['any', 'maskable']) assert.ok(icons.some(i => i.purpose === purpose && i.sizes === '512x512'));
});

test('social preview is a 1280x640 PNG under 1 MB and is what og:image / twitter:image point at', () => {
  const buf = readFileSync(join(root, 'assets/social-preview.png'));
  assert.equal(buf.subarray(1, 4).toString('latin1'), 'PNG');
  assert.equal(buf.readUInt32BE(16), 1280, 'width');
  assert.equal(buf.readUInt32BE(20), 640, 'height');
  assert.ok(buf.length < 1024 * 1024, 'GitHub requires a social preview under 1 MB');
  assert.match(html, /property="og:image"\s+content="https:\/\/upinspect\.pages\.dev\/assets\/social-preview\.png"/);
  assert.match(html, /name="twitter:image"\s+content="https:\/\/upinspect\.pages\.dev\/assets\/social-preview\.png"/);
  assert.match(html, /name="twitter:card"\s+content="summary_large_image"/);
});

test('every i18n element id in the new guide and tip exists in en.js and index.html', async () => {
  const { default: en } = await import('../js/locales/en.js');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const keys = Object.keys(en).filter(k => /^(txtGuide|txtPayHelp|txtFaq[789])/.test(k));
  assert.ok(keys.length >= 30);
  for (const k of keys) assert.ok(ids.has(k), `index.html has no element with id "${k}"`);
});

test('camera container and video keep their layout even when html5-qrcode sets inline styles', () => {
  // The library sets `position: relative` inline on #reader; if the stylesheet does not
  // use !important, #reader collapses to 0px tall and the camera view is blank.
  const css = read('css/views.css');
  const rule = sel => css.match(new RegExp(`${sel.replace(/[#.]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';
  for (const sel of ['#reader', '#reader video']) {
    const body = rule(sel);
    assert.match(body, /position:\s*absolute\s*!important/, `${sel} needs position: absolute !important`);
    assert.match(body, /width:\s*100%\s*!important/, `${sel} needs width: 100% !important`);
    assert.match(body, /height:\s*100%\s*!important/, `${sel} needs height: 100% !important`);
  }
});

test('footer copyright year is filled in from the current date', () => {
  assert.match(html, /<footer[^>]*id="siteFooter"[\s\S]*©\s*<span id="footerYear">\d{4}<\/span>/);
  const main = read('js/main.js');
  assert.match(main, /getElementById|\$\('footerYear'\)/);
  assert.match(main, /new Date\(\)\.getFullYear\(\)/);
});

// ── Visual language ─────────────────────────────────────────

test('no emoji in the UI markup or locale strings (line icons only)', () => {
  const emoji = /\p{Extended_Pictographic}/u;
  const plain = text => text.replace(/[©®™]/g, '');   // typographic symbols, not emoji
  assert.ok(!emoji.test(plain(html.replace(/<!--[\s\S]*?-->/g, ''))), 'emoji found in index.html');
  for (const lang of ['en', 'hi']) {
    const src = read(`js/locales/${lang}.js`).split('\n').filter(l => !/shareCaption|^\s*\/\//.test(l)).join('\n');
    assert.ok(!emoji.test(plain(src)), `emoji found in ${lang}.js (the share caption is the only exception)`);
  }
});

test('stylesheets load in dependency order and fonts match the CSS tokens', () => {
  const order = [...html.matchAll(/<link rel="stylesheet" href="\/css\/(\w+)\.css">/g)].map(m => m[1]).filter(n => n !== 'fonts');
  assert.deepEqual(order, ['tokens', 'animations', 'layout', 'components', 'views']);
  const tokens = read('css/tokens.css');
  // Before `npm run vendor` the fonts come from Google Fonts; after it, from css/fonts.css.
  const selfHosted = html.includes('/css/fonts.css');
  const fontSource = selfHosted ? read('css/fonts.css') : html;
  for (const family of ['Bricolage Grotesque', 'Instrument Sans', 'JetBrains Mono']) {
    assert.ok(tokens.includes(`'${family}'`), `${family} missing from tokens.css`);
    assert.ok(fontSource.includes(selfHosted ? family : family.replace(/ /g, '+')), `${family} is not loaded (${selfHosted ? 'css/fonts.css' : 'Google Fonts link'})`);
  }
});

test('reduced motion is respected in CSS and JS', () => {
  assert.match(read('css/animations.css'), /prefers-reduced-motion:\s*reduce/);
  assert.match(read('js/ui.js'), /prefers-reduced-motion/);
});
