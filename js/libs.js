// ============================================================
// libs.js: Third-party libraries (lazy-loaded, see loader.js)
// UPInspect
//
// Versions are pinned. `npm run vendor` downloads each `cdn` file into
// /vendor, computes its SRI hash and rewrites this file so that `src`
// points at the self-hosted copy with `integrity` set.
// ============================================================

export const LIBS = {
  html5qrcode: {
    cdn:       'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
    src:       'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
    integrity: '',
    global:    'Html5Qrcode',
  },
  jsqr: {
    cdn:       'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
    src:       'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
    integrity: '',
    global:    'jsQR',
  },
  qrcodestyling: {
    cdn:       'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js',
    src:       'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js',
    integrity: '',
    global:    'QRCodeStyling',
  },
};
