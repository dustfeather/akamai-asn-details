## Prerequisites

- Node.js 20+ (required for coverage testing)
- npm or yarn
- Chrome or Firefox browser for testing

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

## Testing

The project includes comprehensive automated testing using Vitest and Puppeteer.

### Running Tests Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run all tests:**
   ```bash
   npm test
   ```

3. **Run specific test suites:**
   ```bash
   npm run test:unit       # Unit tests only
   npm run test:integration # Integration tests with real Cloudflare API
   npm run test:e2e        # End-to-end tests only
   npm run test:coverage   # Tests with coverage report
   ```

4. **Set up Cloudflare API token for E2E tests:**
   
   **Option A: Using .env file (recommended for local development):**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your actual token
   # CLOUDFLARE_API_TOKEN=your-actual-token-here
   
   # Run tests (will automatically load from .env)
   npm run test:e2e
   ```
   
   **Option B: Using environment variable:**
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   npm run test:e2e
   ```

### Test Structure

- `tests/unit/` - Unit tests for helper functions (ASN parsing, storage, etc.)
- `tests/integration/` - Integration tests with real Cloudflare API calls (uses valid endpoints like `/ranking/top`)
- `tests/e2e/` - End-to-end browser tests using Puppeteer
- `tests/helpers/` - Test utilities and mocks

**Note**: The extension now uses multiple Cloudflare Radar API endpoints to derive ASN-specific bot/human traffic estimates. It tries three approaches: speed data analysis, traffic pattern analysis, and ASN entity type analysis. If ASN-specific data is not available, users will see an appropriate error message.

### CI/CD

Tests run automatically on every push and pull request via GitHub Actions. The release workflow requires all tests to pass before creating a new release.

**Required GitHub Secret:**
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token for E2E testing

To set up the secret:
1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: Your Cloudflare API token

## Publishing

The extension is ready for publishing on both Chrome Web Store and Firefox Add-ons marketplace.

### Quick Start

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Create packages:**
   ```bash
   npm run package
   ```

3. **Follow the publishing guide:**
   See [PUBLISHING.md](PUBLISHING.md) for complete instructions.

### Store Assets

- Store listings: `store-assets/`
- Privacy policy: [PRIVACY.md](PRIVACY.md)
- Publishing guide: [PUBLISHING.md](PUBLISHING.md)

## Development
- Source lives in `extension/` and uses Manifest V3 with a background service worker.
- No build step required; pure JavaScript.
- For local testing, create a `.env` file with your `CLOUDFLARE_API_TOKEN` (see `.env.example` for template).
