import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { BandPlacementGuide } from '@/components/band-placement-guide';
import {
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  MeasurementProgress,
  Row,
  SideBadge,
  StatusTag,
  wireframeStyles,
} from '@/components/ui';
import { MockMeasurementDataSource } from '@/data/mock-measurement-source';
import {
  isRecoveryCheckpoint,
  type KneeMeasurement,
  type KneeSide,
  type MeasurementPhase,
} from '@/domain/models';
import {
  DEMO_MEASUREMENT_SECONDS,
  getMeasurementTimerSnapshot,
  MEASUREMENT_PROTOCOL_SECONDS,
} from '@/domain/measurement-timing';
import { getNextSideAfterMeasurement } from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';
import { formatTemperature } from '@/utils/format';

type MeasurementState =
  | 'disconnected'
  | 'tooLoose'
  | 'tooTight'
  | 'ready'
  | 'measuring'
  | 'movement'
  | 'stabilizing'
  | 'complete';

const stateCopy: Record<MeasurementState, { title: string; body: string }> = {
  disconnected: {
    title: 'Recovery Band disconnected',
    body: 'No measurement data is being received. Reconnect or continue with demo data.',
  },
  tooLoose: {
    title: 'Band too loose',
    body: 'Tighten the band until the indicator reaches the target range.',
  },
  tooTight: {
    title: 'Band too tight',
    body: 'Loosen the band until the indicator returns to the target range.',
  },
  ready: {
    title: 'Ready to measure',
    body: 'The band position and starting tension are in range.',
  },
  measuring: {
    title: 'Measuring',
    body: 'Keep your leg still while the reading is captured.',
  },
  movement: {
    title: 'Movement detected',
    body: 'Keep your leg still and restart the measurement window.',
  },
  stabilizing: {
    title: 'Temperature still stabilizing',
    body: 'Keep the band in place for a little longer.',
  },
  complete: {
    title: 'Measurement complete',
    body: 'Stretch and temperature are captured and ready to save.',
  },
};

