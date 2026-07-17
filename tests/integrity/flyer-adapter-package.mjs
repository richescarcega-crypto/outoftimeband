#!/usr/bin/env node
/**
 * Flyer template adapter integrity gate (r968).
 * Validates canonical-record preference, pack-contract access, and saved-flyer staleness.
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
  } else if (!(manifestIdx < adapterIdx && adapterIdx < inlineIdx)) {
    fail('script load order must be manifest → adapter → inline');
  }
  if (/function\s+_flyerTemplateRecordForKey\s*\(/.test(html)) {
    fail('index.html still defines inline _flyerTemplateRecordForKey');
  }
  if (/function\s+_flyerSavedRenderIsStale\s*\(/.test(html)) {
    fail('index.html still defines inline _flyerSavedRenderIsStale');
  }
  if (/FLYER_DIMS\s*\[\s*_flyerCtx\.format\s*\]/.test(html)) {
    fail('index.html still reads FLYER_DIMS[_flyerCtx.format] directly in renderer');
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

function checkCanonicalAccess(sandbox) {
  const records = sandbox.OOT_FLYER_TEMPLATE_RECORDS || [];
  const recordForKey = sandbox.window._flyerTemplateRecordForKey;
  const keysForFormat = sandbox.window._flyerTemplateKeysForFormat;
  const exists = sandbox.window._flyerTemplateExists;

  if (!Array.isArray(records) || !records.length) {
    fail('canonical records unavailable in adapter sandbox');
    return;
  }

  if (recordForKey('__missing-template-id__') !== null) {
    fail('unknown template lookup must return null');
  }
  if (exists('__missing-template-id__')) {
    fail('unknown template must not exist');
  }

  const square = keysForFormat('square');
  const story = keysForFormat('story');
  if (!Array.isArray(square) || !square.length) fail('format filter returned no square templates');
  if (!Array.isArray(story) || !story.length) fail('format filter returned no story templates');

  const expectedSquare = records.filter(function (r) { return r && r.active !== false && r.format === 'square'; }).map(function (r) { return r.id; });
  const expectedStory = records.filter(function (r) { return r && r.active !== false && r.format === 'story'; }).map(function (r) { return r.id; });
  if (JSON.stringify(square) !== JSON.stringify(expectedSquare)) fail('square format filter mismatch vs canonical records');
  if (JSON.stringify(story) !== JSON.stringify(expectedStory)) fail('story format filter mismatch vs canonical records');

  records.forEach(function (raw) {
    if (!raw || raw.active === false) return;
    const rec = recordForKey(raw.id);
    if (!rec) {
      fail('saved template key failed to resolve: ' + raw.id);
      return;
    }
    if (rec.id !== raw.id) fail('record id mismatch for ' + raw.id);
    if (rec.backgroundSrc !== raw.backgroundSrc) fail('backgroundSrc mismatch for ' + raw.id);
    if (rec.assetVersion !== String(raw.assetVersion)) fail('assetVersion mismatch for ' + raw.id);
    if (rec.width !== raw.width || rec.height !== raw.height) fail('dimensions mismatch for ' + raw.id);
    if (rec.format !== raw.format) fail('format mismatch for ' + raw.id);
    if (!rec.layers || !rec.layers.logo || rec.layers.logo.enabled !== false) {
      fail('normalized logo must remain disabled by default for ' + raw.id);
    }
    if (sandbox.FLYER_TEMPLATES[raw.id] !== raw.backgroundSrc) {
      fail('legacy shim backgroundSrc mismatch for ' + raw.id);
    }
  });
}

function checkLegacyFallback() {
  const adapterCode = fs.readFileSync(ADAPTER_PATH, 'utf8');
  const sandbox = {
    window: {},
    FLYER_TEMPLATES: { 'legacy-square': 'legacy.png' },
    FLYER_NAMES: { 'legacy-square': 'Legacy' },
    FLYER_ZONES: {
      'legacy-square': {
        venue: { y_frac: 0.8, x_frac: 0.5, size: 40, color: '#fff' },
        address: { y_frac: 0.85, x_frac: 0.5, size: 20, color: '#fff' },
        date: { y_frac: 0.9, x_frac: 0.5, size: 30, color: '#fff' },
      },
    },
    FLYER_DIMS: { square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } },
    FLYER_FORCE_REFRESH_TEMPLATES: {},
  };
  vm.runInNewContext(adapterCode, sandbox);
  const rec = sandbox.window._flyerTemplateRecordForKey('legacy-square');
  if (!rec || rec.backgroundSrc !== 'legacy.png' || rec.name !== 'Legacy') {
    fail('adapter legacy-map fallback failed for legacy-square');
  }
  if (sandbox.window._flyerTemplateRecordForKey('nope') !== null) {
    fail('legacy fallback unknown id must return null');
  }
}

function checkStaleness(sandbox) {
  const isStale = sandbox.window._flyerSavedRenderIsStale;
  const srcForKey = sandbox.window._flyerTemplateSrcForKey;
  const currentSrc = srcForKey('hollywood-square');
  const currentVersion = sandbox.window._flyerCurrentAssetVersion('hollywood-square');

  if (!currentSrc) fail('expected hollywood-square backgroundSrc for staleness checks');

  if (isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-square',
    flyerTemplateSrc: currentSrc,
    flyerTemplateAssetVersion: currentVersion,
  })) {
    fail('matching flyerTemplateSrc/assetVersion should not be stale');
  }

  if (!isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-square',
    flyerTemplateSrc: 'changed-src.png',
  })) {
    fail('mismatched flyerTemplateSrc should be stale');
  }

  if (!isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-story',
    flyerTemplateSrc: '',
  })) {
    fail('missing flyerTemplateSrc on force-version key should be stale');
  }

  if (!isStale({
    flyerData: 'data:image/jpeg;base64,abc',
    flyerTemplateKey: 'hollywood-story',
    flyerTemplateSrc: srcForKey('hollywood-story'),
    flyerTemplateAssetVersion: 'stale-version-token',
  })) {
    fail('assetVersion mismatch should be stale');
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
    flyerTemplateSrc: 'changed-neon.png',
  };
  if (preview(stale) !== srcForKey('neon-square')) fail('stale saved flyer should use template src');
}

function main() {
  checkFilesExist();
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  checkIndexWiring(html);
  const sandbox = loadAdapterSandbox();
  checkAdapterApi(sandbox);
  checkCanonicalAccess(sandbox);
  checkLegacyFallback();
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
