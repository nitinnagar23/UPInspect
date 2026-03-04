// ============================================================
// scanner.js — QR code scanning (camera + file upload)
// UPInspect
// ============================================================

import { state, UPI_REGEX } from './state.js';
import { showMessage }       from './ui.js';
import { t, getLang, applyLanguage } from './i18n.js';
import { renderExtractedCard } from './extractor.js';

const $ = id => document.getElementById(id);

let _torchOn = false;

// ─── DOM helpers ───────────────────────────────────────────

function setScannerUIState(scanning) {
  $('scannerWrapper').classList.toggle('hidden', !scanning);
  $('btnStartCam').classList.toggle('hidden',  scanning);
  $('btnStopCam').classList.toggle('hidden',  !scanning);
  $('btnTorch').classList.toggle('hidden',    !scanning);
  if (!scanning) {
    _torchOn = false;
    updateTorchUI();
  }
}

// ─── Lifecycle ─────────────────────────────────────────────

function initScanner() {
  if (!state.html5QrCode) {
    state.html5QrCode = new Html5Qrcode('reader');
  }
}

export async function stopScanner() {
  if (state.html5QrCode && state.isScanning) {
    // Turn off torch before stopping to avoid device lock-up on some phones
    if (_torchOn) {
      try {
        const video = document.querySelector('#reader video');
        const track = video?.srcObject?.getVideoTracks?.()?.[0];
        if (track) await track.applyConstraints({ advanced: [{ torch: false }] });
      } catch (_) {}
      _torchOn = false;
    }
    try { await state.html5QrCode.stop(); } catch (_) {}
    state.isScanning = false;
  }
  setScannerUIState(false);
}

export async function toggleTorch() {
  if (!state.isScanning) return;

  // Get the live video track directly from the stream — works in Chrome and Firefox.
  // html5-qrcode's applyVideoConstraints() only works in Chrome.
  const video = document.querySelector('#reader video');
  const track = video?.srcObject?.getVideoTracks?.()?.[0];

  if (!track) {
    showMessage(t('msgTorchUnsupported'), 'error');
    return;
  }

  // Check if torch is supported on this track before attempting
  const capabilities = track.getCapabilities?.();
  if (!capabilities?.torch) {
    showMessage(t('msgTorchUnsupported'), 'error');
    return;
  }

  try {
    _torchOn = !_torchOn;
    await track.applyConstraints({ advanced: [{ torch: _torchOn }] });
    updateTorchUI();
  } catch (_) {
    _torchOn = false;
    updateTorchUI();
    showMessage(t('msgTorchUnsupported'), 'error');
  }
}

function updateTorchUI() {
  const btn = $('btnTorch');
  if (!btn) return;
  btn.classList.toggle('btn-torch-on', _torchOn);
  btn.setAttribute('aria-label', _torchOn ? t('txtTorchOff') : t('txtTorchOn'));
  btn.setAttribute('title',      _torchOn ? t('txtTorchOff') : t('txtTorchOn'));
}

export function startScanner() {
  initScanner();
  $('extractedCard').classList.add('hidden');
  setScannerUIState(true);

  const qrboxSize = window.innerWidth < 350 ? 180 : 240;

  state.html5QrCode
    .start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: { width: qrboxSize, height: qrboxSize } },
      (decodedText) => {
        parseQRText(decodedText);
        stopScanner();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      },
      () => {} // per-frame errors are expected; suppress them
    )
    .then(() => { state.isScanning = true; })
    .catch(() => {
      setScannerUIState(false);
      showMessage(t('msgCameraDenied'), 'error');
    });
}

// ─── File Upload ───────────────────────────────────────────

export function initFileUploadListener() {
  $('qrFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    $('extractedCard').classList.add('hidden');
    e.target.value = '';
    stopScanner(); // stop live camera if running

    // Use jsQR directly — html5-qrcode's scanFile() uses createImageBitmap()
    // which behaves inconsistently in Firefox. jsQR via canvas works everywhere.
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result    = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (result) {
        parseQRText(result.data);
      } else {
        showMessage(t('msgQrReadError'), 'error');
      }
    };

    img.onerror = function () {
      URL.revokeObjectURL(url);
      showMessage(t('msgQrReadError'), 'error');
    };

    img.src = url;
  });
}


// ─── QR Parsing ────────────────────────────────────────────

/**
 * Parse raw QR text and populate the extracted card.
 * Handles both upi://pay URIs and plain UPI IDs.
 * @param {string} text
 */
function parseQRText(text) {
  const trimmed = text.trim();

  if (trimmed.toLowerCase().startsWith('upi://pay')) {
    try {
      const url = new URL(trimmed);
      const pa  = url.searchParams.get('pa') || 'N/A';
      const pn  = url.searchParams.get('pn') || 'N/A';
      const am  = url.searchParams.get('am') || '';

      state.rawAmountVal      = am;
      state.isPaymentLinkMode = false;
      applyLanguage(getLang(), false);
      renderExtractedCard({ pa, pn, am });
    } catch (_) {
      showMessage(t('msgQrParseError'), 'error');
    }
    return;
  }

  if (UPI_REGEX.test(trimmed)) {
    state.rawAmountVal = '';
    renderExtractedCard({ pa: trimmed, pn: 'N/A', am: '' });
    return;
  }

  // Unrecognised
  showMessage(t('msgQrInvalid'), 'error');
}
