#!/usr/bin/env node
/**
 * Static Phase 5 Home layout engine checks (5a–5c + Phase 6a script-load gate). Test-only.
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

const CONTROLLER_SRC = 'oot_home_controller.js';

const REQUIRED_SCRIPT_REFS = [
  'oot_home_band_image.js',
  'oot_home_alert_rail.js',
  'oot_home_cue_renderer.js',
  'oot_home_gig_slot.js',
  'oot_home_layout_engine.js',
  'oot_home_diag.js',
  CONTROLLER_SRC,
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
const GO_HOME_ORCHESTRATE_MARKER = "enterHomeTab('go')";
const PHASE_6A_CONTROLLER_SCRIPT_LINE = '  <script src="oot_home_controller.js"></script>';

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

function assertPilotHeroMinHeightHygiene(cssText) {
  if (!/modular-inflow"\] \.hero\.home-hero-with-controls[\s\S]{0,220}min-height:\s*0\s*!important/.test(cssText)) {
    fail('oot_home_layout_engine.css must set min-height:0 on pilot hero flex item');
  }
  if (!/modular-inflow"\][\s\S]*\.hero-l img[\s\S]{0,120}min-height:\s*0\s*!important/.test(cssText)) {
    fail('oot_home_layout_engine.css must neutralize legacy img min-height in pilot mode');
  }
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
  if (/height:\s*var\(--home-slot-hero-h-dense\)/.test(cssText) ||
      /max-height:\s*var\(--home-slot-hero-h-dense\)/.test(cssText)) {
    fail('oot_home_layout_engine.css must bind hero height to --home-slot-hero-h, not --home-slot-hero-h-dense');
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

function getGitDiff(relPath) {
  try {
    return execSync(`git diff HEAD -- ${relPath}`, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    return null;
  }
}

/** Phase 6m-d: allow pending proposal cue module routing + legacy fallback extraction in index.html diff. */
function isPendingProposalCueRoutingDiffLine(line) {
  if (/function _legacyRenderPendingProposalCue/.test(line)) return true;
  if (/function renderPendingProposalCue/.test(line)) return true;
  if (/_ppModuleApplied/.test(line)) return true;
  if (/buildPendingProposalCueView/.test(line)) return true;
  if (/applyPendingProposalCueView/.test(line)) return true;
  if (/_legacyRenderPendingProposalCue\(ids\)/.test(line)) return true;
  if (/var _ppCr =/.test(line)) return true;
  if (/var _ppView =/.test(line)) return true;
  if (/var _ppTargets =/.test(line)) return true;
  if (/var _ppOut =/.test(line)) return true;
  if (/pendingIds: ids/.test(line)) return true;
  if (/calTabBtn:/.test(line)) return true;
  if (/homeHero:/.test(line)) return true;
  if (/calSection:/.test(line)) return true;
  if (/calHero:/.test(line)) return true;
  if (/homeMicroCueEl:/.test(line)) return true;
  if (/calMicroCueEl:/.test(line)) return true;
  if (/var count = ids\.length/.test(line)) return true;
  if (/var calBtn = document\.getElementById\('tb-cal'\)/.test(line)) return true;
  if (/var badge = calBtn\.querySelector\('\.proposal-tab-badge'\)/.test(line)) return true;
  if (/proposal-tab-badge/.test(line)) return true;
  if (/home-proposal-micro-cue/.test(line)) return true;
  if (/cal-proposal-micro-cue/.test(line)) return true;
  if (/cal-proposal-kicker/.test(line)) return true;
  if (/cal-proposal-main/.test(line)) return true;
  if (/home-proposal-dot/.test(line)) return true;
  if (/_openPendingProposalCue/.test(line)) return true;
  if (/rehearsal response needed/.test(line)) return true;
  if (/ACTION NEEDED/.test(line)) return true;
  if (/rehearsal proposal waiting/.test(line)) return true;
  if (/var hero = document\.querySelector\('#sc-home \.hero\.home-hero-with-controls'\)/.test(line)) return true;
  if (/var cal = document\.getElementById\('sc-cal'\)/.test(line)) return true;
  if (/var calCue = document\.getElementById\('cal-proposal-micro-cue'\)/.test(line)) return true;
  if (/var calHero = document\.getElementById\('calendar-hero'\)/.test(line)) return true;
  if (/var cue = document\.getElementById\('home-proposal-micro-cue'\)/.test(line)) return true;
  if (/var ids = _pendingProposalIdsForMe\(\)/.test(line)) return true;
  if (/calBtn\.style\.position/.test(line)) return true;
  if (/badge\.textContent = count > 9/.test(line)) return true;
  if (/badge\.title = count \+ ' rehearsal proposal'/.test(line)) return true;
  if (/badge\.parentNode\.removeChild\(badge\)/.test(line)) return true;
  if (/calHero\.parentNode\.insertBefore\(calCue, calHero\.nextSibling\)/.test(line)) return true;
  if (/cal\.insertBefore\(calCue, cal\.firstChild\)/.test(line)) return true;
  if (/cue\.style\.display = 'inline-flex'/.test(line)) return true;
  if (/calCue\.style\.display = 'flex'/.test(line)) return true;
  if (/cue\.style\.display = 'none'/.test(line)) return true;
  if (/calCue\.style\.display = 'none'/.test(line)) return true;
  if (/hero\.appendChild\(cue\)/.test(line)) return true;
  if (/calBtn\.appendChild\(badge\)/.test(line)) return true;
  if (/if \(_ppOut && _ppOut\.applied\)/.test(line)) return true;
  if (/if \(_ppView\)/.test(line)) return true;
  if (/if \(_ppCr && typeof _ppCr\.buildPendingProposalCueView/.test(line)) return true;
  if (/cue\.innerHTML =/.test(line)) return true;
  if (/calCue\.innerHTML =/.test(line)) return true;
  if (/if\(calBtn\)/.test(line)) return true;
  if (/if\(hero\)/.test(line)) return true;
  if (/if\(cal\)/.test(line)) return true;
  if (/if\(count > 0\)/.test(line)) return true;
  if (/if\(!badge\)/.test(line)) return true;
  if (/if\(!cue\)/.test(line)) return true;
  if (/if\(!calCue\)/.test(line)) return true;
  if (/else if\(badge\)/.test(line)) return true;
  if (/else if\(cue\)/.test(line)) return true;
  if (/else if\(calCue\)/.test(line)) return true;
  if (/if\(calHero && calHero\.parentNode\)/.test(line)) return true;
  if (/^\s+try\{$/.test(line)) return true;
  if (/badge = document\.createElement\('span'\)/.test(line)) return true;
  if (/cue = document\.createElement\('button'\)/.test(line)) return true;
  if (/cue\.type = 'button'/.test(line)) return true;
  if (/calCue = document\.createElement\('button'\)/.test(line)) return true;
  if (/calCue\.type = 'button'/.test(line)) return true;
  if (/\}else\{/.test(line)) return true;
  if (/function _pendingProposalCueTargets/.test(line)) return true;
  if (/if \(_targets && typeof _targets === 'object'\) return _targets/.test(line)) return true;
  if (/return _legacyPendingProposalCueTargets\(\)/.test(line)) return true;
  if (/collectPendingProposalCueTargets/.test(line)) return true;
  if (/function _legacyPendingProposalCueTargets/.test(line)) return true;
  if (/function _pendingProposalCueTargets/.test(line)) return true;
  if (/_pendingProposalCueTargets\(\)/.test(line)) return true;
  if (/function _legacyNotifyPendingProposalCueChange/.test(line)) return true;
  if (/function _legacyRequestPendingProposalCueReconcileIfHomeActive/.test(line)) return true;
  if (/function _notifyPendingProposalCueChange/.test(line)) return true;
  if (/function _requestPendingProposalCueReconcileIfHomeActive/.test(line)) return true;
  if (/_notifyPendingProposalCueChange\(\)/.test(line)) return true;
  if (/_requestPendingProposalCueReconcileIfHomeActive\(\)/.test(line)) return true;
  if (/notifyPendingProposalCueChange/.test(line)) return true;
  if (/requestPendingProposalCueReconcile/.test(line)) return true;
  if (/cue:pending-proposal/.test(line)) return true;
  if (/if\(!_hs \|\| !_hs\.classList\.contains\('on'\)\) return/.test(line)) return true;
  if (/if\(_hs && _hs\.classList\.contains\('on'\) && typeof requestHomeReconcile === 'function'\)/.test(line)) return true;
  if (/_legacyNotifyPendingProposalCueChange\(\)/.test(line)) return true;
  if (/_legacyRequestPendingProposalCueReconcileIfHomeActive\(\)/.test(line)) return true;
  if (/renderPendingProposalCueSurface/.test(line)) return true;
  if (/var _ppSurface =/.test(line)) return true;
  if (/buildView: typeof _ppCr\.buildPendingProposalCueView/.test(line)) return true;
  if (/applyView: typeof _ppCr\.applyPendingProposalCueView/.test(line)) return true;
  if (/moduleApplied/.test(line) && /_ppSurface/.test(line)) return true;
  if (/targets: \{/.test(line)) return true;
  if (/^\s+\},$/.test(line)) return true;
  if (/^\s+\};$/.test(line)) return true;
  if (/derivePendingProposalIds/.test(line)) return true;
  if (/function _legacyPendingProposalIdsForMe/.test(line)) return true;
  if (/function _pendingProposalIdsForMe/.test(line)) return true;
  if (/proposals: typeof proposals/.test(line)) return true;
  if (/members: typeof members/.test(line)) return true;
  if (/if \(Array\.isArray\(_derived\)\) return _derived/.test(line)) return true;
  if (/^\s+\}catch\(e\)\{\}$/.test(line)) return true;
  if (/_legacyPendingProposalIdsForMe\(\)/.test(line)) return true;
  if (/expectedResponderIdsFn/.test(line)) return true;
  if (/currentMemberName/.test(line)) return true;
  if (/currentMemberId/.test(line)) return true;
  if (/var _derived =/.test(line)) return true;
  if (line.trim() === '}') return true;
  return false;
}

