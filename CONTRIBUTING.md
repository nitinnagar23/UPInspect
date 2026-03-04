# Contributing to UPInspect

Thanks for taking the time to contribute! UPInspect is a small, focused tool and we want to keep it that way — privacy-first, fast, and clutter-free.

---

## 🧭 Before You Start

- Check [open issues](https://github.com/nitinnagar23/UPInspect/issues) to avoid duplicate work
- For big changes, open an issue first to discuss the idea before writing code
- For small fixes (typos, locale strings, minor bugs) — just open a PR directly

---

## 🛠️ Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/nitinnagar23/UPInspect.git
cd UPInspect

# 2. Serve locally (ES modules require an HTTP server — file:// won't work)
python3 -m http.server 8080
# or
npx serve .

# 3. Open in browser
http://localhost:8080
```

No build step, no npm install, no bundler. It's plain HTML, CSS, and ES module JS.

---

## 📁 What Lives Where

| Path | What it does |
|---|---|
| `index.html` | Single-page app shell — all views are inline |
| `css/tokens.css` | Design tokens (colours, spacing, fonts) — change here first |
| `js/state.js` | Global state and shared constants |
| `js/main.js` | Boot sequence, URL routing, global function bridge |
| `js/scanner.js` | Camera scanning, torch, file upload via jsQR |
| `js/extractor.js` | Decoded card rendering, editable amount, copy/pay |
| `js/generator.js` | QR card generation, payment link builder |
| `js/share.js` | Native canvas standee export — no html2canvas |
| `js/paylink.js` | Payment link landing page logic |
| `js/i18n.js` | Language system — `t()`, `applyLanguage()`, `getLang()` |
| `js/locales/en.js` | English strings |
| `js/locales/hi.js` | Hindi strings |

---

## 🌍 Adding a New Language

1. Copy `js/locales/en.js` → `js/locales/xx.js` (use ISO 639-1 code)
2. Translate all **values** — never change the **keys**
3. Register in `js/i18n.js`:

```js
import xx from './locales/xx.js';

const LOCALES = { en, hi, xx };
const CYCLE   = ['en', 'hi', 'xx'];
```

4. Add a locale key for the language name if needed (e.g. `txtLangName`)
5. Test by toggling the language button through all cycles

> **Rule:** Never use `state.currentLang === 'en' ? ... : ...` ternaries in JS. Always use `t('key')`. Language state lives in `i18n.js` only.

---

## ✏️ Code Style

- **No build tooling** — keep it vanilla JS ES modules
- **No new dependencies** without discussion — every CDN script is a load-time cost
- **No `parseFloat()` for amounts** — use `Number()` to prevent URI injection
- **Always `encodeURIComponent()`** on user-supplied values placed in URLs or QR strings
- **Always `t('key')`** for any user-facing string — no hardcoded English in JS
- **`type="button"`** on any `<button>` inside a `<form>` that isn't the submit action
- Locale keys follow the prefix convention:
  - `txt` — static display text
  - `msg` — toast / feedback messages
  - `lbl` — form labels
  - `txtFaq` — FAQ entries

---

## 🐛 Reporting Bugs

Open an issue and include:

- Browser and OS (e.g. Firefox 124 on Android 14)
- Steps to reproduce
- What you expected vs what happened
- Console errors if any (DevTools → Console)

UPI ID and payment data are never stored, so feel free to use dummy values like `test@upi` when reporting.

---

## ✅ Pull Request Checklist

Before submitting a PR:

- [ ] Tested in Chrome and Firefox (mobile if possible)
- [ ] Both `en.js` and `hi.js` updated if locale strings were added or changed
- [ ] No hardcoded English strings in JS files
- [ ] No `parseFloat()` used for amount parsing
- [ ] `type="button"` set on non-submit buttons inside forms
- [ ] No new CDN dependencies added without prior discussion
- [ ] `README.md` updated if behaviour or structure changed

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the [GPL-3.0 License](LICENSE).
