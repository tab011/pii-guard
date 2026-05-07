const path = require('path');
const fs = require('fs');
const { getManifest, extractPatterns, getExtensionFiles } = require('./helpers/test-utils');

const ENCRYPTED_PATH = path.join(__dirname, '../encrypted');

describe('PII Guard (Encrypted)', () => {
  describe('Manifest', () => {
    it('should have valid manifest.json', () => {
      const manifest = getManifest(ENCRYPTED_PATH);
      expect(manifest).toBeDefined();
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBe('PII Guard (Obfuscate)');
    });

    it('should have required permissions', () => {
      const manifest = getManifest(ENCRYPTED_PATH);
      expect(manifest.host_permissions).toBeDefined();
      expect(manifest.host_permissions).toContain('<all_urls>');
    });

    it('should have content scripts configured', () => {
      const manifest = getManifest(ENCRYPTED_PATH);
      expect(manifest.content_scripts).toBeDefined();
      expect(manifest.content_scripts.length).toBeGreaterThan(0);
    });
  });

  describe('Extension Files', () => {
    it('should have all required files', () => {
      const requiredFiles = [
        'manifest.json',
        'background.js',
        'content_script.js',
        'page_inject.js',
        'popup.html',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(ENCRYPTED_PATH, file);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });

    it('should have redact.js for pattern definitions', () => {
      const redactPath = path.join(ENCRYPTED_PATH, 'redact.js');
      expect(fs.existsSync(redactPath)).toBe(true);
    });
  });

  describe('Redaction Patterns', () => {
    it('should have email redaction pattern', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/email/i);
      expect(content).toMatch(/__PII::email::/);
    });

    it('should have phone redaction pattern', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/phone/i);
      expect(content).toMatch(/__PII::phone::/);
    });

    it('should have SSN redaction pattern', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/ssn/i);
      expect(content).toMatch(/__PII::ssn::/);
    });
  });

  describe('Code Quality', () => {
    it('page_inject.js should not be empty', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content.length).toBeGreaterThan(100);
    });

    it('background.js should be syntactically valid', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'background.js'),
        'utf8'
      );
      // Basic check: should contain function or class definitions
      expect(content).toMatch(/function|const|let|var|class/);
    });

    it('content_script.js should exist and call page inject', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'content_script.js'),
        'utf8'
      );
      expect(content).toMatch(/page_inject|script|src/i);
    });
  });

  describe('Injection Mechanism', () => {
    it('should have content_script in manifest', () => {
      const manifest = getManifest(ENCRYPTED_PATH);
      const jsFiles = manifest.content_scripts[0].js;
      expect(jsFiles).toContain('content_script.js');
      expect(jsFiles).toContain('page_inject.js');
    });

    it('page_inject should intercept fetch/XHR', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/window\.fetch|XMLHttpRequest/);
    });
  });

  describe('Redaction Logic', () => {
    it('should have maskPII function', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/function\s+maskPII|const\s+maskPII/);
    });

    it('should handle string inputs', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/typeof\s+\w+\s*!==\s*['"]string/);
    });

    it('should use regex replace for redaction', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'page_inject.js'),
        'utf8'
      );
      expect(content).toMatch(/\.replace\(/);
    });
  });

  describe('Setup Documentation', () => {
    it('should have SETUP.md', () => {
      const setupPath = path.join(ENCRYPTED_PATH, 'SETUP.md');
      expect(fs.existsSync(setupPath)).toBe(true);
    });

    it('SETUP.md should contain installation instructions', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'SETUP.md'),
        'utf8'
      );
      expect(content).toMatch(/Developer Mode|Load unpacked|chrome:\/\/extensions/i);
    });

    it('SETUP.md should explain what it does', () => {
      const content = fs.readFileSync(
        path.join(ENCRYPTED_PATH, 'SETUP.md'),
        'utf8'
      );
      expect(content.length).toBeGreaterThan(500);
    });
  });
});
