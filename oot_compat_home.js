// Phase 1/1b: Home diagnostics legacy-global compatibility guard.
// Restores window.* from window.OOT.home.diag when a legacy global is missing.

(function (window) {
  'use strict';

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  var d = window.OOT.home.diag;
  if (!d) return;

  if (typeof window._homeLayoutDiagSnapshot !== 'function' &&
      typeof d.snapshot === 'function') {
    window._homeLayoutDiagSnapshot = d.snapshot;
  }

  if (!window.OOT_HOME_LAYOUT_DIAG) {
    window.OOT_HOME_LAYOUT_DIAG = {};
  }

  var legacy = window.OOT_HOME_LAYOUT_DIAG;
  var pairs = [
    ['enable', 'enable'],
    ['disable', 'disable'],
    ['dump', 'dump'],
    ['history', 'history'],
    ['clear', 'clear'],
    ['openExport', 'openExport'],
    ['closeExport', 'closeExport'],
    ['copyExport', 'copyExport'],
    ['snapshotNow', 'snapshotNow']
  ];

  pairs.forEach(function (pair) {
    var globalName = pair[0];
    var namespacedName = pair[1];
    if (typeof legacy[globalName] !== 'function' &&
        typeof d[namespacedName] === 'function') {
      legacy[globalName] = d[namespacedName];
    }
  });
})(window);
