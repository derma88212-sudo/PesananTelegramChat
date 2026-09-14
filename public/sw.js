// Service Worker for Background Notification & PWA Support
// Supports Android, iOS 16.4+, and PC (Windows/Mac/Linux)

const CACHE_NAME = 'tg-account-store-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Pesanan Baru Masuk!', body: 'Ada pesanan baru di toko Telegram Anda.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Pemberitahuan transaksi Telegram Store',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 150, 300, 150, 450],
    tag: data.tag || 'tg-store-notification',
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Pesanan Baru', options)
  );
});

// Handle notification click: focus or open the admin panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle direct message from client to show background notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 150, 300, 150, 450],
      requireInteraction: true,
      ...options
    };

    self.registration.showNotification(title, notificationOptions);
  }
});
