/* ═══════════════════════════════════════════════════════
   script.js
   Leave a Thought in the Sky — Main Application Logic

   Structure:
   1. Constants & State
   2. Canvas Setup
   3. Star Class
   4. Background Star Class (ambient, decorative)
   5. Animation Loop
   6. Thought Management
   7. Tooltip / UI
   8. Input Handling
   9. Initialization
═══════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────
   1. CONSTANTS & STATE
─────────────────────────────────────────────────────── */

const COLORS = {
  starCold:   "#c8d8ff",  // blue-white
  starWarm:   "#ffe8b0",  // golden
  starRare:   "#ffb3c6",  // pink (rare)
  starDim:    "#8899cc",  // dimmer blue
};

// Star color palette — weighted so cold stars are most common
const STAR_PALETTE = [
  COLORS.starCold, COLORS.starCold, COLORS.starCold,
  COLORS.starWarm, COLORS.starWarm,
  COLORS.starDim,
  COLORS.starRare
];

// App state — all mutable data lives here
const state = {
  stars: [],              // ThoughtStar[] — thought stars from Firestore
  bgStars: [],            // BackgroundStar[] — ambient decorative stars
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  tooltip: {
    visible: false,
    starId: null
  },
  animFrameId: null,
  isFirebaseReady: false
};

/* ───────────────────────────────────────────────────────
   2. CANVAS SETUP
─────────────────────────────────────────────────────── */

/**
 * setupCanvas()
 * Grabs the canvas element, sets it to fill the window,
 * and handles resize events so it always fits the screen.
 */
function setupCanvas() {
  state.canvas = document.getElementById("sky-canvas");
  state.ctx    = state.canvas.getContext("2d");
  resizeCanvas();

  // On window resize, resize canvas and reposition stars proportionally
  window.addEventListener("resize", () => {
    const oldW = state.width;
    const oldH = state.height;
    resizeCanvas();

    // Move existing thought stars proportionally to new canvas size
    state.stars.forEach(star => {
      star.x = (star.x / oldW) * state.width;
      star.y = (star.y / oldH) * state.height;
    });

    // Regenerate background stars to fit new size
    generateBackgroundStars();
  });
}

/**
 * resizeCanvas()
 * Sets the canvas pixel dimensions to match the device's window.
 * Uses devicePixelRatio for crisp rendering on retina screens.
 */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  state.width  = window.innerWidth;
  state.height = window.innerHeight;

  state.canvas.width  = state.width  * dpr;
  state.canvas.height = state.height * dpr;
  state.canvas.style.width  = state.width  + "px";
  state.canvas.style.height = state.height + "px";

  state.ctx.scale(dpr, dpr);
}

/* ───────────────────────────────────────────────────────
   3. THOUGHT STAR CLASS
   Each thought from Firestore becomes one of these.
─────────────────────────────────────────────────────── */

class ThoughtStar {
  /**
   * @param {string} id      - Firestore document ID
   * @param {string} text    - The thought text
   * @param {Date}   createdAt - When it was created
   * @param {boolean} animate - If true, plays the launch animation
   */
  constructor(id, text, createdAt, animate = false) {
    this.id        = id;
    this.text      = text;
    this.createdAt = createdAt;

    // Position: random, but avoid edges (10% margin)
    this.x = randomBetween(state.width * 0.08, state.width * 0.92);

    // Avoid the bottom input area (~20% from bottom)
    this.y = randomBetween(state.height * 0.05, state.height * 0.75);

    // Visual properties
    this.radius       = randomBetween(2.2, 4.5);
    this.color        = pickRandom(STAR_PALETTE);
    this.twinkleSpeed = randomBetween(0.008, 0.025);
    this.twinklePhase = Math.random() * Math.PI * 2; // random start phase
    this.driftX       = randomBetween(-0.06, 0.06);  // very slow horizontal drift
    this.driftY       = randomBetween(-0.04, 0.03);  // very slow vertical drift
    this.opacity      = 0; // starts invisible, fades in

    // Launch animation state
    this.launching       = animate;
    this.launchY         = state.height - 80; // start from input area
    this.launchTargetY   = this.y;
    this.launchProgress  = 0; // 0 → 1

    // If animating, start from bottom
    if (animate) {
      this.y = this.launchY;
    }
  }

