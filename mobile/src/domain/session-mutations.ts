import type {
  CheckpointRecord,
  KneeMeasurement,
  MeasurementCheckpoint,
  Session,
  SymptomRecord,
} from './models';

const defaultSymptoms: SymptomRecord = {
  pain: 2,
  stiffness: 2,
  swelling: 'mild',
};

function emptyCheckpoint(): CheckpointRecord {
  return {
    left: null,
    right: null,
    symptoms: { ...defaultSymptoms },
    symptomsRecordedAt: null,
  };
}

export function saveMeasurementToSession(
  session: Session,
  measurement: KneeMeasurement,
  updatedAt = new Date().toISOString(),
): Session {
  if (measurement.sessionId !== session.id) {
    throw new Error('Measurement does not belong to this session.');
  }
  if (measurement.checkpoint === 'baseline') {
    return {
      ...session,
      updatedAt,
      baseline: {
        ...session.baseline,
        [measurement.side]: measurement,
      },
    };
  }
  const previous = session.recovery[measurement.checkpoint] ?? emptyCheckpoint();
  return {
    ...session,
    updatedAt,
    recovery: {
      ...session.recovery,
      [measurement.checkpoint]: {
        ...previous,
        [measurement.side]: measurement,
      },
    },
  };
}

export function saveSymptomsToSession(
  session: Session,
  checkpoint: MeasurementCheckpoint,
  symptoms: SymptomRecord,
  recordedAt = new Date().toISOString(),
): Session {
  if (checkpoint === 'baseline') {
    return {
      ...session,
      updatedAt: recordedAt,
      baseline: {
        ...session.baseline,
        symptoms,
        symptomsRecordedAt: recordedAt,
      },
    };
  }
  const previous = session.recovery[checkpoint] ?? emptyCheckpoint();
  return {
    ...session,
    updatedAt: recordedAt,
    recovery: {
      ...session.recovery,
      [checkpoint]: {
        ...previous,
        symptoms,
        symptomsRecordedAt: recordedAt,
      },
    },
  };
}
