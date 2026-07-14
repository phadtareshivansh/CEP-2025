// Firebase Configuration - Shared across all pages
// Replace with your actual Firebase project configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7hJbX6jKPUbPufJGsvsLThMkrNwAx1Jo",
  authDomain: "aiml-web-portal.firebaseapp.com",
  projectId: "aiml-web-portal",
  storageBucket: "aiml-web-portal.firebasestorage.app",
  messagingSenderId: "936704271507",
  appId: "1:936704271507:web:b48937323d2619230f5966",
  measurementId: "G-LRMGHJNQRM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase (compat SDK for broader compatibility)
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  // Enable Firestore offline persistence
  firebase.firestore().enablePersistence({ synchronizeTabs: true })
    .catch(err => console.warn('Firestore persistence unavailable:', err.code));
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}