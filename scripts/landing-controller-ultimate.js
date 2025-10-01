/**
 * Clear Seas Solutions - Landing Page Controller (Ultimate Edition)
 * Orchestrates VIB34D visualizers, orthogonal progression, and all interactions
 * A Paul Phillips Manifestation
 */

class LandingController {
    constructor() {
        // System components
        this.vib34dVisualizers = new Map();
        this.portalVisualizers = new Map();
        this.orthogonalProgression = null;
        this.ambientField = null;
        this.particleField = null;
        this.responsePlanner = null;

        // State
        this.initialized = false;
        this.cards = [];
        this.currentCardIndex = 0;
    }

    async init() {
        if (this.initialized) return;

        console.log('🌊 Clear Seas Solutions - Initializing Ultimate Landing Page...');

        // Initialize components
        this.initParticleField();
        this.initAmbientField();
        this.initOrthogonalProgression();
        this.initResponsePlanner();
        await this.initVIB34DVisualizers();
        this.initPortalVisualizers();
        this.bindEvents();

        this.initialized = true;
        console.log('✨ Clear Seas Solutions - Landing page fully initialized!');
    }

    initParticleField() {
        const canvas = document.getElementById('particle-field-canvas');
        if (!canvas) {
            console.warn('Particle field canvas not found');
            return;
        }

        if (typeof ParticleFieldSystem === 'undefined') {
            console.warn('ParticleFieldSystem not loaded');
            return;
        }

        this.particleField = new ParticleFieldSystem(canvas);
        console.log('✓ Particle field initialized');
    }

    initAmbientField() {
        const field = document.querySelector('.holographic-background-field');
        if (!field) {
            console.warn('Holographic background field not found');
            return;
        }

        if (typeof AmbientBackgroundField === 'undefined') {
            console.warn('AmbientBackgroundField not loaded');
            return;
        }

        this.ambientField = new AmbientBackgroundField(field);
        console.log('✓ Ambient background field initialized');
    }

    initOrthogonalProgression() {
        const container = document.querySelector('.orthogonal-hero-container');
        if (!container) {
            console.warn('Orthogonal hero container not found');
            return;
        }

        if (typeof OrthogonalDepthProgression === 'undefined') {
            console.warn('OrthogonalDepthProgression not loaded');
            return;
        }

        this.orthogonalProgression = new OrthogonalDepthProgression(container);
        this.orthogonalProgression.init();
        this.cards = Array.from(container.querySelectorAll('.hero-card'));
        console.log(`✓ Orthogonal progression initialized with ${this.cards.length} cards`);
    }

    initResponsePlanner() {
        if (typeof OrthogonalDualResponsePlanner === 'undefined') {
            console.warn('OrthogonalDualResponsePlanner not loaded');
            return;
        }

        this.responsePlanner = new OrthogonalDualResponsePlanner();
        console.log('✓ Dual response planner initialized');
    }

    async initVIB34DVisualizers() {
        if (typeof VIB34DTiltVisualizer === 'undefined') {
            console.warn('VIB34DTiltVisualizer not loaded - visualizers will not function');
            return;
        }

        // Initialize VIB34D visualizer for each card
        for (const card of this.cards) {
            const mainCanvas = card.querySelector('.vib34d-tilt-canvas');
            const accentCanvas = card.querySelector('.vib34d-accent-canvas');

            if (!mainCanvas || !accentCanvas) continue;

            // Get system type from data attribute
            const system = card.dataset.vib34d || 'quantum';
            const destructionType = card.dataset.destruction || system;

            // Create visualizer instance
            const visualizer = new VIB34DTiltVisualizer(mainCanvas, {
                system: system,
                destructionType: destructionType,
                accentCanvas: accentCanvas,
                tiltEnabled: false, // Disable device tilt for landing page
                audioEnabled: false  // Disable audio for landing page
            });

            // Initialize visualizer
            await visualizer.init();

            // Store reference
            const cardId = card.dataset.service || `card-${this.cards.indexOf(card)}`;
            this.vib34dVisualizers.set(cardId, visualizer);

            console.log(`✓ VIB34D visualizer initialized for ${cardId} (${system})`);
        }
    }

    initPortalVisualizers() {
        if (typeof PortalTextVisualizer === 'undefined') {
            console.warn('PortalTextVisualizer not loaded');
            return;
        }

        // Initialize portal visualizer for each card
        this.cards.forEach((card) => {
            const portalContainer = card.querySelector('.portal-text-visualizer');
            if (!portalContainer) return;

            const system = card.dataset.vib34d || 'quantum';
            const portal = new PortalTextVisualizer(portalContainer, { system });
            portal.setIntensity(0.5);
            portal.startRenderLoop();

            const cardId = card.dataset.service || `card-${this.cards.indexOf(card)}`;
            this.portalVisualizers.set(cardId, portal);

            console.log(`✓ Portal visualizer initialized for ${cardId} (${system})`);
        });
    }

    bindEvents() {
        // Navigation controls
        this.bindNavigation();

        // Hero card interactions
        this.bindHeroCardEvents();

        // Scroll handling
        this.bindScrollEvents();

        // Testimonial carousel
        this.bindTestimonialCarousel();

        // Contact form
        this.bindContactForm();

        console.log('✓ All event handlers bound');
    }

