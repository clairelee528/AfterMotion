import type {
  ActivityStatus,
  ActivityType,
  ActivityMetrics,
  CheckpointRecord,
  KneeMeasurement,
  KneeSide,
  MeasurementQuality,
  MeasurementCheckpoint,
  MeasurementSource,
  PersistedSessionState,
  Session,
  SessionState,
  SessionStatus,
  SubjectiveSwelling,
  SymptomRecord,
} from '../domain/models';
import { recoveryCheckpoints } from '../domain/models';

export const SESSION_STORAGE_KEY = '@aftermotion/session-state/v2';
export const LEGACY_SESSION_STORAGE_KEY = '@aftermotion/session-state/v1';
export const SESSION_SCHEMA_VERSION = 2 as const;

type UnknownRecord = Record<string, unknown>;

const activityTypes: ActivityType[] = [
  'frisbee',
  'badminton',
  'tennis',
  'running',
  'gym',
  'other',
];
const activityStatuses: ActivityStatus[] = ['planned', 'active', 'paused', 'complete'];
const sessionStatuses: SessionStatus[] = [
  'draft',
  'baseline',
  'activity',
  'recovery',
  'complete',
  'endedEarly',
];
const measurementSources: MeasurementSource[] = ['mock', 'manual', 'bluetooth'];
const swellingValues: SubjectiveSwelling[] = ['normal', 'mild', 'moderate', 'significant'];
const loadLevels = ['light', 'moderate', 'high'] as const;

const defaultSymptoms: SymptomRecord = { pain: 2, stiffness: 2, swelling: 'mild' };

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeSymptoms(value: unknown, measurement?: UnknownRecord): SymptomRecord {
  const record = isRecord(value) ? value : {};
  return {
    pain: finiteNumber(record.pain, finiteNumber(measurement?.pain, defaultSymptoms.pain)),
    stiffness: finiteNumber(record.stiffness, defaultSymptoms.stiffness),
    swelling: enumValue(record.swelling, swellingValues, defaultSymptoms.swelling),
  };
}

function normalizeMeasurementQuality(value: unknown): MeasurementQuality | undefined {
  if (!isRecord(value)) return undefined;
  return {
    bandTension: enumValue(
      value.bandTension,
      ['unknown', 'tooLoose', 'tooTight', 'correct'],
      'unknown',
    ),
    stability: enumValue(value.stability, ['unknown', 'movement', 'stable'], 'unknown'),
    temperatureStable: value.temperatureStable === true,
  };
}

function normalizeMeasurement(
  value: unknown,
  sessionId: string,
  checkpoint: MeasurementCheckpoint,
  side: KneeSide,
  fallbackSource: MeasurementSource,
): KneeMeasurement | null {
  if (!isRecord(value)) return null;
  const recordedAt = stringValue(value.recordedAt, new Date(0).toISOString());
  return {
    id: stringValue(value.id, `${sessionId}-${checkpoint}-${side}-${recordedAt}`),
    sessionId,
    checkpoint,
    side,
    recordedAt,
    stretchValue: finiteNumber(value.stretchValue, 0),
    temperatureCelsius: finiteNumber(value.temperatureCelsius, 0),
    source: enumValue(value.source, measurementSources, fallbackSource),
    quality: normalizeMeasurementQuality(value.quality),
  };
}

function normalizeCheckpoint(
  value: unknown,
  sessionId: string,
  checkpoint: MeasurementCheckpoint,
  source: MeasurementSource,
): CheckpointRecord {
  const record = isRecord(value) ? value : {};
  const symptomMeasurement = isRecord(record.left)
    ? record.left
    : isRecord(record.right)
      ? record.right
      : undefined;
  return {
    left: normalizeMeasurement(record.left, sessionId, checkpoint, 'left', source),
    right: normalizeMeasurement(record.right, sessionId, checkpoint, 'right', source),
    symptoms: normalizeSymptoms(record.symptoms, symptomMeasurement),
    symptomsRecordedAt:
      nullableString(record.symptomsRecordedAt) ??
      (symptomMeasurement ? nullableString(symptomMeasurement.recordedAt) : null),
  };
}

