// ============================================================
// paylink.js: Payment Link Page
// UPInspect
//
// Pay-link mode is a body class (see css: body.paylink-mode) that hides
// the nav, tabs and tool panels, so leaving it is just removing the class
// and nothing has to be un-hidden element by element.
// ============================================================

import { state }                                       from './state.js';
import { switchAppView, switchToolTab }                from './router.js';
import { renderExtractedCard }                         from './extractor.js';

const $ = id => document.getElementById(id);

/**
 * Show the payment-link page for already-validated data (see parsePayPath).
 * @param {object} data
 */
export function enterPaymentLinkMode(data) {
  switchAppView('tools', { keepPayLink: true });
  state.isPaymentLinkMode = true;
  document.body.classList.add('paylink-mode');

  renderExtractedCard(data, 'link');
  $('plActionButtons').classList.remove('hidden');
  $('siteFooter')?.classList.remove('hidden');

  // Dynamic tab title: "Pay Sample Store | UPInspect"
  document.title = `Pay ${data.pn || data.pa} | UPInspect`;
}

export function plGoScan() {
  switchAppView('tools');          // also leaves pay-link mode
  switchToolTab('scanTab');
}

export function plGoCreate() {
  switchAppView('tools');
  switchToolTab('createTab');
}
