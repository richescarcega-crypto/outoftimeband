// Phase 6d: HomeController — record-only API + narrow Home tab entry delegate to legacy refresh.
// Does not invoke reconcile, layout engine, DOM/CSS/storage, or reimplement rHome steps.

(function (window, document) {
  'use strict';

  var PHASE = '6d-orchestrate-entry';
  var MAX_EVENTS = 100;

  var _state = {
    phase: PHASE,
    scaffold: true,
    lastReason: null,
    lastMethod: null,
    eventCount: 0,
    events: []
  };

  var _skipNextRHomeActivate = false;

  function _diagEnabled() {
    try {
      if (/(?:\?|&)homeLayoutDiag=1(?:&|$)/.test(location.search || '')) return true;
      if (localStorage.getItem('oot_home_layout_diag') === '1') return true;
    } catch (e) {}
    return false;
  }

  function _record(method, reason, options) {
    var entry = {
      method: method,
      reason: reason || '',
      options: options || null,
      t: Date.now()
    };
    _state.lastMethod = method;
    _state.lastReason = entry.reason;
    _state.eventCount += 1;
    _state.events.push(entry);
    if (_state.events.length > MAX_EVENTS) {
      _state.events.shift();
    }
    if (_diagEnabled()) {
      try {
        console.debug('[OOT HomeController]', entry);
      } catch (e) {}
    }
    return entry;
  }

  function _optionsOrReason(options, reason) {
    if (typeof options === 'string') {
      return { reason: options, payload: reason || null };
    }
    return {
      reason: reason || '',
      payload: options || null
    };
  }

  function activate(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record('activate', parsed.reason, parsed.payload);
  }

  function requestReconcile(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record('requestReconcile', parsed.reason, parsed.payload);
  }

  function notifyCueChange(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record('notifyCueChange', parsed.reason, parsed.payload);
  }

  function notifyImageRefresh(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record('notifyImageRefresh', parsed.reason, parsed.payload);
  }

  function notifyGigSlotChange(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record('notifyGigSlotChange', parsed.reason, parsed.payload);
  }

  function consumeSkipRHomeActivate() {
    if (!_skipNextRHomeActivate) return false;
    _skipNextRHomeActivate = false;
    return true;
  }

  function enterHomeTab(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    _record('enterHomeTab', parsed.reason || 'go', parsed.payload);
    _skipNextRHomeActivate = true;
    try {
      var legacyHomeRefresh = window.rHome;
      if (typeof legacyHomeRefresh === 'function') legacyHomeRefresh.call(window);
    } finally {
      if (_skipNextRHomeActivate) _skipNextRHomeActivate = false;
    }
    return _state.events[_state.events.length - 1];
  }

  function getState() {
    return {
      phase: _state.phase,
      scaffold: _state.scaffold,
      lastReason: _state.lastReason,
      lastMethod: _state.lastMethod,
      eventCount: _state.eventCount,
      events: _state.events.slice()
    };
  }

  var api = {
    PHASE: PHASE,
    activate: activate,
    requestReconcile: requestReconcile,
    notifyCueChange: notifyCueChange,
    notifyImageRefresh: notifyImageRefresh,
    notifyGigSlotChange: notifyGigSlotChange,
    enterHomeTab: enterHomeTab,
    consumeSkipRHomeActivate: consumeSkipRHomeActivate,
    getState: getState
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.controller = api;
})(window, document);
