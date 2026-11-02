// ============================================================
// scanner.js: QR code scanning (camera + file upload)
// UPInspect
// ============================================================

import { state }               from './state.js';
import { showMessage }         from './ui.js';
import { t }                   from './i18n.js';
import { renderExtractedCard } from './extractor.js';
import { loadLib }             from './loader.js';
import { parseUpiText }        from './upi.js';
import { IMAGE_SCAN_SIZES }    from './config.js';

const $ = id => document.getElementById(id);

let _torchOn       = false;
let _starting      = false;  // start() is in flight
let _stopRequested = false;  // Stop was pressed while starting
let _handled       = false;  // a code was already accepted in this session

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

function liveTrack() {
  const video = document.querySelector('#reader video');
  return video?.srcObject?.getVideoTracks?.()?.[0];
}

/** Map a camera start failure to a specific message instead of always "denied". */
function cameraErrorKey(err) {
  const msg = `${err?.name ?? ''} ${err?.message ?? err ?? ''}`;
  if (/NotAllowed|Permission|denied/i.test(msg))                 return 'msgCameraDenied';
  if (/NotFound|DevicesNotFound|no camera|not found/i.test(msg)) return 'msgCameraNotFound';
  if (/NotReadable|TrackStart|in use|could not start/i.test(msg)) return 'msgCameraBusy';
  return 'msgCameraError';
}

// ─── Lifecycle ─────────────────────────────────────────────

async function initScanner() {
  await loadLib('html5qrcode');
  if (!state.html5QrCode) {
    const QR_CODE = window.Html5QrcodeSupportedFormats?.QR_CODE ?? 0;
    state.html5QrCode = new window.Html5Qrcode('reader', {
      formatsToSupport: [QR_CODE],                       // skip barcode decoders: QR only
      useBarCodeDetectorIfSupported: true,               // native BarcodeDetector when available
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });
  }
}

async function turnTorchOff() {
  if (!_torchOn) return;
  try {
    const track = liveTrack();
    if (track) await track.applyConstraints({ advanced: [{ torch: false }] });
  } catch { /* torch may already be gone with the stream */ }
  _torchOn = false;
}

export async function stopScanner() {
  if (_starting) {
    // start() has not resolved yet: flag it, startScanner() stops the camera as soon as it can.
    _stopRequested = true;
    setScannerUIState(false);
    return;
  }
  if (state.html5QrCode && state.isScanning) {
    state.isScanning = false;
    // Turn off torch before stopping to avoid device lock-up on some phones
    await turnTorchOff();
    try { await state.html5QrCode.stop(); } catch { /* already stopped */ }
  }
  setScannerUIState(false);
}

export async function toggleTorch() {
  if (!state.isScanning) return;

  // Use the live video track directly: works in Chrome and Firefox
  // (html5-qrcode's own applyVideoConstraints() only works in Chrome).
  const track = liveTrack();
  if (!track || !track.getCapabilities?.()?.torch) {
    showMessage(t('msgTorchUnsupported'), 'error');
    return;
  }

  try {
    _torchOn = !_torchOn;
    await track.applyConstraints({ advanced: [{ torch: _torchOn }] });
    updateTorchUI();
  } catch {
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

function onScanSuccess(decodedText) {
  if (_handled) return;          // frames keep arriving until stop() completes
  _handled = true;
  stopScanner();
  handleDecodedText(decodedText);
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

export async function startScanner() {
  if (state.isScanning || _starting) return;
  _starting = true;
  _stopRequested = false;
  _handled = false;

  $('extractedCard').classList.add('hidden');
  setScannerUIState(true);

  try {
    await initScanner();
    if (_stopRequested) return;

    const qrboxSize = window.innerWidth < 350 ? 180 : 240;
    await state.html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: { width: qrboxSize, height: qrboxSize } },
      onScanSuccess,
      () => {} // per-frame errors are expected; suppress them
    );

    if (_stopRequested) {          // Stop was pressed while the camera was starting
      try { await state.html5QrCode.stop(); } catch { /* ignore */ }
      return;
    }
    state.isScanning = true;
  } catch (err) {
    console.error('[scanner]', err);
    setScannerUIState(false);
    const libFailed = /Failed to load|is missing|Unknown library/.test(String(err?.message));
    showMessage(t(libFailed ? 'msgLibLoadFailed' : cameraErrorKey(err)), 'error');
  } finally {
    _starting = false;
  }
}

// ─── File Upload ───────────────────────────────────────────

export function initFileUploadListener() {
  $('qrFile').addEventListener('change', onFileChosen);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = url;
  });
}

/**
 * Decode with jsQR on a downscaled copy. A 12–48 MP photo drawn at full size
 * needs hundreds of MB and blocks the main thread; QR codes decode fine at ≤2000 px.
 * Tries each size in IMAGE_SCAN_SIZES (larger first) and skips duplicates.
 */
function decodeWithJsQR(jsQR, img) {
  const w0 = img.naturalWidth;
  const h0 = img.naturalHeight;
  if (!w0 || !h0) return '';

  const canvas = document.createElement('canvas');
  const tried = new Set();
  for (const maxDim of IMAGE_SCAN_SIZES) {
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    if (tried.has(`${w}x${h}`)) continue;
    tried.add(`${w}x${h}`);

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const result = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' });
    if (result?.data) return result.data;
  }
  return '';
}

async function onFileChosen(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;

  $('extractedCard').classList.add('hidden');
  await stopScanner(); // stop live camera if running

  // jsQR via canvas instead of html5-qrcode's scanFile(): createImageBitmap()
  // behaves inconsistently in Firefox, the canvas path works everywhere.
  const url = URL.createObjectURL(file);
  try {
    const [jsQR, img] = await Promise.all([loadLib('jsqr'), loadImage(url)]);
    const text = decodeWithJsQR(jsQR, img);
    if (text) handleDecodedText(text);
    else showMessage(t('msgQrReadError'), 'error');
  } catch (err) {
    console.error('[upload]', err);
    const libFailed = /Failed to load|is missing|Unknown library/.test(String(err?.message));
    showMessage(t(libFailed ? 'msgLibLoadFailed' : 'msgQrReadError'), 'error');
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── Result handling ───────────────────────────────────────

/** Parse decoded QR text and show the result card (or an error toast). */
function handleDecodedText(text) {
  const result = parseUpiText(text);
  if (!result.ok) {
    showMessage(t(result.reason === 'parse' ? 'msgQrParseError' : 'msgQrInvalid'), 'error');
    return;
  }
  renderExtractedCard(result.data, 'scan');
}
