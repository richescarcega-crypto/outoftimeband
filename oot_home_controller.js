// Phase 6e-b + 6q-a: HomeController - record-only API + reconcile coalescer with guarded legacy delegate.
// Phase 6q-a adds pending proposal cue notify/reconcile ownership seam.

(function (window, document) {
  'use strict';

  var PHASE = '6e-b-reconcile-delegate';
  var MAX_EVENTS = 100;

  var _state = {
    phase: PHASE,
    scaffold: true,
    lastReason: null,
    lastMethod: null,
    eventCount: 0,
    events: []
  };

  var _reconcileCoalescer = {
    scaffold: true,
    executionEnabled: true,
    pending: false,
    pendingId: 0,
    pendingReason: null,
    duplicateCount: 0,
    coalescedRequestCount: 0,
    flushScheduled: false,
    lastFlushAt: null,
    lastCoalescedReason: null,
    lastDelegatedReason: null,
    lastDelegatedAt: null,
    skippedRHomeExecution: 0
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

  function _clearReconcileCoalescerPending() {
    _reconcileCoalescer.pending = false;
    _reconcileCoalescer.pendingReason = null;
    _reconcileCoalescer.duplicateCount = 0;
    _reconcileCoalescer.coalescedRequestCount = 0;
  }

  function _resolveLegacyReconcileDelegate() {
    if (typeof window.reconcileHomeLayout === 'function') {
      return window.reconcileHomeLayout;
    }
    try {
      var layout = window.OOT && window.OOT.home && window.OOT.home.layout;
      if (layout && typeof layout.reconcile === 'function') return layout.reconcile;
    } catch (e) {}
    return null;
  }

  function _scheduleReconcileCoalescerFlush() {
    if (_reconcileCoalescer.flushScheduled) return;
    _reconcileCoalescer.flushScheduled = true;
    var schedule = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : function (fn) { setTimeout(fn, 0); };
    schedule(function () {
      _flushReconcileCoalescer();
    });
  }

  function _flushReconcileCoalescer() {
    _reconcileCoalescer.flushScheduled = false;
    if (!_reconcileCoalescer.pending) return;

    var flushReason = _reconcileCoalescer.pendingReason || '';
    var flushMeta = {
      pendingId: _reconcileCoalescer.pendingId,
      duplicateCount: _reconcileCoalescer.duplicateCount,
      coalescedRequestCount: _reconcileCoalescer.coalescedRequestCount
    };

    _reconcileCoalescer.lastFlushAt = Date.now();
    _reconcileCoalescer.lastCoalescedReason = flushReason;
    _record('reconcileCoalesceFlush', flushReason, flushMeta);

    if (flushReason === 'rHome') {
      _reconcileCoalescer.skippedRHomeExecution += 1;
      _clearReconcileCoalescerPending();
      return;
    }

    if (_reconcileCoalescer.executionEnabled) {
      var delegate = _resolveLegacyReconcileDelegate();
      if (delegate) {
        try {
          delegate.call(window, flushReason);
        } catch (e) {}
        _reconcileCoalescer.lastDelegatedAt = Date.now();
        _reconcileCoalescer.lastDelegatedReason = flushReason;
        _record('reconcileCoalesceExecute', flushReason, {
          pendingId: flushMeta.pendingId,
          duplicateCount: flushMeta.duplicateCount,
          coalescedRequestCount: flushMeta.coalescedRequestCount,
          delegated: true
        });
      }
    }

    _clearReconcileCoalescerPending();
  }

  function _enqueueReconcileCoalesce(reason) {
    var nextReason = reason || '';
    if (_reconcileCoalescer.pending) {
      _reconcileCoalescer.duplicateCount += 1;
    } else {
      _reconcileCoalescer.pending = true;
      _reconcileCoalescer.pendingId += 1;
      _reconcileCoalescer.pendingReason = nextReason;
      _reconcileCoalescer.duplicateCount = 0;
    }
    _reconcileCoalescer.coalescedRequestCount += 1;
    _scheduleReconcileCoalescerFlush();
  }

  function requestReconcile(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    var entry = _record('requestReconcile', parsed.reason, parsed.payload);
    _enqueueReconcileCoalesce(parsed.reason);
    return entry;
  }

  function notifyCueChange(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record('notifyCueChange', parsed.reason, parsed.payload);
  }

  function notifyPendingProposalCueChange(reason, options) {
    var parsed = _optionsOrReason(options, reason);
    return _record(
      'notifyPendingProposalCueChange',
      parsed.reason || 'renderPendingProposalCue',
      parsed.payload
    );
  }

  function requestPendingProposalCueReconcile(options) {
    var parsed = _optionsOrReason(options, 'cue:pending-proposal');
    var payload = parsed.payload || null;
    notifyPendingProposalCueChange('renderPendingProposalCue', payload);
    return requestReconcile('cue:pending-proposal', payload);
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

  function requestRHomeTailReconcile(options) {
    var parsed = _optionsOrReason(options, 'rHome');
    var payload = parsed.payload || null;
    var result = {
      reason: 'rHome',
      source: payload && payload.source ? payload.source : null,
      requested: false,
      reconciled: false,
      passthrough: true,
      routed: true
    };
    _record('requestRHomeTailReconcile', parsed.reason, payload);
    try {
      requestReconcile('rHome', payload);
      result.requested = true;
    } catch (e) {}
    try {
      var delegate = _resolveLegacyReconcileDelegate();
      if (delegate) {
        delegate.call(window, 'rHome');
        result.reconciled = true;
      }
    } catch (e) {}
    return result;
  }

  function getReconcileCoalescerState() {
    return {
      scaffold: _reconcileCoalescer.scaffold,
      executionEnabled: _reconcileCoalescer.executionEnabled,
      pending: _reconcileCoalescer.pending,
      pendingId: _reconcileCoalescer.pendingId,
      pendingReason: _reconcileCoalescer.pendingReason,
      duplicateCount: _reconcileCoalescer.duplicateCount,
      coalescedRequestCount: _reconcileCoalescer.coalescedRequestCount,
      flushScheduled: _reconcileCoalescer.flushScheduled,
      lastFlushAt: _reconcileCoalescer.lastFlushAt,
      lastCoalescedReason: _reconcileCoalescer.lastCoalescedReason,
      lastDelegatedReason: _reconcileCoalescer.lastDelegatedReason,
      lastDelegatedAt: _reconcileCoalescer.lastDelegatedAt,
      skippedRHomeExecution: _reconcileCoalescer.skippedRHomeExecution
    };
  }

  function getState() {
    return {
      phase: _state.phase,
      scaffold: _state.scaffold,
      lastReason: _state.lastReason,
      lastMethod: _state.lastMethod,
      eventCount: _state.eventCount,
      events: _state.events.slice(),
      reconcileCoalescer: getReconcileCoalescerState()
    };
  }

  var api = {
    PHASE: PHASE,
    activate: activate,
    requestReconcile: requestReconcile,
    notifyCueChange: notifyCueChange,
    notifyPendingProposalCueChange: notifyPendingProposalCueChange,
    requestPendingProposalCueReconcile: requestPendingProposalCueReconcile,
    notifyImageRefresh: notifyImageRefresh,
    notifyGigSlotChange: notifyGigSlotChange,
    enterHomeTab: enterHomeTab,
    consumeSkipRHomeActivate: consumeSkipRHomeActivate,
    requestRHomeTailReconcile: requestRHomeTailReconcile,
    getReconcileCoalescerState: getReconcileCoalescerState,
    getState: getState
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.controller = api;
})(window, document);