    bindNavigation() {
        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    bindHeroCardEvents() {
        // Previous/Next buttons
        const prevBtn = document.querySelector('.hero-nav-prev');
        const nextBtn = document.querySelector('.hero-nav-next');

        if (prevBtn && this.orthogonalProgression) {
            prevBtn.addEventListener('click', () => {
                this.orthogonalProgression.prev();
                this.handleCardTransition(this.currentCardIndex, this.orthogonalProgression.currentIndex);
            });
        }

        if (nextBtn && this.orthogonalProgression) {
            nextBtn.addEventListener('click', () => {
                this.orthogonalProgression.next();
                this.handleCardTransition(this.currentCardIndex, this.orthogonalProgression.currentIndex);
            });
        }

        // Card indicator dots
        const indicators = document.querySelectorAll('.hero-indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                if (this.orthogonalProgression) {
                    this.orthogonalProgression.goTo(index);
                    this.handleCardTransition(this.currentCardIndex, index);
                }
            });
        });

        // Card CTA buttons
        this.cards.forEach((card) => {
            const cta = card.querySelector('.card-cta');
            if (cta) {
                cta.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleCardCTAClick(card);
                });
            }
        });
    }

    handleCardTransition(oldIndex, newIndex) {
        if (oldIndex === newIndex) return;

        this.currentCardIndex = newIndex;

        // Update indicators
        document.querySelectorAll('.hero-indicator').forEach((indicator, index) => {
            if (index === newIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        // Get cards
        const oldCard = this.cards[oldIndex];
        const newCard = this.cards[newIndex];

        // Plan dual response
        if (this.responsePlanner) {
            const plan = this.responsePlanner.plan('focus', newCard, oldCard);

            // Apply to primary card (new focused card)
            this.applyCardResponse(newCard, plan.primary);

            // Apply to partner card (old card)
            if (plan.partner) {
                this.applyCardResponse(oldCard, plan.partner);
            }

            // Apply to background field
            if (this.ambientField && plan.background) {
                this.ambientField.applyImpulse(plan.background);
            }

            // Particle field energy boost
            if (this.particleField) {
                this.particleField.energyBoost(1500, 2.0);
            }
        }
    }

    applyCardResponse(card, response) {
        const cardId = card.dataset.service || `card-${this.cards.indexOf(card)}`;

        // Apply VIB34D preset
        if (response.vib34d && this.vib34dVisualizers.has(cardId)) {
            const visualizer = this.vib34dVisualizers.get(cardId);
            visualizer.applyInteractionResponse({
                preset: response.vib34d.preset,
                duration: response.vib34d.duration
            });
        }

        // Apply portal changes
        if (response.portal && this.portalVisualizers.has(cardId)) {
            const portal = this.portalVisualizers.get(cardId);
            if (response.portal.intensity !== undefined) {
                portal.setIntensity(response.portal.intensity);
            }
            if (response.portal.traitBoost) {
                portal.inheritTrait(response.portal.traitBoost);
            }
        }

        // Apply glow effects
        if (response.glow) {
            const glowX = response.glow.offsetX || 0;
            const glowY = response.glow.offsetY || 0;
            const intensity = response.glow.intensity || 0.6;

            card.style.setProperty('--card-glow-x', `${glowX}px`);
            card.style.setProperty('--card-glow-y', `${glowY}px`);
            card.style.setProperty('--card-glow-intensity', intensity);
        }
    }

    handleCardCTAClick(card) {
        // Scroll to about section (or service-specific content)
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Could also show service-specific modal or content here
        console.log('CTA clicked for:', card.dataset.service);
    }

    bindScrollEvents() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        // Parallax effect on holographic field
        if (this.ambientField) {
            const scrollProgress = Math.min(scrollY / viewportHeight, 1);
            this.ambientField.applyImpulse({
                offsetX: scrollProgress * 0.1,
                offsetY: -scrollProgress * 0.15,
                energy: 0.3 + scrollProgress * 0.3,
                twist: scrollProgress * 0.1
            });
        }

        // Fade in sections on scroll
        document.querySelectorAll('.content-section').forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top < viewportHeight * 0.8) {
                section.classList.add('visible');
            }
        });
    }

    bindTestimonialCarousel() {
        const carousel = document.querySelector('.testimonial-carousel');
        if (!carousel) return;

        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const items = carousel.querySelectorAll('.testimonial-item');
        let currentIndex = 0;

        const showTestimonial = (index) => {
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + items.length) % items.length;
                showTestimonial(currentIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % items.length;
                showTestimonial(currentIndex);
            });
        }

        // Auto-advance every 8 seconds
        setInterval(() => {
            currentIndex = (currentIndex + 1) % items.length;
            showTestimonial(currentIndex);
        }, 8000);

        // Show first testimonial
        showTestimonial(0);
    }

    bindContactForm() {
        const form = document.querySelector('.contact-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Contact form submitted:', data);

            // Show success message
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Message Sent! ✓';
                submitBtn.disabled = true;

                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    form.reset();
                }, 3000);
            }

            // In production, send to backend API
            // await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) });
        });
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const controller = new LandingController();
        controller.init();
    });
} else {
    const controller = new LandingController();
    controller.init();
}

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingController;
}
