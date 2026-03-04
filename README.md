# Leave a Thought in the Sky

An anonymous, shared night sky where your words become stars — quiet, beautiful, and timeless.

---

## Experience Concept

Leave a Thought in the Sky treats the act of expression as a quiet, anonymous ritual rather than a social transaction. Users type a thought and release it into a shared sky, where it becomes a glowing star visible to everyone. There are no usernames, no likes, no replies — only a constellation of anonymous words, drifting gently in the dark.

The aesthetic draws from astronomy, minimalist web design, and the emotional weight of anonymous confession — deep navy backgrounds, cold blue-white and warm golden starlight, and the slow, breathing pulse of a living sky.

---

## Features

### Loading Screen
The application opens with a full-screen loading overlay that displays "gathering the stars..." while Firebase initializes and existing thoughts are fetched. The screen fades out smoothly once the sky is ready.

### Full-Screen Canvas Sky
A full-viewport HTML5 canvas renders the night sky. A field of ambient background stars provides atmospheric depth. Each thought submitted by any user worldwide appears as a distinct, interactive thought star layered above the ambient field.

### Thought Stars
Each thought from the database is represented as a rendered star on the canvas. Stars are assigned a color from a weighted palette (cold blue-white stars are most common; warm golden and rare pink stars appear less frequently). Every star continuously twinkles via a sine-wave opacity and radius oscillation and drifts slowly across the sky, bouncing gently off invisible boundaries.

### Launch Animation
When a user submits a new thought, the resulting star launches upward from the input area at the bottom of the screen and eases into its resting position using a cubic ease-out curve, giving the impression of a thought rising into the sky.

### Interactive Tooltip
Hovering over or clicking any thought star reveals a frosted-glass tooltip displaying the thought text and a relative timestamp. On touch devices, a tap triggers the same interaction. The tooltip can be dismissed with the close button or by clicking elsewhere on the canvas. A generous hit radius ensures stars are easy to tap on mobile.

### Real-Time Shared Sky
A Firestore real-time listener watches for new thoughts submitted by other users while the page is open. When a new thought arrives from another session, its star appears in the sky with the launch animation — all visitors share the same living sky simultaneously.

### Thought Submission
A fixed input area at the bottom of the screen contains an auto-resizing textarea with a 160-character limit and a live character countdown that turns amber as the limit approaches. Thoughts are submitted by clicking the "send to the sky" button or pressing Ctrl+Enter (Cmd+Enter on macOS). Empty submissions are ignored. The button is disabled during the save operation to prevent duplicates.

### Star Count Display
A persistent counter in the top-right corner displays the total number of thoughts currently in the sky, updating in real time as new stars are added.

### Toast Notifications
Brief status messages appear above the input area to confirm successful submission or report errors, fading out after three seconds.

### Offline Fallback
If Firebase is unavailable or misconfigured, the application runs in offline mode. The sky still renders and the ambient animation continues; thoughts are simply not persisted or shared.

### Responsive Layout
The canvas and all UI elements scale to fit any screen size. The star count display is hidden on screens narrower than 480px to preserve clarity. Stars are repositioned proportionally when the window is resized.

---

## Technical Structure

```
thought-in-the-sky/
|-- index.html      Main HTML document, meta tags, and script loading order
|-- style.css       All visual styling: layout, animations, glassmorphism, responsive rules
|-- firebase.js     Firebase initialization and Firestore helper functions
|-- script.js       Main application: canvas, star classes, animation loop, interaction, init
|-- favicon.ico     Site favicon
|-- .env            Environment variable template for the Firebase API key
|-- .gitignore      Git ignore rules
|-- README.md       This document
|-- LICENSE         MIT License
```

### Module Responsibilities

**index.html**
Declares the full DOM structure including the loading screen, canvas element, site header, star count display, thought tooltip, input area, and toast notification. Loads the Firebase compat SDK scripts, then firebase.js, then script.js in order.

**style.css**
Implements the visual system using CSS custom properties for all colors and typography. Contains the canvas background gradient, loading screen breathe animation, header and input fade-in transitions, glassmorphism tooltip and input panel styles, submit button animation, toast positioning, and responsive breakpoints.

**firebase.js**
Exported to the global scope. Initializes the Firebase app using the compat SDK and exposes three Firestore helpers: `saveThought` adds a new document to the thoughts collection with a server timestamp; `fetchThoughts` retrieves all thoughts ordered by creation time; `listenForNewThoughts` attaches a real-time snapshot listener that fires a callback for each newly added document, enabling the shared live sky.

**script.js**
Orchestrates the full application. Manages all mutable state in a single `state` object. The `ThoughtStar` class handles per-star position, color, twinkle, drift, launch animation, and canvas rendering. The `BackgroundStar` class handles the ambient decorative field. The animation loop calls `requestAnimationFrame` continuously, clearing and redrawing the full canvas each frame. Input handlers wire up the textarea, submit button, keyboard shortcut, and tooltip close behavior. Mouse and touch handlers perform hit-testing against all thought stars on each interaction event. The `init` function sequences startup: Firebase, canvas setup, background star generation, animation start, interaction wiring, thought loading, real-time listener attachment, and UI reveal.

---

## Setup Instructions

Leave a Thought in the Sky requires a Firebase project with Firestore enabled. No build tools or package manager are needed beyond that.

**Step 1: Create a Firebase project**
1. Go to https://console.firebase.google.com and create a new project.
2. Add a web app to the project and copy the `firebaseConfig` object.
3. In the Firebase console, open Firestore Database and create a database in test mode.

**Step 2: Configure the application**
1. Open `firebase.js` and paste your `firebaseConfig` values where indicated.
2. Set your Firebase API key in a `.env` file as `REACT_APP_FIREBASE_API_KEY` or replace the `process.env` reference in `firebase.js` directly for plain HTML deployment.

**Step 3: Run locally**

Using Python:
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

Using Node.js:
```bash
npx serve .
```

**Option: Static hosting deployment**
The project is deployment-ready for any static hosting platform:
- Netlify: Drag the project folder into the Netlify dashboard.
- Vercel: Run `vercel deploy` from the project directory.
- GitHub Pages: Push to a repository and enable Pages from the repository settings.

Ensure your Firebase project's authorized domains include your deployment URL.

---

## Browser Compatibility

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

| Feature | Requirement |
|---|---|
| Canvas API | All modern browsers |
| CSS Custom Properties | Chrome 49+, Firefox 31+, Safari 9.1+ |
| CSS `backdrop-filter` | Chrome 76+, Safari 9+, Edge 79+ |
| Firebase Firestore SDK | All modern browsers |
| Touch Events API | All modern browsers |


---

## Future Improvements

The following enhancements would extend the experience without compromising its current simplicity:

- **Constellation drawing** — Allow users to connect their own stars into personal constellations by clicking a sequence of thought stars.
- **Mood or color selection** — Let users choose a star color at submission time to reflect the emotional tone of their thought.
- **Temporal fading** — Gradually dim very old stars over days or weeks, allowing the sky to slowly renew itself.
- **Shooting star events** — Periodically animate a streaking star across the sky as a purely decorative atmospheric effect.
- **Moderation layer** — Implement a lightweight content filter or report mechanism to maintain the tone of the shared space.
- **Read count** — Track how many times each thought has been viewed and surface the number subtly in the tooltip.
- **Accessibility improvements** — Provide a non-canvas list view of all thoughts for screen reader users, and ensure full keyboard navigation for the input and tooltip controls.

---

## Author

Anshika Mittal

---

## License

MIT License. See `LICENSE` for full terms.
