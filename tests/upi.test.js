import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UPI_REGEX, isValidUpiId, isValidName, classifyAmount, normalizeAmount, formatAmount,
  parseUpiText, buildUpiUri, buildPayLink, parsePayPath,
} from '../js/upi.js';

// ── Amounts ────────────────────────────────────────────────

test('normalizeAmount: canonical, ≤2 decimals, in range', () => {
  assert.equal(normalizeAmount('500'), '500');
  assert.equal(normalizeAmount('10.50'), '10.5');
  assert.equal(normalizeAmount('007'), '7');
  assert.equal(normalizeAmount(' 99.99 '), '99.99');
});

test('normalizeAmount: rejects what cannot be shown exactly (display === payload)', () => {
  for (const bad of ['10.999', '10.005', '1e21', '1e3', '0x1F', 'Infinity', '-5', '0.5', '0', '1000001', 'abc', '1,000', '.5']) {
    assert.equal(normalizeAmount(bad), '', `"${bad}" must be rejected`);
    assert.equal(classifyAmount(bad).status, 'invalid');
  }
  assert.equal(classifyAmount('').status, 'none');
  assert.equal(classifyAmount(null).status, 'none');
});

test('formatAmount is derived from the canonical value', () => {
  assert.equal(formatAmount('500'), '₹ 500.00');
  assert.equal(formatAmount('10.5'), '₹ 10.50');
  assert.equal(formatAmount(''), '');
});

// ── Validation ─────────────────────────────────────────────

test('UPI ids and names', () => {
  assert.ok(isValidUpiId('rahul.k-1@okhdfcbank'));
  assert.ok(!isValidUpiId('rahul@'));
  assert.ok(!isValidUpiId('favicon.ico'));
  assert.ok(isValidName("Rahul & Sons, Ltd. O'Neil/2"));
  assert.ok(!isValidName('रमेश'));
  assert.ok(!isValidName('..'), 'dot-only names would collapse URL path segments');
  assert.ok(!isValidName('...'));
  assert.ok(UPI_REGEX.test('a@bc'));
});

// ── Scanned QR text ────────────────────────────────────────

test('parseUpiText: full URI', () => {
  const r = parseUpiText('upi://pay?pa=shop@okaxis&pn=Rahul%20Traders&am=250.50&cu=INR&tr=T123&tn=Order%2042&mc=5411');
  assert.ok(r.ok);
  assert.equal(r.data.pa, 'shop@okaxis');
  assert.equal(r.data.pn, 'Rahul Traders');
  assert.equal(r.data.am, '250.5');
  assert.deepEqual(r.data.extras, [['tr', 'T123'], ['tn', 'Order 42'], ['mc', '5411']]);
  assert.deepEqual(r.data.warnings, []);
});

test('parseUpiText: missing pn is "" (never the literal "N/A", and not sent in the link)', () => {
  const r = parseUpiText('upi://pay?pa=shop@okaxis');
  assert.equal(r.data.pn, '');
  assert.ok(!buildUpiUri(r.data).includes('pn='));
  assert.ok(!buildUpiUri(r.data).includes('N%2FA'));

  const vpa = parseUpiText('shop@okaxis');
  assert.ok(vpa.ok);
  assert.equal(vpa.data.pn, '');
});

test('parseUpiText: invalid input', () => {
  assert.deepEqual(parseUpiText(''), { ok: false, reason: 'invalid' });
  assert.deepEqual(parseUpiText('https://evil.example/pay'), { ok: false, reason: 'invalid' });
  assert.deepEqual(parseUpiText('upi://pay?pn=NoPa'), { ok: false, reason: 'invalid' });
  assert.deepEqual(parseUpiText(null), { ok: false, reason: 'invalid' });
});

test('parseUpiText: unusable amounts are reported, not silently dropped', () => {
  for (const am of ['10.999', '0.5', '1e5', 'abc']) {
    const r = parseUpiText(`upi://pay?pa=shop@okaxis&am=${am}`);
    assert.equal(r.data.am, '');
    const w = r.data.warnings.find(x => x.key === 'warnAmountIgnored');
    assert.ok(w, `amount ${am} should produce a warning`);
    assert.equal(w.vars.amount, am);
  }
});

test('parseUpiText: warnings for odd identities', () => {
  assert.ok(parseUpiText('upi://pay?pa=sh%20op@okaxis').data.warnings.some(w => w.key === 'warnPaFormat'));
  // right-to-left override in the name
  assert.ok(parseUpiText('upi://pay?pa=shop@okaxis&pn=Pay%E2%80%AEeman').data.warnings.some(w => w.key === 'warnSpoofChars'));
  // Cyrillic "а" in the id
  assert.ok(parseUpiText('upi://pay?pa=sh%D0%BEp@okaxis').data.warnings.some(w => w.key === 'warnSpoofChars'));
  // duplicated pa: another app may read the last one
  assert.ok(parseUpiText('upi://pay?pa=a@okaxis&pa=b@okaxis').data.warnings.some(w => w.key === 'warnDuplicate'));
});

