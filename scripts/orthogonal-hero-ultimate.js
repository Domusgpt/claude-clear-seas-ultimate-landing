/**
 * Clear Seas Solutions - Orthogonal Hero System (Ultimate Edition)
 * Simplified extraction for landing page with VIB34D integration
 * A Paul Phillips Manifestation
 */

// ===== PORTAL TEXT VISUALIZER (Preserved 100% from original) =====

class PortalTextVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.system = (options.system || 'quantum').toLowerCase();
        this.portalIntensity = 0.3;
        this.portalPulse = 0.3;
        this.portalRotation = 0;
        this.isRunning = false;
        this.animationId = null;
        this.inheritedTrait = null;

        // Resize observer
        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(this.container);
        this.resizeCanvas();
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.context.scale(dpr, dpr);
    }

    inheritTrait(trait) {
        if (!trait || typeof trait !== 'object') {
            this.inheritedTrait = null;
            return;
        }
        this.inheritedTrait = { ...trait };
        this.portalPulse = typeof trait.portalPulse === 'number'
            ? Math.max(0.2, Math.min(1.2, trait.portalPulse))
            : 0.3;
    }

    setIntensity(value) {
        this.portalIntensity = Math.max(0, Math.min(1, value));
    }

    startRenderLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stopRenderLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isRunning) return;
        this.render();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    render() {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = w / 2;
        const centerY = h / 2;

        // Clear canvas
        this.context.clearRect(0, 0, w, h);

        // Get palette from trait
        const palette = this.computePalette();
        const moireBoost = this.inheritedTrait?.moireBoost || 0;
        const glitchBoost = this.inheritedTrait?.glitchBoost || 0;
        const flourish = Math.max(0, moireBoost + glitchBoost) * 0.5;

        // Update rotation
        this.portalRotation += 0.004 + this.portalPulse * 0.002;

        // Render based on system type
        if (this.system === 'quantum') {
            this.renderQuantumPortal(this.context, centerX, centerY, this.portalIntensity, palette, moireBoost, glitchBoost, flourish);
        } else if (this.system === 'holographic') {
            this.renderHolographicPortal(this.context, centerX, centerY, this.portalIntensity, palette, moireBoost, glitchBoost, flourish);
        } else if (this.system === 'faceted') {
            this.renderFacetedPortal(this.context, centerX, centerY, this.portalIntensity, palette, moireBoost, glitchBoost, flourish);
        }
    }

    computePalette() {
        const hueShift = this.inheritedTrait?.hueShift || 0;
        const accentShift = this.inheritedTrait?.accentShift || 0;

        const basePalettes = {
            quantum: { hue: 278, accent: 208 },
            holographic: { hue: 330, accent: 182 },
            faceted: { hue: 202, accent: 150 }
        };

        const base = basePalettes[this.system] || basePalettes.quantum;
        return {
            hue: this.normalizeHue(base.hue + hueShift),
            accent: this.normalizeHue(base.accent + accentShift)
        };
    }

    renderQuantumPortal(ctx, centerX, centerY, intensity, palette, moireBoost, glitchBoost, flourish) {
        const rings = 6 + Math.round((moireBoost + flourish) * 3);
        const maxRadius = Math.min(centerX, centerY) * (0.75 + flourish * 0.25);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < rings; i++) {
            const progress = rings <= 1 ? 0 : i / (rings - 1);
            const radius = maxRadius * intensity * (0.3 + progress * 0.7) * (1 + this.portalPulse * 0.15 + flourish * 0.2);
            const alpha = (0.25 + flourish * 0.2) * (1 - progress * 0.3);
            const rotation = this.portalRotation * (1 + i * 0.1);

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);

            // Draw concentric ring
            ctx.strokeStyle = `hsla(${this.normalizeHue(palette.hue + progress * 40)}, 85%, 70%, ${alpha})`;
            ctx.lineWidth = 1.5 + glitchBoost * 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw accent dash ring
            ctx.save();
            ctx.setLineDash([6, 14]);
            ctx.lineWidth = 0.8 + progress * 1.5;
            ctx.strokeStyle = `hsla(${palette.accent + progress * 30}, 80%, 78%, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, 0, radius * (1 + glitchBoost * 0.1), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            ctx.restore();
        }

        ctx.restore();
    }

    renderHolographicPortal(ctx, centerX, centerY, intensity, palette, moireBoost, glitchBoost, flourish) {
        const segments = 12 + Math.round((moireBoost + flourish) * 4);
        const maxRadius = Math.min(centerX, centerY) * (0.7 + flourish * 0.2);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.portalRotation * 0.7);

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const nextAngle = ((i + 1) / segments) * Math.PI * 2;
            const radius = maxRadius * intensity * (0.6 + this.portalPulse * 0.25 + flourish * 0.2);

            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(nextAngle) * radius;
            const y2 = Math.sin(nextAngle) * radius;

            const gradient = ctx.createLinearGradient(0, 0, x1, y1);
            gradient.addColorStop(0, `hsla(${palette.hue}, 80%, 65%, 0.1)`);
            gradient.addColorStop(1, `hsla(${this.normalizeHue(palette.accent + i * 8)}, 85%, 70%, ${0.25 + flourish * 0.15})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.2 + glitchBoost * 0.8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        }

        // Central glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.3);
        glowGradient.addColorStop(0, `hsla(${palette.accent}, 100%, 75%, ${0.3 + this.portalPulse * 0.2})`);
        glowGradient.addColorStop(1, `hsla(${palette.hue}, 90%, 65%, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.fillRect(-maxRadius, -maxRadius, maxRadius * 2, maxRadius * 2);

        ctx.restore();
    }

    renderFacetedPortal(ctx, centerX, centerY, intensity, palette, moireBoost, glitchBoost, flourish) {
        const facets = 10 + Math.round((moireBoost + flourish) * 4);
        const maxRadius = Math.min(centerX, centerY) * (0.7 + flourish * 0.2);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.portalRotation * (0.8 + flourish * 0.4));

        for (let i = 0; i < facets; i++) {
            const baseAngle = (i / facets) * Math.PI * 2;
            const nextAngle = ((i + 1) / facets) * Math.PI * 2;
            const radius = maxRadius * intensity * (0.5 + this.portalPulse * 0.25 + flourish * 0.25);
            const hue = this.normalizeHue(palette.hue + i * 8);

            ctx.strokeStyle = `hsla(${hue}, 80%, 66%, ${0.45 + flourish * 0.25})`;
            ctx.fillStyle = `hsla(${this.normalizeHue(palette.accent)}, 85%, 68%, ${0.14 + flourish * 0.1})`;
            ctx.lineWidth = 1.6 + glitchBoost * 0.6;

            const x1 = Math.cos(baseAngle) * radius * (1 + glitchBoost * 0.08);
            const y1 = Math.sin(baseAngle) * radius * (1 + glitchBoost * 0.08);
            const x2 = Math.cos(nextAngle) * radius;
            const y2 = Math.sin(nextAngle) * radius;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();

            ctx.fill();
            ctx.stroke();
        }

        // Central ring
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${this.normalizeHue(palette.accent)}, 92%, 78%, ${0.35 + this.portalPulse * 0.3})`;
        ctx.lineWidth = 1.4 + this.portalPulse * 1.2;
        ctx.arc(0, 0, maxRadius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    normalizeHue(value) {
        return ((value % 360) + 360) % 360;
    }

    destroy() {
        this.stopRenderLoop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.context = null;
        this.inheritedTrait = null;
    }
}

// ===== AMBIENT BACKGROUND FIELD (Preserved from original) =====

class AmbientBackgroundField {
    constructor(root) {
        this.root = root || document.body;
        this.resetTimer = null;
    }

    applyImpulse({ offsetX = 0, offsetY = 0, energy = 0.3, twist = 0 } = {}) {
        if (!this.root) return;
        const x = (offsetX || 0) * 60;
        const y = (offsetY || 0) * 60;
        const energyClamp = Math.max(0, Math.min(1.2, energy));

        this.root.style.setProperty('--bg-parallax-x', `${x.toFixed(2)}px`);
        this.root.style.setProperty('--bg-parallax-y', `${y.toFixed(2)}px`);
        this.root.style.setProperty('--bg-scale', (1 + energyClamp * 0.18).toFixed(3));
        this.root.style.setProperty('--bg-energy', (0.5 + energyClamp * 0.45).toFixed(3));
        this.root.style.setProperty('--bg-twist', `${(twist || 0) * 32}deg`);

        clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => this.reset(), 760);
    }

    reset(energy = 0.5) {
        if (!this.root) return;
        this.root.style.setProperty('--bg-parallax-x', '0px');
        this.root.style.setProperty('--bg-parallax-y', '0px');
        this.root.style.setProperty('--bg-scale', '1.0');
        this.root.style.setProperty('--bg-energy', energy.toFixed(3));
        this.root.style.setProperty('--bg-twist', '0deg');
    }

    destroy() {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
    }
}

