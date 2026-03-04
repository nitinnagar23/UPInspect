// ============================================================
// paylink.js — Payment Link Page
// UPInspect
// ============================================================

import { state }                        from './state.js';
import { switchAppView, switchToolTab } from './router.js';

export function showPayLinkButtons() {
  document.getElementById('plActionButtons').classList.remove('hidden');
}

export function plGoScan() {
  _leavePaylinkPage();
  switchAppView('tools');
  switchToolTab('scanTab', document.getElementById('tabScan'));
}

export function plGoCreate() {
  _leavePaylinkPage();
  switchAppView('tools');
  switchToolTab('createTab', document.getElementById('tabCreate'));
}

function _leavePaylinkPage() {
  // Reset global flag — ensures smooth scroll and standard UI behaviours return
  state.isPaymentLinkMode = false;
  // Clean URL back to root
  window.history.replaceState({}, '', '/');
  // Hide payment-link UI
  document.getElementById('plActionButtons').classList.add('hidden');
  document.getElementById('extractedCard').classList.add('hidden');
  // Restore nav + tabs
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
}
