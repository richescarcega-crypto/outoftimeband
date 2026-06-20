// Phase 1/1b: Home layout diagnostics (read-only, flag-gated off by default).
// Reconstructed from 48f9144 r945 diag + phone export UI. No layout/CSS/registry behavior.

(function (window, document) {
  'use strict';

  var EXPORT_BTN_ID = 'oot-home-diag-export-btn';
  var EXPORT_MODAL_ID = 'oot-home-diag-export-modal';
  var EXPORT_TEXTAREA_ID = 'oot-home-diag-export-textarea';

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

  function isHomeTabActive() {
    try {
      var scHome = document.getElementById('sc-home');
      return !!(scHome && scHome.classList && scHome.classList.contains('on'));
    } catch (e) {
      return false;
    }
  }

  function activeTabId() {
    try {
      var on = document.querySelector('.sc.on');
      return on ? (on.id || '').replace(/^sc-/, '') : null;
    } catch (e) {
      return null;
    }
  }

  function collectSnapshotRecord(tag, meta) {
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
    return {
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
  }

  function snapshot(tag, meta) {
    if (!enabled()) return;
    try {
      var record = collectSnapshotRecord(tag, meta);
      window.__ootHomeLayoutDiagLog = window.__ootHomeLayoutDiagLog || [];
      window.__ootHomeLayoutDiagLog.push(record);
      if (window.__ootHomeLayoutDiagLog.length > 200) window.__ootHomeLayoutDiagLog.shift();
      console.log('[OOT HomeLayoutDiag]', record);
      return record;
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

  function buildExportPayload() {
    var log = history();
    return {
      exportedAt: new Date().toISOString(),
      enabled: enabled(),
      activeTab: activeTabId(),
      whatsNewVersion: (typeof window.WHATS_NEW_VERSION === 'string') ? window.WHATS_NEW_VERSION : null,
      snapshotCount: log.length,
      log: log
    };
  }

  function refreshExportTextarea() {
    try {
      var ta = document.getElementById(EXPORT_TEXTAREA_ID);
      if (!ta) return;
      ta.value = JSON.stringify(buildExportPayload(), null, 2);
    } catch (e) {}
  }

  function copyTextFallback(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }

  function copyExport() {
    if (!enabled()) return false;
    snapshot('manual:export', { source: 'copy-button' });
    var payload = buildExportPayload();
    var text = JSON.stringify(payload, null, 2);
    var copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (typeof window.toast === 'function') {
            window.toast('Home diag JSON copied', { tone: 'success', duration: 2000 });
          }
        }).catch(function () {
          copyTextFallback(text);
        });
        copied = true;
      } else {
        copied = copyTextFallback(text);
      }
    } catch (e) {
      copied = copyTextFallback(text);
    }
    refreshExportTextarea();
    return copied;
  }

  function closeExport() {
    try {
      var modal = document.getElementById(EXPORT_MODAL_ID);
      if (modal) modal.style.display = 'none';
    } catch (e) {}
  }

  function openExport() {
    if (!enabled()) return;
    try {
      var modal = document.getElementById(EXPORT_MODAL_ID);
      if (!modal) return;
      refreshExportTextarea();
      modal.style.display = 'flex';
    } catch (e) {}
  }

  function snapshotNow() {
    if (!enabled()) return;
    snapshot('manual:snapshot-now', { source: 'export-modal' });
    refreshExportTextarea();
  }

  function clearLogFromUi() {
    if (!enabled()) return;
    clear();
    refreshExportTextarea();
  }

  function syncExportBtnVisibility() {
    try {
      var btn = document.getElementById(EXPORT_BTN_ID);
      if (!btn) return;
      btn.style.display = (enabled() && isHomeTabActive()) ? 'block' : 'none';
    } catch (e) {}
  }

  function mountExportUi() {
    if (!enabled()) return;
    if (window.__ootHomeDiagExportUiMounted) return;
    window.__ootHomeDiagExportUiMounted = true;

    var btn = document.createElement('button');
    btn.id = EXPORT_BTN_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Home layout diagnostics export (dev only)');
    btn.textContent = 'DIAG';
    btn.style.cssText = [
      'position:fixed',
      'left:8px',
      'bottom:calc(56px + env(safe-area-inset-bottom) + 8px)',
      'z-index:490',
      'display:none',
      'padding:8px 10px',
      'font-family:monospace',
      'font-size:11px',
      'font-weight:700',
      'letter-spacing:0.5px',
      'color:#f5c518',
      'background:rgba(6,14,28,0.92)',
      'border:1px dashed rgba(245,197,24,0.65)',
      'border-radius:8px',
      'box-shadow:0 4px 12px rgba(0,0,0,0.35)',
      'cursor:pointer',
      'touch-action:manipulation',
      'pointer-events:auto'
    ].join(';');
    btn.addEventListener('click', function (ev) {
      try {
        ev.preventDefault();
        ev.stopPropagation();
        openExport();
      } catch (e) {}
    });
    document.body.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = EXPORT_MODAL_ID;
    modal.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:510',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'padding:12px',
      'background:rgba(0,0,0,0.88)',
      'box-sizing:border-box'
    ].join(';');
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) closeExport();
    });

    var card = document.createElement('div');
    card.style.cssText = [
      'width:100%',
      'max-width:520px',
      'max-height:88vh',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'padding:12px',
      'background:#0a1628',
      'border:1px solid rgba(245,197,24,0.45)',
      'border-radius:12px',
      'box-sizing:border-box'
    ].join(';');

    var title = document.createElement('div');
    title.textContent = 'HOME LAYOUT DIAG (DEV ONLY)';
    title.style.cssText = 'font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#f5c518;';

    var hint = document.createElement('div');
    hint.textContent = 'Read-only export. Copy JSON captures a fresh manual snapshot first.';
    hint.style.cssText = 'font-size:10px;color:#8aa8d6;line-height:1.35;';

    var ta = document.createElement('textarea');
    ta.id = EXPORT_TEXTAREA_ID;
    ta.readOnly = true;
    ta.style.cssText = [
      'width:100%',
      'min-height:220px',
      'flex:1 1 auto',
      'resize:vertical',
      'font-family:monospace',
      'font-size:10px',
      'line-height:1.35',
      'color:#06d6a0',
      'background:#060e1c',
      'border:1px solid #1a3a8a',
      'border-radius:8px',
      'padding:8px',
      'box-sizing:border-box'
    ].join(';');

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

    function actionBtn(label, handler) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = [
        'flex:1 1 auto',
        'min-width:88px',
        'padding:10px 8px',
        'font-family:monospace',
        'font-size:10px',
        'font-weight:700',
        'color:#e8f0ff',
        'background:#101e34',
        'border:1px solid #4a9eff',
        'border-radius:8px',
        'cursor:pointer',
        'touch-action:manipulation'
      ].join(';');
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        handler();
      });
      return b;
    }

    actions.appendChild(actionBtn('Snapshot Now', snapshotNow));
    actions.appendChild(actionBtn('Copy JSON', copyExport));
    actions.appendChild(actionBtn('Clear Log', clearLogFromUi));
    actions.appendChild(actionBtn('Close', closeExport));

    card.appendChild(title);
    card.appendChild(hint);
    card.appendChild(ta);
    card.appendChild(actions);
    modal.appendChild(card);
    document.body.appendChild(modal);

    var scHome = document.getElementById('sc-home');
    if (scHome && window.MutationObserver) {
      try {
        var obs = new MutationObserver(function () {
          syncExportBtnVisibility();
        });
        obs.observe(scHome, { attributes: true, attributeFilter: ['class'] });
        window.__ootHomeDiagExportObserver = obs;
      } catch (e) {}
    }

    var tabs = document.getElementById('tabs');
    if (tabs) {
      tabs.addEventListener('click', function (ev) {
        if (!enabled()) return;
        try {
          var tb = ev.target && ev.target.closest ? ev.target.closest('.tb') : null;
          if (tb) {
            snapshot('tab:click', {
              tabId: tb.id || null,
              dataSc: tb.getAttribute('data-sc') || null
            });
          }
        } catch (e) {}
        setTimeout(syncExportBtnVisibility, 0);
      }, true);
    }

    document.addEventListener('visibilitychange', function () {
      syncExportBtnVisibility();
    });

    syncExportBtnVisibility();
  }

  var api = {
    enabled: enabled,
    snapshot: snapshot,
    enable: enable,
    disable: disable,
    dump: dump,
    history: history,
    clear: clear,
    buildExportPayload: buildExportPayload,
    openExport: openExport,
    closeExport: closeExport,
    copyExport: copyExport,
    snapshotNow: snapshotNow,
    mountExportUi: mountExportUi
  };

  window.OOT = window.OOT || {};
  window.OOT.home = window.OOT.home || {};
  window.OOT.home.diag = api;

  window._homeLayoutDiagSnapshot = snapshot;
  window.OOT_HOME_LAYOUT_DIAG = {
    enable: enable,
    disable: disable,
    dump: dump,
    history: history,
    clear: clear,
    openExport: openExport,
    closeExport: closeExport,
    copyExport: copyExport,
    snapshotNow: snapshotNow
  };

  if (enabled()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountExportUi);
    } else {
      mountExportUi();
    }
  }
})(window, document);
