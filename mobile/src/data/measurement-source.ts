import type {
  KneeMeasurement,
  KneeSide,
  MeasurementSource,
} from '@/domain/models';

export interface MeasurementRequest {
  sessionId: string;
  side: KneeSide;
  checkpoint: KneeMeasurement['checkpoint'];
}

export interface MeasurementDataSource {
  readonly source: MeasurementSource;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  measure(request: MeasurementRequest): Promise<KneeMeasurement>;
}
