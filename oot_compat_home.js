// Phase 1/1b + Phase 3: Home module legacy-global compatibility guard.
// Restores window.* from window.OOT.home.* when a legacy global is missing.

(function (window) {
  'use strict';

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};

  var d = window.OOT.home.diag;
  if (d) {
    if (typeof window._homeLayoutDiagSnapshot !== 'function' &&
        typeof d.snapshot === 'function') {
      window._homeLayoutDiagSnapshot = d.snapshot;
    }

    if (!window.OOT_HOME_LAYOUT_DIAG) {
      window.OOT_HOME_LAYOUT_DIAG = {};
    }

    var legacy = window.OOT_HOME_LAYOUT_DIAG;
    var diagPairs = [
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

    diagPairs.forEach(function (pair) {
      var globalName = pair[0];
      var namespacedName = pair[1];
      if (typeof legacy[globalName] !== 'function' &&
          typeof d[namespacedName] === 'function') {
        legacy[globalName] = d[namespacedName];
      }
    });
  }

  var a = window.OOT.home.alerts;
  if (a) {
    if (typeof window.getAlertRailState !== 'function' &&
        typeof a.getState === 'function') {
      window.getAlertRailState = a.getState;
    }
    if (typeof window.syncAlertRailState !== 'function' &&
        typeof a.syncFromDom === 'function') {
      window.syncAlertRailState = a.syncFromDom;
    }
  }
})(window);
