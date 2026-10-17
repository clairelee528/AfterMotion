import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/icons';
import { ActivityTimelineCard } from '@/components/activity-timeline-card';
import { SessionTrendChart, kneeColors } from '@/components/session-trend-chart';
import { Button, Page, PageHeading, Row } from '@/components/ui';
import { recoveryCheckpoints } from '@/domain/models';
import { getCompletedRecoveryCount } from '@/domain/session-selectors';
import { getCircumferenceResponseSeries, getTemperatureDeltaSeries } from '@/domain/recovery-metrics';
import { useSessionStore } from '@/state/session-store';
import { colors } from '@/theme/tokens';

export default function SessionSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions } = useSessionStore();
  const [expanded, setExpanded] = useState(false);
  const session = sessions[sessionId];
  if (!session) return <Page><PageHeading title="Session not found" /><Button label="Return to Training" onPress={() => router.dismissTo('/')} /></Page>;
  const checks = getCompletedRecoveryCount(session);
  const seconds = Math.max(0, Math.floor(session.activity.elapsedSeconds));
  const duration = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const records = [session.baseline, ...recoveryCheckpoints.map((c) => session.recovery[c])];
  const sources = new Set(records.flatMap((r) => [r?.left?.source, r?.right?.source]).filter(Boolean));
  const source = sources.size > 1 ? 'Mixed data' : sources.has('mock') ? 'Demo data' : sources.has('manual') ? 'Manual data' : sources.has('bluetooth') ? 'Sensor data' : 'No readings';
  const metrics = session.activity.metrics;
  const activity = session.activityType === 'gym' ? 'Gym' : session.activityType.charAt(0).toUpperCase() + session.activityType.slice(1);
  return <Page>
    <View style={{ gap: 4 }}><Text style={styles.title}>{activity}</Text><Text style={styles.subtitle}>{new Date(session.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{session.endedEarly ? ' · Ended early' : ''}</Text></View>
    <View style={styles.summary}>
      <View style={styles.statusIcon}><AppIcon name={session.status === 'complete' ? 'checkmark' : 'time-outline'} color={kneeColors[0]} size={23} /></View>
      <View style={styles.stat}><Text style={styles.statLabel}>Duration</Text><Text style={styles.statValue}>{duration}</Text></View>
      <View style={styles.stat}><Text style={styles.statLabel}>Checks</Text><Text style={styles.statValue}>{checks}<Text style={{ fontSize: 20 }}> / 5</Text></Text></View>
    </View>
    <View style={styles.legend}>{['Left knee', 'Right knee'].map((label, i) => <View key={label} style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: kneeColors[i] }]}><View style={{ width: 10, height: 10, backgroundColor: kneeColors[i], borderRadius: i === 0 ? 5 : 1 }} /></View><Text style={styles.subtitle}>{label}</Text></View>)}</View>
    <ActivityTimelineCard activity={session.activity} />
    {(['temperature', 'band'] as const).map((kind) => <View key={kind} style={styles.card}>
      <View style={styles.chartHeading}><AppIcon name={kind === 'temperature' ? 'thermometer-outline' : 'resize-outline'} size={24} color={kneeColors[0]} /><View style={{ flex: 1, gap: 3 }}><Text style={styles.chartTitle}>{kind === 'temperature' ? 'Temperature change' : 'Swelling-related response'}</Text><Text style={styles.caption}>{kind === 'temperature' ? '°C from baseline' : 'Band stretch change (%)'}</Text></View></View>
      <Text style={styles.source}>{source}</Text>
      <SessionTrendChart left={kind === 'temperature' ? getTemperatureDeltaSeries(session, 'left') : getCircumferenceResponseSeries(session, 'left')} right={kind === 'temperature' ? getTemperatureDeltaSeries(session, 'right') : getCircumferenceResponseSeries(session, 'right')} unit={kind === 'temperature' ? '°C' : '%'} />
    </View>)}
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.toggle}><Text style={styles.chartTitle}>Session details</Text><AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={kneeColors[0]} size={22} /></Pressable>
      {expanded && <View style={{ gap: 12, paddingTop: 8 }}>
        <Text style={styles.caption}>Each knee uses its own pre-activity reading as baseline. Band response shows stretch change, not a direct swelling measurement.</Text>
        <Row label="Activity load" value={metrics ? `${metrics.loadIndex} · ${metrics.loadLevel}` : '—'} />
        <Row label="Movement intensity" value={metrics ? `${metrics.movementIntensity} / 10` : '—'} />
        <Row label="Acceleration peaks" value={metrics ? String(metrics.accelerationPeakCount) : '—'} />
        <Row label="Sharp decelerations" value={metrics ? String(metrics.decelerationEventCount) : '—'} />
        <Row label="Impact-like events" value={metrics ? String(metrics.impactLikeEventCount) : '—'} />
        {records.map((record, i) => <View key={i} style={styles.checkpoint}>
          <Text style={styles.checkpointTitle}>{i === 0 ? 'Before activity' : i === 1 ? 'Post activity' : `${recoveryCheckpoints[i - 1]} min after`}</Text>
          {(['left', 'right'] as const).map((side) => { const r = record?.[side]; return <Text key={side} style={styles.caption}>{side === 'left' ? 'Left' : 'Right'}: {r ? `${r.temperatureCelsius.toFixed(1)}°C · Band ${r.stretchValue.toFixed(2)} · ${new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not measured'}</Text>; })}
          <Text style={styles.caption}>{record?.symptomsRecordedAt ? `Pain ${record.symptoms.pain}/10 · Stiffness ${record.symptoms.stiffness}/10\nReported swelling: ${record.symptoms.swelling}` : 'Feelings not recorded'}</Text>
        </View>)}
      </View>}
    </View>
  </Page>;
}

const styles = StyleSheet.create({
  title: { fontSize: 27, fontWeight: '700', color: kneeColors[0] },
  subtitle: { fontSize: 15, color: '#56727C' },
  summary: { backgroundColor: kneeColors[0], borderRadius: 18, paddingHorizontal: 18, paddingVertical: 23, minHeight: 108, flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, borderLeftWidth: 1, borderLeftColor: '#598590', paddingLeft: 16, gap: 6 },
  statLabel: { color: '#C7E2E9', fontSize: 16 },
  statValue: { color: 'white', fontSize: 27, fontWeight: '700', fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  legendLine: { width: 30, height: 2, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, gap: 8 },
  chartHeading: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chartTitle: { fontSize: 18, fontWeight: '700', color: kneeColors[0], flexShrink: 1 },
  caption: { fontSize: 13, lineHeight: 19, color: '#56727C' },
  source: { color: '#718489', fontSize: 11, textAlign: 'right' },
  toggle: { minHeight: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkpoint: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 5 },
  checkpointTitle: { color: kneeColors[0], fontSize: 15, fontWeight: '600' },
});