  /**
   * update(time)
   * Called every animation frame.
   * Handles launch animation, fade-in, twinkle, and drift.
   *
   * @param {number} time - current timestamp from requestAnimationFrame
   */
  update(time) {
    // ── Launch animation ──────────────────────────────
    if (this.launching) {
      this.launchProgress += 0.018; // speed of travel
      if (this.launchProgress >= 1) {
        this.launchProgress = 1;
        this.launching = false;
        this.y = this.launchTargetY;
      } else {
        // Ease-out cubic: starts fast, slows into place
        const t = 1 - Math.pow(1 - this.launchProgress, 3);
        this.y = this.launchY + (this.launchTargetY - this.launchY) * t;
      }
    }

    // ── Fade in ───────────────────────────────────────
    if (this.opacity < 1) {
      this.opacity = Math.min(this.opacity + 0.012, 1);
    }

    // ── Gentle drift ──────────────────────────────────
    if (!this.launching) {
      this.x += this.driftX;
      this.y += this.driftY;

      // Bounce off invisible walls (with some margin)
      if (this.x < 20 || this.x > state.width  - 20) this.driftX *= -1;
      if (this.y < 20 || this.y > state.height * 0.8) this.driftY *= -1;
    }

    // ── Twinkle ───────────────────────────────────────
    // Sine wave oscillation on opacity and radius
    this.twinklePhase += this.twinkleSpeed;
    const twinkle = 0.75 + 0.25 * Math.sin(this.twinklePhase);
    this.currentOpacity = this.opacity * twinkle;
    this.currentRadius  = this.radius * (0.88 + 0.12 * twinkle);
  }

  /**
   * draw(ctx)
   * Renders the star onto the canvas with a multi-layer glow.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.currentOpacity;

    // ── Outer glow (large, very diffuse) ──────────────
    const outerGlow = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.currentRadius * 9
    );
    outerGlow.addColorStop(0,   hexToRgba(this.color, 0.25));
    outerGlow.addColorStop(0.4, hexToRgba(this.color, 0.06));
    outerGlow.addColorStop(1,   hexToRgba(this.color, 0));

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius * 9, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    // ── Inner glow (medium, stronger) ─────────────────
    const innerGlow = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.currentRadius * 3.5
    );
    innerGlow.addColorStop(0,   hexToRgba(this.color, 0.9));
    innerGlow.addColorStop(0.5, hexToRgba(this.color, 0.35));
    innerGlow.addColorStop(1,   hexToRgba(this.color, 0));

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.fill();

    // ── Star core (solid bright center) ───────────────
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // ── Cross-hair glint (tiny cross of light) ────────
    if (this.radius > 3.2) {
      ctx.globalAlpha = this.currentOpacity * 0.5;
      ctx.strokeStyle = hexToRgba(this.color, 0.7);
      ctx.lineWidth   = 0.5;
      const gl = this.currentRadius * 2.5;

      ctx.beginPath();
      ctx.moveTo(this.x - gl, this.y);
      ctx.lineTo(this.x + gl, this.y);
      ctx.moveTo(this.x, this.y - gl);
      ctx.lineTo(this.x, this.y + gl);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * isHovered(mouseX, mouseY)
   * Returns true if the mouse is within the star's clickable area.
   *
   * @param {number} mouseX
   * @param {number} mouseY
   * @returns {boolean}
   */
  isHovered(mouseX, mouseY) {
    const hitRadius = Math.max(this.radius * 5, 20); // generous hit area
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    return (dx * dx + dy * dy) <= (hitRadius * hitRadius);
  }
}

/* ───────────────────────────────────────────────────────
   4. BACKGROUND STAR CLASS
   Ambient stars — decorative, not clickable, no thought.
─────────────────────────────────────────────────────── */

class BackgroundStar {
  constructor() {
    this.reset();
  }

  reset() {
    this.x            = Math.random() * state.width;
    this.y            = Math.random() * state.height * 0.85; // keep above input
    this.radius       = randomBetween(0.3, 1.6);
    this.opacity      = randomBetween(0.15, 0.7);
    this.twinkleSpeed = randomBetween(0.003, 0.015);
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.color        = Math.random() < 0.7 ? COLORS.starDim : COLORS.starCold;
  }

