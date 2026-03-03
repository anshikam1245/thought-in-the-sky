# 🌌 Leave a Thought in the Sky

> *An anonymous shared night sky where your words become stars — quiet, beautiful, and timeless.*

---

## ✨ Overview

**Leave a Thought in the Sky** is an anonymous, shared interactive web experience where users leave short thoughts that become glowing stars in a communal night sky. There are no accounts, no likes, no usernames — just words floating among the stars, shared with anyone who looks up.

It's built to feel **emotional, calm, and artistic** — closer to a meditation than a social network.

---

## 🪐 Features

- **Live night sky canvas** — hundreds of ambient background stars rendered with a full canvas animation engine
- **Thought stars** — each submitted thought becomes a uniquely colored, twinkling star
- **Launch animation** — new thoughts fly upward from the input field and settle into the sky
- **Hover / tap to reveal** — hover or tap any thought star to read the message in a floating tooltip
- **Real-time shared sky** — all connected users see new thoughts appear live via Firebase
- **Character counter** — 160 character limit with a live countdown
- **Staggered appearance** — existing thoughts fade in gradually on load, not all at once
- **Responsive** — works on desktop, tablet, and mobile
- **No login required** — fully anonymous

---

## 🗂 Project Structure

```
leave-a-thought-in-the-sky/
├── index.html      ← Main HTML with meta tags, OG tags, layout
├── style.css       ← Night sky theme, animations, responsive layout
├── script.js       ← Canvas engine, Star classes, app logic
├── firebase.js     ← Firebase config + Firestore helpers
├── favicon.ico     ← Site favicon (place your icon here)
└── README.md       ← This file
```

---

## 🚀 Setup Instructions

### 1. Download / Clone the Project

```bash
git clone https://github.com/your-username/leave-a-thought-in-the-sky.git
cd leave-a-thought-in-the-sky
```

Or simply download the ZIP and extract it.

### 2. Set Up Firebase (see full steps below)

You'll need a Firebase project with Firestore to save and sync thoughts.

### 3. Open Locally

Open `index.html` directly in your browser — or use a local server:

```bash
# With Python
python3 -m http.server 3000

# With Node / npx
npx serve .
```

Then visit `http://localhost:3000`

### 4. Deploy

This is a static site — deploy anywhere:
- **Netlify**: Drag and drop the folder at [netlify.com/drop](https://netlify.com/drop)
- **Vercel**: `vercel deploy` from the project directory
- **GitHub Pages**: Push to `gh-pages` branch
- **Firebase Hosting**: `firebase deploy`

---

## 🔥 Firebase Setup (Step by Step)

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Enter a project name (e.g., `thought-sky`)
4. Click through the setup steps (you can disable Google Analytics)

### Step 2 — Create a Firestore Database

1. In your project sidebar, click **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development — read/write open for 30 days)
4. Select a region close to your users → **Done**

### Step 3 — Register a Web App

1. In project settings (⚙️ gear icon) → **"Your apps"**
2. Click the **`</>`** (Web) icon
3. Give it a nickname (e.g., `thought-sky-web`)
4. Click **"Register app"**
5. You'll see a `firebaseConfig` object — **copy it**

### Step 4 — Paste Config into `firebase.js`

Open `firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",           // ← paste your real values here
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

### Step 5 — Set Firestore Security Rules (for production)

In the Firebase Console → Firestore → **Rules** tab, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /thoughts/{thoughtId} {
      allow read: if true;
      allow create: if request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 160;
    }
  }
}
```

This allows anyone to read and add thoughts, but validates the data.

---

## 🛠 Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Markup      | HTML5 (semantic, accessible)            |
| Styling     | CSS3 (variables, backdrop-filter, animations) |
| Logic       | Vanilla JavaScript (ES6+)               |
| Rendering   | HTML5 Canvas API                        |
| Database    | Firebase Firestore (real-time NoSQL)    |
| Fonts       | Google Fonts — Cormorant Garamond + Lato |
| Hosting     | Any static host (Netlify, Vercel, etc.) |

---

## 💡 How It Works

### Star Rendering

Each thought is a `ThoughtStar` object with:
- Random position (avoiding edges and the input area)
- Random color from a curated palette (cool blue-white, warm gold, rare pink)
- Multi-layer glow rendered with `createRadialGradient` on canvas
- Sine-wave based twinkle animation
- Gentle drift with invisible boundary bouncing

### Launch Animation

When a user submits a thought, the star starts at the bottom of the screen (near the input) and uses a **cubic ease-out** to fly upward to its final position — giving it a satisfying physical feel.

### Real-Time Sync

Firebase's `onSnapshot` listener watches for new documents added after page load. When another user submits a thought, it appears as a launching star for all connected visitors.

---

## 🔮 Future Improvements

- [ ] **Thought reactions** — hover a star and press a small glyph to "resonate" with it
- [ ] **Constellation mode** — group nearby stars into temporary patterns with shared themes
- [ ] **Time-of-day sky** — shift sky colors based on the user's local time
- [ ] **Star aging** — very old thoughts slowly dim and eventually fade out
- [ ] **Share a star** — click a thought and generate a shareable image card
- [ ] **Shooting stars** — periodic visual events separate from user thoughts
- [ ] **Sound design** — optional ambient audio layer with subtle tones on star interactions
- [ ] **Rate limiting** — server-side Cloud Function to prevent spam
- [ ] **Content moderation** — Firebase Extensions or a moderation queue

---

## 🙏 Credits

Designed and developed by **Anshika Mittal**

*"Every thought deserves a sky."*

---

## 📄 License

MIT — free to use, share, and build upon.
