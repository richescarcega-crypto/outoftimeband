// Phase 1: Home layout diagnostics (read-only, flag-gated off by default).
// Reconstructed from 48f9144 r945 diag. No layout/CSS/registry behavior.

(function (window) {
  'use strict';

  function enabled() {
    try {
      return /(?:\?|&)homeLayoutDiag=1(?:&|$)/.test(location.search || '') ||
        localStorage.getItem('oot_home_layout_diag') === '1';
    } catch (e) {}
    return false;
  }

  function round(n) {
    return Math.round(Number(n) || 0);
  }

  function rect(el) {
    if (!el) return null;
    try {
      var r = el.getBoundingClientRect();
      return {
        top: round(r.top),
        bottom: round(r.bottom),
        height: round(r.height)
      };
    } catch (e) {
      return null;
    }
  }

  function snapshot(tag, meta) {
    if (!enabled()) return;
    try {
      meta = meta || {};
      var songCue = document.getElementById('home-song-vote-cue');
      var rehearsalCue = document.getElementById('home-rehearsal-cue');
      var alertsRow = document.getElementById('home-alerts-row');
      var socialRow = document.getElementById('home-social-row');
      var scHome = document.getElementById('sc-home');
      var bg = socialRow ? socialRow.querySelector('.home-band-backdrop') : null;
      var alertsCs = alertsRow && window.getComputedStyle ? window.getComputedStyle(alertsRow) : null;
      var bgCs = bg && window.getComputedStyle ? window.getComputedStyle(bg) : null;
      var scCs = scHome && window.getComputedStyle ? window.getComputedStyle(scHome) : null;
      var record = {
        tag: tag,
        meta: meta,
        t: Date.now(),
        perf: (typeof performance !== 'undefined' && performance.now) ? Math.round(performance.now()) : null,
        refreshReason: window.__ootHomePresentationRefreshReason || '',
        cues: {
          songVoteDisplay: songCue ? songCue.style.display : null,
          rehearsalDisplay: rehearsalCue ? rehearsalCue.style.display : null
        },
        alertsRow: alertsRow ? {
          display: alertsCs ? alertsCs.display : null,
          gridTemplateColumns: alertsCs ? alertsCs.gridTemplateColumns : null,
          clientHeight: alertsRow.clientHeight,
          rect: rect(alertsRow)
        } : null,
        socialRow: socialRow ? {
          clientHeight: socialRow.clientHeight,
          offsetHeight: socialRow.offsetHeight,
          rect: rect(socialRow),
          dataHomeImageIndex: socialRow.getAttribute('data-home-image-index'),
          dataHomeImageMode: socialRow.getAttribute('data-home-image-mode'),
          cssVars: {
            y: socialRow.style.getPropertyValue('--oot-home-img-y'),
            width: socialRow.style.getPropertyValue('--oot-home-img-width'),
            buttonY: socialRow.style.getPropertyValue('--oot-home-button-y')
          }
        } : null,
        backdrop: bg ? {
          clientWidth: bg.clientWidth,
          clientHeight: bg.clientHeight,
          naturalWidth: bg.naturalWidth || 0,
          naturalHeight: bg.naturalHeight || 0,
          complete: !!bg.complete,
          inlineTransform: bg.style.transform || '',
          computedTransform: bgCs ? bgCs.transform : null,
          computedObjectFit: bgCs ? bgCs.objectFit : null,
          computedObjectPosition: bgCs ? bgCs.objectPosition : null,
          computedWidth: bgCs ? bgCs.width : null,
          computedHeight: bgCs ? bgCs.height : null
        } : null,
        scHome: scHome ? {
          clientHeight: scHome.clientHeight,
          scrollHeight: scHome.scrollHeight,
          computedOverflow: scCs ? scCs.overflow : null
        } : null,
        updateUi: {
          updateBanner: !!document.getElementById('update-banner'),
          stuckUpdateBanner: !!document.getElementById('stuck-update-banner'),
          criticalUpdateOverlay: !!document.getElementById('critical-update-overlay')
        }
      };
      window.__ootHomeLayoutDiagLog = window.__ootHomeLayoutDiagLog || [];
      window.__ootHomeLayoutDiagLog.push(record);
      if (window.__ootHomeLayoutDiagLog.length > 200) window.__ootHomeLayoutDiagLog.shift();
      console.log('[OOT HomeLayoutDiag]', record);
    } catch (e) {
      try { console.warn('[OOT HomeLayoutDiag] snapshot failed', e); } catch (_e) {}
    }
  }

  function enable() {
    try {
      localStorage.setItem('oot_home_layout_diag', '1');
      location.reload();
    } catch (e) {}
  }

  function disable() {
    try {
      localStorage.removeItem('oot_home_layout_diag');
      location.reload();
    } catch (e) {}
  }

  function dump() {
    try {
      var log = window.__ootHomeLayoutDiagLog || [];
      console.log('[OOT HomeLayoutDiag dump]', log);
      return log;
    } catch (e) {
      return [];
    }
  }

  function history() {
    try {
      return (window.__ootHomeLayoutDiagLog || []).slice();
    } catch (e) {
      return [];
    }
  }

  function clear() {
    try {
      window.__ootHomeLayoutDiagLog = [];
      return true;
    } catch (e) {
      return false;
    }
  }

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.diag = {
    enabled: enabled,
    snapshot: snapshot,
    enable: enable,
    disable: disable,
    dump: dump,
    history: history,
    clear: clear
  };

  window._homeLayoutDiagSnapshot = snapshot;
  window.OOT_HOME_LAYOUT_DIAG = {
    enable: enable,
    disable: disable,
    dump: dump,
    history: history,
    clear: clear
  };
})(window);
