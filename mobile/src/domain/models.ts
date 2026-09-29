export type KneeSide = 'left' | 'right';

export type ActivityType =
  | 'frisbee'
  | 'badminton'
  | 'tennis'
  | 'running'
  | 'gym'
  | 'other';

export type SessionStatus =
  | 'draft'
  | 'baseline'
  | 'activity'
  | 'recovery'
  | 'complete'
  | 'endedEarly';

export type ActivityStatus = 'planned' | 'active' | 'paused' | 'complete';
export type MeasurementPhase = 'baseline' | 'recovery';

/** v1 persistence keys retained until the Stage 3 storage migration. */
export const recoveryCheckpoints = ['0', '15', '30', '45', '60'] as const;
export type RecoveryCheckpoint = (typeof recoveryCheckpoints)[number];
export type MeasurementCheckpoint = 'baseline' | RecoveryCheckpoint;

export type SubjectiveSwelling = 'normal' | 'mild' | 'moderate' | 'significant';
export type LoadLevel = 'light' | 'moderate' | 'high';
export type MeasurementSource = 'mock' | 'manual' | 'bluetooth';

export interface SymptomRecord {
  pain: number;
  stiffness: number;
  swelling: SubjectiveSwelling;
}

export interface MeasurementQuality {
  bandTension: 'unknown' | 'tooLoose' | 'tooTight' | 'correct';
  stability: 'unknown' | 'movement' | 'stable';
  temperatureStable: boolean;
}

export interface KneeMeasurement {
  id: string;
  sessionId: string;
  checkpoint: MeasurementCheckpoint;
  side: KneeSide;
  recordedAt: string;
  stretchValue: number;
  temperatureCelsius: number;
  source: MeasurementSource;
  quality?: MeasurementQuality;
}

export interface CheckpointRecord {
  left: KneeMeasurement | null;
  right: KneeMeasurement | null;
  symptoms: SymptomRecord;
  symptomsRecordedAt: string | null;
}

export interface ActivityMetrics {
  durationSeconds: number;
  sampleCount: number;
  movementIntensity: number;
  accelerationPeakCount: number;
  decelerationEventCount: number;
  impactLikeEventCount: number;
  loadIndex: number;
  loadLevel: LoadLevel;
}

export interface ActivityRecord {
  status: ActivityStatus;
  elapsedSeconds: number;
  sampleCount: number;
  startedAt: string | null;
  endedAt: string | null;
  metrics: ActivityMetrics | null;
}

export interface Session {
  id: string;
  activityType: ActivityType;
  injuredSide: KneeSide;
  measurementSource: MeasurementSource;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  endedEarly: boolean;
  baseline: CheckpointRecord;
  activity: ActivityRecord;
  recovery: Record<string, CheckpointRecord>;
}

export interface SessionState {
  currentSessionId: string | null;
  sessions: Record<string, Session>;
}

export interface PersistedSessionState extends SessionState {
  schemaVersion: 2;
}

export interface CreateSessionInput {
  activityType: ActivityType;
  injuredSide: KneeSide;
  measurementSource: MeasurementSource;
}

export function isRecoveryCheckpoint(value: string): value is RecoveryCheckpoint {
  return recoveryCheckpoints.some((checkpoint) => checkpoint === value);
}
