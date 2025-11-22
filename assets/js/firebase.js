// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACUO70uoleuXL9kiuPmlWunpQfybkWeWA",
  authDomain: "aiml-portal-pcu.firebaseapp.com",
  projectId: "aiml-portal-pcu",
  storageBucket: "aiml-portal-pcu.firebasestorage.app",
  messagingSenderId: "523280343684",
  appId: "1:523280343684:web:d2a941da9453591f31d8d1",
  measurementId: "G-PP02VHTXSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
