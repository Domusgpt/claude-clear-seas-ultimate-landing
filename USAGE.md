# Clear Seas Solutions - Landing Page Usage Guide

## 🎯 Navigation Instructions

### Hero Section - Orthogonal Scroll Navigation

The hero section features **scroll-based card progression** - the signature innovation of this landing page!

#### How to Navigate:

**1. Scroll/Mousewheel** (Primary Method)
- Position your cursor over the hero section
- Scroll down to navigate to the next service card
- Scroll up to navigate to the previous service card
- Cards transition through Z-axis depth with 800ms smooth animations

**Scroll Behavior:**
- **Scroll accumulator**: 120px threshold triggers transition
- **Velocity tracking**: Fast scrolls create momentum
- **Decay**: Gradual slowdown for natural feel
- **Boundary awareness**: At first card, scroll up continues to page top. At last card, scroll down continues to next section

**2. Keyboard Navigation**
- `↓` Arrow Down or `Space` - Next card
- `↑` Arrow Up - Previous card
- `Home` - Jump to first card
- `End` - Jump to last card

**3. Button/Indicator Navigation**
- Click **arrow buttons** (← →) on sides
- Click **indicator dots** at bottom center
- Touch/tap on mobile devices

---

## 🎨 Visual Feedback

### What You'll See:

**Card States:**
- **Background** (-800px depth, 30% scale, blurred) - Cards waiting in queue
- **Approaching** (-400px depth, 60% scale) - Transition state (400ms)
- **Focused** (0px depth, 100% scale, full opacity) - Current active card
- **Exiting** (transitioning back) - Previous focused card

**VIB34D Visualizers:**
- WebGL 4D geometric rendering on main canvas
- Accent canvas with color-dodge blend mode
- 11 geometry types cycling through presets
- Real-time parameter tuning during transitions

**Portal Text Visualizers:**
- Canvas 2D overlay with quantum/holographic/faceted modes
- Pulse effects synchronized with VIB34D
- Trait inheritance from preset library

**Multi-Layer Glows:**
- Primary glow (cyan/magenta based on service)
- Secondary glow (complementary color)
- Border glow (rotating gradient, 8s cycle)
- Pulse animations (4s cycle)

**Background Reactions:**
- Holographic field parallax shifts
- Energy boost on transitions
- Twist rotation effects
- Particle field speed bursts

---

## 🖱️ Interaction Flow

### User Journey:

1. **Page Load**
   - First card (Maritime AI) in focus
   - VIB34D visualizer initializes
   - Portal visualizer starts rendering
   - Particle field begins floating
   - Scroll hint pulses at bottom

2. **User Scrolls Down**
   ```
   Scroll delta: +50px
   Accumulator: 50px (below 120px threshold)
   → No action, accumulator decays

   Scroll delta: +80px
   Accumulator: 130px (exceeds 120px threshold!)
   → Transition to next card triggered
   → Accumulator resets to 0
   ```

3. **Card Transition Sequence** (800ms total)
   ```
   T+0ms:
   - Old card: focused → exiting
   - New card: background → approaching
   - Other cards: remain background

   T+400ms:
   - New card: approaching → focused
   - Old card: exiting → background
   - VIB34D: apply "focus-primary" preset
   - Portal: intensity 0.85, trait boost
   - Glow: shift -18px, intensity 0.8

   Partner card (old):
   - VIB34D: apply "inherit-primary" preset
   - Portal: intensity 0.45
   - Glow: shift 10px, intensity 0.35

   Background field:
   - Parallax: (0.15, -0.22)
   - Energy: 0.75
   - Twist: 0.35deg

   Particle field:
   - Speed boost: 2.0x for 1.5s

   T+800ms:
   - Transition complete
   - User can scroll again
   ```

4. **Reaching Boundaries**
   - **At first card + scroll up**: Hero section releases scroll, page scrolls up normally
   - **At last card + scroll down**: Hero section releases scroll, page scrolls to "About" section

