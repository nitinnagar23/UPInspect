// ============================================================
// share.js: Standee export via native canvas compositing
// UPInspect
//
// Draws the complete standee card natively on <canvas> using
// hardcoded layout constants that mirror views.css exactly.
// The QR canvas is composited with ctx.drawImage() at 1:1 (it is
// rendered at the size it is drawn), so there is no resampling blur.
// html2canvas is intentionally NOT used (re-rasterises fonts).
//
// The PNG is rendered once, right after the QR is generated, so
// Save/Share are instant and navigator.share() still runs inside the
// user's tap (it is rejected once the gesture has expired).
// ============================================================

import { state }                from './state.js';
import { showMessage }          from './ui.js';
import { t }                    from './i18n.js';
import { BASE_PAY_URL }         from './config.js';
import { buildPayLink, formatAmount } from './upi.js';

const $ = id => document.getElementById(id);

// ─── Canvas renderer ───────────────────────────────────────

/** Canvas text does not trigger web-font loading: request the faces we draw with. */
async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('800 20px "Bricolage Grotesque"'),
      document.fonts.load('700 15px "Bricolage Grotesque"'),
      document.fonts.load('600 13px "JetBrains Mono"'),
      document.fonts.load('400 10px "JetBrains Mono"'),
      document.fonts.load('700 19px "Instrument Sans"'),
      document.fonts.load('600 12px "Instrument Sans"'),
    ]);
    await document.fonts.ready;
  } catch { /* fall back to the system fonts in the font stacks */ }
}

/**
 * @param {{ pa: string, pn: string, am: string }} data  validated standee values
 * @param {HTMLCanvasElement} qrCanvas
 * @returns {Promise<Blob>}
 */
