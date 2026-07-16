#!/usr/bin/env node
/**
 * r956: Home Rehearsal on Deck opener must fall back to open proposals.
 * Static checks only — no runtime DOM.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const INDEX_PATH = path.join(ROOT, 'index.html');

const failures = [];

function fail(message) {
  failures.push(message);
}

function extractFunction(html, name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) return null;
  const next = html.indexOf('\nfunction ', start + 1);
  const end = next < 0 ? html.length : next;
  return html.slice(start, end);
}

function main() {
  console.log('Running Home rehearsal cue open integrity checks...\n');

  if (!fs.existsSync(INDEX_PATH)) {
    fail('missing index.html');
    report();
    return;
  }

  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const opener = extractFunction(html, '_r535OpenHomeRehearsal');
  if (!opener) {
    fail('missing function _r535OpenHomeRehearsal');
    report();
    return;
  }

  if (!opener.includes('(events || []).find')) {
    fail('_r535OpenHomeRehearsal must keep events lookup first');
  }
  if (!opener.includes('openDayDrawer')) {
    fail('_r535OpenHomeRehearsal must preserve confirmed rehearsal event open path');
  }
  if (!opener.includes('(proposals || []).find')) {
    fail('_r535OpenHomeRehearsal must look up proposals when event is missing');
  }
  if (!opener.includes('_gotoProposalFromMemberActivity')) {
    fail('_r535OpenHomeRehearsal must deep-link open proposals via _gotoProposalFromMemberActivity');
  }

  const toastIdx = opener.indexOf("toast('Rehearsal not found'");
  const proposalIdx = opener.indexOf('(proposals || []).find');
  const deepLinkIdx = opener.indexOf('_gotoProposalFromMemberActivity');
  if (toastIdx < 0) {
    fail('_r535OpenHomeRehearsal must still toast Rehearsal not found as final fallback');
  } else if (proposalIdx < 0 || deepLinkIdx < 0 || toastIdx < proposalIdx || toastIdx < deepLinkIdx) {
    fail('_r535OpenHomeRehearsal must attempt proposal fallback before toasting Rehearsal not found');
  }

  // Guard against accidental event-only early toast pattern returning.
  if (/if\s*\(\s*!ev\s*\|\|\s*!ev\.date\s*\)\s*\{\s*toast\('Rehearsal not found'/.test(opener)) {
    fail('_r535OpenHomeRehearsal must not toast Rehearsal not found solely from missing event');
  }

  if (!html.includes("WHATS_NEW_VERSION = '2026-07-13-r956-home-rehearsal-proposal-open-fix'")) {
    fail('WHATS_NEW_VERSION must be r956 home rehearsal proposal open fix');
  }

  // Scope guards: this fix must not invent proposal grid markers.
  if (/markerTypes\.push\(['"]rehearsal-proposal['"]\)/.test(html) ||
      /eventTypes.*rehearsal-proposal/.test(html)) {
    fail('r956 must not add rehearsal-proposal Calendar grid markers');
  }

  report();
}

function report() {
  if (failures.length) {
    console.error('FAIL (' + failures.length + '):');
    failures.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('PASS: Home rehearsal cue open integrity checks.');
}

main();
