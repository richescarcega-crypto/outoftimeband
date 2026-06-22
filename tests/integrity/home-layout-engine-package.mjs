#!/usr/bin/env node
/**
 * Static Phase 5a Home layout engine scaffold checks. Test-only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_home_layout_engine.js',
  'oot_compat_home.js',
];

const PROTECTED_MODULE_FILES = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_gig_slot.js',
];

const REQUIRED_SCRIPT_REFS = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_gig_slot.js',
  'oot_home_layout_engine.js',
  'oot_home_diag.js',
  'oot_compat_home.js',
];

const BOOTSTRAP_MARKER = "var savedName=localStorage.getItem('oot_me')";
const RHOM_HOOK = "reconcileHomeLayout('rHome')";

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

function scanForbidden(content, label, allowedSubstrings) {
  allowedSubstrings = allowedSubstrings || [];
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      fail(`${label} must not contain banned string: ${forbidden}`);
    }
  }
  if (content.includes('modular-inflow') && !allowedSubstrings.includes('modular-inflow')) {
    fail(`${label} must not contain modular-inflow outside allowed pilot module/test references`);
  }
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = haystack.indexOf(needle, pos);
    if (idx === -1) break;
    count += 1;
    pos = idx + needle.length;
  }
  return count;
}

function gitChangedFiles() {
  try {
    const tracked = execSync('git diff --name-only HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const untracked = execSync('git ls-files --others --exclude-standard', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const files = [];
    if (tracked) files.push(...tracked.split(/\r?\n/).filter(Boolean));
    if (untracked) files.push(...untracked.split(/\r?\n/).filter(Boolean));
    return files;
  } catch (e) {
    warn('Could not determine git changed files; skipping protected-module diff check.');
    return [];
  }
}

function main() {
  console.log('Running Phase 5a Home layout engine scaffold integrity checks...\n');

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

  const hookCount = countOccurrences(html, RHOM_HOOK);
  if (hookCount !== 1) {
    fail(`index.html must contain exactly one ${RHOM_HOOK} hook (found ${hookCount})`);
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
  }

  const scHomeOpen = html.match(/<div id="sc-home"[^>]*>/i);
  if (scHomeOpen && scHomeOpen[0].includes('modular-inflow')) {
    fail('Static #sc-home markup must not include modular-inflow by default');
  }

  const bandImagePos = findScriptPositions(html, 'oot_home_band_image.js');
  const alertRailPos = findScriptPositions(html, 'oot_home_alert_rail.js');
  const gigSlotPos = findScriptPositions(html, 'oot_home_gig_slot.js');
  const layoutEnginePos = findScriptPositions(html, 'oot_home_layout_engine.js');
  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');
  const bootstrapPos = html.indexOf(BOOTSTRAP_MARKER);

  if (layoutEnginePos === -1) {
    fail('Could not locate oot_home_layout_engine.js script tag in index.html');
  }
  if (gigSlotPos === -1) {
    fail('Could not locate oot_home_gig_slot.js script tag in index.html');
  }
  if (diagPos === -1) {
    fail('Could not locate oot_home_diag.js script tag in index.html');
  }
  if (bootstrapPos === -1) {
    fail(`Could not locate bootstrap marker in index.html: ${BOOTSTRAP_MARKER}`);
  }

  if (gigSlotPos !== -1 && layoutEnginePos !== -1 && gigSlotPos > layoutEnginePos) {
    fail('Expected oot_home_gig_slot.js to load before oot_home_layout_engine.js');
  }
  if (layoutEnginePos !== -1 && diagPos !== -1 && layoutEnginePos > diagPos) {
    fail('Expected oot_home_layout_engine.js to load before oot_home_diag.js');
  }
  if (layoutEnginePos !== -1 && bootstrapPos !== -1 && layoutEnginePos > bootstrapPos) {
    fail('Expected oot_home_layout_engine.js to load before initApp bootstrap (savedName block)');
  }
  if (layoutEnginePos !== -1 && compatPos !== -1 && layoutEnginePos > compatPos) {
    fail('Expected oot_home_layout_engine.js to load before oot_compat_home.js');
  }
  if (bandImagePos !== -1 && layoutEnginePos !== -1 && bandImagePos > layoutEnginePos) {
    fail('Expected oot_home_band_image.js to load before oot_home_layout_engine.js');
  }
  if (alertRailPos !== -1 && layoutEnginePos !== -1 && alertRailPos > layoutEnginePos) {
    fail('Expected oot_home_alert_rail.js to load before oot_home_layout_engine.js');
  }

  const changedFiles = gitChangedFiles();
  for (const protectedFile of PROTECTED_MODULE_FILES) {
    if (changedFiles.includes(protectedFile)) {
      fail(`Phase 5a must not modify protected module: ${protectedFile}`);
    }
  }

  if (exists('oot_home_layout_engine.js')) {
    assertJsModule('oot_home_layout_engine.js');
    const layoutJs = read('oot_home_layout_engine.js');
    if (!layoutJs.includes('window.OOT.home.layout')) {
      fail('oot_home_layout_engine.js missing window.OOT.home.layout namespace');
    }
    if (!layoutJs.includes('isPilotEnabled')) {
      fail('oot_home_layout_engine.js missing isPilotEnabled');
    }
    if (!layoutJs.includes('getMode')) {
      fail('oot_home_layout_engine.js missing getMode');
    }
    if (!layoutJs.includes('applyShell')) {
      fail('oot_home_layout_engine.js missing applyShell');
    }
    if (!layoutJs.includes('reconcile')) {
      fail('oot_home_layout_engine.js missing reconcile');
    }
    if (!layoutJs.includes('MODES')) {
      fail('oot_home_layout_engine.js missing MODES');
    }
    if (!layoutJs.includes('legacy-overlay')) {
      fail('oot_home_layout_engine.js missing legacy-overlay mode constant');
    }
    if (!layoutJs.includes('modular-inflow')) {
      fail('oot_home_layout_engine.js missing modular-inflow mode constant');
    }
    if (!layoutJs.includes('homeLayoutPilot')) {
      fail('oot_home_layout_engine.js missing PILOT_QUERY homeLayoutPilot');
    }
    if (!layoutJs.includes('oot_home_layout_pilot')) {
      fail('oot_home_layout_engine.js missing PILOT_STORAGE_KEY oot_home_layout_pilot');
    }
    if (!layoutJs.includes('getHomeLayoutMode')) {
      fail('oot_home_layout_engine.js missing getHomeLayoutMode export');
    }
    if (!layoutJs.includes('applyHomeLayoutShell')) {
      fail('oot_home_layout_engine.js missing applyHomeLayoutShell export');
    }
    if (!layoutJs.includes('reconcileHomeLayout')) {
      fail('oot_home_layout_engine.js missing reconcileHomeLayout export');
    }
    if (!layoutJs.includes('data-home-layout-mode')) {
      fail('oot_home_layout_engine.js missing data-home-layout-mode handling');
    }
    scanForbidden(layoutJs, 'oot_home_layout_engine.js', ['modular-inflow']);
  }

  if (exists('oot_compat_home.js')) {
    assertJsModule('oot_compat_home.js');
    const compatJs = read('oot_compat_home.js');
    if (!compatJs.includes('getHomeLayoutMode')) {
      fail('oot_compat_home.js missing getHomeLayoutMode compat restore');
    }
    if (!compatJs.includes('reconcileHomeLayout')) {
      fail('oot_compat_home.js missing reconcileHomeLayout compat restore');
    }
    scanForbidden(compatJs, 'oot_compat_home.js');
  }

  scanForbidden(html, 'index.html (Phase 5a diff should not add banned strings)');

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

  console.log('All Phase 5a Home layout engine scaffold integrity checks passed.\n');
}

main();
