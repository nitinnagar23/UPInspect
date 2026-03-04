// ============================================================
// share.js — Standee export via native canvas compositing
// UPInspect
//
// Draws the complete standee card natively on <canvas> using
// hardcoded layout constants that mirror views.css exactly.
// The QR is composited via ctx.drawImage() — same-origin,
// reads all 1200×1200 native pixels, zero upscaling, zero blur.
// html2canvas is intentionally NOT used (re-rasterises fonts).
// ============================================================

import { showMessage }         from './ui.js';
import { t }                   from './i18n.js';
import { BASE_PAY_URL }        from './state.js';

const $ = id => document.getElementById(id);

// ─── Canvas renderer ───────────────────────────────────────

async function getCardBlob() {
  const name     = $('standeeName').textContent.trim()  || t('txtStandeeDefault');
  const upiId    = $('standeeUpiId').textContent.trim();
  const amount   = $('standeeAmount').textContent.trim();
  const qrCanvas = $('cardQrCode').querySelector('canvas');

  if (!qrCanvas) throw new Error('QR canvas not found — generate a QR first.');

  // Wait for web fonts so fillText() uses the correct typeface
  await document.fonts.ready;

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
  const URL_H     = 16 * SCALE;  // upinspect.pages.dev line
  const URL_MT    =  8 * SCALE;  // margin-top above URL

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
  rr(ctx, 0, 0, CW, CH, RADIUS); ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 1 * SCALE;
  rr(ctx, 0, 0, CW, CH, RADIUS); ctx.stroke();

  let y = PAD;

  // ── Logo row ─────────────────────────────────────────
  const ICON  = 24 * SCALE;
  ctx.font = `700 ${Math.round(14.4 * SCALE)}px "Space Mono",monospace`;
  const textW = ctx.measureText('UPInspect').width;
  const gap   = 7 * SCALE;
  const rowW  = ICON + gap + textW;
  const rowX  = (CW - rowW) / 2;

  // Brand box: gradient #0A2463→#1B4FC4, rx=(10/36)×ICON — matches favicon.svg exactly
  const grad = ctx.createLinearGradient(rowX, y, rowX + ICON, y + ICON);
  grad.addColorStop(0, '#0A2463');
  grad.addColorStop(1, '#1B4FC4');
  ctx.fillStyle = grad;
  rr(ctx, rowX, y, ICON, ICON, Math.round(10 / 36 * ICON)); ctx.fill();
  drawIcon(ctx, rowX, y, ICON);

  // Brand name: 'UP' full opacity, 'Inspect' at 70% — mirrors .standee-brand-name
  const textY    = y + ICON / 2;
  const textLeft = rowX + ICON + gap;
  ctx.font         = `700 ${Math.round(14.4 * SCALE)}px "Space Mono",monospace`;
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
  ctx.font         = `800 ${Math.round(20 * SCALE)}px "DM Sans",sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ellipsis(ctx, name, CW - PAD * 2), CW / 2, y);
  y += NAME_H + 6 * SCALE;

  // ── UPI ID ───────────────────────────────────────────
  ctx.fillStyle = '#64748B';
  ctx.font      = `600 ${Math.round(13.1 * SCALE)}px "Space Mono",monospace`;
  ctx.fillText(ellipsis(ctx, upiId, CW - PAD * 2), CW / 2, y);
  y += UPI_H;

  // ── Amount (optional) ────────────────────────────────
  if (amount) {
    y += AMT_GAP;
    ctx.fillStyle = '#0F172A';
    ctx.font      = `800 ${Math.round(19.2 * SCALE)}px "DM Sans",sans-serif`;
    ctx.fillText(amount, CW / 2, y);
    y += AMT_H;
  }

  y += HDR_MB;

  // ── QR wrapper box ───────────────────────────────────
  const qx = (CW - QR_SIZE - QR_PAD * 2) / 2;
  const qw  = QR_SIZE + QR_PAD * 2;

  ctx.fillStyle = '#FFFFFF';
  rr(ctx, qx, y, qw, QR_WRAP_H, 12 * SCALE); ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth   = 2 * SCALE;
  rr(ctx, qx, y, qw, QR_WRAP_H, 12 * SCALE); ctx.stroke();

  // QR pixels — reads all 1200×1200 native canvas pixels directly
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
  ctx.font         = `600 ${Math.round(12 * SCALE)}px "DM Sans",sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';
  ctx.fillText($('txtUpiApps').textContent.trim(), CW / 2, y);
  y += APPS_H + 6 * SCALE;

  // ── Scan prompt ──────────────────────────────────────
  ctx.fillStyle = '#10B981';
  ctx.font      = `700 ${Math.round(14.1 * SCALE)}px "DM Sans",sans-serif`;
  ctx.fillText($('txtScanPrompt').textContent.trim(), CW / 2, y);
  y += SCAN_H + URL_MT;

  // ── Website URL ──────────────────────────────────────
  ctx.fillStyle = '#94A3B8';
  ctx.font      = `400 ${Math.round(10 * SCALE)}px "Space Mono",monospace`;
  ctx.fillText('upinspect.pages.dev', CW / 2, y);

  return new Promise((resolve, reject) =>
    cv.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png')
  );
}

