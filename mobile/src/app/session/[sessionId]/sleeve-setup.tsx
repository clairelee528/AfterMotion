import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityIcon, AppIcon, type AppIconName } from '@/components/icons';
import { Button, Page, PageHeading } from '@/components/ui';
import { isBaselineComplete, isActivityInProgress } from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';

type Mode = 'demo' | 'manual' | 'bluetooth';
const modes: { key: Mode; label: string; detail: string; icon: AppIconName }[] = [
  { key: 'demo', label: 'Demo', detail: 'Simulated activity', icon: 'bar-chart-outline' },
  { key: 'manual', label: 'Manual', detail: 'Activity data still simulated', icon: 'hand-left-outline' },
  { key: 'bluetooth', label: 'Bluetooth', detail: 'Not connected', icon: 'bluetooth-outline' },
];
const names = { frisbee: 'Frisbee', badminton: 'Badminton', gym: 'Gym', other: 'Other', running: 'Running', tennis: 'Tennis' };

export default function SleeveSetupScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { startActivity, sessions, hydrated } = useSessionStore();
  const [mode, setMode] = useState<Mode>('demo');
  const session = sessions[sessionId];
  const overview = () => router.replace({ pathname: '/session/[sessionId]', params: { sessionId } });

  if (!session) return <Page>
    <PageHeading title={hydrated ? 'Session not found' : 'Restoring session'} />
    <Button label="Back to Training" onPress={() => router.dismissTo('/')} />
  </Page>;

  const baselineComplete = isBaselineComplete(session);
  const closed = !!session.closedAt || session.endedEarly;
  const finished = session.activity.status === 'complete';
  const inProgress = isActivityInProgress(session);
  const canStart = baselineComplete && !closed && !finished && mode !== 'bluetooth';

  return <Page>
    <View style={styles.content}>
      <Text style={styles.title}>Get ready,{ '\n' }step by step.</Text>
      <View style={styles.badge}>
        <ActivityIcon activity={session.activityType} size={19} color="#096170" />
        <Text style={styles.badgeText}>{names[session.activityType]}</Text>
      </View>

      <View style={styles.hero}>
        <Image source={require('../../../../assets/images/sleeve-setup.jpg')} style={styles.art} resizeMode="cover" accessible={false} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>ACTIVITY SETUP</Text>
          <View style={styles.check}>
            <AppIcon name={baselineComplete ? 'checkmark' : 'ellipse-outline'} size={17} color="#064653" />
          </View>
          <Text style={styles.heroTitle}>{baselineComplete ? 'Baseline\ncomplete.' : 'Baseline\nneeded.'}</Text>
        </View>
      </View>

      <View style={styles.options} accessibilityRole="radiogroup">
        {modes.map((item) => {
          const selected = mode === item.key;
          return <Pressable key={item.key} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${item.label}. ${item.detail}`} onPress={() => setMode(item.key)} style={({ pressed }) => [styles.option, selected && styles.selectedOption, pressed && styles.pressed]}>
            <View style={[styles.radio, selected && styles.selectedRadio]}>{selected ? <View style={styles.radioDot} /> : null}</View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{item.label}</Text>
              <Text style={styles.optionDetail}>{item.detail}</Text>
            </View>
            <AppIcon name={item.icon} size={24} color="#195863" />
          </Pressable>;
        })}
      </View>

      <Text accessibilityLiveRegion="polite" style={styles.note}>
        {closed || finished ? 'Activity finished · Return to your session' : !baselineComplete ? 'Complete your baseline before starting' : mode === 'bluetooth' ? 'Bluetooth unavailable · Choose Demo or Manual' : 'Simulated data · No device required'}
      </Text>
      <View style={styles.actions}>
        <Button label={inProgress ? 'Return to activity' : 'Start activity'} icon="arrow-forward" variant="highlight" disabled={!canStart} onPress={() => {
          if (!canStart) return;
          if (!inProgress) startActivity(sessionId);
          router.push({ pathname: '/session/[sessionId]/activity', params: { sessionId } });
        }} />
        <Button label="Back to session" variant="text" onPress={overview} />
      </View>
    </View>
  </Page>;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 16 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, color: '#102F36' },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 30, backgroundColor: '#D5EDF1' },
  badgeText: { color: '#15535D', fontSize: 14, fontWeight: '600' },
  hero: { minHeight: 188, borderRadius: 23, overflow: 'hidden', backgroundColor: '#064653', justifyContent: 'center' },
  art: { position: 'absolute', width: '100%', height: '100%' },
  heroCopy: { width: '55%', paddingHorizontal: 20, paddingVertical: 22, gap: 9 },
  eyebrow: { fontSize: 9, lineHeight: 14, letterSpacing: 1.4, color: '#C5E2E8', fontWeight: '600' },
  check: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4FF38' },
  heroTitle: { fontSize: 25, lineHeight: 30, fontWeight: '600', color: '#FFFFFF' },
  options: { gap: 10 },
  option: { minHeight: 76, borderRadius: 19, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 13, borderWidth: 1.5, borderColor: '#FFFFFF' },
  selectedOption: { borderColor: '#B9D954' },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: '#8CA7AE', alignItems: 'center', justifyContent: 'center' },
  selectedRadio: { borderColor: '#E4FF38', backgroundColor: '#E4FF38' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#064653' },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: '#123B44' },
  optionDetail: { fontSize: 12, lineHeight: 17, color: '#617F87' },
  note: { fontSize: 12, lineHeight: 18, textAlign: 'center', color: '#617F87' },
  actions: { gap: 3 },
  pressed: { opacity: 0.7 },
});
