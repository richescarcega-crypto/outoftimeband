#!/usr/bin/env node
/**
 * Static Phase 4 Home gig slot packaging checks. Test-only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_home_gig_slot.js',
  'oot_compat_home.js',
];

const REQUIRED_SCRIPT_REFS = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_gig_slot.js',
  'oot_home_diag.js',
  'oot_compat_home.js',
];

const BOOTSTRAP_MARKER = "var savedName=localStorage.getItem('oot_me')";

const FORBIDDEN_STRINGS = [
  'data-home-alerts-reserved',
  'data-home-alerts-pending',
  'data-home-gig-pending',
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

const DELEGATION_MARKERS = [
  'reserveGigSlotPending()',
  "syncGigSlotState('updateCountdown:no-gigs'",
  "syncGigSlotState('updateCountdown:countdown'",
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
  console.log('Running Phase 4 Home gig slot integrity checks...\n');

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

  for (const marker of DELEGATION_MARKERS) {
    if (!html.includes(marker)) {
      fail(`index.html missing delegation/sync marker: ${marker}`);
    }
  }

  const bandImagePos = findScriptPositions(html, 'oot_home_band_image.js');
  const alertRailPos = findScriptPositions(html, 'oot_home_alert_rail.js');
  const gigSlotPos = findScriptPositions(html, 'oot_home_gig_slot.js');
  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');
  const bootstrapPos = html.indexOf(BOOTSTRAP_MARKER);

  if (gigSlotPos === -1) {
    fail('Could not locate oot_home_gig_slot.js script tag in index.html');
  }
  if (alertRailPos === -1) {
    fail('Could not locate oot_home_alert_rail.js script tag in index.html');
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

  if (alertRailPos !== -1 && gigSlotPos !== -1 && alertRailPos > gigSlotPos) {
    fail('Expected oot_home_alert_rail.js to load before oot_home_gig_slot.js');
  }
  if (gigSlotPos !== -1 && diagPos !== -1 && gigSlotPos > diagPos) {
    fail('Expected oot_home_gig_slot.js to load before oot_home_diag.js');
  }
  if (gigSlotPos !== -1 && bootstrapPos !== -1 && gigSlotPos > bootstrapPos) {
    fail('Expected oot_home_gig_slot.js to load before initApp bootstrap (savedName block)');
  }
  if (gigSlotPos !== -1 && compatPos !== -1 && gigSlotPos > compatPos) {
    fail('Expected oot_home_gig_slot.js to load before oot_compat_home.js');
  }
  if (bandImagePos !== -1 && gigSlotPos !== -1 && bandImagePos > gigSlotPos) {
    fail('Expected oot_home_band_image.js to load before oot_home_gig_slot.js');
  }

  if (exists('oot_home_gig_slot.js')) {
    assertJsModule('oot_home_gig_slot.js');
    const gigJs = read('oot_home_gig_slot.js');
    if (!gigJs.includes('window.OOT.home.gig')) {
      fail('oot_home_gig_slot.js missing window.OOT.home.gig namespace');
    }
    if (!gigJs.includes('getGigSlotState')) {
      fail('oot_home_gig_slot.js missing getGigSlotState');
    }
    if (!gigJs.includes('syncGigSlotState')) {
      fail('oot_home_gig_slot.js missing syncGigSlotState');
    }
    if (!gigJs.includes('reserveGigSlotPending')) {
      fail('oot_home_gig_slot.js missing reserveGigSlotPending');
    }
    if (!gigJs.includes('applyGigSlotFootprint')) {
      fail('oot_home_gig_slot.js missing applyGigSlotFootprint');
    }
    if (!gigJs.includes('GIG_SLOT_HEIGHT_PX')) {
      fail('oot_home_gig_slot.js missing GIG_SLOT_HEIGHT_PX');
    }
    if (!gigJs.includes('144')) {
      fail('oot_home_gig_slot.js missing 144px footprint constant');
    }
    if (!gigJs.includes('SLOT_IDS')) {
      fail('oot_home_gig_slot.js missing SLOT_IDS');
    }
    if (!gigJs.includes('STATES')) {
      fail('oot_home_gig_slot.js missing STATES');
    }
    if (!gigJs.includes('data-home-gig-slot-state')) {
      fail('oot_home_gig_slot.js missing data-home-gig-slot-state attribute handling');
    }
    if (!gigJs.includes("syncGigSlotState('updateCountdown:pending'")) {
      fail('oot_home_gig_slot.js missing pending path sync in reserveGigSlotPending');
    }
    if (!gigJs.includes('_isGigSlotCardDisplayed')) {
      fail('oot_home_gig_slot.js missing _isGigSlotCardDisplayed helper');
    }
    scanForbidden(gigJs, 'oot_home_gig_slot.js');
  }

  if (exists('oot_compat_home.js')) {
    assertJsModule('oot_compat_home.js');
    const compatJs = read('oot_compat_home.js');
    if (!compatJs.includes('getGigSlotState')) {
      fail('oot_compat_home.js missing getGigSlotState compat restore');
    }
    if (!compatJs.includes('syncGigSlotState')) {
      fail('oot_compat_home.js missing syncGigSlotState compat restore');
    }
    if (!compatJs.includes('reserveGigSlotPending')) {
      fail('oot_compat_home.js missing reserveGigSlotPending compat restore');
    }
    if (!compatJs.includes('applyGigSlotFootprint')) {
      fail('oot_compat_home.js missing applyGigSlotFootprint compat restore');
    }
    scanForbidden(compatJs, 'oot_compat_home.js');
  }

  scanForbidden(html, 'index.html (Phase 4 diff should not add banned strings)');

  if (html.match(/\[data-home-gig-slot-state[^\]]*\]/)) {
    fail('index.html must not add CSS selectors keyed on data-home-gig-slot-state in Phase 4');
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

  console.log('All Phase 4 Home gig slot integrity checks passed.\n');
}

main();