  update() {
    this.twinklePhase += this.twinkleSpeed;
  }

  draw(ctx) {
    const twinkle = 0.6 + 0.4 * Math.sin(this.twinklePhase);
    const alpha   = this.opacity * twinkle;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Simple glow for background stars (lighter computation)
    const glow = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 5
    );
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.3, hexToRgba(this.color, 0.5));
    glow.addColorStop(1, hexToRgba(this.color, 0));

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Bright core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
  }
}

/**
 * generateBackgroundStars()
 * Creates ~180 background stars to fill the sky.
 */
function generateBackgroundStars() {
  const count = Math.floor((state.width * state.height) / 8000);
  state.bgStars = [];
  for (let i = 0; i < Math.min(count, 200); i++) {
    state.bgStars.push(new BackgroundStar());
  }
}

/* ───────────────────────────────────────────────────────
   5. ANIMATION LOOP
─────────────────────────────────────────────────────── */

/**
 * animate(time)
 * The main loop — runs ~60 times per second.
 * Clears the canvas, draws background stars, then thought stars.
 *
 * @param {number} time - DOMHighResTimeStamp from rAF
 */
function animate(time) {
  const { ctx, width, height } = state;

  // Clear — use a very low alpha so old frames fade (creates trailing glow)
  ctx.clearRect(0, 0, width, height);

  // Draw all background (ambient) stars
  state.bgStars.forEach(star => {
    star.update();
    star.draw(ctx);
  });

  // Draw all thought stars
  state.stars.forEach(star => {
    star.update(time);
    star.draw(ctx);
  });

  // Continue loop
  state.animFrameId = requestAnimationFrame(animate);
}

/* ───────────────────────────────────────────────────────
   6. THOUGHT MANAGEMENT
─────────────────────────────────────────────────────── */

/**
 * loadThoughts()
 * Fetches all saved thoughts from Firebase and adds them
 * to the sky gradually (staggered appearance).
 */
async function loadThoughts() {
  let thoughts = [];

  if (state.isFirebaseReady) {
    try {
      thoughts = await fetchThoughts(); // from firebase.js
    } catch (err) {
      console.warn("Could not fetch thoughts:", err);
    }
  }

  // Stagger star appearances — feels like stars waking up
  thoughts.forEach((thought, index) => {
    setTimeout(() => {
      addThoughtStar(thought.id, thought.text, thought.createdAt, false);
    }, index * 120); // 120ms between each star appearing
  });

  updateStarCount();
}

/**
 * addThoughtStar(id, text, createdAt, animate)
 * Creates a new ThoughtStar and adds it to the sky.
 *
 * @param {string}  id        - Unique ID
 * @param {string}  text      - Thought content
 * @param {Date}    createdAt - Timestamp
 * @param {boolean} animate   - Whether to play launch animation
 */
function addThoughtStar(id, text, createdAt, animate = false) {
  // Don't add duplicates
  if (state.stars.find(s => s.id === id)) return;

  const star = new ThoughtStar(id, text, createdAt, animate);
  state.stars.push(star);
  updateStarCount();
}

/**
 * submitThought()
 * Reads the input, saves to Firebase, and launches the star.
 */
async function submitThought() {
  const input = document.getElementById("thought-input");
  const btn   = document.getElementById("submit-btn");
  const text  = input.value.trim();

  // Validate
  if (!text) {
    showToast("write something first ✦");
    return;
  }
  if (text.length > 160) {
    showToast("keep it under 160 characters");
    return;
  }

  // Disable button during save
  btn.disabled = true;

  try {
    let id, createdAt;

    if (state.isFirebaseReady) {
      // Save to Firebase and get back the saved document
      const saved = await saveThought(text); // from firebase.js
      id        = saved.id;
      createdAt = saved.createdAt;
    } else {
      // Offline mode: generate a local ID so star still appears
      id        = "local-" + Date.now();
      createdAt = new Date();
    }

    // Add star to sky with launch animation
    addThoughtStar(id, text, createdAt, true);

    // Clear the input
    input.value = "";
    updateCharCount(160);

    showToast("your thought is now a star ✦");

  } catch (err) {
    console.error("Failed to save thought:", err);
    showToast("something went wrong — try again");
  } finally {
    // Re-enable button
    btn.disabled = false;
  }
}

