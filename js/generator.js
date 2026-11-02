// ============================================================
// generator.js: QR card & payment link generation
// UPInspect
// ============================================================

import { state }                           from './state.js';
import { t }                               from './i18n.js';
import { showMessage, copyText, scrollToEl } from './ui.js';
import { loadLib }                         from './loader.js';
import { QR_PX }                           from './config.js';
import {
  isValidUpiId, isValidName, classifyAmount,
  buildUpiUri, buildPayLink, formatAmount,
} from './upi.js';
import { prerenderStandee }                from './share.js';

const $ = id => document.getElementById(id);

// ─── Validation ────────────────────────────────────────────

function setValidity(input, status) {
  input.classList.toggle('valid',   status === 'valid');
  input.classList.toggle('invalid', status === 'invalid');
}

/** An empty or zero amount means "no amount" (silently omitted, as documented). */
function readAmount() {
  const raw = $('newAmount').value.trim();
  if (raw === '' || Number(raw) === 0) return { status: 'none', value: '' };
  return classifyAmount(raw);
}

/**
 * Read and validate the create-form fields.
 * Returns { pa, pn, am } on success, or null on failure (after telling the user why).
 */
function getFormValues() {
  const pa = $('newUpiId').value.trim().toLowerCase();
  const pn = $('newName').value.trim();
  const amount = readAmount();

  if (!isValidUpiId(pa)) {
    showMessage(t('msgUpiIdInvalid'), 'error');
    setValidity($('newUpiId'), 'invalid');
    return null;
  }
  if (pn && !isValidName(pn)) {
    showMessage(t('msgNameInvalid'), 'error');
    setValidity($('newName'), 'invalid');
    return null;
  }
  if (amount.status === 'invalid') {
    showMessage(t('msgAmountInvalid'), 'error');
    setValidity($('newAmount'), 'invalid');
    return null;
  }
  return { pa, pn, am: amount.value };
}

/** Live field feedback (does not change what the user typed). */
export function validateUpiLive() {
  const pa = $('newUpiId').value.trim();
  setValidity($('newUpiId'), pa === '' ? 'none' : isValidUpiId(pa) ? 'valid' : 'invalid');

  const pn = $('newName').value.trim();
  setValidity($('newName'), pn === '' ? 'none' : isValidName(pn) ? 'valid' : 'invalid');

  const am = readAmount();
  setValidity($('newAmount'), am.status === 'none' ? 'none' : am.status === 'ok' ? 'valid' : 'invalid');
}

export function initGenerator() {
  $('createForm').addEventListener('submit', e => {
    e.preventDefault();
    generateQRCard();
  });
  ['newUpiId', 'newName', 'newAmount'].forEach(id => $(id).addEventListener('input', validateUpiLive));
}

// ─── QR Card ───────────────────────────────────────────────

function setBusy(btn, busy) {
  btn.disabled = busy;
  btn.classList.toggle('is-busy', busy);
  btn.setAttribute('aria-busy', String(busy));
  $('txtGenQR').textContent = t(busy ? 'txtGenerating' : 'txtGenQR');
}

export async function generateQRCard() {
  const data = getFormValues();
  if (!data) return;

  const btn = $('btnGenQR');
  setBusy(btn, true);
  try {
    const QRCodeStyling = await loadLib('qrcodestyling');

    // Rendered at exactly the size it is drawn into the exported PNG (no resampling).
    // CSS in #cardQrCode canvas caps the on-screen size.
    const qr = new QRCodeStyling({
      width:  QR_PX,
      height: QR_PX,
      type:   'canvas',
      data:   buildUpiUri(data),
      // 'M' (15% recovery) is plenty for a clean standee with no logo and gives ~30% fewer,
      // larger modules than 'H', which scans noticeably better at small sizes / distance.
      qrOptions:         { errorCorrectionLevel: 'M' },
      dotsOptions:       { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 8,
    });

    const holder = $('cardQrCode');
    holder.replaceChildren();
    qr.append(holder);
    // The public API has no "drawn" signal for canvas output; wait on the
    // library's drawing promise when it exists (harmless if it does not).
    await Promise.resolve(qr._canvasDrawingPromise).catch(() => {});
    if (!holder.querySelector('canvas')) throw new Error('QR canvas was not created');

    // Standee text
    $('standeeName').textContent   = data.pn || t('txtStandeeDefault');
    $('standeeUpiId').textContent  = data.pa;
    $('standeeAmount').textContent = formatAmount(data.am);

    state.standee.data = data;
    prerenderStandee();               // PNG is ready (or nearly) by the time the user taps Save/Share

    $('qrStandee').classList.remove('hidden');
    $('cardActions').classList.remove('hidden');
    scrollToEl($('qrStandee'), 'nearest');
  } catch (err) {
    console.error('[generate]', err);
    const libFailed = /Failed to load|is missing/.test(String(err?.message));
    showMessage(t(libFailed ? 'msgLibLoadFailed' : 'msgQrGenFailed'), 'error');
  } finally {
    setBusy(btn, false);
  }
}

// ─── Payment Link ──────────────────────────────────────────

export async function generateLink() {
  const data = getFormValues();
  if (!data) return;

  const url = buildPayLink(data);
  const ok = await copyText(url);
  if (ok) {
    showMessage(t('msgLinkCopied'), 'success');
  } else {
    showMessage(t('msgLinkCopyFailed'), 'error');
    window.prompt(t('txtCopyPrompt'), url);
  }
}

// ─── Reset ─────────────────────────────────────────────────

export function resetCreateForm() {
  ['newUpiId', 'newName', 'newAmount'].forEach(id => {
    $(id).value = '';
    setValidity($(id), 'none');
  });
  $('cardQrCode').replaceChildren();
  $('qrStandee').classList.add('hidden');
  $('cardActions').classList.add('hidden');
  state.standee = { data: null, blobPromise: null };
}
