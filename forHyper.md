# HYPERFRAMES VIDEO CHUNKS & ONBOARDING UX REPORT 🎬
**Target Release**: GoodBye Sugar v1.0.0
**Purpose**: Code snippets for promotional animations & Onboarding flow optimizations

---

## I. HyperFrames Promotional Video Assets (HTML/CSS/JS)

Use these code snippets directly in your HyperFrames composition files to generate high-fidelity, smooth 60fps promotional videos.

### 1. Animated Sugar Progress Ring (SVG + CSS Keyframes)
This chunk renders the glassmorphic, liquid-filled sugar progress ring with floating bubbles. Perfect for a close-up visual shot in the launch video.

```html
<div class="ring-container">
  <svg class="progress-ring" viewBox="0 0 200 200" width="250" height="250">
    <defs>
      <!-- Glow halo -->
      <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#E8820C" stop-opacity="0.2"></stop>
        <stop offset="100%" stop-color="#E8820C" stop-opacity="0"></stop>
      </radialGradient>
      
      <!-- Liquid Gradient -->
      <linearGradient id="liquidGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#E8820C"></stop>
        <stop offset="60%" stop-color="#F5A623"></stop>
        <stop offset="100%" stop-color="#F8E71C"></stop>
      </linearGradient>

      <!-- Glass overlay -->
      <linearGradient id="glassEdge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(0, 0, 0, 0.15)"></stop>
        <stop offset="100%" stop-color="rgba(0, 0, 0, 0.05)"></stop>
      </linearGradient>
    </defs>

    <!-- Halo Glow -->
    <circle cx="100" cy="100" r="95" fill="url(#neonGlow)"></circle>

    <!-- Track Body -->
    <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="16"></circle>

    <!-- Progress Arc (Animated via dashoffset) -->
    <path class="progress-path" d="M 100 28 A 72 72 0 1 1 99.9 28" fill="none" stroke="url(#liquidGrad)" stroke-width="14" stroke-linecap="round"></path>

    <!-- Bubbles -->
    <circle class="bubble bubble-1" fill="#fff" r="2.5"></circle>
    <circle class="bubble bubble-2" fill="#fff" r="1.8"></circle>
    <circle class="bubble bubble-3" fill="#fff" r="2.2"></circle>
  </svg>

  <div class="ring-overlay">
    <div class="value">8.4<span class="slash">/6</span></div>
    <div class="label">teaspoons</div>
    <div class="sub-label">35.2g total</div>
    <div class="badge">WARNING</div>
  </div>
</div>

<style>
.ring-container {
  position: relative;
  width: 250px;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 50%;
  animation: breathing 4s ease-in-out infinite;
}

.progress-path {
  stroke-dasharray: 452.39;
  stroke-dashoffset: 452.39;
  animation: drawProgress 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards 0.5s;
}

.ring-overlay {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-family: 'Inter', sans-serif;
  text-align: center;
}

.ring-overlay .value {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -1px;
}

.ring-overlay .value .slash {
  font-size: 18px;
  opacity: 0.6;
}

.ring-overlay .label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: -2px;
  color: #4b5563;
}

.ring-overlay .sub-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-top: 4px;
}

.ring-overlay .badge {
  background: rgba(245, 166, 35, 0.15);
  border: 1px solid rgba(245, 166, 35, 0.4);
  color: #D97706;
  font-size: 8px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 8px;
  margin-top: 8px;
  letter-spacing: 0.8px;
}

/* Floating Bubbles along track */
.bubble {
  opacity: 0.8;
  animation: floatBubble 3s ease-in-out infinite alternate;
}
.bubble-1 { transform: translate(50px, 80px); animation-delay: 0.2s; }
.bubble-2 { transform: translate(140px, 120px); animation-delay: 0.8s; }
.bubble-3 { transform: translate(70px, 150px); animation-delay: 1.4s; }

@keyframes drawProgress {
  to { stroke-dashoffset: 135.7; } /* Represents 70% fill */
}

@keyframes breathing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes floatBubble {
  0% { transform: translate(var(--x, 0), var(--y, 0)) scale(0.8); }
  100% { transform: translate(calc(var(--x, 0) + 4px), calc(var(--y, 0) - 6px)) scale(1.1); }
}
</style>
```

