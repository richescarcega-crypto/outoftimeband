#!/usr/bin/env node
/**
 * Static Phase 1 Home diagnostics packaging checks. Test-only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_home_diag.js',
  'oot_compat_home.js',
];

const REQUIRED_SCRIPT_REFS = ['oot_home_diag.js', 'oot_compat_home.js'];
const GUARD_MARKER = '[OOT Home Diag]';
const BOOTSTRAP_MARKER = "var savedName=localStorage.getItem('oot_me')";
const EXPORT_BTN_ID = 'oot-home-diag-export-btn';
const EXPORT_MODAL_ID = 'oot-home-diag-export-modal';
const INDEX_FORBIDDEN_EXPORT_WIRING = [
  EXPORT_BTN_ID,
  EXPORT_MODAL_ID,
  'oot-home-diag-export-textarea',
  'openExport',
  'HOME LAYOUT DIAG (DEV ONLY)',
];

const FORBIDDEN_STRINGS = [
  'data-home-alerts-reserved',
  'data-home-alerts-pending',
  '_homeMaybeLockAlertsFootprint',
  'Home layout contract v2',
  'Home layout contract v3',
  '--home-band-region-target',
  '_onHomeActivated',
  'data-home-layout-mode="modular-inflow"',
];

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

function assertJsModule(relPath) {
  const content = read(relPath);
  const trimmed = content.trimStart();

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    fail(`${relPath} is not JavaScript (starts with HTML). Expected a real module file.`);
  }
}

function findScriptPositions(html, srcFragment) {
  const regex = new RegExp(`<script[^>]+src=["'][^"']*${srcFragment.replace('.', '\\.')}["'][^>]*>`, 'i');
  const match = html.match(regex);
  return match ? match.index : -1;
}

function scanForbidden(content, label) {
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      fail(`${label} must not contain banned string: ${forbidden}`);
    }
  }
}

function main() {
  console.log('Running Phase 1/1b Home diagnostics integrity checks...\n');

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

  for (const required of REQUIRED_SCRIPT_REFS) {
    if (!html.includes(required)) {
      fail(`index.html missing script reference: ${required}`);
    }
  }

  if (!html.includes(GUARD_MARKER)) {
    fail(`index.html missing Home diagnostics thin guard marker: ${GUARD_MARKER}`);
  }

  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');
  const bootstrapPos = html.indexOf(BOOTSTRAP_MARKER);
  const guardPos = html.indexOf(GUARD_MARKER);

  if (diagPos === -1) {
    fail('Could not locate oot_home_diag.js script tag in index.html');
  }
  if (compatPos === -1) {
    fail('Could not locate oot_compat_home.js script tag in index.html');
  }
  if (bootstrapPos === -1) {
    fail(`Could not locate bootstrap marker in index.html: ${BOOTSTRAP_MARKER}`);
  }

  if (diagPos !== -1 && bootstrapPos !== -1 && diagPos > bootstrapPos) {
    fail('Expected oot_home_diag.js to load before initApp bootstrap (savedName block)');
  }
  if (guardPos !== -1 && bootstrapPos !== -1 && guardPos > bootstrapPos) {
    fail('Expected Home diagnostics guard before initApp bootstrap');
  }
  if (diagPos !== -1 && compatPos !== -1 && diagPos > compatPos) {
    fail('Expected oot_home_diag.js to load before oot_compat_home.js');
  }

  for (const forbidden of INDEX_FORBIDDEN_EXPORT_WIRING) {
    if (html.includes(forbidden)) {
      fail(`index.html must not wire Phase 1b export UI (${forbidden}); export lives in oot_home_diag.js only`);
    }
  }

  if (exists('oot_home_diag.js')) {
    assertJsModule('oot_home_diag.js');
    const diagJs = read('oot_home_diag.js');
    if (!diagJs.includes('window.OOT.home.diag')) {
      fail('oot_home_diag.js missing window.OOT.home.diag namespace');
    }
    if (!diagJs.includes('_homeLayoutDiagSnapshot')) {
      fail('oot_home_diag.js missing _homeLayoutDiagSnapshot export');
    }
    if (!diagJs.includes('OOT_HOME_LAYOUT_DIAG')) {
      fail('oot_home_diag.js missing OOT_HOME_LAYOUT_DIAG export');
    }
    if (!diagJs.includes(EXPORT_BTN_ID)) {
      fail(`oot_home_diag.js missing export button marker ${EXPORT_BTN_ID}`);
    }
    if (!diagJs.includes(EXPORT_MODAL_ID)) {
      fail(`oot_home_diag.js missing export modal marker ${EXPORT_MODAL_ID}`);
    }
    if (!diagJs.includes('openExport')) {
      fail('oot_home_diag.js missing openExport');
    }
    if (!diagJs.includes('copyExport')) {
      fail('oot_home_diag.js missing copyExport');
    }
    if (!diagJs.includes('snapshotNow')) {
      fail('oot_home_diag.js missing snapshotNow');
    }
    if (!diagJs.includes('mountExportUi')) {
      fail('oot_home_diag.js missing mountExportUi');
    }
    if (!diagJs.includes('if (!enabled()) return') && !diagJs.includes('if(!enabled()) return')) {
      fail('oot_home_diag.js should gate export mount when diagnostics are disabled');
    }
    if (!diagJs.includes('manual:export')) {
      fail('oot_home_diag.js missing manual:export snapshot for Copy JSON');
    }
    if (!diagJs.includes('isHomeTabActive')) {
      fail('oot_home_diag.js missing Home-tab-only export button visibility');
    }
    scanForbidden(diagJs, 'oot_home_diag.js');
  }

  if (exists('oot_compat_home.js')) {
    assertJsModule('oot_compat_home.js');
    scanForbidden(read('oot_compat_home.js'), 'oot_compat_home.js');
  }

  scanForbidden(html, 'index.html (Phase 1 diag-related diff should not add banned strings)');

  if (!html.includes('oot_version_r941.js')) {
    warn('index.html no longer references oot_version_r941.js — verify Build Version wiring separately.');
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

  console.log('All Phase 1/1b Home diagnostics integrity checks passed.\n');
}

main();
