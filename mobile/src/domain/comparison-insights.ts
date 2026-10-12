import type { SessionComparison } from './session-comparison';
import { getRecoveryTime } from './recovery-status';
import { getCompletedRecoveryCount } from './session-selectors';

export interface ComparisonInsight {
  id: string;
  title: string;
  body: string;
  tone: 'info' | 'warning';
}

function metric(comparison: SessionComparison, key: string) {
  return comparison.metrics.find((item) => item.key === key);
}

function direction(value: number): 'higher' | 'lower' {
  return value > 0 ? 'higher' : 'lower';
}

function absoluteResponseInsight(
  id: string,
  label: string,
  unit: string,
  earlier: number | null | undefined,
  latest: number | null | undefined,
  similarThreshold: number,
): ComparisonInsight {
  if (earlier === null || earlier === undefined || latest === null || latest === undefined) {
    return {
      id,
      title: `${label} is not comparable`,
      body: 'One or both sessions are missing the required post-activity measurement.',
      tone: 'warning',
    };
  }
  const absoluteChange = Math.abs(latest) - Math.abs(earlier);
  if (Math.abs(absoluteChange) <= similarThreshold) {
    return {
      id,
      title: `${label} was similar`,
      body: `The recorded response magnitude differed by ${Math.abs(absoluteChange).toFixed(1)}${unit}.`,
      tone: 'info',
    };
  }
  return {
    id,
    title: `${label} was ${direction(absoluteChange)}`,
    body: `The latest recorded response magnitude was ${Math.abs(absoluteChange).toFixed(1)}${unit} ${direction(absoluteChange)}.`,
    tone: 'info',
  };
}

export function getComparisonInsights(
  comparison: SessionComparison,
): ComparisonInsight[] {
  const insights: ComparisonInsight[] = [];
  const load = metric(comparison, 'activityLoad');
  if (load?.change === null || load?.change === undefined) {
    insights.push({
      id: 'activity-load',
      title: 'Activity load is not comparable',
      body: 'One or both sessions are missing a calculated Activity Load Index.',
      tone: 'warning',
    });
  } else if (Math.abs(load.change) < 3) {
    insights.push({
      id: 'activity-load',
      title: 'Activity load was similar',
      body: `The two Activity Load Index values differed by ${Math.abs(load.change)} points.`,
      tone: 'info',
    });
  } else {
    insights.push({
      id: 'activity-load',
      title: `Activity load was ${direction(load.change)}`,
      body: `The latest Activity Load Index was ${Math.abs(load.change)} points ${direction(load.change)}.`,
      tone: 'info',
    });
  }

  const earlierRecovery = getRecoveryTime(comparison.earlier);
  const latestRecovery = getRecoveryTime(comparison.latest);
  if (earlierRecovery.status === 'recovered' && latestRecovery.status === 'recovered') {
    const recoveryChange = latestRecovery.minutes - earlierRecovery.minutes;
    insights.push(
      recoveryChange === 0
        ? {
            id: 'recovery-time',
            title: 'Recovery time was the same',
            body: `Both sessions first returned to the prototype baseline range at ${latestRecovery.minutes} minutes.`,
            tone: 'info',
          }
        : {
            id: 'recovery-time',
            title: `Baseline range was reached ${Math.abs(recoveryChange)} minutes ${recoveryChange < 0 ? 'earlier' : 'later'}`,
            body: 'This describes the recorded checkpoint timing and does not by itself indicate improvement or decline.',
            tone: 'info',
          },
    );
  } else {
    insights.push({
      id: 'recovery-time',
      title: 'Recovery time is not directly comparable',
      body: 'At least one session did not produce a complete within-range recovery time.',
      tone: 'warning',
    });
  }

  const stretch = metric(comparison, 'stretchResponse');
  insights.push(
    absoluteResponseInsight(
      'stretch-response',
      'Post-activity stretch response',
      '%',
      stretch?.earlier,
      stretch?.latest,
      0.2,
    ),
  );
  const temperature = metric(comparison, 'temperatureResponse');
  insights.push(
    absoluteResponseInsight(
      'temperature-response',
      'Post-activity temperature response',
      '°C',
      temperature?.earlier,
      temperature?.latest,
      0.1,
    ),
  );

  const earlierChecks = getCompletedRecoveryCount(comparison.earlier);
  const latestChecks = getCompletedRecoveryCount(comparison.latest);
  if (
    comparison.earlier.endedEarly ||
    comparison.latest.endedEarly ||
    earlierChecks < 5 ||
    latestChecks < 5
  ) {
    insights.push({
      id: 'completeness',
      title: 'Comparison includes incomplete recovery data',
      body: `Recovery checks completed: earlier ${earlierChecks}/5, latest ${latestChecks}/5. Missing checkpoints can limit interpretation.`,
      tone: 'warning',
    });
  } else {
    insights.push({
      id: 'completeness',
      title: 'Both recovery records are complete',
      body: 'Both sessions include all five planned recovery checkpoints.',
      tone: 'info',
    });
  }

  return insights;
}