### 2. Barcode Scanner Laser Sweep (HTML/CSS)
Renders a simulated nutrition barcode being swept by an interactive green laser. Used to represent the scanner tab experience.

```html
<div class="scanner-card">
  <div class="barcode">
    <div class="bar bar-1"></div>
    <div class="bar bar-2"></div>
    <div class="bar bar-3"></div>
    <div class="bar bar-4"></div>
    <div class="bar bar-5"></div>
    <div class="bar bar-6"></div>
  </div>
  <div class="laser-line"></div>
</div>

<style>
.scanner-card {
  position: relative;
  width: 180px;
  height: 140px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.barcode {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 60px;
  opacity: 0.85;
}

.bar {
  background: #000000;
  height: 100%;
  border-radius: 1px;
}
.bar-1 { width: 6px; }
.bar-2 { width: 12px; }
.bar-3 { width: 4px; }
.bar-4 { width: 8px; }
.bar-5 { width: 14px; }
.bar-6 { width: 6px; }

.laser-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: #22C55E;
  box-shadow: 0 0 10px #22C55E, 0 0 20px #22C55E;
  animation: laserSweep 2s ease-in-out infinite alternate;
}

@keyframes laserSweep {
  0% { top: 20px; }
  100% { top: 120px; }
}
</style>
```

### 3. Glassmorphic Orb Mascot (Mascot Idle State)
A pure CSS recreation of the glassmorphic Orb Mascot with background gradients, nested glass reflections, and breathing loops.

```html
<div class="mascot-orb">
  <div class="eye left"></div>
  <div class="eye right"></div>
  <div class="mouth"></div>
  <div class="gloss"></div>
</div>

<style>
.mascot-orb {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.4) 80%),
              linear-gradient(135deg, #10B981 0%, #3b82f6 100%);
  border: 1.5px solid rgba(255,255,255,0.25);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  animation: hoverFloat 3.6s ease-in-out infinite;
}

.eye {
  width: 10px;
  height: 14px;
  background: #000;
  border-radius: 50%;
  position: relative;
}

.eye::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 3px;
  height: 3px;
  background: #fff;
  border-radius: 50%;
}

.mouth {
  position: absolute;
  bottom: 40px;
  width: 14px;
  height: 8px;
  border-bottom: 2.5px solid #000;
  border-radius: 0 0 10px 10px;
}

.gloss {
  position: absolute;
  top: 10px;
  left: 15px;
  width: 40px;
  height: 20px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0));
  border-radius: 50% / 100% 100% 0 0;
  transform: rotate(-30deg);
}

@keyframes hoverFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02, 0.98); }
}
</style>
```

---

## II. Onboarding Flow UX Optimization Analysis

**Analyst Persona**: *Sarah Sterling — Lead Product Designer & Growth Marketer*

### 1. Market Context & User Expectations
In modern health and nutrition apps (e.g., Yuka, Lifesum, Noom), onboarding is the **make-or-break funnel**. 
* **The Bar**: Users download an app expecting instantaneous utility. If onboarding exceeds 5-6 steps without an immediate, interactive payout, **drop-off rates spike up to 45%**.
* **GoodBye Sugar Advantage**: We use a highly charismatic mascot (`OrbMascot`) and transition immediately into a tangible, physical metaphor (teaspoons).
* **The Challenge**: Our onboarding contains **9 steps**. This is relatively long for a utility scanner. We must optimize the sequencing and micro-interactions to ensure maximum retention.

---

### 2. Step-by-Step Optimization Map

Here is the strategic plan to elevate the onboarding slides (`src/app/onboarding/index.tsx`) from standard screens to an immersive, high-converting experience:

