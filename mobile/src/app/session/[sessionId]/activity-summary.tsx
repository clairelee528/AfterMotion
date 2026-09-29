import { router, useLocalSearchParams } from 'expo-router';

import {
  Button,
  Card,
  Label,
  MetricTile,
  Notice,
  Page,
  PageHeading,
  Row,
  StatusTag,
  Value,
  wireframeStyles,
} from '@/components/ui';
import { getDemoActivityMetrics } from '@/data/demo-fixtures';
import { View } from 'react-native';
import { useSessionStore } from '@/state/session-store';

export default function ActivitySummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions } = useSessionStore();
  const session = sessions[sessionId];

  if (!session) {
    return (
      <Page>
        <PageHeading
          eyebrow="Activity summary"
          title="Session not found"
          description="This activity is no longer stored on this device."
        />
        <Button label="Return to Training" onPress={() => router.dismissTo('/')} />
      </Page>
    );
  }

  const durationMinutes = Math.max(
    1,
    Math.round(session.activity.elapsedSeconds / 60),
  );
  const metrics =
    session.activity.metrics ?? getDemoActivityMetrics(session.activity.elapsedSeconds);
  const loadLabel = metrics.loadLevel.charAt(0).toUpperCase() + metrics.loadLevel.slice(1);

  return (
    <Page>
      <PageHeading
        eyebrow="Activity complete"
        title={`${loadLabel} activity load`}
        highlight={`${metrics.loadIndex} · ${metrics.loadLevel.toUpperCase()}`}
        description="This describes what you did, not whether your knee was injured or safe."
      />
      <Card variant="data">
        <StatusTag label="Activity complete" tone="complete" />
        <Label inverse>Activity Load Index</Label>
        <Value inverse>{metrics.loadIndex} · {loadLabel}</Value>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Duration" value={String(durationMinutes)} unit="min" highlighted />
          <MetricTile label="Decelerations" value={String(metrics.decelerationEventCount)} />
        </View>
        <Row
          label="Movement intensity"
          value={String(metrics.movementIntensity)}
          icon="speedometer-outline"
          inverse
        />
        <Row
          label="Acceleration peaks"
          value={String(metrics.accelerationPeakCount)}
          icon="trending-up-outline"
          inverse
        />
        <Row
          label="Impact-like events"
          value={String(metrics.impactLikeEventCount)}
          icon="flash-outline"
          inverse
        />
      </Card>
      <Notice
        title="Relative activity load"
        body="This repeatable prototype score combines duration, movement intensity, acceleration peaks, decelerations, and impact-like events. It does not estimate injury risk or medical safety."
        tone="info"
      />
      <Button
        label="Measure post-activity response"
        icon="scan-outline"
        onPress={() =>
          router.push({
            pathname: '/session/[sessionId]/measurement',
            params: { sessionId, phase: 'recovery', side: 'left', checkpoint: '0' },
          })
        }
        variant="highlight"
      />
      <Button
        label="Return to session overview"
        icon="grid-outline"
        onPress={() =>
          router.replace({
            pathname: '/session/[sessionId]',
            params: { sessionId, activityStatus: 'complete' },
          })
        }
        variant="secondary"
      />
    </Page>
  );
}