/* ───────────────────────────────────────────────────────
   7. TOOLTIP / UI
─────────────────────────────────────────────────────── */

const tooltip = document.getElementById("thought-tooltip");
const tooltipText = document.getElementById("tooltip-text");
const tooltipTime = document.getElementById("tooltip-time");

/**
 * showTooltip(star, x, y)
 * Positions and reveals the thought tooltip near a star.
 *
 * @param {ThoughtStar} star
 * @param {number} x - Canvas x position
 * @param {number} y - Canvas y position
 */
function showTooltip(star, x, y) {
  tooltipText.textContent = star.text;
  tooltipTime.textContent = formatDate(star.createdAt);

  // Position tooltip — nudge it so it doesn't overlap the star
  const margin   = 16;
  const tipW     = 300;
  const tipH     = 110;

  let left = x + 20;
  let top  = y - tipH / 2;

  // Keep within screen bounds
  if (left + tipW > state.width  - margin) left = x - tipW - 20;
  if (top  < margin)                        top  = margin;
  if (top  + tipH > state.height - margin)  top  = state.height - tipH - margin;

  tooltip.style.left = left + "px";
  tooltip.style.top  = top  + "px";

  tooltip.classList.add("visible");
  state.tooltip.visible = true;
  state.tooltip.starId  = star.id;
}

/**
 * hideTooltip()
 * Hides the tooltip.
 */
function hideTooltip() {
  tooltip.classList.remove("visible");
  state.tooltip.visible = false;
  state.tooltip.starId  = null;
}

/* ───────────────────────────────────────────────────────
   8. INPUT HANDLING — Mouse, Touch, Keyboard
─────────────────────────────────────────────────────── */

/**
 * setupMouseInteraction()
 * Handles hover and click on the canvas to detect thought stars.
 */
function setupMouseInteraction() {
  let lastHoveredStar = null;

  // ── Mouse move: show tooltip on hover ─────────────
  state.canvas.addEventListener("mousemove", e => {
    const { x, y } = getCanvasPos(e);
    const hovered = findStarAt(x, y);

    if (hovered) {
      state.canvas.style.cursor = "pointer";
      if (lastHoveredStar?.id !== hovered.id) {
        showTooltip(hovered, x, y);
        lastHoveredStar = hovered;
      }
    } else {
      state.canvas.style.cursor = "default";
      if (lastHoveredStar && !state.tooltip.locked) {
        // Small delay before hiding (prevents flicker)
        setTimeout(() => {
          if (!findStarAt(x, y)) hideTooltip();
        }, 200);
      }
      lastHoveredStar = null;
    }
  });

  // ── Click: show/hide tooltip (for touch devices) ──
  state.canvas.addEventListener("click", e => {
    const { x, y } = getCanvasPos(e);
    const clicked = findStarAt(x, y);

    if (clicked) {
      showTooltip(clicked, x, y);
    } else {
      hideTooltip();
    }
  });

  // ── Touch support ──────────────────────────────────
  state.canvas.addEventListener("touchend", e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const { x, y } = getCanvasPos(touch);
    const touched = findStarAt(x, y);

    if (touched) {
      showTooltip(touched, x, y);
    } else {
      hideTooltip();
    }
  }, { passive: false });
}

/**
 * getCanvasPos(event)
 * Converts a mouse/touch event position to canvas coordinates.
 *
 * @param {MouseEvent|Touch} e
 * @returns {{ x: number, y: number }}
 */
