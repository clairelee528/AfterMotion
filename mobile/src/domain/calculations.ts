export function relativeResponse(current: number, baseline: number): number {
  if (baseline === 0) {
    throw new Error('Baseline must be non-zero.');
  }

  return (current - baseline) / baseline;
}

export function contralateralDifference(
  injuredSideResponse: number,
  contralateralResponse: number,
): number {
  return injuredSideResponse - contralateralResponse;
}

export function temperatureDelta(
  currentCelsius: number,
  baselineCelsius: number,
): number {
  return currentCelsius - baselineCelsius;
}
