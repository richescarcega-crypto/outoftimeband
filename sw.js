// Out of Time — Service Worker (push notifications)

self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event){
  var payload = {};
  if(event.data){
    try { payload = event.data.json(); }
    catch(e){ payload = { title: 'Out of Time', body: event.data.text() }; }
  }
  var title = payload.title || 'Out of Time';
  var options = {
    body: payload.body || '',
    icon: 'icon.png',
    badge: 'icon.png',
    data: { url: payload.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(wins){
      for(var i=0;i<wins.length;i++){
        var w = wins[i];
        // Focus any open window for this app
        if('focus' in w){
          if(w.url && w.url.indexOf(self.registration.scope) === 0){
            if('navigate' in w && targetUrl && targetUrl !== '/') {
              try { w.navigate(targetUrl); } catch(e){}
            }
            return w.focus();
          }
        }
      }
      if(clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
