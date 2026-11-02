// ============================================================
// loader.js: On-demand loading of third-party libraries
// UPInspect
//
// Nothing here is needed to paint the first screen (or the payment-link
// page), so the three libraries load only when their feature is used.
// ============================================================

import { LIBS } from './libs.js';

const pending = new Map();

/**
 * Load a library once and resolve with its global.
 * @param {keyof typeof LIBS} name
 */
export function loadLib(name) {
  const lib = LIBS[name];
  if (!lib) return Promise.reject(new Error(`Unknown library "${name}"`));
  if (window[lib.global]) return Promise.resolve(window[lib.global]);
  if (pending.has(name)) return pending.get(name);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = lib.src;
    script.async = true;
    script.crossOrigin = 'anonymous';           // required for SRI on cross-origin files
    if (lib.integrity) script.integrity = lib.integrity;
    script.onload = () => (window[lib.global]
      ? resolve(window[lib.global])
      : reject(new Error(`"${name}" loaded but ${lib.global} is missing`)));
    script.onerror = () => {
      script.remove();
      pending.delete(name);                       // allow a retry
      reject(new Error(`Failed to load "${name}"`));
    };
    document.head.appendChild(script);
  });

  pending.set(name, promise);
  return promise;
}

/** Warm a library in idle time (skipped on Data Saver / slow connections). */
export function warmLib(name) {
  const conn = navigator.connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return;
  const run = () => loadLib(name).catch(() => {});
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}
