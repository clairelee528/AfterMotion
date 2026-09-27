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
import { View } from 'react-native';
import { useSessionStore } from '@/state/session-store';

export default function ActivitySummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions } = useSessionStore();
  const durationMinutes = Math.max(
    1,
    Math.round((sessions[sessionId]?.activity.elapsedSeconds ?? 0) / 60),
  );

  return (
    <Page>
      <PageHeading
        eyebrow="Activity complete"
        title="High activity load"
        highlight="82 · HIGH"
        description="This describes what you did, not whether your knee was injured or safe."
      />
      <Card variant="data">
        <StatusTag label="Activity complete" tone="complete" />
        <Label inverse>Activity Load Index</Label>
        <Value inverse>82 · High</Value>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Duration" value={String(durationMinutes)} unit="min" highlighted />
          <MetricTile label="Decelerations" value="18" />
        </View>
        <Row label="Movement intensity" value="High" icon="speedometer-outline" inverse />
        <Row label="Impact-like events" value="14" icon="flash-outline" inverse />
      </Card>
      <Notice
        title="Demo load"
        body="These values are fixed for the Day 2 prototype. Real IMU processing is planned for Day 6."
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
