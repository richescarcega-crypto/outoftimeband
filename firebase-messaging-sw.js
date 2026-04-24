importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCMg2p0ey80TUgsqtMc0owsxpzGoOlTyQ8",
  authDomain: "outoftimeband-27c19.firebaseapp.com",
  projectId: "outoftimeband-27c19",
  storageBucket: "outoftimeband-27c19.firebasestorage.app",
  messagingSenderId: "310888502812",
  appId: "1:310888502812:web:2f4334d535d3ef1ae3f1d9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = (payload.notification && payload.notification.title) || 'Out of Time';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: 'icon.png',
    badge: 'icon.png',
    tag: 'oot-notification',
    data: {
      url: (payload.fcmOptions && payload.fcmOptions.link) || '/'
    }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url) !== -1 && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