// ===== ORTHOGONAL DEPTH PROGRESSION (Simplified for Landing Page) =====

class OrthogonalDepthProgression {
    constructor(container, options = {}) {
        this.container = container;
        this.cards = Array.from(container.querySelectorAll('.hero-card'));
        this.currentIndex = 0;
        this.isTransitioning = false;

        // Card states map
        this.cardStates = ['background', 'approaching', 'focused', 'exiting', 'background'];
    }

    init() {
        // Set initial states
        this.cards.forEach((card, index) => {
            if (index === this.currentIndex) {
                card.classList.add('focused');
                card.classList.remove('background', 'approaching', 'exiting');
            } else {
                card.classList.add('background');
                card.classList.remove('focused', 'approaching', 'exiting');
            }
        });
    }

    next() {
        if (this.isTransitioning || this.currentIndex >= this.cards.length - 1) return;
        this.transition(this.currentIndex + 1);
    }

    prev() {
        if (this.isTransitioning || this.currentIndex <= 0) return;
        this.transition(this.currentIndex - 1);
    }

    goTo(index) {
        if (this.isTransitioning || index === this.currentIndex) return;
        if (index < 0 || index >= this.cards.length) return;
        this.transition(index);
    }

    transition(newIndex) {
        this.isTransitioning = true;
        const oldIndex = this.currentIndex;
        const oldCard = this.cards[oldIndex];
        const newCard = this.cards[newIndex];

        // Remove all state classes from all cards
        this.cards.forEach(card => {
            card.classList.remove('background', 'approaching', 'focused', 'exiting');
        });

        // Old card exits
        oldCard.classList.add('exiting');

        // New card approaches then focuses
        newCard.classList.add('approaching');

        // Set background cards
        this.cards.forEach((card, index) => {
            if (index !== oldIndex && index !== newIndex) {
                card.classList.add('background');
            }
        });

        // After 400ms, move approaching to focused and exiting to background
        setTimeout(() => {
            newCard.classList.remove('approaching');
            newCard.classList.add('focused');
            oldCard.classList.remove('exiting');
            oldCard.classList.add('background');

            this.currentIndex = newIndex;
            this.isTransitioning = false;
        }, 400);
    }
}

