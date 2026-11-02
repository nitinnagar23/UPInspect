// ============================================================
// extractor.js: Render extracted UPI data & payment actions
// UPInspect
//
// `state.current` is the single source of truth. The DOM is only a
// view of it: nothing here reads text back from the page.
// ============================================================

import { state }                              from './state.js';
import { showMessage, copyText, scrollToEl }  from './ui.js';
import { t }                                  from './i18n.js';
import { buildUpiUri, classifyAmount, formatAmount } from './upi.js';

const $ = id => document.getElementById(id);

/**
 * Populate and reveal the result card.
 * @param {{ pa: string, pn: string, am: string, extras: Array, warnings: Array }} data  (from upi.js)
 * @param {'scan'|'link'} mode  'link' = opened from a payment link
 */
export function renderExtractedCard(data, mode = 'scan') {
  state.current = { ...data, mode };

  $('valUpiId').textContent   = data.pa;
  $('valMerchant').textContent = data.pn || '-';
  renderAmount();
  refreshExtractedCard();

  const card = $('extractedCard');
  card.classList.remove('hidden');
  // Don't scroll on the payment-link page: it pushes the nav out of view
  if (mode !== 'link') scrollToEl(card);
}

/** Re-render the language-dependent parts (title + warnings). */
export function refreshExtractedCard() {
  const cur = state.current;
  if (!cur) return;

  $('extractTitle').textContent = t(cur.mode === 'link' ? 'txtPaymentRequest' : 'extractTitle');

  const list = $('extractWarnings');
  list.replaceChildren();
  for (const w of cur.warnings ?? []) {
    const li = document.createElement('li');
    li.textContent = t(w.key, w.vars);
    list.appendChild(li);
  }
  list.classList.toggle('hidden', list.children.length === 0);
}

function renderAmount() {
  const am = state.current?.am;
  if (am) {
    $('valAmount').textContent = formatAmount(am);   // derived from the same value that is paid
    $('groupAmount').classList.remove('hidden');
  } else {
    $('groupAmount').classList.add('hidden');
  }
  // Always start in display mode
  $('amountDisplay').classList.remove('hidden');
  $('amountEdit').classList.add('hidden');
}

// ─── Actions ───────────────────────────────────────────────

/** Copy the UPI ID to the clipboard. */
export async function copyUPI() {
  if (!state.current?.pa) return;
  const ok = await copyText(state.current.pa);
  showMessage(t(ok ? 'msgUpiCopied' : 'msgCopyFailed'), ok ? 'success' : 'error');
}

/** Open the native UPI payment deep link. */
export function openUPI() {
  if (!state.current?.pa) return;
  window.open(buildUpiUri(state.current), '_self');
}

// ─── Amount editing ────────────────────────────────────────

export function startEditAmount() {
  const input = $('editAmtInput');
  input.value = state.current?.am ?? '';
  $('amountDisplay').classList.add('hidden');
  $('amountEdit').classList.remove('hidden');
  input.focus();
  input.select();
}

export function confirmEditAmount() {
  const result = classifyAmount($('editAmtInput').value);
  if (result.status !== 'ok') {
    showMessage(t('msgAmountInvalid'), 'error');
    $('editAmtInput').focus();
    return;
  }
  state.current.am = result.value;
  renderAmount();
}

export function cancelEditAmount() {
  $('editAmtInput').value = '';
  $('amountEdit').classList.add('hidden');
  $('amountDisplay').classList.remove('hidden');
}

/** Enter confirms, Escape cancels. */
export function initExtractor() {
  $('editAmtInput').addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmEditAmount(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEditAmount(); }
  });
}
