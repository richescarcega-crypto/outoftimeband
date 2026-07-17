#!/usr/bin/env node
/**
 * Flyer template pack integrity gate (r968).
 * Validates the replaceable template-pack contract — not a fixed temporary inventory.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MANIFEST_PATH = path.join(ROOT, 'js/flyer-template-manifest.js');
const INDEX_PATH = path.join(ROOT, 'index.html');

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
  if (/var\s+OOT_FLYER_TEMPLATE_RECORDS\s*=/.test(html)) {
    fail('index.html must not author OOT_FLYER_TEMPLATE_RECORDS inline');
  }
  if (/FLYER_DIMS\s*\[\s*_flyerCtx\.format\s*\]/.test(html)) {
    fail('index.html still reads FLYER_DIMS[_flyerCtx.format] directly in renderer');
  }
}

function hasRequiredZoneShape(zones) {
  if (!zones || typeof zones !== 'object') return false;
  const required = ['venue', 'address', 'date'];
  for (let i = 0; i < required.length; i++) {
    const z = zones[required[i]];
    if (!z || typeof z !== 'object') return false;
    if (typeof z.y_frac !== 'number' || typeof z.x_frac !== 'number') return false;
    if (typeof z.size !== 'number' || typeof z.color !== 'string') return false;
  }
  return true;
}

function checkManifestStructure(sandbox) {
  const records = sandbox.OOT_FLYER_TEMPLATE_RECORDS;
  const templates = sandbox.FLYER_TEMPLATES;
  const zones = sandbox.FLYER_ZONES;
  const names = sandbox.FLYER_NAMES;
  const dims = sandbox.FLYER_DIMS;
  const force = sandbox.FLYER_FORCE_REFRESH_TEMPLATES;
  const manifest = sandbox.window.OOT_FLYER_MANIFEST;

  if (!Array.isArray(records) || !records.length) fail('OOT_FLYER_TEMPLATE_RECORDS must be a non-empty array');
  if (!templates || typeof templates !== 'object') fail('FLYER_TEMPLATES shim missing');
  if (!zones || typeof zones !== 'object') fail('FLYER_ZONES shim missing');
  if (!names || typeof names !== 'object') fail('FLYER_NAMES shim missing');
  if (!dims || typeof dims !== 'object') fail('FLYER_DIMS missing');
  if (!force || typeof force !== 'object') fail('FLYER_FORCE_REFRESH_TEMPLATES shim missing');
  if (!manifest) fail('window.OOT_FLYER_MANIFEST not set');
  if (manifest.schemaVersion !== 2) fail('OOT_FLYER_MANIFEST.schemaVersion must be 2');
  if (manifest.records !== records) fail('OOT_FLYER_MANIFEST.records must point at canonical records');
  if (manifest.templates !== templates) fail('OOT_FLYER_MANIFEST.templates mismatch');
  if (manifest.zones !== zones) fail('OOT_FLYER_MANIFEST.zones mismatch');
  if (manifest.names !== names) fail('OOT_FLYER_MANIFEST.names mismatch');
  if (manifest.dims !== dims) fail('OOT_FLYER_MANIFEST.dims mismatch');
  if (manifest.forceRefresh !== force) fail('OOT_FLYER_MANIFEST.forceRefresh mismatch');

  if (dims.square?.w !== 1080 || dims.square?.h !== 1080) fail('FLYER_DIMS.square must be 1080x1080');
  if (dims.story?.w !== 1080 || dims.story?.h !== 1920) fail('FLYER_DIMS.story must be 1080x1920');

  const seen = new Set();
  let activeCount = 0;

  records.forEach(function (rec, idx) {
    if (!rec || typeof rec !== 'object') {
      fail('record at index ' + idx + ' is not an object');
      return;
    }
    const id = rec.id;
    if (!id || typeof id !== 'string') {
      fail('record at index ' + idx + ' missing string id');
      return;
    }
    if (seen.has(id)) fail('duplicate template id: ' + id);
    seen.add(id);

    const active = rec.active !== false;
    if (!active) return;
    activeCount++;

    if (!rec.name || typeof rec.name !== 'string') fail('active record missing name: ' + id);
    if (rec.format !== 'square' && rec.format !== 'story') fail('active record format must be square|story: ' + id);
    if (!(Number(rec.width) > 0) || !(Number(rec.height) > 0)) fail('active record needs positive width/height: ' + id);
    if (!rec.backgroundSrc || typeof rec.backgroundSrc !== 'string' || !String(rec.backgroundSrc).trim()) {
      fail('active record needs non-empty backgroundSrc: ' + id);
    }
    if (!hasRequiredZoneShape(rec.textZones)) fail('active record textZones missing venue/address/date shape: ' + id);
    if (rec.assetVersion == null || !String(rec.assetVersion).trim()) fail('active record missing assetVersion: ' + id);

    const logo = rec.layers && rec.layers.logo;
    if (!logo || typeof logo !== 'object') fail('active record missing layers.logo: ' + id);
    else if (logo.enabled !== false) fail('logo layer must be disabled by default for ' + id);

    if (templates[id] !== rec.backgroundSrc) fail('legacy FLYER_TEMPLATES mismatch for ' + id);
    if (names[id] !== rec.name) fail('legacy FLYER_NAMES mismatch for ' + id);
    if (zones[id] !== rec.textZones) fail('legacy FLYER_ZONES mismatch for ' + id);

    const expectForce = String(rec.assetVersion) !== String(rec.backgroundSrc);
    if (expectForce) {
      if (force[id] !== rec.assetVersion) fail('legacy force-refresh mismatch for ' + id);
    } else if (Object.prototype.hasOwnProperty.call(force, id)) {
      fail('legacy force-refresh should omit non-force id: ' + id);
    }
  });

  if (activeCount < 1) fail('expected at least one active template record');

  Object.keys(templates).forEach(function (id) {
    if (!seen.has(id)) fail('legacy FLYER_TEMPLATES has id missing from records: ' + id);
  });
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