export default function MeasurementScreen() {
  const { saveMeasurement, sessions } = useSessionStore();
  const params = useLocalSearchParams<{
    sessionId: string;
    phase: MeasurementPhase;
    side: KneeSide;
    checkpoint: string;
    mode?: 'remeasure';
  }>();
  const phase = params.phase ?? 'baseline';
  const side = params.side ?? 'left';
  const checkpoint = params.checkpoint ?? 'baseline';
  const session = sessions[params.sessionId];
  const [measurementState, setMeasurementState] =
    useState<MeasurementState>('ready');
  const isAcceleratedDemo = session?.measurementSource === 'mock';
  const measurementDuration = isAcceleratedDemo
    ? DEMO_MEASUREMENT_SECONDS
    : MEASUREMENT_PROTOCOL_SECONDS;
  const [remainingSeconds, setRemainingSeconds] = useState(measurementDuration);
  const [progressValue, setProgressValue] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const captureRequestedRef = useRef(false);
  const [capturedMeasurement, setCapturedMeasurement] =
    useState<KneeMeasurement | null>(null);
  const measurementDataSource = useMemo(() => new MockMeasurementDataSource(), []);
  const sourceAvailable = session?.measurementSource === 'mock';
  const sourceUnavailable = Boolean(session && !sourceAvailable);
  const copy = stateCopy[sourceUnavailable ? 'disconnected' : measurementState];
  const currentRecord =
    phase === 'baseline' ? session?.baseline : session?.recovery[checkpoint];
  const measurementCheckpoint =
    phase === 'baseline' || !isRecoveryCheckpoint(checkpoint) ? 'baseline' : checkpoint;
  const sourceLabel =
    session?.measurementSource === 'bluetooth'
      ? 'Bluetooth sensor'
      : session?.measurementSource === 'manual'
        ? 'Manual entry'
        : 'Demo data';
  const nextSide = getNextSideAfterMeasurement(currentRecord, side);

  const stageLabel = useMemo(() => {
    if (phase === 'baseline') return 'Baseline';
    return checkpoint === '0' ? 'Post activity' : `${checkpoint} min recovery`;
  }, [checkpoint, phase]);

  useEffect(() => {
    if (session && session.measurementSource !== 'mock') return;
    let mounted = true;
    void measurementDataSource.connect().catch(() => {
      if (mounted) setMeasurementState('disconnected');
    });
    return () => {
      mounted = false;
      void measurementDataSource.disconnect();
    };
  }, [measurementDataSource, session]);

  useEffect(() => {
    if (measurementState !== 'measuring' && measurementState !== 'stabilizing') return;
    const timer = setInterval(() => {
      if (startedAtRef.current === null) return;
      const elapsedSeconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const snapshot = getMeasurementTimerSnapshot(elapsedSeconds, measurementDuration);
      setRemainingSeconds(snapshot.remainingSeconds);
      setProgressValue(snapshot.progressPercent);
      setMeasurementState(snapshot.state);
    }, 250);
    return () => clearInterval(timer);
  }, [measurementDuration, measurementState]);

  useEffect(() => {
    if (measurementState !== 'complete' || captureRequestedRef.current) return;
    captureRequestedRef.current = true;
    let mounted = true;
    void measurementDataSource
      .measure({
        sessionId: params.sessionId,
        checkpoint: measurementCheckpoint,
        side,
      })
      .then((measurement) => {
        if (mounted) setCapturedMeasurement(measurement);
      })
      .catch(() => {
        if (mounted) setMeasurementState('disconnected');
      });
    return () => {
      mounted = false;
    };
  }, [measurementCheckpoint, measurementDataSource, measurementState, params.sessionId, side]);

  function startMeasurement() {
    startedAtRef.current = Date.now();
    captureRequestedRef.current = false;
    setCapturedMeasurement(null);
    setRemainingSeconds(measurementDuration);
    setProgressValue(0);
    setMeasurementState('measuring');
  }

  function resetMeasurement() {
    startedAtRef.current = null;
    captureRequestedRef.current = false;
    setCapturedMeasurement(null);
    setRemainingSeconds(measurementDuration);
    setProgressValue(0);
    setMeasurementState('ready');
  }

  function continueFlow() {
    if (!capturedMeasurement) return;
    saveMeasurement(capturedMeasurement);
    if (params.mode === 'remeasure') {
      router.replace({
        pathname: '/session/[sessionId]/checkpoint',
        params: {
          sessionId: params.sessionId,
          checkpoint: phase === 'baseline' ? 'baseline' : checkpoint,
        },
      });
      return;
    }
    if (nextSide) {
      resetMeasurement();
      router.replace({
        pathname: '/session/[sessionId]/measurement',
        params: { ...params, sessionId: params.sessionId, side: nextSide },
      });
      return;
    }

    router.replace({
      pathname: '/session/[sessionId]/feelings',
      params: {
        sessionId: params.sessionId,
        checkpoint: phase === 'baseline' ? 'baseline' : checkpoint,
        returnTo: 'checkpoint',
      },
    });
  }

  function primaryAction() {
    if (measurementState === 'ready') startMeasurement();
    else if (measurementState === 'complete') continueFlow();
    else if (measurementState !== 'measuring' && measurementState !== 'stabilizing') {
      resetMeasurement();
    }
  }

  const primaryLabel =
    sourceUnavailable
      ? 'Source unavailable'
      : measurementState === 'ready'
      ? 'Start measurement'
      : measurementState === 'measuring'
        ? `Measuring · ${remainingSeconds}s`
        : measurementState === 'stabilizing'
          ? `Stabilizing · ${remainingSeconds}s`
        : measurementState === 'complete'
          ? nextSide
            ? `Save and measure ${nextSide} knee`
            : 'Save and continue to feelings'
          : 'Restore ready state';
  const noticeTone =
    sourceUnavailable
      ? 'error'
      : measurementState === 'complete'
      ? 'success'
      : measurementState === 'disconnected' || measurementState === 'movement'
        ? 'error'
        : measurementState === 'tooLoose' ||
            measurementState === 'tooTight' ||
            measurementState === 'stabilizing'
          ? 'warning'
          : 'info';

  return (
    <Page>
      <PageHeading
        eyebrow={stageLabel}
        title={`${side === 'left' ? 'Left' : 'Right'} knee`}
        description="Position the band at the marked location and keep your leg still."
      />
      <SideBadge side={side} injured={session?.injuredSide === side} />
      {side === 'right' && currentRecord?.left ? (
        <Notice
          title="Switch to the right knee"
          body="Remove the band from the left knee, then use the same marker and closure position on the right knee."
          tone="info"
        />
      ) : null}
      <BandPlacementGuide
        side={side}
        onOpenFullGuide={() => router.push('/measurement-position')}
      />
      <MeasurementProgress
        label="Measurement progress"
        value={progressValue}
        detail={
          measurementState === 'complete'
            ? 'Complete'
            : measurementState === 'measuring' || measurementState === 'stabilizing'
              ? `${remainingSeconds}s remaining`
              : '30 sec protocol'
        }
      />
      {isAcceleratedDemo ? (
        <Notice
          title="Accelerated demo timing"
          body="This prototype completes the 30 second protocol in 8 seconds. Bluetooth measurements will use the full window."
          tone="info"
        />
      ) : null}
      <Notice title={copy.title} body={copy.body} tone={noticeTone} />
      <Card>
        <StatusTag
          label={
            sourceUnavailable
              ? 'Not connected'
              : measurementState === 'complete'
              ? capturedMeasurement
                ? 'Ready to save'
                : 'Finalizing result'
              : 'Ready to capture'
          }
          tone={sourceUnavailable ? 'error' : measurementState === 'complete' ? 'complete' : 'active'}
        />
        <Row label="Source" value={sourceLabel} icon="radio-outline" />
        <Row
          label="Band tension"
          value={
            measurementState === 'tooLoose'
              ? 'Too loose'
              : measurementState === 'tooTight'
                ? 'Too tight'
                : 'Target aligned'
          }
          icon="resize-outline"
        />
        <Row label="Stability" value={measurementState === 'movement' ? 'Movement' : 'Stable'} icon="pulse-outline" />
        <Row label="Window" value="30 sec" icon="timer-outline" />
      </Card>

      {measurementState === 'complete' && capturedMeasurement ? (
        <>
          <Card variant="data">
            <Row
              label="Stretch"
              value={capturedMeasurement.stretchValue.toLocaleString()}
              icon="resize-outline"
              inverse
            />
            <Row
              label="Temperature"
              value={formatTemperature(capturedMeasurement.temperatureCelsius)}
              icon="thermometer-outline"
              inverse
            />
          </Card>
        </>
      ) : null}

      <View style={wireframeStyles.actions}>
        <Button
          disabled={
            measurementState === 'measuring' ||
            measurementState === 'stabilizing' ||
            sourceUnavailable ||
            (measurementState === 'complete' && !capturedMeasurement)
          }
          label={primaryLabel}
          onPress={primaryAction}
          variant="highlight"
          icon={measurementState === 'complete' ? 'save-outline' : 'scan-outline'}
        />
        {measurementState === 'complete' ? (
          <Button
            label="Measure again"
            icon="refresh-outline"
            onPress={resetMeasurement}
            variant="secondary"
          />
        ) : measurementState === 'measuring' || measurementState === 'stabilizing' ? (
          <Button
            label="Cancel measurement"
            icon="close-circle-outline"
            onPress={resetMeasurement}
            variant="secondary"
          />
        ) : null}
      </View>
    </Page>
  );
}
