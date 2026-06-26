# Pin Hoo

[![Chrome Web Store](https://img.shields.io/badge/Chrome-4285F4?style=flat&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> Browse Pinterest freely — no login required.

**Pin Hoo** is a lightweight browser extension that removes Pinterest's forced sign-up modal and enables pin downloads without authentication. Just install and browse.



##  Features

- **Block login wall** — Automatically removes the full-page signup overlay and `overflow: hidden` restrictions, restoring normal scrolling.
- **⬇ Download pins without auth** — The existing download button (`data-test-id="pin-action-dropdown-download"`) works without signing in. Click it to download the original pin image directly from Pinterest's CDN.
- **Dynamic SPA support** — Uses a `MutationObserver` with debouncing to handle Pinterest's single-page app navigation without performance impact.
- **No data collection** — Zero analytics, zero tracking, zero external requests beyond Pinterest's own CDN.



##  Installation

### Chrome Web Store

1. Go to the [Pin Hoo](#) page on the Chrome Web Store.
2. Click **Add to Chrome**.
3. Done — the extension activates automatically on `*.pinterest.com/*`.

### Manual Installation (Developer Mode)

1. Clone or [download](https://github.com/Merctxt/PinHoo) this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode** (toggle top-right).
4. Click **Load unpacked** and select the `PinExtension` folder.
5. Visit any Pinterest page — the extension works immediately.



##  Development

```bash
# No build step required — it's pure vanilla JavaScript.
# Load the folder as an unpacked extension (see Manual Installation above).
# Edit content.js and reload the extension to test changes.
```

*Made with ❤️ for anyone who just wants to look at pretty pins.*