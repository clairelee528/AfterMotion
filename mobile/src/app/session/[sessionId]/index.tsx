import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/icons';
import { Button, Card, Notice, Page, PageHeading, SectionTitle } from '@/components/ui';
import { recoveryCheckpoints, type CheckpointRecord } from '@/domain/models';
import { getCheckpointStatus, getNextMissingSide, getSessionStage, isActivityInProgress, isBaselineComplete, isSessionComplete, areAllRecoveryCheckpointsComplete } from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';

const teal = '#064653';
const lime = '#E4FF38';
type State = 'complete' | 'current' | 'pending';
const activityNames: Record<string, string> = { badminton: 'Badminton', frisbee: 'Frisbee', gym: 'Gym', other: 'Other', running: 'Running', tennis: 'Tennis' };

function Marker({ state, small = false }: { state: State; small?: boolean }) {
  return <View style={[styles.marker, small && styles.smallMarker, state === 'complete' && styles.completeMarker, state === 'current' && styles.currentMarker]}>
    {state === 'complete' ? <AppIcon name="checkmark" size={small ? 11 : 14} color="#FFFFFF" /> : state === 'current' ? <View style={styles.dot} /> : null}
  </View>;
}

function Stage({ title, state, last, children }: { title: string; state: State; last?: boolean; children: ReactNode }) {
  return <View style={styles.stage}>
    <View style={styles.rail}>
      <Marker state={state} small />
      {!last ? <View style={[styles.line, state === 'complete' && styles.completeLine]} /> : null}
    </View>
    <View style={styles.stageBody}>
      <Text style={styles.stageTitle}>{title}</Text>
      {children}
    </View>
  </View>;
}

