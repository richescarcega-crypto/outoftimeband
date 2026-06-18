// r941: Build Version legacy-global compatibility guard.
// Restores window.* from window.OOT.version when a legacy global is missing.

(function (window) {
  'use strict';

  window.OOT = window.OOT || {};
  window.OOT.version = window.OOT.version || {};
  var v = window.OOT.version;

  function restoreLegacy(globalName, namespacedName) {
    if (typeof window[globalName] !== 'function' &&
        typeof v[namespacedName] === 'function') {
      window[globalName] = v[namespacedName];
    }
  }

  restoreLegacy('showVersionModal', 'showVersionModal');
  restoreLegacy('closeVersionModal', 'closeVersionModal');
  restoreLegacy('_copyVersionToClipboard', 'copyVersionToClipboard');
  restoreLegacy('_copyVersionFallback', 'copyVersionFallback');
})(window);
