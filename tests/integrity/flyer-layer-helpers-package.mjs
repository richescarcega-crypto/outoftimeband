#!/usr/bin/env node
/**
 * Flyer layer helpers integrity gate (F8a — r952).
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MANIFEST_PATH = path.join(ROOT, 'js/flyer-template-manifest.js');
const ADAPTER_PATH = path.join(ROOT, 'js/flyer-template-adapter.js');
const LAYER_PATH = path.join(ROOT, 'js/flyer-layer-helpers.js');
const INDEX_PATH = path.join(ROOT, 'index.html');

const failures = [];

function fail(message) {
  failures.push(message);
}

function loadLayerSandbox() {
  const manifestCode = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const adapterCode = fs.readFileSync(ADAPTER_PATH, 'utf8');
  const layerCode = fs.readFileSync(LAYER_PATH, 'utf8');
  const sandbox = {
    window: {},
    _flyerCtx: { layerImages: {} },
    Image: function MockImage() {
      this.onload = null;
      this.onerror = null;
      this.complete = false;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      Object.defineProperty(this, 'src', {
        set: function () { /* no auto-load in tests */ },
        get: function () { return ''; }
      });
    }
  };
  sandbox.window._flyerCtx = sandbox._flyerCtx;
  vm.runInNewContext(manifestCode, sandbox);
  vm.runInNewContext(adapterCode, sandbox);
  vm.runInNewContext(layerCode, sandbox);
  return sandbox;
}

function checkFilesExist() {
  if (!fs.existsSync(LAYER_PATH)) fail('missing js/flyer-layer-helpers.js');
  if (!fs.existsSync(ADAPTER_PATH)) fail('missing js/flyer-template-adapter.js');
  if (!fs.existsSync(MANIFEST_PATH)) fail('missing js/flyer-template-manifest.js');
  if (!fs.existsSync(INDEX_PATH)) fail('missing index.html');
}

function checkIndexWiring(html) {
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const manifestTag = '<script src="js/flyer-template-manifest.js"></script>';
  const adapterTag = '<script src="js/flyer-template-adapter.js"></script>';
  const layerTag = '<script src="js/flyer-layer-helpers.js"></script>';
  if (!normalized.includes(manifestTag)) fail('index.html missing flyer manifest script tag');
  if (!normalized.includes(adapterTag)) fail('index.html missing flyer adapter script tag');
  if (!normalized.includes(layerTag)) fail('index.html missing flyer layer helpers script tag');
  const manifestIdx = normalized.indexOf(manifestTag);
  const adapterIdx = normalized.indexOf(adapterTag);
  const layerIdx = normalized.indexOf(layerTag);
  const inlineIdx = normalized.indexOf('<script>\n"use strict";');
  if (manifestIdx < 0 || adapterIdx < 0 || layerIdx < 0 || inlineIdx < 0) {
    fail('index.html script tag positions could not be resolved');
  } else if (!(manifestIdx < adapterIdx && adapterIdx < layerIdx && layerIdx < inlineIdx)) {
    fail('script load order must be manifest → adapter → layer helpers → inline');
  }

  const mustNotDefine = [
    'function _flyerLayerConfigForKey',
    'function _flyerLayerImageCache',
    'function _flyerDrawImageLayer',
    'function _flyerDrawConfiguredLayers'
  ];
  mustNotDefine.forEach(function (sig) {
    const re = new RegExp(sig.replace(/ /g, '\\s+') + '\\s*\\(');
    if (re.test(html)) fail('index.html still defines inline ' + sig.replace('function ', ''));
  });
}

function checkAliases(sandbox) {
  const helpers = sandbox.window.OOT_FLYER_LAYER_HELPERS;
  if (!helpers) fail('window.OOT_FLYER_LAYER_HELPERS not set');

  const aliasNames = [
    '_flyerLayerConfigForKey',
    '_flyerLayerImageCache',
    '_flyerDrawImageLayer',
    '_flyerDrawConfiguredLayers'
  ];
  aliasNames.forEach(function (name) {
    if (typeof sandbox.window[name] !== 'function') fail('missing window.' + name);
  });

  const apiNames = [
    'layerConfigForKey',
    'layerImageCache',
    'drawImageLayer',
    'drawConfiguredLayers'
  ];
  apiNames.forEach(function (name) {
    if (!helpers || typeof helpers[name] !== 'function') {
      fail('OOT_FLYER_LAYER_HELPERS.' + name + ' missing');
    }
  });

  if (helpers && sandbox.window._flyerLayerConfigForKey !== helpers.layerConfigForKey) {
    fail('window._flyerLayerConfigForKey must alias OOT_FLYER_LAYER_HELPERS.layerConfigForKey');
  }
}

function checkDefaultLogoDisabled(sandbox) {
  const keys = Object.keys(sandbox.FLYER_TEMPLATES || {});
  const configForKey = sandbox.window._flyerLayerConfigForKey;
  const recordForKey = sandbox.window._flyerTemplateRecordForKey;
  keys.forEach(function (key) {
    const rec = recordForKey(key);
    if (!rec || !rec.layers || !rec.layers.logo) {
      fail('adapter record missing layers.logo for ' + key);
      return;
    }
    if (rec.layers.logo.enabled !== false) {
      fail('default adapter logo layer must remain disabled for ' + key);
    }
    const logo = configForKey(key, 'logo');
    if (!logo || logo.enabled !== false) {
      fail('layerConfigForKey logo must be disabled for ' + key);
    }
  });
}

function checkDrawOnlyWhenEnabled(sandbox) {
  const drawConfigured = sandbox.window._flyerDrawConfiguredLayers;
  const dims = { w: 1080, h: 1080 };
  let drawCalls = 0;
  const ctx = {
    globalAlpha: 1,
    drawImage: function () { drawCalls += 1; }
  };

  drawCalls = 0;
  drawConfigured(ctx, dims, 'neon-square');
  if (drawCalls !== 0) fail('disabled logo must not call ctx.drawImage');

  const cache = sandbox.window._flyerLayerImageCache();
  cache['neon-square:logo'] = {
    complete: true,
    naturalWidth: 100,
    naturalHeight: 50
  };
  const enabledLayer = {
    enabled: true,
    src: 'logo.png',
    x_frac: 0.5,
    y_frac: 0.10,
    w_frac: 0.24
  };
  drawCalls = 0;
  sandbox.window._flyerDrawImageLayer(ctx, dims, enabledLayer, 'neon-square:logo');
  if (drawCalls !== 1) fail('enabled logo with cached image must call ctx.drawImage once');

  // Restore default disabled path through drawConfiguredLayers
  sandbox.window._flyerTemplateRecordForKey = sandbox.window.OOT_FLYER_ADAPTER.templateRecordForKey;
  drawCalls = 0;
  drawConfigured(ctx, dims, 'neon-square');
  if (drawCalls !== 0) {
    fail('drawConfiguredLayers must not draw when default logo remains disabled');
  }
}

function main() {
  checkFilesExist();
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  checkIndexWiring(html);
  const sandbox = loadLayerSandbox();
  checkAliases(sandbox);
  checkDefaultLogoDisabled(sandbox);
  checkDrawOnlyWhenEnabled(sandbox);

  if (failures.length) {
    console.error('FAIL: flyer layer helpers integrity (' + failures.length + ' issues)');
    failures.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('PASS: flyer layer helpers integrity');
}

main();
