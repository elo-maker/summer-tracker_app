# 🌻 Summer Earnings Tracker — Deployment Guide

## What you'll need
- A Google account (for Firebase)
- A GitHub account (free) — to host the code
- About 15–20 minutes

---

## STEP 1 — Set up Firebase (your database)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it `summer-tracker` → click Continue
4. **Disable** Google Analytics (not needed) → click **Create project**
5. Once created, click the **`</>`** (Web) icon to add a web app
6. Give it the nickname `summer-tracker` → click **Register app**
7. You'll see a block of code with `firebaseConfig`. **Copy these values** — you'll need them in Step 3.
8. Click **Continue to console**

### Enable Firestore (the database):
9. In the left sidebar → **Build → Firestore Database**
10. Click **Create database**
11. Select **"Start in test mode"** → click Next
12. Choose any region (us-east1 is fine) → click **Enable**

---

## STEP 2 — Upload the code to GitHub

1. Go to **https://github.com** and sign in (or create a free account)
2. Click **"New repository"** (the + icon top right)
3. Name it `summer-tracker`, set it to **Public**, click **Create repository**
4. On your computer, open the `summer-tracker` folder I gave you
5. Follow GitHub's instructions to push the folder ("push an existing repository")

   If you're not comfortable with Git, the easiest option is:
   - Install **GitHub Desktop** from https://desktop.github.com
   - Open the app → File → Add Local Repository → select the `summer-tracker` folder
   - Click **Publish repository** → make it Public → Publish

---

## STEP 3 — Add your Firebase config

1. In the `summer-tracker` folder, open **`src/firebase.js`**
2. Replace each `PASTE_YOUR_..._HERE` value with the matching value from Step 1 Step 7
3. Save the file and push/sync to GitHub again

Your firebase.js should look like:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "summer-tracker-abc12.firebaseapp.com",
  projectId: "summer-tracker-abc12",
  storageBucket: "summer-tracker-abc12.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## STEP 4 — Deploy on Vercel (get your link!)

1. Go to **https://vercel.com** and sign in with your GitHub account
2. Click **"Add New Project"**
3. Find and select your `summer-tracker` repository → click **Import**
4. Leave all settings as default → click **Deploy**
5. Wait ~2 minutes for it to build ☕
6. Vercel gives you a link like: **`https://summer-tracker-abc.vercel.app`**

**That's your link!** Bookmark it on every device. 🎉

---

## STEP 5 — Bookmark on all devices

- **iPhone/iPad**: Open the link in Safari → tap the Share icon → "Add to Home Screen"
- **Android**: Open in Chrome → tap menu → "Add to Home Screen"
- **Computer**: Bookmark it or pin the tab

---

## Making changes later

### To edit activities:
Just open the app → Parent Zone → Edit List. Changes go live instantly everywhere. No code needed.

### To change the kids' names or colors:
Open `src/App.js`, find `const KIDS = ["Brooklyn", "Daphne"]` and edit there.
Then push to GitHub — Vercel will auto-redeploy in ~2 minutes.

### To change the parent PIN:
The app has no PIN by default (as requested). If you want to add one later, ask Claude!

---

## Troubleshooting

**App shows a spinner and never loads:**
→ Check that your Firebase config values in `firebase.js` are correct

**"Permission denied" error:**
→ In Firebase console → Firestore → Rules → make sure rules say `allow read, write: if true;`

**Changes not showing on other devices:**
→ Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

---

*Built with ❤️ for Brooklyn & Daphne's best summer yet* ☀️
