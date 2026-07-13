#!/usr/bin/env node
/**
 * Calendar date/status helpers integrity gate (C1a — r953, C2a — r954, C3a — r955).
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const CAL_PATH = path.join(ROOT, 'js/calendar-date-helpers.js');
const LAYER_PATH = path.join(ROOT, 'js/flyer-layer-helpers.js');
const INDEX_PATH = path.join(ROOT, 'index.html');

const failures = [];

function fail(message) {
  failures.push(message);
}

function loadCalendarSandbox() {
  const code = fs.readFileSync(CAL_PATH, 'utf8');
  const EC = { gig: '#f5c518', blackout: '#ff4757', rehearsal: '#4a9eff', custom: '#f5c518' };
  const sandbox = {
    window: {},
    EC: EC,
    Date: Date,
    _eventColor: function (type) { return EC[type] || '#06d6a0'; }
  };
  sandbox.window._eventColor = sandbox._eventColor;
  vm.runInNewContext(code, sandbox);
  return sandbox;
}

function checkFilesExist() {
  if (!fs.existsSync(CAL_PATH)) fail('missing js/calendar-date-helpers.js');
  if (!fs.existsSync(INDEX_PATH)) fail('missing index.html');
}

function checkIndexWiring(html) {
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const layerTag = '<script src="js/flyer-layer-helpers.js"></script>';
  const calTag = '<script src="js/calendar-date-helpers.js"></script>';
  if (!normalized.includes(calTag)) fail('index.html missing calendar date helpers script tag');
  if (!fs.existsSync(LAYER_PATH) || !normalized.includes(layerTag)) {
    fail('index.html missing flyer layer helpers script tag (expected before calendar helpers)');
  }
  const layerIdx = normalized.indexOf(layerTag);
  const calIdx = normalized.indexOf(calTag);
  const inlineIdx = normalized.indexOf('<script>\n"use strict";');
  if (layerIdx < 0 || calIdx < 0 || inlineIdx < 0) {
    fail('index.html script tag positions could not be resolved');
  } else if (!(layerIdx < calIdx && calIdx < inlineIdx)) {
    fail('script load order must place calendar date helpers after flyer layer helpers and before inline');
  }

  const mustNotDefine = [
    'function _calTypeIcon',
    'function _calSafe',
    'function _calColor',
    'function _calCompactDateLabel',
    'function _calTodayDate',
    'function _calTodayKey',
    'function _isPastGig',
    'function _blackoutNameFromTitle',
    'function _blackoutConflictLine',
    'function _blackoutConflictMessage'
  ];
  mustNotDefine.forEach(function (sig) {
    const re = new RegExp(sig.replace(/ /g, '\\s+') + '\\s*\\(');
    if (re.test(html)) fail('index.html still defines inline ' + sig.replace('function ', ''));
  });
}

function checkAliases(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  if (!helpers) fail('window.OOT_CALENDAR_HELPERS not set');

  const aliasNames = [
    '_calTypeIcon',
    '_calSafe',
    '_calColor',
    '_calCompactDateLabel',
    '_calTodayDate',
    '_calTodayKey',
    '_isPastGig',
    '_blackoutNameFromTitle',
    '_blackoutConflictLine',
    '_blackoutConflictMessage'
  ];
  aliasNames.forEach(function (name) {
    if (typeof sandbox.window[name] !== 'function') fail('missing window.' + name);
  });

  const apiNames = [
    'typeIcon',
    'safe',
    'color',
    'compactDateLabel',
    'todayDate',
    'todayKey',
    'isPastGig',
    'blackoutNameFromTitle',
    'blackoutConflictLine',
    'blackoutConflictMessage'
  ];
  apiNames.forEach(function (name) {
    if (!helpers || typeof helpers[name] !== 'function') {
      fail('OOT_CALENDAR_HELPERS.' + name + ' missing');
    }
  });

  if (helpers && sandbox.window._calSafe !== helpers.safe) {
    fail('window._calSafe must alias OOT_CALENDAR_HELPERS.safe');
  }
  if (helpers && sandbox.window._calTodayKey !== helpers.todayKey) {
    fail('window._calTodayKey must alias OOT_CALENDAR_HELPERS.todayKey');
  }
  if (helpers && sandbox.window._isPastGig !== helpers.isPastGig) {
    fail('window._isPastGig must alias OOT_CALENDAR_HELPERS.isPastGig');
  }
  if (helpers && sandbox.window._blackoutNameFromTitle !== helpers.blackoutNameFromTitle) {
    fail('window._blackoutNameFromTitle must alias OOT_CALENDAR_HELPERS.blackoutNameFromTitle');
  }
  if (helpers && sandbox.window._blackoutConflictMessage !== helpers.blackoutConflictMessage) {
    fail('window._blackoutConflictMessage must alias OOT_CALENDAR_HELPERS.blackoutConflictMessage');
  }
}

function checkBehavior(sandbox) {
  const safe = sandbox.window._calSafe;
  const typeIcon = sandbox.window._calTypeIcon;
  const color = sandbox.window._calColor;
  const compact = sandbox.window._calCompactDateLabel;
  const todayDate = sandbox.window._calTodayDate;
  const todayKey = sandbox.window._calTodayKey;
  const isPastGig = sandbox.window._isPastGig;
  const blackoutName = sandbox.window._blackoutNameFromTitle;
  const conflictLine = sandbox.window._blackoutConflictLine;
  const conflictMessage = sandbox.window._blackoutConflictMessage;

  if (safe('<b>"x"&y') !== '&lt;b&gt;&quot;x&quot;&amp;y') {
    fail('_calSafe escape mismatch');
  }
  if (typeIcon('gig') !== '&#127928;') fail('_calTypeIcon(gig) mismatch');
  if (typeIcon('unknown') !== '&#8226;') fail('_calTypeIcon(fallback) mismatch');
  if (color('birthday') !== '#f5c518') fail('_calColor(birthday) mismatch');
  if (color('custom', { _customColor: '#112233' }) !== '#112233') {
    fail('_calColor(custom) mismatch');
  }
  if (color('gig') !== '#f5c518') fail('_calColor(gig) must defer to _eventColor/EC');
  if (color('mystery') !== '#06d6a0') fail('_calColor(unknown) fallback mismatch');

  const label = compact('2026-07-13');
  if (!label || label === '2026-07-13') {
    fail('_calCompactDateLabel should format YYYY-MM-DD');
  }
  if (compact('bad') !== 'bad') fail('_calCompactDateLabel should passthrough invalid input');

  const now = todayDate();
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    fail('_calTodayDate must return a valid Date');
  }

  const key = todayKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    fail('_calTodayKey must return YYYY-MM-DD');
  }
  const fixed = todayKey(new Date(2026, 6, 13)); // month is 0-based
  if (fixed !== '2026-07-13') fail('_calTodayKey(fixed date) mismatch: ' + fixed);

  if (isPastGig(null) !== false) fail('_isPastGig(null) should be false');
  if (isPastGig({}) !== false) fail('_isPastGig(missing date) should be false');
  if (isPastGig({ date: key }) !== false) fail('_isPastGig(same-day) should be false');
  if (isPastGig({ date: '2099-01-01' }) !== false) fail('_isPastGig(future) should be false');
  if (isPastGig({ date: '2000-01-01' }) !== true) fail('_isPastGig(past) should be true');

  if (blackoutName('Alex Unavailable') !== 'Alex') {
    fail('_blackoutNameFromTitle should strip trailing Unavailable');
  }
  if (blackoutName('') !== 'Unavailable') {
    fail('_blackoutNameFromTitle empty fallback mismatch');
  }
  if (conflictLine([{ person: 'Alex' }]) !== 'Alex is unavailable') {
    fail('_blackoutConflictLine singular mismatch');
  }
  if (conflictLine([{ person: 'Alex' }, { person: 'Pat' }]) !== 'Alex, Pat are unavailable') {
    fail('_blackoutConflictLine plural mismatch');
  }
  const many = [];
  for (let i = 0; i < 8; i++) many.push({ person: 'P' + i });
  const manyLine = conflictLine(many);
  if (manyLine.indexOf('+2 more') < 0 || manyLine.indexOf('are unavailable') < 0) {
    fail('_blackoutConflictLine truncation mismatch: ' + manyLine);
  }

  const openMsg = conflictMessage('gig', '2026-07-13', [{ person: 'Alex' }], 'open');
  if (openMsg.indexOf('Blackout conflict found for 2026-07-13.') !== 0) {
    fail('_blackoutConflictMessage open header mismatch');
  }
  if (openMsg.indexOf('Alex is unavailable') < 0) {
    fail('_blackoutConflictMessage open line mismatch');
  }
  if (openMsg.indexOf('continue anyway') < 0) {
    fail('_blackoutConflictMessage open action mismatch');
  }
  const saveMsg = conflictMessage('gig', '2026-07-13', [{ person: 'Alex' }], 'save');
  if (saveMsg.indexOf('save anyway') < 0) {
    fail('_blackoutConflictMessage save action mismatch');
  }
}

function main() {
  checkFilesExist();
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  checkIndexWiring(html);
  const sandbox = loadCalendarSandbox();
  checkAliases(sandbox);
  checkBehavior(sandbox);

  if (failures.length) {
    console.error('FAIL: calendar helpers integrity (' + failures.length + ' issues)');
    failures.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('PASS: calendar helpers integrity');
}

main();
