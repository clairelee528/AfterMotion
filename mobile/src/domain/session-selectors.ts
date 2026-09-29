import {
  recoveryCheckpoints,
  type CheckpointRecord,
  type KneeSide,
  type RecoveryCheckpoint,
  type Session,
  type SubjectiveSwelling,
} from './models';

export type CheckpointStatus = 'pending' | 'partial' | 'needsCheckIn' | 'complete';
export type SessionStage =
  | 'baseline'
  | 'readyForActivity'
  | 'activityActive'
  | 'activityPaused'
  | 'recovery'
  | 'readyToComplete'
  | 'complete'
  | 'endedEarly';

export type RecommendedAction =
  | 'completeBaseline'
  | 'startActivity'
  | 'resumeActivity'
  | 'completePostActivity'
  | 'continueRecovery'
  | 'completeSession'
  | 'viewSummary';

export const swellingScores: Record<SubjectiveSwelling, number> = {
  normal: 0,
  mild: 1,
  moderate: 2,
  significant: 3,
};

export function getCheckpointStatus(record?: CheckpointRecord): CheckpointStatus {
  if (record?.left && record.right) {
    return record.symptomsRecordedAt ? 'complete' : 'needsCheckIn';
  }
  if (record?.left || record?.right) return 'partial';
  return 'pending';
}

export function getNextMissingSide(record?: CheckpointRecord): KneeSide | null {
  if (!record?.left) return 'left';
  if (!record.right) return 'right';
  return null;
}

export function getNextSideAfterMeasurement(
  record: CheckpointRecord | undefined,
  measuredSide: KneeSide,
): KneeSide | null {
  const otherSide: KneeSide = measuredSide === 'left' ? 'right' : 'left';
  return record?.[otherSide] ? null : otherSide;
}

export function isBaselineComplete(session: Session): boolean {
  return getCheckpointStatus(session.baseline) === 'complete';
}

export function isActivityInProgress(session: Session): boolean {
  return session.activity.status === 'active' || session.activity.status === 'paused';
}

export function getCompletedRecoveryCount(session: Session): number {
  return recoveryCheckpoints.filter(
    (checkpoint) => getCheckpointStatus(session.recovery[checkpoint]) === 'complete',
  ).length;
}

export function areAllRecoveryCheckpointsComplete(session: Session): boolean {
  return getCompletedRecoveryCount(session) === recoveryCheckpoints.length;
}

export function isSessionComplete(session: Session): boolean {
  return (
    isBaselineComplete(session) &&
    session.activity.status === 'complete' &&
    areAllRecoveryCheckpointsComplete(session)
  );
}

export function getSessionStage(session: Session): SessionStage {
  if (session.endedEarly || session.status === 'endedEarly') return 'endedEarly';
  if (session.closedAt || session.status === 'complete') return 'complete';
  if (!isBaselineComplete(session)) return 'baseline';
  if (session.activity.status === 'active') return 'activityActive';
  if (session.activity.status === 'paused') return 'activityPaused';
  if (session.activity.status !== 'complete') return 'readyForActivity';
  if (areAllRecoveryCheckpointsComplete(session)) return 'readyToComplete';
  return 'recovery';
}

export function getRecommendedAction(session: Session): RecommendedAction {
  const stage = getSessionStage(session);
  if (stage === 'baseline') return 'completeBaseline';
  if (stage === 'readyForActivity') return 'startActivity';
  if (stage === 'activityActive' || stage === 'activityPaused') return 'resumeActivity';
  if (stage === 'readyToComplete') return 'completeSession';
  if (stage === 'complete' || stage === 'endedEarly') return 'viewSummary';
  return getCheckpointStatus(session.recovery['0']) === 'complete'
    ? 'continueRecovery'
    : 'completePostActivity';
}

export function getClosedSessions(sessions: Record<string, Session>): Session[] {
  return Object.values(sessions)
    .filter((session) => session.closedAt !== null)
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));
}

export function getLatestClosedSession(
  sessions: Record<string, Session>,
): Session | null {
  return getClosedSessions(sessions)[0] ?? null;
}

export function getTemperatureSeries(
  session: Session,
  side: KneeSide,
): (number | null)[] {
  return [
    session.baseline[side]?.temperatureCelsius ?? null,
    ...recoveryCheckpoints.map(
      (checkpoint) => session.recovery[checkpoint]?.[side]?.temperatureCelsius ?? null,
    ),
  ];
}

export function getSwellingSeries(session: Session): (number | null)[] {
  const score = (record: CheckpointRecord): number | null =>
    record.symptomsRecordedAt ? swellingScores[record.symptoms.swelling] : null;
  return [
    score(session.baseline),
    ...recoveryCheckpoints.map((checkpoint) => score(session.recovery[checkpoint])),
  ];
}

export function getPainSeries(session: Session): (number | null)[] {
  const score = (record: CheckpointRecord): number | null =>
    record.symptomsRecordedAt ? record.symptoms.pain : null;
  return [
    score(session.baseline),
    ...recoveryCheckpoints.map((checkpoint) => score(session.recovery[checkpoint])),
  ];
}

export function getStiffnessSeries(session: Session): (number | null)[] {
  const score = (record: CheckpointRecord): number | null =>
    record.symptomsRecordedAt ? record.symptoms.stiffness : null;
  return [
    score(session.baseline),
    ...recoveryCheckpoints.map((checkpoint) => score(session.recovery[checkpoint])),
  ];
}

export function getLastCompletedRecoveryMinutes(session: Session): number | null {
  const completed = recoveryCheckpoints.filter(
    (checkpoint) => getCheckpointStatus(session.recovery[checkpoint]) === 'complete',
  );
  if (completed.length === 0) return null;
  return Number(completed.at(-1) as RecoveryCheckpoint);
}
