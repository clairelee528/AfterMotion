import {
  recoveryCheckpoints,
  type ActivityMetrics,
  type CheckpointRecord,
  type KneeMeasurement,
  type KneeSide,
  type MeasurementCheckpoint,
  type Session,
  type SymptomRecord,
} from '../domain/models';

export const DEMO_SAMPLE_RATE_HZ = 50;

const checkpointTemperatureOffset: Record<MeasurementCheckpoint, number> = {
  baseline: 0,
  '0': 0.8,
  '15': 0.65,
  '30': 0.45,
  '45': 0.25,
  '60': 0.1,
};

export function getDemoMeasurementReading(side: KneeSide, checkpoint: MeasurementCheckpoint) {
  const baselineTemperature = side === 'left' ? 33.4 : 33.7;
  const sideStretchOffset = side === 'left' ? 0 : 22;
  const checkpointStretchOffset = checkpoint === 'baseline' ? 0 : 32 - Number(checkpoint) / 2;
  return {
    stretchValue: Math.round(2418 + sideStretchOffset + checkpointStretchOffset),
    temperatureCelsius: Number(
      (baselineTemperature + checkpointTemperatureOffset[checkpoint]).toFixed(2),
    ),
  };
}

export function getDemoActivityMetrics(durationSeconds: number): ActivityMetrics {
  const safeDuration = Math.max(1, durationSeconds);
  const minutes = safeDuration / 60;
  const loadIndex = Math.min(100, Math.round(42 + minutes * 0.6));
  return {
    durationSeconds: safeDuration,
    sampleCount: safeDuration * DEMO_SAMPLE_RATE_HZ,
    movementIntensity: Number(Math.min(10, 4.5 + minutes * 0.04).toFixed(1)),
    accelerationPeakCount: Math.round(minutes * 0.4),
    decelerationEventCount: Math.round(minutes * 0.26),
    impactLikeEventCount: Math.round(minutes * 0.21),
    loadIndex,
    loadLevel: loadIndex >= 70 ? 'high' : loadIndex >= 45 ? 'moderate' : 'light',
  };
}

const symptoms: SymptomRecord = { pain: 2, stiffness: 2, swelling: 'mild' };

function measurement(
  sessionId: string,
  checkpoint: MeasurementCheckpoint,
  side: KneeSide,
  recordedAt: string,
): KneeMeasurement {
  return {
    id: `${sessionId}-${checkpoint}-${side}`,
    sessionId,
    checkpoint,
    side,
    recordedAt,
    source: 'mock',
    ...getDemoMeasurementReading(side, checkpoint),
  };
}

function checkpoint(
  sessionId: string,
  key: MeasurementCheckpoint,
  recordedAt: string,
  completion: 'none' | 'left' | 'both' = 'both',
): CheckpointRecord {
  return {
    left: completion === 'none' ? null : measurement(sessionId, key, 'left', recordedAt),
    right: completion === 'both' ? measurement(sessionId, key, 'right', recordedAt) : null,
    symptoms: { ...symptoms },
  };
}

function recoveryRecords(
  sessionId: string,
  recordedAt: string,
  completedThrough: number,
): Session['recovery'] {
  return Object.fromEntries(
    recoveryCheckpoints.map((key, index) => [
      key,
      checkpoint(sessionId, key, recordedAt, index <= completedThrough ? 'both' : 'none'),
    ]),
  );
}

export function createDemoSessionFixtures(): Record<string, Session> {
  const activeId = 'demo-active';
  const completeId = 'demo-complete';
  const partialId = 'demo-ended-early';
  const activeCreatedAt = '2026-09-27T01:00:00.000Z';
  const completeCreatedAt = '2026-09-25T01:00:00.000Z';
  const partialCreatedAt = '2026-09-23T01:00:00.000Z';
  const completeMetrics = getDemoActivityMetrics(68 * 60);
  const partialMetrics = getDemoActivityMetrics(32 * 60);

  return {
    [activeId]: {
      id: activeId,
      activityType: 'badminton',
      injuredSide: 'right',
      measurementSource: 'mock',
      status: 'activity',
      createdAt: activeCreatedAt,
      updatedAt: activeCreatedAt,
      closedAt: null,
      endedEarly: false,
      baseline: checkpoint(activeId, 'baseline', activeCreatedAt),
      activity: {
        status: 'paused',
        elapsedSeconds: 18 * 60,
        startedAt: null,
        endedAt: null,
        metrics: null,
      },
      recovery: recoveryRecords(activeId, activeCreatedAt, -1),
    },
    [completeId]: {
      id: completeId,
      activityType: 'frisbee',
      injuredSide: 'right',
      measurementSource: 'mock',
      status: 'complete',
      createdAt: completeCreatedAt,
      updatedAt: '2026-09-25T03:08:00.000Z',
      closedAt: '2026-09-25T03:08:00.000Z',
      endedEarly: false,
      baseline: checkpoint(completeId, 'baseline', completeCreatedAt),
      activity: {
        status: 'complete',
        elapsedSeconds: completeMetrics.durationSeconds,
        startedAt: '2026-09-25T01:20:00.000Z',
        endedAt: '2026-09-25T02:28:00.000Z',
        metrics: completeMetrics,
      },
      recovery: recoveryRecords(completeId, '2026-09-25T02:30:00.000Z', 4),
    },
    [partialId]: {
      id: partialId,
      activityType: 'running',
      injuredSide: 'left',
      measurementSource: 'mock',
      status: 'endedEarly',
      createdAt: partialCreatedAt,
      updatedAt: '2026-09-23T02:05:00.000Z',
      closedAt: '2026-09-23T02:05:00.000Z',
      endedEarly: true,
      baseline: checkpoint(partialId, 'baseline', partialCreatedAt),
      activity: {
        status: 'complete',
        elapsedSeconds: partialMetrics.durationSeconds,
        startedAt: '2026-09-23T01:20:00.000Z',
        endedAt: '2026-09-23T01:52:00.000Z',
        metrics: partialMetrics,
      },
      recovery: recoveryRecords(partialId, '2026-09-23T01:53:00.000Z', 1),
    },
  };
}
