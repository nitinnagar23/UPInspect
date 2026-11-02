<p align="center">
  <img src="assets/readme-banner.svg" alt="UPInspect" width="360">
</p>

<p align="center">
  <a href="https://upinspect.pages.dev"><b>Open App</b></a> &nbsp;|&nbsp;
  <a href="#pay-now-declined">Payment Guide</a> &nbsp;|&nbsp;
  <a href="#security">Security</a> &nbsp;|&nbsp;
  <a href="#development">Development</a> &nbsp;|&nbsp;
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/NitinNagar23/UPInspect/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/NitinNagar23/UPInspect/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-1B4FC4"></a>
  <img alt="Languages: English and Hindi" src="https://img.shields.io/badge/languages-EN%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82-0A2463">
</p>

<h3 align="center">Look before you pay.</h3>

<p align="center">
  A privacy-first UPI QR inspector and payment link generator.<br>
  QR codes decode entirely in your browser; your preferred UPI app handles the payment.
</p>

---

## What It Does

Standard UPI QR scans trigger payment apps immediately without displaying underlying parameters. UPInspect adds an inspection layer in between: **Scan &rarr; Inspect &rarr; Choose &rarr; Pay**.

* **Decode & Inspect:** Review raw UPI ID, payee name, and requested amount before opening your payment app.
* **Scan or Upload:** Real-time camera feed (with torch toggle) or instant file upload for saved screenshots.
* **Adjustable Amounts:** Modify or clear pre-filled amounts prior to handoff.
* **Flexible Execution:** Tap **Pay Now** for deep-link handoff, or **Copy UPI ID** for manual transfer.
* **Standee & Link Generator:** Generate custom UPI payment links and printable QR cards directly in-browser.
* **Client-Side Decoding:** Scanned QR codes are decoded on your device and never uploaded.
* **Bilingual & Themed:** Full English and Hindi support with automatic light/dark theming.

---

## Pay Now Declined?

Some payment providers decline external intent links as an anti-fraud measure. If **Pay Now** fails:

1. Tap **Copy UPI ID** on the inspection card.
2. Open your UPI app (Google Pay, PhonePe, Paytm, or BHIM).
3. Search or navigate to **Pay to UPI ID / Bank**, paste the address, and verify the name.
4. Enter the verified amount and approve with your UPI PIN.

*Note: Typing the ID in yourself is a normal in-app payment, so link and QR caps (such as the ₹2,000 limit some apps apply) usually do not apply. Your own bank and UPI app limits still do.*

---

## Security

* **Payload Integrity:** Amounts must be plain decimals from ₹1 to ₹10,00,000 with up to 2 decimal places. Malformed inputs (`10.999`, `1e21`, or parameter injections) are rejected and surfaced visually.
* **Strict Parameter Sanitation:** All outgoing strings are strictly URI-encoded. Allow-listed merchant keys (`tr`, `tn`, `mc`, `sign`) are preserved; unrecognised parameters are discarded.
* **Explicit Visual Cautions:** Displays clear "Name not verified" badges and warns against zero-width unicode, bidi spoofing, or duplicated query fields.
* **Hardened Headers:** Strict CSP with no inline script execution (the single analytics snippet is allowed by hash) and framing restrictions. Third-party libraries are version-pinned; run `npm run vendor` to self-host them with SRI hashes.

---

## Shareable Payment URLs

UPInspect parses clean, path-based URL routes without requiring app installation:

```text
https://upinspect.pages.dev/{upi-id}/{name}/{amount}
```

* `https://upinspect.pages.dev/merchant@upi/Sample%20Store/500` (Full payment prompt)
* `https://upinspect.pages.dev/merchant@upi/Sample%20Store` (Open amount)
* `https://upinspect.pages.dev/pay@upi/500` (Direct amount request)
* `https://upinspect.pages.dev/merchant@upi/786/-` (Numeric merchant name without amount)

---

## Development

UPInspect runs natively without a build compilation step:

```bash
# Run unit and static test suite (node:test)
npm test

# Run ESLint
npm run lint

# Self-host vendor scripts & refresh SRI hashes
npm run vendor

# Start a local preview server
npm run serve
```

* **Core logic:** Pure functions in `js/upi.js` handle parsing and URI sanitisation.
* **Routing:** `_redirects` handles SPA path resolution on Cloudflare Pages.
* **Offline capability:** `sw.js` caches application shells for offline scanning.

---

## Contributing

Contributions are welcome. See the [Contributing Guide](CONTRIBUTING.md) for setup, project structure and how to add a language.

---

## License

Distributed under the [GPL-3.0 License](LICENSE).
