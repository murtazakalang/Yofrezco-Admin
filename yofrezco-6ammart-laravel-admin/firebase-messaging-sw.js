importScripts('https://www.gstatic.com/firebasejs/8.3.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.3.2/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyDN1ELk857NECUpg6EGqyBrUzfai7EQHnk",
    authDomain: "yofrezcofb.firebaseapp.com",
    projectId: "yofrezcofb",
    storageBucket: "yofrezcofb.firebasestorage.app",
    messagingSenderId: "563288344403",
    appId: "1:563288344403:web:cd5ee8bd9a4df861fd43a6",
    measurementId: "G-T6FMKTYP1Y"
});

const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function (payload) {
    return self.registration.showNotification(payload.data.title, {
        body: payload.data.body ? payload.data.body : '',
        icon: payload.data.icon ? payload.data.icon : ''
    });
});