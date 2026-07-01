// Phase 6l-c: Home cue renderer scaffold (metadata-only; no DOM/HTML rendering yet).
// Legacy index.html renderHomeSongVoteCue / renderHomeRehearsalCue still own visible markup.

(function (window) {
  'use strict';

  var PHASE = '6l-c-cue-renderer-scaffold';
  var SCAFFOLD = true;

  var CUE_IDS = {
    songVote: 'home-song-vote-cue',
    rehearsal: 'home-rehearsal-cue'
  };

  var KICKERS = {
    songVote: 'Song Vote Pending',
    rehearsal: 'Rehearsal on Deck'
  };

  var _state = {
    phase: PHASE,
    scaffold: SCAFFOLD,
    routed: false,
    lastSnapshotAt: null,
    snapshotCount: 0
  };

  function _normalizeInput(input) {
    return input && typeof input === 'object' ? input : {};
  }

  function canRenderSongVoteCue(input) {
    var snap = _normalizeInput(input);
    if (snap.hasTarget === false) return false;
    var count = typeof snap.activeCount === 'number' ? snap.activeCount : 0;
    return count > 0;
  }

  function canRenderRehearsalCue(input) {
    var snap = _normalizeInput(input);
    if (snap.hasTarget === false) return false;
    if (snap.visible === false) return false;
    if (typeof snap.activeCount === 'number') return snap.activeCount > 0;
    return snap.visible === true;
  }

  function renderSongVoteCueSnapshot(input) {
    var snap = _normalizeInput(input);
    var activeCount = typeof snap.activeCount === 'number' ? snap.activeCount : 0;
    var visible = canRenderSongVoteCue(snap);
    _state.lastSnapshotAt = Date.now();
    _state.snapshotCount = (_state.snapshotCount || 0) + 1;
    return {
      cueName: 'songVote',
      kicker: KICKERS.songVote,
      targetId: CUE_IDS.songVote,
      visible: visible,
      activeCount: activeCount,
      sourceBranch: snap.sourceBranch || null,
      hasTarget: snap.hasTarget !== false,
      scaffold: true,
      rendersDom: false
    };
  }

  function renderRehearsalCueSnapshot(input) {
    var snap = _normalizeInput(input);
    var activeCount = typeof snap.activeCount === 'number' ? snap.activeCount : (snap.visible === true ? 1 : 0);
    var visible = canRenderRehearsalCue(snap);
    _state.lastSnapshotAt = Date.now();
    _state.snapshotCount = (_state.snapshotCount || 0) + 1;
    return {
      cueName: 'rehearsal',
      kicker: KICKERS.rehearsal,
      targetId: CUE_IDS.rehearsal,
      visible: visible,
      activeCount: activeCount,
      sourceBranch: snap.sourceBranch || null,
      hasTarget: snap.hasTarget !== false,
      scaffold: true,
      rendersDom: false
    };
  }

  function getState() {
    return {
      phase: _state.phase,
      scaffold: _state.scaffold,
      routed: _state.routed,
      lastSnapshotAt: _state.lastSnapshotAt,
      snapshotCount: _state.snapshotCount,
      cueIds: {
        songVote: CUE_IDS.songVote,
        rehearsal: CUE_IDS.rehearsal
      },
      kickers: {
        songVote: KICKERS.songVote,
        rehearsal: KICKERS.rehearsal
      }
    };
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(getState()));
  }

  function describe() {
    return {
      phase: PHASE,
      scaffold: SCAFFOLD,
      routed: false,
      owner: 'legacy-index-html',
      methods: [
        'getState',
        'snapshot',
        'describe',
        'canRenderSongVoteCue',
        'canRenderRehearsalCue',
        'renderSongVoteCueSnapshot',
        'renderRehearsalCueSnapshot'
      ],
      cueIds: CUE_IDS,
      kickers: KICKERS
    };
  }

  var api = {
    PHASE: PHASE,
    getState: getState,
    snapshot: snapshot,
    describe: describe,
    canRenderSongVoteCue: canRenderSongVoteCue,
    canRenderRehearsalCue: canRenderRehearsalCue,
    renderSongVoteCueSnapshot: renderSongVoteCueSnapshot,
    renderRehearsalCueSnapshot: renderRehearsalCueSnapshot,
    CUE_IDS: CUE_IDS,
    KICKERS: KICKERS
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.cueRenderer = api;

  window.getHomeCueRendererState = getState;
  window.describeHomeCueRenderer = describe;
})(window);
