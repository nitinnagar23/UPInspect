// ============================================================
// upi.js: Pure UPI logic (parsing, validation, URI/link building)
// UPInspect
//
// No DOM access: everything here is unit-tested in tests/upi.test.js.
// ============================================================

import { BASE_PAY_URL, MIN_AMOUNT, MAX_AMOUNT } from './config.js';

// Strict UPI ID format: localpart@provider (provider must be letters only)
export const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;

// UPI apps only accept ASCII merchant names. Allows: A-Z a-z 0-9 space & . , - ' /
const NAME_CHARS   = /^[A-Za-z0-9 &.,\-'/]*$/;
const HAS_ALNUM    = /[A-Za-z0-9]/;
const AMOUNT_SHAPE = /^\d{1,9}(\.\d{1,2})?$/;

// Control, zero-width and bidi-override characters: used to spoof names/IDs.
const SPOOF_CHARS = /[\u0000-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;
const NON_ASCII   = /[^\u0000-\u007F]/;

// Optional UPI parameters that are carried over from a scanned QR into the
// Pay Now link (so merchant references/signatures are not lost).
// pa / pn / am / cu are handled explicitly.
const PASSTHROUGH_KEYS = ['mc', 'tid', 'tr', 'tn', 'mam', 'url', 'mode', 'purpose', 'orgid', 'sign'];
const MAX_PARAM_LEN    = 1000;
const MAX_NAME_LEN     = 100;

const enc = encodeURIComponent;

// ─── Validation ────────────────────────────────────────────

export const isValidUpiId = pa => UPI_REGEX.test(pa);

/** Merchant name for QR/link creation: ASCII subset, and not only punctuation ("." / ".." would collapse URL paths). */
export const isValidName = pn => NAME_CHARS.test(pn) && HAS_ALNUM.test(pn);

/**
 * Classify a raw amount string.
 *  - 'none'    : empty
 *  - 'ok'      : plain decimal, ≤ 2 decimals, MIN_AMOUNT ≤ n ≤ MAX_AMOUNT; `value` is canonical ("10.5", "500")
 *  - 'invalid' : anything else (3+ decimals, exponent, out of range, text …)
 * @returns {{ status: 'none'|'ok'|'invalid', value: string, raw: string }}
 */
export function classifyAmount(raw) {
  const s = raw === null || raw === undefined ? '' : String(raw).trim();
  if (s === '') return { status: 'none', value: '', raw: '' };
  if (AMOUNT_SHAPE.test(s)) {
    const n = Number(s);
    if (n >= MIN_AMOUNT && n <= MAX_AMOUNT) return { status: 'ok', value: String(n), raw: s };
  }
  return { status: 'invalid', value: '', raw: s.slice(0, 40) };
}

/** Canonical amount string, or '' when not usable. */
export const normalizeAmount = raw => classifyAmount(raw).value;

/** "₹ 500.00": always derived from the canonical value, so display === payload. */
export const formatAmount = value => (value ? `₹ ${Number(value).toFixed(2)}` : '');

/** Warnings about the payee identity (shown to the user, never silently dropped). */
function identityWarnings(pa, pn) {
  const out = [];
  if (NON_ASCII.test(pa) || SPOOF_CHARS.test(pa) || SPOOF_CHARS.test(pn)) {
    out.push({ key: 'warnSpoofChars' });
  } else if (!UPI_REGEX.test(pa)) {
    out.push({ key: 'warnPaFormat' });
  }
  return out;
}

function makeData({ pa, pn, amount, extras = [], warnings = [] }) {
  const all = [...identityWarnings(pa, pn), ...warnings];
  if (amount.status === 'invalid') all.push({ key: 'warnAmountIgnored', vars: { amount: amount.raw } });
  return { pa, pn, am: amount.value, extras, warnings: all };
}

// ─── Scanned text → data ───────────────────────────────────

/**
 * Parse text decoded from a QR code. Accepts upi://pay URIs and bare UPI IDs.
 * @returns {{ ok: true, data: object } | { ok: false, reason: 'invalid'|'parse' }}
 */
export function parseUpiText(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'invalid' };

  if (/^upi:\/\/pay(\?|$)/i.test(trimmed)) {
    let url;
    try { url = new URL(trimmed); } catch { return { ok: false, reason: 'parse' }; }

    const params = url.searchParams;
    const pa = (params.get('pa') || '').trim();
    if (!pa) return { ok: false, reason: 'invalid' };
    const pn = (params.get('pn') || '').trim().slice(0, MAX_NAME_LEN);

    const warnings = [];
    // Parameter pollution: another app could honour the *last* duplicate.
    if (['pa', 'pn', 'am'].some(k => params.getAll(k).length > 1)) warnings.push({ key: 'warnDuplicate' });

    const extras = [];
    const seen = new Set();
    for (const [rawKey, value] of params.entries()) {
      const k = rawKey.toLowerCase();
      if (!PASSTHROUGH_KEYS.includes(k) || seen.has(k)) continue;
      if (!value || value.length > MAX_PARAM_LEN) continue;
      if (k === 'url' && !/^https?:\/\//i.test(value)) continue;
      seen.add(k);
      extras.push([k, value]);
    }

    return { ok: true, data: makeData({ pa, pn, amount: classifyAmount(params.get('am')), extras, warnings }) };
  }

  if (UPI_REGEX.test(trimmed)) {
    return { ok: true, data: makeData({ pa: trimmed, pn: '', amount: classifyAmount('') }) };
  }

  return { ok: false, reason: 'invalid' };
}

// ─── Data → URI / link ─────────────────────────────────────

/** Build the upi://pay deep link / QR payload. Every value is percent-encoded. */
export function buildUpiUri({ pa, pn = '', am = '', extras = [] }) {
  const q = [`pa=${enc(pa)}`];
  if (pn) q.push(`pn=${enc(pn)}`);
  const amount = normalizeAmount(am);
  if (amount) q.push(`am=${amount}`);
  q.push('cu=INR');
  for (const [k, v] of extras) {
    if (PASSTHROUGH_KEYS.includes(k)) q.push(`${enc(k)}=${enc(v)}`);
  }
  return `upi://pay?${q.join('&')}`;
}

/**
 * Build a shareable payment link:
 *   /pa            /pa/name            /pa/500            /pa/name/500
 * A purely numeric name is emitted as /pa/786/- so it cannot be mistaken for an amount.
 */
export function buildPayLink({ pa, pn = '', am = '' }, base = BASE_PAY_URL) {
  const amount = normalizeAmount(am);
  let path = `/${enc(pa).replace('%40', '@')}`;
  if (pn && amount)      path += `/${enc(pn)}/${amount}`;
  else if (pn)           path += AMOUNT_SHAPE.test(pn) ? `/${enc(pn)}/-` : `/${enc(pn)}`;
  else if (amount)       path += `/${amount}`;
  return base + path;
}

// ─── Pay-link path → data ──────────────────────────────────

/**
 * Parse location.pathname of a payment link.
 *   /pa  /pa/name  /pa/500 (2nd segment is an amount only if it is amount-shaped)  /pa/name/500  /pa/name/-
 * @returns {{ status: 'none' } | { status: 'invalid' } | { status: 'ok', data: object }}
 */
export function parsePayPath(pathname) {
  const raw = String(pathname || '').split('/').filter(Boolean);
  if (raw.length === 0) return { status: 'none' };
  if (raw.length > 3)   return { status: 'invalid' };

  let segs;
  try { segs = raw.map(decodeURIComponent); } catch { return { status: 'invalid' }; }

  const [pa, s1 = '', s2 = ''] = segs;
  if (!UPI_REGEX.test(pa)) return { status: 'invalid' };

  let pn = '';
  let amountRaw = '';
  if (raw.length === 2) {
    if (AMOUNT_SHAPE.test(s1)) amountRaw = s1; else pn = s1;
  } else if (raw.length === 3) {
    pn = s1;
    amountRaw = s2 === '-' ? '' : s2;
  }

  return {
    status: 'ok',
    data: makeData({ pa, pn: pn.slice(0, MAX_NAME_LEN), amount: classifyAmount(amountRaw) }),
  };
}
