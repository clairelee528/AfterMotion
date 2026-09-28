import type {
  KneeMeasurement,
  KneeSide,
  MeasurementSource,
  SymptomRecord,
} from '@/domain/models';

export interface MeasurementRequest {
  sessionId: string;
  side: KneeSide;
  checkpoint: KneeMeasurement['checkpoint'];
  symptoms: SymptomRecord;
}

export interface MeasurementDataSource {
  readonly source: MeasurementSource;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  measure(request: MeasurementRequest): Promise<KneeMeasurement>;
}

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
