// // Configuración Firebase para Expo (Auth + Firestore)

// import { initializeApp, getApps, getApp } from "firebase/app";
// import {
//   initializeAuth,
//   getAuth,
//   getReactNativePersistence,
// } from "firebase/auth";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { getFirestore } from "firebase/firestore";

// // Configuración de tu proyecto
// export const firebaseConfig = {
//   apiKey: "AIzaSyCKPnIba6s0Fdh5T_JNhHODcU7P5RN49vE",
//   authDomain: "app-mobil-7b9bb.firebaseapp.com",
//   projectId: "app-mobil-7b9bb",
//   storageBucket: "app-mobil-7b9bb.firebasestorage.app",
//   messagingSenderId: "136521694635",
//   appId: "1:136521694635:web:f35eadf38240ce5da6e6ee",
// };

// // Evitar re-inicializar con Fast Refresh
// const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// // Auth con persistencia en AsyncStorage
// let auth;
// try {
//   auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
//   });
// } catch (e) {
//   auth = getAuth(app);
// }

// if (auth && typeof auth.useDeviceLanguage === "function") {
//   auth.useDeviceLanguage();
// }

// // 🔹 Firestore
// const db = getFirestore(app);

// export { app, auth, db };

// ===========================================================
// Configuración Firebase para Expo (Auth + Firestore)
// Compatible con Firebase 12+
// ===========================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔥 Configuración de tu proyecto Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyCKPnIba6s0Fdh5T_JNhHODcU7P5RN49vE",
  authDomain: "app-mobil-7b9bb.firebaseapp.com",
  projectId: "app-mobil-7b9bb",
  storageBucket: "app-mobil-7b9bb.firebasestorage.app",
  messagingSenderId: "136521694635",
  appId: "1:136521694635:web:f35eadf38240ce5da6e6ee",
};

// 🚀 Evitar re-inicializar con Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔐 Firebase Auth
// Firebase 12 YA NO requiere initializeAuth + persistencia manual
const auth = getAuth(app);

// Opcional: usar idioma del dispositivo
if (auth && typeof auth.useDeviceLanguage === "function") {
  auth.useDeviceLanguage();
}

// ☁️ Firestore Database
const db = getFirestore(app);

// Exportar lo necesario para toda la app
export { app, auth, db };
