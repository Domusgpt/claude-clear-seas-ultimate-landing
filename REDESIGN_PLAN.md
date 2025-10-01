# Clear Seas Landing - Snap Hero Redesign Plan

## 🎯 Core Concept

**Fullscreen hero that snaps to center with horizontal card navigation and vertical content scrolling**

---

## User Flow:

```
1. PAGE LOAD
   ↓
   Hero snaps to fullscreen (100vh)
   Card 1 (Maritime AI) centered
   Content section below (hidden until scroll)

2. USER SWIPES LEFT (or presses ←)
   ↓
   Card slides horizontally with orthogonal depth effect
   Card 2 (4D Viz) becomes centered
   Content sections swap (Maritime → 4D)
   Background theme changes

3. USER SWIPES RIGHT (or presses →)
   ↓
   Card slides back
   Card 1 centered again
   Content swaps back

4. USER SCROLLS DOWN (or swipes down)
   ↓
   Page scrolls vertically
   Current service's content section appears
   Hero remains at top (sticky or scroll away)

5. USER CLICKS "HOME" BUTTON
   ↓
   Page snaps back to hero
   Restores last viewed card
   Ready for horizontal navigation again
```

---

## Architecture:

### HTML Structure:
```html
<body data-active-service="maritime-ai">
    <!-- Snap Container -->
    <div class="snap-container">

        <!-- Hero Snap Section (always first) -->
        <section class="hero-snap-section" id="hero">
            <!-- Horizontal Card Slider -->
            <div class="card-slider-wrapper">
                <div class="card-slider" data-current-index="0">
                    <div class="hero-card active" data-service="maritime-ai" data-index="0">
                        <!-- VIB34D canvases -->
                        <!-- Portal visualizer -->
                        <!-- Card content -->
                    </div>
                    <div class="hero-card" data-service="4d-visualization" data-index="1">
                        <!-- ... -->
                    </div>
                    <!-- ... 5 cards total -->
                </div>
            </div>

            <!-- Navigation Controls -->
            <button class="hero-nav-left">←</button>
            <button class="hero-nav-right">→</button>

            <!-- Indicator Dots -->
            <div class="hero-indicators">
                <div class="indicator active" data-index="0"></div>
                <div class="indicator" data-index="1"></div>
                <!-- ... -->
            </div>

            <!-- Scroll Hint (vertical) -->
            <div class="scroll-hint-vertical">
                <span>Scroll down to explore</span>
                <span class="arrow-down">↓</span>
            </div>
        </section>

        <!-- Content Snap Sections (one per service) -->
        <section class="content-snap-section active" data-service="maritime-ai">
            <h2>Maritime AI Navigation</h2>
            <div class="content-grid">
                <!-- Service details -->
            </div>
        </section>

        <section class="content-snap-section" data-service="4d-visualization">
            <h2>4D Polytopal Projection</h2>
            <!-- ... -->
        </section>

        <!-- ... more content sections -->

        <!-- About Section -->
        <section class="about-section">
            <!-- ... -->
        </section>

        <!-- Portfolio, Testimonials, Contact, Footer -->
        <!-- ... -->
    </div>
</body>
```

### CSS Structure:
```css
/* Snap scroll container */
.snap-container {
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
    height: 100vh;
}

/* Hero always snaps */
.hero-snap-section {
    scroll-snap-align: start;
    scroll-snap-stop: always;
    height: 100vh;
    position: relative;
    overflow: hidden;
}

/* Horizontal card slider */
.card-slider {
    display: flex;
    transition: transform 800ms var(--ease-out-expo);
    transform: translateX(calc(-100vw * var(--current-index, 0)));
}

.hero-card {
    min-width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

/* Orthogonal depth effect */
.hero-card {
    opacity: 0.3;
    transform: translateZ(-400px) scale(0.6);
    filter: blur(2px);
    transition: all 800ms var(--ease-out-expo);
}

.hero-card.active {
    opacity: 1;
    transform: translateZ(0) scale(1);
    filter: blur(0);
}

/* Content sections */
.content-snap-section {
    scroll-snap-align: start;
    min-height: 100vh;
    opacity: 0;
    visibility: hidden;
    transition: all 800ms var(--ease-out-expo);
}

.content-snap-section.active {
    opacity: 1;
    visibility: visible;
}

/* Service-specific themes */
body[data-active-service="maritime-ai"] {
    --theme-color: #00d4ff;
    --theme-bg: linear-gradient(135deg, #050812 0%, #0a1420 100%);
}

body[data-active-service="4d-visualization"] {
    --theme-color: #ff00ff;
    --theme-bg: linear-gradient(135deg, #0f0515 0%, #1a0a25 100%);
}
```

