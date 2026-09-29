import {
  recoveryCheckpoints,
  type KneeSide,
  type MeasurementCheckpoint,
  type Session,
} from './models';

export interface CircumferenceResponse {
  leftPercent: number | null;
  rightPercent: number | null;
  injuredSide: KneeSide;
  contralateralDifferencePercent: number | null;
}

export interface TemperatureResponse {
  leftDeltaCelsius: number | null;
  rightDeltaCelsius: number | null;
  injuredSide: KneeSide;
  currentAsymmetryCelsius: number | null;
  responseDifferenceCelsius: number | null;
}

export function calculateBandStretchResponse(
  baselineValue: number | null | undefined,
  currentValue: number | null | undefined,
): number | null {
  if (
    baselineValue === null ||
    baselineValue === undefined ||
    currentValue === null ||
    currentValue === undefined ||
    !Number.isFinite(baselineValue) ||
    !Number.isFinite(currentValue) ||
    baselineValue <= 0
  ) {
    return null;
  }
  return ((currentValue - baselineValue) / baselineValue) * 100;
}

export function getCircumferenceResponse(
  session: Session,
  checkpoint: MeasurementCheckpoint,
): CircumferenceResponse {
  const record =
    checkpoint === 'baseline' ? session.baseline : session.recovery[checkpoint];
  const leftPercent = calculateBandStretchResponse(
    session.baseline.left?.stretchValue,
    record?.left?.stretchValue,
  );
  const rightPercent = calculateBandStretchResponse(
    session.baseline.right?.stretchValue,
    record?.right?.stretchValue,
  );
  const injuredPercent = session.injuredSide === 'left' ? leftPercent : rightPercent;
  const contralateralPercent = session.injuredSide === 'left' ? rightPercent : leftPercent;

  return {
    leftPercent,
    rightPercent,
    injuredSide: session.injuredSide,
    contralateralDifferencePercent:
      injuredPercent === null || contralateralPercent === null
        ? null
        : injuredPercent - contralateralPercent,
  };
}

export function getCircumferenceResponseSeries(
  session: Session,
  side: KneeSide,
): (number | null)[] {
  return [
    getCircumferenceResponse(session, 'baseline')[`${side}Percent`],
    ...recoveryCheckpoints.map(
      (checkpoint) => getCircumferenceResponse(session, checkpoint)[`${side}Percent`],
    ),
  ];
}

export function calculateTemperatureDelta(
  baselineCelsius: number | null | undefined,
  currentCelsius: number | null | undefined,
): number | null {
  if (
    baselineCelsius === null ||
    baselineCelsius === undefined ||
    currentCelsius === null ||
    currentCelsius === undefined ||
    !Number.isFinite(baselineCelsius) ||
    !Number.isFinite(currentCelsius)
  ) {
    return null;
  }
  return currentCelsius - baselineCelsius;
}

export function getTemperatureResponse(
  session: Session,
  checkpoint: MeasurementCheckpoint,
): TemperatureResponse {
  const record =
    checkpoint === 'baseline' ? session.baseline : session.recovery[checkpoint];
  const leftTemperature = record?.left?.temperatureCelsius;
  const rightTemperature = record?.right?.temperatureCelsius;
  const leftDeltaCelsius = calculateTemperatureDelta(
    session.baseline.left?.temperatureCelsius,
    leftTemperature,
  );
  const rightDeltaCelsius = calculateTemperatureDelta(
    session.baseline.right?.temperatureCelsius,
    rightTemperature,
  );
  const injuredTemperature =
    session.injuredSide === 'left' ? leftTemperature : rightTemperature;
  const contralateralTemperature =
    session.injuredSide === 'left' ? rightTemperature : leftTemperature;
  const injuredDelta =
    session.injuredSide === 'left' ? leftDeltaCelsius : rightDeltaCelsius;
  const contralateralDelta =
    session.injuredSide === 'left' ? rightDeltaCelsius : leftDeltaCelsius;

  return {
    leftDeltaCelsius,
    rightDeltaCelsius,
    injuredSide: session.injuredSide,
    currentAsymmetryCelsius:
      injuredTemperature === null ||
      injuredTemperature === undefined ||
      contralateralTemperature === null ||
      contralateralTemperature === undefined
        ? null
        : injuredTemperature - contralateralTemperature,
    responseDifferenceCelsius:
      injuredDelta === null || contralateralDelta === null
        ? null
        : injuredDelta - contralateralDelta,
  };
}

export function getTemperatureDeltaSeries(
  session: Session,
  side: KneeSide,
): (number | null)[] {
  return [
    getTemperatureResponse(session, 'baseline')[`${side}DeltaCelsius`],
    ...recoveryCheckpoints.map(
      (checkpoint) =>
        getTemperatureResponse(session, checkpoint)[`${side}DeltaCelsius`],
    ),
  ];
}
