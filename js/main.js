// ============================================================
// main.js — Application entry point & bootstrap
// UPInspect
// ============================================================

import { state }                          from './state.js';
import { restoreTheme, toggleTheme }      from './ui.js';
import { applyLanguage, getLang,
         getNextLang }                  from './i18n.js';
import { switchAppView, navToTools,
         switchToolTab }                  from './router.js';
import { startScanner, stopScanner, toggleTorch,
         initFileUploadListener }         from './scanner.js';
import { copyUPI, openUPI,
         renderExtractedCard,
         startEditAmount, confirmEditAmount,
         cancelEditAmount }            from './extractor.js';
import { validateUpiLive, generateQRCard,
         generateLink, resetCreateForm }  from './generator.js';
import { downloadStandee, shareStandee } from './share.js';
import { showPayLinkButtons,
         plGoScan, plGoCreate }           from './paylink.js';

// ─── Boot ──────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  // 1. Restore persisted preferences
  restoreTheme();
  // Restore language preference
  const savedLang = localStorage.getItem('lang') || 'en';

  // 2. Handle payment-link mode — smart segment parsing
  //    Supports all variants:
  //      /pa               → UPI ID only
  //      /pa/pn            → UPI ID + merchant name
  //      /pa/am            → UPI ID + amount  (seg1 is numeric)
  //      /pa/pn/am         → UPI ID + name + amount
  const segments = window.location.pathname.split('/').filter(Boolean);
  const pa = segments[0] ? decodeURIComponent(segments[0]) : null;

  if (pa) {
    state.isPaymentLinkMode = true;

    const seg1 = segments[1] ? decodeURIComponent(segments[1]) : '';
    const seg2 = segments[2] ? decodeURIComponent(segments[2]) : '';

    // If seg1 is a positive number it is an amount, not a name
    const seg1IsAmount = seg1 !== '' && Number(seg1) > 0 && !isNaN(Number(seg1));

    const pn = seg1IsAmount ? ''    : seg1;
    const am = seg1IsAmount ? seg1  : seg2;
    state.rawAmountVal = am;

    // Show tools view but hide nav, tabs AND the scan/create tab cards
    // — only the verified card + two action buttons should show
    switchAppView('tools');
    document.getElementById('toolTabs').classList.add('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('scanTab').classList.add('hidden');
    document.getElementById('createTab').classList.add('hidden');

    // Populate the verified card
    renderExtractedCard({ pa, pn, am });

    // Show the two action buttons below the card
    showPayLinkButtons();

    // Show footer on paylink page
    const footer = document.getElementById('siteFooter');
    if (footer) footer.classList.remove('hidden');

    // #2 Dynamic tab title: "Pay Rahul — UPInspect"
    const displayName = (pn && pn !== 'Unknown') ? pn : pa;
    document.title = `Pay ${displayName} — UPInspect`;
  }

  // Show footer on initial load (Home view is default)
  if (!state.isPaymentLinkMode) {
    const footer = document.getElementById('siteFooter');
    if (footer) footer.classList.remove('hidden');
  }

  // 3. Apply translations
  applyLanguage(savedLang, state.isPaymentLinkMode);

  // 4. Bind file-upload listener
  initFileUploadListener();

  // 5. Expose functions needed by inline HTML event handlers
  exposeGlobals();
});

// ─── Global bridge ─────────────────────────────────────────
// Since the HTML uses onclick="..." attributes, we attach
// the module functions to window so they remain reachable.
// In a build-tool setup these would be removed in favour of
// addEventListener bindings, but this keeps the HTML clean
// without requiring a bundler.

function exposeGlobals() {
  Object.assign(window, {
    // Theme / lang
    toggleTheme,
    toggleLang,

    // Routing — wrap switchAppView so Home nav also resets title & pl UI
    switchAppView: (view) => {
      if (view === 'home') {
        document.title = 'UPInspect | Decode. Verify. Pay.';
        state.isPaymentLinkMode = false;
        document.getElementById('plActionButtons').classList.add('hidden');
        document.getElementById('extractedCard').classList.add('hidden');
        document.getElementById('bottomNav').classList.remove('hidden');
        document.getElementById('toolTabs').classList.remove('hidden');
      }
      switchAppView(view);
    },
    navToTools,
    switchToolTab,

    // Scanner
    startScanner,
    stopScanner,
    toggleTorch,

    // Extracted card
    copyUPI,
    openUPI,
    startEditAmount,
    confirmEditAmount,
    cancelEditAmount,

    // Generator
    validateUpiLive,
    generateQRCard,
    generateLink,
    resetCreateForm,

    // Share
    downloadStandee,
    shareStandee,

    // Payment-link navigation
    plGoScan,
    plGoCreate,

    // Logo
    goHome,
  });
}

// ─── Logo: go home & clean URL ─────────────────────────────

function goHome() {
  // Strip path back to root
  window.history.replaceState({}, '', '/');
  // Reset payment-link mode state
  state.isPaymentLinkMode = false;
  // Hide payment-link buttons
  document.getElementById('plActionButtons').classList.add('hidden');
  document.getElementById('extractedCard').classList.add('hidden');
  // Restore nav + tabs
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
  switchAppView('home');
}

// ─── Language toggle ───────────────────────────────────────

function toggleLang() {
  // getLang() / getNextLang() are the single source of truth — no state.currentLang
  const next = getNextLang();
  localStorage.setItem('lang', next);
  applyLanguage(next, state.isPaymentLinkMode);
}
