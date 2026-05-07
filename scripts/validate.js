#!/usr/bin/env node

/**
 * Validate PII Guard extensions
 * Checks manifest, required files, and code quality
 */

const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['encrypted', 'basic', 'v0.11.0'];
const REQUIRED_FILES = ['manifest.json'];
const EXTENSION_RECOMMENDED_FILES = {
  encrypted: ['manifest.json', 'page_inject.js', 'content_script.js', 'background.js', 'popup.html', 'redact.js'],
  basic: ['manifest.json', 'page_inject.js', 'content_script.js', 'background.js', 'popup.html'],
  'v0.11.0': ['manifest.json', 'background.js', 'content_script.js'],
};

console.log('🔍 Validating PII Guard Extensions\n');

let allValid = true;

for (const ext of EXTENSIONS) {
  const extPath = path.join(__dirname, '..', ext);
  console.log(`Checking ${ext}/`);

  // Check if directory exists
  if (!fs.existsSync(extPath)) {
    console.log(`  ❌ Directory not found: ${extPath}`);
    allValid = false;
    continue;
  }

  // Check required files
  const requiredFiles = EXTENSION_RECOMMENDED_FILES[ext] || REQUIRED_FILES;
  let extValid = true;

  for (const file of requiredFiles) {
    const filePath = path.join(extPath, file);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const size = (stat.size / 1024).toFixed(2);
      console.log(`  ✅ ${file} (${size}KB)`);
    } else {
      console.log(`  ⚠️  Missing: ${file}`);
      if (REQUIRED_FILES.includes(file)) {
        extValid = false;
        allValid = false;
      }
    }
  }

  // Check manifest validity
  const manifestPath = path.join(extPath, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.manifest_version === 3) {
        console.log(`  ✅ Valid Manifest v3`);
      } else {
        console.log(`  ❌ Invalid manifest version: ${manifest.manifest_version}`);
        extValid = false;
        allValid = false;
      }
    } catch (e) {
      console.log(`  ❌ Invalid JSON: ${e.message}`);
      extValid = false;
      allValid = false;
    }
  }

  // Check setup documentation
  const setupPath = path.join(extPath, 'SETUP.md');
  if (fs.existsSync(setupPath)) {
    console.log(`  ✅ SETUP.md documentation present`);
  } else {
    console.log(`  ⚠️  Missing SETUP.md`);
  }

  console.log();
}

// Check main README
const readmePath = path.join(__dirname, '..', 'README.md');
if (fs.existsSync(readmePath)) {
  console.log('✅ Main README.md present\n');
} else {
  console.log('❌ Missing main README.md\n');
  allValid = false;
}

// Summary
if (allValid) {
  console.log('✅ All validations passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some validations failed. Review above.');
  process.exit(1);
}
