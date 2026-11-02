// ============================================================
// main.js: Entry point
// UPInspect
//
// Boot sequence: wire up events FIRST (so the UI stays usable even if a
// later step fails), restore preferences, then route the URL.
// ============================================================

import { toggleTheme, restoreTheme, showMessage, scrollToEl } from './ui.js';
import { t, applyLanguage, setLanguage, getSavedLang, getNextLang } from './i18n.js';
import { parsePayPath }                                    from './upi.js';
import { switchAppView, navToTools, switchToolTab }        from './router.js';
import { startScanner, stopScanner, toggleTorch, initFileUploadListener } from './scanner.js';
import {
  initExtractor, copyUPI, openUPI, startEditAmount, confirmEditAmount,
  cancelEditAmount, refreshExtractedCard,
} from './extractor.js';
import { initGenerator, generateLink, resetCreateForm }    from './generator.js';
import { downloadStandee, shareStandee, refreshStandee }   from './share.js';
import { enterPaymentLinkMode, plGoScan, plGoCreate }      from './paylink.js';

const $ = id => document.getElementById(id);

// ─── Actions (data-action="…" in index.html) ───────────────
// No inline onclick handlers and no window globals: this keeps the page
// compatible with a strict Content-Security-Policy.

async function toggleLang() {
  await setLanguage(getNextLang());
  refreshExtractedCard();   // warnings/title are built in JS, not in the HTML
  refreshStandee();         // re-render the exported PNG in the new language
}

const ACTIONS = {
  goHome:            () => switchAppView('home'),
  switchAppView:     el => switchAppView(el.dataset.arg),
  navToTools:        el => navToTools(el.dataset.arg),
  switchToolTab:     el => switchToolTab(el.dataset.arg),
  toggleLang,
  toggleTheme:       () => toggleTheme(),
  startScanner:      () => startScanner(),
  stopScanner:       () => stopScanner(),
  toggleTorch:       () => toggleTorch(),
  pickFile:          () => $('qrFile').click(),
  // Home → upload: switch to the scan tab first, then open the file picker (same user gesture)
  homeUpload:        () => { navToTools('scanTab'); $('qrFile').click(); },
  copyUPI:           () => copyUPI(),
  openUPI:           () => openUPI(),
  // "Pay Now declined?" tip -> About page, scrolled to the Copy UPI ID guide
  openPayGuide:      () => { switchAppView('about'); scrollToEl($('payGuide')); },
  startEditAmount:   () => startEditAmount(),
  confirmEditAmount: () => confirmEditAmount(),
  cancelEditAmount:  () => cancelEditAmount(),
  generateLink:      () => generateLink(),
  resetCreateForm:   () => resetCreateForm(),
  downloadStandee:   () => downloadStandee(),
  shareStandee:      () => shareStandee(),
  plGoScan:          () => plGoScan(),
  plGoCreate:        () => plGoCreate(),
};

function bindActions() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = ACTIONS[el.dataset.action];
    if (action) action(el);
    else console.warn('[ui] Unknown action:', el.dataset.action);
  });
}

// ─── Boot ──────────────────────────────────────────────────

/** Run a boot step; one failing step must never take the whole app down. */
function step(name, fn) {
  try { return fn(); } catch (err) { console.error(`[boot] ${name} failed:`, err); }
}

function registerServiceWorker() {
  // `serviceWorker` only exists in secure contexts (https, localhost, 127.0.0.1)
  if (!('serviceWorker' in navigator)) return;
  const register = () => navigator.serviceWorker.register('/sw.js').catch(err => console.warn('[sw]', err));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

// The copyright year follows the visitor's clock, so it never goes stale.
// (index.html ships a fallback year in case this does not run.)
function setFooterYear() {
  const el = $('footerYear');
  if (el) el.textContent = String(new Date().getFullYear());
}

async function boot() {
  step('footer',    setFooterYear);
  step('actions',   bindActions);
  step('theme',     restoreTheme);
  step('upload',    initFileUploadListener);
  step('extractor', initExtractor);
  step('generator', initGenerator);

  const route = parsePayPath(window.location.pathname);   // never throws

  try {
    await applyLanguage(getSavedLang());
  } catch (err) {
    console.error('[boot] language failed:', err);
  }

  $('siteFooter')?.classList.remove('hidden');

  if (route.status === 'ok') {
    step('paylink', () => enterPaymentLinkMode(route.data));
  } else if (route.status === 'invalid') {
    // Unknown paths (/about, /robots.txt, a truncated link …) are not payment requests
    window.history.replaceState({}, '', '/');
    showMessage(t('msgLinkInvalid'), 'error');
  }

  registerServiceWorker();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
