import { View } from 'react-native';

import { Button, MetricTile, SectionTitle, wireframeStyles } from '@/components/ui';

export function SymptomScoreControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const setClampedValue = (nextValue: number) =>
    onChange(Math.max(0, Math.min(10, nextValue)));

  return (
    <>
      <SectionTitle>{label}</SectionTitle>
      <MetricTile label={`${label} score`} value={String(value)} unit="/ 10" highlighted />
      <View style={wireframeStyles.actionRow}>
        <Button
          disabled={value === 0}
          label="Decrease"
          icon="remove-circle-outline"
          onPress={() => setClampedValue(value - 1)}
          variant="secondary"
          style={wireframeStyles.actionButton}
        />
        <Button
          disabled={value === 10}
          label="Increase"
          icon="add-circle-outline"
          onPress={() => setClampedValue(value + 1)}
          variant="secondary"
          style={wireframeStyles.actionButton}
        />
      </View>
    </>
  );
}