function normalizeActivityMetrics(value: unknown): ActivityMetrics | null {
  if (!isRecord(value)) return null;
  return {
    durationSeconds: Math.max(0, finiteNumber(value.durationSeconds, 0)),
    sampleCount: Math.max(0, finiteNumber(value.sampleCount, 0)),
    movementIntensity: Math.max(0, finiteNumber(value.movementIntensity, 0)),
    accelerationPeakCount: Math.max(0, finiteNumber(value.accelerationPeakCount, 0)),
    decelerationEventCount: Math.max(0, finiteNumber(value.decelerationEventCount, 0)),
    impactLikeEventCount: Math.max(0, finiteNumber(value.impactLikeEventCount, 0)),
    loadIndex: Math.max(0, finiteNumber(value.loadIndex, 0)),
    loadLevel: enumValue(value.loadLevel, loadLevels, 'light'),
  };
}

function inferSessionStatus(record: UnknownRecord, activityStatus: ActivityStatus): SessionStatus {
  if (record.endedEarly === true) return 'endedEarly';
  if (typeof record.closedAt === 'string') return 'complete';
  if (activityStatus === 'complete') return 'recovery';
  if (activityStatus === 'active' || activityStatus === 'paused') return 'activity';
  const baseline = isRecord(record.baseline) ? record.baseline : {};
  return baseline.left && baseline.right ? 'activity' : 'baseline';
}

function normalizeSession(value: unknown, fallbackId: string): Session | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, fallbackId);
  const createdAt = stringValue(value.createdAt, new Date(0).toISOString());
  const source = enumValue(value.measurementSource ?? value.source, measurementSources, 'mock');
  const activity = isRecord(value.activity) ? value.activity : {};
  const activityStatus = enumValue(activity.status, activityStatuses, 'planned');
  const storedStatus = enumValue(
    value.status,
    sessionStatuses,
    inferSessionStatus(value, activityStatus),
  );
  const recovery = isRecord(value.recovery) ? value.recovery : {};

  return {
    id,
    activityType: enumValue(value.activityType, activityTypes, 'other'),
    injuredSide: enumValue(value.injuredSide, ['left', 'right'], 'right'),
    measurementSource: source,
    status: storedStatus,
    createdAt,
    updatedAt: stringValue(value.updatedAt, stringValue(value.closedAt, createdAt)),
    closedAt: nullableString(value.closedAt),
    endedEarly: value.endedEarly === true,
    baseline: normalizeCheckpoint(value.baseline, id, 'baseline', source),
    activity: {
      status: activityStatus,
      elapsedSeconds: Math.max(0, finiteNumber(activity.elapsedSeconds, 0)),
      sampleCount: Math.max(
        0,
        finiteNumber(
          activity.sampleCount,
          finiteNumber(
            activity.metrics && isRecord(activity.metrics)
              ? activity.metrics.sampleCount
              : undefined,
            0,
          ),
        ),
      ),
      startedAt: nullableString(activity.startedAt),
      endedAt: nullableString(activity.endedAt),
      metrics: normalizeActivityMetrics(activity.metrics),
    },
    recovery: Object.fromEntries(
      recoveryCheckpoints.map((checkpoint) => [
        checkpoint,
        normalizeCheckpoint(recovery[checkpoint], id, checkpoint, source),
      ]),
    ),
  };
}

function normalizeState(value: unknown): SessionState {
  if (!isRecord(value) || !isRecord(value.sessions)) return emptySessionState();
  const sessions = Object.fromEntries(
    Object.entries(value.sessions)
      .map(([id, session]) => normalizeSession(session, id))
      .filter((session): session is Session => session !== null)
      .map((session) => [session.id, session]),
  );
  const requestedCurrentId = nullableString(value.currentSessionId);
  return {
    currentSessionId:
      requestedCurrentId && sessions[requestedCurrentId] ? requestedCurrentId : null,
    sessions,
  };
}

export function emptySessionState(): SessionState {
  return { currentSessionId: null, sessions: {} };
}

export function decodeSessionState(raw: string): SessionState {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error('Session storage must contain an object.');
  if ('schemaVersion' in parsed && parsed.schemaVersion !== SESSION_SCHEMA_VERSION) {
    throw new Error(`Unsupported session schema version: ${String(parsed.schemaVersion)}`);
  }
  return normalizeState(parsed);
}

export function encodeSessionState(state: SessionState): string {
  const persisted: PersistedSessionState = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    ...state,
  };
  return JSON.stringify(persisted);
}
