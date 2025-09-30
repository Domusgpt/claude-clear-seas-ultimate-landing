/**
 * Clear Seas Solutions - Particle Field System
 * Floating ambient particle canvas for background atmosphere
 * A Paul Phillips Manifestation
 */

class ParticleFieldSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isRunning = false;

        // Configuration
        this.particleCount = 50;
        this.colors = [
            { r: 0, g: 255, b: 255, name: 'cyan' },      // #00ffff
            { r: 255, g: 0, b: 255, name: 'magenta' },   // #ff00ff
            { r: 0, g: 255, b: 136, name: 'teal' },      // #00ff88
            { r: 199, g: 125, b: 255, name: 'purple' }   // #c77dff
        ];

        this.init();
    }

    init() {
        // Set canvas size to window size
        this.resize();

        // Create particles
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }

        // Bind resize handler
        window.addEventListener('resize', () => this.resize());

        // Start animation
        this.start();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];

        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.3, // Velocity X (-0.15 to 0.15)
            vy: (Math.random() - 0.5) * 0.3, // Velocity Y (-0.15 to 0.15)
            size: 2 + Math.random() * 2,     // Size 2-4px
            color: color,
            opacity: 0.4 + Math.random() * 0.4, // Opacity 0.4-0.8
            pulseSpeed: 0.02 + Math.random() * 0.03,
            pulsePhase: Math.random() * Math.PI * 2
        };
    }

    update() {
        for (let particle of this.particles) {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Update pulse phase for glow animation
            particle.pulsePhase += particle.pulseSpeed;
        }
    }

    render() {
        // Clear canvas with slight fade for trail effect (optional)
        this.ctx.fillStyle = 'rgba(5, 8, 18, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let particle of this.particles) {
            const { x, y, size, color, opacity, pulsePhase } = particle;

            // Calculate pulsing opacity
            const pulseOpacity = opacity * (0.7 + 0.3 * Math.sin(pulsePhase));

            // Draw glow (larger, more transparent)
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 6);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${pulseOpacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${pulseOpacity * 0.3})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x - size * 6, y - size * 6, size * 12, size * 12);

            // Draw core particle
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pulseOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    animate() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Optionally adjust particle speed based on user interaction
    setSpeed(speedMultiplier = 1.0) {
        for (let particle of this.particles) {
            particle.vx = (Math.random() - 0.5) * 0.3 * speedMultiplier;
            particle.vy = (Math.random() - 0.5) * 0.3 * speedMultiplier;
        }
    }

    // Add energy boost effect (particles speed up temporarily)
    energyBoost(duration = 2000, multiplier = 2.5) {
        const originalParticles = this.particles.map(p => ({ vx: p.vx, vy: p.vy }));

        this.setSpeed(multiplier);

        setTimeout(() => {
            this.particles.forEach((p, i) => {
                p.vx = originalParticles[i].vx;
                p.vy = originalParticles[i].vy;
            });
        }, duration);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleFieldSystem;
}
