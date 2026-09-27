import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { useSessionStore } from '@/state/session-store';

export default function ActivityScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { finishActivity, sessions, setActivityStatus } = useSessionStore();
  const session = sessions[sessionId];
  const persistedActivity = session?.activity;
  const [seconds, setSeconds] = useState(persistedActivity?.elapsedSeconds ?? 0);
  const [paused, setPaused] = useState(persistedActivity?.status === 'paused');

  useEffect(() => {
    if (!persistedActivity) return;
    const restoreTimer = setTimeout(() => {
      const timeSinceLastStart =
        persistedActivity.status === 'active' && persistedActivity.startedAt
          ? Math.max(
              0,
              Math.floor((Date.now() - new Date(persistedActivity.startedAt).getTime()) / 1000),
            )
          : 0;
      setSeconds(persistedActivity.elapsedSeconds + timeSinceLastStart);
      setPaused(persistedActivity.status === 'paused');
    }, 0);
    return () => clearTimeout(restoreTimer);
  }, [
    persistedActivity,
  ]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () =>
        setSeconds((value) => {
          const nextValue = value + 1;
          if (nextValue % 10 === 0) {
            setActivityStatus(sessionId, 'active', nextValue);
          }
          return nextValue;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [paused, sessionId, setActivityStatus]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');

  return (
    <Page>
      <PageHeading
        eyebrow={paused ? 'Activity paused' : 'Activity in progress'}
        title="Frisbee"
        highlight={paused ? 'PAUSED' : 'LIVE'}
        description="Move normally. AfterMotion is collecting demo load data without interrupting your session."
      />
      <Card variant="data">
        <StatusTag label={paused ? 'Paused' : 'Recording'} tone={paused ? 'warning' : 'active'} />
        <MetricValue inverse>{minutes}:{remainder}</MetricValue>
        <MetricTile label="Motion Sleeve" value={paused ? 'Paused' : 'Live'} highlighted />
        <Row label="Samples collected" value={`${seconds * 50}`} icon="pulse-outline" inverse />
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
            setActivityStatus(sessionId, nextPaused ? 'paused' : 'active', seconds);
          }}
          variant="secondary"
          style={wireframeStyles.actionButton}
        />
        <Button
          label="Finish activity"
          icon="stop-outline"
          onPress={() => {
            finishActivity(sessionId, seconds);
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
