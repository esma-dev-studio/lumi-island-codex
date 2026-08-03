export type EnvironmentDetailLevel = "low" | "standard" | "high";

export interface DeviceSignals {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  devicePixelRatio?: number;
  prefersReducedMotion?: boolean;
}

export interface EnvironmentDetailProfile {
  level: EnvironmentDetailLevel;
  hardwareScalingLevel: number;
  shadowMapSize: number;
  shadowBlurKernel: number;
  particleCount: number;
  glowIntensityScale: number;
}

export function environmentDetailProfile(
  signals: DeviceSignals,
): EnvironmentDetailProfile {
  const low =
    signals.prefersReducedMotion === true ||
    (signals.hardwareConcurrency ?? 8) <= 4 ||
    (signals.deviceMemory ?? 8) <= 4;
  if (low) {
    return {
      level: "low",
      hardwareScalingLevel: 1.5,
      shadowMapSize: 512,
      shadowBlurKernel: 8,
      particleCount: 4,
      glowIntensityScale: 0.72,
    };
  }
  const high =
    (signals.hardwareConcurrency ?? 8) >= 8 &&
    (signals.deviceMemory ?? 8) >= 8;
  return high
    ? {
        level: "high",
        hardwareScalingLevel: Math.max(
          0.75,
          1 / Math.min(1.5, signals.devicePixelRatio ?? 1),
        ),
        shadowMapSize: 1024,
        shadowBlurKernel: 18,
        particleCount: 7,
        glowIntensityScale: 1,
      }
    : {
        level: "standard",
        hardwareScalingLevel: 1,
        shadowMapSize: 768,
        shadowBlurKernel: 12,
        particleCount: 5,
        glowIntensityScale: 0.86,
      };
}
