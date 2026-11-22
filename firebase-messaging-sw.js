
importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD3VSLXwIAQSstYcWvZIktL5GAUxWEotEo",
  authDomain: "king-mobile-shop.firebaseapp.com",
  projectId: "king-mobile-shop",
  storageBucket: "king-mobile-shop.firebasestorage.app",
  messagingSenderId: "874763857595",
  appId: "1:874763857595:web:031d71310fce683287439e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "King Mobile Shop";
  const options = {
    body: payload.notification?.body || "आपके लिए नया अपडेट है।",
    icon: "/favicon.ico",
    data: {
      url: payload.fcmOptions?.link || "/"
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(clients.openWindow(target));
});
