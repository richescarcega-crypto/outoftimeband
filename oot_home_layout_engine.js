// Phase 5a: Home layout engine scaffold (pilot gate + mode stamp only).
// No budget math, no in-flow CSS, no layout behavior changes in Phase 5a.

(function (window, document) {
  'use strict';

  var MODES = {
    legacy: 'legacy-overlay',
    inflow: 'modular-inflow'
  };

  var PILOT_QUERY = 'homeLayoutPilot';
  var PILOT_STORAGE_KEY = 'oot_home_layout_pilot';

  var SC_HOME_ID = 'sc-home';
  var MODE_ATTR = 'data-home-layout-mode';

  function isPilotEnabled() {
    try {
      if (/(?:\?|&)homeLayoutPilot=1(?:&|$)/.test(location.search || '')) return true;
      if (localStorage.getItem(PILOT_STORAGE_KEY) === '1') return true;
    } catch (e) {}
    return false;
  }

  function getMode() {
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      if (scHome) {
        var attr = scHome.getAttribute(MODE_ATTR);
        if (attr === MODES.inflow || attr === MODES.legacy) return attr;
      }
    } catch (e) {}
    return isPilotEnabled() ? MODES.inflow : MODES.legacy;
  }

  function _stampMode(mode) {
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      if (!scHome || !mode) return;
      scHome.setAttribute(MODE_ATTR, mode);
    } catch (e) {}
  }

  function applyShell(reason) {
    var pilot = isPilotEnabled();
    _stampMode(pilot ? MODES.inflow : MODES.legacy);
    try {
      if (reason) {
        window.__ootHomeLayoutApplyReason = reason;
      }
      window.__ootHomeLayoutPilotEnabled = pilot;
      window.__ootHomeLayoutMode = getMode();
    } catch (e) {}
    // Phase 5a: no budget math or layout CSS variables when pilot is on or off.
  }

  function reconcile(reason) {
    applyShell(reason);
  }

  var api = {
    MODES: MODES,
    PILOT_QUERY: PILOT_QUERY,
    PILOT_STORAGE_KEY: PILOT_STORAGE_KEY,
    isPilotEnabled: isPilotEnabled,
    getMode: getMode,
    applyShell: applyShell,
    reconcile: reconcile
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.layout = api;

  window.isHomeLayoutPilotEnabled = isPilotEnabled;
  window.getHomeLayoutMode = getMode;
  window.applyHomeLayoutShell = applyShell;
  window.reconcileHomeLayout = reconcile;

  applyShell('module-init');
})(window, document);
