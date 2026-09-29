import type { ActivitySample } from '../data/activity-source';

const FILTER_ALPHA = 0.2;
const ACCELERATION_PEAK_THRESHOLD_G = 0.28;
const IMPACT_THRESHOLD_G = 0.72;
const DECELERATION_DROP_THRESHOLD_G = 0.08;
const EVENT_REFRACTORY_MS = 300;

export interface ActivityFeatures {
  sampleCount: number;
  movementIntensity: number;
  accelerationPeakCount: number;
  decelerationEventCount: number;
  impactLikeEventCount: number;
}

function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function eventAllowed(timestampMs: number, previousTimestampMs: number | null): boolean {
  return previousTimestampMs === null || timestampMs - previousTimestampMs >= EVENT_REFRACTORY_MS;
}

export class ActivitySignalProcessor {
  private sampleCount = 0;
  private dynamicEnergy = 0;
  private filteredMagnitude: number | null = null;
  private previousDynamicMagnitude: number | null = null;
  private previousPreviousDynamicMagnitude: number | null = null;
  private previousTimestampMs: number | null = null;
  private accelerationPeakCount = 0;
  private decelerationEventCount = 0;
  private impactLikeEventCount = 0;
  private lastPeakAtMs: number | null = null;
  private lastDecelerationAtMs: number | null = null;
  private lastImpactAtMs: number | null = null;

  addSample(sample: ActivitySample): void {
    const rawMagnitude = magnitude(
      sample.accelerationX,
      sample.accelerationY,
      sample.accelerationZ,
    );
    this.filteredMagnitude =
      this.filteredMagnitude === null
        ? rawMagnitude
        : FILTER_ALPHA * rawMagnitude + (1 - FILTER_ALPHA) * this.filteredMagnitude;
    const dynamicMagnitude = Math.abs(this.filteredMagnitude - 1);

    this.sampleCount += 1;
    this.dynamicEnergy += dynamicMagnitude * dynamicMagnitude;

    const middleIsPeak =
      this.previousPreviousDynamicMagnitude !== null &&
      this.previousDynamicMagnitude !== null &&
      this.previousTimestampMs !== null &&
      this.previousDynamicMagnitude > this.previousPreviousDynamicMagnitude &&
      this.previousDynamicMagnitude >= dynamicMagnitude;

    if (
      middleIsPeak &&
      this.previousDynamicMagnitude! >= ACCELERATION_PEAK_THRESHOLD_G &&
      eventAllowed(this.previousTimestampMs!, this.lastPeakAtMs)
    ) {
      this.accelerationPeakCount += 1;
      this.lastPeakAtMs = this.previousTimestampMs;
    }

    if (
      middleIsPeak &&
      this.previousDynamicMagnitude! >= IMPACT_THRESHOLD_G &&
      eventAllowed(this.previousTimestampMs!, this.lastImpactAtMs)
    ) {
      this.impactLikeEventCount += 1;
      this.lastImpactAtMs = this.previousTimestampMs;
    }

    if (
      this.previousDynamicMagnitude !== null &&
      this.previousDynamicMagnitude - dynamicMagnitude >= DECELERATION_DROP_THRESHOLD_G &&
      eventAllowed(sample.timestampMs, this.lastDecelerationAtMs)
    ) {
      this.decelerationEventCount += 1;
      this.lastDecelerationAtMs = sample.timestampMs;
    }

    this.previousPreviousDynamicMagnitude = this.previousDynamicMagnitude;
    this.previousDynamicMagnitude = dynamicMagnitude;
    this.previousTimestampMs = sample.timestampMs;
  }

  getFeatures(): ActivityFeatures {
    const rootMeanSquare =
      this.sampleCount === 0 ? 0 : Math.sqrt(this.dynamicEnergy / this.sampleCount);
    return {
      sampleCount: this.sampleCount,
      movementIntensity: Number(Math.min(10, rootMeanSquare * 10).toFixed(1)),
      accelerationPeakCount: this.accelerationPeakCount,
      decelerationEventCount: this.decelerationEventCount,
      impactLikeEventCount: this.impactLikeEventCount,
    };
  }
}

const activeProcessors = new Map<string, ActivitySignalProcessor>();

export function getActivitySignalProcessor(sessionId: string): ActivitySignalProcessor {
  const existing = activeProcessors.get(sessionId);
  if (existing) return existing;
  const processor = new ActivitySignalProcessor();
  activeProcessors.set(sessionId, processor);
  return processor;
}

export function getActiveActivityFeatures(sessionId: string): ActivityFeatures | null {
  return activeProcessors.get(sessionId)?.getFeatures() ?? null;
}

export function releaseActivitySignalProcessor(sessionId: string): void {
  activeProcessors.delete(sessionId);
}
