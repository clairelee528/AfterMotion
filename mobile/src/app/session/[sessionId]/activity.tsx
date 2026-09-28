import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  MetricTile,
  MetricValue,
  Notice,
  Page,
  PageHeading,
  Row,
  StatusTag,
  wireframeStyles,
} from '@/components/ui';
import { DEMO_SAMPLE_RATE_HZ } from '@/data/demo-fixtures';
import { useSessionStore } from '@/state/session-store';

const activityNames: Record<string, string> = {
  badminton: 'Badminton',
  frisbee: 'Frisbee',
  gym: 'Gym',
  other: 'Other',
  running: 'Running',
  tennis: 'Tennis',
};

function restoredElapsedSeconds(activity: {
  elapsedSeconds: number;
  startedAt: string | null;
  status: string;
} | undefined) {
  if (!activity) return 0;
  const activeSeconds =
    activity.status === 'active' && activity.startedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(activity.startedAt).getTime()) / 1000))
      : 0;
  return activity.elapsedSeconds + activeSeconds;
}

export default function ActivityScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { finishActivity, sessions, setActivityStatus } = useSessionStore();
  const session = sessions[sessionId];
  const persistedActivity = session?.activity;
  const initialSeconds = restoredElapsedSeconds(persistedActivity);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [paused, setPaused] = useState(persistedActivity?.status === 'paused');
  const secondsRef = useRef(initialSeconds);
  const statusUpdaterRef = useRef(setActivityStatus);

  useEffect(() => {
    statusUpdaterRef.current = setActivityStatus;
  }, [setActivityStatus]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      const nextValue = secondsRef.current + 1;
      secondsRef.current = nextValue;
      setSeconds(nextValue);
      if (nextValue % 10 === 0) {
        statusUpdaterRef.current(sessionId, 'active', nextValue);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, sessionId]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');

  return (
    <Page>
      <PageHeading
        eyebrow={paused ? 'Activity paused' : 'Activity in progress'}
        title={session ? activityNames[session.activityType] : 'Activity'}
        highlight={paused ? 'PAUSED' : 'LIVE'}
        description="Move normally. AfterMotion is collecting demo load data without interrupting your session."
      />
      <Card variant="data">
        <StatusTag label={paused ? 'Paused' : 'Recording'} tone={paused ? 'warning' : 'active'} />
        <MetricValue inverse>{minutes}:{remainder}</MetricValue>
        <MetricTile label="Motion Sleeve" value={paused ? 'Paused' : 'Live'} highlighted />
        <Row
          label="Samples collected"
          value={`${seconds * DEMO_SAMPLE_RATE_HZ}`}
          icon="pulse-outline"
          inverse
        />
      </Card>
      {paused ? (
        <Notice title="Session paused" body="Timing and demo sampling are paused." tone="warning" />
      ) : null}
      <View style={wireframeStyles.actionRow}>
        <Button
          label={paused ? 'Resume activity' : 'Pause'}
          icon={paused ? 'play-outline' : 'pause-outline'}
          onPress={() => {
            const nextPaused = !paused;
            setPaused(nextPaused);
            setActivityStatus(sessionId, nextPaused ? 'paused' : 'active', secondsRef.current);
          }}
          variant="secondary"
          style={wireframeStyles.actionButton}
        />
        <Button
          label="Finish activity"
          icon="stop-outline"
          onPress={() => {
            finishActivity(sessionId, secondsRef.current);
            router.replace({
              pathname: '/session/[sessionId]/activity-summary',
              params: { sessionId },
            });
          }}
          variant="highlight"
          style={wireframeStyles.actionButton}
        />
      </View>
    </Page>
  );
}
