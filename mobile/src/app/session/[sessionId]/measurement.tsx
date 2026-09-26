import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Choice,
  Label,
  Notice,
  Page,
  PageHeading,
  Progress,
  Row,
  SectionTitle,
  Value,
  wireframeStyles,
} from '@/components/wireframe';
import type { KneeSide } from '@/domain/models';
import { useSessionStore } from '@/state/session-store';

type MeasurementPhase = 'baseline' | 'recovery';
type MeasurementState =
  | 'disconnected'
  | 'tooLoose'
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
    body: 'Demo stretch and temperature values have been recorded.',
  },
};

export default function MeasurementScreen() {
  const { saveMeasurement, sessions } = useSessionStore();
  const params = useLocalSearchParams<{
    sessionId: string;
    phase: MeasurementPhase;
    side: KneeSide;
    checkpoint: string;
  }>();
  const phase = params.phase ?? 'baseline';
  const side = params.side ?? 'left';
  const checkpoint = params.checkpoint ?? 'baseline';
  const [measurementState, setMeasurementState] =
    useState<MeasurementState>('ready');
  const [pain, setPain] = useState(2);
  const copy = stateCopy[measurementState];
  const session = sessions[params.sessionId];
  const currentRecord =
    phase === 'baseline' ? session?.baseline : session?.recovery[checkpoint];
  const measurementOrder: KneeSide[] = ['left', 'right'];
  const nextSide = measurementOrder.find(
    (target) => target !== side && !currentRecord?.[target],
  );

  const stageLabel = useMemo(() => {
    if (phase === 'baseline') return 'Baseline';
    return checkpoint === '0' ? 'Post activity' : `${checkpoint} min recovery`;
  }, [checkpoint, phase]);

  function continueFlow() {
    saveMeasurement(params.sessionId, phase, side, checkpoint, pain);
    if (nextSide) {
      setMeasurementState('ready');
      setPain(2);
      router.replace({
        pathname: '/session/[sessionId]/measurement',
        params: { ...params, sessionId: params.sessionId, side: nextSide },
      });
      return;
    }

    if (phase === 'recovery') {
      router.replace({
        pathname: '/session/[sessionId]/checkpoint',
        params: { sessionId: params.sessionId, checkpoint },
      });
      return;
    }

    router.replace({
      pathname: '/session/[sessionId]',
      params: { sessionId: params.sessionId },
    });
  }

  function primaryAction() {
    if (measurementState === 'ready') setMeasurementState('measuring');
    else if (measurementState === 'measuring') setMeasurementState('complete');
    else if (measurementState === 'complete') continueFlow();
    else setMeasurementState('ready');
  }

  const primaryLabel =
    measurementState === 'ready'
      ? 'Start measurement'
      : measurementState === 'measuring'
        ? 'Complete demo reading'
        : measurementState === 'complete'
          ? nextSide
            ? `Save and measure ${nextSide} knee`
            : phase === 'recovery'
              ? 'Save and view results'
              : 'Save baseline'
          : 'Restore ready state';

  return (
    <Page>
      <Progress current={phase === 'baseline' ? 2 : 5} total={6} />
      <PageHeading
        eyebrow={stageLabel}
        title={`${side === 'left' ? 'Left' : 'Right'} knee`}
        description="Position the band at the marked location and keep your leg still."
      />
      <Notice title={copy.title} body={copy.body} />
      <Card>
        <Row label="Source" value="Demo data" />
        <Row label="Band tension" value={measurementState === 'tooLoose' ? 'Too loose' : 'Correct'} />
        <Row label="Stability" value={measurementState === 'movement' ? 'Movement' : 'Stable'} />
        <Row label="Window" value="30 sec" />
      </Card>

      {measurementState === 'complete' ? (
        <>
          <Card>
            <Label>Demo reading</Label>
            <Value>Stretch 2,418 · 33.4°C</Value>
          </Card>
          <Card>
            <SectionTitle>Symptoms</SectionTitle>
            <Label>Pain · {pain}/10</Label>
            <View style={wireframeStyles.choiceGrid}>
              {[0, 2, 4, 6, 8, 10].map((value) => (
                <Choice
                  key={value}
                  label={String(value)}
                  onPress={() => setPain(value)}
                  selected={pain === value}
                />
              ))}
            </View>
            <Row label="Stiffness" value="2/10" />
            <Row label="Subjective swelling" value="Mild" />
          </Card>
        </>
      ) : null}

      <View style={wireframeStyles.actions}>
        <Button label={primaryLabel} onPress={primaryAction} />
        {measurementState === 'complete' ? (
          <Button
            label="Measure again"
            onPress={() => setMeasurementState('ready')}
            variant="text"
          />
        ) : null}
      </View>
    </Page>
  );
}
