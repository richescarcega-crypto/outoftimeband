#!/usr/bin/env node
/**
 * Static Phase 3 Home alert rail packaging checks. Test-only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_home_alert_rail.js',
  'oot_compat_home.js',
];

const REQUIRED_SCRIPT_REFS = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_diag.js',
  'oot_compat_home.js',
];

const BOOTSTRAP_MARKER = "var savedName=localStorage.getItem('oot_me')";

const FORBIDDEN_STRINGS = [
  'data-home-alerts-reserved',
  'data-home-alerts-pending',
  '_homeMaybeLockAlertsFootprint',
  'HomeLayoutContract',
  'Home layout contract v2',
  'Home layout contract v3',
  '--home-band-region-target',
  '_onHomeActivated',
  'data-home-layout-mode="modular-inflow"',
  'hero clamp',
  'dense compression',
  'overlay recovery',
  'modular-inflow',
];

const SYNC_HOOK_MARKERS = [
  "syncAlertRailState('renderHomeSongVoteCue')",
  "syncAlertRailState('renderHomeRehearsalCue')",
  "syncAlertRailState('rHome')",
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
  console.log('Running Phase 3 Home alert rail integrity checks...\n');

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

  for (const marker of SYNC_HOOK_MARKERS) {
    if (!html.includes(marker)) {
      fail(`index.html missing sync hook marker: ${marker}`);
    }
  }

  const bandImagePos = findScriptPositions(html, 'oot_home_band_image.js');
  const alertRailPos = findScriptPositions(html, 'oot_home_alert_rail.js');
  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');
  const bootstrapPos = html.indexOf(BOOTSTRAP_MARKER);

  if (alertRailPos === -1) {
    fail('Could not locate oot_home_alert_rail.js script tag in index.html');
  }
  if (bandImagePos === -1) {
    fail('Could not locate oot_home_band_image.js script tag in index.html');
  }
  if (diagPos === -1) {
    fail('Could not locate oot_home_diag.js script tag in index.html');
  }
  if (compatPos === -1) {
    fail('Could not locate oot_compat_home.js script tag in index.html');
  }
  if (bootstrapPos === -1) {
    fail(`Could not locate bootstrap marker in index.html: ${BOOTSTRAP_MARKER}`);
  }

  if (bandImagePos !== -1 && alertRailPos !== -1 && bandImagePos > alertRailPos) {
    fail('Expected oot_home_band_image.js to load before oot_home_alert_rail.js');
  }
  if (alertRailPos !== -1 && diagPos !== -1 && alertRailPos > diagPos) {
    fail('Expected oot_home_alert_rail.js to load before oot_home_diag.js');
  }
  if (alertRailPos !== -1 && bootstrapPos !== -1 && alertRailPos > bootstrapPos) {
    fail('Expected oot_home_alert_rail.js to load before initApp bootstrap (savedName block)');
  }
  if (alertRailPos !== -1 && compatPos !== -1 && alertRailPos > compatPos) {
    fail('Expected oot_home_alert_rail.js to load before oot_compat_home.js');
  }

  if (exists('oot_home_alert_rail.js')) {
    assertJsModule('oot_home_alert_rail.js');
    const alertJs = read('oot_home_alert_rail.js');
    if (!alertJs.includes('window.OOT.home.alerts')) {
      fail('oot_home_alert_rail.js missing window.OOT.home.alerts namespace');
    }
    if (!alertJs.includes('getAlertRailState')) {
      fail('oot_home_alert_rail.js missing getAlertRailState');
    }
    if (!alertJs.includes('syncAlertRailState')) {
      fail('oot_home_alert_rail.js missing syncAlertRailState');
    }
    if (!alertJs.includes('CUE_IDS')) {
      fail('oot_home_alert_rail.js missing CUE_IDS');
    }
    if (!alertJs.includes('STATES')) {
      fail('oot_home_alert_rail.js missing STATES');
    }
    if (!alertJs.includes('data-home-alert-state')) {
      fail('oot_home_alert_rail.js missing data-home-alert-state attribute handling');
    }
    if (!alertJs.includes('_isHomeAlertCueDisplayed')) {
      fail('oot_home_alert_rail.js missing _isHomeAlertCueDisplayed helper');
    }
    scanForbidden(alertJs, 'oot_home_alert_rail.js');
  }

  if (exists('oot_compat_home.js')) {
    assertJsModule('oot_compat_home.js');
    const compatJs = read('oot_compat_home.js');
    if (!compatJs.includes('getAlertRailState')) {
      fail('oot_compat_home.js missing getAlertRailState compat restore');
    }
    if (!compatJs.includes('syncAlertRailState')) {
      fail('oot_compat_home.js missing syncAlertRailState compat restore');
    }
    scanForbidden(compatJs, 'oot_compat_home.js');
  }

  scanForbidden(html, 'index.html (Phase 3 diff should not add banned strings)');

  if (html.match(/\[data-home-alert-state[^\]]*\]/)) {
    fail('index.html must not add CSS selectors keyed on data-home-alert-state in Phase 3');
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

  console.log('All Phase 3 Home alert rail integrity checks passed.\n');
}

main();