function getCanvasPos(e) {
  const rect = state.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/**
 * findStarAt(x, y)
 * Finds the topmost thought star at the given coordinates.
 * Returns null if none found.
 *
 * @param {number} x
 * @param {number} y
 * @returns {ThoughtStar|null}
 */
function findStarAt(x, y) {
  // Search in reverse order (last drawn = on top)
  for (let i = state.stars.length - 1; i >= 0; i--) {
    if (state.stars[i].isHovered(x, y)) {
      return state.stars[i];
    }
  }
  return null;
}

/**
 * setupInputHandlers()
 * Wires up the textarea, submit button, and keyboard shortcuts.
 */
function setupInputHandlers() {
  const input  = document.getElementById("thought-input");
  const btn    = document.getElementById("submit-btn");
  const count  = document.getElementById("char-count");
  const closeBtn = document.getElementById("tooltip-close");

  // Character countdown
  input.addEventListener("input", () => {
    const remaining = 160 - input.value.length;
    updateCharCount(remaining);
  });

  // Auto-resize textarea
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });

  // Submit on button click
  btn.addEventListener("click", submitThought);

  // Submit on Ctrl+Enter or Cmd+Enter
  input.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      submitThought();
    }
  });

  // Close tooltip
  closeBtn.addEventListener("click", hideTooltip);

  // Click outside tooltip to close
  document.addEventListener("click", e => {
    if (!tooltip.contains(e.target) && !state.canvas.contains(e.target)) {
      hideTooltip();
    }
  });
}

/**
 * updateCharCount(remaining)
 * Updates the character counter display.
 *
 * @param {number} remaining
 */
function updateCharCount(remaining) {
  const el = document.getElementById("char-count");
  el.textContent = remaining;
  el.classList.toggle("warning", remaining < 20);
}

/* ───────────────────────────────────────────────────────
   UTILITY FUNCTIONS
─────────────────────────────────────────────────────── */

/**
 * updateStarCount()
 * Updates the star counter in the top-right corner.
 */
function updateStarCount() {
  document.getElementById("star-count").textContent = state.stars.length;
}

/**
 * showToast(message)
 * Shows a brief notification that fades out.
 *
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/**
 * formatDate(date)
 * Returns a human-readable relative time string.
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date || isNaN(date)) return "a moment in time";

  const now   = new Date();
  const diff  = Math.floor((now - date) / 1000); // seconds ago

  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)} days ago`;

  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * randomBetween(min, max)
 * Returns a random float between min and max.
 */
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * pickRandom(array)
 * Returns a random element from an array.
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * hexToRgba(hex, alpha)
 * Converts a hex color string to rgba() for canvas use.
 *
 * @param {string} hex   - e.g. "#c8d8ff"
 * @param {number} alpha - 0 to 1
 * @returns {string}
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ───────────────────────────────────────────────────────
   9. INITIALIZATION
   Entry point — runs when the page loads.
─────────────────────────────────────────────────────── */

/**
 * init()
 * Sets everything up in order:
 * 1. Initialize Firebase
 * 2. Set up canvas
 * 3. Generate background stars
 * 4. Start animation loop
 * 5. Set up interactivity
 * 6. Load thoughts from database
 * 7. Hide loading screen, reveal UI
 */
async function init() {
  // 1. Firebase
  const firestore = initFirebase(); // from firebase.js
  state.isFirebaseReady = !!firestore;

  if (!state.isFirebaseReady) {
    console.warn("Running in offline mode — thoughts won't be saved.");
  }

  // 2. Canvas
  setupCanvas();

  // 3. Background stars
  generateBackgroundStars();

  // 4. Animation loop starts immediately
  state.animFrameId = requestAnimationFrame(animate);

  // 5. Input and mouse interaction
  setupMouseInteraction();
  setupInputHandlers();

  // 6. Load thoughts (staggered star appearance)
  await loadThoughts();

  // 7. Set up real-time listener for new thoughts from other users
  if (state.isFirebaseReady) {
    listenForNewThoughts(thought => {
      addThoughtStar(thought.id, thought.text, thought.createdAt, true);
    });
  }

  // 8. Reveal UI — hide loading screen, fade in header and input
  setTimeout(() => {
    // Hide loading
    document.getElementById("loading-screen").classList.add("hidden");

    // Fade in UI elements
    document.getElementById("site-header").classList.add("visible");
    document.getElementById("input-area").classList.add("visible");
    document.getElementById("star-count-display").classList.add("visible");
  }, 800);
}

// Run when the DOM is ready
document.addEventListener("DOMContentLoaded", init);
