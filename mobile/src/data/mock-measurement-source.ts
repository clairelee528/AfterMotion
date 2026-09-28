import { getDemoMeasurementReading } from './demo-fixtures';
import type {
  MeasurementDataSource,
  MeasurementRequest,
} from './measurement-source';
import type { KneeMeasurement } from '../domain/models';

export class MockMeasurementDataSource implements MeasurementDataSource {
  readonly source = 'mock' as const;
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async measure(request: MeasurementRequest): Promise<KneeMeasurement> {
    if (!this.connected) throw new Error('Mock Recovery Band is disconnected.');
    const recordedAt = new Date().toISOString();
    return {
      id: `${request.sessionId}-${request.checkpoint}-${request.side}-${Date.now()}`,
      sessionId: request.sessionId,
      checkpoint: request.checkpoint,
      side: request.side,
      recordedAt,
      ...getDemoMeasurementReading(request.side, request.checkpoint),
      source: this.source,
      quality: {
        bandTension: 'correct',
        stability: 'stable',
        temperatureStable: true,
      },
    };
  }
}
