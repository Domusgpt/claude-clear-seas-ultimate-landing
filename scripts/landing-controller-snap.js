/**
 * Clear Seas Solutions - Landing Page Controller (Snap Edition)
 * Orchestrates Snap Hero System, VIB34D visualizers, and all interactions
 * A Paul Phillips Manifestation
 */

class LandingControllerSnap {
    constructor() {
        // System components
        this.snapHero = null;
        this.vib34dVisualizers = new Map();
        this.portalVisualizers = new Map();
        this.ambientField = null;
        this.particleField = null;
        this.responsePlanner = null;

        // State
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        console.log('🌊 Clear Seas Solutions - Initializing Snap Landing Page...');

        // Initialize components
        this.initParticleField();
        this.initAmbientField();
        this.initSnapHero();
        this.initResponsePlanner();
        await this.initVIB34DVisualizers();
        this.initPortalVisualizers();
        this.bindEvents();

        this.initialized = true;
        console.log('✨ Clear Seas Solutions - Snap landing page fully initialized!');
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

    initSnapHero() {
        if (typeof SnapHeroSystem === 'undefined') {
            console.warn('SnapHeroSystem not loaded');
            return;
        }

        this.snapHero = new SnapHeroSystem();
        this.snapHero.init();

        // Register callback for card changes
        this.snapHero.onCardChange((oldIndex, newIndex, oldCard, newCard) => {
            this.handleCardTransition(oldIndex, newIndex, oldCard, newCard);
        });

        console.log('✓ Snap Hero System initialized');
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

        const cards = document.querySelectorAll('.hero-card');

        // VIB34D unique settings per card (complementary configurations)
        const vib34dConfigs = [
            { system: 'quantum', geometry: 'hypercube', destruction: 'quantum' },
            { system: 'holographic', geometry: 'klein', destruction: 'holographic' },
            { system: 'quantum', geometry: 'tesseract', destruction: 'quantum' },
            { system: 'holographic', geometry: 'torus', destruction: 'holographic' },
            { system: 'quantum', geometry: 'fractal', destruction: 'quantum' }
        ];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const mainCanvas = card.querySelector('.vib34d-tilt-canvas');
            const accentCanvas = card.querySelector('.vib34d-accent-canvas');

            if (!mainCanvas || !accentCanvas) continue;

            const config = vib34dConfigs[i] || vib34dConfigs[0];

            // Create visualizer instance
            const visualizer = new VIB34DTiltVisualizer(mainCanvas, {
                system: config.system,
                destructionType: config.destruction,
                accentCanvas: accentCanvas,
                tiltEnabled: false,
                audioEnabled: false
            });

            // Initialize visualizer
            await visualizer.init();

            // Store reference
            const cardId = card.dataset.service || `card-${i}`;
            this.vib34dVisualizers.set(cardId, visualizer);

            console.log(`✓ VIB34D visualizer initialized for ${cardId} (${config.system}/${config.geometry})`);
        }
    }

    initPortalVisualizers() {
        if (typeof PortalTextVisualizer === 'undefined') {
            console.warn('PortalTextVisualizer not loaded');
            return;
        }

        const cards = document.querySelectorAll('.hero-card');

        // Portal configurations (complementary to VIB34D)
        const portalSystems = ['quantum', 'holographic', 'quantum', 'holographic', 'quantum'];

        cards.forEach((card, i) => {
            const portalContainer = card.querySelector('.portal-text-visualizer');
            if (!portalContainer) return;

            const system = portalSystems[i] || 'quantum';
            const portal = new PortalTextVisualizer(portalContainer, { system });
            portal.setIntensity(0.5);
            portal.startRenderLoop();

            const cardId = card.dataset.service || `card-${i}`;
            this.portalVisualizers.set(cardId, portal);

            console.log(`✓ Portal visualizer initialized for ${cardId} (${system})`);
        });
    }

    bindEvents() {
        // Scroll handling
        this.bindScrollEvents();

        // Testimonial carousel
        this.bindTestimonialCarousel();

        // Contact form
        this.bindContactForm();

        console.log('✓ All event handlers bound');
    }

    handleCardTransition(oldIndex, newIndex, oldCard, newCard) {
        console.log(`🎨 Handling card transition: ${oldIndex} → ${newIndex}`);

        const oldCardId = oldCard.dataset.service || `card-${oldIndex}`;
        const newCardId = newCard.dataset.service || `card-${newIndex}`;

        // Plan dual response
        if (this.responsePlanner) {
            const plan = this.responsePlanner.plan('focus', newCard, oldCard);

            // Apply to primary card (new focused card)
            this.applyCardResponse(newCardId, newCard, plan.primary);

            // Apply to partner card (old card)
            if (plan.partner) {
                this.applyCardResponse(oldCardId, oldCard, plan.partner);
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

    applyCardResponse(cardId, card, response) {
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
        document.querySelectorAll('.content-section, .about-section').forEach((section) => {
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
        const controller = new LandingControllerSnap();
        controller.init();
    });
} else {
    const controller = new LandingControllerSnap();
    controller.init();
}

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingControllerSnap;
}
