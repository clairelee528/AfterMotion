import type { Session } from './models';
import { getCircumferenceResponse, getTemperatureResponse } from './recovery-metrics';
import { getRecoveryTime } from './recovery-status';
import { getCompletedRecoveryCount } from './session-selectors';

export type ComparisonMetricKey =
  | 'activityLoad'
  | 'duration'
  | 'movementIntensity'
  | 'recoveryTime'
  | 'stretchResponse'
  | 'temperatureResponse'
  | 'pain'
  | 'stiffness'
  | 'recoveryChecks';

export interface ComparisonMetric {
  key: ComparisonMetricKey;
  label: string;
  earlier: number | null;
  latest: number | null;
  change: number | null;
}

export interface SessionComparison {
  earlier: Session;
  latest: Session;
  metrics: ComparisonMetric[];
}

function comparisonDate(session: Session): string {
  return session.closedAt ?? session.createdAt;
}

function orderedSessions(first: Session, second: Session): [Session, Session] {
  return comparisonDate(first).localeCompare(comparisonDate(second)) <= 0
    ? [first, second]
    : [second, first];
}

function difference(earlier: number | null, latest: number | null): number | null {
  return earlier === null || latest === null ? null : latest - earlier;
}

function injuredStretchResponse(session: Session): number | null {
  const response = getCircumferenceResponse(session, '0');
  return session.injuredSide === 'left' ? response.leftPercent : response.rightPercent;
}

function injuredTemperatureResponse(session: Session): number | null {
  const response = getTemperatureResponse(session, '0');
  return session.injuredSide === 'left'
    ? response.leftDeltaCelsius
    : response.rightDeltaCelsius;
}

function recoveryMinutes(session: Session): number | null {
  const result = getRecoveryTime(session);
  return result.status === 'recovered' ? result.minutes : null;
}

function postSymptom(session: Session, key: 'pain' | 'stiffness'): number | null {
  const postActivity = session.recovery['0'];
  return postActivity?.symptomsRecordedAt ? postActivity.symptoms[key] : null;
}

export function createSessionComparison(
  first: Session,
  second: Session,
): SessionComparison {
  if (first.id === second.id) throw new Error('Choose two different sessions.');
  if (first.activityType !== second.activityType) {
    throw new Error('Only sessions with the same activity type can be compared.');
  }

  const [earlier, latest] = orderedSessions(first, second);
  const values: Omit<ComparisonMetric, 'change'>[] = [
    {
      key: 'activityLoad',
      label: 'Activity Load Index',
      earlier: earlier.activity.metrics?.loadIndex ?? null,
      latest: latest.activity.metrics?.loadIndex ?? null,
    },
    {
      key: 'duration',
      label: 'Duration',
      earlier: earlier.activity.elapsedSeconds,
      latest: latest.activity.elapsedSeconds,
    },
    {
      key: 'movementIntensity',
      label: 'Movement intensity',
      earlier: earlier.activity.metrics?.movementIntensity ?? null,
      latest: latest.activity.metrics?.movementIntensity ?? null,
    },
    {
      key: 'recoveryTime',
      label: 'Recovery time',
      earlier: recoveryMinutes(earlier),
      latest: recoveryMinutes(latest),
    },
    {
      key: 'stretchResponse',
      label: 'Post-activity stretch response',
      earlier: injuredStretchResponse(earlier),
      latest: injuredStretchResponse(latest),
    },
    {
      key: 'temperatureResponse',
      label: 'Post-activity temperature response',
      earlier: injuredTemperatureResponse(earlier),
      latest: injuredTemperatureResponse(latest),
    },
    {
      key: 'pain',
      label: 'Post-activity pain',
      earlier: postSymptom(earlier, 'pain'),
      latest: postSymptom(latest, 'pain'),
    },
    {
      key: 'stiffness',
      label: 'Post-activity stiffness',
      earlier: postSymptom(earlier, 'stiffness'),
      latest: postSymptom(latest, 'stiffness'),
    },
    {
      key: 'recoveryChecks',
      label: 'Recovery checks completed',
      earlier: getCompletedRecoveryCount(earlier),
      latest: getCompletedRecoveryCount(latest),
    },
  ];

  return {
    earlier,
    latest,
    metrics: values.map((metric) => ({
      ...metric,
      change: difference(metric.earlier, metric.latest),
    })),
  };
}
