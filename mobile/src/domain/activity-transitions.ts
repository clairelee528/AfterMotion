import type { ActivityRecord } from './models';

function timestampMs(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const value = new Date(isoDate).getTime();
  return Number.isFinite(value) ? value : null;
}

export function getActivityElapsedSeconds(
  activity: ActivityRecord,
  nowMs = Date.now(),
): number {
  if (activity.status !== 'active') return Math.max(0, activity.elapsedSeconds);
  const startedAtMs = timestampMs(activity.startedAt);
  if (startedAtMs === null) return Math.max(0, activity.elapsedSeconds);
  const activeSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  return Math.max(0, activity.elapsedSeconds) + activeSeconds;
}

export function startActivityRecord(
  activity: ActivityRecord,
  nowIso = new Date().toISOString(),
): ActivityRecord {
  if (activity.status === 'complete' || activity.status === 'active') return activity;
  return {
    ...activity,
    status: 'active',
    startedAt: nowIso,
    endedAt: null,
  };
}

export function pauseActivityRecord(
  activity: ActivityRecord,
  nowIso = new Date().toISOString(),
): ActivityRecord {
  if (activity.status !== 'active') return activity;
  return {
    ...activity,
    status: 'paused',
    elapsedSeconds: getActivityElapsedSeconds(activity, new Date(nowIso).getTime()),
    startedAt: null,
  };
}

export function finishActivityRecord(
  activity: ActivityRecord,
  nowIso = new Date().toISOString(),
): ActivityRecord {
  if (activity.status === 'complete') return activity;
  return {
    ...activity,
    status: 'complete',
    elapsedSeconds: getActivityElapsedSeconds(activity, new Date(nowIso).getTime()),
    startedAt: null,
    endedAt: nowIso,
  };
}
