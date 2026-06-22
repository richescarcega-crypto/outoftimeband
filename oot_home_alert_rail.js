// Phase 3: Home alert rail state (read-only + data-home-alert-state sync).
// Matches legacy CSS :has(#home-*-cue[style*="display: block"]) semantics.
// No layout/CSS/cue renderer behavior changes.

(function (window, document) {
  'use strict';

  var CUE_IDS = {
    song: 'home-song-vote-cue',
    rehearsal: 'home-rehearsal-cue'
  };

  var STATES = {
    none: 'none',
    song: 'song',
    rehearsal: 'rehearsal',
    both: 'both'
  };

  var SC_HOME_ID = 'sc-home';
  var ATTR = 'data-home-alert-state';

  function _isHomeAlertCueDisplayed(el) {
    if (!el) return false;
    try {
      var ds = (el.style && el.style.display) ? String(el.style.display) : '';
      if (!ds) return false;
      var normalized = ds.replace(/\s/g, '').toLowerCase();
      return normalized.indexOf('display:block') !== -1;
    } catch (e) {}
    return false;
  }

  function getAlertRailState() {
    var songEl = document.getElementById(CUE_IDS.song);
    var rehearsalEl = document.getElementById(CUE_IDS.rehearsal);
    var song = _isHomeAlertCueDisplayed(songEl);
    var rehearsal = _isHomeAlertCueDisplayed(rehearsalEl);
    if (song && rehearsal) return STATES.both;
    if (song) return STATES.song;
    if (rehearsal) return STATES.rehearsal;
    return STATES.none;
  }

  function syncAlertRailState(reason) {
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      if (!scHome) return;
      var state = getAlertRailState();
      if (state === STATES.none) {
        scHome.removeAttribute(ATTR);
      } else {
        scHome.setAttribute(ATTR, state);
      }
      if (reason) {
        window.__ootHomeAlertRailSyncReason = reason;
      }
    } catch (e) {}
  }

  var api = {
    getState: getAlertRailState,
    syncFromDom: syncAlertRailState,
    CUE_IDS: CUE_IDS,
    STATES: STATES
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.alerts = api;

  window.getAlertRailState = getAlertRailState;
  window.syncAlertRailState = syncAlertRailState;
})(window, document);
