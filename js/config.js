// ============================================================
// config.js: Shared constants (no DOM, safe to import anywhere)
// UPInspect
// ============================================================

export const BASE_PAY_URL  = 'https://upinspect.pages.dev';
export const DEFAULT_TITLE = 'UPInspect | Decode. Verify. Pay.';

// Amount limits. Anything outside [MIN_AMOUNT, MAX_AMOUNT] or with more than
// two decimals is rejected (and reported) instead of being silently rounded.
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 1_000_000;

// The QR canvas is rendered at exactly the size it is drawn into the standee
// PNG (200 css px × 3 export scale) so it is never resampled.
export const QR_PX = 600;

// Longest image side (px) tried, in order, when decoding an uploaded image.
export const IMAGE_SCAN_SIZES = [2000, 1000];
