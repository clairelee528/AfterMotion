import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIcon, AppIcon, type AppIconName } from '@/components/icons';
import { Button } from '@/components/ui';
import { getCompletedRecoveryCount, getLatestClosedSession, getSessionStage, type SessionStage } from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';
import { colors } from '@/theme/tokens';

const stages: Record<SessionStage, { title: string; detail: string; status: string; step: number }> = {
  baseline: { title: 'Continue your session', detail: 'Next: Baseline measurement', status: 'Session in progress', step: 0 },
  readyForActivity: { title: 'Ready to move?', detail: 'Baseline complete. Start your activity.', status: 'Ready for activity', step: 1 },
  activityActive: { title: 'Keep moving.', detail: 'Your activity is being recorded.', status: 'Activity in progress', step: 1 },
  activityPaused: { title: 'Take your time.', detail: 'Recording is paused. Continue when ready.', status: 'Activity paused', step: 1 },
  recovery: { title: 'Time to check in.', detail: 'Continue your post-activity checks.', status: 'Recovery in progress', step: 2 },
  readyToComplete: { title: 'All checks complete.', detail: 'Finish your session and review your results.', status: 'Ready to finish', step: 3 },
  complete: { title: 'Session complete.', detail: 'Explore your activity and recovery.', status: 'Complete', step: 3 },
  endedEarly: { title: 'Your session recap.', detail: 'Review the measurements you saved.', status: 'Ended early', step: -1 },
};
const steps: { label: string; hint: string; icon: AppIconName }[] = [
  { label: 'Baseline', hint: 'Check in', icon: 'body-outline' },
  { label: 'Activity', hint: 'Get moving', icon: 'walk-outline' },
  { label: 'Recovery', hint: 'Check in again', icon: 'time-outline' },
];
function SessionSteps({ current = -1, inverse = false }: { current?: number; inverse?: boolean }) {
  return <View style={styles.steps}>{steps.map((step, index) => {
    const complete = current > index;
    const active = current === index;
    const hint = current < 0 ? step.hint : complete ? 'Done' : active ? 'Current' : 'Next';
    return <View key={step.label} style={styles.step} accessible accessibilityLabel={`${step.label}: ${hint}`}>
      {index < 2 && <View style={[styles.connector, complete && { backgroundColor: colors.highlight }]} />}
      <View style={[styles.stepIcon, inverse && styles.darkIcon, (complete || active) && styles.activeIcon]}>
        <AppIcon name={complete ? 'checkmark' : step.icon} size={24} color={complete || active || !inverse ? '#043F4B' : '#A9CFD6'} />
      </View>
      <Text style={[styles.stepLabel, inverse && styles.white]}>{step.label}</Text>
      <Text style={[styles.hint, inverse && styles.light]}>{hint}</Text>
    </View>;
  })}</View>;
}
export default function TrainingScreen() {
  const { currentSession, hydrated, sessions, endSession } = useSessionStore();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(0, Math.min(width - 40, 560));
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  const continuousArtwork = currentSession?.activityType === 'frisbee';
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));
  const recent = getLatestClosedSession(sessions);
  const stage = currentSession ? getSessionStage(currentSession) : null;
  const content = stage ? stages[stage] : null;
  const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  const source = currentSession?.measurementSource;
  const sourceLabel = source === 'mock' ? 'Demo data' : source === 'manual' ? 'Manual entry' : source ? 'Bluetooth selected' : null;
  const continueSession = () => {
    if (!currentSession) return;
    if (stage === 'activityActive' || stage === 'activityPaused') router.push(`/session/${currentSession.id}/activity`);
    else if (stage === 'complete' || stage === 'endedEarly') router.push(`/session/${currentSession.id}/summary`);
    else router.push(`/session/${currentSession.id}`);
  };
  const startNew = () => {
    if (!currentSession) { router.push('/session/new'); return; }
    Alert.alert('Start a new session?', 'Your current session will end and its saved data will remain in History. You can then set up a new session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open current session', onPress: () => router.push(`/session/${currentSession.id}`) },
      { text: 'End current & start new', onPress: () => {
        endSession(currentSession.id, stage !== 'readyToComplete' && stage !== 'complete');
        router.push('/session/new');
      } },
    ]);
  };
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.page}>
    <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="never" contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
    <View style={styles.brandRow}><Text style={styles.brand}>AfterMotion</Text>{hydrated && sourceLabel && <View style={styles.badge}><Text style={styles.badgeText}>{sourceLabel}</Text></View>}</View>
    <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{!hydrated ? 'Welcome back.' : content?.title ?? 'Ready to move?'}</Text><Text style={styles.subtitle}>{content ? 'Your activity. Your recovery. One session.' : 'Track your activity and recovery.'}</Text></View>
    {!hydrated ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.subtitle}>Loading your session…</Text></View> : <>
      <View style={styles.hero} onLayout={({ nativeEvent: { layout } }) => {
        setHeroSize(previous => previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height });
      }}>
        {continuousArtwork && <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image accessible={false} source={require('../../../assets/images/training-session-background.jpg')} resizeMode="stretch" style={{ width: heroSize.width, height: heroSize.height }} /></View>}
        {content && <View style={styles.statusRow}><View style={[styles.dot, stage === 'activityPaused' && { backgroundColor: '#FFD28C' }]} /><Text style={styles.status}>{content.status}</Text></View>}
        {continuousArtwork ? <View style={{ height: Math.min(imageWidth * 0.52, 220) }} /> : !currentSession ? <View style={{ width: imageWidth, height: imageWidth / 1.5, alignSelf: 'center', overflow: 'hidden' }}><Image accessible={false} source={require('../../../assets/images/training-frisbee.jpg')} style={{ width: imageWidth, height: imageWidth / 1.5 }} resizeMode="contain" /></View> : <View style={styles.activityArt}><ActivityIcon activity={currentSession.activityType} size={100} color={colors.highlight} /></View>}
        <View style={styles.heroContent}>
          {currentSession && content && <><Text style={styles.activityTitle}>{label(currentSession.activityType)}</Text><Text style={styles.detail}>{content.detail}</Text>{stage === 'recovery' && <Text style={styles.detail}>{getCompletedRecoveryCount(currentSession)} of 5 recovery checks complete</Text>}<SessionSteps current={content.step} inverse /></>}
          <Button label={currentSession ? stage === 'readyToComplete' ? 'Finish session' : stage === 'complete' || stage === 'endedEarly' ? 'View summary' : 'Continue session' : 'Start new session'} variant="highlight" onPress={currentSession ? continueSession : startNew} style={styles.primary} />
        </View>
      </View>
      {currentSession ? <Button label="Start new session" variant="secondary" onPress={startNew} style={styles.secondary} /> : <SessionSteps />}
      {recent && <Pressable accessibilityRole="button" accessibilityLabel="View recent session summary" onPress={() => router.push(`/session/${recent.id}/summary`)} style={({ pressed }) => [styles.recent, pressed && { opacity: 0.7 }]}>
        <View style={styles.brandRow}><Text style={styles.recentTitle}>Recent session</Text><AppIcon name="chevron-forward" size={18} /></View>
        <View style={styles.recentBody}><View style={styles.recentIcon}><ActivityIcon activity={recent.activityType} size={26} color="#043F4B" /></View><View style={styles.recentInfo}><Text style={styles.recentActivity}>{label(recent.activityType)}</Text><Text style={styles.hint}>{recent.endedEarly ? 'Ended early' : 'Complete'}{recent.measurementSource === 'mock' ? ' · Demo data' : ''}</Text></View><Text style={styles.summaryLink}>View summary</Text></View>
      </Pressable>}
    </>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { padding: 20, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 600, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { fontSize: 17, fontWeight: '800', color: '#043F4B' },
  badge: { backgroundColor: '#F0FFA0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#17383F' },
  heading: { gap: 8, paddingTop: 8 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1, color: '#09191E' },
  subtitle: { fontSize: 16, lineHeight: 23, color: '#375C67' },
  hero: { backgroundColor: '#043F4B', borderRadius: 26, overflow: 'hidden' },
  heroContent: { paddingHorizontal: 18, paddingBottom: 18, gap: 10 },
  statusRow: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 18, paddingBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.highlight },
  status: { fontSize: 13, fontWeight: '700', color: colors.highlight, flexShrink: 1 },
  activityTitle: { fontSize: 27, fontWeight: '800', color: '#FFFFFF' },
  detail: { color: '#D6EDF1', fontSize: 14, lineHeight: 21 },
  steps: { flexDirection: 'row', paddingVertical: 12 },
  step: { flex: 1, alignItems: 'center', gap: 5 },
  stepIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1EDF7' },
  darkIcon: { backgroundColor: '#165865', borderWidth: 1, borderColor: '#80AAB3' },
  activeIcon: { backgroundColor: colors.highlight, borderColor: colors.highlight },
  connector: { position: 'absolute', top: 22, left: '75%', width: '50%', height: 1, backgroundColor: '#85AAB4' },
  stepLabel: { fontSize: 12, fontWeight: '700', color: '#143E49', textAlign: 'center' },
  hint: { fontSize: 11, lineHeight: 17, color: '#526E77' },
  white: { color: '#FFFFFF' },
  light: { color: '#B0D1D8' },
  primary: { borderRadius: 28 },
  secondary: { backgroundColor: 'transparent', borderColor: '#164958', borderWidth: 1.5, borderRadius: 28 },
  recent: { padding: 18, backgroundColor: '#FFFFFF', borderRadius: 24, gap: 14 },
  recentTitle: { fontSize: 15, fontWeight: '700', color: '#122D36' },
  recentBody: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  recentIcon: { backgroundColor: '#D9F0F8', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  recentInfo: { flex: 1, alignItems: 'flex-start', gap: 4, minWidth: 100 },
  recentActivity: { fontSize: 16, fontWeight: '700', color: '#17383F' },
  summaryLink: { fontSize: 12, color: '#456772' },
  loading: { padding: 40, gap: 16, alignItems: 'center' },
  activityArt: { height: 190, alignItems: 'center', justifyContent: 'center' },
});
