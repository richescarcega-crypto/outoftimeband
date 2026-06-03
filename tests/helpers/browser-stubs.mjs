/**
 * Injected before page scripts run. Stubs Firebase / OneSignal so index.html
 * can boot without live backend access during smoke tests.
 */

export const BROWSER_STUB_SCRIPT = String.raw`
(function () {
  if (window.__OOT_TEST_STUBS__) return;
  window.__OOT_TEST_STUBS__ = true;

  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push = window.OneSignal.push || function () {};

  function emptySnap() {
    return {
      empty: true,
      size: 0,
      docs: [],
      forEach: function () {},
      docChanges: function () { return []; },
    };
  }

  function makeDocRef() {
    return {
      id: 'stub-doc',
      get: function () {
        return Promise.resolve({ exists: false, data: function () { return {}; }, id: 'stub-doc' });
      },
      set: function () { return Promise.resolve(); },
      update: function () { return Promise.resolve(); },
      delete: function () { return Promise.resolve(); },
      onSnapshot: function (cb) {
        if (typeof cb === 'function') {
          try { cb(emptySnap()); } catch (e) {}
        }
        return function () {};
      },
      collection: function () { return makeCollectionRef(); },
    };
  }

  function makeQueryRef() {
    var ref = {
      where: function () { return ref; },
      orderBy: function () { return ref; },
      limit: function () { return ref; },
      limitToLast: function () { return ref; },
      get: function () { return Promise.resolve(emptySnap()); },
      onSnapshot: function (cb) {
        if (typeof cb === 'function') {
          try { cb(emptySnap()); } catch (e) {}
        }
        return function () {};
      },
      doc: function () { return makeDocRef(); },
      add: function () { return Promise.resolve({ id: 'stub-id' }); },
    };
    return ref;
  }

  function makeCollectionRef() {
    return {
      doc: function () { return makeDocRef(); },
      where: function () { return makeQueryRef(); },
      orderBy: function () { return makeQueryRef(); },
      limit: function () { return makeQueryRef(); },
      limitToLast: function () { return makeQueryRef(); },
      get: function () { return Promise.resolve(emptySnap()); },
      onSnapshot: function (cb) {
        if (typeof cb === 'function') {
          try { cb(emptySnap()); } catch (e) {}
        }
        return function () {};
      },
      add: function () { return Promise.resolve({ id: 'stub-id' }); },
    };
  }

  var fieldValue = {
    serverTimestamp: function () { return Date.now(); },
    arrayUnion: function () { return []; },
    arrayRemove: function () { return []; },
    increment: function (n) { return n || 0; },
    delete: function () { return null; },
  };

  var firestoreFn = function () {
    return {
      collection: function () { return makeCollectionRef(); },
      doc: function () { return makeDocRef(); },
      batch: function () {
        return {
          set: function () { return this; },
          update: function () { return this; },
          delete: function () { return this; },
          commit: function () { return Promise.resolve(); },
        };
      },
      runTransaction: function (fn) {
        return Promise.resolve(fn({
          get: function () { return Promise.resolve({ exists: false, data: function () { return {}; } }); },
          set: function () {},
          update: function () {},
          delete: function () {},
        }));
      },
      enablePersistence: function () { return Promise.resolve(); },
    };
  };

  firestoreFn.FieldValue = fieldValue;

  window.firebase = {
    initializeApp: function () { return {}; },
    app: function () { return {}; },
    firestore: firestoreFn,
    messaging: function () {
      return {
        getToken: function () { return Promise.resolve(null); },
        onMessage: function () { return function () {}; },
      };
    },
  };
})();
`;

export const TEST_LOCAL_STORAGE = {
  oot_me: 'Rich Escarcega',
  oot_me_id: '3',
  oot_repick_version: 'v2-rollout-2026-04',
};