async function renderStandeeBlob(data, qrCanvas) {
  const name   = data.pn || t('txtStandeeDefault');
  const upiId  = data.pa;
  const amount = formatAmount(data.am);

  await ensureFonts();

  const SCALE = 3;
  const CW    = 320 * SCALE;
  const PAD   = 24  * SCALE;
  const RADIUS = 16 * SCALE;

  // ── Row heights (mirrors views.css) ──────────────────
  const LOGO_H    = 24 * SCALE;
  const LOGO_MB   = 16 * SCALE;
  const NAME_H    = 30 * SCALE;
  const UPI_H     = 20 * SCALE;
  const AMT_H     = amount ? 28 * SCALE : 0;
  const AMT_GAP   = amount ? 8  * SCALE : 0;
  const HDR_MB    = 16 * SCALE;
  const QR_PAD    = 10 * SCALE;
  const QR_SIZE   = 200 * SCALE;
  const QR_WRAP_H = QR_SIZE + QR_PAD * 2;
  const FOOTER_MB = 20 * SCALE;
  const FOOTER_PT = 14 * SCALE;
  const APPS_H    = 18 * SCALE;
  const SCAN_H    = 20 * SCALE;
  const URL_H     = 16 * SCALE;  // website line
  const URL_MT    =  8 * SCALE;  // margin-top above URL
  const TEXT_W    = CW - PAD * 2;

  const CH = PAD + LOGO_H + LOGO_MB
           + NAME_H + 6 * SCALE + UPI_H + AMT_GAP + AMT_H
           + HDR_MB + QR_WRAP_H
           + FOOTER_MB + FOOTER_PT + APPS_H + 6 * SCALE + SCAN_H
           + URL_MT + URL_H
           + PAD;

  const cv  = document.createElement('canvas');
  cv.width  = CW;
  cv.height = CH;
  const ctx = cv.getContext('2d');

  // ── Card background + border ─────────────────────────
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, 0, 0, CW, CH, RADIUS); ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 1 * SCALE;
  roundRectPath(ctx, 0, 0, CW, CH, RADIUS); ctx.stroke();

  let y = PAD;

  // ── Logo row ─────────────────────────────────────────
  const ICON  = 24 * SCALE;
  ctx.font = `700 ${Math.round(15 * SCALE)}px "Bricolage Grotesque",sans-serif`;
  const textW = ctx.measureText('UPInspect').width;
  const gap   = 7 * SCALE;
  const rowW  = ICON + gap + textW;
  const rowX  = (CW - rowW) / 2;

  // Brand box: gradient #0A2463→#1B4FC4, rx=(10/36)×ICON; matches favicon.svg exactly
  const grad = ctx.createLinearGradient(rowX, y, rowX + ICON, y + ICON);
  grad.addColorStop(0, '#0A2463');
  grad.addColorStop(1, '#1B4FC4');
  ctx.fillStyle = grad;
  roundRectPath(ctx, rowX, y, ICON, ICON, Math.round(10 / 36 * ICON)); ctx.fill();
  drawIcon(ctx, rowX, y, ICON);

  // Brand name: 'UP' full opacity, 'Inspect' at 70%; mirrors .standee-brand-name
  const textY    = y + ICON / 2;
  const textLeft = rowX + ICON + gap;
  ctx.font         = `700 ${Math.round(15 * SCALE)}px "Bricolage Grotesque",sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  const upW = ctx.measureText('UP').width;
  ctx.fillStyle = '#0A2463';
  ctx.fillText('UP', textLeft, textY);
  ctx.fillStyle = 'rgba(10,36,99,0.7)';
  ctx.fillText('Inspect', textLeft + upW, textY);

  y += LOGO_H + LOGO_MB;

  // ── Merchant name ────────────────────────────────────
  ctx.fillStyle    = '#1E3A8A';
  ctx.font         = `800 ${Math.round(20 * SCALE)}px "Bricolage Grotesque",sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ellipsis(ctx, name, TEXT_W), CW / 2, y);
  y += NAME_H + 6 * SCALE;

  // ── UPI ID ───────────────────────────────────────────
  ctx.fillStyle = '#64748B';
  ctx.font      = `600 ${Math.round(13.1 * SCALE)}px "JetBrains Mono",monospace`;
  ctx.fillText(ellipsis(ctx, upiId, TEXT_W), CW / 2, y);
  y += UPI_H;

  // ── Amount (optional) ────────────────────────────────
  if (amount) {
    y += AMT_GAP;
    ctx.fillStyle = '#0F172A';
    ctx.font      = `700 ${Math.round(19.2 * SCALE)}px "Instrument Sans",sans-serif`;
    ctx.fillText(amount, CW / 2, y);
    y += AMT_H;
  }

  y += HDR_MB;

  // ── QR wrapper box ───────────────────────────────────
  const qw = QR_SIZE + QR_PAD * 2;
  const qx = (CW - qw) / 2;

  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, qx, y, qw, QR_WRAP_H, 12 * SCALE); ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth   = 2 * SCALE;
  roundRectPath(ctx, qx, y, qw, QR_WRAP_H, 12 * SCALE); ctx.stroke();

  // QR pixels: canvas is QR_SIZE wide, so this is a 1:1 copy
  ctx.drawImage(qrCanvas, qx + QR_PAD, y + QR_PAD, QR_SIZE, QR_SIZE);

  y += QR_WRAP_H + FOOTER_MB;

  // ── Dashed divider ───────────────────────────────────
  ctx.setLineDash([6 * SCALE, 4 * SCALE]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 2 * SCALE;
  ctx.beginPath();
  ctx.moveTo(PAD, y); ctx.lineTo(CW - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += FOOTER_PT;

  // ── UPI apps line ────────────────────────────────────
  ctx.fillStyle    = '#64748B';
  ctx.font         = `600 ${Math.round(12 * SCALE)}px "Instrument Sans",sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';
  ctx.fillText(ellipsis(ctx, t('txtUpiApps'), TEXT_W), CW / 2, y);
  y += APPS_H + 6 * SCALE;

  // ── Scan prompt (translations can be longer than English) ──
  ctx.fillStyle = '#10B981';
  ctx.font      = `700 ${Math.round(14.1 * SCALE)}px "Instrument Sans",sans-serif`;
  ctx.fillText(ellipsis(ctx, t('txtScanPrompt'), TEXT_W), CW / 2, y);
  y += SCAN_H + URL_MT;

  // ── Website URL ──────────────────────────────────────
  ctx.fillStyle = '#94A3B8';
  ctx.font      = `400 ${Math.round(10 * SCALE)}px "JetBrains Mono",monospace`;
  ctx.fillText(new URL(BASE_PAY_URL).host, CW / 2, y);

  return new Promise((resolve, reject) =>
    cv.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
  );
}

// ─── Helpers ───────────────────────────────────────────────

/** Clip text with an ellipsis if it exceeds maxWidth pixels. */
function ellipsis(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) {
    out = out.slice(0, -1);
  }
  return out + '…';
}

/** Append a rounded rectangle to the current path (polyfill where roundRect is missing). */
function addRoundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

/** Begin a new rounded-rect path. */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  addRoundRect(ctx, x, y, w, h, r);
}

/**
 * Draw the UPInspect glyph (QR finder squares + magnifier) on a 36-unit grid.
 * Mirrors assets/favicon/favicon.svg and the inline SVGs in index.html.
 * tests/html.test.js checks the SVG copies; keep these numbers in sync by hand.
 */
function drawIcon(ctx, bx, by, size) {
  const k = size / 36;
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(k, k);

  // Finder squares: 10×10 with a 4×4 hole (even-odd), like the SVG paths
  ctx.fillStyle = '#FFFFFF';
  for (const [x, y] of [[6, 6], [20, 6], [6, 20]]) {
    ctx.beginPath();
    addRoundRect(ctx, x, y, 10, 10, 2.6);
    addRoundRect(ctx, x + 3, y + 3, 4, 4, 1.1);
    ctx.fill('evenodd');
  }

  // Magnifier: lens ring + handle
  ctx.strokeStyle = '#00E5A0';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.arc(25, 25, 4.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.9;
  ctx.beginPath();
  ctx.moveTo(28.4, 28.4);
  ctx.lineTo(31.3, 31.3);
  ctx.stroke();

  // One data module inside the lens
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  addRoundRect(ctx, 23.7, 23.7, 2.6, 2.6, 0.7);
  ctx.fill();

  ctx.restore();
}

// ─── Pre-rendering ─────────────────────────────────────────

/** Render the standee PNG now and keep the promise for Save/Share. */
export function prerenderStandee() {
  const data = state.standee.data;
  const qrCanvas = $('cardQrCode')?.querySelector('canvas');
  if (!data || !qrCanvas) {
    state.standee.blobPromise = null;
    return;
  }
  const promise = renderStandeeBlob(data, qrCanvas);
  promise.catch(() => {});            // surfaced when Save/Share awaits it
  state.standee.blobPromise = promise;
}

/** After a language switch: translate the standee text and re-render the PNG. */
export function refreshStandee() {
  const data = state.standee.data;
  if (!data) return;
  if (!data.pn) $('standeeName').textContent = t('txtStandeeDefault');
  prerenderStandee();
}

async function getStandeeBlob() {
  if (!state.standee.blobPromise) prerenderStandee();
  if (!state.standee.blobPromise) throw new Error('No standee has been generated yet.');
  try {
    return await state.standee.blobPromise;
  } catch {
    prerenderStandee();               // one retry with a fresh render
    return await state.standee.blobPromise;
  }
}

// ─── Download ──────────────────────────────────────────────

export async function downloadStandee() {
  const btn = $('btnDownload');
  if (btn) btn.disabled = true;

  try {
    const blob = await getStandeeBlob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: 'UPInspect-QR.png',
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking immediately can cancel the download in Safari/Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    showMessage(t('msgImageSaved'), 'success');
  } catch (e) {
    console.error('Download error:', e);
    showMessage(t('msgDownloadFailed'), 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ─── Share ─────────────────────────────────────────────────

export async function shareStandee() {
  const btn = $('btnShare');
  if (btn) btn.disabled = true;

  try {
    const data = state.standee.data;
    if (!data) return;

    const blob = await getStandeeBlob();
    const file = new File([blob], 'UPInspect-QR.png', { type: 'image/png' });

    // Caption comes from the validated values, never from translated DOM text.
    const title = t('shareTitle', { to: data.pn || data.pa }) + (data.am ? ` ${formatAmount(data.am)}` : '');
    const text  = t('shareCaption', { title, link: buildPayLink(data), site: BASE_PAY_URL });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      // Supports image sharing (Chrome Android, iOS Safari): share with image
      await navigator.share({ title, text, files: [file] });
    } else if (navigator.share) {
      // Share API exists but no file support (Firefox Android): download + share text
      await downloadStandee();
      await navigator.share({ title, text });
    } else {
      // No share API (desktop): just download
      await downloadStandee();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showMessage(t('msgShareFailed'), 'error');
    }
  } finally {
    if (btn) btn.disabled = false;      // runs on every path, including early returns
  }
}
