importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);
// // Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyDN1ELk857NECUpg6EGqyBrUzfai7EQHnk",
  authDomain: "yofrezcofb.firebaseapp.com",
  projectId: "yofrezcofb",
  storageBucket: "yofrezcofb.firebasestorage.app",
  messagingSenderId: "563288344403",
  appId: "1:563288344403:web:cd5ee8bd9a4df861fd43a6",
  measurementId: "G-T6FMKTYP1Y",
};

firebase?.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase?.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
