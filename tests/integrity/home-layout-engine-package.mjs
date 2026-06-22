#!/usr/bin/env node
/**
 * Static Phase 5 Home layout engine checks (5a scaffold + 5b pilot CSS + 5c budget). Test-only.
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
  'oot_home_layout_engine.css',
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

const LAYOUT_CSS_HREF = 'oot_home_layout_engine.css';
const PILOT_SCOPE = 'data-home-layout-mode="modular-inflow"';

const REQUIRED_CSS_TOKENS = [
  '--home-slot-hero-h',
  '--home-slot-hero-h-dense',
  '--home-slot-birthday-h',
  '--home-slot-alert-rail-h-single',
  '--home-slot-alert-rail-h-dual',
  '--home-slot-alert-rail-h',
  '--home-slot-gig-h',
  '--home-band-viewport-min-h',
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

function findStylesheetPositions(html, hrefFragment) {
  const regex = new RegExp(`<link[^>]+href=["'][^"']*${hrefFragment.replace('.', '\\.')}["'][^>]*>`, 'i');
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

function findClosingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractRuleSelectors(cssText) {
  const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  let i = 0;

  while (i < noComments.length) {
    const ch = noComments[i];
    if (ch === '@') {
      const braceStart = noComments.indexOf('{', i);
      if (braceStart === -1) break;
      const atRule = noComments.slice(i, braceStart).trim();
      const closeIndex = findClosingBrace(noComments, braceStart);
      if (closeIndex === -1) break;
      if (/^@(media|supports|layer|container)/i.test(atRule)) {
        const inner = noComments.slice(braceStart + 1, closeIndex);
        selectors.push(...extractRuleSelectors(inner));
      }
      i = closeIndex + 1;
      continue;
    }
    if (/\S/.test(ch) && ch !== '}' && ch !== '{') {
      const braceStart = noComments.indexOf('{', i);
      if (braceStart === -1) break;
      const selector = noComments.slice(i, braceStart).trim();
      if (selector) selectors.push(selector);
      i = findClosingBrace(noComments, braceStart) + 1;
      continue;
    }
    i += 1;
  }

  return selectors;
}

function assertPilotScopedCss(cssText) {
  const selectors = extractRuleSelectors(cssText);
  if (!selectors.length) {
    fail('oot_home_layout_engine.css contains no CSS rule selectors');
    return;
  }
  for (const selector of selectors) {
    if (!selector.includes(PILOT_SCOPE)) {
      fail(`oot_home_layout_engine.css rule selector missing pilot scope: ${selector}`);
    }
  }
}

function assertGitFileUnchanged(relPath, phaseLabel) {
  try {
    const diff = execSync(`git diff HEAD -- ${relPath}`, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (diff) {
      fail(`${relPath} must remain unchanged for ${phaseLabel}`);
    }
  } catch (e) {
    warn(`Could not verify ${relPath} unchanged; skipping.`);
  }
}

/** Mirror of computeBudget for deterministic integrity checks (must stay in sync with layout JS). */
function computeBudgetMirror(inputs) {
  const HERO_SPARSE_PX = 318;
  const HERO_DENSE_PX = 324;
  const ALERT_RAIL_SINGLE_PX = 58;
  const ALERT_RAIL_DUAL_PX = 64;
  const GIG_SLOT_FALLBACK_PX = 144;
  const GIG_MARGIN_TOP_PX = 2;
  const BAND_MIN_FLOOR_PX = 96;
  const BAND_MIN_CEIL_PX = 140;
  const BAND_MIN_VH_RATIO = 0.22;
  const BAND_ABSOLUTE_FLOOR = 20;
  const HERO_COMPRESS_FLOOR = 300;

  const scHomeH = inputs.scHomeH || 0;
  const alertState = inputs.alertState || 'none';
  const gigState = inputs.gigState || 'none';
  const gigSlotPx = inputs.gigSlotPx != null ? inputs.gigSlotPx : GIG_SLOT_FALLBACK_PX;
  const birthdayH = inputs.birthdayVisible ? (inputs.birthdayH || 0) : 0;
  const viewportH = inputs.viewportH || 0;

  let alertRailH = 0;
  if (alertState === 'both') alertRailH = ALERT_RAIL_DUAL_PX;
  else if (alertState === 'song' || alertState === 'rehearsal') alertRailH = ALERT_RAIL_SINGLE_PX;

  let gigH = 0;
  if (gigState === 'pending' || gigState === 'countdown' || gigState === 'no-gigs') {
    gigH = gigSlotPx;
  }

  let heroH = alertState === 'none' ? HERO_SPARSE_PX : HERO_DENSE_PX;
  let pass = 1;
  const shellOverheadPx = GIG_MARGIN_TOP_PX;
  const vhTerm = viewportH > 0 ? viewportH * BAND_MIN_VH_RATIO : BAND_MIN_FLOOR_PX;
  const bandMinPx = Math.max(BAND_MIN_FLOOR_PX, Math.min(BAND_MIN_CEIL_PX, vhTerm));

  const fixedStack = (h) => h + birthdayH + alertRailH + gigH + shellOverheadPx;
  const remainder = (h) => scHomeH - fixedStack(h);

  let bandRemainderPx = remainder(heroH);
  let budgetExhausted = false;
  let bandViewportMinH = bandMinPx;

  if (bandRemainderPx < bandMinPx && heroH === HERO_DENSE_PX) {
    heroH = HERO_SPARSE_PX;
    pass = 2;
    bandRemainderPx = remainder(heroH);
  }
  if (bandRemainderPx < bandMinPx && heroH > HERO_COMPRESS_FLOOR) {
    heroH = HERO_COMPRESS_FLOOR;
    pass = 3;
    bandRemainderPx = remainder(heroH);
  }
  if (bandRemainderPx < bandMinPx) {
    budgetExhausted = true;
    bandViewportMinH = Math.max(BAND_ABSOLUTE_FLOOR, bandRemainderPx);
  }

  return { heroH, bandViewportMinH, budgetExhausted, pass };
}

