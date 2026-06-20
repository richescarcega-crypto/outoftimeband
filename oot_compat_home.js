// Phase 1: Home diagnostics legacy-global compatibility guard.
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

  if (!window.OOT_HOME_LAYOUT_DIAG && d) {
    window.OOT_HOME_LAYOUT_DIAG = {
      enable: d.enable,
      disable: d.disable,
      dump: d.dump,
      history: d.history,
      clear: d.clear
    };
  }
})(window);
