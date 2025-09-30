/**
 * VIB34D GEOMETRIC TILT SYSTEM
 * Device orientation controls 4D rotation parameters for professional visualization
 * Based on vib34d-ultimate-viewer geometric tilt implementation
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 */

function vib34dClamp(value, min, max) {
    if (value === null || value === undefined || Number.isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function vib34dRotate4DVector(vector = {}, rotation = {}) {
    const angleScale = Math.PI * 0.5;
    const result = [vector.x || 0, vector.y || 0, vector.z || 0, vector.w || 0];

    const applyPlaneRotation = (indexA, indexB, key) => {
        const angle = (rotation[key] || 0) * angleScale;
        if (!angle) return;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a = result[indexA];
        const b = result[indexB];

        result[indexA] = a * cos - b * sin;
        result[indexB] = a * sin + b * cos;
    };

    // Apply rotations across all 4D planes to preserve portal depth cues
    applyPlaneRotation(0, 1, 'rot4dXY');
    applyPlaneRotation(0, 2, 'rot4dXZ');
    applyPlaneRotation(1, 2, 'rot4dYZ');
    applyPlaneRotation(0, 3, 'rot4dXW');
    applyPlaneRotation(1, 3, 'rot4dYW');
    applyPlaneRotation(2, 3, 'rot4dZW');

    return { x: result[0], y: result[1], z: result[2], w: result[3] };
}

function vib34dComputePortalProjection(normalized = {}, rotation4D = {}, intensity = 0) {
    const forward = vib34dClamp(normalized.beta || 0, -1.4, 1.4);
    const lateral = vib34dClamp(normalized.gamma || 0, -1.4, 1.4);
    const swirl = vib34dClamp(normalized.alpha || 0, -1.4, 1.4);

    const radius = Math.min(1.6, Math.hypot(forward, lateral));
    const baseVector = {
        x: forward * 0.9,
        y: lateral * 0.9,
        z: Math.sin(swirl * Math.PI * 0.5) * (0.7 + radius * 0.4),
        w: (intensity * 0.9) + radius * 0.45 + Math.cos(swirl * Math.PI * 0.5) * 0.35
    };

    const rotated = vib34dRotate4DVector(baseVector, rotation4D);

    const xySpiral = Math.sin(((rotation4D.rot4dXY || 0) + (rotation4D.rot4dXZ || 0)) * Math.PI * 0.5 + swirl * 0.8);
    const yzSpiral = Math.sin(((rotation4D.rot4dYZ || 0) - (rotation4D.rot4dXY || 0)) * Math.PI * 0.5 + forward * 0.6);

    const value = Math.sin(rotated.w * 1.15 + swirl * Math.PI * 0.5 + xySpiral * 0.35) * (0.8 + radius * 0.45);
    const depth = Math.sin(rotated.z * 1.05 + forward * 0.65 + yzSpiral * 0.28) * (0.75 + radius * 0.5);
    const shear = Math.sin((rotated.x - rotated.y) * 0.9 + xySpiral * 0.4) * (0.55 + radius * 0.45);
    const torsion = Math.sin((rotated.x + rotated.y) * 0.6 + (rotation4D.rot4dXZ || 0) * Math.PI * 0.5) * (0.45 + radius * 0.35);
    const pulse = Math.max(radius * 0.6, Math.abs(rotated.w) * 0.55) + Math.abs(swirl) * 0.35 + Math.abs(torsion) * 0.4;

    return { value, depth, shear, pulse, torsion, angle: Math.atan2(rotated.y, rotated.x), radius };
}

if (typeof window !== 'undefined') {
    window.VIB34DMath = window.VIB34DMath || {};
    Object.assign(window.VIB34DMath, {
        clamp: vib34dClamp,
        rotate4DVector: vib34dRotate4DVector,
        computePortalProjection: vib34dComputePortalProjection
    });
}

const VIB34D_DEFAULT_STATE = {
    startTime: 0,
    lastUpdateTime: 0,
    deltaTime: 0,
    time: 0,
    resolution: [0, 0],
    isRendering: false,
    animationFrameId: null,
    geometryType: 'hypercube',
    projectionMethod: 'perspective',
    dimensions: 4.0,
    morphFactor: 0.65,
    rotationSpeed: 0.35,
    universeModifier: 1.0,
    patternIntensity: 1.0,
    gridDensity: 6.0,
    lineThickness: 0.03,
    shellWidth: 0.025,
    tetraThickness: 0.035,
    glitchIntensity: 0.0,
    colorShift: 0.0,
    interactionIntensity: 0.0,
    portalPulse: 0.0,
    rot4dXW: 0.0,
    rot4dYW: 0.0,
    rot4dZW: 0.0,
    rot4dXY: 0.0,
    rot4dXZ: 0.0,
    rot4dYZ: 0.0,
    audioLevels: { bass: 0, mid: 0, high: 0 },
    colorScheme: {
        primary: [0.7, 0.1, 0.9],
        secondary: [0.1, 0.9, 0.9],
        background: [0.03, 0.0, 0.1]
    },
    needsShaderUpdate: false,
    _dirtyUniforms: new Set()
};

function createVIB34DState(overrides = {}) {
    const merged = { ...VIB34D_DEFAULT_STATE, ...overrides };
    const overrideAudio = overrides.audioLevels || {};
    const overrideScheme = overrides.colorScheme || {};

    merged.audioLevels = {
        bass: overrideAudio.bass ?? VIB34D_DEFAULT_STATE.audioLevels.bass,
        mid: overrideAudio.mid ?? VIB34D_DEFAULT_STATE.audioLevels.mid,
        high: overrideAudio.high ?? VIB34D_DEFAULT_STATE.audioLevels.high
    };

    merged.colorScheme = {
        primary: [...(overrideScheme.primary || VIB34D_DEFAULT_STATE.colorScheme.primary)],
        secondary: [...(overrideScheme.secondary || VIB34D_DEFAULT_STATE.colorScheme.secondary)],
        background: [...(overrideScheme.background || VIB34D_DEFAULT_STATE.colorScheme.background)]
    };

    merged._dirtyUniforms = new Set();
    return merged;
}

const VIB34D_GEOMETRY_INDEX = {
    hypercube: 0,
    tetrahedron: 1,
    sphere: 2,
    torus: 3,
    klein: 4,
    fractal: 5,
    wave: 6,
    crystal: 7,
    ribbon: 8,
    shell: 9,
    lattice: 10
};

const VIB34D_REACTIVE_PRESETS = {
    'approach-primary': {
        intensityScale: 1.18,
        densityBias: -0.18,
        hueSpin: 0.12,
        duration: 1100,
        direct: {
            speed: 0.32,
            glitch: 0.28,
            density: -0.24,
            moire: 0.22,
            energy: 0.3,
            hueShift: 8,
            accentHueShift: -6,
            wDepth: 0.1,
            wPulse: 0.45
        },
        accent: {
            hueShift: 6,
            moire: -0.14,
            density: 0.18
        }
    },
    'focus-primary': {
        intensityScale: 1.34,
        densityBias: -0.22,
        hueSpin: 0.18,
        duration: 1340,
        geometryAdvance: 1,
        direct: {
            speed: 0.46,
            glitch: 0.4,
            density: -0.32,
            moire: 0.28,
            energy: 0.38,
            hueShift: 14,
            accentHueShift: -10,
            wDepth: 0.16,
            wPulse: 0.72,
            geometryVariant: 'wave'
        },
        accent: {
            hueShift: 10,
            moire: -0.18,
            density: 0.22
        }
    },
    'exit-primary': {
        intensityScale: 0.92,
        densityBias: -0.1,
        hueSpin: -0.06,
        duration: 940,
        direct: {
            speed: 0.2,
            glitch: 0.18,
            density: -0.14,
            moire: 0.16,
            energy: 0.22,
            hueShift: 4,
            accentHueShift: -3,
            wDepth: 0.06,
            wPulse: 0.38
        }
    },
    'release-primary': {
        intensityScale: 1.42,
        densityBias: -0.24,
        hueSpin: 0.22,
        duration: 1520,
        geometryAdvance: 1,
        direct: {
            speed: 0.52,
            glitch: 0.48,
            density: -0.36,
            moire: 0.34,
            energy: 0.42,
            hueShift: 18,
            accentHueShift: -14,
            wDepth: 0.22,
            wPulse: 0.9,
            geometryVariant: 'crystal'
        },
        accent: {
            hueShift: 14,
            moire: -0.22,
            density: 0.28
        }
    },
    'inherit-primary': {
        intensityScale: 1.12,
        densityBias: -0.16,
        hueSpin: 0.14,
        duration: 1320,
        direct: {
            speed: 0.34,
            glitch: 0.3,
            density: -0.22,
            moire: 0.24,
            energy: 0.3,
            hueShift: 10,
            accentHueShift: -8,
            wDepth: 0.12,
            wPulse: 0.62
        },
        accent: {
            hueShift: 8,
            moire: -0.16,
            density: 0.2
        }
    },
    'inheritance-primary': {
        intensityScale: 1.34,
        densityBias: -0.32,
        hueSpin: 0.32,
        geometryAdvance: 1,
        duration: 1520,
        direct: {
            speed: 0.48,
            glitch: 0.46,
            density: -0.34,
            moire: 0.38,
            energy: 0.44,
            hueShift: 16,
            accentHueShift: -14,
            wDepth: 0.18,
            wPulse: 0.86,
            geometryVariant: 'fractal'
        },
        accent: {
            hueShift: 14,
            moire: -0.22,
            density: 0.24
        }
    },
    'inheritance-echo': {
        intensityScale: 1.08,
        densityBias: 0.26,
        hueSpin: -0.3,
        duration: 1260,
        partnerInvert: true,
        direct: {
            speed: 0.28,
            glitch: 0.24,
            density: 0.24,
            moire: -0.24,
            energy: 0.26,
            hueShift: -12,
            accentHueShift: 12,
            wDepth: 0.12,
            wPulse: 0.44,
            geometryVariant: 'ribbon'
        },
        accent: {
            hueShift: -10,
            moire: 0.16,
            density: -0.22
        }
    },
    'partner-inverse': {
        intensityScale: 0.82,
        densityBias: 0.12,
        hueSpin: -0.1,
        duration: 980,
        partnerInvert: true,
        direct: {
            speed: 0.22,
            glitch: 0.18,
            density: 0.18,
            moire: -0.16,
            energy: 0.2,
            hueShift: -6,
            accentHueShift: 6,
            wDepth: 0.08,
            wPulse: 0.34
        },
        accent: {
            hueShift: -6,
            moire: 0.12,
            density: -0.16
        }
    },
    'idle-breath': {
        intensityScale: 0.96,
        densityBias: -0.08,
        hueSpin: 0.1,
        duration: 960,
        direct: {
            speed: 0.18,
            glitch: 0.16,
            density: -0.12,
            moire: 0.14,
            energy: 0.2,
            hueShift: 6,
            accentHueShift: -4,
            wDepth: 0.06,
            wPulse: 0.36
        },
        accent: {
            hueShift: 6,
            moire: -0.1,
            density: 0.16
        }
    }
};

const VIB34D_DESTRUCTION_FLOURISHES = {
    quantum: [
        {
            id: 'rift-bloom',
            label: 'Rift Bloom Transfer',
            inherit: {
                hueShift: 22,
                accentShift: -14,
                moireBoost: 0.26,
                glitchBoost: 0.34,
                energyBoost: 0.38,
                geometryVariant: 'wave',
                portalPulse: 1.22
            },
            core: {
                speed: 0.9,
                glitch: 0.6,
                moire: 0.4,
                density: -0.35,
                geometryVariant: 'wave'
            },
            accent: {
                hueShift: -24,
                glitch: 0.3,
                moire: -0.18
            },
            partner: {
                intensity: 0.56,
                densityBias: -0.44,
                hueSpin: 0.32,
                duration: 1400
            },
            portal: {
                depthDelta: 0.72,
                rotationDelta: 0.48,
                pulse: 1.05,
                duration: 1500
            },
            background: {
                energy: 0.9,
                twist: 0.5,
                offsetX: 0.22,
                offsetY: 0.16
            },
            fragment: {
                type: 'merge',
                segments: [
                    'Rift Bloom Transfer',
                    'Quantum Residual {trait}',
                    'Hypercascade {signature}'
                ]
            }
        },
        {
            id: 'axis-shatter',
            label: 'Axis Shatter Relay',
            inherit: {
                hueShift: -18,
                accentShift: 16,
                moireBoost: 0.32,
                glitchBoost: 0.42,
                energyBoost: 0.45,
                geometryVariant: 'crystal',
                portalPulse: 1.28
            },
            core: {
                speed: 1.1,
                glitch: 0.7,
                moire: 0.28,
                density: -0.4,
                geometryVariant: 'crystal'
            },
            accent: {
                hueShift: 18,
                glitch: 0.34,
                moire: 0.2
            },
            partner: {
                intensity: 0.62,
                densityBias: -0.38,
                hueSpin: -0.28,
                duration: 1480
            },
            portal: {
                depthDelta: 0.78,
                rotationDelta: -0.52,
                pulse: 1.12,
                duration: 1580
            },
            background: {
                energy: 0.94,
                twist: -0.48,
                offsetX: -0.2,
                offsetY: 0.18
            },
            fragment: {
                type: 'fracture',
                segments: [
                    'Axis Break Relay',
                    'Shard Echo {trait}',
                    'Cascade Inversion {signature}'
                ]
            }
        }
    ],
    holographic: [
        {
            id: 'veil-spiral',
            label: 'Veil Spiral Bloom',
            inherit: {
                hueShift: 28,
                accentShift: -20,
                moireBoost: 0.24,
                glitchBoost: 0.3,
                energyBoost: 0.36,
                geometryVariant: 'ribbon',
                portalPulse: 1.18
            },
            core: {
                speed: 0.84,
                glitch: 0.52,
                moire: 0.38,
                density: -0.32,
                geometryVariant: 'ribbon'
            },
            accent: {
                hueShift: -18,
                glitch: 0.28,
                moire: -0.16
            },
            partner: {
                intensity: 0.54,
                densityBias: -0.36,
                hueSpin: 0.42,
                duration: 1380
            },
            portal: {
                depthDelta: 0.68,
                rotationDelta: 0.52,
                pulse: 1.02,
                duration: 1460
            },
            background: {
                energy: 0.88,
                twist: 0.62,
                offsetX: 0.18,
                offsetY: 0.2
            },
            fragment: {
                type: 'merge',
                segments: [
                    'Veil Spiral Bloom',
                    'Prismatic Echo {trait}',
                    'Halo Memory {signature}'
                ]
            }
        },
        {
            id: 'halo-collapse',
            label: 'Halo Collapse Transfer',
            inherit: {
                hueShift: -24,
                accentShift: 18,
                moireBoost: 0.28,
                glitchBoost: 0.4,
                energyBoost: 0.48,
                geometryVariant: 'klein',
                portalPulse: 1.26
            },
            core: {
                speed: 1.08,
                glitch: 0.74,
                moire: 0.32,
                density: -0.42,
                geometryVariant: 'klein'
            },
            accent: {
                hueShift: 16,
                glitch: 0.36,
                moire: 0.24
            },
            partner: {
                intensity: 0.6,
                densityBias: -0.34,
                hueSpin: -0.36,
                duration: 1520
            },
            portal: {
                depthDelta: 0.82,
                rotationDelta: -0.46,
                pulse: 1.14,
                duration: 1620
            },
            background: {
                energy: 0.96,
                twist: -0.52,
                offsetX: -0.18,
                offsetY: 0.22
            },
            fragment: {
                type: 'fracture',
                segments: [
                    'Halo Collapse Transfer',
                    'Lightwell Fragment {trait}',
                    'Ribbon Afterglow {signature}'
                ]
            }
        }
    ],
    faceted: [
        {
            id: 'shard-bloom',
            label: 'Shard Bloom Exchange',
            inherit: {
                hueShift: 18,
                accentShift: -12,
                moireBoost: 0.22,
                glitchBoost: 0.28,
                energyBoost: 0.34,
                geometryVariant: 'tetrahedron',
                portalPulse: 1.16
            },
            core: {
                speed: 0.88,
                glitch: 0.58,
                moire: 0.36,
                density: -0.3,
                geometryVariant: 'tetrahedron'
            },
            accent: {
                hueShift: -16,
                glitch: 0.26,
                moire: -0.14
            },
            partner: {
                intensity: 0.5,
                densityBias: -0.32,
                hueSpin: 0.28,
                duration: 1340
            },
            portal: {
                depthDelta: 0.66,
                rotationDelta: 0.42,
                pulse: 0.98,
                duration: 1420
            },
            background: {
                energy: 0.84,
                twist: 0.46,
                offsetX: 0.16,
                offsetY: 0.14
            },
            fragment: {
                type: 'triad',
                segments: [
                    'Shard Bloom Exchange',
                    'Facet Relay {trait}',
                    'Carrier Memory {signature}'
                ]
            }
        },
        {
            id: 'lattice-rupture',
            label: 'Lattice Rupture Relay',
            inherit: {
                hueShift: -16,
                accentShift: 14,
                moireBoost: 0.3,
                glitchBoost: 0.38,
                energyBoost: 0.44,
                geometryVariant: 'lattice',
                portalPulse: 1.24
            },
            core: {
                speed: 1.04,
                glitch: 0.68,
                moire: 0.3,
                density: -0.38,
                geometryVariant: 'lattice'
            },
            accent: {
                hueShift: 14,
                glitch: 0.32,
                moire: 0.18
            },
            partner: {
                intensity: 0.58,
                densityBias: -0.36,
                hueSpin: -0.24,
                duration: 1500
            },
            portal: {
                depthDelta: 0.76,
                rotationDelta: -0.48,
                pulse: 1.08,
                duration: 1560
            },
            background: {
                energy: 0.9,
                twist: -0.44,
                offsetX: -0.14,
                offsetY: 0.2
            },
            fragment: {
                type: 'fracture',
                segments: [
                    'Lattice Rupture Relay',
                    'Counter Shard {trait}',
                    'Depth Transfer {signature}'
                ]
            }
        }
    ]
};

VIB34D_DESTRUCTION_FLOURISHES.default = VIB34D_DESTRUCTION_FLOURISHES.quantum;

class VIB34DReactivePresetLibrary {
    constructor(presets = VIB34D_REACTIVE_PRESETS) {
        this.presets = presets;
        this.stageMap = {
            approach: 'approach-primary',
            focus: 'focus-primary',
            exit: 'exit-primary',
            inherit: 'inherit-primary',
            release: 'release-primary',
            idle: 'idle-breath'
        };
        this.partnerStageMap = {
            approach: 'partner-inverse',
            focus: 'partner-inverse',
            exit: 'partner-inverse',
            inherit: 'partner-inverse',
            release: 'partner-inverse',
            idle: 'partner-inverse',
            fragment: 'partner-inverse',
            default: 'partner-inverse'
        };
    }

    resolvePreset(context = {}) {
        const presetName = context.preset;
        if (presetName && this.presets[presetName]) {
            return presetName;
        }

        const channel = context.channel || 'primary';
        const stage = context.stage || '';

        if (channel === 'partner') {
            const mapped = this.partnerStageMap[stage] || this.partnerStageMap.default;
            return (mapped && this.presets[mapped]) ? mapped : null;
        }

        const mapped = this.stageMap[stage];
        if (mapped && this.presets[mapped]) {
            return mapped;
        }

        if (stage && this.presets[stage]) {
            return stage;
        }

        return null;
    }

    provide(context = {}) {
        const key = this.resolvePreset(context);
        if (!key) return null;
        return this.sample(key, context);
    }

    sample(name, context = {}) {
        const preset = this.presets[name];
        if (!preset) return null;

        const intensity = typeof context.intensity === 'number' ? context.intensity : 0.45;
        const polarity = context.polarity >= 0 ? 1 : -1;

        const directBase = { ...(preset.direct || {}) };
        const accentBase = preset.accent ? { ...preset.accent } : null;

        const scale = (value) => (typeof value === 'number' ? value * intensity : 0);

        const direct = {
            speed: scale(directBase.speed),
            glitch: scale(directBase.glitch),
            density: scale(directBase.density),
            moire: scale(directBase.moire),
            energy: scale(directBase.energy)
        };

        if (typeof directBase.hueShift === 'number') {
            direct.hueShift = scale(directBase.hueShift) * polarity;
        }
        if (typeof directBase.accentHueShift === 'number') {
            direct.accentHueShift = scale(directBase.accentHueShift) * -polarity;
        }
        if (typeof directBase.wDepth === 'number') {
            direct.wDepth = scale(directBase.wDepth);
        }
        if (typeof directBase.wPulse === 'number') {
            const boost = typeof directBase.wPulseBoost === 'number' ? directBase.wPulseBoost * intensity : 0;
            direct.wPulse = directBase.wPulse + boost;
        }
        if (typeof directBase.geometryVariant === 'string') {
            direct.geometryVariant = directBase.geometryVariant;
        }

        let accent = null;
        if (accentBase) {
            accent = {};
            if (typeof accentBase.hueShift === 'number') {
                accent.hueShift = scale(accentBase.hueShift) * polarity;
            }
            if (typeof accentBase.moire === 'number') {
                accent.moire = scale(accentBase.moire);
            }
            if (typeof accentBase.density === 'number') {
                accent.density = scale(accentBase.density);
            }
            if (!Object.keys(accent).length) {
                accent = null;
            }
        }

        const blueprint = {
            intensityScale: typeof preset.intensityScale === 'number' ? preset.intensityScale : 1,
            densityBias: typeof preset.densityBias === 'number' ? preset.densityBias * polarity : undefined,
            hueSpin: typeof preset.hueSpin === 'number' ? preset.hueSpin * polarity : undefined,
            geometryAdvance: preset.geometryAdvance,
            duration: preset.duration,
            direct,
            accent
        };

        if (preset.partnerInvert && context.channel === 'partner') {
            blueprint.direct.speed *= -0.6;
            blueprint.direct.density *= -1;
            blueprint.direct.moire *= -0.8;
            if (typeof blueprint.direct.hueShift === 'number') {
                blueprint.direct.hueShift *= -1;
            }
            if (typeof blueprint.direct.accentHueShift === 'number') {
                blueprint.direct.accentHueShift *= -1;
            }
            if (typeof blueprint.densityBias === 'number') {
                blueprint.densityBias *= -1;
            }
            if (typeof blueprint.hueSpin === 'number') {
                blueprint.hueSpin *= -1;
            }
        }

        return blueprint;
    }
}


class VIB34DColor {
    static hslToRgb(h, s, l) {
        const hue = (((h % 360) + 360) % 360) / 360;
        const sat = Math.max(0, Math.min(1, s));
        const light = Math.max(0, Math.min(1, l));

        if (sat === 0) {
            return [light, light, light];
        }

        const q = light < 0.5
            ? light * (1 + sat)
            : light + sat - light * sat;
        const p = 2 * light - q;

        const convert = (t) => {
            let temp = t;
            if (temp < 0) temp += 1;
            if (temp > 1) temp -= 1;
            if (temp < 1 / 6) return p + (q - p) * 6 * temp;
            if (temp < 1 / 2) return q;
            if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
            return p;
        };

        return [convert(hue + 1 / 3), convert(hue), convert(hue - 1 / 3)];
    }
}

class VIB34DGeometryManager {
    getGeometryCode() {
        return `
float hash(float n) { return fract(sin(n) * 43758.5453123); }

float hypercubeLattice(vec3 p, float gridSize) {
    vec3 cell = abs(fract(p * gridSize + 0.5) - 0.5);
    float edge = min(min(cell.x, cell.y), cell.z);
    return smoothstep(0.45, 0.0, edge);
}

float tetrahedronLattice(vec3 p, float gridSize) {
    vec3 g = abs(fract(p * gridSize) - 0.5);
    float sum = g.x + g.y + g.z;
    return smoothstep(0.45, 0.05, abs(sum - 0.75));
}

float hypersphereShell(vec3 p, float gridSize) {
    float radius = length(p) * gridSize * 0.5;
    return smoothstep(0.55, 0.0, abs(radius - floor(radius + 0.5)));
}

float torusWeave(vec3 p, float gridSize) {
    vec3 q = fract(p * gridSize) - 0.5;
    float ring = abs(length(q.xy) - 0.35);
    float twist = abs(q.z);
    return smoothstep(0.4, 0.0, ring + twist * 0.6);
}

float kleinField(vec3 p, float gridSize) {
    float a = sin(p.x * gridSize) * cos(p.y * gridSize);
    float b = sin(p.y * gridSize) * cos(p.z * gridSize);
    float c = sin(p.z * gridSize) * cos(p.x * gridSize);
    return smoothstep(-0.4, 0.4, a + b + c);
}

float fractalBloom(vec3 p, float gridSize) {
    float scale = 1.0;
    float acc = 0.0;
    vec3 z = p;
    for (int i = 0; i < 5; i++) {
        z = abs(z) / dot(z, z) - 0.5;
        acc += exp(-10.0 * abs(z.x + z.y + z.z));
        scale *= 0.85;
        z *= scale + gridSize * 0.05;
    }
    return clamp(acc * 0.3, 0.0, 1.0);
}

float waveField(vec3 p, float gridSize) {
    float wave = sin(p.x * gridSize) + sin(p.y * gridSize * 1.3) + sin(p.z * gridSize * 0.7);
    return smoothstep(-1.2, 1.2, wave);
}

float crystalField(vec3 p, float gridSize) {
    vec3 q = abs(fract(p * gridSize * 0.7) - 0.5);
    float cell = max(q.x, max(q.y, q.z));
    return smoothstep(0.45, 0.1, cell);
}

float ribbonField(vec3 p, float gridSize) {
    vec3 q = p * gridSize;
    float ribbon = sin(q.x) * 0.6 + sin(q.y * 1.3) * 0.3;
    float band = abs(sin(q.z + ribbon));
    return smoothstep(0.7, 0.2, band);
}

float shellField(vec3 p, float gridSize) {
    float radius = length(p) * gridSize;
    float layer = abs(radius - floor(radius + 0.5));
    float ripple = sin(radius * 6.0) * 0.1;
    return smoothstep(0.35, 0.05, layer + ripple);
}

float latticeField(vec3 p, float gridSize) {
    vec3 g = abs(fract(p * gridSize) - 0.5);
    float strut = min(min(g.x, g.y), g.z);
    return smoothstep(0.4, 0.08, strut);
}

float getGeometryValue(vec3 p, float gridSize, float geomType) {
    if (geomType < 0.5) return hypercubeLattice(p, gridSize);
    else if (geomType < 1.5) return tetrahedronLattice(p, gridSize);
    else if (geomType < 2.5) return hypersphereShell(p, gridSize);
    else if (geomType < 3.5) return torusWeave(p, gridSize);
    else if (geomType < 4.5) return kleinField(p, gridSize);
    else if (geomType < 5.5) return fractalBloom(p, gridSize);
    else if (geomType < 6.5) return waveField(p, gridSize);
    else if (geomType < 7.5) return crystalField(p, gridSize);
    else if (geomType < 8.5) return ribbonField(p, gridSize);
    else if (geomType < 9.5) return shellField(p, gridSize);
    return latticeField(p, gridSize);
}
        `;
    }
}

class VIB34DProjectionManager {
    getProjectionCode(method = 'perspective') {
        switch (method) {
            case 'stereographic':
                return `
vec3 project4Dto3D(vec4 p) {
    float pole = 1.2 + u_morphFactor * 0.4;
    float denom = max(0.12, pole - p.w);
    return p.xyz / denom;
}
                `;
            case 'orthographic':
                return `
vec3 project4Dto3D(vec4 p) {
    float blend = clamp(u_morphFactor, 0.0, 1.0);
    float dist = 2.5 + blend * 1.5;
    float persp = dist / max(0.1, dist + p.w);
    return mix(p.xyz, p.xyz * persp, blend);
}
                `;
            case 'perspective':
            default:
                return `
vec3 project4Dto3D(vec4 p) {
    float baseDistance = 2.8 + u_audioMid * 0.6;
    float dynamicDistance = max(0.2, baseDistance + u_morphFactor * 0.4 - u_audioMid * 0.25);
    float denominator = dynamicDistance + p.w;
    float w_factor = dynamicDistance / max(0.12, denominator);
    return p.xyz * w_factor;
}
                `;
        }
    }
}

class VIB34DShaderManager {
    constructor(geometryManager = new VIB34DGeometryManager(), projectionManager = new VIB34DProjectionManager()) {
        this.geometryManager = geometryManager;
        this.projectionManager = projectionManager;
        this.baseVertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;
        this.fragmentTemplate = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dimension;
uniform float u_morphFactor;
uniform float u_rotationSpeed;
uniform float u_universeModifier;
uniform float u_patternIntensity;
uniform float u_gridDensity;
uniform float u_lineThickness;
uniform float u_shellWidth;
uniform float u_tetraThickness;
uniform float u_glitchIntensity;
uniform float u_colorShift;
uniform float u_interactionIntensity;
uniform float u_portalPulse;
uniform float u_rot4dXY;
uniform float u_rot4dXZ;
uniform float u_rot4dYZ;
uniform float u_rot4dXW;
uniform float u_rot4dYW;
uniform float u_rot4dZW;
uniform float u_audioBass;
uniform float u_audioMid;
uniform float u_audioHigh;
uniform vec3 u_primaryColor;
uniform vec3 u_secondaryColor;
uniform vec3 u_backgroundColor;
uniform int u_geometry;

mat4 rotXW(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat4(
        c, 0.0, 0.0, -s,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        s, 0.0, 0.0, c
    );
}

mat4 rotXY(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat4(
        c, -s, 0.0, 0.0,
        s, c, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

mat4 rotXZ(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat4(
        c, 0.0, -s, 0.0,
        0.0, 1.0, 0.0, 0.0,
        s, 0.0, c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

mat4 rotYZ(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, c, -s, 0.0,
        0.0, s, c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

mat4 rotYW(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, c, 0.0, -s,
        0.0, 0.0, 1.0, 0.0,
        0.0, s, 0.0, c
    );
}

mat4 rotZW(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, c, -s,
        0.0, 0.0, s, c
    );
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

__PROJECTION_CODE_INJECTION_POINT__
__GEOMETRY_CODE_INJECTION_POINT__

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / max(u_resolution.y, 1.0);
    float time = u_time;

    vec3 dir = normalize(vec3(uv, 1.2));
    float wSeed = sin(time * 0.4 + dot(dir.xy, dir.xy) * 4.0);
    vec4 p4 = vec4(dir * (1.2 + u_morphFactor * 0.7), 0.0);
    p4.w = wSeed * (u_dimension - 3.0) * (1.0 + u_interactionIntensity * 0.35) + u_portalPulse * 0.6;

    float rotScale = u_rotationSpeed * (1.0 + u_audioHigh * 0.35);
    mat4 rotMat = rotXY(time * 0.19 * rotScale + u_rot4dXY)
        * rotXZ(time * 0.22 * rotScale + u_rot4dXZ)
        * rotYZ(time * 0.20 * rotScale + u_rot4dYZ)
        * rotXW(time * 0.23 * rotScale + u_rot4dXW)
        * rotYW(time * 0.21 * rotScale + u_rot4dYW)
        * rotZW(time * 0.17 * rotScale + u_rot4dZW);

    p4 = rotMat * p4;

    vec3 projected = project4Dto3D(p4);
    float gridSize = max(0.2, u_gridDensity * (1.0 + u_audioBass * 0.4));
    float geometrySample = getGeometryValue(projected * (1.2 + u_portalPulse * 0.5), gridSize, float(u_geometry));
    float structure = pow(geometrySample, max(0.35, u_universeModifier));

    float glitch = u_glitchIntensity * (0.35 + 0.65 * abs(sin(time * 6.0 + projected.x * 5.0)));
    float envelope = mix(0.35, 1.0, clamp(u_interactionIntensity + u_portalPulse + u_audioMid, 0.0, 1.0));

    vec3 baseColor = mix(u_backgroundColor, u_primaryColor, structure);
    vec3 accent = mix(u_primaryColor, u_secondaryColor, clamp(u_audioHigh + u_portalPulse, 0.0, 1.0));
    vec3 hsvColor = rgb2hsv(baseColor);
    hsvColor.x += u_colorShift + 0.05 * sin(projected.y * 4.0 + time * 0.5);
    hsvColor.y = clamp(hsvColor.y + envelope * 0.25, 0.0, 1.0);
    hsvColor.z = clamp(hsvColor.z + envelope * 0.35 + u_audioBass * 0.2, 0.0, 1.0);

    vec3 finalColor = hsv2rgb(hsvColor);
    finalColor = mix(finalColor, accent, clamp(0.25 + u_audioHigh * 0.45 + u_portalPulse * 0.35, 0.0, 0.9));
    finalColor += glitch * vec3(0.4, -0.15, 0.55);
    finalColor += vec3(u_audioBass * 0.25, u_audioMid * 0.18, u_audioHigh * 0.35);
    finalColor = clamp(finalColor, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
}`;
    }

    compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`VIB34D shader compile error: ${info}`);
        }
        return shader;
    }

    linkProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`VIB34D program link error: ${info}`);
        }
        return program;
    }

    createProgram(gl, options = {}) {
        const projectionCode = this.projectionManager.getProjectionCode(options.projectionMethod);
        const geometryCode = this.geometryManager.getGeometryCode();
        const fragmentSource = this.fragmentTemplate
            .replace('__PROJECTION_CODE_INJECTION_POINT__', projectionCode)
            .replace('__GEOMETRY_CODE_INJECTION_POINT__', geometryCode);

        const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, this.baseVertexShader);
        const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        const program = this.linkProgram(gl, vertexShader, fragmentShader);

        const uniformLocations = {
            u_resolution: gl.getUniformLocation(program, 'u_resolution'),
            u_time: gl.getUniformLocation(program, 'u_time'),
            u_dimension: gl.getUniformLocation(program, 'u_dimension'),
            u_morphFactor: gl.getUniformLocation(program, 'u_morphFactor'),
            u_rotationSpeed: gl.getUniformLocation(program, 'u_rotationSpeed'),
            u_universeModifier: gl.getUniformLocation(program, 'u_universeModifier'),
            u_patternIntensity: gl.getUniformLocation(program, 'u_patternIntensity'),
            u_gridDensity: gl.getUniformLocation(program, 'u_gridDensity'),
            u_lineThickness: gl.getUniformLocation(program, 'u_lineThickness'),
            u_shellWidth: gl.getUniformLocation(program, 'u_shellWidth'),
            u_tetraThickness: gl.getUniformLocation(program, 'u_tetraThickness'),
            u_glitchIntensity: gl.getUniformLocation(program, 'u_glitchIntensity'),
            u_colorShift: gl.getUniformLocation(program, 'u_colorShift'),
            u_interactionIntensity: gl.getUniformLocation(program, 'u_interactionIntensity'),
            u_portalPulse: gl.getUniformLocation(program, 'u_portalPulse'),
            u_rot4dXY: gl.getUniformLocation(program, 'u_rot4dXY'),
            u_rot4dXZ: gl.getUniformLocation(program, 'u_rot4dXZ'),
            u_rot4dYZ: gl.getUniformLocation(program, 'u_rot4dYZ'),
            u_rot4dXW: gl.getUniformLocation(program, 'u_rot4dXW'),
            u_rot4dYW: gl.getUniformLocation(program, 'u_rot4dYW'),
            u_rot4dZW: gl.getUniformLocation(program, 'u_rot4dZW'),
            u_audioBass: gl.getUniformLocation(program, 'u_audioBass'),
            u_audioMid: gl.getUniformLocation(program, 'u_audioMid'),
            u_audioHigh: gl.getUniformLocation(program, 'u_audioHigh'),
            u_primaryColor: gl.getUniformLocation(program, 'u_primaryColor'),
            u_secondaryColor: gl.getUniformLocation(program, 'u_secondaryColor'),
            u_backgroundColor: gl.getUniformLocation(program, 'u_backgroundColor'),
            u_geometry: gl.getUniformLocation(program, 'u_geometry')
        };

        const attributeLocations = {
            a_position: gl.getAttribLocation(program, 'a_position')
        };

        return { program, uniformLocations, attributeLocations };
    }
}

class VIB34DHypercubeCore {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = this.createContext();
        this.geometryManager = options.geometryManager || new VIB34DGeometryManager();
        this.projectionManager = options.projectionManager || new VIB34DProjectionManager();
        this.shaderManager = options.shaderManager || new VIB34DShaderManager(this.geometryManager, this.projectionManager);
        this.state = createVIB34DState(options.initialState || {});
        this.uniformLocations = null;
        this.attributeLocations = null;
        this.buffer = null;
        this.resizeObserver = null;
        this.uniformBindings = this.createUniformBindings();

        if (!this.gl) {
            console.warn('⚠️ WebGL not available for VIB34D visualizer');
            return;
        }

        this.initialize();
    }

    createContext() {
        const attributes = {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        };
        return this.canvas.getContext('webgl', attributes) || this.canvas.getContext('experimental-webgl', attributes);
    }

    initialize() {
        this.handleResize();
        this.setupResizeObserver();
        this.buildProgram();
        this.initBuffers();
        this.start();
    }

    setupResizeObserver() {
        if (typeof ResizeObserver === 'function') {
            this.resizeObserver = new ResizeObserver(() => this.handleResize());
            this.resizeObserver.observe(this.canvas);
        } else {
            window.addEventListener('resize', () => this.handleResize());
        }
    }

    handleResize() {
        if (!this.gl) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.state.resolution = [rect.width, rect.height];
        this.gl.viewport(0, 0, width, height);
        this.markUniformDirty('resolution');
    }

    buildProgram() {
        if (!this.gl) return;
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }

        const { program, uniformLocations, attributeLocations } = this.shaderManager.createProgram(this.gl, {
            projectionMethod: this.state.projectionMethod
        });

        this.program = program;
        this.uniformLocations = uniformLocations;
        this.attributeLocations = attributeLocations;
        this.state.needsShaderUpdate = false;
        this.resetUniformCache();
    }

    initBuffers() {
        if (!this.gl) return;
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }

    start() {
        if (!this.gl || this.state.isRendering) return;
        this.state.isRendering = true;
        this.state.startTime = performance.now();
        this.state.lastUpdateTime = this.state.startTime;
        this.renderLoop();
    }

    stop() {
        if (!this.state.isRendering) return;
        this.state.isRendering = false;
        if (this.state.animationFrameId) {
            cancelAnimationFrame(this.state.animationFrameId);
            this.state.animationFrameId = null;
        }
    }

    renderLoop() {
        if (!this.state.isRendering || !this.gl) return;

        const now = performance.now();
        this.state.deltaTime = now - this.state.lastUpdateTime;
        this.state.lastUpdateTime = now;
        this.state.time += this.state.deltaTime / 1000;

        if (this.state.needsShaderUpdate) {
            this.buildProgram();
            this.initBuffers();
        }

        this.drawFrame();
        this.state.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }

    drawFrame() {
        if (!this.gl || !this.program) return;

        this.gl.useProgram(this.program);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        const positionLocation = this.attributeLocations.a_position;
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.updateUniforms();

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    updateUniforms() {
        const gl = this.gl;
        const loc = this.uniformLocations;
        if (!gl || !loc) return;

        const dirty = this.state._dirtyUniforms;
        const entries = Object.entries(this.uniformBindings);
        for (let i = 0; i < entries.length; i += 1) {
            const [key, binding] = entries[i];
            if (!binding.dynamic && (!dirty || !dirty.has(key))) {
                continue;
            }

            const location = loc[binding.uniform];
            if (!location && location !== 0) continue;

            const value = binding.getter ? binding.getter(this.state) : this.state[key];
            binding.apply(gl, location, value);

            if (!binding.dynamic && dirty) {
                dirty.delete(key);
            }
        }
    }

    updateParameters(parameters = {}) {
        if (!parameters || typeof parameters !== 'object') return;

        const keys = Object.keys(parameters);
        keys.forEach((key) => {
            if (key === 'colorScheme') {
                const scheme = parameters.colorScheme;
                if (scheme) {
                    const current = this.state.colorScheme || {};
                    const defaults = VIB34D_DEFAULT_STATE.colorScheme;
                    this.state.colorScheme = {
                        primary: scheme.primary ? [...scheme.primary] : [...(current.primary || defaults.primary)],
                        secondary: scheme.secondary ? [...scheme.secondary] : [...(current.secondary || defaults.secondary)],
                        background: scheme.background ? [...scheme.background] : [...(current.background || defaults.background)]
                    };
                    this.markUniformDirty('colorPrimary');
                    this.markUniformDirty('colorSecondary');
                    this.markUniformDirty('colorBackground');
                }
            } else if (key === 'audioLevels') {
                const audio = parameters.audioLevels || {};
                this.state.audioLevels = {
                    bass: audio.bass ?? this.state.audioLevels.bass,
                    mid: audio.mid ?? this.state.audioLevels.mid,
                    high: audio.high ?? this.state.audioLevels.high
                };
                this.markUniformDirty('audioBass');
                this.markUniformDirty('audioMid');
                this.markUniformDirty('audioHigh');
            } else {
                if (this.state[key] !== parameters[key]) {
                    this.state[key] = parameters[key];
                    this.markUniformDirty(key);
                }
            }
        });

        if (parameters.projectionMethod && parameters.projectionMethod !== this.state.projectionMethod) {
            this.state.projectionMethod = parameters.projectionMethod;
            this.state.needsShaderUpdate = true;
        }
    }

    destroy() {
        this.stop();
        if (this.resizeObserver && this.resizeObserver.disconnect) {
            this.resizeObserver.disconnect();
        }
        if (this.gl) {
            if (this.program) this.gl.deleteProgram(this.program);
            if (this.buffer) this.gl.deleteBuffer(this.buffer);
        }
    }
}

VIB34DHypercubeCore.prototype.createUniformBindings = function createUniformBindings() {
    return {
        resolution: {
            uniform: 'u_resolution',
            dynamic: true,
            getter: (state) => state.resolution,
            apply: (gl, location, value) => {
                const [width = 0, height = 0] = value || [];
                gl.uniform2f(location, width, height);
            }
        },
        time: {
            uniform: 'u_time',
            dynamic: true,
            getter: (state) => state.time,
            apply: (gl, location, value) => gl.uniform1f(location, value || 0)
        },
        dimensions: {
            uniform: 'u_dimension',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 4.0)
        },
        morphFactor: {
            uniform: 'u_morphFactor',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rotationSpeed: {
            uniform: 'u_rotationSpeed',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        universeModifier: {
            uniform: 'u_universeModifier',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 1)
        },
        patternIntensity: {
            uniform: 'u_patternIntensity',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 1)
        },
        gridDensity: {
            uniform: 'u_gridDensity',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        lineThickness: {
            uniform: 'u_lineThickness',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        shellWidth: {
            uniform: 'u_shellWidth',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        tetraThickness: {
            uniform: 'u_tetraThickness',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        glitchIntensity: {
            uniform: 'u_glitchIntensity',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        colorShift: {
            uniform: 'u_colorShift',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        interactionIntensity: {
            uniform: 'u_interactionIntensity',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        portalPulse: {
            uniform: 'u_portalPulse',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rot4dXY: {
            uniform: 'u_rot4dXY',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rot4dXZ: {
            uniform: 'u_rot4dXZ',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rot4dYZ: {
            uniform: 'u_rot4dYZ',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rot4dXW: {
            uniform: 'u_rot4dXW',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rot4dYW: {
            uniform: 'u_rot4dYW',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        rot4dZW: {
            uniform: 'u_rot4dZW',
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        audioBass: {
            uniform: 'u_audioBass',
            getter: (state) => state.audioLevels?.bass ?? 0,
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        audioMid: {
            uniform: 'u_audioMid',
            getter: (state) => state.audioLevels?.mid ?? 0,
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        audioHigh: {
            uniform: 'u_audioHigh',
            getter: (state) => state.audioLevels?.high ?? 0,
            apply: (gl, location, value) => gl.uniform1f(location, value ?? 0)
        },
        colorPrimary: {
            uniform: 'u_primaryColor',
            getter: (state) => state.colorScheme?.primary,
            apply: (gl, location, value = [0, 0, 0]) => gl.uniform3f(location, value[0] ?? 0, value[1] ?? 0, value[2] ?? 0)
        },
        colorSecondary: {
            uniform: 'u_secondaryColor',
            getter: (state) => state.colorScheme?.secondary,
            apply: (gl, location, value = [0, 0, 0]) => gl.uniform3f(location, value[0] ?? 0, value[1] ?? 0, value[2] ?? 0)
        },
        colorBackground: {
            uniform: 'u_backgroundColor',
            getter: (state) => state.colorScheme?.background,
            apply: (gl, location, value = [0, 0, 0]) => gl.uniform3f(location, value[0] ?? 0, value[1] ?? 0, value[2] ?? 0)
        },
        geometryType: {
            uniform: 'u_geometry',
            apply: (gl, location, value) => {
                const index = VIB34D_GEOMETRY_INDEX[value] ?? 0;
                gl.uniform1i(location, index);
            }
        }
    };
};

VIB34DHypercubeCore.prototype.resetUniformCache = function resetUniformCache() {
    if (!this.state || !this.state._dirtyUniforms) {
        this.state._dirtyUniforms = new Set();
    }
    const names = Object.keys(this.uniformBindings || {});
    this.state._dirtyUniforms.clear();
    names.forEach((name) => this.state._dirtyUniforms.add(name));
};

VIB34DHypercubeCore.prototype.markUniformDirty = function markUniformDirty(name) {
    if (!this.state || !this.state._dirtyUniforms) {
        this.state._dirtyUniforms = new Set();
    }
    if (this.uniformBindings && this.uniformBindings[name]) {
        this.state._dirtyUniforms.add(name);
    }
};

class VIB34DVisualizerPool {
    constructor() {
        this.instances = new Map();
        this.sharedGeometryManager = new VIB34DGeometryManager();
        this.sharedProjectionManager = new VIB34DProjectionManager();
        this.sharedShaderManager = new VIB34DShaderManager(this.sharedGeometryManager, this.sharedProjectionManager);
    }

    createInstance(canvas, config = {}) {
        const key = canvas.dataset.visualizerId || canvas.id || `viz-${this.instances.size}`;
        if (this.instances.has(key)) {
            return this.instances.get(key);
        }

        const instance = new VIB34DHypercubeCore(canvas, {
            geometryManager: this.sharedGeometryManager,
            projectionManager: this.sharedProjectionManager,
            shaderManager: this.sharedShaderManager,
            initialState: config.initialState || {}
        });

        this.instances.set(key, instance);
        return instance;
    }

    destroyInstance(canvas) {
        const key = canvas.dataset.visualizerId || canvas.id;
        if (!key) return;
        const instance = this.instances.get(key);
        if (instance) {
            instance.destroy();
            this.instances.delete(key);
        }
    }
}

if (typeof window !== 'undefined') {
    window.VIB34DSystem = window.VIB34DSystem || {};
    if (!window.VIB34DSystem.visualizerPool) {
        window.VIB34DSystem.visualizerPool = new VIB34DVisualizerPool();
    }
    window.VIB34DSystem.HypercubeCore = VIB34DHypercubeCore;
    window.VIB34DSystem.VisualizerPool = window.VIB34DSystem.visualizerPool;
}

class VIB34DGeometricTiltSystem {
    constructor() {
        this.isEnabled = false;
        this.hasPermission = false;
        this.tiltData = {
            alpha: 0,    // Z-axis rotation (compass)
            beta: 0,     // X-axis rotation (front-to-back tilt)
            gamma: 0     // Y-axis rotation (left-to-right tilt)
        };

        // VIB34D 4D rotation mapping
        this.rotation4D = {
            rot4dXW: 0.0,
            rot4dYW: 0.0,
            rot4dZW: 0.0,
            rot4dXY: 0.0,
            rot4dXZ: 0.0,
            rot4dYZ: 0.0
        };

        // Tilt sensitivity and smoothing
        this.sensitivity = {
            rot4dXW: 0.02,  // Beta (front-back) -> 4D X-W rotation
            rot4dYW: 0.02,  // Gamma (left-right) -> 4D Y-W rotation
            rot4dZW: 0.01,  // Alpha (compass) -> 4D Z-W rotation
            rot4dXY: 0.015, // Planar roll from combined tilt vectors
            rot4dXZ: 0.018, // Depth fold reacting to beta & alpha
            rot4dYZ: 0.018  // Shear fold reacting to gamma & alpha
        };

        this.smoothing = 0.15;
        this.visualizers = new Map();
        this.isSupported = this.checkDeviceOrientationSupport();
        this.eventTarget = typeof EventTarget !== 'undefined' ? new EventTarget() : null;
        this.lastTiltSnapshot = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            time: performance.now()
        };

        this.lastVisualSnapshot = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            time: typeof performance !== 'undefined' ? performance.now() : Date.now()
        };

        this.lastPortalProjection = { value: 0, depth: 0, shear: 0, pulse: 0, torsion: 0, envelope: 0 };

        this.init();
    }

    checkDeviceOrientationSupport() {
        return 'DeviceOrientationEvent' in window &&
               'DeviceMotionEvent' in window;
    }

    async init() {
        console.log('🎯 Initializing VIB34D Geometric Tilt System...');

        if (!this.isSupported) {
            console.warn('⚠️ Device orientation not supported on this device');
            this.createFallbackSystem();
            return;
        }

        // Request permission for iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.hasPermission = permission === 'granted';
                console.log('📱 Device orientation permission:', permission);
            } catch (error) {
                console.warn('⚠️ Permission request failed:', error);
                this.createFallbackSystem();
                return;
            }
        } else {
            this.hasPermission = true;
        }

        this.setupTiltListeners();
        this.findTiltCanvases();
        if (this.hasPermission) {
            this.enable();
        }
        console.log('✅ VIB34D Geometric Tilt System initialized');
    }

    setupTiltListeners() {
        // Device orientation event for tilt data
        window.addEventListener('deviceorientation', (event) => {
            if (!this.isEnabled) return;

            this.updateTiltData(event);
            this.processTiltUpdate();
        });

        // Fallback: Mouse movement for desktop testing
        if (!this.isSupported) {
            window.addEventListener('mousemove', (event) => {
                if (!this.isEnabled) return;
                this.simulateTiltFromMouse(event);
            });
        }
    }

    updateTiltData(event) {
        // Smooth the tilt data to prevent jitter
        this.tiltData.alpha += (event.alpha - this.tiltData.alpha) * this.smoothing;
        this.tiltData.beta += (event.beta - this.tiltData.beta) * this.smoothing;
        this.tiltData.gamma += (event.gamma - this.tiltData.gamma) * this.smoothing;

        // Clamp values to reasonable ranges
        this.tiltData.alpha = this.clampAngle(this.tiltData.alpha);
        this.tiltData.beta = this.clampAngle(this.tiltData.beta, -90, 90);
        this.tiltData.gamma = this.clampAngle(this.tiltData.gamma, -90, 90);
    }

    calculateVIB34DRotation() {
        // Map device tilt to VIB34D 4D rotation parameters
        // Following Paul Phillips' parameter ranges: rot4dXW/YW/ZW: -2.0 to 2.0

        // Beta (front-back tilt) controls X-W plane rotation
        this.rotation4D.rot4dXW = (this.tiltData.beta / 90) * 2.0 * this.sensitivity.rot4dXW;

        // Gamma (left-right tilt) controls Y-W plane rotation
        this.rotation4D.rot4dYW = (this.tiltData.gamma / 90) * 2.0 * this.sensitivity.rot4dYW;

        // Alpha (compass rotation) controls Z-W plane rotation
        this.rotation4D.rot4dZW = (this.tiltData.alpha / 180) * 2.0 * this.sensitivity.rot4dZW;

        const normAlpha = this.tiltData.alpha / 180;
        const normBeta = this.tiltData.beta / 90;
        const normGamma = this.tiltData.gamma / 90;
        const diagonal = (normGamma - normBeta) * 0.85;
        const swirl = normAlpha * 0.75;

        this.rotation4D.rot4dXY = (diagonal + swirl * 0.35) * 2.0 * this.sensitivity.rot4dXY;
        this.rotation4D.rot4dXZ = ((normBeta * 0.9) + swirl * 0.45) * 2.0 * this.sensitivity.rot4dXZ;
        this.rotation4D.rot4dYZ = ((normGamma * 0.9) - swirl * 0.45) * 2.0 * this.sensitivity.rot4dYZ;

        // Clamp to VIB34D parameter ranges
        this.rotation4D.rot4dXW = Math.max(-2.0, Math.min(2.0, this.rotation4D.rot4dXW));
        this.rotation4D.rot4dYW = Math.max(-2.0, Math.min(2.0, this.rotation4D.rot4dYW));
        this.rotation4D.rot4dZW = Math.max(-2.0, Math.min(2.0, this.rotation4D.rot4dZW));
        this.rotation4D.rot4dXY = Math.max(-2.0, Math.min(2.0, this.rotation4D.rot4dXY));
        this.rotation4D.rot4dXZ = Math.max(-2.0, Math.min(2.0, this.rotation4D.rot4dXZ));
        this.rotation4D.rot4dYZ = Math.max(-2.0, Math.min(2.0, this.rotation4D.rot4dYZ));
    }

    processTiltUpdate() {
        this.calculateVIB34DRotation();
        this.updateVisualizers();
        this.updateTiltUI();
        this.emitTiltMetrics();
    }

    simulateTiltFromMouse(event) {
        // Desktop fallback: simulate tilt from mouse position
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const deltaX = (event.clientX - centerX) / centerX;
        const deltaY = (event.clientY - centerY) / centerY;

        this.tiltData.gamma = deltaX * 45; // Left-right
        this.tiltData.beta = deltaY * 45;  // Up-down
        this.tiltData.alpha += 0.5;       // Slow rotation

        this.processTiltUpdate();
    }

    findTiltCanvases() {
        // Find all cards with VIB34D visualizers and create dual-layer instances
        const cards = document.querySelectorAll('[data-vib34d]');

        cards.forEach(card => {
            const primaryCanvas = card.querySelector('.vib34d-tilt-canvas');
            if (!primaryCanvas) return;

            const accentCanvas = card.querySelector('.vib34d-accent-canvas');
            const systemType = card.dataset.vib34d;
            this.createTiltVisualizer(card, primaryCanvas, systemType, accentCanvas);
        });

        console.log(`🎨 Created ${this.visualizers.size} VIB34D tilt visualizer stacks`);
    }

    createTiltVisualizer(card, canvas, systemType, accentCanvas) {
        const visualizer = new VIB34DTiltVisualizer(canvas, systemType, { accentCanvas });
        const key = canvas.id || `visualizer-${this.visualizers.size}`;
        this.visualizers.set(key, visualizer);
        canvas.vib34dVisualizer = visualizer;
        card.vib34dVisualizer = visualizer;
        if (accentCanvas) {
            accentCanvas.vib34dVisualizer = visualizer;
        }
    }

    updateVisualizers() {
        const normalized = {
            alpha: this.tiltData.alpha / 180,
            beta: this.tiltData.beta / 90,
            gamma: this.tiltData.gamma / 90
        };

        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const previous = this.lastVisualSnapshot || { alpha: 0, beta: 0, gamma: 0, time: now - 16 };
        const dt = Math.max(0.016, (now - (previous.time || now - 16)) / 1000);

        const deltaAlpha = this.normalizeAngleDelta(this.tiltData.alpha, previous.alpha || 0);
        const deltaBeta = this.tiltData.beta - (previous.beta || 0);
        const deltaGamma = this.tiltData.gamma - (previous.gamma || 0);

        const velocity = {
            alpha: deltaAlpha / dt,
            beta: deltaBeta / dt,
            gamma: deltaGamma / dt
        };

        const planarMagnitude = Math.sqrt((normalized.beta ** 2) + (normalized.gamma ** 2));
        const velocityMagnitude = Math.min(1.4, Math.sqrt(((velocity.beta || 0) / 120) ** 2 + ((velocity.gamma || 0) / 120) ** 2));
        const intensity = Math.max(0, Math.min(1.4, planarMagnitude * 0.85 + velocityMagnitude * 0.45));

        const portalProjection = vib34dComputePortalProjection(normalized, this.rotation4D, intensity);
        this.lastPortalProjection = portalProjection;

        // Update all VIB34D visualizers with current 4D rotation and portal context
        this.visualizers.forEach((visualizer) => {
            visualizer.updateRotation4D(this.rotation4D, {
                normalized,
                velocity,
                intensity,
                portalProjection
            });
        });

        this.lastVisualSnapshot = {
            alpha: this.tiltData.alpha,
            beta: this.tiltData.beta,
            gamma: this.tiltData.gamma,
            time: now
        };

        // Also update global VIB34D system if available
        if (window.updateParameter) {
            window.updateParameter('rot4dXW', this.rotation4D.rot4dXW);
            window.updateParameter('rot4dYW', this.rotation4D.rot4dYW);
            window.updateParameter('rot4dZW', this.rotation4D.rot4dZW);
            window.updateParameter('rot4dXY', this.rotation4D.rot4dXY);
            window.updateParameter('rot4dXZ', this.rotation4D.rot4dXZ);
            window.updateParameter('rot4dYZ', this.rotation4D.rot4dYZ);
        }
    }

    updateTiltUI() {
        // Update tilt indicator UI
        const tiltX = document.getElementById('tilt-x');
        const tiltY = document.getElementById('tilt-y');
        const rot4d = document.getElementById('rot4d');

        if (tiltX) tiltX.textContent = this.tiltData.beta.toFixed(1);
        if (tiltY) tiltY.textContent = this.tiltData.gamma.toFixed(1);
        if (rot4d) rot4d.textContent = this.isEnabled ? 'Active' : 'Inactive';
    }

    emitTiltMetrics() {
        if (!this.eventTarget || !this.isEnabled) return;

        const now = performance.now();
        const previous = this.lastTiltSnapshot || { alpha: 0, beta: 0, gamma: 0, time: now - 16 };
        const dt = Math.max(0.016, (now - previous.time) / 1000);

        const deltaAlpha = this.normalizeAngleDelta(this.tiltData.alpha, previous.alpha);
        const deltaBeta = this.tiltData.beta - previous.beta;
        const deltaGamma = this.tiltData.gamma - previous.gamma;

        const velocity = {
            alpha: deltaAlpha / dt,
            beta: deltaBeta / dt,
            gamma: deltaGamma / dt
        };

        const normalized = {
            alpha: this.tiltData.alpha / 180,
            beta: this.tiltData.beta / 90,
            gamma: this.tiltData.gamma / 90
        };

        const planarMagnitude = Math.sqrt((normalized.beta ** 2) + (normalized.gamma ** 2));
        const velocityMagnitude = Math.min(1.4, Math.sqrt(((velocity.beta / 120) ** 2) + ((velocity.gamma / 120) ** 2)));
        const intensity = Math.max(0, Math.min(1.2, planarMagnitude * 0.85 + velocityMagnitude * 0.45));

        const portalProjection = this.calculatePortalProjection(normalized, this.rotation4D, intensity);

        const detail = {
            timestamp: now,
            raw: { ...this.tiltData },
            normalized,
            velocity,
            intensity,
            rotation4D: { ...this.rotation4D },
            portalProjection
        };

        this.emit('tilt-vector', detail);
        this.lastTiltSnapshot = { ...this.tiltData, time: now };
    }

    calculatePortalProjection(normalized = {}, rotation4D = this.rotation4D, intensity = 0) {
        return vib34dComputePortalProjection(normalized, rotation4D, intensity);
    }

    clampAngle(angle, min = -180, max = 180) {
        if (angle === null || angle === undefined) return 0;
        return Math.max(min, Math.min(max, angle));
    }

    clamp(value, min, max) {
        if (value === null || value === undefined || Number.isNaN(value)) return min;
        return Math.max(min, Math.min(max, value));
    }

    normalizeAngleDelta(current, previous) {
        let delta = current - previous;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        return delta;
    }

    createFallbackSystem() {
        console.log('🖱️ Creating mouse-based fallback tilt system');
        this.isSupported = true; // Enable mouse fallback
        this.hasPermission = true;
        this.setupTiltListeners();
        this.findTiltCanvases();
        this.enable();
    }

    enable() {
        if (!this.hasPermission) {
            console.warn('⚠️ Cannot enable tilt system without permission');
            return false;
        }
        if (this.isEnabled) return true;

        this.isEnabled = true;
        console.log('✅ VIB34D Geometric Tilt System ENABLED');
        this.emitTiltMetrics();
        return true;
    }

    disable() {
        if (!this.isEnabled) return;
        this.isEnabled = false;
        console.log('⏸️ VIB34D Geometric Tilt System DISABLED');
    }

    toggle() {
        return this.isEnabled ? (this.disable(), false) : this.enable();
    }

    setSensitivity(rot4dXW, rot4dYW, rot4dZW, extra = {}) {
        if (typeof rot4dXW === 'object') {
            const config = rot4dXW || {};
            this.sensitivity.rot4dXW = config.rot4dXW ?? this.sensitivity.rot4dXW;
            this.sensitivity.rot4dYW = config.rot4dYW ?? this.sensitivity.rot4dYW;
            this.sensitivity.rot4dZW = config.rot4dZW ?? this.sensitivity.rot4dZW;
            this.sensitivity.rot4dXY = config.rot4dXY ?? this.sensitivity.rot4dXY;
            this.sensitivity.rot4dXZ = config.rot4dXZ ?? this.sensitivity.rot4dXZ;
            this.sensitivity.rot4dYZ = config.rot4dYZ ?? this.sensitivity.rot4dYZ;
        } else {
            this.sensitivity.rot4dXW = rot4dXW;
            this.sensitivity.rot4dYW = rot4dYW;
            this.sensitivity.rot4dZW = rot4dZW;
            if (extra && typeof extra === 'object') {
                this.sensitivity.rot4dXY = extra.rot4dXY ?? this.sensitivity.rot4dXY;
                this.sensitivity.rot4dXZ = extra.rot4dXZ ?? this.sensitivity.rot4dXZ;
                this.sensitivity.rot4dYZ = extra.rot4dYZ ?? this.sensitivity.rot4dYZ;
            }
        }
        console.log('🎛️ Tilt sensitivity updated:', this.sensitivity);
    }

    getCurrentRotation4D() {
        return { ...this.rotation4D };
    }

    destroy() {
        this.visualizers.forEach(visualizer => visualizer.destroy());
        this.visualizers.clear();
        this.isEnabled = false;
        console.log('🗑️ VIB34D Geometric Tilt System destroyed');
    }

    on(eventName, handler) {
        if (!this.eventTarget || typeof handler !== 'function') {
            return () => {};
        }
        const listener = (event) => handler(event.detail, event);
        this.eventTarget.addEventListener(eventName, listener);
        return () => this.eventTarget.removeEventListener(eventName, listener);
    }

    off(eventName, handler) {
        if (!this.eventTarget || typeof handler !== 'function') return;
        this.eventTarget.removeEventListener(eventName, handler);
    }

    emit(eventName, detail = {}) {
        if (!this.eventTarget) return;
        this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

/**
 * VIB34D TILT VISUALIZER
 * Individual canvas visualizer that responds to geometric tilt
 */
class VIB34DTiltVisualizer {
    constructor(canvas, systemType, options = {}) {
        this.canvas = canvas;
        this.systemType = systemType || 'quantum';
        this.presets = this.getSystemPreset(this.systemType);
        this.reactivityLibrary = new VIB34DReactivePresetLibrary();
        this.accentCanvas = options.accentCanvas || null;

        if (!window.VIB34DSystem || !window.VIB34DSystem.visualizerPool) {
            window.VIB34DSystem = window.VIB34DSystem || {};
            window.VIB34DSystem.visualizerPool = new VIB34DVisualizerPool();
        }

        this.pool = window.VIB34DSystem.visualizerPool;
        this.rotation4D = { rot4dXW: 0, rot4dYW: 0, rot4dZW: 0, rot4dXY: 0, rot4dXZ: 0, rot4dYZ: 0 };

        if (this.canvas && !this.canvas.dataset.visualizerId && this.canvas.id) {
            this.canvas.dataset.visualizerId = this.canvas.id;
        }
        if (this.accentCanvas && !this.accentCanvas.dataset.visualizerId) {
            const baseId = this.canvas && (this.canvas.id || this.canvas.dataset.visualizerId)
                ? (this.canvas.id || this.canvas.dataset.visualizerId)
                : `viz-${Date.now()}`;
            this.accentCanvas.dataset.visualizerId = `${baseId}-accent`;
        }

        const initialGeometry = this.presets.geometryCycle[0] || 'hypercube';
        this.state = {
            speed: this.presets.baseSpeed,
            glitch: this.presets.baseGlitch,
            density: this.presets.baseDensity,
            moire: this.presets.baseMoire,
            hue: this.presets.baseHue,
            accentHue: this.presets.accentHue,
            energy: 0.4,
            geometryVariant: initialGeometry,
            wDepth: 0.4,
            wShear: 0,
            wPulse: 0.2
        };

        this.targetState = { ...this.state };
        this.variantIndex = 0;
        this.activeState = 'far-depth';
        this.hasBeenFocused = false;

        this.interaction = { active: false, start: 0, duration: 0, peak: 0, magnitude: 0 };
        this.audioEnergy = 0;
        this.audioPeak = 0;

        this.portalProjection = { value: 0, depth: 0.35, shear: 0, pulse: 0, angle: 0, radius: 0 };

        this.animationFrame = null;
        this.lastUpdate = performance.now();
        this.flourishIndex = 0;
        this.lastFlourish = null;

        const initialColorScheme = this.buildColorScheme(this.state.hue, this.state.accentHue, this.state.energy, this.state.density);
        this.core = this.pool.createInstance(this.canvas, {
            initialState: {
                geometryType: initialGeometry,
                colorScheme: initialColorScheme,
                gridDensity: 5.0 + this.state.density * 3.5,
                morphFactor: 0.55 + this.state.moire * 0.4
            }
        });

        this.accentCore = null;
        if (this.accentCanvas) {
            const accentGeometry = this.resolveAccentGeometry(initialGeometry);
            const accentColorScheme = this.buildAccentColorScheme(this.state.accentHue, this.state.hue, this.state.energy, this.state.density);
            this.accentCore = this.pool.createInstance(this.accentCanvas, {
                initialState: {
                    geometryType: accentGeometry,
                    colorScheme: accentColorScheme,
                    gridDensity: Math.max(0.4, 6.2 - this.state.density * 1.6),
                    morphFactor: 0.45 + (1 - this.state.moire) * 0.3
                }
            });
        }

        this.startStateLoop();
    }

    getSystemPreset(systemType = 'quantum') {
        const presets = {
            quantum: {
                baseHue: 278,
                accentHue: 208,
                baseSpeed: 1.12,
                baseGlitch: 0.35,
                baseDensity: 0.95,
                baseMoire: 0.42,
                geometryCycle: ['hypercube', 'wave', 'crystal', 'lattice']
            },
            holographic: {
                baseHue: 330,
                accentHue: 182,
                baseSpeed: 1.28,
                baseGlitch: 0.42,
                baseDensity: 0.85,
                baseMoire: 0.52,
                geometryCycle: ['torus', 'klein', 'ribbon', 'shell']
            },
            faceted: {
                baseHue: 202,
                accentHue: 150,
                baseSpeed: 0.98,
                baseGlitch: 0.3,
                baseDensity: 1.05,
                baseMoire: 0.34,
                geometryCycle: ['crystal', 'tetrahedron', 'lattice']
            }
        };

        const basePreset = presets[systemType] || presets.quantum;
        const cycle = (basePreset.geometryCycle || []).filter((name) => VIB34D_GEOMETRY_INDEX[name] !== undefined);
        return {
            ...basePreset,
            geometryCycle: cycle.length ? cycle : ['hypercube']
        };
    }

    ensureGeometryVariant(variant) {
        if (variant && VIB34D_GEOMETRY_INDEX[variant] !== undefined) {
            return variant;
        }
        return this.presets.geometryCycle[0] || 'hypercube';
    }

    startStateLoop() {
        if (this.animationFrame) return;
        const loop = () => {
            const now = performance.now();
            this.updateState(now);
            this.applyToCore();
            this.animationFrame = requestAnimationFrame(loop);
        };
        this.animationFrame = requestAnimationFrame(loop);
    }

    stopStateLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    updateState(now) {
        const delta = Math.max(0.00016, (now - this.lastUpdate) / 1000);
        this.lastUpdate = now;
        const factor = 1 - Math.exp(-delta * 4.2);
        const props = ['speed', 'glitch', 'density', 'moire', 'hue', 'accentHue', 'energy', 'wDepth', 'wShear', 'wPulse'];
        for (const prop of props) {
            const target = this.targetState[prop];
            if (typeof target === 'number') {
                this.state[prop] += (target - this.state[prop]) * factor;
            }
        }

        this.state.hue = this.normalizeHue(this.state.hue);
        this.state.accentHue = this.normalizeHue(this.state.accentHue);
        this.state.geometryVariant = this.ensureGeometryVariant(this.targetState.geometryVariant);

        if (this.interaction.active) {
            const progress = (now - this.interaction.start) / this.interaction.duration;
            if (progress >= 1) {
                this.interaction.active = false;
                this.interaction.magnitude = 0;
            } else {
                this.interaction.magnitude = Math.sin(progress * Math.PI) * this.interaction.peak;
            }
        } else {
            this.interaction.magnitude *= Math.max(0, 1 - delta * 2.6);
        }

        this.audioEnergy = Math.max(0, this.audioEnergy - delta * 0.9);
        this.audioPeak = Math.max(0, this.audioPeak - delta * 1.8);
    }

    applyToCore() {
        if (!this.core || typeof this.core.updateParameters !== 'function') return;

        const colorScheme = this.buildColorScheme(this.state.hue, this.state.accentHue, this.state.energy, this.state.density);
        const glitch = Math.max(0, this.state.glitch + this.interaction.magnitude * 0.35 + this.audioPeak * 0.6);
        const portalPulse = Math.max(this.state.wPulse, this.portalProjection.pulse || 0);
        const interactionIntensity = Math.min(1.2, this.state.energy + this.interaction.magnitude + this.audioEnergy * 0.6);

        this.core.updateParameters({
            geometryType: this.state.geometryVariant,
            dimensions: 3.4 + this.state.wDepth * 0.8,
            morphFactor: 0.55 + this.state.moire * 0.45,
            rotationSpeed: 0.25 + this.state.speed * 0.35,
            universeModifier: 0.9 + portalPulse * 0.35,
            patternIntensity: 0.75 + this.state.energy * 0.5 + this.audioEnergy * 0.3,
            gridDensity: Math.max(0.6, 5.0 + this.state.density * 3.5),
            lineThickness: Math.max(0.005, 0.03 - this.state.density * 0.01),
            shellWidth: 0.02 + this.state.moire * 0.018,
            tetraThickness: 0.03 + glitch * 0.012,
            glitchIntensity: glitch,
            colorShift: (this.state.hue - this.presets.baseHue) / 360,
            interactionIntensity,
            portalPulse,
            rot4dXW: this.rotation4D.rot4dXW || 0,
            rot4dYW: this.rotation4D.rot4dYW || 0,
            rot4dZW: this.rotation4D.rot4dZW || 0,
            audioLevels: {
                bass: this.audioEnergy,
                mid: this.state.energy,
                high: this.audioPeak
            },
            colorScheme
        });

        if (this.accentCore && typeof this.accentCore.updateParameters === 'function') {
            const accentGeometry = this.resolveAccentGeometry(this.state.geometryVariant);
            const accentColorScheme = this.buildAccentColorScheme(this.state.accentHue, this.state.hue, this.state.energy, this.state.density);
            const accentGlitch = Math.max(0, glitch * 0.5 + this.interaction.magnitude * 0.2);
            const accentInteraction = Math.max(0.28, 0.65 - interactionIntensity * 0.35);
            const accentDensity = Math.max(0.45, 6.2 - this.state.density * 2.1 + this.interaction.magnitude * 1.2);
            const accentMorph = Math.max(0.32, Math.min(0.78, 0.42 + (1 - this.state.moire) * 0.35));
            const accentDimensions = Math.max(2.6, Math.min(3.8, 3.1 + (1.2 - this.state.wDepth) * 0.45));
            const accentUniverse = Math.max(0.7, 0.9 + (1 - portalPulse) * 0.28);
            const accentPattern = Math.max(0.4, 0.55 + (1 - this.state.energy) * 0.35 + this.audioEnergy * 0.25);
            const accentLineThickness = Math.max(0.006, 0.018 + (1 - this.state.density) * 0.01);
            const accentShellWidth = Math.max(0.01, 0.014 + (1 - this.state.moire) * 0.014);
            const accentTetra = Math.max(0.02, 0.026 + accentGlitch * 0.012);

            this.accentCore.updateParameters({
                geometryType: accentGeometry,
                dimensions: accentDimensions,
                morphFactor: accentMorph,
                rotationSpeed: 0.2 + this.state.speed * 0.18,
                universeModifier: accentUniverse,
                patternIntensity: accentPattern,
                gridDensity: accentDensity,
                lineThickness: accentLineThickness,
                shellWidth: accentShellWidth,
                tetraThickness: accentTetra,
                glitchIntensity: accentGlitch,
                colorShift: (this.state.accentHue - this.presets.accentHue) / 360,
                interactionIntensity: accentInteraction,
                colorScheme: accentColorScheme
            });
        }
    }

    applyTiltVector(tilt = {}) {
        const normalized = tilt.normalized || {};
        const rotation4D = tilt.rotation4D || this.rotation4D;
        const velocity = tilt.velocity || {};
        const forward = this.clamp(normalized.beta || 0, -1.2, 1.2);
        const lateral = this.clamp(normalized.gamma || 0, -1.2, 1.2);
        const swirl = this.clamp(normalized.alpha || 0, -1.2, 1.2);
        const intensity = typeof tilt.intensity === 'number'
            ? this.clamp(tilt.intensity, 0, 1.4)
            : Math.min(1.4, Math.hypot(forward, lateral));

        this.updateRotation4D(rotation4D);
        const portalProjection = this.resolvePortalProjection(tilt);
        this.portalProjection = portalProjection;

        this.targetState.speed = this.presets.baseSpeed + Math.abs(lateral) * 0.45 + intensity * 0.6;
        this.targetState.glitch = this.presets.baseGlitch + Math.abs(velocity.beta || 0) * 0.015 + Math.abs(rotation4D.rot4dZW || 0) * 0.4 + intensity * 0.25;
        this.targetState.moire = this.presets.baseMoire + Math.abs(forward) * 0.42 + Math.abs(swirl) * 0.22;
        this.targetState.density = this.presets.baseDensity - lateral * 0.28 - forward * 0.3;
        this.targetState.energy = Math.max(this.targetState.energy, 0.45 + intensity * 0.65);
        this.targetState.hue = this.normalizeHue(this.presets.baseHue + swirl * 70 + (portalProjection.value || 0) * 18);
        this.targetState.accentHue = this.normalizeHue(this.presets.accentHue + swirl * 48);
        this.targetState.wDepth = 0.45 + Math.abs(portalProjection.depth || 0) * 1.1;
        this.targetState.wShear = portalProjection.shear || 0;
        this.targetState.wPulse = Math.max(this.targetState.wPulse, (portalProjection.pulse || 0) + intensity * 0.4);

        if (Math.abs(swirl) > 0.65 && this.presets.geometryCycle.length > 1) {
            const advance = swirl > 0 ? 1 : -1;
            this.variantIndex = (this.variantIndex + advance + this.presets.geometryCycle.length) % this.presets.geometryCycle.length;
            this.targetState.geometryVariant = this.presets.geometryCycle[this.variantIndex];
        }

        const velocityMagnitude = Math.min(1.2, Math.hypot((velocity.beta || 0) / 140, (velocity.gamma || 0) / 140));
        this.interaction = {
            active: true,
            start: performance.now(),
            duration: 720 + intensity * 360,
            peak: Math.min(1.8, intensity * 0.9 + velocityMagnitude * 0.8),
            magnitude: this.interaction.magnitude
        };
    }

    resolvePortalProjection(tilt = {}) {
        if (tilt.portalProjection) {
            return {
                value: tilt.portalProjection.value || 0,
                depth: typeof tilt.portalProjection.depth === 'number' ? tilt.portalProjection.depth : 0,
                shear: tilt.portalProjection.shear || 0,
                pulse: Math.max(0, tilt.portalProjection.pulse || 0),
                angle: tilt.portalProjection.angle || 0,
                radius: tilt.portalProjection.radius || 0
            };
        }

        const normalized = tilt.normalized || {};
        const rotation4D = tilt.rotation4D || this.rotation4D;
        const intensity = typeof tilt.intensity === 'number' ? tilt.intensity : 0;
        return this.computePortalProjectionFromTilt(normalized, rotation4D, intensity);
    }

    computePortalProjectionFromTilt(normalized = {}, rotation4D = {}, intensity = 0) {
        return vib34dComputePortalProjection(normalized, rotation4D, intensity);
    }

    applyInteractionResponse(options = {}) {
        const finalOptions = this.decorateInteractionOptions(options);
        return this.applyInteractionResponseInternal(finalOptions);
    }

    decorateInteractionOptions(options = {}) {
        const clone = { ...options };

        if (!this.reactivityLibrary) {
            delete clone.stage;
            delete clone.channel;
            delete clone.preset;
            return clone;
        }

        const baseIntensity = typeof clone.intensity === 'number' ? clone.intensity : 0.45;
        const context = {
            preset: clone.preset,
            stage: clone.stage,
            channel: clone.channel,
            intensity: baseIntensity,
            polarity: clone.polarity >= 0 ? 1 : -1
        };

        const blueprint = this.reactivityLibrary.provide(context);

        if (blueprint) {
            const intensityScale = typeof blueprint.intensityScale === 'number' ? blueprint.intensityScale : 1;
            const scaledIntensity = baseIntensity * intensityScale;
            if (clone.intensity !== undefined) {
                clone.intensity = clone.intensity * intensityScale;
            } else {
                clone.intensity = scaledIntensity;
            }

            if (typeof blueprint.densityBias === 'number') {
                clone.densityBias = (clone.densityBias || 0) + blueprint.densityBias;
            }
            if (typeof blueprint.hueSpin === 'number') {
                clone.hueSpin = (clone.hueSpin || 0) + blueprint.hueSpin;
            }
            if (blueprint.geometryAdvance) {
                const advanceValue = typeof blueprint.geometryAdvance === 'number'
                    ? blueprint.geometryAdvance
                    : 1;
                const currentAdvance = typeof clone.geometryAdvance === 'number' ? clone.geometryAdvance : 0;
                clone.geometryAdvance = currentAdvance + advanceValue;
            }
            if (blueprint.duration) {
                clone.duration = Math.max(clone.duration || 0, blueprint.duration);
            }

            const direct = blueprint.direct || {};
            if (typeof direct.speed === 'number') {
                this.targetState.speed += direct.speed;
            }
            if (typeof direct.glitch === 'number') {
                this.targetState.glitch += direct.glitch;
            }
            if (typeof direct.density === 'number') {
                this.targetState.density += direct.density;
            }
            if (typeof direct.moire === 'number') {
                this.targetState.moire += direct.moire;
            }
            if (typeof direct.energy === 'number') {
                this.targetState.energy += direct.energy;
            }
            if (typeof direct.hueShift === 'number') {
                this.targetState.hue = this.normalizeHue((this.targetState.hue || this.presets.baseHue) + direct.hueShift);
            }
            if (typeof direct.accentHueShift === 'number') {
                this.targetState.accentHue = this.normalizeHue((this.targetState.accentHue || this.presets.accentHue) + direct.accentHueShift);
            }
            if (typeof direct.wDepth === 'number') {
                this.targetState.wDepth = Math.min(1.7, (this.targetState.wDepth || 0.4) + direct.wDepth);
            }
            if (typeof direct.wPulse === 'number') {
                this.targetState.wPulse = Math.max(this.targetState.wPulse || 0.2, direct.wPulse);
            }
            if (direct.geometryVariant) {
                this.targetState.geometryVariant = this.ensureGeometryVariant(direct.geometryVariant);
                const index = this.presets.geometryCycle.indexOf(this.targetState.geometryVariant);
                if (index >= 0) {
                    this.variantIndex = index;
                }
            }

            if (blueprint.accent) {
                if (typeof blueprint.accent.hueShift === 'number') {
                    this.targetState.accentHue = this.normalizeHue((this.targetState.accentHue || this.presets.accentHue) + blueprint.accent.hueShift);
                }
                if (typeof blueprint.accent.moire === 'number') {
                    this.targetState.moire += blueprint.accent.moire;
                }
                if (typeof blueprint.accent.density === 'number') {
                    this.targetState.density += blueprint.accent.density;
                }
            }
        }

        delete clone.stage;
        delete clone.channel;
        delete clone.preset;
        return clone;
    }

    getDestructionFlourish() {
        const library = VIB34D_DESTRUCTION_FLOURISHES[this.systemType]
            || VIB34D_DESTRUCTION_FLOURISHES.default
            || [];
        if (!library.length) {
            return null;
        }
        const flourish = library[this.flourishIndex % library.length];
        this.flourishIndex = (this.flourishIndex + 1) % library.length;
        return flourish ? { ...flourish } : null;
    }

    applyDestructionFlourish(flourish, trait = {}) {
        if (!flourish) return trait;

        this.lastFlourish = flourish;

        const merged = { ...trait };
        const inherit = flourish.inherit || {};

        if (typeof inherit.hueShift === 'number') {
            merged.hueShift = (merged.hueShift || 0) + inherit.hueShift;
        }
        if (typeof inherit.accentShift === 'number') {
            merged.accentShift = (merged.accentShift || 0) + inherit.accentShift;
        }
        if (typeof inherit.moireBoost === 'number') {
            merged.moireBoost = (merged.moireBoost || 0) + inherit.moireBoost;
            this.targetState.moire += inherit.moireBoost;
        }
        if (typeof inherit.glitchBoost === 'number') {
            merged.glitchBoost = (merged.glitchBoost || 0) + inherit.glitchBoost;
            this.targetState.glitch += inherit.glitchBoost;
        }
        if (typeof inherit.energyBoost === 'number') {
            merged.energyBoost = (merged.energyBoost || 0) + inherit.energyBoost;
            this.targetState.energy += inherit.energyBoost;
        }
        if (inherit.geometryVariant) {
            merged.geometryVariant = this.ensureGeometryVariant(inherit.geometryVariant);
            this.targetState.geometryVariant = merged.geometryVariant;
            const index = this.presets.geometryCycle.indexOf(merged.geometryVariant);
            if (index >= 0) {
                this.variantIndex = index;
            }
        }
        if (typeof inherit.portalPulse === 'number') {
            merged.portalPulse = Math.max(merged.portalPulse || 0, inherit.portalPulse);
            this.targetState.wPulse = Math.max(this.targetState.wPulse || 0, inherit.portalPulse);
        }

        const core = flourish.core || {};
        if (typeof core.speed === 'number') {
            this.targetState.speed += core.speed;
        }
        if (typeof core.glitch === 'number') {
            this.targetState.glitch += core.glitch;
        }
        if (typeof core.moire === 'number') {
            this.targetState.moire += core.moire;
        }
        if (typeof core.density === 'number') {
            this.targetState.density = Math.max(0.05, this.targetState.density + core.density);
        }
        if (core.geometryVariant && !inherit.geometryVariant) {
            const variant = this.ensureGeometryVariant(core.geometryVariant);
            if (variant) {
                this.targetState.geometryVariant = variant;
                const index = this.presets.geometryCycle.indexOf(variant);
                if (index >= 0) {
                    this.variantIndex = index;
                }
                merged.geometryVariant = variant;
            }
        }

        const accent = flourish.accent || {};
        if (this.accentCore && typeof this.accentCore.updateParameters === 'function') {
            const accentParams = {};
            if (typeof accent.hueShift === 'number') {
                const accentHue = this.normalizeHue((this.targetState.accentHue || this.presets.accentHue) + accent.hueShift);
                this.targetState.accentHue = accentHue;
                accentParams.colorShift = accent.hueShift / 360;
            }
            if (typeof accent.glitch === 'number') {
                accentParams.glitchIntensity = Math.max(0, (this.targetState.glitch || 0.4) * 0.6 + accent.glitch);
            }
            if (typeof accent.moire === 'number') {
                accentParams.patternIntensity = 0.7 + Math.max(-0.4, accent.moire);
            }
            if (Object.keys(accentParams).length) {
                this.accentCore.updateParameters(accentParams);
            }
        }

        if (flourish.fragment?.type) {
            merged.fragmentCue = flourish.fragment.type;
        }
        if (flourish.fragment?.segments) {
            merged.fragmentSegments = Array.isArray(flourish.fragment.segments)
                ? [...flourish.fragment.segments]
                : flourish.fragment.segments;
        }

        merged.flourishSignature = flourish.id;
        merged.flourishLabel = flourish.label;
        merged.flourish = {
            core: { ...core },
            partner: flourish.partner ? { ...flourish.partner } : null,
            portal: flourish.portal ? { ...flourish.portal } : null,
            background: flourish.background ? { ...flourish.background } : null,
            fragment: flourish.fragment ? { ...flourish.fragment } : null
        };

        return merged;
    }

    applyInteractionResponseInternal(options = {}) {
        const intensity = this.clamp(typeof options.intensity === 'number' ? options.intensity : 0.45, 0, 2.4);
        const polarity = options.polarity >= 0 ? 1 : -1;

        this.targetState.speed += intensity * 0.35;
        this.targetState.glitch += intensity * 0.4;
        this.targetState.energy += intensity * 0.5;
        this.targetState.moire += intensity * 0.28 * polarity;
        if (options.densityBias) {
            this.targetState.density += intensity * options.densityBias * 0.22;
        }
        if (typeof options.speedBoost === 'number') {
            this.targetState.speed += options.speedBoost * intensity;
        }
        if (typeof options.glitchBoost === 'number') {
            this.targetState.glitch += options.glitchBoost * intensity;
        }
        if (typeof options.moireBoost === 'number') {
            this.targetState.moire += options.moireBoost * intensity;
        }
        if (typeof options.energyBoost === 'number') {
            this.targetState.energy += options.energyBoost * intensity;
        }
        if (typeof options.densityTarget === 'number' && Number.isFinite(options.densityTarget)) {
            const baseDensity = Number.isFinite(this.targetState.density)
                ? this.targetState.density
                : this.presets.baseDensity;
            const targetDensity = Math.max(0.05, options.densityTarget);
            this.targetState.density = baseDensity + (targetDensity - baseDensity) * 0.45;
        }
        if (typeof options.densityFloor === 'number' && Number.isFinite(options.densityFloor)) {
            this.targetState.density = Math.min(this.targetState.density, options.densityFloor);
        }
        if (typeof options.densityCeiling === 'number' && Number.isFinite(options.densityCeiling)) {
            this.targetState.density = Math.max(this.targetState.density, options.densityCeiling);
        }
        if (typeof options.speedFloor === 'number' && Number.isFinite(options.speedFloor)) {
            this.targetState.speed = Math.max(this.targetState.speed, options.speedFloor);
        }
        if (typeof options.speedCeiling === 'number' && Number.isFinite(options.speedCeiling)) {
            this.targetState.speed = Math.min(this.targetState.speed, options.speedCeiling);
        }
        if (options.hueSpin) {
            this.targetState.hue = this.normalizeHue(this.state.hue + options.hueSpin * 16);
            this.targetState.accentHue = this.normalizeHue(this.state.accentHue + options.hueSpin * 12);
        }
        if (options.geometryAdvance && this.presets.geometryCycle.length > 1) {
            const advance = options.geometryAdvance > 0 ? 1 : -1;
            this.variantIndex = (this.variantIndex + advance + this.presets.geometryCycle.length) % this.presets.geometryCycle.length;
            this.targetState.geometryVariant = this.presets.geometryCycle[this.variantIndex];
        }
        if (options.geometryVariant) {
            const variant = this.ensureGeometryVariant(options.geometryVariant);
            if (variant) {
                this.targetState.geometryVariant = variant;
                const idx = this.presets.geometryCycle.indexOf(variant);
                if (idx >= 0) {
                    this.variantIndex = idx;
                }
            }
        }

        this.interaction = {
            active: true,
            start: performance.now(),
            duration: options.duration || 720,
            peak: Math.min(1.8, intensity * 0.9 + Math.abs(polarity) * 0.3),
            magnitude: this.interaction.magnitude
        };

        this.applyAccentCounterResponse(intensity, polarity, options);
    }

    applyAccentCounterResponse(intensity = 0, polarity = 1, options = {}) {
        if (!this.accentCore || typeof this.accentCore.updateParameters !== 'function') return;

        const clampedIntensity = this.clamp(intensity, 0, 2.4);
        const baseGlitch = (this.targetState.glitch ?? this.state.glitch ?? this.presets.baseGlitch);
        const baseMoire = (this.targetState.moire ?? this.state.moire ?? this.presets.baseMoire);
        const baseDensity = (this.targetState.density ?? this.state.density ?? this.presets.baseDensity);
        const basePulse = (this.targetState.wPulse ?? this.state.wPulse ?? 0.2);
        const hueBase = this.normalizeHue(this.targetState.accentHue ?? this.state.accentHue ?? this.presets.accentHue);
        const hueDiff = ((hueBase - this.presets.accentHue + 540) % 360) - 180;

        this.accentCore.updateParameters({
            rotationSpeed: Math.max(0.24, this.presets.baseSpeed * 0.42 + clampedIntensity * 0.38 - polarity * 0.08),
            glitchIntensity: Math.max(0.08, baseGlitch * 0.32 + clampedIntensity * 0.3),
            patternIntensity: this.clamp(0.55 + baseMoire * 0.32 - polarity * clampedIntensity * 0.18, 0.2, 1.85),
            gridDensity: Math.max(0.35, 6.2 - baseDensity * 1.65 + polarity * clampedIntensity * 0.55),
            morphFactor: this.clamp(0.42 + basePulse * 0.6 + clampedIntensity * 0.08, 0.24, 1.65),
            interactionIntensity: 0.38 + clampedIntensity * 0.24,
            portalPulse: Math.max(0.16, 0.48 - polarity * 0.06 + basePulse * 0.24),
            colorShift: hueDiff / 360 + (options && typeof options.hueSpin === 'number' ? options.hueSpin * -0.04 : 0)
        });
    }

    applyAccentAudioResponse(level = 0, meta = {}) {
        if (!this.accentCore || typeof this.accentCore.updateParameters !== 'function') return;

        const swing = typeof meta.swing === 'number' ? meta.swing : 0;
        const energy = this.clamp(level, 0, 1);
        const texture = typeof meta.texture === 'number' ? this.clamp(meta.texture, -1, 1) : 0;
        const brightness = typeof meta.brightness === 'number' ? this.clamp(meta.brightness, -1, 1) : 0;
        const momentum = typeof meta.momentum === 'number' ? this.clamp(meta.momentum, -1, 1) : 0;
        const baseGlitch = (this.targetState.glitch ?? this.state.glitch ?? this.presets.baseGlitch);
        const baseMoire = (this.targetState.moire ?? this.state.moire ?? this.presets.baseMoire);
        const hueBase = this.normalizeHue(this.targetState.accentHue ?? this.state.accentHue ?? this.presets.accentHue);
        const hueDiff = ((hueBase - this.presets.accentHue + 540) % 360) - 180;

        this.accentCore.updateParameters({
            rotationSpeed: Math.max(0.28, this.presets.baseSpeed * 0.48 + energy * 0.5 + momentum * 0.22),
            glitchIntensity: Math.max(0.1, baseGlitch * 0.3 + energy * 0.42 + Math.max(0, -texture) * 0.35),
            patternIntensity: this.clamp(0.5 + baseMoire * 0.35 + swing * 0.18 + texture * 0.28, 0.2, 1.95),
            colorShift: hueDiff / 360 + swing * 0.09 + brightness * 0.06,
            interactionIntensity: 0.4 + energy * 0.36 + Math.abs(momentum) * 0.2,
            universeModifier: 0.9 + energy * 0.25 + Math.max(0, brightness) * 0.12
        });
    }

    applyAccentStateTargets(state = 'base') {
        if (!this.accentCore || typeof this.accentCore.updateParameters !== 'function') return;

        const baseGlitch = (this.targetState.glitch ?? this.state.glitch ?? this.presets.baseGlitch);
        const baseMoire = (this.targetState.moire ?? this.state.moire ?? this.presets.baseMoire);
        const baseDensity = (this.targetState.density ?? this.state.density ?? this.presets.baseDensity);
        const basePulse = (this.targetState.wPulse ?? this.state.wPulse ?? 0.2);
        const hueBase = this.normalizeHue(this.targetState.accentHue ?? this.state.accentHue ?? this.presets.accentHue);
        const hueDiff = ((hueBase - this.presets.accentHue + 540) % 360) - 180;

        let speedScale = 0.44;
        let glitchOffset = 0.12;
        let intensity = 0.34;

        switch (state) {
            case 'far-depth':
                speedScale = 0.32;
                glitchOffset = 0.06;
                intensity = 0.26;
                break;
            case 'approaching':
                speedScale = 0.4;
                glitchOffset = 0.1;
                intensity = 0.32;
                break;
            case 'focused':
                speedScale = 0.58;
                glitchOffset = 0.2;
                intensity = 0.46;
                break;
            case 'exiting':
                speedScale = 0.46;
                glitchOffset = 0.14;
                intensity = 0.36;
                break;
            case 'destroyed':
                speedScale = 0.64;
                glitchOffset = 0.24;
                intensity = 0.54;
                break;
        }

        this.accentCore.updateParameters({
            rotationSpeed: this.presets.baseSpeed * speedScale,
            glitchIntensity: Math.max(0.1, baseGlitch * 0.28 + glitchOffset),
            patternIntensity: this.clamp(0.5 + baseMoire * 0.32, 0.2, 1.9),
            gridDensity: Math.max(0.35, 6.4 - baseDensity * 1.7),
            morphFactor: this.clamp(0.42 + basePulse * 0.45, 0.24, 1.6),
            interactionIntensity: intensity,
            colorShift: hueDiff / 360
        });
    }

    releaseInteraction() {
        this.interaction = {
            active: true,
            start: performance.now(),
            duration: 860,
            peak: Math.max(0.25, this.interaction.magnitude * 0.5),
            magnitude: this.interaction.magnitude
        };
        this.targetState.speed = Math.max(this.presets.baseSpeed, this.targetState.speed * 0.9);
        this.targetState.glitch = Math.max(this.presets.baseGlitch * 0.6, this.targetState.glitch * 0.88);
        this.targetState.moire = Math.max(this.presets.baseMoire * 0.5, this.targetState.moire * 0.9);
    }

    applyAudioEnergy(level, meta = {}) {
        if (typeof level !== 'number') return;
        const normalized = this.clamp(level, 0, 1);
        const eased = Math.pow(normalized, 1.2);
        this.audioEnergy = Math.max(this.audioEnergy, eased);
        if (meta.peak) {
            this.audioPeak = Math.max(this.audioPeak, 0.85);
        }

        const swing = typeof meta.swing === 'number' ? meta.swing : 0;
        const texture = typeof meta.texture === 'number' ? this.clamp(meta.texture, -1, 1) : 0;
        const brightness = typeof meta.brightness === 'number' ? this.clamp(meta.brightness, -1, 1) : 0;
        const momentum = typeof meta.momentum === 'number' ? this.clamp(meta.momentum, -1, 1) : 0;
        this.targetState.speed += eased * (0.45 + Math.max(0, momentum) * 0.35);
        this.targetState.glitch += eased * (0.55 + Math.max(0, -texture) * 0.4);
        this.targetState.energy += eased * (0.75 + Math.abs(momentum) * 0.4);
        this.targetState.moire += eased * (0.25 + Math.max(0, texture) * 0.35);
        this.targetState.density -= eased * (0.28 + brightness * 0.12 - texture * 0.08);
        this.targetState.hue = this.normalizeHue(this.targetState.hue + swing * 10 + brightness * 14);
        this.targetState.accentHue = this.normalizeHue(this.targetState.accentHue + swing * 6 + texture * 10);
        this.targetState.wPulse = Math.max(this.targetState.wPulse ?? 0, 0.25 + eased * 0.45 + Math.max(0, momentum) * 0.5);

        if (meta.peak) {
            this.interaction = {
                active: true,
                start: performance.now(),
                duration: 920 + eased * 520 + Math.abs(momentum) * 320,
                peak: Math.max(this.interaction.peak || 0, 0.6 + eased * 0.7 + Math.abs(momentum) * 0.3),
                magnitude: this.interaction.magnitude
            };
        }

        this.applyAccentAudioResponse(eased, meta);
    }

    setCardState(state, options = {}) {
        this.activeState = state;
        this.targetState.hue = this.normalizeHue(this.presets.baseHue);
        this.targetState.accentHue = this.normalizeHue(this.presets.accentHue);
        this.targetState.geometryVariant = this.ensureGeometryVariant(this.targetState.geometryVariant);

        switch (state) {
            case 'far-depth':
                this.targetState.speed = this.presets.baseSpeed * 0.6;
                this.targetState.glitch = this.presets.baseGlitch * 0.45;
                this.targetState.density = this.presets.baseDensity * 1.15;
                this.targetState.moire = this.presets.baseMoire * 0.4;
                this.targetState.energy = 0.2;
                this.targetState.wPulse = 0.15;
                break;
            case 'approaching':
                this.targetState.speed = this.presets.baseSpeed * 1.05;
                this.targetState.glitch = this.presets.baseGlitch * 0.85;
                this.targetState.density = this.presets.baseDensity * 0.85;
                this.targetState.moire = this.presets.baseMoire * 0.75;
                this.targetState.energy = 0.65;
                this.targetState.wPulse = 0.35;
                break;
            case 'focused':
                if (options.inheritedTrait && options.inheritedTrait.geometryVariant) {
                    this.targetState.geometryVariant = this.ensureGeometryVariant(options.inheritedTrait.geometryVariant);
                } else if (this.presets.geometryCycle.length > 1) {
                    if (!this.hasBeenFocused) {
                        this.hasBeenFocused = true;
                        this.targetState.geometryVariant = this.presets.geometryCycle[this.variantIndex];
                    } else {
                        this.variantIndex = (this.variantIndex + 1) % this.presets.geometryCycle.length;
                        this.targetState.geometryVariant = this.presets.geometryCycle[this.variantIndex];
                    }
                }
                this.targetState.speed = this.presets.baseSpeed * 1.6;
                this.targetState.glitch = this.presets.baseGlitch * 1.35 + 0.15;
                this.targetState.density = this.presets.baseDensity * 0.6;
                this.targetState.moire = this.presets.baseMoire * 1.35 + 0.1;
                this.targetState.energy = 1.1;
                this.targetState.wPulse = Math.max(this.targetState.wPulse, 0.6);
                break;
            case 'exiting':
                this.targetState.speed = this.presets.baseSpeed * 1.2;
                this.targetState.glitch = this.presets.baseGlitch * 1.05;
                this.targetState.density = this.presets.baseDensity * 0.75;
                this.targetState.moire = this.presets.baseMoire * 0.85;
                this.targetState.energy = 0.5;
                this.targetState.wPulse = 0.3;
                break;
            case 'destroyed':
                this.targetState.speed = this.presets.baseSpeed * 2.0;
                this.targetState.glitch = this.presets.baseGlitch * 1.85 + 0.4;
                this.targetState.density = this.presets.baseDensity * 0.4;
                this.targetState.moire = this.presets.baseMoire * 1.55 + 0.2;
                this.targetState.energy = 1.25;
                this.targetState.wPulse = Math.max(this.targetState.wPulse, 1.1);
                break;
        }

        if (options.inheritedTrait) {
            this.applyInheritedTrait(options.inheritedTrait, { immediate: true });
        }

        this.applyAccentStateTargets(state, options);
    }

    applyInheritedTrait(trait, options = {}) {
        if (!trait) return;
        const immediate = options.immediate || false;

        if (typeof trait.hueShift === 'number') {
            this.targetState.hue = this.normalizeHue(this.presets.baseHue + trait.hueShift);
        }
        if (typeof trait.accentShift === 'number') {
            this.targetState.accentHue = this.normalizeHue(this.presets.accentHue + trait.accentShift);
        }
        if (typeof trait.moireBoost === 'number') {
            this.targetState.moire += trait.moireBoost;
        }
        if (typeof trait.glitchBoost === 'number') {
            this.targetState.glitch += trait.glitchBoost;
        }
        if (typeof trait.energyBoost === 'number') {
            this.targetState.energy += trait.energyBoost;
        }
        if (trait.geometryVariant) {
            this.targetState.geometryVariant = this.ensureGeometryVariant(trait.geometryVariant);
            const index = this.presets.geometryCycle.indexOf(this.targetState.geometryVariant);
            if (index >= 0) {
                this.variantIndex = index;
            }
        }
        if (trait.portalPulse) {
            this.targetState.wPulse = Math.max(this.targetState.wPulse, trait.portalPulse);
        }

        if (trait.flourish) {
            this.lastFlourish = trait.flourish;
            if (trait.flourish.core) {
                const core = trait.flourish.core;
                if (typeof core.speed === 'number') {
                    this.targetState.speed += core.speed * 0.25;
                }
                if (typeof core.glitch === 'number') {
                    this.targetState.glitch += core.glitch * 0.25;
                }
                if (typeof core.moire === 'number') {
                    this.targetState.moire += core.moire * 0.25;
                }
                if (core.geometryVariant && !trait.geometryVariant) {
                    const variant = this.ensureGeometryVariant(core.geometryVariant);
                    if (variant) {
                        this.targetState.geometryVariant = variant;
                    }
                }
            }
        }

        if (typeof trait.cascadeDepth === 'number') {
            const depth = Math.max(1, trait.cascadeDepth);
            const depthBoost = Math.min(1.6, depth * 0.12);
            this.targetState.speed += depthBoost * 0.5;
            this.targetState.glitch += depthBoost * 0.4;
            this.targetState.moire += depthBoost * 0.25;
            this.targetState.energy += depthBoost * 0.3;
            const currentDepth = typeof this.targetState.wDepth === 'number' ? this.targetState.wDepth : this.state.wDepth || 0.4;
            this.targetState.wDepth = Math.min(1.4, currentDepth + depth * 0.05);
            this.targetState.wPulse = Math.max(this.targetState.wPulse, 0.55 + depth * 0.08);
        }

        if (immediate) {
            for (const key of Object.keys(this.state)) {
                if (key in this.targetState && typeof this.targetState[key] === 'number') {
                    this.state[key] = this.targetState[key];
                }
            }
        }
    }

    triggerDestructionSequence() {
        this.setCardState('destroyed');
        const now = performance.now();
        this.interaction = {
            active: true,
            start: now,
            duration: 1600,
            peak: 1.4,
            magnitude: this.interaction.magnitude
        };
        this.targetState.wPulse = Math.max(this.targetState.wPulse, 1.4);

        const hueDiff = ((this.state.hue - this.presets.baseHue + 540) % 360) - 180;
        const accentDiff = ((this.state.accentHue - this.presets.accentHue + 540) % 360) - 180;

        if (this.accentCore && typeof this.accentCore.updateParameters === 'function') {
            const peak = (this.interaction && this.interaction.peak) || 0.6;
            this.accentCore.updateParameters({
                glitchIntensity: Math.max(this.targetState.glitch * 0.6 + 0.2, 0.45),
                patternIntensity: 0.85 + this.state.energy * 0.35,
                interactionIntensity: 0.78 + peak * 0.25,
                universeModifier: 1.05 + (this.targetState.wPulse || 0) * 0.2
            });
        }

        const baseTrait = {
            hueShift: hueDiff,
            accentShift: accentDiff,
            moireBoost: this.state.moire - this.presets.baseMoire,
            glitchBoost: this.state.glitch - this.presets.baseGlitch,
            energyBoost: this.state.energy - 0.6,
            geometryVariant: this.state.geometryVariant,
            portalPulse: this.state.wPulse
        };

        const flourish = this.getDestructionFlourish();
        const enrichedTrait = this.applyDestructionFlourish(flourish, baseTrait);
        return enrichedTrait;
    }

    updateRotation4D(rotation = {}, context = {}) {
        this.rotation4D = {
            rot4dXW: rotation.rot4dXW || 0,
            rot4dYW: rotation.rot4dYW || 0,
            rot4dZW: rotation.rot4dZW || 0,
            rot4dXY: rotation.rot4dXY || 0,
            rot4dXZ: rotation.rot4dXZ || 0,
            rot4dYZ: rotation.rot4dYZ || 0
        };

        const portalContext = context.portalProjection || null;
        const normalized = context.normalized || null;
        const intensity = typeof context.intensity === 'number' ? this.clamp(context.intensity, 0, 1.4) : null;

        if (portalContext) {
            const forward = normalized ? this.clamp(normalized.beta || 0, -1.2, 1.2) : 0;
            const lateral = normalized ? this.clamp(normalized.gamma || 0, -1.2, 1.2) : 0;
            const swirl = normalized ? this.clamp(normalized.alpha || 0, -1.2, 1.2) : 0;
            const diagonal = (forward * forward) - (lateral * lateral);
            const cross = forward * lateral;
            const envelope = (portalContext.depth || 0) * 0.6 + cross * 0.5 + swirl * 0.3;

            const targetDepth = 0.45 + Math.abs(portalContext.depth || 0) * 1.05 + Math.abs(diagonal) * 0.35;
            const blendedDepth = this.targetState.wDepth + (targetDepth - this.targetState.wDepth) * 0.4;
            this.targetState.wDepth = this.clamp(blendedDepth, 0.2, 2.0);

            const shearTarget = (portalContext.shear || 0) + diagonal * 0.4;
            this.targetState.wShear = shearTarget;

            const pulseBase = Math.max(portalContext.pulse || 0, 0);
            const intensityBoost = intensity !== null ? intensity * 0.3 : 0;
            const pulseTarget = pulseBase + Math.abs(envelope) * 0.55 + intensityBoost;
            this.targetState.wPulse = Math.max(this.targetState.wPulse, pulseTarget);

            this.portalProjection = {
                value: portalContext.value || 0,
                depth: portalContext.depth || 0,
                shear: this.targetState.wShear,
                pulse: this.targetState.wPulse,
                torsion: portalContext.torsion || 0,
                angle: portalContext.angle || 0,
                radius: portalContext.radius || 0,
                envelope
            };

            if (intensity !== null) {
                this.targetState.energy = Math.max(this.targetState.energy, 0.45 + intensity * 0.4);
                this.targetState.speed = this.presets.baseSpeed + intensity * 0.35;
                this.targetState.moire = this.presets.baseMoire + Math.abs(envelope) * 0.4;
            }
        }

        if (this.core && typeof this.core.updateParameters === 'function') {
            const coreParams = {
                rot4dXW: this.rotation4D.rot4dXW,
                rot4dYW: this.rotation4D.rot4dYW,
                rot4dZW: this.rotation4D.rot4dZW,
                rot4dXY: this.rotation4D.rot4dXY,
                rot4dXZ: this.rotation4D.rot4dXZ,
                rot4dYZ: this.rotation4D.rot4dYZ
            };

            if (portalContext) {
                coreParams.portalPulse = Math.max(this.targetState.wPulse, portalContext.pulse || 0);
                coreParams.universeModifier = 0.92 + Math.abs(this.targetState.wShear || 0) * 0.18 + Math.abs(this.portalProjection.torsion || 0) * 0.25;
                coreParams.interactionIntensity = intensity !== null
                    ? 0.6 + intensity * 0.4 + Math.abs(this.portalProjection.envelope || 0) * 0.2
                    : 0.65 + Math.abs(this.portalProjection.envelope || 0) * 0.15;
            }

            this.core.updateParameters(coreParams);
        }

        if (this.accentCore && typeof this.accentCore.updateParameters === 'function') {
            const accentParams = {
                rot4dXW: -(this.rotation4D.rot4dXW || 0) * 0.6,
                rot4dYW: -(this.rotation4D.rot4dYW || 0) * 0.6,
                rot4dZW: (this.rotation4D.rot4dZW || 0) * 0.4,
                rot4dXY: (this.rotation4D.rot4dXY || 0) * 0.5,
                rot4dXZ: -(this.rotation4D.rot4dXZ || 0) * 0.45,
                rot4dYZ: (this.rotation4D.rot4dYZ || 0) * 0.45
            };

            if (portalContext) {
                const envelope = this.portalProjection.envelope || 0;
                accentParams.portalPulse = Math.max(0.18, 0.6 - Math.abs(envelope) * 0.35);
                accentParams.interactionIntensity = intensity !== null
                    ? Math.max(0.35, 0.55 - intensity * 0.25 + Math.abs(envelope) * 0.2)
                    : Math.max(0.35, 0.55 - Math.abs(envelope) * 0.1);
                accentParams.universeModifier = 0.88 + Math.max(0, 0.3 - Math.abs(this.portalProjection.depth || 0) * 0.2);
            }

            this.accentCore.updateParameters(accentParams);
        }
    }

    buildColorScheme(primaryHue, accentHue, energyLevel = 0.4, density = 1.0) {
        const primary = VIB34DColor.hslToRgb(primaryHue, 0.78, 0.55 + energyLevel * 0.2);
        const secondary = VIB34DColor.hslToRgb(accentHue, 0.82, 0.52 + energyLevel * 0.18);
        const backgroundHue = (primaryHue + 200) % 360;
        const background = VIB34DColor.hslToRgb(backgroundHue, 0.45, 0.1 + density * 0.08);
        return { primary, secondary, background };
    }

    buildAccentColorScheme(primaryHue, accentHue, energyLevel = 0.4, density = 1.0) {
        const accentPrimary = VIB34DColor.hslToRgb(accentHue, 0.7, 0.45 + energyLevel * 0.12);
        const accentSecondary = VIB34DColor.hslToRgb(primaryHue, 0.62, 0.32 + energyLevel * 0.15);
        const backgroundHue = (accentHue + 160) % 360;
        const background = VIB34DColor
            .hslToRgb(backgroundHue, 0.4, 0.12 + (1 - density) * 0.1)
            .map(channel => channel * 0.65);
        return { primary: accentPrimary, secondary: accentSecondary, background };
    }

    resolveAccentGeometry(baseVariant) {
        if (!this.presets || !Array.isArray(this.presets.geometryCycle) || !this.presets.geometryCycle.length) {
            return baseVariant || 'hypercube';
        }

        const cycle = this.presets.geometryCycle;
        if (!baseVariant) {
            return cycle.length > 1 ? cycle[1] : cycle[0];
        }

        const index = cycle.indexOf(baseVariant);
        if (index === -1) {
            return cycle.length > 1 ? cycle[1] : cycle[0];
        }

        return cycle[(index + 1) % cycle.length];
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    normalizeHue(value) {
        return ((value % 360) + 360) % 360;
    }

    destroy() {
        this.stopStateLoop();
        if (this.pool) {
            this.pool.destroyInstance(this.canvas);
            if (this.accentCanvas) {
                this.pool.destroyInstance(this.accentCanvas);
            }
        }
    }
}
// Export for global use
window.VIB34DReactivePresetLibrary = VIB34DReactivePresetLibrary;
window.VIB34DGeometricTiltSystem = VIB34DGeometricTiltSystem;
window.VIB34DTiltVisualizer = VIB34DTiltVisualizer;
