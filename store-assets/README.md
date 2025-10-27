# Store Listing Assets

This directory contains assets needed for publishing the extension on Chrome Web Store and Firefox Add-ons marketplace.

## Required Icons

Create the following icon sizes and place them in the `icons/` directory:

- `icon-16.png` - 16x16 pixels (toolbar icon)
- `icon-32.png` - 32x32 pixels (Windows)
- `icon-48.png` - 48x48 pixels (extensions page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store)

## Icon Design Guidelines

### Chrome Web Store
- Use PNG format
- Icons should be simple and recognizable at small sizes
- Avoid text in icons
- Use consistent branding colors
- Ensure icons work on both light and dark backgrounds

### Firefox Add-ons
- Same icon requirements as Chrome
- Icons should represent the extension's functionality
- Consider accessibility (high contrast, clear shapes)

## Screenshots

Create screenshots showing the extension in action:

1. **Main functionality screenshot** - Show the tooltip appearing on ASN hover
2. **Options page screenshot** - Show the configuration interface
3. **Before/after comparison** - Show WSA dashboard with and without the extension

### Screenshot Requirements

#### Chrome Web Store
- Minimum 1280x800 pixels
- Maximum 5 screenshots
- Show actual extension functionality
- Use PNG or JPEG format

#### Firefox Add-ons
- Minimum 1000x750 pixels
- Maximum 5 screenshots
- Show extension in realistic usage scenarios
- Use PNG or JPEG format

## Store Descriptions

### Short Description (Chrome Web Store - 132 characters max)
```
Shows Cloudflare Radar human vs bot percentages for ASNs on Akamai WSA dashboard
```

### Detailed Description

#### Chrome Web Store
```
WSA ASN Radar Tooltip enhances your Akamai Web Security Analytics experience by providing instant insights into ASN traffic patterns.

🔍 **Key Features:**
• Hover over any ASN on the WSA dashboard to see human vs bot traffic percentages
• Data sourced from Cloudflare Radar API for accurate insights
• Configurable caching (7-day default) for optimal performance
• Optional API token for enhanced functionality
• Works seamlessly with existing Akamai workflows

🛡️ **Privacy & Security:**
• All data stored locally in your browser
• Direct API calls to Cloudflare (no third-party servers)
• Optional configuration - works without API token
• No tracking or data collection

⚙️ **Easy Setup:**
• Install and start using immediately
• Optional: Add Cloudflare API token in extension options
• Configure cache TTL and Radar base URL as needed

Perfect for security analysts, network administrators, and anyone working with Akamai WSA who needs quick ASN insights.

**Target Page:** https://control.akamai.com/apps/security-analytics/
```

#### Firefox Add-ons
```
WSA ASN Radar Tooltip enhances your Akamai Web Security Analytics experience by providing instant insights into ASN traffic patterns.

**Key Features:**
• Hover over any ASN on the WSA dashboard to see human vs bot traffic percentages
• Data sourced from Cloudflare Radar API for accurate insights
• Configurable caching (7-day default) for optimal performance
• Optional API token for enhanced functionality
• Works seamlessly with existing Akamai workflows

**Privacy & Security:**
• All data stored locally in your browser
• Direct API calls to Cloudflare (no third-party servers)
• Optional configuration - works without API token
• No tracking or data collection

**Easy Setup:**
• Install and start using immediately
• Optional: Add Cloudflare API token in extension options
• Configure cache TTL and Radar base URL as needed

Perfect for security analysts, network administrators, and anyone working with Akamai WSA who needs quick ASN insights.

**Target Page:** https://control.akamai.com/apps/security-analytics/
```

## Categories

### Chrome Web Store
- Primary: Productivity
- Secondary: Developer Tools

### Firefox Add-ons
- Primary: Other
- Secondary: Web Development

## Tags/Keywords
- akamai
- cloudflare
- radar
- asn
- security
- analytics
- tooltip
- network
- traffic
- bot detection
