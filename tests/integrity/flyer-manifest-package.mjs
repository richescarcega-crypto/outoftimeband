#!/usr/bin/env node
/**
 * Flyer template manifest integrity gate (F5 — r950).
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MANIFEST_PATH = path.join(ROOT, 'js/flyer-template-manifest.js');
const INDEX_PATH = path.join(ROOT, 'index.html');

const EXPECTED_FORCE_REFRESH_KEYS = [
  'hollywood-square',
  'hollywood-story',
  'neon-story',
  'skyline-story',
  'deco-story',
  'disco-story',
  'comic-story',
  'metropolis-story',
  'boardwalk-story',
  'oot09-story',
  'oot13-story',
  'oot14-story',
  'oot15-story',
];

const PNG_RE = /^oot_flyer_(square|story)_\d+_r\d+\.png$/;

const failures = [];

function fail(message) {
  failures.push(message);
}

function loadManifestSandbox() {
  const code = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox;
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

function checkFilesExist() {
  if (!fs.existsSync(MANIFEST_PATH)) fail('missing js/flyer-template-manifest.js');
  if (!fs.existsSync(INDEX_PATH)) fail('missing index.html');
}

function checkIndexWiring(html) {
  if (!html.includes('<script src="js/flyer-template-manifest.js"></script>')) {
    fail('index.html missing flyer manifest script tag');
  }
  if (/var\s+FLYER_TEMPLATES\s*=/.test(html)) {
    fail('index.html still defines inline FLYER_TEMPLATES');
  }
  if (/var\s+FLYER_ZONES\s*=/.test(html)) {
    fail('index.html still defines inline FLYER_ZONES');
  }
  if (/var\s+FLYER_FORCE_REFRESH_TEMPLATES\s*=/.test(html)) {
    fail('index.html still defines inline FLYER_FORCE_REFRESH_TEMPLATES');
  }
}

function checkManifestStructure(sandbox) {
  const templates = sandbox.FLYER_TEMPLATES;
  const zones = sandbox.FLYER_ZONES;
  const names = sandbox.FLYER_NAMES;
  const dims = sandbox.FLYER_DIMS;
  const force = sandbox.FLYER_FORCE_REFRESH_TEMPLATES;
  const manifest = sandbox.window.OOT_FLYER_MANIFEST;

  if (!templates || typeof templates !== 'object') fail('FLYER_TEMPLATES missing');
  if (!zones || typeof zones !== 'object') fail('FLYER_ZONES missing');
  if (!names || typeof names !== 'object') fail('FLYER_NAMES missing');
  if (!dims || typeof dims !== 'object') fail('FLYER_DIMS missing');
  if (!force || typeof force !== 'object') fail('FLYER_FORCE_REFRESH_TEMPLATES missing');
  if (!manifest) fail('window.OOT_FLYER_MANIFEST not set');
  if (manifest.schemaVersion !== 1) fail('OOT_FLYER_MANIFEST.schemaVersion must be 1');

  const keys = Object.keys(templates);
  if (keys.length !== 30) fail('expected 30 template keys, got ' + keys.length);

  const square = keys.filter(function (k) { return !String(k).endsWith('-story'); });
  const story = keys.filter(function (k) { return String(k).endsWith('-story'); });
  if (square.length !== 15) fail('expected 15 square templates, got ' + square.length);
  if (story.length !== 15) fail('expected 15 story templates, got ' + story.length);

  if (dims.square?.w !== 1080 || dims.square?.h !== 1080) fail('FLYER_DIMS.square must be 1080x1080');
  if (dims.story?.w !== 1080 || dims.story?.h !== 1920) fail('FLYER_DIMS.story must be 1080x1920');

  keys.forEach(function (key) {
    if (!names[key]) fail('missing FLYER_NAMES for ' + key);
    if (!zones[key]) fail('missing FLYER_ZONES for ' + key);
    const src = templates[key];
    if (!src || !PNG_RE.test(String(src))) fail('invalid backgroundSrc for ' + key + ': ' + src);
    const isStory = String(key).endsWith('-story');
    if (!isStory && String(key).indexOf('-story') >= 0) fail('square key must not contain -story suffix wrongly: ' + key);

    const rec = buildTemplateRecord(key, sandbox);
    if (!rec) fail('adapter record null for ' + key);
    if (!rec.backgroundSrc) fail('record missing backgroundSrc for ' + key);
    if (!rec.textZones) fail('record missing textZones for ' + key);
    if (rec.format !== (isStory ? 'story' : 'square')) fail('record format mismatch for ' + key);
    if (rec.layers.logo.enabled !== false) fail('logo layer must be disabled for ' + key);
  });

  EXPECTED_FORCE_REFRESH_KEYS.forEach(function (key) {
    if (!force[key]) fail('missing FLYER_FORCE_REFRESH_TEMPLATES[' + key + ']');
    if (!templates[key]) fail('force-refresh key missing from templates: ' + key);
    if (!String(force[key]).trim()) fail('empty force-refresh version for ' + key);
  });

  if (manifest.templates !== templates) fail('OOT_FLYER_MANIFEST.templates mismatch');
  if (manifest.zones !== zones) fail('OOT_FLYER_MANIFEST.zones mismatch');
  if (manifest.names !== names) fail('OOT_FLYER_MANIFEST.names mismatch');
  if (manifest.dims !== dims) fail('OOT_FLYER_MANIFEST.dims mismatch');
  if (manifest.forceRefresh !== force) fail('OOT_FLYER_MANIFEST.forceRefresh mismatch');
}

function main() {
  checkFilesExist();
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  checkIndexWiring(html);
  const sandbox = loadManifestSandbox();
  checkManifestStructure(sandbox);

  if (failures.length) {
    console.error('FAIL: flyer manifest integrity (' + failures.length + ' issues)');
    failures.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('PASS: flyer manifest integrity');
}

main();
