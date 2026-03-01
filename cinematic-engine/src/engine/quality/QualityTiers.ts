/**
 * Quality tiers: resolution scale, bloom strength/radius/threshold,
 * SSR steps, raymarch steps, etc. Passes read these for LOD.
 */

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface QualitySettings {
  resolutionScale: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  ssrSteps: number;
  raymarchSteps: number;
  taaEnabled: boolean;
  volumetricSteps: number;
  shadowQuality: number;
}

const TIERS: Record<QualityTier, QualitySettings> = {
  low: {
    resolutionScale: 0.5,
    bloomStrength: 1.0,
    bloomRadius: 0.5,
    bloomThreshold: 0.1,
    ssrSteps: 0,
    raymarchSteps: 16,
    taaEnabled: false,
    volumetricSteps: 4,
    shadowQuality: 0,
  },
  medium: {
    resolutionScale: 0.75,
    bloomStrength: 1.3,
    bloomRadius: 0.7,
    bloomThreshold: 0.06,
    ssrSteps: 32,
    raymarchSteps: 32,
    taaEnabled: true,
    volumetricSteps: 8,
    shadowQuality: 1,
  },
  high: {
    resolutionScale: 1,
    bloomStrength: 1.6,
    bloomRadius: 0.9,
    bloomThreshold: 0.05,
    ssrSteps: 64,
    raymarchSteps: 64,
    taaEnabled: true,
    volumetricSteps: 16,
    shadowQuality: 2,
  },
  ultra: {
    resolutionScale: 1,
    bloomStrength: 1.8,
    bloomRadius: 1.0,
    bloomThreshold: 0.04,
    ssrSteps: 128,
    raymarchSteps: 128,
    taaEnabled: true,
    volumetricSteps: 32,
    shadowQuality: 3,
  },
};

export function getQualitySettings(tier: QualityTier): QualitySettings {
  return { ...TIERS[tier] };
}

export function setQualityTier(tier: QualityTier): QualitySettings {
  return getQualitySettings(tier);
}
