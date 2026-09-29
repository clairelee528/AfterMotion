import type { MeasurementSource } from '../domain/models';

export const ACTIVITY_SAMPLE_RATE_HZ = 50;

export interface ActivitySample {
  timestampMs: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
}

export interface ActivityDataSource {
  readonly source: MeasurementSource;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  start(onSample: (sample: ActivitySample) => void): Promise<void>;
  stop(): Promise<void>;
}
