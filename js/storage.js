// ============================================================
// storage.js: localStorage that never throws
// UPInspect
//
// localStorage access can throw (blocked cookies, some in-app
// browsers / sandboxed frames). A throw during boot would leave the
// whole UI dead, so every access goes through these wrappers.
// ============================================================

export function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
