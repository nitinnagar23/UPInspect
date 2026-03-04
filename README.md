# 🔍 UPInspect

> **Decode. Verify. Pay Safely.**

A privacy-first UPI QR code inspector and payment link generator.  
Runs 100% locally in the browser — no server, no tracking, no data collection.

🌐 **Live:** [upinspect.pages.dev](https://upinspect.pages.dev)

---

## ✨ What It Does

Most UPI QR scans blindly redirect you to a payment app with no chance to verify the details. UPInspect adds a transparent step in between:

**Scan → Inspect → Choose → Pay**

* **Decode & Inspect** — Extract and view the UPI ID, merchant name, and requested amount from any QR code before paying.
* **Scan or Upload** — Use your device camera for live scanning, or upload a saved QR screenshot from your gallery.
* **Torch Toggle** — Built-in torch control for scanning in low-light environments (on supported devices).
* **Flexible Payments** — Tap "Pay Now" to open your preferred UPI app, or copy the UPI ID for manual high-value transfers.
* **Editable Amount** — Modify the pre-filled amount on scanned QR codes before paying.
* **Create & Share** — Generate custom UPI payment links and professional QR standee cards.
* **Shareable Links** — Every standee share includes a tappable payment link so recipients can pay without scanning.
* **100% On-Device** — Your scanned codes and payment data never leave your browser.

---

## 🛡️ Security First

* **URI injection blocked:** `Number()` (not `parseFloat()`) is used to parse amounts. `Number('100&pa=attacker@upi')` returns `NaN` and is safely rejected.
* **Strict Encoding:** UPI ID and amount are wrapped in `encodeURIComponent()` before being placed in any URI or QR string.
* **Amount validation:** Amounts below ₹1 are silently omitted from QR codes and payment links.
* **No network requests:** All QR decoding, generation, and image export happen entirely on-device.

---

## 🔗 Payment Link URLs

UPInspect uses clean path-based URLs for shareable payment links:

```text
https://upinspect.pages.dev/{upi-id}/{name}/{amount}

# Examples
https://upinspect.pages.dev/rahul@upi/Rahul%20Traders/500
https://upinspect.pages.dev/shop@okaxis/My%20Shop
https://upinspect.pages.dev/pay@upi/500
```

| Segment | Required | Description |
|---|---|---|
| `upi-id` | ✅ | UPI ID (e.g. `name@upi`) — `@` is kept readable |
| `name` | Optional | Merchant or payee name |
| `amount` | Optional | Pre-filled amount in ₹ (numeric segment auto-detected) |

The router auto-detects whether the second segment is a name or an amount, so both `/pa/500` and `/pa/name/500` resolve correctly.

When opened, the link shows a verified payment card with **Pay Now** and **Copy UPI ID** options. No app install required.

---

## 🛠️ Tech Stack

<details>
  <summary><b>Deploying to Cloudflare Pages</b></summary>

  1. Push the repo to GitHub
  2. Connect it to [Cloudflare Pages](https://pages.cloudflare.com)
  3. Set build command to **none**, output directory to **`/`** (repo root)
  4. The `_redirects` file handles SPA routing. Asset directories are passed through first, then payment link paths fall through to `index.html`:

  > *Asset passthrough rules must come before the catch-all rules — Cloudflare matches the first rule that applies.*

</details>

<details>
  <summary><b>Third-Party Libraries</b></summary>

  | Library | Version | Purpose |
  |---|---|---|
  | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | latest | Camera QR scanning |
  | [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | File upload QR decoding (cross-browser, including Firefox) |
  | [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 1.5.0 | Styled QR code canvas rendering |
  | [Google Analytics 4](https://analytics.google.com) | — | Anonymous visitor analytics |

  > **Note on image export:** The standee save/share flow uses native canvas compositing — not `html2canvas`. The card is drawn directly onto a `<canvas>` using the exact colours and layout from `views.css`.

  > **Note on file upload scanning:** File uploads are decoded using `jsQR` directly via `canvas.getImageData()` to ensure cross-browser compatibility, bypassing Firefox's inconsistent `createImageBitmap()` behaviour.

</details>

<details>
  <summary><b>Browser Support</b></summary>

  | Feature | Chrome | Firefox | Safari | Samsung Internet |
  |---|---|---|---|---|
  | QR Camera Scan | ✅ | ✅ | ✅ | ✅ |
  | File Upload Scan | ✅ | ✅ | ✅ | ✅ |
  | Torch Toggle | ✅ | ✅ * | ✅ * | ✅ |
  | Inverted QR (dark mode) | ✅ | ✅ | ✅ | ✅ |
  | Save Image | ✅ | ✅ | ✅ | ✅ |
  | Share with Image | ✅ | ❌ † | ✅ | ✅ |
  | PWA Install | ✅ | ❌ | ✅ | ✅ |
  | OS Theme Detection | ✅ | ✅ | ✅ | ✅ |

  *\* Torch support depends on device hardware capability, not just the browser.*  
  *† Firefox Android does not support file sharing via the Web Share API. Tapping Share downloads the image and opens a text share sheet with the payment link included in the caption.*

</details>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to set up the project locally, project structure, code style guidelines, and how to add support for new languages.

---

## ⚖️ License

This project is licensed under the GPL-3.0 License — see the [LICENSE](LICENSE) file for details.
