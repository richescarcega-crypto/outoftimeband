#!/usr/bin/env node
/**
 * Flyer template adapter integrity gate (F7 — r951).
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MANIFEST_PATH = path.join(ROOT, 'js/flyer-template-manifest.js');
const ADAPTER_PATH = path.join(ROOT, 'js/flyer-template-adapter.js');
const INDEX_PATH = path.join(ROOT, 'index.html');

const failures = [];

function fail(message) {
  failures.push(message);
}

function buildTemplateRecord(key, sandbox) {
  const FLYER_TEMPLATES = sandbox.FLYER_TEMPLATES;
  const FLYER_NAMES = sandbox.FLYER_NAMES;
  const FLYER_ZONES = sandbox.FLYER_ZONES;
  const FLYER_DIMS = sandbox.FLYER_DIMS;
  const FLYER_FORCE_REFRESH_TEMPLATES = sandbox.FLYER_FORCE_REFRESH_TEMPLATES;
  if (!key || !FLYER_TEMPLATES || !FLYER_TEMPLATES[key]) return null;
  const format = String(key).endsWith('-story') ? 'story' : 'square';
  return {
    id: key,
    key: key,
    familyId: String(key).replace(/-(square|story)$/, ''),
    name: FLYER_NAMES[key] ? FLYER_NAMES[key] : key,
    format: format,
    width: FLYER_DIMS[format] ? FLYER_DIMS[format].w : 1080,
    height: FLYER_DIMS[format] ? FLYER_DIMS[format].h : (format === 'story' ? 1920 : 1080),
    backgroundSrc: String(FLYER_TEMPLATES[key]),
    active: true,
    layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } },
    textZones: FLYER_ZONES[key] ? FLYER_ZONES[key] : null,
    assetVersion: FLYER_FORCE_REFRESH_TEMPLATES[key]
      ? FLYER_FORCE_REFRESH_TEMPLATES[key]
      : String(FLYER_TEMPLATES[key]),
  };
}

function loadAdapterSandbox() {
  const manifestCode = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const adapterCode = fs.readFileSync(ADAPTER_PATH, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(manifestCode, sandbox);
  vm.runInNewContext(adapterCode, sandbox);
  return sandbox;
}

function checkFilesExist() {
  if (!fs.existsSync(ADAPTER_PATH)) fail('missing js/flyer-template-adapter.js');
  if (!fs.existsSync(MANIFEST_PATH)) fail('missing js/flyer-template-manifest.js');
  if (!fs.existsSync(INDEX_PATH)) fail('missing index.html');
}

function checkIndexWiring(html) {
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const manifestTag = '<script src="js/flyer-template-manifest.js"></script>';
  const adapterTag = '<script src="js/flyer-template-adapter.js"></script>';
  if (!normalized.includes(manifestTag)) fail('index.html missing flyer manifest script tag');
  if (!normalized.includes(adapterTag)) fail('index.html missing flyer adapter script tag');
  const manifestIdx = normalized.indexOf(manifestTag);
  const adapterIdx = normalized.indexOf(adapterTag);
  const inlineIdx = normalized.indexOf('<script>\n"use strict";');
  if (manifestIdx < 0 || adapterIdx < 0 || inlineIdx < 0) {
    fail('index.html script tag positions could not be resolved');
  } else {
    if (!(manifestIdx < adapterIdx && adapterIdx < inlineIdx)) {
      fail('script load order must be manifest → adapter → inline');
    }
  }
  if (/function\s+_flyerTemplateRecordForKey\s*\(/.test(html)) {
    fail('index.html still defines inline _flyerTemplateRecordForKey');
  }
  if (/function\s+_flyerSavedRenderIsStale\s*\(/.test(html)) {
    fail('index.html still defines inline _flyerSavedRenderIsStale');
  }
}

function checkAdapterApi(sandbox) {
  const adapter = sandbox.window.OOT_FLYER_ADAPTER;
  if (!adapter) fail('window.OOT_FLYER_ADAPTER not set');

  const aliasNames = [
    '_flyerTemplateRecordForKey',
    '_flyerTemplateExists',
    '_flyerTemplateKeysForFormat',
    '_flyerTemplateNameForKey',
    '_flyerTemplateZonesForKey',
    '_flyerTemplateSrcForKey',
    '_flyerSavedRenderIsStale',
    '_flyerPreviewSrcForDetails',
    '_flyerCurrentAssetVersion',
  ];
  aliasNames.forEach(function (name) {
    if (typeof sandbox.window[name] !== 'function') fail('missing window.' + name);
    if (adapter && typeof sandbox[name] === 'function' && sandbox.window[name] !== sandbox[name]) {
      // function declarations may also exist on sandbox root; aliases must be on window
    }
  });

  const apiNames = [
    'templateRecordForKey',
    'templateExists',
    'templateKeysForFormat',
    'templateNameForKey',
    'templateZonesForKey',
    'templateSrcForKey',
    'savedRenderIsStale',
    'previewSrcForDetails',
    'currentAssetVersion',
  ];
  apiNames.forEach(function (name) {
    if (!adapter || typeof adapter[name] !== 'function') fail('OOT_FLYER_ADAPTER.' + name + ' missing');
  });

  if (sandbox.window._flyerTemplateRecordForKey !== adapter.templateRecordForKey) {
    fail('window._flyerTemplateRecordForKey must alias OOT_FLYER_ADAPTER.templateRecordForKey');
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function checkRecordParity(sandbox) {
  const keys = Object.keys(sandbox.FLYER_TEMPLATES || {});
  const recordForKey = sandbox.window._flyerTemplateRecordForKey;
  keys.forEach(function (key) {
    const expected = buildTemplateRecord(key, sandbox);
    const actual = recordForKey(key);
    if (!deepEqual(actual, expected)) fail('record parity mismatch for ' + key);
  });
}

function checkKeysForFormat(sandbox) {
  const keysForFormat = sandbox.window._flyerTemplateKeysForFormat;
  const square = keysForFormat('square');
  const story = keysForFormat('story');
  if (square.length !== 15) fail('expected 15 square template keys, got ' + square.length);
  if (story.length !== 15) fail('expected 15 story template keys, got ' + story.length);
}

function checkStaleness(sandbox) {
  const isStale = sandbox.window._flyerSavedRenderIsStale;
  const srcForKey = sandbox.window._flyerTemplateSrcForKey;
  const currentSrc = srcForKey('hollywood-square');

  if (isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-square',
    flyerTemplateSrc: currentSrc,
    flyerTemplateAssetVersion: sandbox.FLYER_FORCE_REFRESH_TEMPLATES['hollywood-square'] || currentSrc,
  })) {
    fail('matching flyerTemplateSrc should not be stale');
  }

  if (!isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-square',
    flyerTemplateSrc: 'oot_flyer_square_01_r999.png',
  })) {
    fail('mismatched flyerTemplateSrc should be stale');
  }

  if (!isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-story',
    flyerTemplateSrc: '',
  })) {
    fail('missing flyerTemplateSrc on force-refresh key should be stale');
  }

  const forceVersion = sandbox.FLYER_FORCE_REFRESH_TEMPLATES['hollywood-story'];
  if (!isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-story',
    flyerTemplateSrc: srcForKey('hollywood-story'),
    flyerTemplateAssetVersion: 'stale-version-token',
  })) {
    fail('force-refresh version mismatch should be stale (expected ' + forceVersion + ')');
  }
}

function checkPreviewSrc(sandbox) {
  const preview = sandbox.window._flyerPreviewSrcForDetails;
  const srcForKey = sandbox.window._flyerTemplateSrcForKey;
  const fresh = {
    flyerData: 'data:image/jpeg;base64,fresh',
    flyerTemplateKey: 'neon-square',
    flyerTemplateSrc: srcForKey('neon-square'),
    flyerTemplateAssetVersion: sandbox.window._flyerCurrentAssetVersion('neon-square'),
  };
  if (preview(fresh) !== fresh.flyerData) fail('fresh saved flyer should use flyerData');

  const stale = {
    flyerData: 'data:image/jpeg;base64,stale',
    flyerTemplateKey: 'neon-square',
    flyerTemplateSrc: 'oot_flyer_square_02_r999.png',
  };
  if (preview(stale) !== srcForKey('neon-square')) fail('stale saved flyer should use template src');
}

function main() {
  checkFilesExist();
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  checkIndexWiring(html);
  const sandbox = loadAdapterSandbox();
  checkAdapterApi(sandbox);
  checkRecordParity(sandbox);
  checkKeysForFormat(sandbox);
  checkStaleness(sandbox);
  checkPreviewSrc(sandbox);

  if (failures.length) {
    console.error('FAIL: flyer adapter integrity (' + failures.length + ' issues)');
    failures.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('PASS: flyer adapter integrity');
}

main();
