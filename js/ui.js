// ============================================================
// ui.js — Shared UI utilities
// (toast notifications, theme toggle)
// UPInspect
// ============================================================

// ─── Toast ─────────────────────────────────────────────────

const toastEl = () => document.getElementById('toast');

/**
 * Show a brief notification toast.
 * @param {string} text
 * @param {'success'|'error'} type
 */
export function showMessage(text, type = 'success') {
  const el = toastEl();
  el.textContent = text;
  el.className = `toast ${type}`;
  el.style.display = 'block';
  el.style.animation = 'toastIn 0.3s ease forwards';

  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => { el.style.display = 'none'; }, 300);
  }, 3000);
}

// ─── Theme ─────────────────────────────────────────────────

const SUN_PATH  = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
const MOON_PATH = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';

/**
 * Sync the theme icon to the current state.
 * @param {boolean} isLight
 */
export function updateThemeIcon(isLight) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.innerHTML = isLight ? SUN_PATH : MOON_PATH;
}

/**
 * Toggle light/dark mode and persist to localStorage.
 */
export function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcon(isLight);
}

/**
 * Restore theme from localStorage on boot, falling back to OS preference.
 */
export function restoreTheme() {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light') {
    document.body.classList.add('light');
    updateThemeIcon(true);
  } else if (savedTheme === 'dark') {
    updateThemeIcon(false);
  } else {
    // No saved preference — honour OS/browser setting
    const osPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (osPrefersLight) {
      document.body.classList.add('light');
      updateThemeIcon(true);
    } else {
      updateThemeIcon(false);
    }
  }
}
