// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
  measurementId: "__FIREBASE_MEASUREMENT_ID__"
});

const messaging = firebase.messaging();

// Handle background push notifications when the app or tab is closed
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Daily Thirukkural";
  const options = {
    body: payload.notification?.body || "Read today's Kural!",
    icon: payload.notification?.icon || "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: {
      url: payload.fcmOptions?.link || payload.data?.url || "/"
    }
  };

  return self.registration.showNotification(title, options);
});

// Focus an open Thirukkural-World tab or open a new one when clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
