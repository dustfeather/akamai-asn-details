## WSA ASN Radar Tooltip

Shows Cloudflare Radar human vs bot percentages for ASNs hovered on Akamai WSA dashboard.

- Target page: `https://control.akamai.com/apps/security-analytics/#/`
- Data source: Cloudflare Radar API (Bearer token optional - shows helpful message if not configured)

## Install (Chrome)
1. Build not required (pure JS). Open chrome://extensions.
2. Enable Developer mode.
3. Load unpacked → select the `extension/` folder.
4. Optionally: Click the extension Options and set your Cloudflare API token for full functionality.

## Install (Firefox)
1. Open about:debugging → This Firefox → Load Temporary Add-on.
2. Select `extension/manifest.json`.
3. Optionally: Open extension Options and set the token for full functionality.

## Configuration
- Open the extension Options and optionally set your Cloudflare API token.
- Without a token, the extension will show a helpful message directing you to configure it.
- Optional: adjust the cache TTL (default 7 days) or Radar base URL.

## Usage
- Browse to the WSA dashboard, hover an ASN cell (e.g. `AS13335`).
- Tooltip shows Human vs Bot percentages from Radar (if token is configured).
- Without a token, shows a message explaining how to configure it.
- Results are cached for 7 days by default (configurable in Options).

## Privacy
- Token is stored locally using `chrome.storage.local`.
- API calls go directly from your browser to Cloudflare.

## Notes
- If Radar response shape changes, the client uses heuristics to extract bot/human shares.
- Errors show a "No data" tooltip and are cached briefly.
- Extension works without a token but shows configuration instructions.

## Development
- Source lives in `extension/` and uses Manifest V3 with a background service worker.
- No build step required; pure JavaScript.
