// ============================================================
// extractor.js — Render extracted UPI data & payment actions
// UPInspect
// ============================================================

import { state }       from './state.js';
import { showMessage } from './ui.js';
import { t }           from './i18n.js';

const $ = id => document.getElementById(id);

/**
 * Populate and reveal the extracted-card UI.
 * @param {{ pa: string, pn: string, am: string }} data
 */
export function renderExtractedCard({ pa, pn, am }) {
  $('valUpiId').textContent   = pa;
  $('valMerchant').textContent = pn || '—';

  // Only show amount row if it is a valid number >= 1
  const amtNum = Number(am);
  if (am && !isNaN(amtNum) && amtNum >= 1) {
    $('valAmount').textContent = `₹ ${amtNum.toFixed(2)}`;
    $('groupAmount').classList.remove('hidden');
    // Always start in display mode when card is freshly rendered
    $('amountDisplay').classList.remove('hidden');
    $('amountEdit').classList.add('hidden');
  } else {
    $('groupAmount').classList.add('hidden');
  }

  const card = $('extractedCard');
  card.classList.remove('hidden');
  // Don't scroll on payment-link page — it pushes the nav out of view
  if (!state.isPaymentLinkMode) {
    card.scrollIntoView({ behavior: 'smooth' });
  }
}


/**
 * Copy the displayed UPI ID to the clipboard.
 */
export function copyUPI() {
  const upiId = $('valUpiId').textContent;
  if (!upiId || upiId === 'N/A' || upiId === '—') return;

  navigator.clipboard
    .writeText(upiId)
    .then(() => showMessage(t('msgUpiCopied'), 'success'))
    .catch(() => showMessage(t('msgCopyFailed'), 'error'));
}

/**
 * Open the native UPI payment deep-link.
 */
export function openUPI() {
  const pa = $('valUpiId').textContent;
  const pn = $('valMerchant').textContent;
  if (!pa || pa === '—' || pa === 'N/A') return;

  const safePn = (pn && pn !== '—') ? pn : '';
  let link = `upi://pay?pa=${encodeURIComponent(pa)}${safePn ? `&pn=${encodeURIComponent(safePn)}` : ''}&cu=INR`;

  // Use Number() not parseFloat() — parseFloat('100&pa=attacker@upi') = 100 (injection risk)
  // Only include amount if it is a real number >= 1
  const amt = Number(state.rawAmountVal);
  if (state.rawAmountVal && !isNaN(amt) && amt >= 1) {
    link += `&am=${encodeURIComponent(String(amt))}`;
  }

  window.open(link, '_self');
}

/**
 * Switch the amount row into inline edit mode.
 */
export function startEditAmount() {
  const current = $('valAmount').textContent.replace('₹', '').trim();
  $('editAmtInput').value = current || '';
  $('amountDisplay').classList.add('hidden');
  $('amountEdit').classList.remove('hidden');
  $('editAmtInput').focus();
  $('editAmtInput').select();
}

/**
 * Confirm the edited amount and update state + display.
 */
export function confirmEditAmount() {
  const raw = $('editAmtInput').value.trim();
  const num = Number(raw);

  if (!raw || isNaN(num) || num < 1) {
    // Invalid — cancel silently and keep original
    cancelEditAmount();
    return;
  }

  // Update display
  $('valAmount').textContent = `₹ ${num.toFixed(2)}`;
  // Update rawAmountVal so openUPI() uses the new value
  state.rawAmountVal = String(num);

  $('amountEdit').classList.add('hidden');
  $('amountDisplay').classList.remove('hidden');
}

/**
 * Cancel edit — restore display without changes.
 */
export function cancelEditAmount() {
  $('editAmtInput').value = '';
  $('amountEdit').classList.add('hidden');
  $('amountDisplay').classList.remove('hidden');
}
