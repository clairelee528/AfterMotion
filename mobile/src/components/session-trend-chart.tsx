import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

export const kneeColors = ['#064B5B', '#399EFF'];
const labels = ['Before', 'Post', '15m', '30m', '45m', '60m'];

export function SessionTrendChart({ left, right, unit }: {
  left: (number | null)[];
  right: (number | null)[];
  unit: string;
}) {
  const [width, setWidth] = useState(0);
  const series = [left, right];
  const valid = (v: number | null): v is number => v !== null && Number.isFinite(v);
  const values = series.flat().filter(valid);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = Math.max(high - low, unit === '°C' ? 0.2 : 0.5);
  const min = low - span * 0.16;
  const max = high + span * 0.14;
  const x = (i: number) => 40 + i * (width - 60) / 5;
  const y = (v: number) => 12 + (max - v) / (max - min) * 150;
  const ticks = [...new Set([low, (low + high) / 2, high])];
  const number = (v: number) => `${v > 0 ? '+' : ''}${Math.abs(v) < 0.0001 ? '0' : v.toFixed(1)}`;
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {values.length ? (
        <View accessible accessibilityLabel={series.map((s, side) => `${side === 0 ? 'Left' : 'Right'} knee: ${s.map((v, i) => `${labels[i]} ${valid(v) ? number(v) + unit : 'not measured'}`).join(', ')}`).join('. ')}>
          {width > 60 && <Svg width={width} height={194}>
            {labels.map((label, i) => <Line key={label} x1={x(i)} x2={x(i)} y1={12} y2={164} stroke="#E4EEF1" />)}
            {ticks.filter((v) => v !== 0).map((v) => <Line key={v} x1={40} x2={width - 20} y1={y(v)} y2={y(v)} stroke="#E4EEF1" />)}
            {ticks.map((v) => <SvgText key={v} x={33} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#56727C">{number(v)}</SvgText>)}
            <Line x1={40} x2={width - 20} y1={y(0)} y2={y(0)} stroke="#82959C" strokeDasharray="5 4" />
            <SvgText x={width - 20} y={y(0) - 7} textAnchor="end" fontSize={10} fill="#56727C">Baseline</SvgText>
            {series.map((s, side) => s.map((v, i) => {
              const next = s[i + 1];
              return valid(v) && valid(next ?? null) ? <Line key={`${side}-${i}`} x1={x(i)} y1={y(v)} x2={x(i + 1)} y2={y(next!)} stroke={kneeColors[side]} strokeWidth={2} /> : null;
            }))}
            {series.map((s, side) => s.map((v, i) => !valid(v) ? null : side === 0
              ? <Circle key={`${side}-${i}`} cx={x(i)} cy={y(v)} r={4} fill={kneeColors[side]} />
              : <Rect key={`${side}-${i}`} x={x(i) - 3.5} y={y(v) - 3.5} width={7} height={7} rx={0.5} fill={kneeColors[side]} />))}
            {labels.map((label, i) => <SvgText key={label} x={x(i)} y={186} textAnchor="middle" fontSize={11} fill="#56727C">{label}</SvgText>)}
          </Svg>}
        </View>
      ) : <Text style={{ paddingVertical: 48, textAlign: 'center', color: '#56727C' }}>No comparable measurements yet</Text>}
    </View>
  );
}
