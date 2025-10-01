/**
 * Clear Seas Solutions - Snap Hero System
 * Horizontal card navigation with snap scroll and touch gestures
 * A Paul Phillips Manifestation
 */

class SnapHeroSystem {
    constructor() {
        // Card management
        this.currentCardIndex = 0;
        this.cards = [];
        this.totalCards = 0;

        // Content sections
        this.contentSections = [];

        // DOM elements
        this.slider = null;
        this.indicators = [];
        this.navLeftBtn = null;
        this.navRightBtn = null;

        // State flags
        this.isTransitioning = false;

        // Touch tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchThreshold = 50;

        // Callbacks for integration
        this.onCardChangeCallback = null;
    }

    init() {
        console.log('🎯 Initializing Snap Hero System...');

        // Get DOM elements
        this.slider = document.querySelector('.card-slider');
        this.cards = Array.from(document.querySelectorAll('.hero-card'));
        this.contentSections = Array.from(document.querySelectorAll('.content-snap-section'));
        this.indicators = Array.from(document.querySelectorAll('.hero-indicator'));
        this.navLeftBtn = document.querySelector('.hero-nav-left');
        this.navRightBtn = document.querySelector('.hero-nav-right');

        if (!this.slider || this.cards.length === 0) {
            console.error('❌ Snap Hero System: Required elements not found');
            return;
        }

        this.totalCards = this.cards.length;

        // Setup event handlers
        this.setupButtonHandlers();
        this.setupIndicatorHandlers();
        this.setupKeyboardHandlers();
        this.setupTouchHandlers();
        this.setupNavigationHooks();

        // Set initial state
        this.updateCardStates();
        this.updateContentSections();

        console.log(`✅ Snap Hero System initialized with ${this.totalCards} cards`);
    }

    // =======================
    // NAVIGATION METHODS
    // =======================

    next() {
        if (this.isTransitioning) return;
        if (this.currentCardIndex >= this.totalCards - 1) return;

        this.transitionToCard(this.currentCardIndex + 1);
    }

    prev() {
        if (this.isTransitioning) return;
        if (this.currentCardIndex <= 0) return;

        this.transitionToCard(this.currentCardIndex - 1);
    }

    goTo(index) {
        if (this.isTransitioning) return;
        if (index < 0 || index >= this.totalCards) return;
        if (index === this.currentCardIndex) return;

        this.transitionToCard(index);
    }

    transitionToCard(newIndex) {
        this.isTransitioning = true;

        const oldIndex = this.currentCardIndex;
        const oldCard = this.cards[oldIndex];
        const newCard = this.cards[newIndex];

        console.log(`🔄 Transitioning from card ${oldIndex} to ${newIndex}`);

        // Update slider transform
        this.slider.style.setProperty('--current-index', newIndex);

        // Update card states
        this.currentCardIndex = newIndex;
        this.updateCardStates();

        // Update indicators
        this.updateIndicators();

        // Update body theme
        const serviceId = newCard.dataset.service;
        document.body.dataset.activeService = serviceId;

        // Update content sections
        this.updateContentSections();

        // Trigger callback for VIB34D and other visual effects
        if (this.onCardChangeCallback) {
            this.onCardChangeCallback(oldIndex, newIndex, oldCard, newCard);
        }

        // Reset transition flag after animation completes
        setTimeout(() => {
            this.isTransitioning = false;
        }, 800);
    }

    // =======================
    // STATE UPDATE METHODS
    // =======================

    updateCardStates() {
        this.cards.forEach((card, index) => {
            if (index === this.currentCardIndex) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    updateIndicators() {
        this.indicators.forEach((indicator, index) => {
            if (index === this.currentCardIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    updateContentSections() {
        const activeService = this.cards[this.currentCardIndex].dataset.service;

        this.contentSections.forEach(section => {
            if (section.dataset.service === activeService) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        console.log(`📄 Content switched to: ${activeService}`);
    }

    // =======================
    // EVENT HANDLERS
    // =======================

    setupButtonHandlers() {
        if (this.navLeftBtn) {
            this.navLeftBtn.addEventListener('click', () => {
                this.prev();
            });
        }

        if (this.navRightBtn) {
            this.navRightBtn.addEventListener('click', () => {
                this.next();
            });
        }
    }

    setupIndicatorHandlers() {
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goTo(index);
            });
        });
    }

    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // Only respond when hero is in view
            if (!this.isHeroVisible()) return;

            switch (e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goTo(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goTo(this.totalCards - 1);
                    break;
            }
        });
    }

    setupTouchHandlers() {
        const heroSection = document.querySelector('.hero-snap-section');
        if (!heroSection) return;

        heroSection.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        heroSection.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe (card navigation)
                if (Math.abs(deltaX) > this.touchThreshold) {
                    if (deltaX > 0) {
                        this.prev(); // Swipe right
                    } else {
                        this.next(); // Swipe left
                    }
                }
            }
            // Vertical swipe handled by browser (page scroll)
        }, { passive: true });
    }

    setupNavigationHooks() {
        // Home button snaps back to hero
        const homeLinks = document.querySelectorAll('.nav-link-home, a[href="#hero"]');
        homeLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const heroSection = document.querySelector('#hero');
                if (heroSection) {
                    heroSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // =======================
    // UTILITY METHODS
    // =======================

    isHeroVisible() {
        const heroSection = document.querySelector('.hero-snap-section');
        if (!heroSection) return false;

        const rect = heroSection.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= 100;
    }

    // Set callback for card change events
    onCardChange(callback) {
        this.onCardChangeCallback = callback;
    }

    // Get current card data
    getCurrentCard() {
        return {
            index: this.currentCardIndex,
            card: this.cards[this.currentCardIndex],
            service: this.cards[this.currentCardIndex]?.dataset.service
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnapHeroSystem;
}
