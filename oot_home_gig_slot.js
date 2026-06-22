// Phase 4: Home gig slot footprint + state (r508 pending + data-home-gig-slot-state).
// Mirrors CSS --home-gig-slot-h: 144px. No countdown content / layout CSS changes.

(function (window, document) {
  'use strict';

  var GIG_SLOT_HEIGHT_PX = 144;

  var SLOT_IDS = {
    countdown: 'next-gig-countdown',
    noGigs: 'no-gigs-card'
  };

  var STATES = {
    pending: 'pending',
    countdown: 'countdown',
    noGigs: 'no-gigs',
    none: 'none'
  };

  var SC_HOME_ID = 'sc-home';
  var ATTR = 'data-home-gig-slot-state';

  function _isGigSlotCardDisplayed(el) {
    if (!el) return false;
    try {
      var ds = (el.style && el.style.display) ? String(el.style.display) : '';
      if (!ds) return false;
      var normalized = ds.replace(/\s/g, '').toLowerCase();
      return normalized.indexOf('display:block') !== -1;
    } catch (e) {}
    return false;
  }

  function getGigSlotState() {
    var countdownEl = document.getElementById(SLOT_IDS.countdown);
    var noGigsEl = document.getElementById(SLOT_IDS.noGigs);
    if (_isGigSlotCardDisplayed(countdownEl)) return STATES.countdown;
    if (_isGigSlotCardDisplayed(noGigsEl)) return STATES.noGigs;
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      var attr = scHome ? scHome.getAttribute(ATTR) : null;
      if (attr === STATES.pending) return STATES.pending;
    } catch (e) {}
    return STATES.none;
  }

  function reserveGigSlotPending() {
    var card = document.getElementById(SLOT_IDS.countdown);
    if (!card) return;
    card.style.display = 'none';
    var loadingNoGigs = document.getElementById(SLOT_IDS.noGigs);
    if (loadingNoGigs) {
      loadingNoGigs.style.display = 'none';
      loadingNoGigs.innerHTML = '';
    }
    syncGigSlotState('updateCountdown:pending', STATES.pending);
  }

  function applyGigSlotFootprint() {
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      if (!scHome) return;
      scHome.style.setProperty('--home-gig-slot-h', String(GIG_SLOT_HEIGHT_PX) + 'px');
    } catch (e) {}
  }

  function syncGigSlotState(reason, explicitState) {
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      if (!scHome) return;
      var state = explicitState || getGigSlotState();
      if (state === STATES.none) {
        scHome.removeAttribute(ATTR);
      } else {
        scHome.setAttribute(ATTR, state);
      }
      if (reason) {
        window.__ootHomeGigSlotSyncReason = reason;
      }
    } catch (e) {}
  }

  var api = {
    getState: getGigSlotState,
    syncFromDom: syncGigSlotState,
    reservePending: reserveGigSlotPending,
    applyFootprint: applyGigSlotFootprint,
    GIG_SLOT_HEIGHT_PX: GIG_SLOT_HEIGHT_PX,
    SLOT_IDS: SLOT_IDS,
    STATES: STATES
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.gig = api;

  window.getGigSlotState = getGigSlotState;
  window.syncGigSlotState = syncGigSlotState;
  window.reserveGigSlotPending = reserveGigSlotPending;
  window.applyGigSlotFootprint = applyGigSlotFootprint;

  applyGigSlotFootprint();
})(window, document);
