import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDN1ELk857NECUpg6EGqyBrUzfai7EQHnk",
  authDomain: "yofrezcofb.firebaseapp.com",
  projectId: "yofrezcofb",
  storageBucket: "yofrezcofb.firebasestorage.app",
  messagingSenderId: "563288344403",
  appId: "1:563288344403:web:cd5ee8bd9a4df861fd43a6",
  measurementId: "G-T6FMKTYP1Y"
};

const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(firebaseApp);

// Correctly export a promise that resolves to messaging instance (or null)
export const getMessagingObject = async () => {
  try {
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser) {
      return getMessaging(firebaseApp);
    }
    return null;
  } catch (err) {
    console.error("Messaging not supported:", err);
    return null;
  }
};

// fetchToken function
export const fetchToken = async (setTokenFound, setFcmToken) => {
  try {
    const messaging = await getMessagingObject();
    if (!messaging) return;

    const currentToken = await getToken(messaging, {
      vapidKey: "BPwtGrb8umxvgZ-hyMkivJtVk7oS1naM7U1n9i0uwND3S6lFkqAQDdKvF7v0FLdl5PWY9FQoFk_lMjkeil016kY",
    });

    if (currentToken) {
      setTokenFound(true);
      setFcmToken(currentToken);
    } else {
      setTokenFound(false);
      setFcmToken();
    }
  } catch (err) {
    console.error("Token fetch error:", err);
  }
};

// onMessageListener function
export const onMessageListener = async () =>
  new Promise(async (resolve, reject) => {
    try {
      const messaging = await getMessagingObject();
      if (!messaging) return;

      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (err) {
      reject(err);
    }
  });
