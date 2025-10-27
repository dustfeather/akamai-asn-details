# Publishing Guide

This guide covers the complete process of publishing the WSA ASN Radar Tooltip extension to both Chrome Web Store and Firefox Add-ons marketplace.

## Prerequisites

Before publishing, ensure you have:

1. **Developer Accounts:**
   - Chrome Web Store Developer Account ($5 one-time fee)
   - Firefox Add-ons Developer Account (free)

2. **Required Assets:**
   - Extension icons (16x16, 32x32, 48x48, 128x128 pixels)
   - Screenshots (minimum 1280x800 for Chrome, 1000x750 for Firefox)
   - Store descriptions and metadata

3. **Testing:**
   - Extension tested on both Chrome and Firefox
   - All functionality verified
   - Privacy policy and terms of service (if applicable)

## Build Process

### 1. Build the Extension

```bash
# Build for both platforms
npm run build

# Or build individually
npm run build:chrome
npm run build:firefox
```

This creates:
- `dist/chrome/` - Chrome Web Store build
- `dist/firefox/` - Firefox Add-ons build

### 2. Create Packages

```bash
# Create zip packages for store submission
npm run package

# Or package individually
npm run package:chrome
npm run package:firefox
```

This creates:
- `packages/chrome-extension.zip` - Chrome Web Store package
- `packages/firefox-extension.zip` - Firefox Add-ons package

## Chrome Web Store Publishing

### 1. Developer Account Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Pay the $5 registration fee
3. Complete developer profile

### 2. Upload Extension

1. Click "Add new item"
2. Upload `packages/chrome-extension.zip`
3. Fill in store listing information (see `store-assets/chrome-store-listing.md`)

### 3. Store Listing Information

**Required Fields:**
- **Name:** WSA ASN Radar Tooltip
- **Summary:** Shows Cloudflare Radar human vs bot percentages for ASNs on Akamai WSA dashboard
- **Description:** Use the detailed description from `store-assets/chrome-store-listing.md`
- **Category:** Productivity
- **Language:** English
- **Website:** Your project website or GitHub repository
- **Support Email:** Your support email

**Optional Fields:**
- **Privacy Policy:** URL to your privacy policy
- **Screenshots:** Upload 1-5 screenshots showing extension functionality
- **Promotional Images:** Optional promotional tiles

### 4. Permissions Review

Chrome will review your permissions. Be prepared to explain:
- Why you need access to `control.akamai.com`
- Why you need access to `api.cloudflare.com`
- How you use the `storage` permission

### 5. Submit for Review

1. Complete all required fields
2. Submit for review
3. Wait for approval (typically 1-3 business days)

## Firefox Add-ons Publishing

### 1. Developer Account Setup

1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in with Firefox account
3. Complete developer profile

### 2. Upload Extension

1. Click "Submit a New Add-on"
2. Upload `packages/firefox-extension.zip`
3. Fill in store listing information (see `store-assets/firefox-addons-listing.md`)

### 3. Store Listing Information

**Required Fields:**
- **Name:** WSA ASN Radar Tooltip
- **Summary:** Shows Cloudflare Radar human vs bot percentages for ASNs on Akamai WSA dashboard
- **Description:** Use the detailed description from `store-assets/firefox-addons-listing.md`
- **Category:** Other
- **Language:** English
- **Homepage:** Your project website or GitHub repository
- **Support Site:** Your support page or GitHub issues

**Optional Fields:**
- **Developer Comments:** Additional information about the extension
- **Screenshots:** Upload 1-5 screenshots showing extension functionality

### 4. Technical Review

Firefox will review your extension for:
- Security vulnerabilities
- Permission usage
- Code quality
- Compliance with policies

### 5. Submit for Review

1. Complete all required fields
2. Submit for review
3. Wait for approval (typically 1-7 business days)

## Post-Publication

### 1. Monitor Reviews

- Respond to user reviews and feedback
- Address any reported issues
- Update extension as needed

### 2. Version Updates

When updating the extension:

1. Update version number in manifests
2. Run `npm run build` and `npm run package`
3. Upload new packages to both stores
4. Update store listings if needed

### 3. Analytics and Metrics

Monitor:
- Download/install counts
- User reviews and ratings
- Crash reports
- Usage statistics

## Troubleshooting

### Common Issues

**Chrome Web Store:**
- Permission rejections: Provide detailed explanations
- Policy violations: Review Chrome Web Store policies
- Review delays: Contact support if review takes >7 days

**Firefox Add-ons:**
- Code signing issues: Ensure proper manifest structure
- Permission rejections: Provide detailed explanations
- Review delays: Contact support if review takes >14 days

### Getting Help

- Chrome Web Store: [Developer Support](https://support.google.com/chrome_webstore/)
- Firefox Add-ons: [Developer Support](https://support.mozilla.org/products/firefox-add-ons)

## Checklist

Before submitting to either store:

- [ ] Extension builds successfully for both platforms
- [ ] All tests pass (`npm test`)
- [ ] Icons are created and properly sized
- [ ] Screenshots are created and show functionality
- [ ] Store descriptions are written and reviewed
- [ ] Privacy policy is created (if collecting data)
- [ ] Extension is tested on both browsers
- [ ] Permissions are minimal and justified
- [ ] Code is clean and follows best practices
- [ ] Version numbers are correct
- [ ] Packages are created and tested

## Maintenance

### Regular Tasks

1. **Monitor Reviews:** Check for user feedback and respond appropriately
2. **Update Dependencies:** Keep browser polyfills and dependencies current
3. **Test Compatibility:** Test with new browser versions
4. **Security Updates:** Address any security vulnerabilities promptly
5. **Feature Updates:** Add new features based on user feedback

### Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Document changes in release notes
- Test thoroughly before releasing updates
- Consider backward compatibility