// ─── Helpers ───────────────────────────────────────────────

/** Clip text with ellipsis if it exceeds maxWidth pixels. */
function ellipsis(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) {
    out = out.slice(0, -1);
  }
  return out + '…';
}

/** Draw the UPInspect QR-corner icon inside the brand icon box. */
function drawIcon(ctx, bx, by, size) {
  const iconPx  = size * (20 / 36);
  const offset  = size * (8  / 36);
  const sc      = iconPx / 24;

  ctx.save();
  ctx.translate(bx + offset, by + offset);

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = Math.max(1, 2 * sc);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  [[3, 3], [14, 3], [3, 14]].forEach(([sx, sy]) => {
    const px = sx * sc, py = sy * sc, sw = 7 * sc, rx = 1.5 * sc;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(px, py, sw, sw, rx)
      : rrPath(ctx, px, py, sw, sw, rx);
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.moveTo(14 * sc, 14 * sc); ctx.lineTo(17 * sc, 14 * sc);
  ctx.moveTo(17 * sc, 14 * sc); ctx.lineTo(17 * sc, 17 * sc);
  ctx.moveTo(17 * sc, 14 * sc); ctx.lineTo(21 * sc, 18 * sc);
  ctx.stroke();

  ctx.restore();
}

function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

/** roundRect with polyfill for older browsers. */
function rr(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }
}

// ─── Download ──────────────────────────────────────────────

export async function downloadStandee() {
  const btn = $('btnDownload');
  if (btn) btn.disabled = true;

  try {
    const blob = await getCardBlob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: 'UPInspect-QR.png',
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(t('msgImageSaved'), 'success');
  } catch (e) {
    console.error('Download error:', e);
    showMessage(t('msgDownloadFailed'), 'error');
  }

  if (btn) btn.disabled = false;
}

// ─── Share ─────────────────────────────────────────────────

export async function shareStandee() {
  const btn = $('btnShare');
  if (btn) btn.disabled = true;

  try {
    const blob = await getCardBlob();
    const file = new File([blob], 'UPInspect-QR.png', { type: 'image/png' });

    // Build caption
    const shareName   = $('standeeName').textContent.trim();
    const shareAmount = $('standeeAmount').textContent.trim();
    const shareUpiId  = $('standeeUpiId').textContent.trim();

    const payLine = shareName && shareName !== 'UPI Payment'
      ? `Pay ${shareName}${shareAmount ? ' ' + shareAmount : ''}`
      : `Pay ${shareUpiId}${shareAmount ? ' ' + shareAmount : ''}`;

    // Payment link — always included in caption
    const rawAm = shareAmount.replace('₹', '').trim();
    const amNum = Number(rawAm);
    let paymentLink = `${BASE_PAY_URL}/${shareUpiId.replace(/[/?#\[\]!$&'()*+,;=%]/g, encodeURIComponent)}`;
    if (shareName && shareName !== 'UPI Payment') paymentLink += `/${encodeURIComponent(shareName)}`;
    if (rawAm && !isNaN(amNum) && amNum >= 1)      paymentLink += `/${encodeURIComponent(String(amNum))}`;

    const caption = `${payLine}\n\n🔗 Pay here: ${paymentLink}\n\nCreate Your Own Custom UPI QR Code and Shareable Payment Link on https://upinspect.pages.dev`;

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      // Supports image sharing (Chrome Android, iOS Safari) — share with image
      await navigator.share({ title: payLine, text: caption, files: [file] });
    } else if (navigator.share) {
      // Share API exists but no file support (Firefox Android) — download + share text
      await downloadStandee();
      await navigator.share({ title: payLine, text: caption });
    } else {
      // No share API (desktop) — just download
      await downloadStandee();
      return;
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showMessage(t('msgShareFailed'), 'error');
    }
  }

  if (btn) btn.disabled = false;
}
