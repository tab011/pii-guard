#!/usr/bin/env node

/**
 * Package PII Guard extensions for distribution
 * Usage: node scripts/package.js [version] [output-dir]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = process.argv[2] || '1.0.0';
const OUTPUT_DIR = process.argv[3] || './dist';
const EXTENSIONS = ['encrypted', 'basic', 'v0.11.0'];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`📦 Packaging PII Guard v${VERSION}`);
console.log(`📂 Output: ${OUTPUT_DIR}\n`);

for (const ext of EXTENSIONS) {
  const extPath = path.join(__dirname, '..', ext);
  const outputFile = path.join(OUTPUT_DIR, `pii-guard-${ext}-${VERSION}.zip`);

  console.log(`   Packaging ${ext}...`);

  try {
    // Create ZIP file
    execSync(`cd ${extPath} && zip -r -q ${outputFile} .`, { stdio: 'pipe' });
    const size = (fs.statSync(outputFile).size / 1024).toFixed(2);
    console.log(`   ✅ ${path.basename(outputFile)} (${size}KB)`);
  } catch (e) {
    console.error(`   ❌ Failed to package ${ext}:`, e.message);
  }
}

// Create manifest file with version info
const manifest = {
  version: VERSION,
  timestamp: new Date().toISOString(),
  extensions: EXTENSIONS.map((ext) => {
    const zipFile = `pii-guard-${ext}-${VERSION}.zip`;
    const zipPath = path.join(OUTPUT_DIR, zipFile);
    return {
      name: `PII Guard (${ext})`,
      id: ext,
      file: zipFile,
      size: fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0,
    };
  }),
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`\n✅ Packaging complete!`);
console.log(`   Version: ${VERSION}`);
console.log(`   Location: ${OUTPUT_DIR}/`);
console.log(`   Manifest: ${OUTPUT_DIR}/manifest.json`);
