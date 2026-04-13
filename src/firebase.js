import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDlWEW_GFB86n8_5fZ3Qfx8J8Jq7xo38zk",
  authDomain: "irrigation-system-8c84f.firebaseapp.com",
  projectId: "irrigation-system-8c84f",
  storageBucket: "irrigation-system-8c84f.firebasestorage.app",
  messagingSenderId: "302212516873",
  appId: "1:302212516873:web:b070b0f23305531f017cd8"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

