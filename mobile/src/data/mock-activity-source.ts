import {
  ACTIVITY_SAMPLE_RATE_HZ,
  type ActivityDataSource,
  type ActivitySample,
} from './activity-source';

const SAMPLE_INTERVAL_MS = 1000 / ACTIVITY_SAMPLE_RATE_HZ;
const EMISSION_INTERVAL_MS = 100;
const SAMPLES_PER_EMISSION = EMISSION_INTERVAL_MS / SAMPLE_INTERVAL_MS;

export interface ActivityScheduler {
  now(): number;
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

const defaultScheduler: ActivityScheduler = {
  now: () => Date.now(),
  setInterval: (callback, intervalMs) => setInterval(callback, intervalMs),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

function roundSensorValue(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Produces a repeatable six-axis sample shaped like a moderate court-sport motion.
 * Acceleration values are in g; gyroscope values are in degrees per second.
 */
export function createMockActivitySample(
  sampleIndex: number,
  timestampMs: number,
): ActivitySample {
  const timeSeconds = sampleIndex / ACTIVITY_SAMPLE_RATE_HZ;
  const strideWave = Math.sin(timeSeconds * Math.PI * 3.2);
  const lateralWave = Math.sin(timeSeconds * Math.PI * 1.7 + 0.4);
  const impactPulse = Math.max(0, Math.sin(timeSeconds * Math.PI * 0.8)) ** 10;

  return {
    timestampMs,
    accelerationX: roundSensorValue(0.18 * lateralWave + 0.55 * impactPulse),
    accelerationY: roundSensorValue(0.32 * strideWave - 0.2 * impactPulse),
    accelerationZ: roundSensorValue(1 + 0.12 * Math.cos(timeSeconds * Math.PI * 3.2) + impactPulse),
    gyroscopeX: roundSensorValue(38 * strideWave),
    gyroscopeY: roundSensorValue(24 * lateralWave),
    gyroscopeZ: roundSensorValue(52 * Math.sin(timeSeconds * Math.PI * 1.1) + 18 * impactPulse),
  };
}

export class MockActivityDataSource implements ActivityDataSource {
  readonly source = 'mock' as const;
  private connected = false;
  private running = false;
  private intervalHandle: unknown = null;
  private emittedSampleCount = 0;
  private segmentStartSampleIndex = 0;
  private segmentStartedAtMs = 0;

  constructor(private readonly scheduler: ActivityScheduler = defaultScheduler) {}

  get isConnected(): boolean {
    return this.connected;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get sampleCount(): number {
    return this.emittedSampleCount;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    await this.stop();
    this.connected = false;
  }

  async start(onSample: (sample: ActivitySample) => void): Promise<void> {
    if (!this.connected) throw new Error('Mock Motion Sleeve is disconnected.');
    if (this.running) throw new Error('Mock Motion Sleeve is already sampling.');

    this.running = true;
    this.segmentStartedAtMs = this.scheduler.now();
    this.segmentStartSampleIndex = this.emittedSampleCount;
    this.intervalHandle = this.scheduler.setInterval(() => {
      for (let index = 0; index < SAMPLES_PER_EMISSION; index += 1) {
        const timestampMs =
          this.segmentStartedAtMs +
          (this.emittedSampleCount - this.segmentStartSampleIndex) * SAMPLE_INTERVAL_MS;
        onSample(createMockActivitySample(this.emittedSampleCount, timestampMs));
        this.emittedSampleCount += 1;
      }
    }, EMISSION_INTERVAL_MS);
  }

  async stop(): Promise<void> {
    if (this.intervalHandle !== null) {
      this.scheduler.clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.running = false;
  }
}
