// ============================================================
// state.js — Shared application state & constants
// UPInspect
// ============================================================

export const BASE_PAY_URL = "https://upinspect.pages.dev";

// Strict UPI ID format: localpart@provider (provider must be letters only)
export const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;

export const state = {
  isPaymentLinkMode: false,
  isScanning:        false,
  rawAmountVal:      '',
  html5QrCode:       null,
};
