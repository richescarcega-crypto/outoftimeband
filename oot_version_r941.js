// r941: Build Version modal module (externalized from index.html r938/r941 bridge).
// Scope: Build Version only. Depends on globals defined earlier in index.html.

(function (window, document) {
  'use strict';

  function showVersionModal() {
    var ov = document.getElementById('version-modal');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'version-modal';
      ov.className = 'ov';
      ov.innerHTML =
        '<div class="mo" style="max-width:380px;">' +
          '<div class="moh">' +
            '<span class="mot" style="color:#f5c518;">Build Version</span>' +
            '<button style="background:none;border:none;color:#8aa8d6;font-size:18px;cursor:pointer;padding:2px 6px;line-height:1;" onclick="closeVersionModal()">&#10005;</button>' +
          '</div>' +
          '<div id="version-modal-body" style="padding:8px 4px;"></div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    var body = document.getElementById('version-modal-body');
    if (body) {
      var runningVer = (typeof WHATS_NEW_VERSION === 'string') ? WHATS_NEW_VERSION : 'unknown';
      body.innerHTML =
        '<div style="font-size:11px;color:#8aa8d6;letter-spacing:1px;font-family:Russo One,sans-serif;margin-bottom:6px;">RUNNING VERSION</div>' +
        '<div id="version-modal-string" style="background:#060e1c;border:1px solid #1a3a8a;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#06d6a0;text-align:center;letter-spacing:.3px;cursor:pointer;touch-action:manipulation;user-select:all;">' + runningVer + '</div>' +
        '<div style="font-size:11px;color:#8aa8d6;letter-spacing:1px;font-family:Russo One,sans-serif;margin:14px 0 6px;">DEPLOYED VERSION</div>' +
        '<div id="version-modal-deployed" style="background:#060e1c;border:1px solid #1a3a8a;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#8aa8d6;text-align:center;letter-spacing:.3px;">Checking server…</div>' +
        '<div id="version-modal-status" style="font-size:11px;color:#5d7090;text-align:center;margin-top:8px;font-style:italic;line-height:1.35;">Running version is the app shell currently loaded on this device. Deployed version is fetched fresh from the server.</div>' +
        '<button onclick="_copyVersionToClipboard()" style="width:100%;margin-top:14px;background:transparent;border:1px solid #4a9eff;border-radius:8px;padding:10px;color:#4a9eff;font-family:Russo One,sans-serif;font-size:11px;letter-spacing:1.5px;cursor:pointer;touch-action:manipulation;">COPY RUNNING VERSION</button>' +
        '<button onclick="_forceAppUpdate()" style="width:100%;margin-top:8px;background:#f5c518;border:none;border-radius:8px;padding:11px;color:#060e1c;font-family:Russo One,sans-serif;font-size:11px;letter-spacing:1.5px;cursor:pointer;touch-action:manipulation;">UPDATE NOW</button>';
      var verEl = document.getElementById('version-modal-string');
      if (verEl) verEl.onclick = _copyVersionToClipboard;
      if (typeof _fetchDeployedVersion === 'function') {
        _fetchDeployedVersion().then(function (deployedVer) {
          var depEl = document.getElementById('version-modal-deployed');
          var stEl = document.getElementById('version-modal-status');
          if (depEl) {
            depEl.textContent = deployedVer || 'Unable to verify';
            depEl.style.color = deployedVer && deployedVer === runningVer ? '#06d6a0' : '#f5c518';
          }
          if (stEl) {
            if (!deployedVer) {
              stEl.textContent = 'Could not reach the deployed file. Check connection, then try again.';
              stEl.style.color = '#f5c518';
            } else if (deployedVer === runningVer) {
              stEl.textContent = 'This device is running the currently deployed build.';
              stEl.style.color = '#06d6a0';
            } else {
              stEl.textContent = 'A newer version is ready for this device. Tap Update to Latest Version.';
              stEl.style.color = '#ef476f';
            }
          }
        });
      }
    }
    ov.style.display = 'flex';
  }

  function closeVersionModal() {
    var ov = document.getElementById('version-modal');
    if (ov) ov.style.display = 'none';
  }

  function _copyVersionToClipboard() {
    var ver = (typeof WHATS_NEW_VERSION === 'string') ? WHATS_NEW_VERSION : '';
    if (!ver) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ver).then(function () {
        if (typeof toast === 'function') toast('Version copied', { tone: 'success', duration: 2000 });
      }).catch(function () { _copyVersionFallback(ver); });
    } else {
      _copyVersionFallback(ver);
    }
  }

  function _copyVersionFallback(ver) {
    try {
      var ta = document.createElement('textarea');
      ta.value = ver;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (typeof toast === 'function') toast('Version copied', { tone: 'success', duration: 2000 });
    } catch (e) {
      if (typeof toast === 'function') toast('Copy failed — long-press to select instead', { tone: 'error', duration: 3000 });
    }
  }

  window.OOT = window.OOT || {};
  window.OOT.version = window.OOT.version || {};
  window.OOT.version.showVersionModal = showVersionModal;
  window.OOT.version.closeVersionModal = closeVersionModal;
  window.OOT.version.copyVersionToClipboard = _copyVersionToClipboard;
  window.OOT.version.copyVersionFallback = _copyVersionFallback;
  window.showVersionModal = window.showVersionModal || showVersionModal;
  window.closeVersionModal = window.closeVersionModal || closeVersionModal;
  window._copyVersionToClipboard = window._copyVersionToClipboard || _copyVersionToClipboard;
  window._copyVersionFallback = window._copyVersionFallback || _copyVersionFallback;
})(window, document);
