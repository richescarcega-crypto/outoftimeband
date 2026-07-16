#!/usr/bin/env node
/**
 * Calendar date/status helpers integrity gate (C1a — r953, C2a — r954, C3a — r955, C4a — r957, C5a — r958, C6a — r959).
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
    'function _blackoutConflictMessage',
    'function getUSFederalHolidays',
    'function getHolidayOn',
    'function _nthDayOfMonth',
    'function _lastDayOfMonth',
    'function _fmt',
    'function isBirthdayToday',
    'function isBirthdayOnDate',
    'function getMembersBornOn',
    'function getImportantDatesOn'
  ];
  mustNotDefine.forEach(function (sig) {
    const re = new RegExp(sig.replace(/ /g, '\\s+') + '\\s*\\(');
    if (re.test(html)) fail('index.html still defines inline ' + sig.replace('function ', ''));
  });

  // C4a: Important Date modal still needs inline _pad — do not forbid it.
  if (!/function\s+_pad\s*\(/.test(html)) {
    fail('index.html must keep inline function _pad for Important Date modal');
  }
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
    '_blackoutConflictMessage',
    'getUSFederalHolidays',
    'getHolidayOn',
    'isBirthdayToday',
    'isBirthdayOnDate',
    'getMembersBornOn',
    'getImportantDatesOn'
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
    'blackoutConflictMessage',
    'usFederalHolidays',
    'getUSFederalHolidays',
    'holidayOn',
    'getHolidayOn',
    'birthdayToday',
    'isBirthdayToday',
    'birthdayOnDate',
    'isBirthdayOnDate',
    'membersBornOn',
    'getMembersBornOn',
    'importantDatesOn',
    'getImportantDatesOn'
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
  if (helpers && sandbox.window.getUSFederalHolidays !== helpers.usFederalHolidays) {
    fail('window.getUSFederalHolidays must alias OOT_CALENDAR_HELPERS.usFederalHolidays');
  }
  if (helpers && sandbox.window.getHolidayOn !== helpers.holidayOn) {
    fail('window.getHolidayOn must alias OOT_CALENDAR_HELPERS.holidayOn');
  }
  if (helpers && helpers.usFederalHolidays !== helpers.getUSFederalHolidays) {
    fail('OOT_CALENDAR_HELPERS.usFederalHolidays must equal getUSFederalHolidays');
  }
  if (helpers && helpers.holidayOn !== helpers.getHolidayOn) {
    fail('OOT_CALENDAR_HELPERS.holidayOn must equal getHolidayOn');
  }
  if (helpers && helpers.birthdayToday !== helpers.isBirthdayToday) {
    fail('OOT_CALENDAR_HELPERS.birthdayToday must equal isBirthdayToday');
  }
  if (helpers && helpers.birthdayOnDate !== helpers.isBirthdayOnDate) {
    fail('OOT_CALENDAR_HELPERS.birthdayOnDate must equal isBirthdayOnDate');
  }
  if (helpers && helpers.membersBornOn !== helpers.getMembersBornOn) {
    fail('OOT_CALENDAR_HELPERS.membersBornOn must equal getMembersBornOn');
  }
  if (helpers && helpers.importantDatesOn !== helpers.getImportantDatesOn) {
    fail('OOT_CALENDAR_HELPERS.importantDatesOn must equal getImportantDatesOn');
  }
  if (helpers && sandbox.window.isBirthdayToday !== helpers.isBirthdayToday) {
    fail('window.isBirthdayToday must alias OOT_CALENDAR_HELPERS.isBirthdayToday');
  }
  if (helpers && sandbox.window.isBirthdayOnDate !== helpers.isBirthdayOnDate) {
    fail('window.isBirthdayOnDate must alias OOT_CALENDAR_HELPERS.isBirthdayOnDate');
  }
  // Must not export window._pad from the holiday module.
  if (typeof sandbox.window._pad === 'function') {
    fail('calendar helpers must not export window._pad');
  }
}

function holidayByName(list, name) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].name === name) return list[i];
  }
  return null;
}

function checkHolidayBehavior(sandbox) {
  const getHolidays = sandbox.window.getUSFederalHolidays;
  const holidayOn = sandbox.window.getHolidayOn;
  const year = 2026;
  const list = getHolidays(year);

  if (!Array.isArray(list) || list.length !== 11) {
    fail('getUSFederalHolidays(2026) should return 11 holidays');
    return;
  }

  const fixed = [
    ["New Year's Day", '2026-01-01'],
    ['Juneteenth', '2026-06-19'],
    ['Independence Day', '2026-07-04'],
    ['Veterans Day', '2026-11-11'],
    ['Christmas Day', '2026-12-25']
  ];
  fixed.forEach(function (pair) {
    const h = holidayByName(list, pair[0]);
    if (!h || h.date !== pair[1]) {
      fail('fixed holiday mismatch for ' + pair[0] + ': ' + (h && h.date));
    }
    const looked = holidayOn(pair[1]);
    if (!looked || looked.name !== pair[0] || looked.date !== pair[1]) {
      fail('getHolidayOn exact-date mismatch for ' + pair[1]);
    }
  });

  // nth-weekday: MLK = 3rd Monday in January 2026 = Jan 19
  const mlk = holidayByName(list, 'Martin Luther King Jr. Day');
  if (!mlk || mlk.date !== '2026-01-19') {
    fail('MLK nth-weekday mismatch: ' + (mlk && mlk.date));
  }
  if (!holidayOn('2026-01-19') || holidayOn('2026-01-19').name !== 'Martin Luther King Jr. Day') {
    fail('getHolidayOn(MLK) mismatch');
  }

  // last-weekday: Memorial Day = last Monday in May 2026 = May 25
  const memorial = holidayByName(list, 'Memorial Day');
  if (!memorial || memorial.date !== '2026-05-25') {
    fail('Memorial Day last-weekday mismatch: ' + (memorial && memorial.date));
  }

  // Thanksgiving = 4th Thursday in November 2026 = Nov 26
  const thanksgiving = holidayByName(list, 'Thanksgiving');
  if (!thanksgiving || thanksgiving.date !== '2026-11-26') {
    fail('Thanksgiving fourth-Thursday mismatch: ' + (thanksgiving && thanksgiving.date));
  }
  if (!holidayOn('2026-11-26') || holidayOn('2026-11-26').name !== 'Thanksgiving') {
    fail('getHolidayOn(Thanksgiving) mismatch');
  }

  // Exact-date only: Independence Day 2026 falls on Saturday — no Fri/Mon observed substitution.
  if (holidayOn('2026-07-04')?.name !== 'Independence Day') {
    fail('Independence Day exact Saturday date should still match');
  }
  if (holidayOn('2026-07-03') !== null) {
    fail('no weekend-observed: Friday before Independence Day must be null');
  }
  if (holidayOn('2026-07-05') !== null) {
    fail('no weekend-observed: Monday after Independence Day must be null');
  }

  // Non-holiday / invalid
  if (holidayOn(null) !== null) fail('getHolidayOn(null) should be null');
  if (holidayOn('') !== null) fail('getHolidayOn("") should be null');
  if (holidayOn('2026-07-15') !== null) fail('getHolidayOn(non-holiday) should be null');
  if (holidayOn('bad') !== null) fail('getHolidayOn(invalid) should be null');
}

function checkBirthdayBehavior(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  const onDate = sandbox.window.isBirthdayOnDate;
  const bornOn = helpers.getMembersBornOn;
  const legacyBornOn = sandbox.window.getMembersBornOn;

  // MM-DD matching preserved; year ignored
  if (onDate('1990-07-15', '2026-07-15') !== true) {
    fail('isBirthdayOnDate should match same MM-DD across years');
  }
  if (onDate('2001-07-15', '1999-07-15') !== true) {
    fail('isBirthdayOnDate should match same month/day different years');
  }
  if (onDate('1990-07-15', '2026-07-16') !== false) {
    fail('isBirthdayOnDate nonmatching day should be false');
  }
  if (onDate('1990-08-15', '2026-07-15') !== false) {
    fail('isBirthdayOnDate nonmatching month should be false');
  }

  // Missing / empty / malformed
  if (onDate(null, '2026-07-15') !== false) fail('isBirthdayOnDate(null) should be false');
  if (onDate('', '2026-07-15') !== false) fail('isBirthdayOnDate("") should be false');
  if (onDate('07-15', '2026-07-15') !== false) fail('isBirthdayOnDate(malformed) should be false');
  if (onDate('1990-07-15', null) !== false) fail('isBirthdayOnDate(null ds) should be false');
  if (onDate('1990-07-15', '') !== false) fail('isBirthdayOnDate(empty ds) should be false');

  const members = [
    { name: 'Alex', bday: '1990-07-15' },
    { name: 'Pat', bday: '1988-01-01' },
    { name: 'Sam', bday: '2000-07-15' },
    { name: 'NoBday' },
    { name: 'Empty', bday: '' },
    { name: 'Bad', bday: '07-15' }
  ];
  const snapshot = JSON.stringify(members);

  const matched = bornOn('2026-07-15', members);
  if (!Array.isArray(matched) || matched.length !== 2) {
    fail('getMembersBornOn explicit list should return 2 matches');
  } else if (matched[0].name !== 'Alex' || matched[1].name !== 'Sam') {
    fail('getMembersBornOn should preserve member order: ' + matched.map(function (m) { return m.name; }).join(','));
  }

  const none = bornOn('2026-12-25', members);
  if (!Array.isArray(none) || none.length !== 0) {
    fail('getMembersBornOn nonmatching date should be empty list');
  }

  if (JSON.stringify(bornOn('2026-07-15', null)) !== '[]') {
    fail('getMembersBornOn(null membersList) should treat as []');
  }
  if (JSON.stringify(bornOn('2026-07-15', undefined)) !== '[]') {
    fail('getMembersBornOn(undefined membersList) should treat as []');
  }
  if (JSON.stringify(bornOn('2026-07-15', '')) !== '[]') {
    fail('getMembersBornOn(falsy membersList) should treat as []');
  }

  bornOn('2026-07-15', members);
  if (JSON.stringify(members) !== snapshot) {
    fail('getMembersBornOn must not mutate supplied members array');
  }

  // Legacy one-arg alias falls back to window.members
  sandbox.window.members = members;
  const legacy = legacyBornOn('2026-07-15');
  if (!Array.isArray(legacy) || legacy.length !== 2 || legacy[0].name !== 'Alex' || legacy[1].name !== 'Sam') {
    fail('legacy window.getMembersBornOn(ds) should use window.members');
  }
  sandbox.window.members = undefined;
  const legacyEmpty = legacyBornOn('2026-07-15');
  if (!Array.isArray(legacyEmpty) || legacyEmpty.length !== 0) {
    fail('legacy getMembersBornOn with missing window.members should return []');
  }

  // isBirthdayToday uses local Date — smoke check for missing/empty
  if (sandbox.window.isBirthdayToday(null) !== false) fail('isBirthdayToday(null) should be false');
  if (sandbox.window.isBirthdayToday('') !== false) fail('isBirthdayToday("") should be false');
  if (sandbox.window.isBirthdayToday('07-15') !== false) fail('isBirthdayToday(malformed) should be false');

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  if (sandbox.window.isBirthdayToday('1990-' + mm + '-' + dd) !== true) {
    fail('isBirthdayToday should match today MM-DD');
  }
  if (sandbox.window.isBirthdayToday('1990-01-01') === true && !(now.getMonth() === 0 && now.getDate() === 1)) {
    fail('isBirthdayToday should be false for non-today MM-DD');
  }
}

function checkImportantDatesBehavior(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  const onDate = helpers.getImportantDatesOn;
  const legacyOnDate = sandbox.window.getImportantDatesOn;

  const dates = [
    { id: 'a', title: 'Exact', date: '2026-07-15', recurring: false },
    { id: 'b', title: 'RecurMMDD', date: '07-15', recurring: true },
    { id: 'c', title: 'RecurFull', date: '2001-07-15', recurring: true },
    { id: 'd', title: 'OtherDay', date: '2026-07-16', recurring: false },
    { id: 'e', title: 'RecurOther', date: '08-15', recurring: true },
    { id: 'f', title: 'NoDate' },
    { id: 'g', title: 'Empty', date: '' },
    { id: 'h', title: 'WrongExact', date: '2025-07-15', recurring: false }
  ];
  const snapshot = JSON.stringify(dates);

  const matched = onDate('2026-07-15', dates);
  if (!Array.isArray(matched) || matched.length !== 3) {
    fail('getImportantDatesOn explicit list should return 3 matches');
  } else if (matched[0].id !== 'a' || matched[1].id !== 'b' || matched[2].id !== 'c') {
    fail('getImportantDatesOn should preserve original order: ' + matched.map(function (x) { return x.id; }).join(','));
  }

  const none = onDate('2026-12-25', dates);
  if (!Array.isArray(none) || none.length !== 0) {
    fail('getImportantDatesOn nonmatching date should be empty list');
  }

  // Missing / empty / malformed ds
  if (JSON.stringify(onDate(null, dates)) !== '[]') fail('getImportantDatesOn(null ds) should be []');
  if (JSON.stringify(onDate('', dates)) !== '[]') fail('getImportantDatesOn(empty ds) should be []');
  if (JSON.stringify(onDate('07-15', dates)) !== '[]') fail('getImportantDatesOn(malformed ds) should be []');

  if (JSON.stringify(onDate('2026-07-15', null)) !== '[]') {
    fail('getImportantDatesOn(null list) should treat as []');
  }
  if (JSON.stringify(onDate('2026-07-15', undefined)) !== '[]') {
    fail('getImportantDatesOn(undefined list) should treat as []');
  }
  if (JSON.stringify(onDate('2026-07-15', '')) !== '[]') {
    fail('getImportantDatesOn(falsy list) should treat as []');
  }

  onDate('2026-07-15', dates);
  if (JSON.stringify(dates) !== snapshot) {
    fail('getImportantDatesOn must not mutate supplied importantDates array');
  }

  // Legacy one-arg alias falls back to window.importantDates
  sandbox.window.importantDates = dates;
  const legacy = legacyOnDate('2026-07-15');
  if (!Array.isArray(legacy) || legacy.length !== 3 || legacy[0].id !== 'a' || legacy[1].id !== 'b' || legacy[2].id !== 'c') {
    fail('legacy window.getImportantDatesOn(ds) should use window.importantDates');
  }
  sandbox.window.importantDates = undefined;
  const legacyEmpty = legacyOnDate('2026-07-15');
  if (!Array.isArray(legacyEmpty) || legacyEmpty.length !== 0) {
    fail('legacy getImportantDatesOn with missing window.importantDates should return []');
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

  checkHolidayBehavior(sandbox);
  checkBirthdayBehavior(sandbox);
  checkImportantDatesBehavior(sandbox);
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