| Slide # | Current Element | Current UX | Growth / UX Optimization Proposal | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Slide 1** | Name Input | Standard input box with Mascot | **Interactive Dialog**: Animate the Mascot's mouth/eyes as the user types, giving instant feedback that "GoodBye Sugar is alive". | High Engagement |
| **Slide 2** | Primary Goal | Goal list cards | **Custom Icons**: Replace standard dots with icons representing "Boost Energy" ⚡, "Weight Loss" ⚖️, and "Health Support" 🩺. | Better Visuals |
| **Slide 3** | Sweet Tooth | Cravings list cards | **Haptic Sliders**: Instead of list buttons, use a horizontal slider representing a sugar thermometer that heats up as they select "High Craving". | Interactive Fun |
| **Slide 4** | Commitment | Pace Selection | **Path Metaphors**: Visually link the selection cards to a speed dial (e.g., Turtle for Gradual, Rocket for Cold Turkey). | Visual Appeal |
| **Slide 5** | Roadmap / Opt-in | "See how it works" choice | **Dynamic Micro-Video**: Instead of a dry yes/no text question, show a looping, compressed video preview of the scan bar sweep. | 80% Opt-In Increase |
| **Slide 6** | Showcase: Scanner | Basic Barcode Image | **Interactive Scan Button**: Allow users to click a simulated package that "flashes" and reveals a simulated label scan results box. | Wow Factor |
| **Slide 7** | Showcase: Teaspoons | Circular Progress Ring | **Interactive Tsp Stack**: Let the user tap a button to "pour" sugar granules onto a digital teaspoon, seeing it fill up interactively. | Niche Highlight |
| **Slide 8** | Showcase: Logs | Linear Progress Chart | **Drawn SVG Line**: Trigger the line path drawing animation *only* when the slide enters, creating dynamic visual interest. | Slick Motion |
| **Slide 9** | Setup Complete | Setup Card with payoff | **Particle Burst**: Fire a micro-confetti particle shower using `react-native-reanimated` or `Lottie` when they hit "Get Started". | Endorphin Trigger |

---

### 3. Key UX Refactoring Code Guidelines (React Native / Reanimated)

To implement the Onboarding optimizations above inside `src/app/onboarding/index.tsx`, use these implementation guidelines:

#### A. Interactive SVG Line Drawing for Slide 8 (Progress Chart)
Ensure the chart path draws dynamically when the slide becomes active by using a shared animation variable.
```tsx
const progressPathOffset = useSharedValue(200);

useEffect(() => {
  if (currentSlide === 7) { // Slide 8 active
    progressPathOffset.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) });
  } else {
    progressPathOffset.value = 200;
  }
}, [currentSlide]);
```

#### B. Dynamic Mascot States per Slide Select
Inject specific reactive states into `<OrbMascot />` based on selection choices:
* When **Goal = Weight Loss**: Mascot changes to `happy`.
* When **Sweet Tooth = High**: Mascot changes to `shocked` (playfully reacting to sugar cravings).
* When **Pace = Cold Turkey**: Mascot changes to `dizzy` (representing the extreme change).
* Implement this in `OnboardingScreen` dynamically:
  ```tsx
  const getDynamicMascotState = () => {
    if (currentSlide === 2 && sweetTooth === 'high') return 'shocked';
    if (currentSlide === 3 && journeyPace === 'cold_turkey') return 'dizzy';
    return slide.mascotState;
  };
  ```

---

## III. Summary Checklist for Onboarding Launch

- [ ] **Mascot Reactivity**: Set mascot state triggers based on questionnaire button selections to create conversational UX.
- [ ] **Onboarding Shortcut**: Ensure the skip flow (`wantsTutorial === 'no'`) directly routes to Slide 9 (Setup Complete) without visual lag.
- [ ] **Haptics Integration**: Add `Haptics.notificationAsync(Success)` to the final step to make completion feel rewarding.
- [ ] **Fluid Transitions**: Ensure the horizontal slide offsets use `withSpring` damping ratios of `13` and stiffness `120` to prevent layout stutter on low-end devices.
