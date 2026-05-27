// src/firebase.js
// ─────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" → name it "summer-tracker" → Continue
// 3. Disable Google Analytics (not needed) → Create project
// 4. Click the </> (Web) icon to add a web app
// 5. Register app with nickname "summer-tracker"
// 6. Copy the firebaseConfig values below from your console
// 7. Back in Firebase console → Build → Firestore Database
// 8. Click "Create database" → Start in TEST mode → Enable
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
