// Phase 5a–5c: Home layout engine (pilot gate, mode stamp, pilot budget math + token writes).
// Legacy-overlay: mode stamp + clear pilot tokens only. modular-inflow: vertical budget owner.

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

  var HERO_SPARSE_PX = 318;
  var HERO_DENSE_PX = 324;
  var ALERT_RAIL_SINGLE_PX = 58;
  var ALERT_RAIL_DUAL_PX = 64;
  var GIG_SLOT_FALLBACK_PX = 144;
  var GIG_MARGIN_TOP_PX = 2;
  var BAND_MIN_FLOOR_PX = 96;
  var BAND_MIN_CEIL_PX = 140;
  var BAND_MIN_VH_RATIO = 0.22;
  var BAND_ABSOLUTE_FLOOR = 20;
  var HERO_COMPRESS_FLOOR = 300;

  var BUDGET_TOKEN_NAMES = [
    '--home-slot-hero-h',
    '--home-slot-hero-h-dense',
    '--home-slot-birthday-h',
    '--home-slot-alert-rail-h-single',
    '--home-slot-alert-rail-h-dual',
    '--home-slot-alert-rail-h',
    '--home-slot-gig-h',
    '--home-band-viewport-min-h'
  ];

  var _deferredTimer = null;
  var _resizeObserver = null;
  var _resizeDebounceTimer = null;
  var RESIZE_DEBOUNCE_MS = 100;

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

  function _isHomeActive() {
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      return !!(scHome && scHome.classList && scHome.classList.contains('on'));
    } catch (e) {}
    return false;
  }

  function _clampBandMin(viewportH) {
    if (!viewportH || viewportH <= 0) return BAND_MIN_FLOOR_PX;
    var vhTerm = viewportH * BAND_MIN_VH_RATIO;
    return Math.max(BAND_MIN_FLOOR_PX, Math.min(BAND_MIN_CEIL_PX, vhTerm));
  }

  function _readInputs() {
    var scHome = document.getElementById(SC_HOME_ID);
    var scHomeH = scHome ? scHome.clientHeight : 0;
    var alertState = 'none';
    var gigState = 'none';
    var gigSlotPx = GIG_SLOT_FALLBACK_PX;
    var birthdayVisible = false;
    var birthdayH = 0;
    var viewportH = 0;

    try {
      if (typeof getAlertRailState === 'function') {
        alertState = getAlertRailState();
      } else if (window.OOT && window.OOT.home && window.OOT.home.alerts &&
          typeof window.OOT.home.alerts.getState === 'function') {
        alertState = window.OOT.home.alerts.getState();
      }
    } catch (e) {}

    try {
      if (typeof getGigSlotState === 'function') {
        gigState = getGigSlotState();
      } else if (window.OOT && window.OOT.home && window.OOT.home.gig &&
          typeof window.OOT.home.gig.getState === 'function') {
        gigState = window.OOT.home.gig.getState();
      }
    } catch (e) {}

    try {
      if (window.OOT && window.OOT.home && window.OOT.home.gig &&
          window.OOT.home.gig.GIG_SLOT_HEIGHT_PX) {
        gigSlotPx = window.OOT.home.gig.GIG_SLOT_HEIGHT_PX;
      }
    } catch (e) {}

    try {
      var bb = document.getElementById('birthday-banner');
      if (bb && bb.style.display !== 'none' && bb.offsetHeight > 0) {
        birthdayVisible = true;
        birthdayH = bb.offsetHeight;
      }
    } catch (e) {}

    try {
      viewportH = window.innerHeight || 0;
    } catch (e) {}

    return {
      scHomeH: scHomeH,
      alertState: alertState,
      gigState: gigState,
      gigSlotPx: gigSlotPx,
      birthdayVisible: birthdayVisible,
      birthdayH: birthdayH,
      viewportH: viewportH
    };
  }

  function computeBudget(inputs) {
    inputs = inputs || {};
    var scHomeH = inputs.scHomeH || 0;
    var alertState = inputs.alertState || 'none';
    var gigState = inputs.gigState || 'none';
    var gigSlotPx = (inputs.gigSlotPx != null) ? inputs.gigSlotPx : GIG_SLOT_FALLBACK_PX;
    var birthdayH = inputs.birthdayVisible ? (inputs.birthdayH || 0) : 0;
    var viewportH = inputs.viewportH || 0;

    var alertRailH = 0;
    if (alertState === 'both') {
      alertRailH = ALERT_RAIL_DUAL_PX;
    } else if (alertState === 'song' || alertState === 'rehearsal') {
      alertRailH = ALERT_RAIL_SINGLE_PX;
    }

    var gigH = 0;
    if (gigState === 'pending' || gigState === 'countdown' || gigState === 'no-gigs') {
      gigH = gigSlotPx;
    }

    var heroH = alertState === 'none' ? HERO_SPARSE_PX : HERO_DENSE_PX;
    var pass = 1;
    var shellOverheadPx = GIG_MARGIN_TOP_PX;
    var bandMinPx = _clampBandMin(viewportH);

    function fixedStack(h) {
      return h + birthdayH + alertRailH + gigH + shellOverheadPx;
    }

    function remainder(h) {
      return scHomeH - fixedStack(h);
    }

    var bandRemainderPx = remainder(heroH);
    var budgetExhausted = false;
    var bandViewportMinH = bandMinPx;

    if (bandRemainderPx < bandMinPx && heroH === HERO_DENSE_PX) {
      heroH = HERO_SPARSE_PX;
      pass = 2;
      bandRemainderPx = remainder(heroH);
    }

    if (bandRemainderPx < bandMinPx && heroH > HERO_COMPRESS_FLOOR) {
      heroH = HERO_COMPRESS_FLOOR;
      pass = 3;
      bandRemainderPx = remainder(heroH);
    }

    if (bandRemainderPx < bandMinPx) {
      budgetExhausted = true;
      bandViewportMinH = Math.max(BAND_ABSOLUTE_FLOOR, bandRemainderPx);
    }

    var tokens = {
      '--home-slot-hero-h': heroH + 'px',
      '--home-slot-hero-h-dense': heroH + 'px',
      '--home-slot-birthday-h': birthdayH + 'px',
      '--home-slot-alert-rail-h-single': ALERT_RAIL_SINGLE_PX + 'px',
      '--home-slot-alert-rail-h-dual': ALERT_RAIL_DUAL_PX + 'px',
      '--home-slot-alert-rail-h': alertRailH + 'px',
      '--home-slot-gig-h': gigH + 'px',
      '--home-band-viewport-min-h': bandViewportMinH + 'px'
    };

    return {
      inputs: {
        scHomeH: scHomeH,
        alertState: alertState,
        gigState: gigState,
        birthdayVisible: !!inputs.birthdayVisible,
        birthdayH: birthdayH,
        viewportH: viewportH,
        gigSlotPx: gigSlotPx
      },
      constants: {
        HERO_SPARSE_PX: HERO_SPARSE_PX,
        HERO_DENSE_PX: HERO_DENSE_PX,
        ALERT_RAIL_SINGLE_PX: ALERT_RAIL_SINGLE_PX,
        ALERT_RAIL_DUAL_PX: ALERT_RAIL_DUAL_PX,
        GIG_SLOT_FALLBACK_PX: GIG_SLOT_FALLBACK_PX,
        GIG_MARGIN_TOP_PX: GIG_MARGIN_TOP_PX,
        BAND_MIN_FLOOR_PX: BAND_MIN_FLOOR_PX,
        BAND_MIN_CEIL_PX: BAND_MIN_CEIL_PX,
        BAND_MIN_VH_RATIO: BAND_MIN_VH_RATIO,
        BAND_ABSOLUTE_FLOOR: BAND_ABSOLUTE_FLOOR,
        HERO_COMPRESS_FLOOR: HERO_COMPRESS_FLOOR
      },
      computed: {
        heroH: heroH,
        alertRailH: alertRailH,
        gigH: gigH,
        shellOverheadPx: shellOverheadPx,
        fixedStackPx: fixedStack(heroH),
        bandRemainderPx: remainder(heroH),
        bandMinPx: bandMinPx,
        bandViewportMinH: bandViewportMinH,
        budgetExhausted: budgetExhausted,
        pass: pass
      },
      tokens: tokens
    };
  }

  function _clearBudgetTokens(scHome) {
    if (!scHome) return;
    try {
      for (var i = 0; i < BUDGET_TOKEN_NAMES.length; i++) {
        scHome.style.removeProperty(BUDGET_TOKEN_NAMES[i]);
      }
    } catch (e) {}
  }

  function _applyBudgetTokens(scHome, budget) {
    if (!scHome || !budget || !budget.tokens) return;
    try {
      var tokens = budget.tokens;
      var keys = Object.keys(tokens);
      for (var i = 0; i < keys.length; i++) {
        scHome.style.setProperty(keys[i], tokens[keys[i]]);
      }
    } catch (e) {}
  }

  function _publishBudgetSnapshot(mode, reason, budget) {
    try {
      window.__ootHomeLayoutBudget = {
        mode: mode,
        reason: reason || '',
        t: Date.now(),
        inputs: budget ? budget.inputs : null,
        constants: budget ? budget.constants : null,
        computed: budget ? budget.computed : null,
        tokens: budget ? budget.tokens : null
      };
    } catch (e) {}
  }

  function _shouldDeferBudget(inputs) {
    if (!inputs) return true;
    if (!_isHomeActive()) return true;
    if (!inputs.scHomeH || inputs.scHomeH <= 0) return true;
    return false;
  }

  function _scheduleDeferredReconcile(reason) {
    try {
      if (_deferredTimer) {
        clearTimeout(_deferredTimer);
      }
      _deferredTimer = setTimeout(function () {
        _deferredTimer = null;
        if (!isPilotEnabled()) return;
        if (!_isHomeActive()) return;
        var scHome = document.getElementById(SC_HOME_ID);
        var inputs = _readInputs();
        if (!inputs.scHomeH || inputs.scHomeH <= 0) {
          try {
            if (window.requestAnimationFrame) {
              window.requestAnimationFrame(function () {
                applyShell((reason || 'deferred') + ':raf');
              });
            }
          } catch (e) {}
          return;
        }
        if (scHome) {
          var budget = computeBudget(inputs);
          _applyBudgetTokens(scHome, budget);
          _publishBudgetSnapshot(MODES.inflow, (reason || 'deferred') + ':flush', budget);
        }
      }, 0);
    } catch (e) {}
  }

  function _applyPilotBudget(reason) {
    var scHome = document.getElementById(SC_HOME_ID);
    var inputs = _readInputs();

    if (_shouldDeferBudget(inputs)) {
      _publishBudgetSnapshot(MODES.inflow, reason, null);
      _scheduleDeferredReconcile(reason);
      return;
    }

    var budget = computeBudget(inputs);
    _applyBudgetTokens(scHome, budget);
    _publishBudgetSnapshot(MODES.inflow, reason, budget);

    try {
      if (localStorage.getItem('oot_home_layout_diag') === '1') {
        console.debug('[OOT HomeLayout]', window.__ootHomeLayoutBudget);
      }
    } catch (e) {}
  }

  function _applyLegacyShell(reason) {
    var scHome = document.getElementById(SC_HOME_ID);
    _clearBudgetTokens(scHome);
    _publishBudgetSnapshot(MODES.legacy, reason, null);
  }

  function applyShell(reason) {
    var pilot = isPilotEnabled();
    var mode = pilot ? MODES.inflow : MODES.legacy;
    _stampMode(mode);
    try {
      if (reason) {
        window.__ootHomeLayoutApplyReason = reason;
      }
      window.__ootHomeLayoutPilotEnabled = pilot;
      window.__ootHomeLayoutMode = getMode();
    } catch (e) {}

    if (mode === MODES.legacy) {
      _applyLegacyShell(reason);
      return;
    }

    _applyPilotBudget(reason);
  }

  function reconcile(reason) {
    applyShell(reason);
  }

  function _onResizeDebounced() {
    try {
      if (_resizeDebounceTimer) clearTimeout(_resizeDebounceTimer);
      _resizeDebounceTimer = setTimeout(function () {
        _resizeDebounceTimer = null;
        if (isPilotEnabled() && _isHomeActive()) {
          applyShell('resize');
        }
      }, RESIZE_DEBOUNCE_MS);
    } catch (e) {}
  }

  function _initPilotResizeObserver() {
    if (_resizeObserver || !window.ResizeObserver) return;
    try {
      var scHome = document.getElementById(SC_HOME_ID);
      if (!scHome) return;
      _resizeObserver = new window.ResizeObserver(function () {
        if (isPilotEnabled()) {
          _onResizeDebounced();
        }
      });
      _resizeObserver.observe(scHome);
    } catch (e) {}
  }

  var api = {
    MODES: MODES,
    PILOT_QUERY: PILOT_QUERY,
    PILOT_STORAGE_KEY: PILOT_STORAGE_KEY,
    isPilotEnabled: isPilotEnabled,
    getMode: getMode,
    applyShell: applyShell,
    reconcile: reconcile,
    computeBudget: computeBudget,
    readInputs: _readInputs,
    BUDGET_TOKEN_NAMES: BUDGET_TOKEN_NAMES.slice()
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.layout = api;

  window.isHomeLayoutPilotEnabled = isPilotEnabled;
  window.getHomeLayoutMode = getMode;
  window.applyHomeLayoutShell = applyShell;
  window.reconcileHomeLayout = reconcile;

  _initPilotResizeObserver();
  applyShell('module-init');
})(window, document);
