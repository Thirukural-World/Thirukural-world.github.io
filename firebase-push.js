// firebase-push.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
  measurementId: "__FIREBASE_MEASUREMENT_ID__"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

const VAPID_KEY = "__FIREBASE_VAPID_KEY__";

export async function enablePushNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Please allow notifications in your browser settings to receive Daily Kural alerts.");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log("FCM Token:", currentToken);
      return currentToken;
    }
  } catch (error) {
    console.error("Failed to enable push notifications:", error);
  }
}

// Handle notifications when the user already has Thirukural-World open
onMessage(messaging, (payload) => {
  const title = payload.notification?.title || "Daily Thirukkural";
  const body = payload.notification?.body || "";
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon-192x192.png" });
  }
});

window.enablePushNotifications = enablePushNotifications;
