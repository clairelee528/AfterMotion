import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';

export interface ChartSeries {
  color: string;
  label: string;
  values: (number | null)[];
}

interface RecoveryLineChartProps {
  labels: string[];
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
}

const chartHeight = 150;
const horizontalInset = 16;
const verticalInset = 18;

export function RecoveryLineChart({ labels, series, valueFormatter }: RecoveryLineChartProps) {
  const [width, setWidth] = useState(0);
  const recordedValues = series.flatMap((item) => item.values).filter((value): value is number => value !== null);
  const rawMin = recordedValues.length ? Math.min(...recordedValues) : 0;
  const rawMax = recordedValues.length ? Math.max(...recordedValues) : 1;
  const padding = rawMax === rawMin ? Math.max(Math.abs(rawMax) * 0.03, 0.5) : (rawMax - rawMin) * 0.18;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const plotWidth = Math.max(0, width - horizontalInset * 2);
  const plotHeight = chartHeight - verticalInset * 2;
  const xFor = (index: number) => horizontalInset + (index / Math.max(1, labels.length - 1)) * plotWidth;
  const yFor = (value: number) => verticalInset + ((max - value) / Math.max(0.001, max - min)) * plotHeight;

  return (
    <View style={styles.wrapper}>
      <View style={styles.legend}>
        {series.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {recordedValues.length ? (
        <View
          accessibilityLabel={`Recovery chart. Recorded range ${valueFormatter(rawMin)} to ${valueFormatter(rawMax)}.`}
          style={styles.chart}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {[0, 0.5, 1].map((position) => (
            <View key={position} style={[styles.gridLine, { top: verticalInset + plotHeight * position }]} />
          ))}
          {width > 0
            ? series.flatMap((item) => {
                const segments = item.values.slice(0, -1).map((value, index) => {
                  const next = item.values[index + 1];
                  if (value === null || next === null) return null;
                  const x1 = xFor(index);
                  const y1 = yFor(value);
                  const x2 = xFor(index + 1);
                  const y2 = yFor(next);
                  const length = Math.hypot(x2 - x1, y2 - y1);
                  const angle = Math.atan2(y2 - y1, x2 - x1);
                  return (
                    <View
                      key={`${item.label}-segment-${index}`}
                      style={[
                        styles.segment,
                        {
                          backgroundColor: item.color,
                          left: x1,
                          top: y1,
                          width: length,
                          transform: [{ rotateZ: `${angle}rad` }],
                        },
                      ]}
                    />
                  );
                });
                const points = item.values.map((value, index) =>
                  value === null ? null : (
                    <View
                      key={`${item.label}-point-${index}`}
                      style={[
                        styles.point,
                        {
                          backgroundColor: item.color,
                          left: xFor(index) - 5,
                          top: yFor(value) - 5,
                        },
                      ]}
                    />
                  ),
                );
                return [...segments, ...points];
              })
            : null}
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No recorded checkpoints yet</Text>
        </View>
      )}

      <View style={styles.axisLabels}>
        {labels.map((label) => (
          <Text key={label} style={styles.axisLabel}>{label}</Text>
        ))}
      </View>
      {recordedValues.length ? (
        <Text style={styles.rangeText}>{valueFormatter(rawMin)} – {valueFormatter(rawMax)} recorded range</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  legendDot: { borderRadius: radii.pill, height: 9, width: 9 },
  legendText: { color: colors.mutedInk, ...typography.caption },
  chart: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, height: chartHeight, overflow: 'hidden' },
  gridLine: { backgroundColor: colors.borderStrong, height: StyleSheet.hairlineWidth, left: horizontalInset, position: 'absolute', right: horizontalInset },
  segment: { borderRadius: radii.pill, height: 3, position: 'absolute', transformOrigin: 'left center' },
  point: { borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, height: 10, position: 'absolute', width: 10 },
  emptyChart: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.md, height: chartHeight, justifyContent: 'center' },
  emptyText: { color: colors.mutedInk, ...typography.caption },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: { color: colors.subtleInk, flex: 1, fontSize: 10, textAlign: 'center' },
  rangeText: { color: colors.mutedInk, textAlign: 'right', ...typography.caption },
});
