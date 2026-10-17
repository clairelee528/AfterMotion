import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ActivityIcon } from '@/components/icons';
import Svg, { Path } from 'react-native-svg';

import {
  Button,
  Page,
  PageHeading,
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
  const { height, fontScale } = useWindowDimensions();
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
  const [dataSource] = useState(() => new MockActivityDataSource());
  const [signalProcessor] = useState(() => getActivitySignalProcessor(sessionId, initialActivity.timeline));
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
      signalProcessor.restoreTimeline(session.activity.timeline);
    }, 0);
    return () => clearTimeout(restoreTimer);
  }, [session, signalProcessor]);

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
          signalProcessor.addSample(sample, getActivityElapsedSeconds(activityRef.current, sample.timestampMs));
          sampleCountRef.current += 1;
          const nextSampleCount = sampleCountRef.current;
          if (nextSampleCount % 50 === 0) {
            saveActivitySampleCountRef.current(sessionId, nextSampleCount, signalProcessor.getTimeline(), dataSource.source);
          }
        });
      } catch (error) {
        console.warn('Unable to start activity sampling.', error);
      }
    }

    void beginSampling();
    return () => {
      cancelled = true;
      saveActivitySampleCountRef.current(sessionId, sampleCountRef.current, signalProcessor.getTimeline(), dataSource.source);
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
      <View style={styles.content}>
      <View style={styles.card}>
        <View style={[styles.artFrame, { width: Math.min(210, Math.max(150, height * 0.23)), height: Math.min(210, Math.max(150, height * 0.23)) }]}>
          {session.activityType === 'frisbee' ? (
            <Image source={require('../../../../assets/images/activity-frisbee-v2.png')} style={[styles.art, paused && styles.pausedArt]} resizeMode="contain" accessible={false} />
          ) : <ActivityIcon activity={session.activityType} size={100} color="#064653" />}
        </View>
        <Text style={styles.sport}>{activityNames[session.activityType]}</Text>
        <View style={styles.timerBlock}>
          <Text accessibilityLabel={`Elapsed time ${minutes} minutes ${remainder} seconds`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={styles.timer}>{minutes}:{remainder}</Text>
          <Text style={styles.elapsed}>Elapsed time</Text>
          <View accessibilityLiveRegion="polite" style={styles.status}>
            <View style={[styles.statusDot, paused && styles.pausedDot]} />
            <Text style={[styles.statusText, paused && styles.pausedText]}>{paused ? 'Paused' : 'Recording'}</Text>
          </View>
        </View>
      </View>
      <View pointerEvents="none" style={styles.waves}>
        <Svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" accessible={false}>
          <Path d="M-20 22 C60 -10 104 26 170 54 S300 108 420 34 L420 58 C308 125 237 101 168 76 S57 13 -20 48 Z" fill="#CEEAF2" fillOpacity={0.8} />
          <Path d="M-20 78 C66 109 132 90 205 54 S335 1 420 28 L420 48 C334 23 281 40 209 73 S65 130 -20 99 Z" fill="#DAEFF6" fillOpacity={0.85} />
        </Svg>
      </View>
      <View style={styles.demo}><Text style={styles.demoText}>Motion Sleeve · Demo mode</Text></View>
      <View style={[wireframeStyles.actionRow, styles.actions, fontScale > 1.3 && styles.stackedActions]}>
        <Button
          label={paused ? 'Resume' : 'Pause'}
          icon={paused ? 'play-outline' : 'pause-outline'}
          onPress={() => {
            const nowIso = new Date().toISOString();
            const nextActivity = paused
              ? startActivityRecord(activityRef.current, nowIso)
              : pauseActivityRecord(activityRef.current, nowIso);
            activityRef.current = nextActivity;
            setActivityStatus(nextActivity.status);
            setSeconds(getActivityElapsedSeconds(nextActivity));
            saveActivitySampleCount(sessionId, sampleCountRef.current, signalProcessor.getTimeline(), dataSource.source);
            if (paused) startActivity(sessionId, nowIso);
            else pauseActivity(sessionId, nowIso);
          }}
          variant="secondary"
          style={[wireframeStyles.actionButton, styles.actionButton, styles.pauseButton]}
        />
        <Button
          label="Finish activity"
          onPress={() => {
            const nowIso = new Date().toISOString();
            const completedActivity = finishActivityRecord(activityRef.current, nowIso);
            activityRef.current = completedActivity;
            setActivityStatus('complete');
            setSeconds(completedActivity.elapsedSeconds);
            const features = signalProcessor.getFeatures();
            saveActivitySampleCount(sessionId, sampleCountRef.current, signalProcessor.getTimeline(), dataSource.source);
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
          style={[wireframeStyles.actionButton, styles.actionButton]}
        />
      </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 12 },
  demo: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F9FDFE' },
  demoText: { color: '#638894', fontSize: 12, fontWeight: '500' },
  card: { paddingTop: 18, alignItems: 'center' },
  sport: { fontSize: 27, lineHeight: 34, color: '#064653', fontWeight: '700', textAlign: 'center', paddingHorizontal: 20, marginTop: 20 },
  artFrame: { alignSelf: 'center', borderRadius: 120, backgroundColor: '#D9F0F6', alignItems: 'center', justifyContent: 'center' },
  art: { width: '82%', height: '82%' },
  pausedArt: { opacity: 0.55 },
  waves: { height: 82, overflow: 'hidden', marginHorizontal: -24, marginTop: 0 },
  timerBlock: { alignItems: 'center', paddingHorizontal: 12, marginTop: 16, width: '100%' },
  timer: { fontSize: 72, lineHeight: 88, fontWeight: '700', color: '#064653', fontVariant: ['tabular-nums'], letterSpacing: -1.5, width: '100%', textAlign: 'center' },
  elapsed: { fontSize: 14, lineHeight: 20, color: '#789AA5' },
  status: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 18 },
  statusDot: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#E4FF38' },
  statusText: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: '#064653' },
  pausedDot: { backgroundColor: '#F6CB83' },
  pausedText: { color: '#926524' },
  actions: { marginTop: 6 },
  stackedActions: { flexDirection: 'column' },
  actionButton: { borderRadius: 32, minHeight: 54 },
  pauseButton: { backgroundColor: 'transparent', borderColor: '#064653', borderWidth: 1.5 },
});