---

## 💡 Tips for Best Experience

### Performance:
- **Desktop**: Full 60fps with all effects
- **Mobile**: Optimized animations, touch-friendly navigation
- **Low-power mode**: Reduced particle count, simplified glows

### Accessibility:
- **Reduced motion**: All animations can be disabled via OS preference
- **Keyboard only**: Full navigation without mouse
- **Screen readers**: Proper ARIA labels on all interactive elements

### Browser Compatibility:
- **Best**: Chrome/Edge 90+, Firefox 88+, Safari 14+
- **Required**: WebGL 1.0, CSS 3D transforms, Canvas 2D
- **Fallback**: If WebGL unavailable, visualizers remain blank but layout intact

---

## 🔧 Technical Details

### Scroll Accumulator Algorithm:

```javascript
// On wheel event:
scrollAccumulator += wheelDelta;

// Check threshold:
if (Math.abs(scrollAccumulator) > 120) {
    const direction = scrollAccumulator > 0 ? 1 : -1;

    if (direction > 0 && currentIndex < maxIndex) {
        nextCard();
    } else if (direction < 0 && currentIndex > 0) {
        prevCard();
    }

    scrollAccumulator = 0;
    momentum *= 0.65;
    velocity *= 0.5;
} else {
    // Decay:
    scrollAccumulator *= 0.9;
    velocity *= 0.72;
    momentum *= 0.82;
}
```

### Intersection Observer:

```javascript
// Only capture scroll when hero is 50%+ visible:
IntersectionObserver({
    threshold: 0.5
});

// When hero enters view:
isHeroInView = true;

// When hero leaves view:
isHeroInView = false;
scrollAccumulator = 0; // Reset
```

### Event Coordination:

```javascript
// Dual response system:
DualResponsePlanner.plan('focus', primaryCard, partnerCard)
→ Returns blueprint with:
    - primary.vib34d: { preset, duration }
    - primary.portal: { intensity, traitBoost }
    - primary.glow: { offsetY, intensity }
    - partner.* (counter-reactions)
    - background: { offsetX, offsetY, energy, twist }

// Apply to all targets simultaneously:
applyCardResponse(primaryCard, primary);
applyCardResponse(partnerCard, partner);
ambientField.applyImpulse(background);
particleField.energyBoost(1500, 2.0);
```

---

## 🎬 Demo Scenarios

### Scenario 1: Quick Browse
```
User scrolls rapidly through all 5 cards
→ High velocity = increased momentum
→ Smooth rapid transitions
→ Background field reacts with energy boosts
→ Particle field bursts with each transition
Result: Fluid showcase of all services in <10s
```

### Scenario 2: Detailed Exploration
```
User scrolls slowly to card 2
→ Pauses to read content
→ VIB34D visualizer continues animating
→ Portal effects pulse gently
→ User clicks "Learn More" CTA
→ Smooth scroll to About section
Result: Immersive service exploration
```

### Scenario 3: Keyboard Power User
```
User presses Home key
→ Jumps to card 1 instantly
User presses ↓ ↓ ↓ rapidly
→ Cards progress with keyboard rhythm
User presses End key
→ Jumps to card 5
Result: Efficient navigation for accessibility users
```

---

## 🌟 A Paul Phillips Manifestation

**Philosophy**: "The Revolution Will Not be in a Structured Format"

The orthogonal scroll navigation embodies this philosophy:
- **Unexpected**: Scroll captures within a section, not global page scroll
- **Intuitive**: Natural scrolling motion, familiar interaction
- **Immersive**: Z-axis depth creates 3D spatial progression
- **Coordinated**: Every element reacts holistically to user input

**Contact**: Paul@clearseassolutions.com
**Movement**: https://parserator.com

© 2025 Paul Phillips - Clear Seas Solutions LLC - All Rights Reserved
