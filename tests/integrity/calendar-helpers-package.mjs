#!/usr/bin/env node
/**
 * Calendar date/status helpers integrity gate (C1a — r953, C2a — r954, C3a — r955, C4a — r957, C5a — r958, C6a — r959, C7a — r960, C8a — r961, C9a — r962, C10a — r963, C11a — r964).
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
    'function getImportantDatesOn',
    'function _calNextUpCalendarIcon',
    'function _calNextUpLine',
    'function _calCustomEntryRows',
    'function _customEntriesAsRows',
    'function _calRowsInMonth',
    'function _calUpcomingRows'
  ];
  mustNotDefine.forEach(function (sig) {
    const re = new RegExp(sig.replace(/ /g, '\\s+') + '\\s*\\(');
    if (re.test(html)) fail('index.html still defines inline ' + sig.replace('function ', ''));
  });

  // C4a: Important Date modal still needs inline _pad — do not forbid it.
  if (!/function\s+_pad\s*\(/.test(html)) {
    fail('index.html must keep inline function _pad for Important Date modal');
  }
  // C9a: collector moved; call sites must remain zero-arg via legacy alias.
  if (!/_customEntriesAsRows\s*\(\s*\)/.test(html)) {
    fail('index.html must keep zero-arg _customEntriesAsRows() call sites');
  }
  // C10a/C11a: display rows remain inline; month + upcoming collectors moved.
  if (!/function\s+_calDisplayRows\s*\(/.test(html)) {
    fail('index.html must keep inline _calDisplayRows');
  }
  if (!/_calUpcomingRows\s*\(\s*60\s*\)/.test(html)) {
    fail('index.html must keep _calRenderStageSummary calling _calUpcomingRows(60)');
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
    'getImportantDatesOn',
    '_calNextUpCalendarIcon',
    '_calNextUpLine',
    '_calCustomEntryRows',
    '_customEntriesAsRows',
    '_calRowsInMonth',
    '_calUpcomingRows'
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
    'getImportantDatesOn',
    'nextUpCalendarIcon',
    'nextUpLine',
    'customEntryRows',
    'customEntriesAsRows',
    'rowsInMonth',
    'upcomingRows'
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
  if (helpers && sandbox.window._calNextUpCalendarIcon !== helpers.nextUpCalendarIcon) {
    fail('window._calNextUpCalendarIcon must alias OOT_CALENDAR_HELPERS.nextUpCalendarIcon');
  }
  if (helpers && sandbox.window._calCustomEntryRows !== helpers.customEntryRows) {
    fail('window._calCustomEntryRows must alias OOT_CALENDAR_HELPERS.customEntryRows');
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

function checkNextUpBehavior(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  const icon = sandbox.window._calNextUpCalendarIcon;
  const line = helpers.nextUpLine;
  const legacyLine = sandbox.window._calNextUpLine;
  const DOT = '<span class="next-up-dot">•</span>';

  const iconHtml = icon();
  if (iconHtml.indexOf('cal-next-up-icon') < 0 || iconHtml.indexOf('Calendaricon.png?v=r250') < 0) {
    fail('_calNextUpCalendarIcon markup mismatch');
  }

  if (line(null) !== 'No upcoming calendar items') {
    fail('_calNextUpLine(null) should return empty-state copy');
  }
  if (line(undefined) !== 'No upcoming calendar items') {
    fail('_calNextUpLine(undefined) should return empty-state copy');
  }

  const dateLabel = sandbox.window._calCompactDateLabel('2026-07-16');
  const titleOnly = line({ date: '2026-07-16', title: 'Rehearsal', type: 'rehearsal' }, {});
  if (titleOnly !== dateLabel + DOT + 'Rehearsal') {
    fail('_calNextUpLine title-only mismatch: ' + titleOnly);
  }

  // Escape title/time via _calSafe
  const escaped = line({ date: '2026-07-16', title: '<b>Gig</b>', type: 'gig', id: 'g1', settime: '8pm' }, {});
  if (escaped.indexOf('&lt;b&gt;Gig&lt;/b&gt;') < 0 || escaped.indexOf('8PM') < 0) {
    fail('_calNextUpLine should escape title and uppercase row.settime: ' + escaped);
  }

  // Gig details map injection prefers det.settime over row time
  const details = { g1: { settime: '7:30pm' } };
  const fromDetails = line({ date: '2026-07-16', title: 'Show', type: 'gig', id: 'g1', time: '9pm' }, details);
  if (fromDetails.indexOf('7:30PM') < 0 || fromDetails.indexOf('9PM') >= 0) {
    fail('_calNextUpLine should prefer gigDetails.settime: ' + fromDetails);
  }

  // Non-gig ignores gigDetails even if id matches
  const rehearse = line({ date: '2026-07-16', title: 'Practice', type: 'rehearsal', id: 'g1' }, details);
  if (rehearse.indexOf('7:30PM') >= 0) {
    fail('_calNextUpLine should ignore gigDetails for non-gig rows');
  }

  // Missing / empty gigDetails map
  if (line({ date: '2026-07-16', title: 'Show', type: 'gig', id: 'g1' }, null).indexOf('Show') < 0) {
    fail('_calNextUpLine(null gigDetailsMap) should still render title');
  }
  if (line({ date: '2026-07-16', title: 'Show', type: 'gig', id: 'g1' }, undefined).indexOf('Show') < 0) {
    fail('_calNextUpLine(undefined gigDetailsMap) should still render title');
  }

  // Legacy one-arg alias uses window.gigDetails
  sandbox.window.gigDetails = { g1: { settime: '6pm' } };
  const legacy = legacyLine({ date: '2026-07-16', title: 'Show', type: 'gig', id: 'g1' });
  if (legacy.indexOf('6PM') < 0) {
    fail('legacy window._calNextUpLine(row) should use window.gigDetails');
  }
  sandbox.window.gigDetails = undefined;
  const legacyNoMap = legacyLine({ date: '2026-07-16', title: 'Show', type: 'gig', id: 'g1', settime: '5pm' });
  if (legacyNoMap.indexOf('5PM') < 0) {
    fail('legacy _calNextUpLine with missing window.gigDetails should fall back to row.settime');
  }
}

function checkCustomEntryRowsBehavior(sandbox) {
  const rowsFor = sandbox.window.OOT_CALENDAR_HELPERS.customEntryRows;
  const legacyRowsFor = sandbox.window._calCustomEntryRows;
  const color = '#f5c518';

  if (JSON.stringify(rowsFor(null, 2026, color)) !== '[]') {
    fail('_calCustomEntryRows(null) should return []');
  }
  if (JSON.stringify(rowsFor({}, 2026, color)) !== '[]') {
    fail('_calCustomEntryRows(missing date) should return []');
  }

  const single = {
    id: 'one',
    date: '2026-09-12',
    title: 'One-time date',
    note: 'Primary note',
    notes: 'Fallback note',
    startTime: '18:00',
    endTime: '20:00',
    allDay: 1
  };
  const singleSnapshot = JSON.stringify(single);
  const singleRows = rowsFor(single, 2026, color);
  const expectedSingle = [{
    id: 'idate-one',
    date: '2026-09-12',
    type: 'custom',
    title: 'One-time date',
    note: 'Primary note',
    startTime: '18:00',
    endTime: '20:00',
    allDay: true,
    _customColor: color,
    _customSourceId: 'one',
    _customRecurring: false
  }];
  if (JSON.stringify(singleRows) !== JSON.stringify(expectedSingle)) {
    fail('_calCustomEntryRows one-time row mismatch: ' + JSON.stringify(singleRows));
  }
  if (JSON.stringify(single) !== singleSnapshot) {
    fail('_calCustomEntryRows must not mutate a one-time entry');
  }

  const recurring = {
    id: 'annual',
    date: '07-16',
    recurring: true,
    notes: 'Annual note'
  };
  const recurringSnapshot = JSON.stringify(recurring);
  const recurringRows = rowsFor(recurring, 2026, '#112233');
  if (!Array.isArray(recurringRows) || recurringRows.length !== 2) {
    fail('_calCustomEntryRows recurring MM-DD should return two rows');
  } else {
    if (recurringRows[0].id !== 'idate-annual-2026' || recurringRows[0].date !== '2026-07-16') {
      fail('_calCustomEntryRows current-year recurring row mismatch');
    }
    if (recurringRows[1].id !== 'idate-annual-2027' || recurringRows[1].date !== '2027-07-16') {
      fail('_calCustomEntryRows next-year recurring row mismatch');
    }
    recurringRows.forEach(function (row) {
      if (row.type !== 'custom' || row.title !== 'Untitled' || row.note !== 'Annual note' ||
          row.startTime !== '' || row.endTime !== '' || row.allDay !== false ||
          row._customColor !== '#112233' || row._customSourceId !== 'annual' ||
          row._customRecurring !== true) {
        fail('_calCustomEntryRows recurring defaults/metadata mismatch: ' + JSON.stringify(row));
      }
    });
  }
  if (JSON.stringify(recurring) !== recurringSnapshot) {
    fail('_calCustomEntryRows must not mutate a recurring entry');
  }

  const fullDateRows = rowsFor({ id: 'full', date: '2001-12-25', recurring: true }, 2026, color);
  if (fullDateRows.length !== 2 || fullDateRows[0].date !== '2026-12-25' || fullDateRows[1].date !== '2027-12-25') {
    fail('_calCustomEntryRows recurring YYYY-MM-DD mismatch');
  }

  if (JSON.stringify(rowsFor({ id: 'bad', date: '7', recurring: true }, 2026, color)) !== '[]') {
    fail('_calCustomEntryRows malformed recurring date should return []');
  }
  if (JSON.stringify(rowsFor({ id: 'bad', date: 'a-b-c-d', recurring: true }, 2026, color)) !== '[]') {
    fail('_calCustomEntryRows overlong recurring date should return []');
  }

  const legacy = legacyRowsFor({ id: 'legacy', date: '2026-01-01' }, 2026, color);
  if (legacy.length !== 1 || legacy[0].id !== 'idate-legacy' || legacy[0]._customColor !== color) {
    fail('legacy window._calCustomEntryRows should preserve explicit inputs');
  }
}

function checkCustomEntriesAsRowsBehavior(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  const collect = helpers.customEntriesAsRows;
  const legacyCollect = sandbox.window._customEntriesAsRows;
  const color = '#f5c518';

  if (JSON.stringify(collect(null, 2026, color)) !== '[]') {
    fail('_customEntriesAsRows(null list) should return []');
  }
  if (JSON.stringify(collect(undefined, 2026, color)) !== '[]') {
    fail('_customEntriesAsRows(undefined list) should return []');
  }
  if (JSON.stringify(collect('', 2026, color)) !== '[]') {
    fail('_customEntriesAsRows(falsy list) should return []');
  }

  const dates = [
    { id: 'a', date: '2026-09-12', title: 'One-time' },
    { id: 'b', date: '07-16', recurring: true, title: 'Annual' },
    { id: 'c' },
    { id: 'd', date: 'bad', recurring: true }
  ];
  const snapshot = JSON.stringify(dates);

  const rows = collect(dates, 2026, color);
  if (!Array.isArray(rows) || rows.length !== 3) {
    fail('_customEntriesAsRows explicit list should return 3 rows (1 one-time + 2 recurring)');
  } else if (rows[0].id !== 'idate-a' || rows[1].id !== 'idate-b-2026' || rows[2].id !== 'idate-b-2027') {
    fail('_customEntriesAsRows should preserve source order and recurring year order: ' + rows.map(function (r) { return r.id; }).join(','));
  }
  if (rows[0]._customColor !== color || rows[1]._customColor !== color) {
    fail('_customEntriesAsRows should apply injected defaultColor');
  }

  collect(dates, 2026, color);
  if (JSON.stringify(dates) !== snapshot) {
    fail('_customEntriesAsRows must not mutate supplied importantDates array');
  }

  // Year injection must control recurring materialization
  const y2025 = collect([{ id: 'y', date: '01-01', recurring: true }], 2025, color);
  if (y2025.length !== 2 || y2025[0].date !== '2025-01-01' || y2025[1].date !== '2026-01-01') {
    fail('_customEntriesAsRows should honor injected currentYear');
  }

  // Legacy zero-arg alias uses window.importantDates / year / IDATE_DEFAULT_COLOR
  sandbox.window.importantDates = dates;
  sandbox.window.IDATE_DEFAULT_COLOR = '#abcdef';
  const legacy = legacyCollect();
  if (!Array.isArray(legacy) || legacy.length !== 3 || legacy[0].id !== 'idate-a') {
    fail('legacy window._customEntriesAsRows() should use window.importantDates');
  }
  if (legacy[0]._customColor !== '#abcdef') {
    fail('legacy _customEntriesAsRows should use window.IDATE_DEFAULT_COLOR');
  }
  const yearNow = new Date().getFullYear();
  if (legacy[1].date !== (yearNow + '-07-16') || legacy[2].date !== ((yearNow + 1) + '-07-16')) {
    fail('legacy _customEntriesAsRows should use current calendar year for recurring rows');
  }

  sandbox.window.importantDates = undefined;
  sandbox.window.IDATE_DEFAULT_COLOR = color;
  const legacyEmpty = legacyCollect();
  if (!Array.isArray(legacyEmpty) || legacyEmpty.length !== 0) {
    fail('legacy _customEntriesAsRows with missing window.importantDates should return []');
  }
}

function checkRowsInMonthBehavior(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  const inMonth = helpers.rowsInMonth;
  const legacyInMonth = sandbox.window._calRowsInMonth;

  const rows = [
    { id: 'jun30', date: '2026-06-30' },
    { id: 'jul1', date: '2026-07-01' },
    { id: 'jul15', date: '2026-07-15' },
    { id: 'jul31', date: '2026-07-31' },
    { id: 'aug1', date: '2026-08-01' }
  ];
  const snapshot = JSON.stringify(rows);

  const july = inMonth(rows, 2026, 6); // month0 = July
  if (!Array.isArray(july) || july.length !== 3) {
    fail('_calRowsInMonth July 2026 should return 3 rows');
  } else if (july[0].id !== 'jul1' || july[1].id !== 'jul15' || july[2].id !== 'jul31') {
    fail('_calRowsInMonth should preserve order and include only July dates: ' + july.map(function (r) { return r.id; }).join(','));
  }

  inMonth(rows, 2026, 6);
  if (JSON.stringify(rows) !== snapshot) {
    fail('_calRowsInMonth must not mutate supplied displayRows');
  }

  if (JSON.stringify(inMonth(null, 2026, 6)) !== '[]') {
    fail('_calRowsInMonth(null rows) should return []');
  }
  if (JSON.stringify(inMonth(undefined, 2026, 6)) !== '[]') {
    fail('_calRowsInMonth(undefined rows) should return []');
  }

  // February leap-year end date via injected year/month
  const feb = [
    { id: 'f27', date: '2024-02-27' },
    { id: 'f28', date: '2024-02-28' },
    { id: 'f29', date: '2024-02-29' },
    { id: 'm1', date: '2024-03-01' }
  ];
  const febRows = inMonth(feb, 2024, 1);
  if (febRows.length !== 3 || febRows[2].id !== 'f29') {
    fail('_calRowsInMonth leap-year February should include 2024-02-29');
  }

  // Non-leap February excludes Feb 29-shaped dates outside month end
  const feb2025 = inMonth([
    { id: 'a', date: '2025-02-28' },
    { id: 'b', date: '2025-03-01' }
  ], 2025, 1);
  if (feb2025.length !== 1 || feb2025[0].id !== 'a') {
    fail('_calRowsInMonth non-leap February mismatch');
  }

  // Legacy zero-arg alias uses window._calDisplayRows / CY / CM
  sandbox.window.CY = 2026;
  sandbox.window.CM = 6;
  sandbox.window._calDisplayRows = function () { return rows; };
  const legacy = legacyInMonth();
  if (!Array.isArray(legacy) || legacy.length !== 3 || legacy[0].id !== 'jul1') {
    fail('legacy window._calRowsInMonth() should use window._calDisplayRows / CY / CM');
  }
  sandbox.window._calDisplayRows = undefined;
  const legacyEmpty = legacyInMonth();
  if (!Array.isArray(legacyEmpty) || legacyEmpty.length !== 0) {
    fail('legacy _calRowsInMonth with missing _calDisplayRows should return []');
  }
}

function checkUpcomingRowsBehavior(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  const upcoming = helpers.upcomingRows;
  const legacyUpcoming = sandbox.window._calUpcomingRows;

  const now = new Date(2026, 6, 1); // July 1, 2026 local
  const rows = [
    { id: 'jun30', date: '2026-06-30', type: 'gig' },
    { id: 'jul1', date: '2026-07-01', type: 'gig' },
    { id: 'jul10', date: '2026-07-10', type: 'rehearsal' },
    { id: 'jul15', date: '2026-07-15', type: 'gig' },
    { id: 'jul20', date: '2026-07-20', type: 'gig' },
    { id: 'sep1', date: '2026-09-01', type: 'gig' }
  ];
  const members = [
    { name: 'Alex Rivera', bday: '1990-07-05' },
    { name: 'Jordan Lee', bday: '1988-07-20' }
  ];
  const rowsSnap = JSON.stringify(rows);
  const membersSnap = JSON.stringify(members);

  // Default 14-day window: Jul 1..Jul 15 inclusive
  const def14 = upcoming(rows, now, undefined, members);
  const defIds = def14.filter(function (r) { return r.id; }).map(function (r) { return r.id; });
  if (defIds.join(',') !== 'jul1,jul10,jul15') {
    fail('_calUpcomingRows default 14-day window mismatch: ' + defIds.join(','));
  }
  if (!def14.some(function (r) { return r.type === 'holiday' && r.date === '2026-07-04'; })) {
    fail('_calUpcomingRows default window should include Independence Day 2026-07-04');
  }
  if (!def14.some(function (r) {
    return r.type === 'birthday' && r.date === '2026-07-05' && r.title === "Alex's Birthday";
  })) {
    fail('_calUpcomingRows should inject first-name birthday title for Alex');
  }
  if (def14.some(function (r) { return r.id === 'jul20' || r.id === 'jun30' || r.id === 'sep1'; })) {
    fail('_calUpcomingRows default window should exclude dates outside Jul 1-15');
  }

  // Explicit 60-day window includes Jul 20 and Jordan birthday; still excludes Sep 1
  const win60 = upcoming(rows, now, 60, members);
  if (!win60.some(function (r) { return r.id === 'jul20'; })) {
    fail('_calUpcomingRows(60) should include Jul 20 display row');
  }
  if (!win60.some(function (r) {
    return r.type === 'birthday' && r.date === '2026-07-20' && r.title === "Jordan's Birthday";
  })) {
    fail('_calUpcomingRows(60) should include Jordan birthday');
  }
  if (win60.some(function (r) { return r.id === 'sep1'; })) {
    fail('_calUpcomingRows(60) should still exclude Sep 1');
  }

  // Inclusive bounds: start and end dates included
  const bounds = upcoming(
    [{ id: 's', date: '2026-07-01' }, { id: 'e', date: '2026-07-15' }],
    now,
    14,
    []
  );
  if (!bounds.some(function (r) { return r.id === 's'; }) || !bounds.some(function (r) { return r.id === 'e'; })) {
    fail('_calUpcomingRows must include inclusive start and end dates');
  }

  // Null/empty display rows still allow synthetic birthday/holiday rows
  const synthNull = upcoming(null, now, 14, members);
  if (!synthNull.some(function (r) { return r.type === 'holiday' && r.date === '2026-07-04'; })) {
    fail('_calUpcomingRows(null rows) should still inject holidays');
  }
  if (!synthNull.some(function (r) { return r.type === 'birthday' && r.date === '2026-07-05'; })) {
    fail('_calUpcomingRows(null rows) should still inject birthdays');
  }
  const synthEmpty = upcoming([], now, 14, members);
  if (!synthEmpty.some(function (r) { return r.type === 'holiday' && r.date === '2026-07-04'; })) {
    fail('_calUpcomingRows([] rows) should still inject holidays');
  }

  upcoming(rows, now, 14, members);
  if (JSON.stringify(rows) !== rowsSnap) {
    fail('_calUpcomingRows must not mutate supplied displayRows');
  }
  if (JSON.stringify(members) !== membersSnap) {
    fail('_calUpcomingRows must not mutate supplied membersList');
  }

  // Sorted by date only
  for (var i = 1; i < def14.length; i++) {
    if (def14[i - 1].date.localeCompare(def14[i].date) > 0) {
      fail('_calUpcomingRows must sort by date ascending');
      break;
    }
  }

  // Legacy one-arg alias uses _calDisplayRows / new Date() / window.members
  const clock = new Date();
  const startLocal = new Date(clock.getFullYear(), clock.getMonth(), clock.getDate());
  function dsLive(dt){
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  const dIn = dsLive(startLocal);
  const dBday = dsLive(new Date(startLocal.getTime() + 3 * 86400000));
  const dOut = dsLive(new Date(startLocal.getTime() + 30 * 86400000));
  const liveRows = [
    { id: 'in', date: dIn, type: 'gig' },
    { id: 'out', date: dOut, type: 'gig' }
  ];
  const liveMembers = [
    { name: 'Sam Test', bday: '2000-' + dBday.slice(5) }
  ];
  sandbox.window.members = liveMembers;
  sandbox.window._calDisplayRows = function () { return liveRows; };
  const legacy = legacyUpcoming(14);
  if (!Array.isArray(legacy) || !legacy.some(function (r) { return r.id === 'in'; })) {
    fail('legacy window._calUpcomingRows(14) should include in-window display row');
  }
  if (legacy.some(function (r) { return r.id === 'out'; })) {
    fail('legacy _calUpcomingRows(14) should exclude out-of-window display row');
  }
  if (!legacy.some(function (r) {
    return r.type === 'birthday' && r.date === dBday && r.title === "Sam's Birthday";
  })) {
    fail('legacy _calUpcomingRows should inject birthdays from window.members');
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
  checkNextUpBehavior(sandbox);
  checkCustomEntryRowsBehavior(sandbox);
  checkCustomEntriesAsRowsBehavior(sandbox);
  checkRowsInMonthBehavior(sandbox);
  checkUpcomingRowsBehavior(sandbox);
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