function assertDeterministicBudgetCheck() {
  const tight = computeBudgetMirror({
    scHomeH: 552,
    alertState: 'both',
    gigState: 'countdown',
    birthdayVisible: true,
    birthdayH: 58,
    viewportH: 800,
    gigSlotPx: 144,
  });
  if (!tight.budgetExhausted) {
    fail('Deterministic budget check: expected budgetExhausted for dense H3+birthday @ 552px');
  }
  if (tight.pass < 2) {
    fail('Deterministic budget check: expected hero step-down pass >= 2 for tight dense stack');
  }
  if (tight.bandViewportMinH < 20) {
    fail('Deterministic budget check: bandViewportMinH must respect BAND_ABSOLUTE_FLOOR');
  }

  const sparse = computeBudgetMirror({
    scHomeH: 700,
    alertState: 'none',
    gigState: 'countdown',
    birthdayVisible: false,
    birthdayH: 0,
    viewportH: 800,
    gigSlotPx: 144,
  });
  if (sparse.budgetExhausted) {
    fail('Deterministic budget check: sparse H0 should not exhaust budget @ 700px');
  }
  if (sparse.heroH !== 318) {
    fail('Deterministic budget check: sparse hero should remain 318px');
  }
}

function assertLayoutEnginePhase5c(layoutJs) {
  const requiredSymbols = [
    'computeBudget',
    '_readInputs',
    '_applyBudgetTokens',
    '_clearBudgetTokens',
    '_scheduleDeferredReconcile',
    '_isHomeActive',
    'HERO_SPARSE_PX',
    'HERO_DENSE_PX',
    'HERO_COMPRESS_FLOOR',
    'BAND_ABSOLUTE_FLOOR',
    'budgetExhausted',
    '__ootHomeLayoutBudget',
    'BUDGET_TOKEN_NAMES',
  ];
  for (const sym of requiredSymbols) {
    if (!layoutJs.includes(sym)) {
      fail(`oot_home_layout_engine.js missing Phase 5c symbol: ${sym}`);
    }
  }

  for (const token of REQUIRED_CSS_TOKENS) {
    if (!layoutJs.includes(token)) {
      fail(`oot_home_layout_engine.js must reference pilot token: ${token}`);
    }
  }

  if (!layoutJs.includes('removeProperty')) {
    fail('oot_home_layout_engine.js must remove pilot tokens in legacy path (removeProperty)');
  }
  if (!layoutJs.includes('setProperty')) {
    fail('oot_home_layout_engine.js must write pilot tokens via setProperty');
  }
  if (!layoutJs.includes('_applyPilotBudget')) {
    fail('oot_home_layout_engine.js must gate budget writes behind pilot path (_applyPilotBudget)');
  }
  if (!layoutJs.includes('_applyLegacyShell')) {
    fail('oot_home_layout_engine.js must clear tokens in legacy path (_applyLegacyShell)');
  }
  if (!layoutJs.includes('getAlertRailState')) {
    fail('oot_home_layout_engine.js must read getAlertRailState()');
  }
  if (!layoutJs.includes('getGigSlotState')) {
    fail('oot_home_layout_engine.js must read getGigSlotState()');
  }
  if (!layoutJs.includes('birthday-banner')) {
    fail('oot_home_layout_engine.js must read #birthday-banner');
  }

  assertDeterministicBudgetCheck();
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
  console.log('Running Phase 5 Home layout engine integrity checks...\n');

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

  if (!html.includes(LAYOUT_CSS_HREF)) {
    fail(`index.html missing stylesheet link: ${LAYOUT_CSS_HREF}`);
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
  const layoutCssPos = findStylesheetPositions(html, LAYOUT_CSS_HREF);
  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');
  const bootstrapPos = html.indexOf(BOOTSTRAP_MARKER);

  if (layoutEnginePos === -1) {
    fail('Could not locate oot_home_layout_engine.js script tag in index.html');
  }
  if (layoutCssPos === -1) {
    fail(`Could not locate ${LAYOUT_CSS_HREF} link tag in index.html`);
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
  if (layoutEnginePos !== -1 && layoutCssPos !== -1 && layoutEnginePos > layoutCssPos) {
    fail(`Expected oot_home_layout_engine.js to load before ${LAYOUT_CSS_HREF}`);
  }
  if (layoutCssPos !== -1 && diagPos !== -1 && layoutCssPos > diagPos) {
    fail(`Expected ${LAYOUT_CSS_HREF} to load before oot_home_diag.js`);
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

  assertGitFileUnchanged('index.html', 'Phase 5c');
  assertGitFileUnchanged('oot_home_layout_engine.css', 'Phase 5c');

  const changedFiles = gitChangedFiles();
  for (const protectedFile of PROTECTED_MODULE_FILES) {
    if (changedFiles.includes(protectedFile)) {
      fail(`Phase 5 must not modify protected module: ${protectedFile}`);
    }
  }
  if (changedFiles.includes('oot_home_layout_engine.css')) {
    fail('Phase 5c must not modify oot_home_layout_engine.css');
  }
  if (changedFiles.includes('index.html')) {
    fail('Phase 5c must not modify index.html');
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
    assertLayoutEnginePhase5c(layoutJs);
  }

  if (exists('oot_home_layout_engine.css')) {
    const layoutCss = read('oot_home_layout_engine.css');
    if (!layoutCss.includes('Phase 5b: HomeLayoutEngine pilot CSS')) {
      fail('oot_home_layout_engine.css missing Phase 5b header comment');
    }
    for (const token of REQUIRED_CSS_TOKENS) {
      if (!layoutCss.includes(token)) {
        fail(`oot_home_layout_engine.css missing required token: ${token}`);
      }
    }
    assertPilotScopedCss(layoutCss);
    scanForbidden(layoutCss, 'oot_home_layout_engine.css', ['modular-inflow']);
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

  scanForbidden(html, 'index.html (Phase 5 diff should not add banned strings)');

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

  console.log('All Phase 5 Home layout engine integrity checks passed.\n');
}

main();
