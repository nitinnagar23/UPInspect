// ============================================================
// generator.js — QR card & payment link generation
// UPInspect
// ============================================================

import { state, UPI_REGEX, BASE_PAY_URL } from './state.js';
import { t }                               from './i18n.js';
import { showMessage }                     from './ui.js';

const $ = id => document.getElementById(id);

// UPI apps only accept ASCII merchant names — block non-Latin characters.
// Allows: A-Z a-z 0-9 space & . , - ' /
const NAME_REGEX = /^[A-Za-z0-9 &.,\-''/]*$/;

// ─── Validation ────────────────────────────────────────────

/**
 * Read and validate the create-form fields.
 * Returns { pa, pn, am } on success, or null on failure.
 */
function getFormValues() {
  const pa = $('newUpiId').value.trim().toLowerCase();
  const pn = $('newName').value.trim();
  // Treat '0' (or any value < 1) as blank — silently omit from QR/link
  const rawAm = $('newAmount').value.trim();
  const am    = (rawAm && Number(rawAm) >= 1) ? rawAm : '';

  if (!UPI_REGEX.test(pa)) {
    showMessage(
      t('msgUpiIdInvalid'),
      'error'
    );
    $('newUpiId').classList.add('invalid');
    return null;
  }

  if (pn && !NAME_REGEX.test(pn)) {
    showMessage(t('msgNameInvalid'), 'error');
    $('newName').classList.add('invalid');
    return null;
  }

  return { pa, pn, am };
}

// ─── Live validation ───────────────────────────────────────

export function validateUpiLive() {
  // UPI ID validation
  const input = $('newUpiId');
  const val   = input.value.trim();
  if (val.length === 0) {
    input.classList.remove('valid', 'invalid');
  } else if (UPI_REGEX.test(val)) {
    input.classList.replace('invalid', 'valid') || input.classList.add('valid');
  } else {
    input.classList.replace('valid', 'invalid') || input.classList.add('invalid');
  }

  // Name: flag non-ASCII characters live
  const nameInput = $('newName');
  const nameVal   = nameInput.value;
  if (nameVal.length === 0) {
    nameInput.classList.remove('valid', 'invalid');
  } else if (NAME_REGEX.test(nameVal)) {
    nameInput.classList.replace('invalid', 'valid') || nameInput.classList.add('valid');
  } else {
    nameInput.classList.replace('valid', 'invalid') || nameInput.classList.add('invalid');
  }

  // #4 — Clamp negative amounts live
  // Clamp: reject zero, negative, or anything below 1
  const amtInput = $('newAmount');
  if (amtInput.value !== '') {
    const v = Number(amtInput.value);
    if (isNaN(v) || v < 0) amtInput.value = '0';
  }
}

// ─── QR Card ───────────────────────────────────────────────

export function generateQRCard() {
  const data = getFormValues();
  if (!data) return;

  const { pa, pn, am } = data;
  const upiString = buildUpiString(pa, pn, am);

  // #6 — Show loading state on button
  const btn = document.querySelector('#createTab button[type="submit"]');
  const originalHTML = btn ? btn.innerHTML : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" style="animation:spin 0.7s linear infinite;width:18px;height:18px"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg><span>Generating…</span>';
  }

  // Render standee text
  $('standeeName').textContent   = pn || t('txtStandeeDefault');
  $('standeeUpiId').textContent  = pa;
  $('standeeAmount').textContent = (am && Number(am) >= 1) ? `₹ ${Number(am).toFixed(2)}` : '';

  // Clear previous QR and render at 5× resolution (1200px) for crisp saves.
  // CSS in #cardQrCode canvas caps the visual size to 240px.
  $('cardQrCode').innerHTML = '';
  new QRCodeStyling({
    width:  1200,
    height: 1200,
    type:   'canvas',
    data:   upiString,
    qrOptions:         { errorCorrectionLevel: 'H' },
    dotsOptions:       { color: '#000000', type: 'square' },
    backgroundOptions: { color: '#FFFFFF' },
    margin: 4,
  }).append($('cardQrCode'));

  // Restore button after short delay (QR renders async)
  setTimeout(() => {
    if (btn && originalHTML) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
    // Show result areas
    $('qrStandee').classList.remove('hidden');
    $('cardActions').classList.remove('hidden');
    $('qrStandee').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 350);
}

// ─── Payment Link ──────────────────────────────────────────

export function generateLink() {
  const data = getFormValues();
  if (!data) return;

  const { pa, pn, am } = data;
  // Clean path format: https://upinspect.pages.dev/pa/pn/am
  // Keep @ readable, only encode truly unsafe characters
  let url = `${BASE_PAY_URL}/${pa.replace(/[/?#\[\]!$&'()*+,;=%]/g, encodeURIComponent)}`;
  if (pn) url += `/${encodeURIComponent(pn)}`;
  if (am && Number(am) >= 1) url += `/${encodeURIComponent(String(Number(am)))}`;

  const successMsg = t('msgLinkCopied');
  const failMsg    = t('msgLinkCopyFailed');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => showMessage(successMsg, 'success'))
      .catch(() => {
        // #7 Fallback: prompt with the URL so user can copy manually
        showMessage(failMsg, 'error');
        prompt('Copy this link:', url);
      });
  } else {
    // #7 Older browsers: use execCommand fallback
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showMessage(successMsg, 'success');
    } catch (_) {
      showMessage(failMsg, 'error');
      prompt('Copy this link:', url);
    }
    document.body.removeChild(ta);
  }
}

// ─── Reset ─────────────────────────────────────────────────

export function resetCreateForm() {
  ['newUpiId', 'newName', 'newAmount'].forEach(id => {
    $(`${id}`).value = '';
  });
  $('newUpiId').classList.remove('valid', 'invalid');
  $('newName').classList.remove('valid', 'invalid');
  $('qrStandee').classList.add('hidden');
  $('cardActions').classList.add('hidden');
}

// ─── Internal helpers ──────────────────────────────────────

function buildUpiString(pa, pn, am) {
  let s = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&cu=INR`;
  // encodeURIComponent on amount prevents parameter injection
  const amtNum = Number(am);
  if (am && !isNaN(amtNum) && amtNum >= 1) {
    s += `&am=${encodeURIComponent(String(amtNum))}`;
  }
  return s;
}