### JavaScript Logic:
```javascript
class SnapHeroSystem {
    constructor() {
        this.currentCardIndex = 0;
        this.cards = [];
        this.contentSections = [];
        this.isTransitioning = false;

        // Touch tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchThreshold = 50;
    }

    init() {
        this.setupCards();
        this.setupTouchHandlers();
        this.setupKeyboardHandlers();
        this.setupButtonHandlers();
        this.setupNavigationHooks();
    }

    // Horizontal navigation (cards)
    nextCard() {
        if (this.isTransitioning) return;
        if (this.currentCardIndex >= this.cards.length - 1) return;

        this.transitionToCard(this.currentCardIndex + 1);
    }

    prevCard() {
        if (this.isTransitioning) return;
        if (this.currentCardIndex <= 0) return;

        this.transitionToCard(this.currentCardIndex - 1);
    }

    transitionToCard(newIndex) {
        this.isTransitioning = true;

        const oldCard = this.cards[this.currentCardIndex];
        const newCard = this.cards[newIndex];

        // Update card states (active/inactive)
        oldCard.classList.remove('active');
        newCard.classList.add('active');

        // Move slider
        const slider = document.querySelector('.card-slider');
        slider.style.setProperty('--current-index', newIndex);

        // Update body theme
        const serviceId = newCard.dataset.service;
        document.body.dataset.activeService = serviceId;

        // Swap content sections
        this.updateContentSections(serviceId);

        // Apply VIB34D/portal effects
        this.applyVisualEffects(newCard, oldCard);

        this.currentCardIndex = newIndex;

        setTimeout(() => {
            this.isTransitioning = false;
        }, 800);
    }

    updateContentSections(serviceId) {
        this.contentSections.forEach(section => {
            if (section.dataset.service === serviceId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // Touch gesture handling
    setupTouchHandlers() {
        const hero = document.querySelector('.hero-snap-section');

        hero.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        hero.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe (card navigation)
                if (Math.abs(deltaX) > this.touchThreshold) {
                    if (deltaX > 0) {
                        this.prevCard(); // Swipe right
                    } else {
                        this.nextCard(); // Swipe left
                    }
                }
            }
            // Vertical swipe handled by browser (page scroll)
        });
    }

    // Keyboard handling
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // Only when hero is visible
            if (!this.isHeroVisible()) return;

            switch (e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevCard();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextCard();
                    break;
                case 'ArrowDown':
                    // Let browser handle (scroll to content)
                    break;
                case 'ArrowUp':
                    // Let browser handle (scroll to hero)
                    break;
            }
        });
    }

    // Navigation hooks (home button)
    setupNavigationHooks() {
        // Home button snaps back to hero
        const homeButton = document.querySelector('[href="#hero"]');
        if (homeButton) {
            homeButton.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('#hero').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }
    }

    isHeroVisible() {
        const hero = document.querySelector('.hero-snap-section');
        const rect = hero.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= 100;
    }
}
```

---

## Key Features:

### ✅ **Snap Scroll**
- Hero always snaps to fullscreen
- Content sections snap below
- Smooth scroll between sections

### ✅ **Horizontal Card Navigation**
- Swipe left/right (touch)
- Arrow left/right (keyboard)
- Button clicks
- Cards slide with orthogonal depth effect

### ✅ **Vertical Content Scroll**
- Swipe down (touch)
- Arrow down / scroll wheel (desktop)
- Scrolls to active service's content
- Other sections follow below

### ✅ **Theme Switching**
- Body data-attribute changes per card
- CSS variables update globally
- Content sections swap visibility
- Background gradients transition

### ✅ **Home Button Snap**
- Any navigation home button
- Scrolls smoothly back to hero
- Maintains last viewed card
- Ready for more horizontal navigation

---

## Implementation Steps:

1. ✅ **Update HTML structure**
   - Add snap container
   - Horizontal card slider
   - Content snap sections

2. ✅ **Update CSS**
   - Snap scroll setup
   - Horizontal slider transform
   - Orthogonal depth on cards
   - Theme variables on body

3. ✅ **Write new JavaScript**
   - SnapHeroSystem class
   - Touch gesture detection
   - Horizontal card transitions
   - Content section swapping

4. ✅ **Test on devices**
   - Desktop: Arrow keys + buttons
   - Mobile: Touch swipes
   - Tablet: Hybrid interaction

---

**This is the correct architecture for your vision!**
