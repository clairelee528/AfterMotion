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
  | 'baselineComplete'
  | 'active'
  | 'recovering'
  | 'complete';

export type SubjectiveSwelling =
  | 'normal'
  | 'mild'
  | 'moderate'
  | 'significant';

export type LoadLevel = 'light' | 'moderate' | 'high';

export type MeasurementSource = 'mock' | 'manual' | 'bluetooth';

export interface SymptomRecord {
  pain: number;
  stiffness: number;
  swelling: SubjectiveSwelling;
}

export interface KneeMeasurement {
  id: string;
  sessionId: string;
  side: KneeSide;
  recordedAt: string;
  minutesAfterActivity: number | null;
  stretchValue: number;
  temperatureCelsius: number;
  symptoms: SymptomRecord;
  source: MeasurementSource;
}

export interface ActivityMetrics {
  durationMinutes: number;
  movementIntensity: number;
  accelerationPeakCount: number;
  decelerationEventCount: number;
  impactLikeEventCount: number;
  loadIndex: number;
  loadLevel: LoadLevel;
}

export interface ActivitySession {
  id: string;
  activityType: ActivityType;
  injuredSide: KneeSide;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  baselineMeasurements: KneeMeasurement[];
  recoveryMeasurements: KneeMeasurement[];
  activityMetrics: ActivityMetrics | null;
}
