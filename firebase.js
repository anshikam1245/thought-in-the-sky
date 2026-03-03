/* ═══════════════════════════════════════════════════════
   firebase.js
   Firebase configuration and Firestore helpers.

   ★ HOW TO SET UP:
   1. Go to https://console.firebase.google.com
   2. Create a new project (or use an existing one)
   3. Click "Add App" → choose Web (</>)
   4. Register the app, then copy the firebaseConfig object
   5. Paste YOUR values below, replacing the placeholder text
   6. In Firebase Console → Firestore Database → Create database
      (Start in test mode for development)
═══════════════════════════════════════════════════════ */

// ── Step 1: Paste YOUR Firebase config here ───────────
//    Replace every value that says "YOUR_..." with your real config values.
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBWAMe-WLkqQaxwhLyMKGHdP9iFRdoswY",
  authDomain: "thought-in-the-sky-a9609.firebaseapp.com",
  projectId: "thought-in-the-sky-a9609",
  storageBucket: "thought-in-the-sky-a9609.firebasestorage.app",
  messagingSenderId: "624023756072",
  appId: "1:624023756072:web:5c749f2abb2c463d11c41d"
};

// ── Step 2: Initialize Firebase ────────────────────────
//    This uses the Firebase compat SDK (v9 compat) which is
//    the easiest to read — no module bundler needed.
let db = null; // will hold our Firestore reference

/**
 * initFirebase()
 * Initializes Firebase and returns the Firestore database.
 * Called once at app startup.
 */
function initFirebase() {
  try {
    // Check if firebase is loaded (the scripts in index.html)
    if (typeof firebase === "undefined") {
      console.error("Firebase SDK not loaded. Check <script> tags in index.html.");
      return null;
    }

    // Only initialize once
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Get a reference to Firestore
    db = firebase.firestore();
    console.log("✅ Firebase connected.");
    return db;

  } catch (err) {
    console.error("Firebase init failed:", err);
    return null;
  }
}

/* ─────────────────────────────────────────────────────
   FIRESTORE HELPERS
   These functions are called from script.js
───────────────────────────────────────────────────── */

/**
 * saveThought(text)
 * Saves a new thought to the "thoughts" collection.
 * Each thought stores: the message text and a server timestamp.
 *
 * @param {string} text - The thought to save
 * @returns {Promise<object>} - The saved document data with its ID
 */
async function saveThought(text) {
  if (!db) throw new Error("Firestore not initialized.");

  // Add a new document to the "thoughts" collection
  const docRef = await db.collection("thoughts").add({
    text:      text.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp() // server time
  });

  return {
    id:        docRef.id,
    text:      text.trim(),
    createdAt: new Date() // use local date as fallback until server syncs
  };
}

/**
 * fetchThoughts()
 * Fetches all thoughts from Firestore, ordered by creation time.
 * Returns an array of thought objects.
 *
 * @returns {Promise<Array>} - Array of { id, text, createdAt }
 */
async function fetchThoughts() {
  if (!db) return [];

  const snapshot = await db
    .collection("thoughts")
    .orderBy("createdAt", "asc")
    .get();

  // Map each Firestore document to a plain JS object
  return snapshot.docs.map(doc => ({
    id:        doc.id,
    text:      doc.data().text,
    createdAt: doc.data().createdAt?.toDate() || new Date()
  }));
}

/**
 * listenForNewThoughts(callback)
 * Sets up a real-time listener on the "thoughts" collection.
 * Whenever a new thought is added, the callback fires with it.
 * This enables the shared sky — all users see new stars appear live.
 *
 * @param {Function} callback - Called with { id, text, createdAt } for each new doc
 * @returns {Function} unsubscribe - Call this to stop listening
 */
function listenForNewThoughts(callback) {
  if (!db) return () => {};

  // Only listen for documents added AFTER we start listening
  const startTime = firebase.firestore.Timestamp.now();

  const unsubscribe = db
    .collection("thoughts")
    .where("createdAt", ">", startTime)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        // We only care about new additions
        if (change.type === "added") {
          const data = change.doc.data();
          callback({
            id:        change.doc.id,
            text:      data.text,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
      });
    });

  return unsubscribe; // allows cleanup if needed
}
