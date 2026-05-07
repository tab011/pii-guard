const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * Load extension from local path
 */
async function loadExtension(extensionPath) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--load-extension=${extensionPath}`,
      '--disable-extensions-except=' + extensionPath,
    ],
  });
  return browser;
}

/**
 * Read extension manifest
 */
function getManifest(extensionPath) {
  const manifestPath = path.join(extensionPath, 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

/**
 * Get extension files
 */
function getExtensionFiles(extensionPath) {
  const files = {};
  const traverse = (dir, prefix = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        const fullPath = path.join(dir, entry.name);
        files[prefix + entry.name] = fs.readFileSync(fullPath, 'utf8');
      }
    }
  };
  traverse(extensionPath);
  return files;
}

/**
 * Extract redaction patterns from extension code
 */
function extractPatterns(extensionPath) {
  const patterns = {};
  const redactFiles = [
    path.join(extensionPath, 'redact.js'),
    path.join(extensionPath, 'page_inject.js'),
  ];

  for (const file of redactFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      // Look for pattern definitions
      const emailMatch = content.match(/\[A-Z0-9\._%\+\-\]\+@\[A-Z0-9\.\-\]\+\./);
      const phoneMatch = content.match(/\(\?:\\\\d\[\\s\-\]?\)\{7,\}/);
      const ssnMatch = content.match(/\\d\{3\}-\\d\{2\}-\\d\{4\}/);

      if (emailMatch) patterns.email = true;
      if (phoneMatch) patterns.phone = true;
      if (ssnMatch) patterns.ssn = true;
    }
  }
  return patterns;
}

module.exports = {
  loadExtension,
  getManifest,
  getExtensionFiles,
  extractPatterns,
};