function CheckRow({ title, status, state, disabled, onPress, detail }: { title: string; status: string; state: State; disabled?: boolean; onPress: () => void; detail?: string }) {
  const current = state === 'current';
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${status}${detail ? `. ${detail}` : ''}`} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.checkRow, current && styles.currentRow, pressed && styles.pressed]}>
    <Marker state={state} />
    <View style={styles.rowText}>
      <Text style={[styles.rowTitle, current && styles.white]}>{title}</Text>
      <Text style={[styles.status, current && styles.lime]}>{status}</Text>
      {detail ? <Text style={[styles.detail, current && styles.light]}>{detail}</Text> : null}
    </View>
    <AppIcon name={disabled ? 'lock-closed-outline' : 'chevron-forward'} size={17} color={current ? '#FFFFFF' : '#6E9298'} />
  </Pressable>;
}

function progressDetail(record: CheckpointRecord | undefined) {
  if (getCheckpointStatus(record) === 'needsCheckIn') return 'Both knees recorded · Add your feelings';
  if (record?.left || record?.right) return `Left: ${record.left ? 'done' : 'next'} · Right: ${record.right ? 'done' : 'next'}`;
  return 'Measure left knee, then right knee';
}

export default function SessionOverviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { endSession, hydrated, sessions } = useSessionStore();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const session = sessions[sessionId];

  if (!session) return <Page><PageHeading title={hydrated ? 'Session not found' : 'Restoring session'} /><Button label="Return to Training" onPress={() => router.dismissTo('/')} /></Page>;

  const stage = getSessionStage(session);
  const closed = stage === 'complete' || stage === 'endedEarly';
  const baselineComplete = isBaselineComplete(session);
  const activityComplete = session.activity.status === 'complete';
  const activityInProgress = isActivityInProgress(session);
  const recoveryComplete = areAllRecoveryCheckpointsComplete(session);
  const complete = isSessionComplete(session);
  const nextCheckpoint = recoveryCheckpoints.find((key) => getCheckpointStatus(session.recovery[key]) !== 'complete');
  const baselineState: State = baselineComplete ? 'complete' : !closed ? 'current' : 'pending';
  const activityState: State = activityComplete ? 'complete' : baselineComplete && !closed ? 'current' : 'pending';
  const recoveryState: State = recoveryComplete ? 'complete' : activityComplete && !closed ? 'current' : 'pending';

  function openCheck(checkpoint: string) {
    const record = checkpoint === 'baseline' ? session.baseline : session.recovery[checkpoint];
    const status = getCheckpointStatus(record);
    if (status === 'complete') {
      router.push({ pathname: '/session/[sessionId]/checkpoint', params: { sessionId, checkpoint } });
    } else if (status === 'needsCheckIn') {
      router.push({ pathname: '/session/[sessionId]/feelings', params: { sessionId, checkpoint, returnTo: 'checkpoint' } });
    } else {
      router.push({ pathname: '/session/[sessionId]/measurement', params: { sessionId, checkpoint, phase: checkpoint === 'baseline' ? 'baseline' : 'recovery', side: getNextMissingSide(record) ?? 'left' } });
    }
  }

  function openActivity() {
    router.push({ pathname: activityComplete ? '/session/[sessionId]/activity-summary' : activityInProgress ? '/session/[sessionId]/activity' : '/session/[sessionId]/sleeve-setup', params: { sessionId } });
  }

  const primaryLabel = closed ? 'View session summary' : !baselineComplete ? 'Continue baseline' : !activityComplete ? activityInProgress ? 'Return to activity' : 'Set up activity' : nextCheckpoint ? nextCheckpoint === '0' ? 'Continue post-activity check' : `Continue ${nextCheckpoint} min check` : 'Complete session';
  function continueSession() {
    if (closed) router.push({ pathname: '/session/[sessionId]/summary', params: { sessionId } });
    else if (!baselineComplete) openCheck('baseline');
    else if (!activityComplete) openActivity();
    else if (nextCheckpoint) openCheck(nextCheckpoint);
    else setConfirmEnd(true);
  }

  const created = new Date(session.createdAt);
  const dateLabel = created.toDateString() === new Date().toDateString() ? 'Today' : created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return <Page>
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>{closed ? 'SESSION RECORD' : 'YOUR SESSION'}</Text>
        <Text style={styles.title}>{activityNames[session.activityType]} <Text style={styles.date}>· {dateLabel}</Text></Text>
        <Text style={styles.subtitle}>{closed ? stage === 'endedEarly' ? 'Ended early · Your saved checks are kept.' : 'Session complete · Explore your results.' : 'Your activity and recovery, step by step.'}</Text>
      </View>

      <View>
        <Stage title="Before activity" state={baselineState}>
          <CheckRow title="Baseline measurement" state={baselineState} status={baselineComplete ? 'Complete' : closed ? 'Incomplete' : getCheckpointStatus(session.baseline) === 'needsCheckIn' ? 'Check-in needed' : 'In progress'} detail={baselineState === 'current' ? progressDetail(session.baseline) : undefined} disabled={closed && !baselineComplete} onPress={() => openCheck('baseline')} />
        </Stage>
        <Stage title="Activity" state={activityState}>
          <CheckRow title="Activity recording" state={activityState} status={activityComplete ? `Complete · ${Math.floor(session.activity.elapsedSeconds / 60)} min` : session.activity.status === 'paused' ? 'Paused' : activityInProgress ? 'Recording' : activityState === 'current' ? 'Ready to start' : 'Not started'} detail={activityState === 'current' ? activityInProgress ? 'Return to your recording' : 'Set up your sleeve to begin' : undefined} disabled={!baselineComplete || (closed && !activityComplete)} onPress={openActivity} />
        </Stage>
        <Stage title="After activity" state={recoveryState} last>
          <View style={styles.checks}>
            {recoveryCheckpoints.map((checkpoint) => {
              const record = session.recovery[checkpoint];
              const status = getCheckpointStatus(record);
              const done = status === 'complete';
              const current = recoveryState === 'current' && checkpoint === nextCheckpoint;
              return <CheckRow key={checkpoint} title={checkpoint === '0' ? 'Post activity' : `${checkpoint} min after`} state={done ? 'complete' : current ? 'current' : 'pending'} status={done ? 'Complete' : status === 'needsCheckIn' ? 'Check-in needed' : status === 'partial' ? 'In progress' : current ? 'Up next' : 'Not started'} detail={current ? progressDetail(record) : undefined} disabled={!activityComplete || (closed && !done)} onPress={() => openCheck(checkpoint)} />;
            })}
          </View>
        </Stage>
      </View>

      <View style={styles.actions}>
        <Button label={primaryLabel} variant="highlight" onPress={continueSession} />
        {!closed && !complete && !confirmEnd ? <Button label="End session early" variant="secondary" onPress={() => setConfirmEnd(true)} /> : null}
      </View>
      {confirmEnd ? <Card>
        <SectionTitle>{complete ? 'Complete this session?' : 'End this session early?'}</SectionTitle>
        <Notice title="Your recorded data will be kept" body="Measurements already saved on this device will not be deleted." tone="warning" />
        <Button label={complete ? 'Complete session' : 'End session early'} onPress={() => { endSession(sessionId, !complete); router.dismissTo('/'); }} />
        <Button label="Keep session open" onPress={() => setConfirmEnd(false)} variant="secondary" />
      </Card> : null}
    </View>
  </Page>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 24 },
  heading: { gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: '#397980' },
  title: { fontSize: 27, lineHeight: 34, fontWeight: '800', color: '#102C31' },
  date: { fontWeight: '400', color: '#5B7479' },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#58767C' },
  stage: { flexDirection: 'row', gap: 12 },
  rail: { width: 20, alignItems: 'center', paddingTop: 4 },
  line: { width: 1.5, flex: 1, backgroundColor: '#C0D6DA', marginTop: 5, marginBottom: 5 },
  completeLine: { backgroundColor: '#6C9BA2' },
  stageBody: { flex: 1, minWidth: 0, paddingBottom: 22, gap: 10 },
  stageTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: '#15383E' },
  marker: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#A2BCC2', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF5F6' },
  smallMarker: { width: 18, height: 18, borderRadius: 9 },
  completeMarker: { backgroundColor: teal, borderColor: teal },
  currentMarker: { backgroundColor: lime, borderColor: lime },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: teal },
  checks: { gap: 5, backgroundColor: '#F8FCFD', borderRadius: 20, padding: 5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FCFD', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 15, minHeight: 72 },
  currentRow: { backgroundColor: teal },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#15383E' },
  status: { fontSize: 12, lineHeight: 17, color: '#58747A' },
  detail: { fontSize: 12, lineHeight: 18, color: '#58747A', marginTop: 3 },
  white: { color: '#FFFFFF' },
  lime: { color: lime, fontWeight: '600' },
  light: { color: '#D0E7EB' },
  pressed: { opacity: 0.75 },
  actions: { gap: 10 },
});
