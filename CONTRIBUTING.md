# Contributing to UPInspect

Thanks for taking the time to contribute! UPInspect is a small, focused tool and we want to keep it that way: privacy-first, fast, and clutter-free.

---

## 🧭 Before You Start

- Check [open issues](https://github.com/nitinnagar23/UPInspect/issues) to avoid duplicate work
- For big changes, open an issue first to discuss the idea before writing code
- For small fixes (typos, locale strings, minor bugs), just open a PR directly

---

## 🛠️ Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/nitinnagar23/UPInspect.git
cd UPInspect

# 2. Serve locally (ES modules require an HTTP server, so file:// won't work)
python3 -m http.server 8080
# or
npx serve .

# 3. Open in browser
http://localhost:8080
```

The **app** has no build step, no bundler and no runtime dependencies. It's plain HTML, CSS, and ES module JS. `npm install` is only needed for linting (`npm run lint`); `npm test` works with Node ≥ 20 alone.

---

## 📁 What Lives Where

| Path | What it does |
|---|---|
| `index.html` | Single-page app shell, all views are inline. No inline `onclick`/`style` (CSP) |
| `css/tokens.css` | Design tokens: ink (dark) and paper (light) palettes, type, radii, motion. Change here first |
| `css/layout.css`, `components.css`, `views.css`, `animations.css` | Shell + wide layout, components, screens, motion (all behind `prefers-reduced-motion`) |
| `js/config.js` | Shared constants (base URL, amount limits, QR size) |
| `js/upi.js` | **Pure** UPI logic: parse/validate/build URIs and payment links. Fully unit-tested |
| `js/state.js` | Global state. `state.current` is the single source of truth for the result card |
| `js/main.js` | Boot sequence, `data-action` event delegation, URL routing |
| `js/router.js` | View / tab switching, leaving the payment-link page |
| `js/loader.js`, `js/libs.js` | On-demand loading of third-party libraries (pinned versions + SRI) |
| `js/scanner.js` | Camera scanning, torch, image upload (downscaled) via jsQR |
| `js/extractor.js` | Result card rendering, warnings, editable amount, copy/pay |
| `js/generator.js` | QR card generation, payment link builder |
| `js/share.js` | Native canvas standee export (pre-rendered), save and share |
| `js/paylink.js` | Payment link landing page logic |
| `js/i18n.js` | Language system: `t()`, `applyLanguage()`, `setLanguage()`; locales load lazily |
| `js/storage.js` | `localStorage` wrappers that never throw |
| `js/locales/en.js`, `hi.js` | UI strings |
| `sw.js` | Service worker (offline app shell). Hosts it fetches must also be in the CSP `connect-src` in `_headers` (a test checks this) |
| `_headers`, `_redirects` | Cloudflare Pages headers (CSP) and routing |
| `assets/` | Favicons, `social-preview.png` (1280x640, upload it in the GitHub repo settings) and `readme-banner.svg` |
| `tests/` | `node --test` suites; `scripts/vendor.mjs` self-hosts libs/fonts |


---

## 🎨 Design Rules

- **One accent.** Mint (`--accent`) fills only the primary action. Amber (`--warn-text`) means "look twice"; red (`--danger`) is for errors only.
- **Use tokens, never raw hex**, in CSS. `tests/contrast.test.js` checks every text/surface pair in both themes against WCAG AA. Add new pairs there.
- **Fonts:** Bricolage Grotesque (headings, numerals in the brand), Instrument Sans (UI), JetBrains Mono (UPI IDs, amounts). The standee export in `js/share.js` uses the same faces.
- **Line icons only** (24px grid, 1.8 stroke, `currentColor`). No emoji in the UI (tests enforce this).
- **Mobile first**, wide layout from 900px. Test 320px and Hindi, because labels get longer.
- **Motion** is decoration: it must be skippable. Put keyframes in `animations.css`; the reduced-motion block there switches everything off.

---

## 🌍 Adding a New Language

1. Copy `js/locales/en.js` → `js/locales/xx.js` (use ISO 639-1 code)
2. Translate all **values**. Never change the **keys** or the `{placeholders}`
3. Register in `js/i18n.js` (locales are loaded lazily):

```js
const LOADERS = {
  hi: () => import('./locales/hi.js'),
  xx: () => import('./locales/xx.js'),
};
const CYCLE = ['en', 'hi', 'xx'];
```

4. Add `/js/locales/xx.js` to the `PRECACHE` list in `sw.js`
5. Run `npm test`: `tests/i18n.test.js` fails if keys or placeholders differ from `en.js`
6. Test by toggling the language button through all cycles

> **Rule:** Never use `state.currentLang === 'en' ? ... : ...` ternaries in JS. Always use `t('key')`. Language state lives in `i18n.js` only.

---

## ✏️ Code Style

- **No build tooling for the app**: keep it vanilla JS ES modules
- **No new third-party dependencies** without discussion: add them to `js/libs.js` with an **exact version**, load them through `loadLib()` (never a `<script>` tag), and run `npm run vendor`
- **All UPI logic goes in `js/upi.js`** (pure, tested). Never build `upi://` strings or payment links by hand elsewhere
- **Amounts:** go through `classifyAmount()` / `normalizeAmount()`, never `parseFloat()`/`Number()` on user input, never display a value different from the one that is sent
- **Always `encodeURIComponent()`** on values placed in URLs or QR strings (`buildUpiUri` / `buildPayLink` already do)
- **No inline event handlers or `style=""`** (the CSP forbids them): use `data-action="name"` + an entry in `ACTIONS` in `main.js`, and CSS classes
- **No bare `localStorage`**: use `safeGet`/`safeSet` from `storage.js`
- **Always `t('key')`** for any user-facing string, with no hardcoded English in JS
- **Wrap awaited UI work in `try/finally`** so buttons are always re-enabled
- **No em dashes** in code, comments, docs or UI strings (`tests/no-emdash.test.js` enforces this). Use a comma, colon, period or parentheses
- Run `npm test` (and `npm run lint`) before opening a PR

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
- [ ] `npm test` passes (and `npm run lint` if you ran `npm install`)
- [ ] Amounts go through `classifyAmount()`/`normalizeAmount()` (no `parseFloat()`)
- [ ] No inline `onclick`/`style=""`: use `data-action` and CSS classes
- [ ] `type="button"` set on non-submit buttons inside forms
- [ ] No new CDN dependencies added without prior discussion
- [ ] `README.md` updated if behaviour or structure changed

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the [GPL-3.0 License](LICENSE).
