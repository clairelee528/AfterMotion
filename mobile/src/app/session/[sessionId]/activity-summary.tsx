import { router, useLocalSearchParams } from 'expo-router';

import {
  Button,
  Card,
  Label,
  Notice,
  Page,
  PageHeading,
  Progress,
  Row,
  Value,
} from '@/components/wireframe';
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
      <Progress current={4} total={6} />
      <PageHeading
        eyebrow="Activity complete"
        title="High activity load"
        description="This describes what you did, not whether your knee was injured or safe."
      />
      <Card>
        <Label>Activity Load Index</Label>
        <Value>82 · High</Value>
        <Row label="Duration" value={`${durationMinutes} min`} />
        <Row label="Movement intensity" value="High" />
        <Row label="Sharp decelerations" value="18" />
        <Row label="Impact-like events" value="14" />
      </Card>
      <Notice
        title="Demo load"
        body="These values are fixed for the Day 2 prototype. Real IMU processing is planned for Day 6."
      />
      <Button
        label="Measure post-activity response"
        onPress={() =>
          router.push({
            pathname: '/session/[sessionId]/measurement',
            params: { sessionId, phase: 'recovery', side: 'left', checkpoint: '0' },
          })
        }
      />
      <Button
        label="Return to session overview"
        onPress={() =>
          router.replace({
            pathname: '/session/[sessionId]',
            params: { sessionId, activityStatus: 'complete' },
          })
        }
        variant="text"
      />
    </Page>
  );
}