test('parseUpiText: only allowlisted extras are carried, url must be http(s)', () => {
  const r = parseUpiText('upi://pay?pa=shop@okaxis&evil=1&url=javascript:alert(1)&tr=T1&sign=abc');
  assert.deepEqual(r.data.extras, [['tr', 'T1'], ['sign', 'abc']]);
});

// ── Building ───────────────────────────────────────────────

test('buildUpiUri keeps merchant params and encodes every value', () => {
  const uri = buildUpiUri({ pa: 'shop@okaxis', pn: 'A & B/C', am: '10.5', extras: [['tr', 'T 1&x=2']] });
  assert.equal(uri, 'upi://pay?pa=shop%40okaxis&pn=A%20%26%20B%2FC&am=10.5&cu=INR&tr=T%201%26x%3D2');
});

test('buildUpiUri: round-trips through parseUpiText', () => {
  const data = { pa: 'shop@okaxis', pn: 'Rahul', am: '99', extras: [['tr', 'T9']] };
  const back = parseUpiText(buildUpiUri(data)).data;
  assert.equal(back.pa, data.pa);
  assert.equal(back.pn, data.pn);
  assert.equal(back.am, data.am);
  assert.deepEqual(back.extras, data.extras);
});

test('buildUpiUri ignores invalid amounts and unknown extras', () => {
  const uri = buildUpiUri({ pa: 'a@b', am: '10.999', extras: [['evil', 'x']] });
  assert.equal(uri, 'upi://pay?pa=a%40b&cu=INR');
});

// ── Pay links ──────────────────────────────────────────────

const BASE = 'https://upinspect.pages.dev';

test('buildPayLink forms', () => {
  assert.equal(buildPayLink({ pa: 'a@upi' }, BASE), `${BASE}/a@upi`);
  assert.equal(buildPayLink({ pa: 'a@upi', pn: 'Rahul Traders' }, BASE), `${BASE}/a@upi/Rahul%20Traders`);
  assert.equal(buildPayLink({ pa: 'a@upi', am: '500' }, BASE), `${BASE}/a@upi/500`);
  assert.equal(buildPayLink({ pa: 'a@upi', pn: 'Rahul', am: '10.50' }, BASE), `${BASE}/a@upi/Rahul/10.5`);
});

test('buildPayLink: a numeric merchant name cannot be mistaken for an amount', () => {
  const link = buildPayLink({ pa: 'a@upi', pn: '786' }, BASE);
  assert.equal(link, `${BASE}/a@upi/786/-`);
  const parsed = parsePayPath(new URL(link).pathname);
  assert.equal(parsed.data.pn, '786');
  assert.equal(parsed.data.am, '');
});

test('parsePayPath: round trip for every link form', () => {
  const cases = [
    { pa: 'a@upi', pn: '', am: '' },
    { pa: 'a@upi', pn: 'Rahul Traders', am: '' },
    { pa: 'a@upi', pn: '', am: '500' },
    { pa: 'a@upi', pn: 'A & B/C', am: '99.99' },
    { pa: 'a@upi', pn: '1e3', am: '' },
    { pa: 'a@upi', pn: 'Infinity', am: '' },
    { pa: 'a@upi', pn: '0x1F', am: '20' },
  ];
  for (const c of cases) {
    const r = parsePayPath(new URL(buildPayLink(c, BASE)).pathname);
    assert.equal(r.status, 'ok', JSON.stringify(c));
    assert.equal(r.data.pa, c.pa);
    assert.equal(r.data.pn, c.pn, JSON.stringify(c));
    assert.equal(r.data.am, c.am, JSON.stringify(c));
  }
});

test('parsePayPath: "1e3", "Infinity", "0x1F" in the name slot are names, not amounts', () => {
  for (const name of ['1e3', 'Infinity', '0x1F']) {
    const r = parsePayPath(`/a@upi/${name}`);
    assert.equal(r.data.pn, name);
    assert.equal(r.data.am, '');
  }
  assert.equal(parsePayPath('/a@upi/500').data.am, '500');
});

test('parsePayPath: malformed percent-encoding does not throw', () => {
  assert.deepEqual(parsePayPath('/100%'), { status: 'invalid' });
  assert.deepEqual(parsePayPath('/rahul@upi/50%'), { status: 'invalid' });
  assert.deepEqual(parsePayPath('/a@upi/%E0%A4%A'), { status: 'invalid' });
});

test('parsePayPath: arbitrary paths are not payment requests', () => {
  for (const p of ['/about', '/robots.txt', '/favicon.ico', '/sw.js', '/a@upi/b/c/d']) {
    assert.deepEqual(parsePayPath(p), { status: 'invalid' }, p);
  }
  assert.deepEqual(parsePayPath('/'), { status: 'none' });
  assert.deepEqual(parsePayPath(''), { status: 'none' });
});

test('parsePayPath: bad amount segment is reported', () => {
  const r = parsePayPath('/a@upi/Shop/10.999');
  assert.equal(r.data.am, '');
  assert.ok(r.data.warnings.some(w => w.key === 'warnAmountIgnored'));
});
