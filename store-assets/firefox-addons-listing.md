# Firefox Add-ons Listing

## Basic Information

**Name:** WSA ASN Radar Tooltip
**Version:** 0.1.0
**Category:** Other
**Language:** English
**Price:** Free

## Description

### Summary
Shows Cloudflare Radar human vs bot percentages for ASNs on Akamai WSA dashboard

### Detailed Description
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

## Store Listing Details

**Homepage:** [Your GitHub repository or project website]
**Support Site:** [Your support page or GitHub issues]
**Developer Comments:** This extension enhances Akamai WSA dashboard functionality by providing instant ASN insights from Cloudflare Radar data.

## Permissions Explanation

**Storage:** Used to cache API responses and store user preferences locally
**Host Permissions (control.akamai.com):** Required to inject tooltips on the WSA dashboard
**Host Permissions (api.cloudflare.com):** Required to fetch ASN data from Cloudflare Radar API

## Screenshots Required

1. Main functionality - tooltip showing on ASN hover
2. Options page - configuration interface
3. Before/after comparison
4. Error handling - message when API token not configured
5. Success state - tooltip with actual data

## Technical Information

**Add-on ID:** wsa-asn-radar-tooltip@example.com
**Minimum Firefox Version:** 78.0
**Manifest Version:** 2
**Type:** Extension

## Additional Information

**Single Purpose:** Yes - Enhances Akamai WSA dashboard with ASN insights
**Collection of User Data:** No - All data stored locally
**Use of Permissions:** Minimal - Only required permissions for functionality
**Open Source:** Yes (if applicable)