// ===== DUAL RESPONSE PLANNER (Simplified) =====

class OrthogonalDualResponsePlanner {
    constructor() {
        // Simplified preset responses for each interaction stage
        this.presets = {
            'approach': {
                primary: {
                    vib34d: { preset: 'approach-primary', duration: 1100 },
                    portal: { intensity: 0.5, traitBoost: { moireBoost: 0.22, glitchBoost: 0.28 } },
                    glow: { offsetY: -12, intensity: 0.48 }
                },
                partner: {
                    vib34d: { preset: 'partner-inverse', duration: 900 },
                    portal: { intensity: 0.35, traitBoost: { moireBoost: 0.14, glitchBoost: 0.18 } },
                    glow: { offsetY: 8, intensity: 0.28 }
                },
                background: {
                    offsetX: 0.1,
                    offsetY: -0.15,
                    energy: 0.55,
                    twist: 0.22
                }
            },
            'focus': {
                primary: {
                    vib34d: { preset: 'focus-primary', duration: 1300 },
                    portal: { intensity: 0.85, traitBoost: { moireBoost: 0.4, glitchBoost: 0.4 } },
                    glow: { offsetY: -18, intensity: 0.8 }
                },
                partner: {
                    vib34d: { preset: 'inherit-primary', duration: 1100 },
                    portal: { intensity: 0.45, traitBoost: { moireBoost: 0.2, glitchBoost: 0.24 } },
                    glow: { offsetY: 10, intensity: 0.35 }
                },
                background: {
                    offsetX: 0.15,
                    offsetY: -0.22,
                    energy: 0.75,
                    twist: 0.35
                }
            },
            'exit': {
                primary: {
                    vib34d: { preset: 'exit-primary', duration: 1000 },
                    portal: { intensity: 0.4, traitBoost: { moireBoost: 0.18, glitchBoost: 0.22 } },
                    glow: { offsetY: -8, intensity: 0.4 }
                },
                partner: {
                    vib34d: { preset: 'release-primary', duration: 800 },
                    portal: { intensity: 0.3, traitBoost: { moireBoost: 0.1, glitchBoost: 0.12 } },
                    glow: { offsetY: 6, intensity: 0.25 }
                },
                background: {
                    offsetX: 0.05,
                    offsetY: -0.08,
                    energy: 0.4,
                    twist: 0.15
                }
            }
        };
    }

    plan(stage, primaryCard, partnerCard) {
        const preset = this.presets[stage] || this.presets['approach'];
        return {
            primary: {
                card: primaryCard,
                ...preset.primary
            },
            partner: partnerCard ? {
                card: partnerCard,
                ...preset.partner
            } : null,
            background: preset.background
        };
    }
}

// Export for use in landing controller
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PortalTextVisualizer,
        AmbientBackgroundField,
        OrthogonalDepthProgression,
        OrthogonalDualResponsePlanner
    };
}
