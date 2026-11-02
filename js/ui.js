// ============================================================
// ui.js: Shared UI utilities
// (toast notifications, theme toggle, clipboard, scrolling)
// UPInspect
// ============================================================

import { safeGet, safeSet } from './storage.js';

// ─── Toast ─────────────────────────────────────────────────

let _toastTimer = null;
let _toastHideTimer = null;

/**
 * Show a brief notification toast.
 * @param {string} text
 * @param {'success'|'error'} type
 */
export function showMessage(text, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;

  clearTimeout(_toastTimer);
  clearTimeout(_toastHideTimer);

  el.textContent = text;
  el.className = `toast ${type}`;
  el.style.display = 'block';
  el.style.animation = 'toastIn 0.3s ease forwards';

  _toastTimer = setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    _toastHideTimer = setTimeout(() => { el.style.display = 'none'; }, 300);
  }, 3000);
}

// ─── Clipboard ─────────────────────────────────────────────

/**
 * Copy text to the clipboard (Clipboard API, then execCommand fallback).
 * @returns {Promise<boolean>} whether the copy succeeded
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the legacy path */ }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.readOnly = true;
    ta.className = 'sr-copy';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// ─── Scrolling ─────────────────────────────────────────────

/** scrollIntoView that respects prefers-reduced-motion. */
export function scrollToEl(el, block = 'start') {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block });
}

// ─── Theme ─────────────────────────────────────────────────

const SUN_PATH  = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
const MOON_PATH = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';

/** Sync the theme icon to the current state. */
export function updateThemeIcon(isLight) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.innerHTML = isLight ? SUN_PATH : MOON_PATH;
}

/** Toggle light/dark mode and persist it (soft cross-fade where supported). */
export function toggleTheme() {
  const apply = () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    safeSet('theme', isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
  };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(apply);
  else apply();
}

/** Restore the saved theme on boot, falling back to the OS preference. */
export function restoreTheme() {
  const saved = safeGet('theme');
  const isLight = saved === 'light'
    || (saved !== 'dark' && !!window.matchMedia?.('(prefers-color-scheme: light)').matches);
  document.body.classList.toggle('light', isLight);
  updateThemeIcon(isLight);
}
