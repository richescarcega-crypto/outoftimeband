#!/usr/bin/env node
/**
 * Static Phase 6a Home controller scaffold checks. Test-only — no behavior change gate.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_home_controller.js',
  'oot_compat_home.js',
];

const REQUIRED_SCRIPT_REFS = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_gig_slot.js',
  'oot_home_layout_engine.js',
  'oot_home_diag.js',
  'oot_home_controller.js',
  'oot_compat_home.js',
];

const CONTROLLER_SRC = 'oot_home_controller.js';
const BOOTSTRAP_MARKER = "var savedName=localStorage.getItem('oot_me')";
const RHOM_HOOK = "reconcileHomeLayout('rHome')";
const GO_HOME_HOOK = "if (id === 'home') rHome();";

const REQUIRED_API_SYMBOLS = [
  'window.OOT.home.controller',
  'activate',
  'requestReconcile',
  'notifyCueChange',
  'notifyImageRefresh',
  'notifyGigSlotChange',
  'getState',
  '6a-scaffold',
];

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
  'hero clamp',
  'dense compression',
  'overlay recovery',
];

const FORBIDDEN_BEHAVIOR_CALLS = [
  'reconcileHomeLayout',
  'syncAlertRailState',
  'updateCountdown',
  'applyHomeLayoutShell',
  'applyShell',
  'localStorage.setItem',
  'localStorage.removeItem',
  'document.getElementById',
  'querySelector',
  'classList',
  'setProperty',
  'go(',
  'rHome(',
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

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count += 1;
    idx += needle.length;
  }
  return count;
}

function scanForbidden(content, label) {
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      fail(`${label} must not contain banned string: ${forbidden}`);
    }
  }
}

function assertScaffoldOnly(controllerJs) {
  for (const sym of REQUIRED_API_SYMBOLS) {
    if (!controllerJs.includes(sym)) {
      fail(`oot_home_controller.js missing required symbol: ${sym}`);
    }
  }

  for (const call of FORBIDDEN_BEHAVIOR_CALLS) {
    if (controllerJs.includes(call)) {
      fail(`Phase 6a scaffold must not reference behavior hook: ${call}`);
    }
  }

  if (!controllerJs.includes('scaffold: true')) {
    fail('oot_home_controller.js must declare scaffold: true in internal state');
  }

  if (controllerJs.includes('modular-inflow')) {
    fail('oot_home_controller.js must not reference modular-inflow in Phase 6a');
  }
}

function assertCompatShim(compatJs) {
  if (!compatJs.includes('window.OOT.home.controller')) {
    fail('oot_compat_home.js must restore controller globals from window.OOT.home.controller');
  }
  if (!compatJs.includes('activateHome')) {
    fail('oot_compat_home.js must expose activateHome legacy global when missing');
  }
}

function assertIndexHtmlWiring(html) {
  for (const required of REQUIRED_SCRIPT_REFS) {
    if (!html.includes(required)) {
      fail(`index.html missing script reference: ${required}`);
    }
  }

  const hookCount = countOccurrences(html, RHOM_HOOK);
  if (hookCount !== 1) {
    fail(`index.html must contain exactly one ${RHOM_HOOK} hook (found ${hookCount})`);
  }

  if (!html.includes(GO_HOME_HOOK)) {
    fail(`index.html must still contain unmodified go('home') hook: ${GO_HOME_HOOK}`);
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
  }

  if (html.includes('HomeController.activate') || html.includes('activateHome(')) {
    fail('Phase 6a must not wire HomeController into rHome/go yet');
  }

  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const controllerPos = findScriptPositions(html, CONTROLLER_SRC);
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');
  const bootstrapPos = html.indexOf(BOOTSTRAP_MARKER);

  if (controllerPos === -1) {
    fail(`Could not locate ${CONTROLLER_SRC} script tag in index.html`);
  }
  if (diagPos !== -1 && controllerPos !== -1 && diagPos > controllerPos) {
    fail('Expected oot_home_diag.js to load before oot_home_controller.js');
  }
  if (controllerPos !== -1 && compatPos !== -1 && controllerPos > compatPos) {
    fail('Expected oot_home_controller.js to load before oot_compat_home.js');
  }
  if (controllerPos !== -1 && bootstrapPos !== -1 && controllerPos > bootstrapPos) {
    fail('Expected oot_home_controller.js to load before initApp bootstrap (savedName block)');
  }
}

function report() {
  if (warnings.length) {
    console.warn('Warnings:');
    warnings.forEach(function (w) { console.warn('  - ' + w); });
    console.warn('');
  }
  if (failures.length) {
    console.error('FAIL (' + failures.length + '):');
    failures.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('PASS: Phase 6a Home controller scaffold checks.');
}

function main() {
  console.log('Running Phase 6a Home controller integrity checks...\n');

  for (const relPath of REQUIRED_FILES) {
    if (!exists(relPath)) {
      fail(`Missing required file: ${relPath}`);
    }
  }

  if (failures.length) {
    report();
    return;
  }

  assertJsModule(CONTROLLER_SRC);
  const controllerJs = read(CONTROLLER_SRC);
  scanForbidden(controllerJs, 'oot_home_controller.js');
  assertScaffoldOnly(controllerJs);

  const compatJs = read('oot_compat_home.js');
  scanForbidden(compatJs, 'oot_compat_home.js');
  assertCompatShim(compatJs);

  const html = read('index.html');
  assertIndexHtmlWiring(html);

  report();
}

main();
