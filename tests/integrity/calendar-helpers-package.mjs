#!/usr/bin/env node
/**
 * Calendar date/display helpers integrity gate (C1a — r953).
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
    'function _calCompactDateLabel'
  ];
  mustNotDefine.forEach(function (sig) {
    const re = new RegExp(sig.replace(/ /g, '\\s+') + '\\s*\\(');
    if (re.test(html)) fail('index.html still defines inline ' + sig.replace('function ', ''));
  });
}

function checkAliases(sandbox) {
  const helpers = sandbox.window.OOT_CALENDAR_HELPERS;
  if (!helpers) fail('window.OOT_CALENDAR_HELPERS not set');

  const aliasNames = ['_calTypeIcon', '_calSafe', '_calColor', '_calCompactDateLabel'];
  aliasNames.forEach(function (name) {
    if (typeof sandbox.window[name] !== 'function') fail('missing window.' + name);
  });

  const apiNames = ['typeIcon', 'safe', 'color', 'compactDateLabel'];
  apiNames.forEach(function (name) {
    if (!helpers || typeof helpers[name] !== 'function') {
      fail('OOT_CALENDAR_HELPERS.' + name + ' missing');
    }
  });

  if (helpers && sandbox.window._calSafe !== helpers.safe) {
    fail('window._calSafe must alias OOT_CALENDAR_HELPERS.safe');
  }
}

function checkBehavior(sandbox) {
  const safe = sandbox.window._calSafe;
  const typeIcon = sandbox.window._calTypeIcon;
  const color = sandbox.window._calColor;
  const compact = sandbox.window._calCompactDateLabel;

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
