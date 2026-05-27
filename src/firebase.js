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
  apiKey: "AIzaSyA8v1rcuf_uNh4viioK4zz_0Dto6C-P9n8",
  authDomain: "summer-tracker-17073.firebaseapp.com",
  projectId: "summer-tracker-17073",
  storageBucket: "summer-tracker-17073.firebasestorage.app",
  messagingSenderId: "395262175183",
  appId: "1:395262175183:web:c1f338ad63481d6f7594ba"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
