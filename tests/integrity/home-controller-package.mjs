#!/usr/bin/env node
/**
 * Static Phase 6i-a + Phase 6k-b + Phase 6k-c + Phase 6k-d Home controller integrity checks. Test-only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'index.html',
  'oot_home_controller.js',
  'oot_home_cue_renderer.js',
  'oot_compat_home.js',
];

const REQUIRED_SCRIPT_REFS = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_cue_renderer.js',
  'oot_home_gig_slot.js',
  'oot_home_layout_engine.js',
  'oot_home_diag.js',
  'oot_home_controller.js',
  'oot_compat_home.js',
];

const CONTROLLER_SRC = 'oot_home_controller.js';
const BOOTSTRAP_MARKER = "var savedName=localStorage.getItem('oot_me')";
const RHOM_HOOK = "reconcileHomeLayout('rHome')";
const GO_HOME_ORCHESTRATE_MARKER = "enterHomeTab('go')";
const GO_HOME_LEGACY_FALLBACK = "else if (typeof rHome === 'function') rHome();";

const REQUIRED_API_SYMBOLS = [
  'window.OOT.home.controller',
  'activate',
  'requestReconcile',
  'notifyCueChange',
  'notifyImageRefresh',
  'notifyGigSlotChange',
  'enterHomeTab',
  'consumeSkipRHomeActivate',
  'getState',
  'getReconcileCoalescerState',
  'reconcileCoalesceFlush',
  'reconcileCoalesceExecute',
  '_enqueueReconcileCoalesce',
  '_flushReconcileCoalescer',
  '_resolveLegacyReconcileDelegate',
  '_clearReconcileCoalescerPending',
  'duplicateCount',
  'pendingReason',
  'executionEnabled',
  'skippedRHomeExecution',
  'lastDelegatedReason',
  'requestRHomeTailReconcile',
  '6e-b-reconcile-delegate',
  'window.rHome',
];

const REQUIRED_INDEX_HOOKS = [
  "activateHome('rHome')",
  "notifyCueChange('renderHomeSongVoteCue')",
  "notifyCueChange('renderHomeRehearsalCue')",
  "notifyGigSlotChange('updateCountdown:pending')",
  "notifyGigSlotChange('updateCountdown:no-gigs')",
  "notifyGigSlotChange('updateCountdown:countdown')",
  "notifyImageRefresh('home-band-image-load')",
  "notifyImageRefresh('rehearsal-cue hidden no events')",
  "notifyImageRefresh('rehearsal-cue hidden no next rehearsal')",
  "notifyImageRefresh('rehearsal-cue visible')",
  "notifyImageRefresh('rHome final')",
  "requestHomeReconcile('rHome')",
  "requestHomeReconcile('cue:song-vote')",
  "requestHomeReconcile('cue:rehearsal')",
  GO_HOME_ORCHESTRATE_MARKER,
  'consumeHomeRHomeActivateSkip',
];

const PROTECTED_MODULE_FILES = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_gig_slot.js',
  'oot_home_layout_engine.js',
  'oot_home_layout_engine.css',
];

const COALESCER_SCAFFOLD_MARKERS = [
  '_reconcileCoalescer',
  '_enqueueReconcileCoalesce',
  '_scheduleReconcileCoalescerFlush',
  '_flushReconcileCoalescer',
  '_resolveLegacyReconcileDelegate',
  '_clearReconcileCoalescerPending',
  'reconcileCoalesceFlush',
  'reconcileCoalesceExecute',
  'getReconcileCoalescerState',
  'duplicateCount',
  'coalescedRequestCount',
  'executionEnabled',
  'skippedRHomeExecution',
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

const PHASE_6E_C_SONG_VOTE_RECONCILE_HOOK =
  "try { var _hs=document.getElementById('sc-home'); if(_hs&&_hs.classList.contains('on')&&typeof requestHomeReconcile==='function')requestHomeReconcile('cue:song-vote'); } catch(e){}";

const PHASE_6G_REHEARSAL_RECONCILE_HOOK =
  "try { var _hs=document.getElementById('sc-home'); if(_hs&&_hs.classList.contains('on')&&typeof requestHomeReconcile==='function')requestHomeReconcile('cue:rehearsal'); } catch(e){}";

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

function assertRecordOnlyController(controllerJs) {
  for (const sym of REQUIRED_API_SYMBOLS) {
    if (!controllerJs.includes(sym)) {
      fail(`oot_home_controller.js missing required symbol: ${sym}`);
    }
  }

  for (const call of FORBIDDEN_BEHAVIOR_CALLS) {
    if (controllerJs.includes(call)) {
      fail(`Home controller must not reference behavior hook: ${call}`);
    }
  }

  if (!controllerJs.includes('scaffold: true')) {
    fail('oot_home_controller.js must declare scaffold: true in internal state');
  }

  if (controllerJs.includes('modular-inflow')) {
    fail('oot_home_controller.js must not reference modular-inflow');
  }

  if (!controllerJs.includes('enterHomeTab')) {
    fail('oot_home_controller.js must expose enterHomeTab for Phase 6d orchestration');
  }
}

function assertReconcileDelegateBoundary(controllerJs) {
  if (!controllerJs.includes('window.reconcileHomeLayout')) {
    fail('coalescer must resolve legacy reconcile delegate via window.reconcileHomeLayout');
  }

  if (!controllerJs.includes("flushReason === 'rHome'")) {
    fail('coalescer flush must skip legacy reconcile delegate when pendingReason is rHome');
  }

  if (!controllerJs.includes('skippedRHomeExecution')) {
    fail('coalescer must track skippedRHomeExecution for rHome dedupe');
  }

  if (!controllerJs.includes("_record('reconcileCoalesceExecute'")) {
    fail('coalescer must record reconcileCoalesceExecute when delegating to legacy reconcile');
  }

  if (!controllerJs.includes('executionEnabled')) {
    fail('coalescer must expose executionEnabled guard');
  }

  if (!controllerJs.includes('layout.reconcile')) {
    fail('coalescer delegate must fall back to OOT.home.layout.reconcile');
  }

  const flushBody = controllerJs.slice(
    controllerJs.indexOf('function _flushReconcileCoalescer'),
    controllerJs.indexOf('function _enqueueReconcileCoalesce')
  );
  const rHomeGuardPos = flushBody.indexOf("flushReason === 'rHome'");
  const delegatePos = flushBody.indexOf('_resolveLegacyReconcileDelegate');
  if (rHomeGuardPos === -1 || delegatePos === -1 || rHomeGuardPos > delegatePos) {
    fail('rHome skip guard must appear before legacy reconcile delegate invoke in flush');
  }
}

function assertReconcileCoalescerScaffold(controllerJs) {
  for (const marker of COALESCER_SCAFFOLD_MARKERS) {
    if (!controllerJs.includes(marker)) {
      fail(`oot_home_controller.js missing reconcile coalescer scaffold marker: ${marker}`);
    }
  }

  if (!controllerJs.includes('_enqueueReconcileCoalesce(parsed.reason)')) {
    fail('requestReconcile must enqueue reconcile coalescer with parsed reason');
  }

  if (!controllerJs.includes("_record('reconcileCoalesceFlush'")) {
    fail('coalescer flush must record reconcileCoalesceFlush events');
  }

  if (!controllerJs.includes('reconcileCoalescer: getReconcileCoalescerState()')) {
    fail('getState must expose reconcileCoalescer snapshot');
  }

  if (!controllerJs.includes('pendingReason')) {
    fail('coalescer must retain pending request reason');
  }

  if (!controllerJs.includes('duplicateCount')) {
    fail('coalescer must track duplicate reconcile requests');
  }
}

function assertProtectedModulesUntouched() {
  for (const relPath of PROTECTED_MODULE_FILES) {
    if (!exists(relPath)) {
      fail(`Missing protected module file expected untouched: ${relPath}`);
    }
  }
}

function assertCompatShim(compatJs) {
  if (!compatJs.includes('window.OOT.home.controller')) {
    fail('oot_compat_home.js must restore controller globals from window.OOT.home.controller');
  }
  if (!compatJs.includes('activateHome')) {
    fail('oot_compat_home.js must expose activateHome legacy global when missing');
  }
  if (!compatJs.includes('enterHomeTab')) {
    fail('oot_compat_home.js must expose enterHomeTab legacy global when missing');
  }
  if (!compatJs.includes('consumeHomeRHomeActivateSkip')) {
    fail('oot_compat_home.js must expose consumeHomeRHomeActivateSkip legacy global when missing');
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

  if (!html.includes(GO_HOME_ORCHESTRATE_MARKER)) {
    fail(`index.html go('home') must delegate via ${GO_HOME_ORCHESTRATE_MARKER}`);
  }

  if (!html.includes(GO_HOME_LEGACY_FALLBACK)) {
    fail('index.html go(\'home\') must retain legacy rHome fallback when enterHomeTab is missing');
  }

  if (html.includes("if (id === 'home') rHome();")) {
    fail('index.html must not call rHome() directly from go(\'home\'); use enterHomeTab delegate');
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
  }

  if (html.includes('HomeController.activate')) {
    fail('index.html must use compat globals (activateHome), not HomeController.activate');
  }

  for (const hook of REQUIRED_INDEX_HOOKS) {
    if (!html.includes(hook)) {
      fail(`index.html missing Phase 6c record-only hook: ${hook}`);
    }
  }

  const reconcilePos = html.indexOf(RHOM_HOOK);
  const requestPos = html.indexOf("requestHomeReconcile('rHome')");
  if (requestPos === -1 || reconcilePos === -1 || requestPos >= reconcilePos) {
    fail('requestHomeReconcile(\'rHome\') must appear immediately before reconcileHomeLayout(\'rHome\')');
  }

  const rHomeDef = html.indexOf('function rHome()');
  const activatePos = html.indexOf("activateHome('rHome')");
  if (rHomeDef === -1 || activatePos === -1 || activatePos <= rHomeDef) {
    fail('activateHome(\'rHome\') must appear at rHome lifecycle entry after function rHome()');
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

function assertPhase6eCSongVotePilot(html) {
  const pilotCount = countOccurrences(html, "requestHomeReconcile('cue:song-vote')");
  if (pilotCount !== 2) {
    fail(`renderHomeSongVoteCue must contain exactly two requestHomeReconcile('cue:song-vote') hooks (found ${pilotCount})`);
  }

  const fnStart = html.indexOf('function renderHomeSongVoteCue');
  const fnEnd = html.indexOf('\nfunction ', fnStart + 1);
  if (fnStart === -1 || fnEnd === -1) {
    fail('Could not locate renderHomeSongVoteCue function body in index.html');
  }
  const fnBody = html.slice(fnStart, fnEnd);

  if (fnBody.includes('reconcileHomeLayout')) {
    fail('renderHomeSongVoteCue must not call reconcileHomeLayout directly');
  }

  if (!fnBody.includes(PHASE_6E_C_SONG_VOTE_RECONCILE_HOOK)) {
    fail('renderHomeSongVoteCue must use Home-active gated requestHomeReconcile pilot hook');
  }

  const hiddenBranch = fnBody.slice(fnBody.indexOf('renderHomeSongVoteCue:hidden'));
  const visibleBranch = fnBody.slice(fnBody.indexOf('renderHomeSongVoteCue:visible'));
  for (const label of ['hidden branch', 'visible branch']) {
    const branch = label === 'hidden branch' ? hiddenBranch : visibleBranch;
    const syncPos = branch.indexOf("syncAlertRailState('renderHomeSongVoteCue')");
    const pilotPos = branch.indexOf("requestHomeReconcile('cue:song-vote')");
    if (syncPos === -1 || pilotPos === -1 || syncPos > pilotPos) {
      fail(`renderHomeSongVoteCue ${label} must call syncAlertRailState before requestHomeReconcile('cue:song-vote')`);
    }
  }
}

function assertPhase6gRehearsalPilot(html) {
  const pilotCount = countOccurrences(html, "requestHomeReconcile('cue:rehearsal')");
  if (pilotCount !== 3) {
    fail(`renderHomeRehearsalCue must contain exactly three requestHomeReconcile('cue:rehearsal') hooks (found ${pilotCount})`);
  }

  const fnStart = html.indexOf('function renderHomeRehearsalCue');
  const fnEnd = html.indexOf('\nfunction renderHomeSongVoteCue');
  if (fnStart === -1 || fnEnd === -1) {
    fail('Could not locate renderHomeRehearsalCue function body in index.html');
  }
  const fnBody = html.slice(fnStart, fnEnd);

  if (fnBody.includes('reconcileHomeLayout')) {
    fail('renderHomeRehearsalCue must not call reconcileHomeLayout directly');
  }

  if (!fnBody.includes(PHASE_6G_REHEARSAL_RECONCILE_HOOK)) {
    fail('renderHomeRehearsalCue must use Home-active gated requestHomeReconcile pilot hook');
  }

  const branches = [
    ['hidden-no-events branch', 'renderHomeRehearsalCue:hidden-no-events'],
    ['hidden-no-rehearsal branch', 'renderHomeRehearsalCue:hidden-no-rehearsal'],
    ['visible branch', 'renderHomeRehearsalCue:visible'],
  ];
  for (const pair of branches) {
    const label = pair[0];
    const marker = pair[1];
    const branch = fnBody.slice(fnBody.indexOf(marker));
    const syncPos = branch.indexOf("syncAlertRailState('renderHomeRehearsalCue')");
    const pilotPos = branch.indexOf("requestHomeReconcile('cue:rehearsal')");
    if (syncPos === -1 || pilotPos === -1 || syncPos > pilotPos) {
      fail(`renderHomeRehearsalCue ${label} must call syncAlertRailState before requestHomeReconcile('cue:rehearsal')`);
    }
  }

  const songVoteCount = countOccurrences(html, "requestHomeReconcile('cue:song-vote')");
  if (songVoteCount !== 2) {
    fail(`Phase 6g must preserve exactly two requestHomeReconcile('cue:song-vote') hooks (found ${songVoteCount})`);
  }
}

function assertPhase6iGigTimerSafePilot(html) {
  if (!html.includes('var _homeGigSlotReconcileSig')) {
    fail('index.html must declare _homeGigSlotReconcileSig for gig reconcile dedupe');
  }

  if (!html.includes('function _maybeRequestHomeGigReconcile')) {
    fail('index.html must define _maybeRequestHomeGigReconcile helper');
  }

  const helperStart = html.indexOf('function _maybeRequestHomeGigReconcile');
  const helperEnd = html.indexOf('function updateCountdown');
  if (helperStart === -1 || helperEnd === -1 || helperEnd <= helperStart) {
    fail('Could not locate _maybeRequestHomeGigReconcile helper body in index.html');
  }
  const helperBody = html.slice(helperStart, helperEnd);

  if (!helperBody.includes("requestHomeReconcile('gig:' + nextState)")) {
    fail('_maybeRequestHomeGigReconcile must call requestHomeReconcile with gig: reason prefix');
  }

  if (!html.includes("_maybeRequestHomeGigReconcile('pending', '')")) {
    fail('expected gig:pending reconcile path via _maybeRequestHomeGigReconcile(\'pending\', \'\')');
  }
  if (!html.includes("_maybeRequestHomeGigReconcile('no-gigs', '')")) {
    fail('expected gig:no-gigs reconcile path via _maybeRequestHomeGigReconcile(\'no-gigs\', \'\')');
  }
  if (!html.includes("_maybeRequestHomeGigReconcile('countdown', gigKey)")) {
    fail('expected gig:countdown reconcile path via _maybeRequestHomeGigReconcile(\'countdown\', gigKey)');
  }

  const homeGatePos = helperBody.indexOf("document.getElementById('sc-home')");
  const sigAssignPos = helperBody.indexOf('_homeGigSlotReconcileSig = sig');
  const fnCheckPos = helperBody.indexOf("typeof requestHomeReconcile !== 'function'");
  if (homeGatePos === -1 || sigAssignPos === -1 || fnCheckPos === -1) {
    fail('_maybeRequestHomeGigReconcile must gate on Home-active tab and requestHomeReconcile availability');
  }
  if (homeGatePos > sigAssignPos || fnCheckPos > sigAssignPos) {
    fail('_homeGigSlotReconcileSig must be updated only after Home-active gate and requestHomeReconcile function check');
  }

  const updateStart = html.indexOf('function updateCountdown');
  const updateEnd = html.indexOf('// ── NO GIGS CARD');
  if (updateStart === -1 || updateEnd === -1) {
    fail('Could not locate updateCountdown function body in index.html');
  }
  const updateBody = html.slice(updateStart, updateEnd);

  const tickStart = updateBody.indexOf('function tick()');
  const tickEnd = updateBody.indexOf('countdownInterval = setInterval(tick, 30000)');
  if (tickStart === -1 || tickEnd === -1) {
    fail('Could not locate updateCountdown tick() callback in index.html');
  }
  const tickBody = updateBody.slice(tickStart, tickEnd + 'countdownInterval = setInterval(tick, 30000)'.length);

  if (tickBody.includes('requestHomeReconcile') || tickBody.includes('_maybeRequestHomeGigReconcile')) {
    fail('tick() must not call requestHomeReconcile or _maybeRequestHomeGigReconcile');
  }

  if (!updateBody.includes("_maybeRequestHomeGigReconcile('pending', '')")) {
    fail('updateCountdown pending branch must call _maybeRequestHomeGigReconcile(\'pending\', \'\')');
  }
  if (!updateBody.includes("_maybeRequestHomeGigReconcile('no-gigs', '')")) {
    fail('updateCountdown no-gigs branch must call _maybeRequestHomeGigReconcile(\'no-gigs\', \'\')');
  }
  if (!updateBody.includes("_maybeRequestHomeGigReconcile('countdown', gigKey)")) {
    fail('updateCountdown countdown branch must call _maybeRequestHomeGigReconcile(\'countdown\', gigKey)');
  }

  const htmlOutsideHelper = html.slice(0, helperStart) + html.slice(helperEnd);
  const directGigHookCount = (htmlOutsideHelper.match(/requestHomeReconcile\('gig:/g) || []).length;
  if (directGigHookCount > 0) {
    fail('requestHomeReconcile(\'gig:...\') must only appear inside _maybeRequestHomeGigReconcile');
  }

  if (updateBody.includes('reconcileHomeLayout')) {
    fail('updateCountdown must not call reconcileHomeLayout directly');
  }

  const pendingBranch = updateBody.slice(updateBody.indexOf('reserveGigSlotPending()'));
  const noGigsBranch = updateBody.slice(updateBody.indexOf("syncGigSlotState('updateCountdown:no-gigs')"));
  const countdownBranch = updateBody.slice(updateBody.indexOf("syncGigSlotState('updateCountdown:countdown')"));
  for (const pair of [
    ['pending branch', pendingBranch, "notifyGigSlotChange('updateCountdown:pending')", "_maybeRequestHomeGigReconcile('pending', '')"],
    ['no-gigs branch', noGigsBranch, "notifyGigSlotChange('updateCountdown:no-gigs')", "_maybeRequestHomeGigReconcile('no-gigs', '')"],
    ['countdown branch', countdownBranch, "notifyGigSlotChange('updateCountdown:countdown')", "_maybeRequestHomeGigReconcile('countdown', gigKey)"],
  ]) {
    const branch = pair[1];
    const beforePos = branch.indexOf(pair[2]);
    const hookPos = branch.indexOf(pair[3]);
    if (beforePos === -1 || hookPos === -1 || beforePos > hookPos) {
      fail(`updateCountdown ${pair[0]} must call existing sync/notify before _maybeRequestHomeGigReconcile`);
    }
  }
}

function assertPhase6kBRHomeTailDiag(html) {
  if (!html.includes('window.__ootRHomeTailDiag')) {
    fail('index.html must declare window.__ootRHomeTailDiag read-only diagnostic state');
  }

  if (!html.includes('function _recordRHomeTailReconcileDiag')) {
    fail('index.html must define _recordRHomeTailReconcileDiag helper');
  }

  if (!html.includes('window.__ootGetRHomeTailDiag')) {
    fail('index.html must expose read-only window.__ootGetRHomeTailDiag getter');
  }

  const helperStart = html.indexOf('function _recordRHomeTailReconcileDiag');
  const helperEnd = html.indexOf('function rHome()');
  if (helperStart === -1 || helperEnd === -1 || helperEnd <= helperStart) {
    fail('Could not locate _recordRHomeTailReconcileDiag helper body in index.html');
  }
  const helperBody = html.slice(helperStart, helperEnd);

  if (/\brequestHomeReconcile\s*\(/.test(helperBody)) {
    fail('_recordRHomeTailReconcileDiag must not call requestHomeReconcile');
  }
  if (/\breconcileHomeLayout\s*\(/.test(helperBody)) {
    fail('_recordRHomeTailReconcileDiag must not call reconcileHomeLayout');
  }
  if (helperBody.includes('localStorage')) {
    fail('_recordRHomeTailReconcileDiag must not write localStorage');
  }
  if (!helperBody.includes('d.recent.length > 10') || !helperBody.includes('d.recent.splice')) {
    fail('_recordRHomeTailReconcileDiag must cap recent array at 10 entries');
  }

  const getterStart = html.indexOf('window.__ootGetRHomeTailDiag = function');
  if (getterStart === -1) {
    fail('Could not locate __ootGetRHomeTailDiag getter in index.html');
  }
  const getterEnd = html.indexOf('function rHome()', getterStart);
  const getterBody = html.slice(getterStart, getterEnd);
  if (!getterBody.includes('JSON.parse(JSON.stringify(d))')) {
    fail('__ootGetRHomeTailDiag must return a JSON clone snapshot');
  }
  if (getterBody.includes('requestHomeReconcile') || getterBody.includes('reconcileHomeLayout')) {
    fail('__ootGetRHomeTailDiag must not call reconcile APIs');
  }

  const rHomeStart = html.indexOf('function rHome()');
  const rHomeEnd = html.indexOf('var memsOpen = false;');
  if (rHomeStart === -1 || rHomeEnd === -1) {
    fail('Could not locate rHome function body in index.html');
  }
  const rHomeBody = html.slice(rHomeStart, rHomeEnd);

  if (!rHomeBody.includes('_recordRHomeTailReconcileDiag()')) {
    fail('rHome must call _recordRHomeTailReconcileDiag before tail reconcile');
  }

  const recordPos = rHomeBody.indexOf('_recordRHomeTailReconcileDiag()');
  const adapterPos = rHomeBody.indexOf('requestRHomeTailReconcile');
  const requestPos = rHomeBody.indexOf("requestHomeReconcile('rHome')");
  const reconcilePos = rHomeBody.indexOf(RHOM_HOOK);
  if (recordPos === -1 || adapterPos === -1 || requestPos === -1 || reconcilePos === -1) {
    fail('rHome tail must contain record helper, adapter seam, and legacy fallback reconcile hooks');
  }
  if (recordPos >= adapterPos) {
    fail('rHome tail order must be _recordRHomeTailReconcileDiag before requestRHomeTailReconcile adapter');
  }
  if (requestPos >= reconcilePos) {
    fail('rHome legacy fallback must call requestHomeReconcile before reconcileHomeLayout');
  }
  if (!rHomeBody.includes('else {') || rHomeBody.indexOf('else {') > requestPos) {
    fail('rHome legacy fallback requestHomeReconcile/reconcileHomeLayout must live in else branch');
  }

  const requestCount = (html.match(/requestHomeReconcile\('rHome'\)/g) || []).length;
  if (requestCount !== 1) {
    fail(`index.html must contain exactly one requestHomeReconcile('rHome') fallback hook (found ${requestCount})`);
  }

  const reconcileCount = (html.match(/reconcileHomeLayout\('rHome'\)/g) || []).length;
  if (reconcileCount !== 1) {
    fail(`index.html must contain exactly one reconcileHomeLayout('rHome') fallback hook (found ${reconcileCount})`);
  }
}

function assertPhase6kCRHomeTailAdapter(html, controllerJs) {
  if (!controllerJs.includes('function requestRHomeTailReconcile')) {
    fail('oot_home_controller.js must define requestRHomeTailReconcile adapter');
  }

  if (!controllerJs.includes('requestRHomeTailReconcile: requestRHomeTailReconcile')) {
    fail('oot_home_controller.js api must expose requestRHomeTailReconcile');
  }

  const adapterStart = controllerJs.indexOf('function requestRHomeTailReconcile');
  const adapterEnd = controllerJs.indexOf('function getReconcileCoalescerState', adapterStart);
  if (adapterStart === -1 || adapterEnd === -1) {
    fail('Could not locate requestRHomeTailReconcile adapter body');
  }
  const adapterBody = controllerJs.slice(adapterStart, adapterEnd);

  if (adapterBody.includes('rHome(')) {
    fail('requestRHomeTailReconcile must not call rHome');
  }
  if (adapterBody.includes('document.getElementById') || adapterBody.includes('querySelector')) {
    fail('requestRHomeTailReconcile must not read DOM');
  }
  if (adapterBody.includes('classList') || adapterBody.includes('setProperty')) {
    fail('requestRHomeTailReconcile must not write CSS vars or DOM classes');
  }
  if (adapterBody.includes('localStorage.setItem') || adapterBody.includes('localStorage.removeItem')) {
    fail('requestRHomeTailReconcile must not write localStorage');
  }
  if (adapterBody.includes('setInterval') || adapterBody.includes('setTimeout')) {
    fail('requestRHomeTailReconcile must not schedule timers');
  }
  if (adapterBody.includes('addEventListener')) {
    fail('requestRHomeTailReconcile must not add listeners');
  }

  if (!adapterBody.includes("requestReconcile('rHome'")) {
    fail("requestRHomeTailReconcile must preserve requestReconcile('rHome') passthrough");
  }
  if (!adapterBody.includes("delegate.call(window, 'rHome')")) {
    fail("requestRHomeTailReconcile must preserve direct reconcileHomeLayout('rHome') passthrough");
  }
  if (!adapterBody.includes("_record('requestRHomeTailReconcile'")) {
    fail('requestRHomeTailReconcile must record adapter journal entry');
  }

  const rHomeStart = html.indexOf('function rHome()');
  const rHomeEnd = html.indexOf('var memsOpen = false;');
  const rHomeBody = html.slice(rHomeStart, rHomeEnd);

  if (!rHomeBody.includes('window.OOT && window.OOT.home && window.OOT.home.controller')) {
    fail('rHome tail must resolve HomeController adapter via OOT.home.controller');
  }
  if (!rHomeBody.includes("requestRHomeTailReconcile({ source: 'rHome:tail' })")) {
    fail('rHome tail must invoke requestRHomeTailReconcile adapter with rHome:tail source');
  }
  if (!rHomeBody.includes("requestHomeReconcile('rHome')") || !rHomeBody.includes("reconcileHomeLayout('rHome')")) {
    fail('rHome tail must retain legacy fallback request/reconcile hooks');
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
  }
}

function assertPhase6kDRHomeTailAdapterRouting(html, controllerJs) {
  const rHomeStart = html.indexOf('function rHome()');
  const rHomeEnd = html.indexOf('var memsOpen = false;');
  if (rHomeStart === -1 || rHomeEnd === -1) {
    fail('Could not locate rHome function body in index.html');
  }
  const rHomeBody = html.slice(rHomeStart, rHomeEnd);

  const recordPos = rHomeBody.indexOf('_recordRHomeTailReconcileDiag()');
  const adapterPos = rHomeBody.indexOf('requestRHomeTailReconcile({ source: \'rHome:tail\' })');
  const elsePos = rHomeBody.indexOf('else {', recordPos);
  if (recordPos === -1 || adapterPos === -1 || elsePos === -1) {
    fail('rHome tail must contain diagnostic, adapter routing, and legacy fallback else branch');
  }
  if (recordPos >= adapterPos || adapterPos >= elsePos) {
    fail('rHome tail order must be diagnostic, adapter routing, then fallback else branch');
  }

  const primaryPath = rHomeBody.slice(recordPos, elsePos);
  const fallbackPath = rHomeBody.slice(elsePos);

  if (primaryPath.includes("requestHomeReconcile('rHome')") || primaryPath.includes("reconcileHomeLayout('rHome')")) {
    fail('normal rHome tail path must route exclusively through requestRHomeTailReconcile adapter');
  }
  if (!fallbackPath.includes("requestHomeReconcile('rHome')") || !fallbackPath.includes("reconcileHomeLayout('rHome')")) {
    fail('legacy fallback else branch must retain requestHomeReconcile and reconcileHomeLayout');
  }

  const requestCount = (html.match(/requestHomeReconcile\('rHome'\)/g) || []).length;
  if (requestCount !== 1) {
    fail(`index.html must contain exactly one requestHomeReconcile('rHome') fallback hook (found ${requestCount})`);
  }

  const reconcileCount = (html.match(/reconcileHomeLayout\('rHome'\)/g) || []).length;
  if (reconcileCount !== 1) {
    fail(`index.html must contain exactly one reconcileHomeLayout('rHome') fallback hook (found ${reconcileCount})`);
  }

  const adapterStart = controllerJs.indexOf('function requestRHomeTailReconcile');
  const adapterEnd = controllerJs.indexOf('function getReconcileCoalescerState', adapterStart);
  const adapterBody = controllerJs.slice(adapterStart, adapterEnd);

  if (!adapterBody.includes("requestReconcile('rHome'")) {
    fail("adapter must own requestReconcile('rHome') on normal path");
  }
  if (!adapterBody.includes("delegate.call(window, 'rHome')")) {
    fail("adapter must own delegate.call(window, 'rHome') on normal path");
  }
  if (!adapterBody.includes("reason: 'rHome'")) {
    fail("adapter result must preserve reason string 'rHome'");
  }
  if (adapterBody.includes('rHome(')) {
    fail('adapter must not call rHome');
  }
}

function assertPhase6lBHomeCueRenderDiag(html) {
  if (!html.includes('window.__ootHomeCueRenderDiag')) {
    fail('index.html must declare window.__ootHomeCueRenderDiag read-only diagnostic state');
  }

  if (!html.includes('function _recordHomeCueRenderDiag')) {
    fail('index.html must define _recordHomeCueRenderDiag helper');
  }

  if (!html.includes('window.__ootGetHomeCueRenderDiag')) {
    fail('index.html must expose read-only window.__ootGetHomeCueRenderDiag getter');
  }

  const helperStart = html.indexOf('function _recordHomeCueRenderDiag');
  const helperEnd = html.indexOf('if (typeof window.__ootGetHomeCueRenderDiag');
  if (helperStart === -1 || helperEnd === -1 || helperEnd <= helperStart) {
    fail('Could not locate _recordHomeCueRenderDiag helper body in index.html');
  }
  const helperBody = html.slice(helperStart, helperEnd);

  if (/\brHome\s*\(/.test(helperBody)) {
    fail('_recordHomeCueRenderDiag must not call rHome');
  }
  if (/\brequestHomeReconcile\s*\(/.test(helperBody)) {
    fail('_recordHomeCueRenderDiag must not call requestHomeReconcile');
  }
  if (/\breconcileHomeLayout\s*\(/.test(helperBody)) {
    fail('_recordHomeCueRenderDiag must not call reconcileHomeLayout');
  }
  if (helperBody.includes('localStorage')) {
    fail('_recordHomeCueRenderDiag must not write localStorage');
  }
  if (!helperBody.includes('byCue') || !helperBody.includes('songVote') || !helperBody.includes('rehearsal')) {
    fail('_recordHomeCueRenderDiag must track byCue.songVote and byCue.rehearsal counters');
  }
  if (!helperBody.includes('d.recent.length > 12') || !helperBody.includes('d.recent.splice')) {
    fail('_recordHomeCueRenderDiag must cap recent array at 12 entries');
  }

  const getterStart = html.indexOf('window.__ootGetHomeCueRenderDiag = function');
  const getterEnd = html.indexOf('function renderHomeRehearsalCue', getterStart);
  if (getterStart === -1 || getterEnd === -1) {
    fail('Could not locate __ootGetHomeCueRenderDiag getter in index.html');
  }
  const getterBody = html.slice(getterStart, getterEnd);
  if (!getterBody.includes('JSON.parse(JSON.stringify(d))')) {
    fail('__ootGetHomeCueRenderDiag must return a JSON clone snapshot');
  }
  if (getterBody.includes('requestHomeReconcile') || getterBody.includes('reconcileHomeLayout') || getterBody.includes('rHome')) {
    fail('__ootGetHomeCueRenderDiag must not call reconcile APIs or rHome');
  }

  const songStart = html.indexOf('function renderHomeSongVoteCue');
  const songEnd = html.indexOf('// r810: unordered fallback listeners', songStart);
  if (songStart === -1 || songEnd === -1) {
    fail('Could not locate renderHomeSongVoteCue function body in index.html');
  }
  const songBody = html.slice(songStart, songEnd);
  const songDiagCount = (songBody.match(/_recordHomeCueRenderDiag\('songVote'/g) || []).length;
  if (songDiagCount !== 2) {
    fail(`renderHomeSongVoteCue must call _recordHomeCueRenderDiag exactly twice (found ${songDiagCount})`);
  }
  if (!html.includes('Song Vote Pending')) {
    fail('renderHomeSongVoteCue must preserve Song Vote Pending kicker string');
  }

  const rehearsalStart = html.indexOf('function renderHomeRehearsalCue');
  const rehearsalEnd = html.indexOf('function renderHomeSongVoteCue');
  if (rehearsalStart === -1 || rehearsalEnd === -1) {
    fail('Could not locate renderHomeRehearsalCue function body in index.html');
  }
  const rehearsalBody = html.slice(rehearsalStart, rehearsalEnd);
  const rehearsalDiagCount = (rehearsalBody.match(/_recordHomeCueRenderDiag\('rehearsal'/g) || []).length;
  if (rehearsalDiagCount !== 3) {
    fail(`renderHomeRehearsalCue must call _recordHomeCueRenderDiag exactly three times (found ${rehearsalDiagCount})`);
  }
  if (!html.includes('Rehearsal on Deck')) {
    fail('renderHomeRehearsalCue must preserve Rehearsal on Deck kicker string');
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
  }
}

const CUE_RENDERER_FORBIDDEN_CALLS = [
  'rHome(',
  'requestHomeReconcile',
  'reconcileHomeLayout',
  'localStorage',
  'setProperty',
  'db.collection',
  'onSnapshot',
];

function assertCueRendererNoDirectDom(cueRendererJs, label) {
  if (/^\s+document\.(getElementById|querySelector)/m.test(cueRendererJs)) {
    fail(`${label} must not call document DOM APIs directly`);
  }
  if (/\.innerHTML\s*=/.test(cueRendererJs)) {
    fail(`${label} must not assign innerHTML directly`);
  }
}

function assertPhase6lCHomeCueRendererScaffold(html) {
  if (!exists('oot_home_cue_renderer.js')) {
    fail('oot_home_cue_renderer.js must exist for Phase 6l-c scaffold');
  }

  assertJsModule('oot_home_cue_renderer.js');
  const cueRendererJs = read('oot_home_cue_renderer.js');

  if (!cueRendererJs.includes('window.OOT.home.cueRenderer')) {
    fail('oot_home_cue_renderer.js must attach window.OOT.home.cueRenderer namespace');
  }

  const requiredMethods = [
    'getState',
    'snapshot',
    'describe',
    'canRenderSongVoteCue',
    'canRenderRehearsalCue',
    'buildSongVoteCueView',
    'renderSongVoteCueSnapshot',
    'renderRehearsalCueSnapshot',
  ];
  for (const method of requiredMethods) {
    if (!cueRendererJs.includes(method)) {
      fail(`oot_home_cue_renderer.js missing scaffold method: ${method}`);
    }
  }

  if (!cueRendererJs.includes('Song Vote Pending') || !cueRendererJs.includes('Rehearsal on Deck')) {
    fail('oot_home_cue_renderer.js must declare canonical cue kicker metadata only');
  }

  if (!cueRendererJs.includes('rendersDom: false')) {
    fail('oot_home_cue_renderer.js snapshot helpers must declare rendersDom: false');
  }

  if (!cueRendererJs.includes('scaffold: true')) {
    fail('oot_home_cue_renderer.js must declare scaffold: true in metadata');
  }

  for (const call of CUE_RENDERER_FORBIDDEN_CALLS) {
    if (cueRendererJs.includes(call)) {
      fail(`oot_home_cue_renderer.js must not reference forbidden behavior: ${call}`);
    }
  }
  assertCueRendererNoDirectDom(cueRendererJs, 'oot_home_cue_renderer.js');

  if (cueRendererJs.includes('modular-inflow')) {
    fail('oot_home_cue_renderer.js must not reference modular-inflow');
  }

  if (!html.includes('oot_home_cue_renderer.js')) {
    fail('index.html must include oot_home_cue_renderer.js script reference');
  }

  const alertRailPos = findScriptPositions(html, 'oot_home_alert_rail.js');
  const cueRendererPos = findScriptPositions(html, 'oot_home_cue_renderer.js');
  const gigSlotPos = findScriptPositions(html, 'oot_home_gig_slot.js');
  if (alertRailPos === -1 || cueRendererPos === -1 || gigSlotPos === -1) {
    fail('Could not locate Home cue renderer script load order anchors in index.html');
  }
  if (alertRailPos > cueRendererPos || cueRendererPos > gigSlotPos) {
    fail('Expected oot_home_alert_rail.js -> oot_home_cue_renderer.js -> oot_home_gig_slot.js load order');
  }

  if (!html.includes('function renderHomeSongVoteCue') || !html.includes('function renderHomeRehearsalCue')) {
    fail('index.html must retain legacy renderHomeSongVoteCue and renderHomeRehearsalCue owners');
  }

  if (!html.includes('Song Vote Pending') || !html.includes('Rehearsal on Deck')) {
    fail('index.html must preserve Song Vote Pending and Rehearsal on Deck kicker strings');
  }

  const compatJs = read('oot_compat_home.js');
  if (!compatJs.includes('window.OOT.home.cueRenderer')) {
    fail('oot_compat_home.js must restore read-only cue renderer globals from window.OOT.home.cueRenderer');
  }
  if (!compatJs.includes('getHomeCueRendererState')) {
    fail('oot_compat_home.js must expose getHomeCueRendererState read-only compat global');
  }
}

function assertPhase6lDSongVoteCueRouting(html) {
  const cueRendererJs = read('oot_home_cue_renderer.js');

  if (!cueRendererJs.includes('function buildSongVoteCueView')) {
    fail('oot_home_cue_renderer.js must define buildSongVoteCueView for Phase 6l-d routing');
  }

  const builderStart = cueRendererJs.indexOf('function buildSongVoteCueView');
  const builderEnd = cueRendererJs.indexOf('function renderSongVoteCueSnapshot', builderStart);
  if (builderStart === -1 || builderEnd === -1) {
    fail('Could not locate buildSongVoteCueView body in oot_home_cue_renderer.js');
  }
  const builderBody = cueRendererJs.slice(builderStart, builderEnd);

  for (const call of CUE_RENDERER_FORBIDDEN_CALLS) {
    if (builderBody.includes(call)) {
      fail(`buildSongVoteCueView must not reference forbidden behavior: ${call}`);
    }
  }
  assertCueRendererNoDirectDom(builderBody, 'buildSongVoteCueView');
  if (/\brHome\s*\(/.test(builderBody)) {
    fail('buildSongVoteCueView must not call rHome');
  }
  if (!builderBody.includes('Song Vote Pending')) {
    fail('buildSongVoteCueView must preserve Song Vote Pending kicker string');
  }
  if (!builderBody.includes('openSongVoteModal')) {
    fail('buildSongVoteCueView must preserve openSongVoteModal onclick handler');
  }
  if (!builderBody.includes('rendersDom: false')) {
    fail('buildSongVoteCueView must declare rendersDom: false');
  }

  const songStart = html.indexOf('function renderHomeSongVoteCue');
  const songEnd = html.indexOf('// r810: unordered fallback listeners', songStart);
  if (songStart === -1 || songEnd === -1) {
    fail('Could not locate renderHomeSongVoteCue function body in index.html');
  }
  const songBody = html.slice(songStart, songEnd);

  if (!songBody.includes('window.OOT.home.cueRenderer')) {
    fail('renderHomeSongVoteCue must resolve OOT.home.cueRenderer adapter');
  }
  if (!songBody.includes('buildSongVoteCueView')) {
    fail('renderHomeSongVoteCue must call buildSongVoteCueView on normal path');
  }
  if (!songBody.includes('if (!_svView)')) {
    fail('renderHomeSongVoteCue must retain legacy fallback when buildSongVoteCueView is unavailable');
  }
  if (!songBody.includes('el.innerHTML = _svView.html')) {
    fail('renderHomeSongVoteCue must apply scaffold html via el.innerHTML = _svView.html');
  }
  if (!songBody.includes('openSongVoteModal')) {
    fail('renderHomeSongVoteCue fallback must preserve openSongVoteModal onclick handler');
  }
  if (!songBody.includes('Song Vote Pending')) {
    fail('renderHomeSongVoteCue fallback must preserve Song Vote Pending kicker string');
  }

  const rehearsalStart = html.indexOf('function renderHomeRehearsalCue');
  const rehearsalEnd = html.indexOf('function renderHomeSongVoteCue');
  const rehearsalBody = html.slice(rehearsalStart, rehearsalEnd);

  if (rehearsalBody.includes('buildSongVoteCueView') || rehearsalBody.includes('OOT.home.cueRenderer')) {
    fail('renderHomeRehearsalCue must remain legacy-owned and not route through cueRenderer in Phase 6l-d');
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
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
  console.log('PASS: Phase 6l-d Home song-vote cue routing checks.');
}

function main() {
  console.log('Running Phase 6k-d Home controller integrity checks...\n');

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
  assertRecordOnlyController(controllerJs);
  assertReconcileCoalescerScaffold(controllerJs);
  assertReconcileDelegateBoundary(controllerJs);
  assertProtectedModulesUntouched();

  const compatJs = read('oot_compat_home.js');
  scanForbidden(compatJs, 'oot_compat_home.js');
  assertCompatShim(compatJs);

  const html = read('index.html');
  assertIndexHtmlWiring(html);
  assertPhase6eCSongVotePilot(html);
  assertPhase6gRehearsalPilot(html);
  assertPhase6iGigTimerSafePilot(html);
  assertPhase6kBRHomeTailDiag(html);
  assertPhase6kCRHomeTailAdapter(html, controllerJs);
  assertPhase6kDRHomeTailAdapterRouting(html, controllerJs);
  assertPhase6lBHomeCueRenderDiag(html);
  assertPhase6lCHomeCueRendererScaffold(html);
  assertPhase6lDSongVoteCueRouting(html);

  report();
}

main();
