// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlWEW_GFB86n8_5fZ3Qfx8J8Jq7xo38zk",
  authDomain: "irrigation-system-8c84f.firebaseapp.com",
  projectId: "irrigation-system-8c84f",
  storageBucket: "irrigation-system-8c84f.firebasestorage.app",
  messagingSenderId: "302212516873",
  appId: "1:302212516873:web:b070b0f23305531f017cd8",
  measurementId: "G-BZ1BTTCMTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);