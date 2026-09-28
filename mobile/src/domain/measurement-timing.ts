export const MEASUREMENT_PROTOCOL_SECONDS = 30;
export const DEMO_MEASUREMENT_SECONDS = 8;
export const STABILIZATION_SECONDS = 2;

export interface MeasurementTimerSnapshot {
  remainingSeconds: number;
  progressPercent: number;
  state: 'measuring' | 'stabilizing' | 'complete';
}

export function getMeasurementTimerSnapshot(
  elapsedSeconds: number,
  totalSeconds: number,
  stabilizationSeconds = STABILIZATION_SECONDS,
): MeasurementTimerSnapshot {
  const safeTotal = Math.max(1, totalSeconds);
  const elapsed = Math.max(0, Math.min(safeTotal, elapsedSeconds));
  const remainingSeconds = safeTotal - elapsed;
  const progressPercent = Math.round((elapsed / safeTotal) * 100);
  const state =
    remainingSeconds === 0
      ? 'complete'
      : remainingSeconds <= Math.min(stabilizationSeconds, safeTotal)
        ? 'stabilizing'
        : 'measuring';
  return { remainingSeconds, progressPercent, state };
}