/** Phase 6s-a: allow song vote cue derivation seam wrappers in index.html diff. */
function isSongVoteCueDeriveDiffLine(line) {
  if (/function _legacyDeriveSongVoteCueState/.test(line)) return true;
  if (/function _deriveSongVoteCueState/.test(line)) return true;
  if (/deriveSongVoteCueState/.test(line)) return true;
  if (/_legacyDeriveSongVoteCueState\(\)/.test(line)) return true;
  if (/_deriveSongVoteCueState\(\)/.test(line)) return true;
  if (/var _svDerived = _deriveSongVoteCueState\(\)/.test(line)) return true;
  if (/var cueItems = _svDerived\.cueItems/.test(line)) return true;
  if (/var userSpecific = _svDerived\.userSpecific/.test(line)) return true;
  if (/var sourceBranch = _svDerived\.sourceBranch/.test(line)) return true;
  if (/suggestions: typeof suggestions/.test(line)) return true;
  if (/if \(_derived && typeof _derived === 'object' && Array\.isArray\(_derived\.cueItems\)\)/.test(line)) return true;
  if (/return \{ cueItems: cueItems, userSpecific: userSpecific, sourceBranch: sourceBranch \}/.test(line)) return true;
  if (/return \{ cueItems: \[\], userSpecific: true, sourceBranch: 'pendingForMe' \}/.test(line)) return true;
  if (/var pending = _pendingSongSuggestionsForMe\(\)/.test(line)) return true;
  if (/var sourceBranch = 'pendingForMe'/.test(line)) return true;
  if (/var sourceBranch = 'openSuggestions'/.test(line)) return true;
  if (/var sourceBranch = 'anyActive'/.test(line)) return true;
  if (/var userSpecific = true/.test(line)) return true;
  if (/var userSpecific = false/.test(line)) return true;
  if (/if\(!cueItems\.length && typeof _homeOpenSongSuggestions === 'function'\)/.test(line)) return true;
  if (/if\(!cueItems\.length && typeof _homeAnyActiveSongSuggestions === 'function'\)/.test(line)) return true;
  if (/cueItems = _homeOpenSongSuggestions\(\)/.test(line)) return true;
  if (/cueItems = _homeAnyActiveSongSuggestions\(\)/.test(line)) return true;
  if (/var cueItems = pending/.test(line)) return true;
  if (/userSpecific = false/.test(line)) return true;
  if (/sourceBranch = 'openSuggestions'/.test(line)) return true;
  if (/sourceBranch = 'anyActive'/.test(line)) return true;
  if (/^\s+\}catch\(e\)\{$/.test(line)) return true;
  if (/return _derived;/.test(line)) return true;
  if (/if \(_derived && typeof _derived === 'object'/.test(line)) return true;
  if (/function _legacyBuildHomeSongVoteCueView/.test(line)) return true;
  if (/function _legacyRenderHomeSongVoteCueSurface/.test(line)) return true;
  if (/renderSongVoteCueSurface/.test(line)) return true;
  if (/legacyBuildView: _legacyBuildHomeSongVoteCueView/.test(line)) return true;
  if (/renderCue: typeof _svCr\.renderSongVoteCue/.test(line)) return true;
  if (/buildView: typeof _svCr\.buildSongVoteCueView/.test(line)) return true;
  if (/var _svSurface = _svCr\.renderSongVoteCueSurface/.test(line)) return true;
  if (/var _svLegacy = _legacyRenderHomeSongVoteCueSurface/.test(line)) return true;
  if (/_legacyRenderHomeSongVoteCueSurface\(el, _svInput\)/.test(line)) return true;
  if (/var _svOut = _svCr\.renderSongVoteCue\(el, cueInput\)/.test(line)) return true;
  if (/_legacyBuildHomeSongVoteCueView\(cueInput\)/.test(line)) return true;
  if (/return \{ view: _svView, moduleApplied: _svModuleApplied \}/.test(line)) return true;
  if (/cueInput: _svInput/.test(line)) return true;
  if (/targetEl: el/.test(line)) return true;
  if (/moduleApplied: _svLegacy\.moduleApplied/.test(line)) return true;
  if (/var input = cueInput \|\| \{\}/.test(line)) return true;
  if (/Array\.isArray\(input\.cueItems\)/.test(line)) return true;
  if (/input\.userSpecific !== false/.test(line)) return true;
  if (/input\.sourceBranch \|\| 'pendingForMe'/.test(line)) return true;
  if (/if \(_svCr && typeof _svCr\.renderSongVoteCue === 'function'\)/.test(line)) return true;
  if (/var _svOut = _svCr\.renderSongVoteCue\(el, _svInput\)/.test(line)) return true;
  if (/var _svOut = _svCr\.renderSongVoteCue\(el, cueInput\)/.test(line)) return true;
  if (/if \(_svOut && _svOut\.rendered\)/.test(line)) return true;
  if (/_svModuleApplied = true/.test(line)) return true;
  if (/visible: !!_svOut\.visible/.test(line)) return true;
  if (/sourceBranch: _svOut\.sourceBranch \|\| _svInput\.sourceBranch \|\| 'none'/.test(line)) return true;
  if (/sourceBranch: _svOut\.sourceBranch \|\| cueInput\.sourceBranch \|\| 'none'/.test(line)) return true;
  if (/html: ''/.test(line)) return true;
  if (/var _svCrFb = window\.OOT && window\.OOT\.home && window\.OOT\.home\.cueRenderer/.test(line)) return true;
  if (/if \(_svCrFb && typeof _svCrFb\.buildSongVoteCueView === 'function'\)/.test(line)) return true;
  if (/_svView = _svCrFb\.buildSongVoteCueView\(_svInput\)/.test(line)) return true;
  if (/_svView = _svCrFb\.buildSongVoteCueView\(cueInput\)/.test(line)) return true;
  if (/if \(!_svView\) \{/.test(line)) return true;
  if (/if \(!cueItems\.length\) \{/.test(line)) return true;
  if (/_svView = \{ visible: false, html: '', sourceBranch: 'none' \}/.test(line)) return true;
  if (/home-alert-pill home-alert-song/.test(line)) return true;
  if (/Song Vote Pending/.test(line)) return true;
  if (/openSongVoteModal/.test(line)) return true;
  if (/sourceBranch: sourceBranch/.test(line)) return true;
  if (/visible: true,/.test(line)) return true;
  if (/html:/.test(line) && /_svView/.test(line)) return true;
  if (/^\s+try \{$/.test(line)) return true;
  if (/^\s+\} else \{$/.test(line)) return true;
  if (/^\s+\} catch\(e\)\{\}$/.test(line)) return true;
  if (/^\s+\}$/.test(line)) return true;
  if (/function renderHomeSongVoteCue\(\)/.test(line)) return true;
  if (/var el = document\.getElementById\('home-song-vote-cue'\)/.test(line)) return true;
  if (/if\(!el\) return;/.test(line)) return true;
  if (/var _svInput = _buildHomeSongVoteCueInput\(cueItems, userSpecific, sourceBranch\)/.test(line)) return true;
  if (/if \(_svSurface && _svSurface\.view\)/.test(line)) return true;
  if (/_svView = _svSurface\.view/.test(line)) return true;
  if (/_svModuleApplied = !!\(_svSurface\.moduleApplied\)/.test(line)) return true;
  if (/var _svLegacy = _legacyRenderHomeSongVoteCueSurface/.test(line)) return true;
  if (/_svView = _svLegacy\.view/.test(line)) return true;
  if (/_svModuleApplied = _svLegacy\.moduleApplied/.test(line)) return true;
  if (/^\s+html:$/.test(line)) return true;
  if (/_svView = \{$/.test(line)) return true;
  if (/collectSongVoteCueTargets/.test(line)) return true;
  if (/function _legacySongVoteCueTargets/.test(line)) return true;
  if (/function _songVoteCueTargets/.test(line)) return true;
  if (/songVoteEl: document\.getElementById\('home-song-vote-cue'\)/.test(line)) return true;
  if (/var _svTargets = _songVoteCueTargets\(\)/.test(line)) return true;
  if (/var el = _svTargets\.songVoteEl/.test(line)) return true;
  if (/_legacySongVoteCueTargets\(\)/.test(line)) return true;
  if (/function _legacyNotifySongVoteCueChange/.test(line)) return true;
  if (/function _legacyRequestSongVoteCueReconcileIfHomeActive/.test(line)) return true;
  if (/function _notifySongVoteCueChange/.test(line)) return true;
  if (/function _requestSongVoteCueReconcileIfHomeActive/.test(line)) return true;
  if (/_notifySongVoteCueChange\(\)/.test(line)) return true;
  if (/_requestSongVoteCueReconcileIfHomeActive\(\)/.test(line)) return true;
  if (/notifySongVoteCueChange/.test(line)) return true;
  if (/requestSongVoteCueReconcile/.test(line)) return true;
  if (/_legacyNotifySongVoteCueChange\(\)/.test(line)) return true;
  if (/_legacyRequestSongVoteCueReconcileIfHomeActive\(\)/.test(line)) return true;
  if (/notifyCueChange\('renderHomeSongVoteCue'\)/.test(line)) return true;
  if (/requestHomeReconcile\('cue:song-vote'\)/.test(line)) return true;
  return false;
}

/** Phase 6w-b: allow rehearsal cue derivation seam wrappers in index.html diff. */
function isRehearsalCueDeriveDiffLine(line) {
  if (/function _legacyDeriveRehearsalCueInput/.test(line)) return true;
  if (/function _deriveRehearsalCueInput/.test(line)) return true;
  if (/deriveRehearsalCueInput/.test(line)) return true;
  if (/_legacyDeriveRehearsalCueInput\(\)/.test(line)) return true;
  if (/_deriveRehearsalCueInput\(\)/.test(line)) return true;
  if (/var _rhInput = _deriveRehearsalCueInput\(\)/.test(line)) return true;
  if (/events: typeof events/.test(line)) return true;
  if (/proposals: typeof proposals/.test(line)) return true;
  if (/eventsHasInit: !!_eventsHasInit/.test(line)) return true;
  if (/rehearsalTimesFn: typeof _r535RehearsalTimes/.test(line)) return true;
  if (/if \(_derived && typeof _derived === 'object' && _derived\.hasTarget === true\)/.test(line)) return true;
  if (/return _derived;/.test(line)) return true;
  if (/var _rhInput = null;/.test(line)) return true;
  if (/var earlyProp =/.test(line)) return true;
  if (/sourceBranch: 'hidden-no-events'/.test(line)) return true;
  if (/sourceBranch: 'hidden-no-rehearsal'/.test(line)) return true;
  if (/sourceBranch: ev\._proposalHomeCue/.test(line)) return true;
  if (/sourceBranch: 'rehearsalEvent'/.test(line)) return true;
  if (/var ev = _r535NextUpcomingRehearsal\(\)/.test(line)) return true;
  if (/var times = _r535RehearsalTimes\(ev\)/.test(line)) return true;
  if (/var dateLabel = _r535PrettyRehearsalDate\(ev\)/.test(line)) return true;
  if (/if\(!_eventsHasInit && \(!events \|\| !events\.length\)\)/.test(line)) return true;
  if (/if\(!earlyProp\)/.test(line)) return true;
  if (/if\(!_rhInput\)/.test(line)) return true;
  if (/_rhInput = _buildHomeRehearsalCueInput\(\{/.test(line)) return true;
  if (/evIdEscaped: _r535HomeEscape/.test(line)) return true;
  if (/titleEscaped: _r535HomeEscape/.test(line)) return true;
  if (/subEscaped: _r535HomeEscape/.test(line)) return true;
  if (/noteEscaped: note \? _r535HomeEscape/.test(line)) return true;
  if (/hasNote: !!note/.test(line)) return true;
  if (/var title = ev\.title/.test(line)) return true;
  if (/var sub = dateLabel/.test(line)) return true;
  if (/var note = ev\.note/.test(line)) return true;
  if (/var timeLabel = times\.start/.test(line)) return true;
  if (/if\(!ev\)/.test(line)) return true;
  if (/return _rhInput;/.test(line)) return true;
  return false;
}

/** Phase 6x-b: allow rehearsal cue render orchestration seam in index.html diff. */
function isRehearsalCueOrchestrationDiffLine(line) {
  if (/function _legacyBuildHomeRehearsalCueView/.test(line)) return true;
  if (/function _legacyRenderHomeRehearsalCueSurface/.test(line)) return true;
  if (/renderRehearsalCueSurface/.test(line)) return true;
  if (/legacyBuildView: _legacyBuildHomeRehearsalCueView/.test(line)) return true;
  if (/renderCue: typeof _rhCr\.renderRehearsalCue/.test(line)) return true;
  if (/buildView: typeof _rhCr\.buildRehearsalCueView/.test(line)) return true;
  if (/var _rhSurface = _rhCr\.renderRehearsalCueSurface/.test(line)) return true;
  if (/var _rhLegacy = _legacyRenderHomeRehearsalCueSurface/.test(line)) return true;
  if (/_legacyRenderHomeRehearsalCueSurface\(el, _rhInput\)/.test(line)) return true;
  if (/var _rhOut = _rhCr\.renderRehearsalCue\(el, cueInput\)/.test(line)) return true;
  if (/var _rhOut = _rhCr\.renderRehearsalCue\(el, _rhInput\)/.test(line)) return true;
  if (/_legacyBuildHomeRehearsalCueView\(cueInput\)/.test(line)) return true;
  if (/return \{ view: _rhView, moduleApplied: _rhModuleApplied \}/.test(line)) return true;
  if (/cueInput: _rhInput/.test(line)) return true;
  if (/moduleApplied: _rhLegacy\.moduleApplied/.test(line)) return true;
  if (/var _rhInput = cueInput \|\| \{\}/.test(line)) return true;
  if (/if \(_rhCr && typeof _rhCr\.renderRehearsalCue === 'function'\)/.test(line)) return true;
  if (/if \(_rhCr && typeof _rhCr\.renderRehearsalCueSurface === 'function'\)/.test(line)) return true;
  if (/if \(_rhOut && _rhOut\.rendered\)/.test(line)) return true;
  if (/_rhModuleApplied = true/.test(line)) return true;
  if (/visible: !!_rhOut\.visible/.test(line)) return true;
  if (/sourceBranch: _rhOut\.sourceBranch \|\| _rhInput\.sourceBranch \|\| 'hidden-no-rehearsal'/.test(line)) return true;
  if (/sourceBranch: _rhOut\.sourceBranch \|\| cueInput\.sourceBranch \|\| 'hidden-no-rehearsal'/.test(line)) return true;
  if (/imageRefreshReason: _rhOut\.imageRefreshReason \|\| ''/.test(line)) return true;
  if (/diagTag: _rhOut\.diagTag \|\| ''/.test(line)) return true;
  if (/var _rhCrFb = window\.OOT && window\.OOT\.home && window\.OOT\.home\.cueRenderer/.test(line)) return true;
  if (/if \(_rhCrFb && typeof _rhCrFb\.buildRehearsalCueView === 'function'\)/.test(line)) return true;
  if (/_rhView = _rhCrFb\.buildRehearsalCueView\(_rhInput\)/.test(line)) return true;
  if (/_rhView = _rhCrFb\.buildRehearsalCueView\(cueInput\)/.test(line)) return true;
  if (/if \(!_rhView\)/.test(line)) return true;
  if (/if \(_rhInput\.sourceBranch === 'hidden-no-events'\)/.test(line)) return true;
  if (/if \(_rhInput\.sourceBranch === 'hidden-no-rehearsal'\)/.test(line)) return true;
  if (/} else if \(_rhInput\.sourceBranch === 'hidden-no-rehearsal'\)/.test(line)) return true;
  if (/var _rhNoteHtml = _rhInput\.hasNote/.test(line)) return true;
  if (/^\s+: '';/.test(line)) return true;
  if (/_rhNoteHtml\+/.test(line)) return true;
  if (/sourceBranch: _rhInput\.sourceBranch/.test(line)) return true;
  if (/if \(_rhSurface && _rhSurface\.view\)/.test(line)) return true;
  if (/_rhView = _rhSurface\.view/.test(line)) return true;
  if (/_rhModuleApplied = !!\(_rhSurface\.moduleApplied\)/.test(line)) return true;
  if (/_rhView = _rhLegacy\.view/.test(line)) return true;
  if (/_rhModuleApplied = _rhLegacy\.moduleApplied/.test(line)) return true;
  if (/^\s+_rhView = \{$/.test(line)) return true;
  if (/^\s+visible: false,$/.test(line)) return true;
  if (/html: ''/.test(line)) return true;
  return false;
}

/** Phase 6y-b: allow rehearsal cue target collection seam in index.html diff. */
function isRehearsalCueTargetCollectionDiffLine(line) {
  if (/function _legacyRehearsalCueTargets/.test(line)) return true;
  if (/function _rehearsalCueTargets/.test(line)) return true;
  if (/collectRehearsalCueTargets/.test(line)) return true;
  if (/_rehearsalCueTargets\(\)/.test(line)) return true;
  if (/_legacyRehearsalCueTargets\(\)/.test(line)) return true;
  if (/var _rTargets = _rehearsalCueTargets\(\)/.test(line)) return true;
  if (/var el = _rTargets\.rehearsalEl/.test(line)) return true;
  if (/rehearsalEl: document\.getElementById\('home-rehearsal-cue'\)/.test(line)) return true;
  if (/var el = document\.getElementById\('home-rehearsal-cue'\)/.test(line)) return true;
  if (/document: document/.test(line) && /collectRehearsalCueTargets/.test(line)) return true;
  return false;
}

/** Phase 6d/6e-c/6g/6i-a: allow go('home') orchestration delegate + notification/reconcile hooks in index.html. */
function assertIndexHtmlChangesAllowed(html) {
  if (!html.includes(GO_HOME_ORCHESTRATE_MARKER)) {
    fail(`index.html go('home') must delegate via ${GO_HOME_ORCHESTRATE_MARKER}`);
  }

  if (!html.includes("else if (typeof rHome === 'function') rHome();")) {
    fail('index.html go(\'home\') must retain legacy rHome fallback');
  }

  if (html.includes("if (id === 'home') rHome();")) {
    fail('index.html must not call rHome() directly from go(\'home\')');
  }

  if (html.includes('HomeController.activate')) {
    fail('index.html must use compat globals (activateHome), not HomeController.activate');
  }

  const hookCount = (html.match(/reconcileHomeLayout\('rHome'\)/g) || []).length;
  if (hookCount !== 1) {
    fail(`index.html must contain exactly one reconcileHomeLayout('rHome') hook (found ${hookCount})`);
  }

  if (html.includes('data-home-layout-mode="modular-inflow"')) {
    fail('index.html must not default static Home markup to modular-inflow');
  }

  const diff = getGitDiff('index.html');
  if (!diff) {
    return;
  }

  const added = [];
  const removed = [];
  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push(line.slice(1).replace(/\r$/, ''));
    }
    if (line.startsWith('-') && !line.startsWith('---')) {
      removed.push(line.slice(1).replace(/\r$/, ''));
    }
  }

  const allowedRemoved = new Set([
    "  if (id === 'home') rHome();",
    "  try { if (typeof activateHome === 'function') activateHome('rHome'); } catch(e) {}",
    "  try { if (typeof requestHomeReconcile === 'function') requestHomeReconcile('rHome'); } catch(e){}",
    "  try { reconcileHomeLayout('rHome'); } catch(e){}",
    "    var _ootHc = window.OOT && window.OOT.home && window.OOT.home.controller;",
    "    if (_ootHc && typeof _ootHc.requestRHomeTailReconcile === 'function') {",
    "      _ootHc.requestRHomeTailReconcile();",
  ]);

  const allowedRemovedRes = [
    /if\s*\(!cueItems\.length\)/,
    /_recordHomeCueRenderDiag\('songVote'/,
    /var label = userSpecific/,
    /1 song suggestion needs your vote/,
    /1 song vote still in progress/,
    /var first = cueItems\[0\]/,
    /var detail = first\.title/,
    /el\.innerHTML =$/,
    /home-alert-pill home-alert-song/,
    /Song Vote Pending/,
    /openSongVoteModal/,
    /home-alert-icon/,
    /home-alert-copy/,
    /home-alert-main/,
    /home-alert-sub/,
    /linear-gradient\(135deg,rgba\(35,111,255/,
    /<\/span>'\+/,
    /<\/button>/,
    /_recordHomeCueRenderDiag\('rehearsal'/,
    /var ev = _r535NextUpcomingRehearsal/,
    /var times = _r535RehearsalTimes/,
    /var timeLabel =/,
    /var dateLabel = _r535PrettyRehearsalDate/,
    /var title = ev\.title/,
    /var sub = dateLabel/,
    /var note = ev\.note/,
    /var _rhBranch =/,
    /Rehearsal on Deck/,
    /_r535OpenHomeRehearsal/,
    /home-alert-rehearsal/,
    /home-alert-note/,
    /rehearsal-cue hidden no events/,
    /rehearsal-cue hidden no next rehearsal/,
    /rehearsal-cue visible/,
    /renderHomeRehearsalCue:hidden-no-events/,
    /renderHomeRehearsalCue:hidden-no-rehearsal/,
    /renderHomeRehearsalCue:visible/,
    /linear-gradient\(135deg,rgba\(11,31,76/,
    /el\.style\.display = 'none'/,
    /el\.style\.display = 'block'/,
    /el\.innerHTML = ''/,
    /el\.innerHTML = _rhView\.html/,
    /el\.innerHTML = _svView\.html/,
    /syncAlertRailState\('renderHomeRehearsalCue'\)/,
    /notifyCueChange\('renderHomeRehearsalCue'\)/,
    /requestHomeReconcile\('cue:rehearsal'\)/,
    /^\s+return;$/,
    /if\(!ev\)/,
    /var _rhInput = \{ hasTarget: true \}/,
    /_rhInput\.sourceBranch = 'hidden-no-events'/,
    /if\(!_rhInput\.sourceBranch\)/,
    /_rhInput\.sourceBranch = 'hidden-no-rehearsal'/,
    /_rhInput\.sourceBranch = ev\._proposalHomeCue/,
    /_rhInput\.evIdEscaped =/,
    /_rhInput\.titleEscaped =/,
    /_rhInput\.subEscaped =/,
    /_rhInput\.noteEscaped =/,
    /_rhInput\.hasNote =/,
    /_svView = _svCr\.buildSongVoteCueView\(\{/,
    /_svView = _svCr\.buildSongVoteCueView\(_buildHomeSongVoteCueInput/,
    /if \(_svCr && typeof _svCr\.buildSongVoteCueView === 'function'\)/,
    /if \(_rhCr && typeof _rhCr\.buildRehearsalCueView === 'function'\)/,
    /_rhView = _rhCr\.buildRehearsalCueView\(_rhInput\)/,
    /^\s+_applyHomeCueView\(el, _svView\);$/,
    /^\s+_applyHomeCueView\(el, _rhView\);$/,
    /^\s+cueItems: cueItems,$/,
    /^\s+userSpecific: userSpecific,$/,
    /^\s+sourceBranch: sourceBranch,$/,
    /^\s+hasTarget: true$/,
    /^\s+\}\);$/,
  ];

  for (const line of removed) {
    if (allowedRemoved.has(line)) {
      continue;
    }
    var removedAllowed = false;
    for (const re of allowedRemovedRes) {
      if (re.test(line)) {
        removedAllowed = true;
        break;
      }
    }
    if (!removedAllowed) {
      if (isPendingProposalCueRoutingDiffLine(line) || isSongVoteCueDeriveDiffLine(line) || isRehearsalCueDeriveDiffLine(line) || isRehearsalCueOrchestrationDiffLine(line) || isRehearsalCueTargetCollectionDiffLine(line)) {
        continue;
      }
      fail(`index.html diff removes disallowed line in Phase 6d: ${line}`);
    }
  }

  const allowedHookRe = /^\s+try \{ if \(typeof (activateHome|notifyCueChange|notifyGigSlotChange|notifyImageRefresh|requestHomeReconcile) === 'function'\)/;
  const allowedPhase6eCSongVoteReconcileRe =
    /^\s+try \{ var _hs=document\.getElementById\('sc-home'\); if \(_hs&&_hs\.classList\.contains\('on'\)&&typeof requestHomeReconcile==='function'\)requestHomeReconcile\('cue:song-vote'\); \} catch\(e\)\{\}$/;
  const allowedOrchestrateRes = [
    /^\s+if \(id === 'home'\) \{$/,
    /^\s+try \{$/,
    /^\s+if \(typeof enterHomeTab === 'function'\) enterHomeTab\('go'\);$/,
    /^\s+else if \(typeof rHome === 'function'\) rHome\(\);$/,
    /^\s+\} catch\(e\)\{\}$/,
    /^\s+\} catch\(e\) \{\}$/,
    /^\s+\}$/,
    /^\s+if \(typeof consumeHomeRHomeActivateSkip === 'function' && consumeHomeRHomeActivateSkip\(\)\) \{ \/\* orchestrated go path \*\/ \}$/,
    /^\s+else if \(typeof activateHome === 'function'\) activateHome\('rHome'\);$/,
  ];

  for (const line of added) {
    if (line === PHASE_6A_CONTROLLER_SCRIPT_LINE) {
      continue;
    }
    if (line.trim() === '') {
      continue;
    }
    if (allowedHookRe.test(line)) {
      continue;
    }
    if (allowedPhase6eCSongVoteReconcileRe.test(line)) {
      continue;
    }
    if (/requestHomeReconcile\('cue:song-vote'\)/.test(line) &&
        /getElementById\('sc-home'\)/.test(line) &&
        /classList\.contains\('on'\)/.test(line)) {
      continue;
    }
    if (/requestHomeReconcile\('cue:rehearsal'\)/.test(line) &&
        /getElementById\('sc-home'\)/.test(line) &&
        /classList\.contains\('on'\)/.test(line)) {
      continue;
    }
    if (/_maybeRequestHomeGigReconcile\(/.test(line)) {
      continue;
    }
    if (/var _homeGigSlotReconcileSig/.test(line)) {
      continue;
    }
    if (/function _maybeRequestHomeGigReconcile/.test(line)) {
      continue;
    }
    if (/_homeGigSlotReconcileSig/.test(line)) {
      continue;
    }
    if (/requestHomeReconcile\('gig:' \+ nextState\)/.test(line)) {
      continue;
    }
    if (/var gigKey = String\(next\.date/.test(line)) {
      continue;
    }
    if (/var sig = nextState \+ '\|'/.test(line)) {
      continue;
    }
    if (/if \(sig === _homeGigSlotReconcileSig\) return;/.test(line)) {
      continue;
    }
    if (/var _hs = document\.getElementById\('sc-home'\)/.test(line)) {
      continue;
    }
    if (/if \(!_hs \|\| !_hs\.classList\.contains\('on'\)\) return;/.test(line)) {
      continue;
    }
    if (/if \(typeof requestHomeReconcile !== 'function'\) return;/.test(line)) {
      continue;
    }
    if (/window\.__ootRHomeTailDiag/.test(line)) {
      continue;
    }
    if (/function _recordRHomeTailReconcileDiag/.test(line)) {
      continue;
    }
    if (/_recordRHomeTailReconcileDiag\(/.test(line)) {
      continue;
    }
    if (/if \(_ootHc && typeof _ootHc\.requestRHomeTailReconcile/.test(line)) {
      continue;
    }
    if (/_ootHc\.requestRHomeTailReconcile\(\);/.test(line)) {
      continue;
    }
    if (/typeof window\.OOT\.home\.controller\.requestRHomeTailReconcile === 'function'/.test(line)) {
      continue;
    }
    if (/requestRHomeTailReconcile\(\{ source: 'rHome:tail' \}\)/.test(line)) {
      continue;
    }
    if (/source: 'rHome:tail'/.test(line)) {
      continue;
    }
    if (/requestHomeReconcile\('rHome'\)/.test(line)) {
      continue;
    }
    if (/reconcileHomeLayout\('rHome'\)/.test(line)) {
      continue;
    }
    if (/var _ootHc = window\.OOT && window\.OOT\.home && window\.OOT\.home\.controller/.test(line)) {
      continue;
    }
    if (/window\.OOT && window\.OOT\.home && window\.OOT\.home\.controller/.test(line)) {
      continue;
    }
    if (/^\s+} else \{$/.test(line)) {
      continue;
    }
    if (/window\.__ootGetRHomeTailDiag/.test(line)) {
      continue;
    }
    if (/window\.__ootHomeCueRenderDiag/.test(line)) {
      continue;
    }
    if (/function _recordHomeCueRenderDiag/.test(line)) {
      continue;
    }
    if (/_recordHomeCueRenderDiag\(/.test(line)) {
      continue;
    }
    if (/window\.__ootGetHomeCueRenderDiag/.test(line)) {
      continue;
    }
    if (/byCue: \{ songVote: 0, rehearsal: 0 \}/.test(line)) {
      continue;
    }
    if (/if \(!d\.byCue\) d\.byCue = \{ songVote: 0, rehearsal: 0 \};/.test(line)) {
      continue;
    }
    if (/cueName: cueName \|\| null/.test(line)) {
      continue;
    }
    if (/d\.byCue\.(songVote|rehearsal) =/.test(line)) {
      continue;
    }
    if (/cueName === 'songVote'/.test(line) || /cueName === 'rehearsal'/.test(line)) {
      continue;
    }
    if (/d\.lastCue =/.test(line)) {
      continue;
    }
    if (/var snap = snapshot/.test(line)) {
      continue;
    }
    if (/var order = d\.count/.test(line)) {
      continue;
    }
    if (/sourceBranch: snap\.sourceBranch/.test(line)) {
      continue;
    }
    if (/activeCount: typeof snap\.activeCount/.test(line)) {
      continue;
    }
    if (/visible: snap\.visible/.test(line)) {
      continue;
    }
    if (/hasTarget: snap\.hasTarget/.test(line)) {
      continue;
    }
    if (/d\.recent\.length > 12/.test(line)) {
      continue;
    }
    if (/var sourceBranch = 'pendingForMe'/.test(line)) {
      continue;
    }
    if (/sourceBranch = 'openSuggestions'/.test(line) || /sourceBranch = 'anyActive'/.test(line)) {
      continue;
    }
    if (/sourceBranch: 'none'/.test(line) || /sourceBranch: 'hidden-no-events'/.test(line)) {
      continue;
    }
    if (/sourceBranch: 'hidden-no-rehearsal'/.test(line)) {
      continue;
    }
    if (/var _rhBranch = ev\._proposalHomeCue/.test(line)) {
      continue;
    }
    if (/sourceBranch: _rhBranch/.test(line) || /sourceBranch: sourceBranch/.test(line)) {
      continue;
    }
    if (/<script src="oot_home_cue_renderer\.js"><\/script>/.test(line)) {
      continue;
    }
    if (/var _svView = null/.test(line)) {
      continue;
    }
    if (/var _svCr = window\.OOT && window\.OOT\.home && window\.OOT\.home\.cueRenderer/.test(line)) {
      continue;
    }
    if (/buildSongVoteCueView\(/.test(line)) {
      continue;
    }
    if (/if \(!_svView\)/.test(line)) {
      continue;
    }
    if (/el\.innerHTML = _svView\.html/.test(line)) {
      continue;
    }
    if (/sourceBranch: _svView\.sourceBranch/.test(line)) {
      continue;
    }
    if (/userSpecific: userSpecific/.test(line)) {
      continue;
    }
    if (/if \(_svCr && typeof _svCr\.buildSongVoteCueView === 'function'\)/.test(line)) {
      continue;
    }
    if (/cueItems: cueItems/.test(line)) {
      continue;
    }
    if (/if\(!ev\)/.test(line)) {
      continue;
    }
    if (/_rhNoteHtml\+/.test(line)) {
      continue;
    }
    if (/var label = userSpecific/.test(line)) {
      continue;
    }
    if (/var first = cueItems\[0\]/.test(line)) {
      continue;
    }
    if (/var detail = first\.title/.test(line)) {
      continue;
    }
    if (/^\s+_svView = \{$/.test(line)) {
      continue;
    }
    if (/^\s+visible: true,$/.test(line)) {
      continue;
    }
    if (/^\s+html:$/.test(line)) {
      continue;
    }
    if (/1 song suggestion needs your vote/.test(line)) {
      continue;
    }
    if (/1 song vote still in progress/.test(line)) {
      continue;
    }
    if (/linear-gradient\(135deg,rgba\(35,111,255/.test(line)) {
      continue;
    }
    if (/<\/span>'\+/.test(line)) {
      continue;
    }
    if (/home-alert-pill home-alert-song/.test(line)) {
      continue;
    }
    if (/home-alert-icon/.test(line)) {
      continue;
    }
    if (/home-alert-copy/.test(line)) {
      continue;
    }
    if (/home-alert-main/.test(line)) {
      continue;
    }
    if (/home-alert-sub/.test(line)) {
      continue;
    }
    if (/Song Vote Pending/.test(line)) {
      continue;
    }
    if (/openSongVoteModal/.test(line)) {
      continue;
    }
    if (/Rehearsal on Deck/.test(line)) {
      continue;
    }
    if (/_r535OpenHomeRehearsal/.test(line)) {
      continue;
    }
    if (/home-alert-rehearsal/.test(line)) {
      continue;
    }
    if (/home-alert-note/.test(line)) {
      continue;
    }
    if (/linear-gradient\(135deg,rgba\(11,31,76/.test(line)) {
      continue;
    }
    if (/^\s+'<\/button>',$/.test(line)) {
      continue;
    }
    if (/if \(!_svView\.visible\)/.test(line)) {
      continue;
    }
    if (/window\.OOT\.home\.cueRenderer/.test(line)) {
      continue;
    }
    if (/var _rhView = null/.test(line)) {
      continue;
    }
    if (/var _rhInput = \{ hasTarget: true \}/.test(line)) {
      continue;
    }
    if (/var _rhCr = window\.OOT && window\.OOT\.home && window\.OOT\.home\.cueRenderer/.test(line)) {
      continue;
    }
    if (/buildRehearsalCueView\(/.test(line)) {
      continue;
    }
    if (/if \(!_rhView\)/.test(line)) {
      continue;
    }
    if (/el\.innerHTML = _rhView\.html/.test(line)) {
      continue;
    }
    if (/if \(!_rhView\.visible\)/.test(line)) {
      continue;
    }
    if (/imageRefreshReason:/.test(line)) {
      continue;
    }
    if (/diagTag:/.test(line)) {
      continue;
    }
    if (/evIdEscaped:/.test(line) || /titleEscaped:/.test(line) || /subEscaped:/.test(line) || /noteEscaped:/.test(line) || /hasNote:/.test(line)) {
      continue;
    }
    if (/var _rhNoteHtml =/.test(line)) {
      continue;
    }
    if (/_rhView\.(imageRefreshReason|diagTag|sourceBranch)/.test(line)) {
      continue;
    }
    if (/_rhInput\.(sourceBranch|evIdEscaped|titleEscaped|subEscaped|noteEscaped|hasNote)/.test(line)) {
      continue;
    }
    if (/hidden-no-events/.test(line) || /hidden-no-rehearsal/.test(line) || /proposalFallback/.test(line) || /rehearsalEvent/.test(line)) {
      continue;
    }
    if (/var ev = _r535NextUpcomingRehearsal/.test(line)) {
      continue;
    }
    if (/var times = _r535RehearsalTimes/.test(line)) {
      continue;
    }
    if (/var timeLabel =/.test(line)) {
      continue;
    }
    if (/var dateLabel = _r535PrettyRehearsalDate/.test(line)) {
      continue;
    }
    if (/var title = ev\.title/.test(line)) {
      continue;
    }
    if (/var sub = dateLabel/.test(line)) {
      continue;
    }
    if (/var note = ev\.note/.test(line)) {
      continue;
    }
    if (/if \(_rhCr && typeof _rhCr\.buildRehearsalCueView === 'function'\)/.test(line)) {
      continue;
    }
    if (/^\s+_rhView = \{$/.test(line)) {
      continue;
    }
    if (/^\s+visible: false,$/.test(line)) {
      continue;
    }
    if (/^\s+html: '',$/.test(line)) {
      continue;
    }
    if (/^\s+visible: true,$/.test(line)) {
      continue;
    }
    if (/^\s+html:$/.test(line) && /_rhView/.test(line)) {
      continue;
    }
    if (/^\s+: '';$/.test(line)) {
      continue;
    }
    if (/notifyImageRefresh\(_rhView\.imageRefreshReason\)/.test(line)) {
      continue;
    }
    if (/_scheduleHomeImagePresentationRefresh\(_rhView\.imageRefreshReason\)/.test(line)) {
      continue;
    }
    if (/_homeLayoutDiagSnapshot\(_rhView\.diagTag/.test(line)) {
      continue;
    }
    if (/function _legacyApplyHomeCueView/.test(line)) {
      continue;
    }
    if (/function _applyHomeCueView/.test(line)) {
      continue;
    }
    if (/_legacyApplyHomeCueView\(/.test(line)) {
      continue;
    }
    if (/_applyHomeCueView\(/.test(line)) {
      continue;
    }
    if (/applyCueView === 'function'/.test(line)) {
      continue;
    }
    if (/return _cr\.applyCueView/.test(line)) {
      continue;
    }
    if (/if\(!el \|\| !view\) return/.test(line)) {
      continue;
    }
    if (/if\(!view\.visible\)/.test(line)) {
      continue;
    }
    if (/el\.style\.display = 'none'/.test(line)) {
      continue;
    }
    if (/el\.style\.display = 'block'/.test(line)) {
      continue;
    }
    if (/el\.innerHTML = ''/.test(line)) {
      continue;
    }
    if (/el\.innerHTML = view\.html \|\| ''/.test(line)) {
      continue;
    }
    if (/^\s+return;$/.test(line)) {
      continue;
    }
    if (/^\s+return \{$/.test(line)) {
      continue;
    }
    if (/applied: true,/.test(line)) {
      continue;
    }
    if (/visible: !!\(view && view\.visible\)/.test(line)) {
      continue;
    }
    if (/htmlLength: view && view\.visible/.test(line)) {
      continue;
    }
    if (/rendersDom: true/.test(line)) {
      continue;
    }
    if (/function _buildHomeSongVoteCueInput/.test(line)) {
      continue;
    }
    if (/function _buildHomeRehearsalCueInput/.test(line)) {
      continue;
    }
    if (/var a = args \|\| \{\}/.test(line)) {
      continue;
    }
    if (/var input = \{ hasTarget: true, sourceBranch: a\.sourceBranch \}/.test(line)) {
      continue;
    }
    if (/a\.sourceBranch === 'hidden-no-events' \|\| a\.sourceBranch === 'hidden-no-rehearsal'/.test(line)) {
      continue;
    }
    if (/return input;/.test(line)) {
      continue;
    }
    if (/input\.evIdEscaped =/.test(line)) {
      continue;
    }
    if (/input\.titleEscaped =/.test(line)) {
      continue;
    }
    if (/input\.subEscaped =/.test(line)) {
      continue;
    }
    if (/input\.noteEscaped =/.test(line)) {
      continue;
    }
    if (/input\.hasNote =/.test(line)) {
      continue;
    }
    if (/var _rhInput = null/.test(line)) {
      continue;
    }
    if (/if\(!_rhInput\)/.test(line)) {
      continue;
    }
    if (/_rhInput = _buildHomeRehearsalCueInput\(\{/.test(line)) {
      continue;
    }
    if (/buildSongVoteCueView\(_buildHomeSongVoteCueInput/.test(line)) {
      continue;
    }
    if (/var _svModuleApplied = false/.test(line)) {
      continue;
    }
    if (/renderSongVoteCue === 'function'/.test(line)) {
      continue;
    }
    if (/renderSongVoteCue\(el, _svInput\)/.test(line)) {
      continue;
    }
    if (/if \(_svOut && _svOut\.rendered\)/.test(line)) {
      continue;
    }
    if (/_svModuleApplied = true/.test(line)) {
      continue;
    }
    if (/visible: !!_svOut\.visible/.test(line)) {
      continue;
    }
    if (/sourceBranch: _svOut\.sourceBranch/.test(line)) {
      continue;
    }
    if (/html: ''/.test(line)) {
      continue;
    }
    if (/var _svCrFb =/.test(line)) {
      continue;
    }
    if (/if \(_svCrFb && typeof _svCrFb\.buildSongVoteCueView === 'function'\)/.test(line)) {
      continue;
    }
    if (/if \(!_svModuleApplied\)/.test(line)) {
      continue;
    }
    if (/var _rhModuleApplied = false/.test(line)) {
      continue;
    }
    if (/renderRehearsalCue === 'function'/.test(line)) {
      continue;
    }
    if (/renderRehearsalCue\(el, _rhInput\)/.test(line)) {
      continue;
    }
    if (/if \(_rhOut && _rhOut\.rendered\)/.test(line)) {
      continue;
    }
    if (/_rhModuleApplied = true/.test(line)) {
      continue;
    }
    if (/visible: !!_rhOut\.visible/.test(line)) {
      continue;
    }
    if (/sourceBranch: _rhOut\.sourceBranch/.test(line)) {
      continue;
    }
    if (/imageRefreshReason: _rhOut\.imageRefreshReason/.test(line)) {
      continue;
    }
    if (/diagTag: _rhOut\.diagTag/.test(line)) {
      continue;
    }
    if (/var _rhCrFb =/.test(line)) {
      continue;
    }
    if (/if \(_rhCrFb && typeof _rhCrFb\.buildRehearsalCueView === 'function'\)/.test(line)) {
      continue;
    }
    if (/if \(!_rhModuleApplied\)/.test(line)) {
      continue;
    }
    if (/var _svInput = _buildHomeSongVoteCueInput/.test(line)) {
      continue;
    }
    if (/_buildHomeSongVoteCueInput\(cueItems, userSpecific, sourceBranch\)/.test(line)) {
      continue;
    }
    if (/hasTarget: true/.test(line)) {
      continue;
    }
    if (/^\s+(count|lastAt|lastOrder|recent|lastHomeActive|lastHadRequestHomeReconcile|lastHadReconcileHomeLayout|lastCue|byCue):/.test(line)) {
      continue;
    }
    if (/^\s+\};$/.test(line)) {
      continue;
    }
    if (line.trim() === '};') {
      continue;
    }
    if (/^\s+if \(!d\) return/.test(line)) {
      continue;
    }
    if (/var (hs|homeActive|hadReq|hadRec) =/.test(line)) {
      continue;
    }
    if (/typeof requestHomeReconcile === 'function'/.test(line) && /hadReq/.test(line)) {
      continue;
    }
    if (/typeof reconcileHomeLayout === 'function'/.test(line) && /hadRec/.test(line)) {
      continue;
    }
    if (/d\.(count|lastAt|lastOrder|lastHomeActive|lastHadRequestHomeReconcile|lastHadReconcileHomeLayout) =/.test(line)) {
      continue;
    }
    if (/!Array\.isArray\(d\.recent\)/.test(line)) {
      continue;
    }
    if (/d\.recent\.(push|length|splice)/.test(line)) {
      continue;
    }
    if (/^\s+(at|order|homeActive|hadRequestHomeReconcile|hadReconcileHomeLayout):/.test(line)) {
      continue;
    }
    if (/^\s+\}\);$/.test(line)) {
      continue;
    }
    if (/lastHadRequestHomeReconcile/.test(line) || /lastHadReconcileHomeLayout/.test(line)) {
      continue;
    }
    if (/lastHomeActive/.test(line) || /lastOrder/.test(line) || /pre-tail-record/.test(line)) {
      continue;
    }
    if (/JSON\.parse\(JSON\.stringify\(d\)\)/.test(line)) {
      continue;
    }
    if (/return null;/.test(line)) {
      continue;
    }
    if (/^\s*\} catch\(e\)\{\}$/.test(line)) {
      continue;
    }
    if (line.trim() === '}') {
      continue;
    }
    if (isPendingProposalCueRoutingDiffLine(line) || isSongVoteCueDeriveDiffLine(line) || isRehearsalCueDeriveDiffLine(line) || isRehearsalCueOrchestrationDiffLine(line) || isRehearsalCueTargetCollectionDiffLine(line)) {
      continue;
    }
    var matched = false;
    for (const re of allowedOrchestrateRes) {
      if (re.test(line)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      fail(`index.html diff adds disallowed line in Phase 6d: ${line}`);
    }
  }
}

function assertControllerScriptLoadOrder(html) {
  const controllerPos = findScriptPositions(html, CONTROLLER_SRC);
  const diagPos = findScriptPositions(html, 'oot_home_diag.js');
  const compatPos = findScriptPositions(html, 'oot_compat_home.js');

  if (controllerPos === -1) {
    fail(`index.html missing approved script reference: ${CONTROLLER_SRC}`);
  }
  if (diagPos !== -1 && controllerPos !== -1 && diagPos > controllerPos) {
    fail('Expected oot_home_diag.js to load before oot_home_controller.js');
  }
  if (controllerPos !== -1 && compatPos !== -1 && controllerPos > compatPos) {
    fail('Expected oot_home_controller.js to load before oot_compat_home.js');
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
  const cueRendererPos = findScriptPositions(html, 'oot_home_cue_renderer.js');
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
  if (cueRendererPos === -1) {
    fail('Could not locate oot_home_cue_renderer.js script tag in index.html');
  }
  if (alertRailPos !== -1 && cueRendererPos !== -1 && alertRailPos > cueRendererPos) {
    fail('Expected oot_home_alert_rail.js to load before oot_home_cue_renderer.js');
  }
  if (cueRendererPos !== -1 && gigSlotPos !== -1 && cueRendererPos > gigSlotPos) {
    fail('Expected oot_home_cue_renderer.js to load before oot_home_gig_slot.js');
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

  assertControllerScriptLoadOrder(html);
  assertIndexHtmlChangesAllowed(html);

  const changedFiles = gitChangedFiles();
  for (const protectedFile of PROTECTED_MODULE_FILES) {
    if (changedFiles.includes(protectedFile)) {
      fail(`Phase 5 must not modify protected module: ${protectedFile}`);
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
    assertPilotHeroMinHeightHygiene(layoutCss);
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
