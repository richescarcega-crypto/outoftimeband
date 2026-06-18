#!/usr/bin/env node
/**
 * Static r941 packaging checks. Test-only — does not modify app files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_version_r941.js',
  'oot_compat_r941.js',
  'app_r913.css',
  'manifest.json',
];

const FORBIDDEN_REFERENCES = ['oot_display_r940.js'];
const REQUIRED_SCRIPT_REFS = ['oot_version_r941.js', 'oot_compat_r941.js'];
const R941_VERSION_MARKER = '2026-06-01-r941-display-mode-rollback';

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function stripLeadingCommentHeaders(text) {
  let s = text.trimStart();

  while (s.length) {
    if (s.startsWith('//')) {
      const newline = s.indexOf('\n');
      s = newline === -1 ? '' : s.slice(newline + 1).trimStart();
      continue;
    }

    if (s.startsWith('/*')) {
      const end = s.indexOf('*/');
      s = end === -1 ? s.slice(2).trimStart() : s.slice(end + 2).trimStart();
      continue;
    }

    break;
  }

  return s;
}

function looksLikeJsEntry(text) {
  return (
    text.startsWith('(') ||
    text.startsWith('function') ||
    text.startsWith('"use strict"') ||
    text.startsWith("'use strict'") ||
    text.startsWith('window') ||
    text.startsWith('var ') ||
    text.startsWith('const ') ||
    text.startsWith('let ')
  );
}

function assertJsModule(relPath) {
  const content = read(relPath);
  const trimmed = content.trimStart();

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    fail(`${relPath} is not JavaScript (starts with HTML). Expected a real module file.`);
    return;
  }

  const codeStart = stripLeadingCommentHeaders(content);
  if (!looksLikeJsEntry(codeStart)) {
    warn(`${relPath} has an unexpected JS prefix; review manually.`);
  }
}

function findScriptPositions(html, srcFragment) {
  const regex = new RegExp(`<script[^>]+src=["'][^"']*${srcFragment.replace('.', '\\.')}["'][^>]*>`, 'i');
  const match = html.match(regex);
  return match ? match.index : -1;
}

function main() {
  console.log('Running r941 static integrity checks...\n');

  for (const relPath of REQUIRED_FILES) {
    if (!exists(relPath)) {
      fail(`Missing required file: ${relPath}`);
    }
  }

  if (!exists('index.html')) {
    report();
    return;
  }

  const html = read('index.html');

  if (!html.includes(`var WHATS_NEW_VERSION = '${R941_VERSION_MARKER}'`)) {
    fail(`index.html missing expected WHATS_NEW_VERSION marker: ${R941_VERSION_MARKER}`);
  }

  for (const forbidden of FORBIDDEN_REFERENCES) {
    if (html.includes(forbidden)) {
      fail(`index.html must not reference ${forbidden}`);
    }
  }

  for (const required of REQUIRED_SCRIPT_REFS) {
    if (!html.includes(required)) {
      fail(`index.html missing script reference: ${required}`);
    }
  }

  const versionPos = findScriptPositions(html, 'oot_version_r941.js');
  const compatPos = findScriptPositions(html, 'oot_compat_r941.js');
  const bridgeMarker = html.indexOf('r938: Safety bridge for Build Version module');
  const thinGuardMarker = '[OOT Build Version] External module failed to load or did not initialize';

  if (versionPos === -1) {
    fail('Could not locate oot_version_r941.js script tag in index.html');
  }
  if (compatPos === -1) {
    fail('Could not locate oot_compat_r941.js script tag in index.html');
  }
  if (bridgeMarker === -1) {
    fail('Could not locate r938 Build Version compatibility guard marker in index.html');
  }
  if (!html.includes(thinGuardMarker)) {
    fail('index.html missing thin Build Version guard console.error marker');
  }
  if (/function\s+showVersionModal\s*\(/.test(html)) {
    fail('index.html must not define inline showVersionModal; use oot_version_r941.js');
  }

  if (versionPos !== -1 && bridgeMarker !== -1 && versionPos > bridgeMarker) {
    fail('Expected oot_version_r941.js to load before the r938 Build Version guard');
  }
  if (bridgeMarker !== -1 && compatPos !== -1 && bridgeMarker > compatPos) {
    fail('Expected r938 Build Version guard to appear before oot_compat_r941.js');
  }
  if (versionPos !== -1 && compatPos !== -1 && versionPos > compatPos) {
    fail('Expected oot_version_r941.js to load before oot_compat_r941.js');
  }

  if (exists('oot_version_r941.js')) {
    assertJsModule('oot_version_r941.js');
  }
  if (exists('oot_compat_r941.js')) {
    assertJsModule('oot_compat_r941.js');
  }

  if (exists('oot_display_r940.js')) {
    warn('oot_display_r940.js is present in repo root but must not be wired into r941.');
  }

  report();
}

function report() {
  if (warnings.length) {
    console.log('Warnings:');
    for (const message of warnings) {
      console.log(`  - ${message}`);
    }
    console.log('');
  }

  if (failures.length) {
    console.error('Failures:');
    for (const message of failures) {
      console.error(`  - ${message}`);
    }
    console.error(`\n${failures.length} check(s) failed.\n`);
    process.exit(1);
  }

  console.log('All r941 static integrity checks passed.\n');
}

main();
