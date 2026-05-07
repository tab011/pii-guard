# PII Guard v0.11.0 - Setup Guide

**Version:** 0.11.0  
**Protection Scope:** Limited (see configuration)  
**Features:** Basic PII detection and logging

## Installation (Chrome/Edge)

### Step 1: Enable Developer Mode
1. Open Chrome and go to `chrome://extensions/`
2. Toggle **"Developer mode"** (top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to this folder (`v0.11.0/`)
3. Select and confirm

## What It Does

This is an earlier version of PII Guard with basic functionality. Check the `README.md` in this folder for version-specific details.

## Files

- `manifest.json` — Extension metadata
- `background.js` — Service worker
- `content_script.js` — Content script
- `README.md` — Version-specific documentation

## Setup Instructions

See `README.md` in this directory for version-specific setup and configuration.

## Troubleshooting

**Extension doesn't load?**
- Ensure you're selecting this folder, not a parent directory
- Check the manifest version (should be "manifest_version": 3)

**Not working?**
- Check if background service worker is active
- Review background.js for error handling
