// ============================================================
// locales/en.js: English translations
// UPInspect
// ============================================================

export default {
  // ── Meta ────────────────────────────────────────────────
  langLabel: 'हिं',            // label shown on the toggle button (the OTHER lang)
  langName:  'English',

  // ── Home: Hero ──────────────────────────────────────────
  txtHeroTitle:     'Look before',
  txtHeroLine2:     'you pay.',
  txtHeroSub:       'Decode any UPI QR and see exactly who gets your money before your bank app opens.',

  // ── Home: CTA Buttons ───────────────────────────────────
  txtCtaScanTitle:  'Scan a QR',
  txtCtaCreateTitle:'Create link',
  txtHomeUpload:    'Upload image',

  // ── Home: how it works ──────────────────────────────────
  txtStepsLabel:    'What you see before you pay',
  txtStep1Title:    'Decode',
  txtStep1Desc:     'The UPI ID, name and amount, straight from the QR.',
  txtStep2Title:    'Inspect',
  txtStep2Desc:     'Look-alike IDs, hidden characters, odd amounts.',
  txtStep3Title:    'Pay',
  txtStep3Desc:     'Your UPI app opens only when you choose.',

  // ── Scan view ───────────────────────────────────────────
  txtScanHint:      'Point at a UPI QR code',
  txtNameUnverified:'Name not verified',

  // ── Home: Core Capabilities ─────────────────────────────

  // ── Home: Trust card ────────────────────────────────────
  txtTrustTitle:    'Decoded on your device',
  txtTrustDesc:     'QR codes are read in your browser and never uploaded. Your own UPI app makes the actual payment.',

  // ── Bottom Nav ──────────────────────────────────────────
  txtNavHome:  'Home',
  txtNavTools: 'Tools',
  txtNavAbout: 'About',

  // ── Tools: Tab labels ───────────────────────────────────
  txtTabScan:   'Scan & Pay',
  txtTabCreate: 'Create Links & QR',

  // ── Tools: Scanner ──────────────────────────────────────
  txtStartCam:  'Scan QR',
  txtStopCam:   'Stop',
  txtUploadImg: 'Upload QR',

  // ── Tools: Create form ──────────────────────────────────
  txtLabelUpiId:  'UPI ID',
  txtLabelName:   'Merchant Name',
  txtLabelAmount: 'Amount',
  txtOptional:    'Optional',
  txtGenQR:       'Generate QR Card',
  txtGenLinkBtn:  'Copy Link',

  // ── Standee card ────────────────────────────────────────
  txtUpiApps:      'GPay • PhonePe • Paytm • BHIM',
  txtScanPrompt:   'Scan to pay with any UPI app',
  txtStandeeDefault: 'UPI Payment',

  // ── Create form: placeholders & busy state ──────────────
  phUpiId:        'e.g., name@upi',
  phName:         'e.g., Sample Store',
  phAmount:       '0.00',
  txtGenerating:  'Generating…',

  // ── Standee actions ─────────────────────────────────────
  txtDownload: 'Save Image',
  txtShareGen: 'Share',

  // ── Extracted / verified card ───────────────────────────
  extractTitle:      'QR Decoded',
  txtPaymentRequest: 'Payment Request',
  lblUpi:      'UPI ID',
  lblMerchant: 'Merchant',
  txtEditAmount:       'Edit',
  txtConfirmAmt:       'Confirm',
  txtCancelEdit:       'Cancel',
  lblAmount:   'Amount',
  txtCopy:     'Copy UPI ID',
  txtPay:      'Pay Now',
  txtUnverifiedNote: 'The merchant name comes from the QR code or link and is not verified. Check the UPI ID before you pay.',

  // ── Result card: "Pay Now declined?" tip ───────────────
  txtPayHelpTitle: 'Pay Now declined by your UPI app?',
  txtPayHelpBody:  'Some UPI apps block payments that start from a link, to stop fraud. Tap Copy UPI ID, paste it in your payment app and enter the amount yourself. This also avoids link caps like ₹2,000. Your own account limit still applies.',
  txtPayHelpLink:  'How to pay with Copy UPI ID',

  // ── Payment-link page buttons ───────────────────────────
  txtPlScan:   'Scan | Upload QR',
  txtPlCreate: 'Create Your UPI Link',

  // ── About: Hero ─────────────────────────────────────────
  txtAboutHeroTitle: 'About UPInspect',
  txtAboutHeroSub:   'Adding Control to QR-Based Payments',

  // ── About: Intro ────────────────────────────────────────
  txtAboutIntro: 'UPInspect is a privacy-first utility that decodes UPI QR codes before initiating a transaction. Instead of blindly redirecting you to a payment app, UPInspect adds a transparent verification step so you can review the UPI ID, merchant name and requested amount, putting you completely in control of your digital payments.',

  // ── About: Features ─────────────────────────────────────
  txtFeaturesTitle: 'Features',
  txtFeat1Title: 'Decode & Inspect',
  txtFeat1Desc:  'Extract and view the UPI ID, merchant name, and requested amount from any QR code before paying. Scanned amounts can be edited inline before you pay.',
  txtFeat2Title: 'Scan or Upload',
  txtFeat2Desc:  "Use your device's camera for live scanning with torch support for low-light environments or upload a saved QR screenshot directly from your gallery.",
  txtFeat3Title: 'Create & Share',
  txtFeat3Desc:  'Generate custom UPI payment links and professional QR standee cards you can share anywhere.',
  txtFeat4Title: '100% Private & Local',
  txtFeat4Desc:  'Your payment data never leaves your device. Everything runs securely within your browser, no servers, no tracking.',

  // ── About: Usages ───────────────────────────────────────
  txtUsagesTitle: 'Usages',
  txtUsage1Title: 'Fraud Prevention',
  txtUsage1Desc:  'Verify the actual payee identity before confirming a transfer, never pay blind again.',
  txtUsage2Title: 'Manual Banking Transfers',
  txtUsage2Desc:  "Copy the extracted UPI ID to manually handle higher-value payments through your bank's official app.",
  txtUsage3Title: 'Remote Payments',
  txtUsage3Desc:  'Safely inspect and pay for shared QR screenshots sent via chat apps.',
  txtUsage4Title: 'For Freelancers & Merchants',
  txtUsage4Desc:  'Quickly create clear, shareable payment links without exposing your personal phone number.',

  // ── About: FAQs ─────────────────────────────────────────
  txtFaqHeading: 'FAQs',
  txtFaq1Q: 'What does UPInspect actually do?',
  txtFaq1A: 'UPInspect decodes UPI QR codes and displays the embedded payment details before you initiate the transaction. You can then pay via your preferred UPI app, copy the UPI ID to send manually, or generate a clean payment link.',
  txtFaq2Q: 'Does UPInspect process payments?',
  txtFaq2A: 'No. All payments are completed within your selected UPI-enabled banking or payment app. UPInspect does not handle or store funds.',
  txtFaq3Q: 'Why do some QR payments show a ₹2,000 limit?',
  txtFaq3A: 'In certain cases, banks or UPI apps may apply transaction caps or additional checks when payments are initiated directly through QR scan flows. These limits are determined by your bank or UPI provider, not by UPInspect.',
  txtFaq4Q: 'Does UPInspect bypass the ₹2,000 QR limit?',
  txtFaq4A: "No. UPInspect does not bypass, override, or interfere with any bank-imposed limits. All transactions remain fully subject to your bank's rules, authentication requirements, and regulatory guidelines.",
  txtFaq5Q: 'Then how does UPInspect help with higher-value payments?',
  txtFaq5A: "UPInspect allows you to extract the UPI ID from a QR code and initiate payment manually through your bank's standard transfer flow. Any limits, approvals, or security checks are still enforced entirely by your bank. UPInspect only gives you flexibility in how you start the payment.",
  txtFaq6Q: 'Is UPInspect compliant with UPI rules?',
  txtFaq6A: "Yes. UPInspect does not alter transaction data or modify payment limits. It only decodes publicly embedded UPI QR information and allows users to proceed through official UPI apps. All transactions follow NPCI guidelines and your bank's policies.",
  txtFaq7Q: 'Pay Now was declined by my UPI app. What should I do?',
  txtFaq7A: 'Some UPI apps stop payments that start from links they do not recognise, to protect you from fraud. That is a safety check in your app, not a fault in UPInspect. Tap Copy UPI ID, open your payment app, paste the ID into its pay-to-UPI-ID screen and enter the amount yourself. Steps for popular apps are in the guide above.',
  txtFaq8Q: 'Does Copy UPI ID also have the ₹2,000 limit?',
  txtFaq8A: 'Caps such as ₹2,000 are usually applied to link and QR payment flows. When you paste a UPI ID and type the amount inside your payment app, it is a normal payment, so you can pay any amount up to the limits of your own bank account and UPI app.',
  txtFaq9Q: 'Is Copy UPI ID more reliable than Pay Now?',
  txtFaq9A: 'Yes. Pay Now passes the details to your UPI app as a link, and some apps refuse to act on links. Copy UPI ID works like typing the ID yourself, so your app treats it as a normal payment. Before you enter your UPI PIN, check that the name your app shows for the ID matches who you mean to pay.',

  // ── About: How to pay with Copy UPI ID ──────────────────
  txtGuideHeading:    'How to pay with Copy UPI ID',
  txtGuideIntro:      'Use this when Pay Now is declined, or when you want to pay more than a link allows. First tap Copy UPI ID on the result card, then follow the steps for your app.',
  txtGuideGpay1:      'Open Google Pay and tap the search bar at the top of the home screen.',
  txtGuideGpay2:      'Paste the copied UPI ID and select the result that appears.',
  txtGuideGpay3:      'Check the name shown, then tap Pay.',
  txtGuideGpay4:      'Enter the amount and tap Proceed.',
  txtGuideGpay5:      'Choose your bank account and enter your UPI PIN.',
  txtGuidePhonepe1:   'Open PhonePe and tap To Bank/UPI ID under Transfer Money.',
  txtGuidePhonepe2:   'Paste the copied UPI ID and tap Verify.',
  txtGuidePhonepe3:   'Check the name shown for the ID.',
  txtGuidePhonepe4:   'Enter the amount and tap Send or Pay.',
  txtGuidePhonepe5:   'Enter your UPI PIN.',
  txtGuidePaytm1:     'Open Paytm and tap To UPI ID or Bank A/c on the home screen. It may read To Bank or UPI ID.',
  txtGuidePaytm2:     'Choose the UPI ID option and paste the copied ID.',
  txtGuidePaytm3:     'Check the name shown for the ID.',
  txtGuidePaytm4:     'Enter the amount and tap Proceed.',
  txtGuidePaytm5:     'Enter your UPI PIN.',
  txtGuideBhim1:      'Open BHIM and tap Send on the home screen.',
  txtGuideBhim2:      'Paste the copied UPI ID and tap Verify.',
  txtGuideBhim3:      'Check the name shown for the ID.',
  txtGuideBhim4:      'Enter the amount and tap Pay.',
  txtGuideBhim5:      'Enter your UPI PIN.',
  txtGuideOtherTitle: 'Other UPI and bank apps',
  txtGuideOther1:     'Open your app and look for Pay, Send Money or To UPI ID.',
  txtGuideOther2:     'Paste the copied UPI ID and check the name shown.',
  txtGuideOther3:     'Enter the amount.',
  txtGuideOther4:     'Confirm with your UPI PIN.',
  txtGuideSafety:     "Before you enter your UPI PIN, check that the name your app shows for the UPI ID matches who you mean to pay. Unlike the name in a QR code, that name comes from the payee's bank.",
  txtGuideNote:       'Menu names change between app versions. If you cannot find an option, look for Pay, Send or To UPI ID.',

  // ── Toast / error messages ──────────────────────────────
  txtTorchOn:            'Turn on torch',
  txtTorchOff:           'Turn off torch',
  msgTorchUnsupported:   'Torch not supported on this device.',
  msgCameraDenied:   'Camera access denied.',
  msgQrReadError:    'Cannot read QR from image.',
  msgQrParseError:   'Could not parse QR data.',
  msgQrInvalid:      'Invalid UPI QR code.',
  msgUpiIdInvalid:   'Enter a valid UPI ID (e.g. name@upi)',
  msgNameInvalid:    'Merchant name must use English letters only (A–Z, 0–9, spaces).',
  msgAmountInvalid:  'Enter a valid amount.',
  msgUpiCopied:      'UPI ID copied!',
  msgCopyFailed:     'Copy failed.',
  msgLinkCopied:     'Payment link copied!',
  msgLinkCopyFailed: 'Copy failed. Long-press the link to copy it manually.',
  msgImageSaved:     'Image saved!',
  msgDownloadFailed: 'Download failed.',
  msgShareFailed:    'Share failed.',
  msgQrGenFailed:    'Could not generate the QR. Check your connection and try again.',
  msgLibLoadFailed:  'Could not load a required component. Check your connection and try again.',
  msgLinkInvalid:    'This payment link is not valid.',
  msgCameraNotFound: 'No camera found on this device.',
  msgCameraBusy:     'Camera is in use by another app.',
  msgCameraError:    'Could not start the camera.',

  // ── Warnings shown on the result card ───────────────────
  warnPaFormat:      'This UPI ID looks unusual. Double-check it before paying.',
  warnSpoofChars:    'The UPI ID or name contains hidden or look-alike characters. Do not pay unless you trust the source.',
  warnAmountIgnored: 'The requested amount ({amount}) is not valid and was ignored. Enter the amount yourself in your UPI app.',
  warnDuplicate:     'This QR repeats a payment field (ID, name or amount). Different apps may read it differently, so be careful.',

  // ── Share ───────────────────────────────────────────────
  txtCopyPrompt:     'Copy this link:',
  shareTitle:        'Pay {to}',
  shareCaption:      '{title}\n\n🔗 Pay here: {link}\n\nCreate Your Own Custom UPI QR Code and Shareable Payment Link on {site}',
};
