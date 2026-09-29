import type { ActivityFeatures } from './activity-processing';
import type { ActivityMetrics, LoadLevel } from './models';

const MAX_DURATION_SECONDS = 60 * 60;
const MIN_RATE_WINDOW_MINUTES = 1;

export const ACTIVITY_LOAD_WEIGHTS = {
  duration: 20,
  movementIntensity: 35,
  accelerationPeaks: 15,
  decelerations: 15,
  impacts: 15,
} as const;

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizedEventRate(
  eventCount: number,
  durationSeconds: number,
  referenceEventsPerMinute: number,
): number {
  const rateWindowMinutes = Math.max(
    MIN_RATE_WINDOW_MINUTES,
    durationSeconds / 60,
  );
  const eventsPerMinute = Math.max(0, eventCount) / rateWindowMinutes;
  return clamp(eventsPerMinute / referenceEventsPerMinute, 0, 1);
}

export function getActivityLoadLevel(loadIndex: number): LoadLevel {
  if (loadIndex >= 70) return 'high';
  if (loadIndex >= 35) return 'moderate';
  return 'light';
}

/**
 * Prototype relative-load score. It describes recorded activity exposure and
 * must not be interpreted as an injury-risk or medical-safety score.
 */
export function calculateActivityMetrics(
  features: ActivityFeatures,
  durationSeconds: number,
): ActivityMetrics {
  const safeDuration = Math.max(0, Math.floor(durationSeconds));
  const durationScore =
    clamp(safeDuration / MAX_DURATION_SECONDS, 0, 1) * ACTIVITY_LOAD_WEIGHTS.duration;
  const intensityScore =
    clamp(features.movementIntensity / 10, 0, 1) *
    ACTIVITY_LOAD_WEIGHTS.movementIntensity;
  const peakScore =
    normalizedEventRate(features.accelerationPeakCount, safeDuration, 12) *
    ACTIVITY_LOAD_WEIGHTS.accelerationPeaks;
  const decelerationScore =
    normalizedEventRate(features.decelerationEventCount, safeDuration, 10) *
    ACTIVITY_LOAD_WEIGHTS.decelerations;
  const impactScore =
    normalizedEventRate(features.impactLikeEventCount, safeDuration, 8) *
    ACTIVITY_LOAD_WEIGHTS.impacts;
  const loadIndex = Math.round(
    durationScore + intensityScore + peakScore + decelerationScore + impactScore,
  );

  return {
    durationSeconds: safeDuration,
    sampleCount: Math.max(0, Math.floor(features.sampleCount)),
    movementIntensity: clamp(features.movementIntensity, 0, 10),
    accelerationPeakCount: Math.max(0, Math.floor(features.accelerationPeakCount)),
    decelerationEventCount: Math.max(0, Math.floor(features.decelerationEventCount)),
    impactLikeEventCount: Math.max(0, Math.floor(features.impactLikeEventCount)),
    loadIndex,
    loadLevel: getActivityLoadLevel(loadIndex),
  };
}
