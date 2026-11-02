// ============================================================
// router.js: App-level view routing & tab switching
// UPInspect
// ============================================================

import { state }         from './state.js';
import { DEFAULT_TITLE } from './config.js';
import { stopScanner }   from './scanner.js';
import { warmLib }       from './loader.js';

const $ = id => document.getElementById(id);

// Map view name → [viewId, navId]
const VIEW_MAP = {
  home:  ['viewHome',  'navHome'],
  tools: ['viewTools', 'navTools'],
  about: ['viewAbout', 'navAbout'],
};

// Map tab panel id → tab button id
const TAB_MAP = {
  scanTab:   'tabScan',
  createTab: 'tabCreate',
};

/**
 * Leave the payment-link page: restore nav/tabs (via the body class),
 * the URL, the title and hide its UI. The single place that does this.
 */
export function leavePaymentLinkMode() {
  if (!state.isPaymentLinkMode) return;
  state.isPaymentLinkMode = false;
  state.current = null;
  document.body.classList.remove('paylink-mode');
  window.history.replaceState({}, '', '/');
  document.title = DEFAULT_TITLE;
  $('plActionButtons').classList.add('hidden');
  $('extractedCard').classList.add('hidden');
}

/**
 * Switch the active top-level view.
 * @param {'home'|'tools'|'about'} viewName
 * @param {{ keepPayLink?: boolean }} [opts]
 */
export function switchAppView(viewName, { keepPayLink = false } = {}) {
  if (!keepPayLink) leavePaymentLinkMode();
  if (viewName !== 'tools') stopScanner();

  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const [viewId, navId] = VIEW_MAP[viewName] ?? [];
  if (viewId) $(viewId).classList.add('active');
  if (navId)  $(navId).classList.add('active');

  // Show footer on Home and About; hide on Tools (except on a payment link)
  const footer = $('siteFooter');
  if (footer) footer.classList.toggle('hidden', viewName === 'tools' && !keepPayLink);

  if (viewName === 'tools' && !keepPayLink) warmForVisibleTab();
  window.scrollTo(0, 0);
}

/**
 * Navigate straight to a tool tab (e.g. from Home feature cards).
 * @param {'scanTab'|'createTab'} toolTabId
 */
export function navToTools(toolTabId) {
  switchAppView('tools');
  switchToolTab(toolTabId);
}

/**
 * Switch the active tab inside the Tools view.
 * @param {'scanTab'|'createTab'} tabId
 */
export function switchToolTab(tabId) {
  if (!TAB_MAP[tabId]) return;

  document.querySelectorAll('.tool-content').forEach(el => el.classList.toggle('hidden', el.id !== tabId));
  document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
    const on = btn.id === TAB_MAP[tabId];
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
  });

  // Always hide the extracted result when switching tabs
  $('extractedCard').classList.add('hidden');

  if (tabId === 'createTab') stopScanner();   // stop camera if leaving scan tab
  warmForVisibleTab();
}

/** Prefetch (in idle time) the libraries the visible tab will need. */
function warmForVisibleTab() {
  if (state.isPaymentLinkMode) return;
  if (!$('createTab').classList.contains('hidden')) {
    warmLib('qrcodestyling');
  } else if (!$('scanTab').classList.contains('hidden')) {
    warmLib('html5qrcode');
    warmLib('jsqr');
  }
}
