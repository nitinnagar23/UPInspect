// ============================================================
// i18n.js — Language loader & DOM applier
// UPInspect
//
// ── Adding a new language ────────────────────────────────────
//   1. Create  js/locales/xx.js  (copy en.js, translate values)
//   2. Import it below and add to LOCALES
//   3. Add it to the CYCLE array to include it in toggle order
// ────────────────────────────────────────────────────────────

import en from './locales/en.js';
import hi from './locales/hi.js';

// ── Registry ─────────────────────────────────────────────────
// Add new languages here — key = BCP-47 code (e.g. 'mr', 'ta', 'te')
const LOCALES = { en, hi };

// Toggle cycle order — add new language codes to include in rotation
const CYCLE = ['en', 'hi'];

// ── Internal state ───────────────────────────────────────────
let _current = 'en';

// ── Public API ───────────────────────────────────────────────

/**
 * Get the active language code.
 * @returns {string}
 */
export function getLang() { return _current; }

/**
 * Get the full list of available language codes.
 * @returns {string[]}
 */
export function getAvailableLangs() { return CYCLE.slice(); }

/**
 * Get the next language in the cycle (for toggle button).
 * @returns {string}
 */
export function getNextLang() {
  const idx = CYCLE.indexOf(_current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

/**
 * Translate a key in the current language.
 * Falls back to English, then to the key itself.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return (LOCALES[_current]?.[key]) ?? LOCALES.en[key] ?? key;
}

/**
 * Apply a language to the entire DOM and persist the choice.
 * @param {string} lang        - BCP-47 code registered in LOCALES
 * @param {boolean} isPayLinkMode
 */
export function applyLanguage(lang, isPayLinkMode = false) {
  if (!LOCALES[lang]) {
    console.warn(`[i18n] Unknown language "${lang}", falling back to "en".`);
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

  // 3 ── data-i18n-placeholder: <input data-i18n-placeholder="txtLabelUpiId">
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (strings[key] !== undefined) el.placeholder = strings[key];
  });

  // 4 ── data-i18n-label: <label data-i18n-label="txtLabelName">
  //      Updates only the direct text node, leaving child elements untouched.
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    const key = el.dataset.i18nLabel;
    if (strings[key] !== undefined) {
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = strings[key] + ' ';
          break;
        }
      }
    }
  });

  // 5 ── Payment link mode: badge = "Payment Request" not "Payment Verified"
  if (isPayLinkMode) {
    const el = document.getElementById('extractTitle');
    if (el) el.textContent = strings.txtPaymentRequest;
  }

  // 6 ── Lang toggle: shows the label of the NEXT language in cycle
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = strings.langLabel ?? getNextLang().toUpperCase();
}
