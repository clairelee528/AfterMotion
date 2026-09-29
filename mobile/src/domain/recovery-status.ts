import { recoveryCheckpoints, type RecoveryCheckpoint, type Session } from './models';
import {
  getCircumferenceResponse,
  getTemperatureResponse,
} from './recovery-metrics';
import { getCheckpointStatus, swellingScores } from './session-selectors';

export const BASELINE_TOLERANCE = {
  injuredStretchPercent: 0.5,
  contralateralStretchDifferencePercent: 0.5,
  injuredTemperatureDeltaCelsius: 0.3,
  temperatureResponseDifferenceCelsius: 0.3,
  painIncrease: 1,
  stiffnessIncrease: 1,
} as const;

export type RecoveryRangeStatus =
  | 'insufficientData'
  | 'aboveBaselineRange'
  | 'withinBaselineRange';

export interface RecoveryCheckpointAssessment {
  checkpoint: RecoveryCheckpoint;
  status: RecoveryRangeStatus;
  outsideMetrics: string[];
}

export type RecoveryTimeResult =
  | { status: 'recovered'; minutes: number; checkpoint: RecoveryCheckpoint }
  | { status: 'notRecovered'; minutes: null; checkpoint: null }
  | { status: 'insufficientData'; minutes: null; checkpoint: null };

export function assessRecoveryCheckpoint(
  session: Session,
  checkpoint: RecoveryCheckpoint,
): RecoveryCheckpointAssessment {
  const record = session.recovery[checkpoint];
  if (
    getCheckpointStatus(session.baseline) !== 'complete' ||
    getCheckpointStatus(record) !== 'complete'
  ) {
    return { checkpoint, status: 'insufficientData', outsideMetrics: [] };
  }

  const circumference = getCircumferenceResponse(session, checkpoint);
  const temperature = getTemperatureResponse(session, checkpoint);
  const injuredStretch =
    session.injuredSide === 'left'
      ? circumference.leftPercent
      : circumference.rightPercent;
  const injuredTemperature =
    session.injuredSide === 'left'
      ? temperature.leftDeltaCelsius
      : temperature.rightDeltaCelsius;
  if (
    injuredStretch === null ||
    circumference.contralateralDifferencePercent === null ||
    injuredTemperature === null ||
    temperature.responseDifferenceCelsius === null
  ) {
    return { checkpoint, status: 'insufficientData', outsideMetrics: [] };
  }

  const outsideMetrics: string[] = [];
  if (Math.abs(injuredStretch) > BASELINE_TOLERANCE.injuredStretchPercent) {
    outsideMetrics.push('Band stretch response');
  }
  if (
    Math.abs(circumference.contralateralDifferencePercent) >
    BASELINE_TOLERANCE.contralateralStretchDifferencePercent
  ) {
    outsideMetrics.push('Contralateral stretch difference');
  }
  if (
    Math.abs(injuredTemperature) >
    BASELINE_TOLERANCE.injuredTemperatureDeltaCelsius
  ) {
    outsideMetrics.push('Temperature response');
  }
  if (
    Math.abs(temperature.responseDifferenceCelsius) >
    BASELINE_TOLERANCE.temperatureResponseDifferenceCelsius
  ) {
    outsideMetrics.push('Temperature response difference');
  }
  if (record.symptoms.pain > session.baseline.symptoms.pain + BASELINE_TOLERANCE.painIncrease) {
    outsideMetrics.push('Pain');
  }
  if (
    record.symptoms.stiffness >
    session.baseline.symptoms.stiffness + BASELINE_TOLERANCE.stiffnessIncrease
  ) {
    outsideMetrics.push('Stiffness');
  }
  if (
    swellingScores[record.symptoms.swelling] >
    swellingScores[session.baseline.symptoms.swelling]
  ) {
    outsideMetrics.push('Reported swelling');
  }

  return {
    checkpoint,
    status: outsideMetrics.length === 0 ? 'withinBaselineRange' : 'aboveBaselineRange',
    outsideMetrics,
  };
}

export function getRecoveryTime(session: Session): RecoveryTimeResult {
  const assessments = recoveryCheckpoints.map((checkpoint) =>
    assessRecoveryCheckpoint(session, checkpoint),
  );
  const firstWithinIndex = assessments.findIndex(
    (assessment) => assessment.status === 'withinBaselineRange',
  );

  if (firstWithinIndex >= 0) {
    const earlierAssessments = assessments.slice(0, firstWithinIndex);
    if (earlierAssessments.some((assessment) => assessment.status === 'insufficientData')) {
      return { status: 'insufficientData', minutes: null, checkpoint: null };
    }
    const checkpoint = recoveryCheckpoints[firstWithinIndex];
    return { status: 'recovered', minutes: Number(checkpoint), checkpoint };
  }

  if (assessments.some((assessment) => assessment.status === 'insufficientData')) {
    return { status: 'insufficientData', minutes: null, checkpoint: null };
  }
  return { status: 'notRecovered', minutes: null, checkpoint: null };
}

export function getRecoveryRangeLabel(status: RecoveryRangeStatus): string {
  if (status === 'withinBaselineRange') return 'Within baseline range';
  if (status === 'aboveBaselineRange') return 'Above baseline range';
  return 'Insufficient data';
}
