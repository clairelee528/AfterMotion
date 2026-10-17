import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { AppIcon } from './icons';
import type { ActivityRecord } from '@/domain/models';

const teal = '#064B5B';
export function ActivityTimelineCard({ activity }: { activity: ActivityRecord }) {
  const [width, setWidth] = useState(0);
  const points = activity.timeline ?? [];
  const metrics = activity.metrics;
  const duration = Math.max(1, activity.elapsedSeconds, ...points.map((p) => p.elapsedSeconds));
  const x = (seconds: number) => 28 + seconds / duration * (width - 45);
  const y = (intensity: number) => 14 + (10 - intensity) * 12;
  // Keep missing sampling intervals visible instead of bridging them with a line.
  const segments: typeof points[] = [];
  points.forEach((point, i) => {
    if (i === 0 || point.elapsedSeconds - points[i - 1].elapsedSeconds > 5) segments.push([]);
    segments[segments.length - 1].push(point);
  });
  const timeLabel = (seconds: number) => duration < 60 ? `${Math.round(seconds)}s` : `${(seconds / 60).toFixed(duration < 300 ? 1 : 0)}m`;
  const hint = activity.source === 'bluetooth' ? 'Sensor data' : activity.source === 'manual' ? 'Manual data' : 'Demo data';
  return <View style={styles.card}>
    <View style={styles.header}>
      <AppIcon name="walk-outline" size={27} color={teal} />
      <View style={styles.heading}><Text style={styles.title}>Activity load</Text><Text style={styles.caption}>Movement intensity</Text></View>
      <View style={styles.score}><Text style={styles.value}>{metrics ? metrics.movementIntensity.toFixed(1) : '—'}<Text style={styles.denominator}>/10</Text></Text><Text style={styles.hint}>{hint}</Text></View>
    </View>
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityLabel={`Movement intensity over ${Math.round(duration)} seconds. ${points.length} recorded intervals.`}>
      {points.length && width > 45 ? <Svg width={width} height={164}>
        {[0, 5, 10].map((v) => <Line key={v} x1={28} x2={width - 17} y1={y(v)} y2={y(v)} stroke="#DEE9ED" />)}
        {[0, 5, 10].map((v) => <SvgText key={v} x={21} y={y(v) + 4} textAnchor="end" fill="#56727C" fontSize={11}>{v}</SvgText>)}
        {[0, .25, .5, .75, 1].map((f) => <SvgText key={f} x={x(duration * f)} y={156} textAnchor="middle" fill="#56727C" fontSize={10}>{timeLabel(duration * f)}</SvgText>)}
        {segments.map((segment, i) => {
          const line = segment.map((p, j) => `${j ? 'L' : 'M'}${x(p.elapsedSeconds)} ${y(p.intensity)}`).join(' ');
          return <Path key={`fill-${i}`} d={`${line} L${x(segment[segment.length - 1].elapsedSeconds)} ${y(0)} L${x(segment[0].elapsedSeconds)} ${y(0)} Z`} fill="#CCE6EA" />;
        })}
        {segments.map((segment, i) => <Path key={i} d={segment.map((p, j) => `${j ? 'L' : 'M'}${x(p.elapsedSeconds)} ${y(p.intensity)}`).join(' ')} stroke={teal} strokeWidth={2} fill="none" />)}
        {points.filter((p) => p.impactCount > 0 || points.length === 1).map((p) => <Circle key={p.elapsedSeconds} cx={x(p.elapsedSeconds)} cy={y(p.intensity)} r={3.5} fill={p.impactCount ? '#E7FF45' : teal} stroke={teal} strokeWidth={1} />)}
      </Svg> : <View style={styles.empty}><Text style={styles.caption}>Timeline not recorded for this session</Text></View>}
    </View>
    {points.length > 0 && <View style={styles.legend}><View style={styles.dot} /><Text style={styles.caption}>Impact-like event</Text></View>}
    <View style={styles.stats}>
      <View style={styles.metric}><Text style={styles.value}>{metrics?.accelerationPeakCount ?? '—'}</Text><Text style={styles.metricLabel}>Acceleration peaks</Text></View>
      <View style={[styles.metric, styles.divider]}><Text style={styles.value}>{metrics?.impactLikeEventCount ?? '—'}</Text><Text style={styles.metricLabel}>Impact-like events</Text></View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  heading: { flex: 1, minWidth: 125, gap: 3 },
  title: { fontSize: 18, fontWeight: '700', color: teal },
  caption: { fontSize: 12, color: '#56727C' },
  score: { alignItems: 'flex-end', gap: 3 },
  value: { fontSize: 25, fontWeight: '700', color: teal, fontVariant: ['tabular-nums'] },
  denominator: { fontSize: 16, fontWeight: '500' },
  hint: { fontSize: 10, color: '#718489' },
  empty: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#E7FF45', borderWidth: 1, borderColor: teal },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#DEE9ED', paddingTop: 12 },
  metric: { flex: 1, alignItems: 'center', paddingHorizontal: 5, gap: 3 },
  divider: { borderLeftWidth: 1, borderLeftColor: '#DEE9ED' },
  metricLabel: { fontSize: 12, color: '#56727C', textAlign: 'center' },
});
