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
import { MockActivityDataSource } from '@/data/mock-activity-source';
import {
  finishActivityRecord,
  getActivityElapsedSeconds,
  pauseActivityRecord,
  startActivityRecord,
} from '@/domain/activity-transitions';
import {
  getActivitySignalProcessor,
  releaseActivitySignalProcessor,
} from '@/domain/activity-processing';
import type { ActivityRecord } from '@/domain/models';
import { useSessionStore } from '@/state/session-store';

const activityNames: Record<string, string> = {
  badminton: 'Badminton',
  frisbee: 'Frisbee',
  gym: 'Gym',
  other: 'Other',
  running: 'Running',
  tennis: 'Tennis',
};

const emptyActivity: ActivityRecord = {
  status: 'planned',
  elapsedSeconds: 0,
  sampleCount: 0,
  startedAt: null,
  endedAt: null,
  metrics: null,
};

export default function ActivityScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    finishActivity,
    hydrated,
    pauseActivity,
    saveActivitySampleCount,
    sessions,
    startActivity,
  } = useSessionStore();
  const session = sessions[sessionId];
  const initialActivity = session?.activity ?? emptyActivity;
  const initialSeconds = getActivityElapsedSeconds(initialActivity);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [activityStatus, setActivityStatus] = useState(initialActivity.status);
  const [sampleCount, setSampleCount] = useState(initialActivity.sampleCount);
  const [dataSource] = useState(() => new MockActivityDataSource());
  const [signalProcessor] = useState(() => getActivitySignalProcessor(sessionId));
  const activityRef = useRef(initialActivity);
  const sampleCountRef = useRef(initialActivity.sampleCount);
  const saveActivitySampleCountRef = useRef(saveActivitySampleCount);
  const initializedSessionIdRef = useRef(session?.id ?? null);
  const paused = activityStatus === 'paused';
  const sessionExists = Boolean(session);

  useEffect(() => {
    saveActivitySampleCountRef.current = saveActivitySampleCount;
  }, [saveActivitySampleCount]);

  useEffect(() => {
    if (!session || initializedSessionIdRef.current === session.id) return;
    const restoreTimer = setTimeout(() => {
      initializedSessionIdRef.current = session.id;
      activityRef.current = session.activity;
      setActivityStatus(session.activity.status);
      setSeconds(getActivityElapsedSeconds(session.activity));
      sampleCountRef.current = session.activity.sampleCount;
      setSampleCount(session.activity.sampleCount);
    }, 0);
    return () => clearTimeout(restoreTimer);
  }, [session]);

  useEffect(() => {
    if (activityStatus !== 'active') return;
    const timer = setInterval(() => {
      setSeconds(getActivityElapsedSeconds(activityRef.current));
    }, 250);
    return () => clearInterval(timer);
  }, [activityStatus]);

  useEffect(() => {
    if (!sessionExists || activityStatus !== 'active') return;
    let cancelled = false;

    async function beginSampling() {
      try {
        await dataSource.connect();
        if (cancelled) {
          await dataSource.disconnect();
          return;
        }
        await dataSource.start((sample) => {
          signalProcessor.addSample(sample);
          sampleCountRef.current += 1;
          const nextSampleCount = sampleCountRef.current;
          setSampleCount(nextSampleCount);
          if (nextSampleCount % 50 === 0) {
            saveActivitySampleCountRef.current(sessionId, nextSampleCount);
          }
        });
      } catch (error) {
        console.warn('Unable to start activity sampling.', error);
      }
    }

    void beginSampling();
    return () => {
      cancelled = true;
      saveActivitySampleCountRef.current(sessionId, sampleCountRef.current);
      void dataSource.disconnect();
    };
  }, [activityStatus, dataSource, sessionExists, sessionId, signalProcessor]);

  if (!session) {
    return (
      <Page>
        <PageHeading
          eyebrow="Activity"
          title={hydrated ? 'Session not found' : 'Restoring activity'}
          description={
            hydrated
              ? 'This activity is no longer stored on this device.'
              : 'Loading your locally saved activity state.'
          }
        />
        {hydrated ? <Button label="Return to Training" onPress={() => router.dismissTo('/')} /> : null}
      </Page>
    );
  }

  if (activityStatus === 'planned') {
    return (
      <Page>
        <PageHeading
          eyebrow="Activity not started"
          title={activityNames[session.activityType]}
          description="Complete Motion Sleeve setup before starting this activity."
        />
        <Button
          label="Open activity setup"
          icon="shirt-outline"
          onPress={() =>
            router.replace({
              pathname: '/session/[sessionId]/sleeve-setup',
              params: { sessionId },
            })
          }
        />
      </Page>
    );
  }

  if (activityStatus === 'complete') {
    return (
      <Page>
        <PageHeading
          eyebrow="Activity complete"
          title={activityNames[session.activityType]}
          description="This activity has already ended and cannot resume sampling."
        />
        <Button
          label="View activity summary"
          icon="analytics-outline"
          onPress={() =>
            router.replace({
              pathname: '/session/[sessionId]/activity-summary',
              params: { sessionId },
            })
          }
        />
      </Page>
    );
  }

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
          value={String(sampleCount)}
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
            const nowIso = new Date().toISOString();
            const nextActivity = paused
              ? startActivityRecord(activityRef.current, nowIso)
              : pauseActivityRecord(activityRef.current, nowIso);
            activityRef.current = nextActivity;
            setActivityStatus(nextActivity.status);
            setSeconds(getActivityElapsedSeconds(nextActivity));
            saveActivitySampleCount(sessionId, sampleCountRef.current);
            if (paused) startActivity(sessionId, nowIso);
            else pauseActivity(sessionId, nowIso);
          }}
          variant="secondary"
          style={wireframeStyles.actionButton}
        />
        <Button
          label="Finish activity"
          icon="stop-outline"
          onPress={() => {
            const nowIso = new Date().toISOString();
            const completedActivity = finishActivityRecord(activityRef.current, nowIso);
            activityRef.current = completedActivity;
            setActivityStatus('complete');
            setSeconds(completedActivity.elapsedSeconds);
            const features = signalProcessor.getFeatures();
            finishActivity(
              sessionId,
              { ...features, sampleCount: sampleCountRef.current },
              nowIso,
            );
            releaseActivitySignalProcessor(sessionId);
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
