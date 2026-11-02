// ============================================================
// state.js: Shared application state
// UPInspect
// ============================================================

export const state = {
  isPaymentLinkMode: false,
  isScanning:        false,
  html5QrCode:       null,

  // The single source of truth for what is shown in the result card:
  // { pa, pn, am, extras, warnings, mode: 'scan' | 'link' }
  // (see upi.js). The DOM is never read back to build a payment link.
  current: null,

  // Last generated standee: the validated form values and the pre-rendered PNG.
  standee: { data: null, blobPromise: null },
};
