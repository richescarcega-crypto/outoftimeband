// Phase 6l-c/6l-d/6l-e/6l-f/6l-h/6l-i/6m-b: Home cue renderer scaffold, view builders, shared DOM apply, alert-row wrappers.

(function (window) {
  'use strict';

  var PHASE = '6m-b-pending-proposal-view-builder';
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
    routed: { songVote: true, rehearsal: true },
    lastSnapshotAt: null,
    snapshotCount: 0
  };

  function _normalizeInput(input) {
    return input && typeof input === 'object' ? input : {};
  }

  function canRenderSongVoteCue(input) {
    var snap = _normalizeInput(input);
    if (snap.hasTarget === false) return false;
    var count = typeof snap.activeCount === 'number'
      ? snap.activeCount
      : (Array.isArray(snap.cueItems) ? snap.cueItems.length : 0);
    return count > 0;
  }

  function canRenderRehearsalCue(input) {
    var snap = _normalizeInput(input);
    if (snap.hasTarget === false) return false;
    if (snap.visible === false) return false;
    if (typeof snap.activeCount === 'number') return snap.activeCount > 0;
    return snap.visible === true;
  }

  function buildSongVoteCueView(input) {
    var snap = _normalizeInput(input);
    var cueItems = Array.isArray(snap.cueItems) ? snap.cueItems.slice() : [];
    var userSpecific = snap.userSpecific !== false;
    var sourceBranch = snap.sourceBranch || 'pendingForMe';
    var hasTarget = snap.hasTarget !== false;
    _state.lastSnapshotAt = Date.now();
    _state.snapshotCount = (_state.snapshotCount || 0) + 1;
    _state.routed.songVote = true;

    if (!cueItems.length) {
      return {
        cueName: 'songVote',
        kicker: KICKERS.songVote,
        targetId: CUE_IDS.songVote,
        visible: false,
        html: '',
        sourceBranch: 'none',
        activeCount: 0,
        hasTarget: hasTarget,
        routed: true,
        rendersDom: false
      };
    }

    var label = userSpecific
      ? (cueItems.length === 1 ? '1 song suggestion needs your vote' : (cueItems.length + ' song suggestions need your vote'))
      : (cueItems.length === 1 ? '1 song vote still in progress' : (cueItems.length + ' song votes still in progress'));
    var first = cueItems[0] || {};
    var detail = first.title
      ? ('\u201c' + first.title + '\u201d' + (cueItems.length > 1 ? ' + more' : ''))
      : 'Review the pending suggestion list.';
    var html =
      '<button class="home-alert-pill home-alert-song" type="button" onclick="try{go(\'songs\',document.getElementById(\'tb-songs\'));}catch(e){};setTimeout(function(){try{openSongVoteModal();}catch(e){}},80);" ' +
      'style="width:100%;text-align:left;background:linear-gradient(135deg,rgba(35,111,255,.98),rgba(24,84,235,.98) 54%,rgba(10,49,166,.98));border:1px solid rgba(245,197,24,.88);border-radius:14px;padding:10px 12px;margin:0 0 10px 0;color:#f7fbff;box-shadow:0 10px 24px rgba(0,0,0,.28),0 0 20px rgba(58,137,255,.26),0 0 10px rgba(245,197,24,.10),inset 0 1px 0 rgba(255,255,255,.20);display:flex;gap:10px;align-items:center;cursor:pointer;overflow:hidden;position:relative;">' +
        '<span class="home-alert-icon" style="width:34px;height:34px;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(210,231,255,.14));border:1px solid rgba(255,255,255,.42);color:#ffffff;display:flex;align-items:center;justify-content:center;font-family:Russo One,sans-serif;font-size:17px;flex-shrink:0;box-shadow:0 0 12px rgba(255,255,255,.10);">♪</span>' +
        '<span class="home-alert-copy" style="flex:1;min-width:0;">' +
          '<span class="home-alert-kicker" style="display:block;font-family:Russo One,sans-serif;color:#ffffff;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;text-shadow:0 1px 6px rgba(10,34,92,.24);">Song Vote Pending</span>' +
          '<span class="home-alert-main" style="display:block;color:#ffffff;font-size:13px;font-weight:700;margin-top:2px;">' + label + '</span>' +
          '<span class="home-alert-sub" style="display:block;color:#d8e8ff;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + detail + '</span>' +
        '</span>' +
      '</button>';

    return {
      cueName: 'songVote',
      kicker: KICKERS.songVote,
      targetId: CUE_IDS.songVote,
      visible: true,
      html: html,
      sourceBranch: sourceBranch,
      activeCount: cueItems.length,
      hasTarget: hasTarget,
      routed: true,
      rendersDom: false
    };
  }

  function renderSongVoteCueSnapshot(input) {
    var view = buildSongVoteCueView(input);
    return {
      cueName: view.cueName,
      kicker: view.kicker,
      targetId: view.targetId,
      visible: view.visible,
      activeCount: view.activeCount,
      sourceBranch: view.sourceBranch,
      hasTarget: view.hasTarget,
      scaffold: true,
      rendersDom: false
    };
  }

  function buildRehearsalCueView(input) {
    var snap = _normalizeInput(input);
    var sourceBranch = snap.sourceBranch || 'hidden-no-rehearsal';
    var hasTarget = snap.hasTarget !== false;
    _state.lastSnapshotAt = Date.now();
    _state.snapshotCount = (_state.snapshotCount || 0) + 1;
    _state.routed.rehearsal = true;

    if (sourceBranch === 'hidden-no-events') {
      return {
        cueName: 'rehearsal',
        kicker: KICKERS.rehearsal,
        targetId: CUE_IDS.rehearsal,
        visible: false,
        html: '',
        sourceBranch: sourceBranch,
        activeCount: 0,
        hasTarget: hasTarget,
        imageRefreshReason: 'rehearsal-cue hidden no events',
        diagTag: 'renderHomeRehearsalCue:hidden-no-events',
        routed: true,
        rendersDom: false
      };
    }

    if (sourceBranch === 'hidden-no-rehearsal') {
      return {
        cueName: 'rehearsal',
        kicker: KICKERS.rehearsal,
        targetId: CUE_IDS.rehearsal,
        visible: false,
        html: '',
        sourceBranch: sourceBranch,
        activeCount: 0,
        hasTarget: hasTarget,
        imageRefreshReason: 'rehearsal-cue hidden no next rehearsal',
        diagTag: 'renderHomeRehearsalCue:hidden-no-rehearsal',
        routed: true,
        rendersDom: false
      };
    }

    var evIdEscaped = snap.evIdEscaped || '';
    var titleEscaped = snap.titleEscaped || 'Band Rehearsal';
    var subEscaped = snap.subEscaped || '';
    var noteEscaped = snap.noteEscaped || '';
    var noteHtml = snap.hasNote
      ? ('<span class="home-alert-note" style="display:block;color:#8aa8d6;font-size:10px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + noteEscaped + '</span>')
      : '';
    var html =
      '<button class="home-alert-pill home-alert-rehearsal" type="button" onclick="_r535OpenHomeRehearsal(\'' + evIdEscaped + '\')" ' +
      'style="width:100%;text-align:left;background:linear-gradient(135deg,rgba(11,31,76,.98),rgba(5,13,32,.98) 58%,rgba(32,14,57,.96));border:1px solid rgba(245,197,24,.55);border-radius:16px;padding:11px 12px;margin:0 0 10px 0;color:#e8f0ff;box-shadow:0 9px 22px rgba(0,0,0,.30),0 0 18px rgba(74,158,255,.14),inset 0 1px 0 rgba(255,255,255,.06);display:flex;gap:10px;align-items:center;cursor:pointer;touch-action:manipulation;overflow:hidden;position:relative;">' +
        '<span class="home-alert-icon" style="width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 32% 24%,#fff7b8 0%,#f5c518 36%,#b77c00 100%);color:#06121f;display:flex;align-items:center;justify-content:center;font-family:Russo One,sans-serif;font-size:17px;flex-shrink:0;box-shadow:0 0 16px rgba(245,197,24,.34);">\uD83C\uDFA4</span>' +
        '<span class="home-alert-copy" style="flex:1;min-width:0;position:relative;z-index:1;">' +
          '<span class="home-alert-kicker" style="display:block;font-family:Russo One,sans-serif;color:#f5c518;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;">Rehearsal on Deck</span>' +
          '<span class="home-alert-main" style="display:block;color:#fff;font-size:14px;font-weight:800;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + titleEscaped + '</span>' +
          '<span class="home-alert-sub" style="display:block;color:#9fc2ff;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + subEscaped + '</span>' +
          noteHtml +
        '</span>' +
      '</button>';

    return {
      cueName: 'rehearsal',
      kicker: KICKERS.rehearsal,
      targetId: CUE_IDS.rehearsal,
      visible: true,
      html: html,
      sourceBranch: sourceBranch,
      activeCount: 1,
      hasTarget: hasTarget,
      imageRefreshReason: 'rehearsal-cue visible',
      diagTag: 'renderHomeRehearsalCue:visible',
      routed: true,
      rendersDom: false
    };
  }

  function renderRehearsalCueSnapshot(input) {
    var view = buildRehearsalCueView(input);
    return {
      cueName: view.cueName,
      kicker: view.kicker,
      targetId: view.targetId,
      visible: view.visible,
      activeCount: view.activeCount,
      sourceBranch: view.sourceBranch,
      hasTarget: view.hasTarget,
      scaffold: true,
      rendersDom: false
    };
  }

  function buildPendingProposalCueView(input) {
    var snap = _normalizeInput(input);
    var pendingIds = Array.isArray(snap.pendingIds) ? snap.pendingIds.slice() : [];
    var hasTarget = snap.hasTarget !== false;
    var count = pendingIds.length;
    var countLabel = count > 9 ? '9+' : String(count);
    var visible = count > 0;
    var sourceBranch = visible ? 'pending-proposal-visible' : 'pending-proposal-hidden';
    var onclickHandler = '_openPendingProposalCue';

    if (!visible) {
      return {
        cueName: 'pendingProposal',
        visible: false,
        count: 0,
        countLabel: '0',
        calendarTabBadge: {
          visible: false,
          countLabel: '',
          className: 'proposal-tab-badge',
          title: ''
        },
        homeMicroCue: {
          visible: false,
          id: 'home-proposal-micro-cue',
          html: '',
          onclickHandler: onclickHandler
        },
        calendarMicroCue: {
          visible: false,
          id: 'cal-proposal-micro-cue',
          html: '',
          kicker: 'ACTION NEEDED',
          onclickHandler: onclickHandler
        },
        hasTarget: hasTarget,
        rendersDom: false,
        sourceBranch: sourceBranch
      };
    }

    var badgeTitle = count + ' rehearsal proposal' + (count === 1 ? '' : 's') + ' waiting';
    var homeHtml =
      '<span class="home-proposal-dot"></span><span>' + count + ' rehearsal response needed</span>';
    var calHtml =
      '<span class="cal-proposal-kicker">ACTION NEEDED</span>' +
      '<span class="cal-proposal-main">' + count + ' rehearsal proposal waiting for your response</span>';

    return {
      cueName: 'pendingProposal',
      visible: true,
      count: count,
      countLabel: countLabel,
      calendarTabBadge: {
        visible: true,
        countLabel: countLabel,
        className: 'proposal-tab-badge',
        title: badgeTitle
      },
      homeMicroCue: {
        visible: true,
        id: 'home-proposal-micro-cue',
        html: homeHtml,
        onclickHandler: onclickHandler
      },
      calendarMicroCue: {
        visible: true,
        id: 'cal-proposal-micro-cue',
        html: calHtml,
        kicker: 'ACTION NEEDED',
        onclickHandler: onclickHandler
      },
      hasTarget: hasTarget,
      rendersDom: false,
      sourceBranch: sourceBranch
    };
  }

  function applyCueView(targetEl, view) {
    try {
      if (!targetEl || !view) {
        return { applied: false, visible: false, htmlLength: 0, rendersDom: false };
      }
      var visible = view.visible === true;
      if (!visible) {
        targetEl.style.display = 'none';
        targetEl.innerHTML = '';
        return {
          applied: true,
          visible: false,
          htmlLength: 0,
          rendersDom: true
        };
      }
      var html = view.html || '';
      targetEl.style.display = 'block';
      targetEl.innerHTML = html;
      return {
        applied: true,
        visible: true,
        htmlLength: html.length,
        rendersDom: true
      };
    } catch (e) {
      return { applied: false, visible: false, htmlLength: 0, rendersDom: false };
    }
  }

  function renderSongVoteCue(targetEl, input) {
    try {
      if (!targetEl) {
        return {
          rendered: false,
          visible: false,
          sourceBranch: 'none',
          applied: false,
          htmlLength: 0,
          rendersDom: false
        };
      }
      var view = buildSongVoteCueView(input);
      var applyResult = applyCueView(targetEl, view);
      return {
        rendered: true,
        visible: view.visible === true,
        sourceBranch: view.sourceBranch || 'none',
        activeCount: typeof view.activeCount === 'number' ? view.activeCount : 0,
        applied: applyResult.applied === true,
        htmlLength: applyResult.htmlLength || 0,
        rendersDom: true
      };
    } catch (e) {
      return {
        rendered: false,
        visible: false,
        sourceBranch: 'none',
        applied: false,
        htmlLength: 0,
        rendersDom: false
      };
    }
  }

  function renderRehearsalCue(targetEl, input) {
    try {
      if (!targetEl) {
        return {
          rendered: false,
          visible: false,
          sourceBranch: 'hidden-no-rehearsal',
          applied: false,
          htmlLength: 0,
          rendersDom: false
        };
      }
      var view = buildRehearsalCueView(input);
      var applyResult = applyCueView(targetEl, view);
      return {
        rendered: true,
        visible: view.visible === true,
        sourceBranch: view.sourceBranch || 'hidden-no-rehearsal',
        activeCount: typeof view.activeCount === 'number' ? view.activeCount : 0,
        imageRefreshReason: view.imageRefreshReason || '',
        diagTag: view.diagTag || '',
        applied: applyResult.applied === true,
        htmlLength: applyResult.htmlLength || 0,
        rendersDom: true
      };
    } catch (e) {
      return {
        rendered: false,
        visible: false,
        sourceBranch: 'hidden-no-rehearsal',
        applied: false,
        htmlLength: 0,
        rendersDom: false
      };
    }
  }

  function getState() {
    return {
      phase: _state.phase,
      scaffold: _state.scaffold,
      routed: {
        songVote: !!(_state.routed && _state.routed.songVote),
        rehearsal: !!(_state.routed && _state.routed.rehearsal)
      },
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
      routed: { songVote: true, rehearsal: true },
      owner: 'legacy-index-html-apply',
      methods: [
        'getState',
        'snapshot',
        'describe',
        'canRenderSongVoteCue',
        'canRenderRehearsalCue',
        'buildSongVoteCueView',
        'buildRehearsalCueView',
        'buildPendingProposalCueView',
        'applyCueView',
        'renderSongVoteCue',
        'renderRehearsalCue',
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
    buildSongVoteCueView: buildSongVoteCueView,
    buildRehearsalCueView: buildRehearsalCueView,
    buildPendingProposalCueView: buildPendingProposalCueView,
    applyCueView: applyCueView,
    renderSongVoteCue: renderSongVoteCue,
    renderRehearsalCue: renderRehearsalCue,
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
