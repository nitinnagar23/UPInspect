// ============================================================
// i18n.js: Language loader & DOM applier
// UPInspect
//
// English ships with the app; other locales are fetched on demand.
//
// ── Adding a new language ────────────────────────────────────
//   1. Create  js/locales/xx.js  (copy en.js, translate values)
//   2. Add a loader to LOADERS below
//   3. Add it to the CYCLE array to include it in toggle order
//   4. Run `npm test`: tests/i18n.test.js fails if the keys or the
//      {placeholders} differ from en.js
// ────────────────────────────────────────────────────────────

import en from './locales/en.js';
import { safeGet, safeSet } from './storage.js';

const LOCALES = { en };
const LOADERS = {
  hi: () => import('./locales/hi.js'),
};

// Toggle cycle order: add new language codes to include in rotation
const CYCLE = ['en', 'hi'];

let _current = 'en';

// ── Public API ───────────────────────────────────────────────

/** Active language code. */
export function getLang() { return _current; }

/** All available language codes. */
export function getAvailableLangs() { return CYCLE.slice(); }

/** Next language in the cycle (for the toggle button). */
export function getNextLang() {
  const idx = CYCLE.indexOf(_current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

/** Language saved by the user, or 'en'. */
export function getSavedLang() {
  const saved = safeGet('lang');
  return CYCLE.includes(saved) ? saved : 'en';
}

/**
 * Translate a key in the current language (falls back to English, then the key).
 * `{name}` placeholders are filled from `vars`.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 */
export function t(key, vars) {
  const str = LOCALES[_current]?.[key] ?? LOCALES.en[key] ?? key;
  return vars ? str.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : str;
}

async function ensureLocale(lang) {
  if (LOCALES[lang]) return true;
  if (!LOADERS[lang]) return false;
  try {
    LOCALES[lang] = (await LOADERS[lang]()).default;
    return true;
  } catch (err) {
    console.warn(`[i18n] Could not load "${lang}":`, err);
    return false;
  }
}

/**
 * Load (if needed) and apply a language to the whole DOM.
 * Falls back to English if the locale is unknown or cannot be loaded.
 * @param {string} lang
 */
export async function applyLanguage(lang) {
  if (!(await ensureLocale(lang))) {
    console.warn(`[i18n] Using "en" instead of "${lang}".`);
    lang = 'en';
  }

  _current = lang;
  document.documentElement.lang = lang;
  const strings = LOCALES[lang];

  // 1 ── ID-based: <span id="txtNavHome"> etc.
  Object.keys(strings).forEach(key => {
    const el = document.getElementById(key);
    if (el) el.textContent = strings[key];
  });

  // 2 ── data-i18n: <span data-i18n="txtOptional">
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (strings[key] !== undefined) el.textContent = strings[key];
  });

  // 3 ── data-i18n-placeholder: <input data-i18n-placeholder="phUpiId">
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (strings[key] !== undefined) el.placeholder = strings[key];
  });

  // 4 ── data-i18n-label: updates only the first direct text node of a
  //      <label>, leaving child elements (e.g. the required "*") untouched.
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    const key = el.dataset.i18nLabel;
    if (strings[key] === undefined) return;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.textContent = strings[key] + ' ';
        break;
      }
    }
  });

  // 5 ── Lang toggle: shows the label of the NEXT language in the cycle
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = strings.langLabel ?? getNextLang().toUpperCase();
}

/** Apply a language and remember the choice. */
export async function setLanguage(lang) {
  await applyLanguage(lang);
  safeSet('lang', _current);
}
