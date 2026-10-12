import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import {
  ActivityBadge,
  Button,
  Card,
  MetricTile,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  wireframeStyles,
} from '@/components/ui';
import {
  createSessionComparison,
  type ComparisonMetric,
  type ComparisonMetricKey,
} from '@/domain/session-comparison';
import { getComparisonInsights } from '@/domain/comparison-insights';
import { useSessionStore } from '@/state/session-store';
import {
  formatDuration,
  formatSignedPercent,
  formatSignedTemperature,
} from '@/utils/format';

const activityNames: Record<string, string> = {
  badminton: 'Badminton',
  frisbee: 'Frisbee',
  gym: 'Gym',
  other: 'Other',
  running: 'Running',
  tennis: 'Tennis',
};

function formatDate(sessionDate: string): string {
  return new Date(sessionDate).toLocaleDateString();
}

function formatMetricValue(key: ComparisonMetricKey, value: number | null): string {
  if (value === null) return '—';
  if (key === 'duration') return formatDuration(value);
  if (key === 'recoveryTime') return value === 0 ? 'Post activity' : `${value} min`;
  if (key === 'stretchResponse') return formatSignedPercent(value);
  if (key === 'temperatureResponse') return formatSignedTemperature(value);
  if (key === 'movementIntensity' || key === 'pain' || key === 'stiffness') {
    return `${value} / 10`;
  }
  if (key === 'recoveryChecks') return `${value} / 5`;
  return String(value);
}

function formatMetricChange(key: ComparisonMetricKey, value: number | null): string {
  if (value === null) return 'Not comparable';
  if (value === 0) return 'No change';
  const sign = value > 0 ? '+' : '−';
  const absoluteValue = Math.abs(value);
  if (key === 'duration') return `${sign}${Math.round(absoluteValue / 60)} min`;
  if (key === 'recoveryTime') return `${sign}${absoluteValue} min`;
  if (key === 'stretchResponse') return `${sign}${absoluteValue.toFixed(1)}%`;
  if (key === 'temperatureResponse') return `${sign}${absoluteValue.toFixed(1)}°C`;
  if (key === 'movementIntensity') return `${sign}${absoluteValue.toFixed(1)}`;
  return `${sign}${absoluteValue}`;
}

function ComparisonMetricCard({ metric }: { metric: ComparisonMetric }) {
  return (
    <Card>
      <SectionTitle>{metric.label}</SectionTitle>
      <View style={wireframeStyles.choiceGrid}>
        <MetricTile label="Earlier" value={formatMetricValue(metric.key, metric.earlier)} />
        <MetricTile label="Latest" value={formatMetricValue(metric.key, metric.latest)} highlighted />
      </View>
      <Row
        label="Change"
        value={formatMetricChange(metric.key, metric.change)}
        icon="swap-horizontal-outline"
      />
    </Card>
  );
}

export default function SessionComparisonScreen() {
  const { earlierId, latestId } = useLocalSearchParams<{
    earlierId: string;
    latestId: string;
  }>();
  const { sessions } = useSessionStore();
  const first = sessions[earlierId];
  const second = sessions[latestId];

  if (!first || !second) {
    return (
      <Page>
        <PageHeading
          eyebrow="Session comparison"
          title="Comparison unavailable"
          description="One or both selected sessions are no longer stored on this device."
        />
        <Button label="Return to History" onPress={() => router.back()} variant="secondary" />
      </Page>
    );
  }

  let comparison;
  try {
    comparison = createSessionComparison(first, second);
  } catch (error) {
    return (
      <Page>
        <PageHeading
          eyebrow="Session comparison"
          title="Sessions cannot be compared"
          description={error instanceof Error ? error.message : 'Choose two compatible sessions.'}
        />
        <Button label="Return to History" onPress={() => router.back()} variant="secondary" />
      </Page>
    );
  }

  const activityLabel = activityNames[comparison.earlier.activityType];
  const activityMetrics = comparison.metrics.slice(0, 3);
  const recoveryMetrics = comparison.metrics.slice(3, 6);
  const reportedMetrics = comparison.metrics.slice(6);
  const insights = getComparisonInsights(comparison);

  return (
    <Page>
      <PageHeading
        eyebrow="Session comparison"
        title={`${activityLabel} over time`}
        highlight="EARLIER vs LATEST"
        description="Compare two sessions with the same activity type. Changes describe recorded data, not improvement or injury risk."
      />
      <ActivityBadge activity={comparison.earlier.activityType} label={activityLabel} />

      <Card variant="muted">
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile
            label="Earlier session"
            value={formatDate(comparison.earlier.closedAt ?? comparison.earlier.createdAt)}
          />
          <MetricTile
            label="Latest session"
            value={formatDate(comparison.latest.closedAt ?? comparison.latest.createdAt)}
            highlighted
          />
        </View>
        <Row
          label="Compared activity"
          value={activityLabel}
          icon="barbell-outline"
        />
      </Card>

      {comparison.earlier.injuredSide !== comparison.latest.injuredSide ? (
        <Notice
          title="Different tracked sides"
          body="Each response value uses the injured or tracked side selected for that session. Interpret this comparison cautiously."
          tone="warning"
        />
      ) : null}
      {comparison.earlier.endedEarly || comparison.latest.endedEarly ? (
        <Notice
          title="Partial session included"
          body="At least one session ended early, so some recovery values may not be comparable."
          tone="warning"
        />
      ) : null}

      <SectionTitle>What changed</SectionTitle>
      {insights.map((insight) => (
        <Notice
          key={insight.id}
          title={insight.title}
          body={insight.body}
          tone={insight.tone}
        />
      ))}

      <SectionTitle>Activity</SectionTitle>
      {activityMetrics.map((metric) => (
        <ComparisonMetricCard key={metric.key} metric={metric} />
      ))}

      <SectionTitle>Recovery response</SectionTitle>
      {recoveryMetrics.map((metric) => (
        <ComparisonMetricCard key={metric.key} metric={metric} />
      ))}

      <SectionTitle>Reported experience and completion</SectionTitle>
      {reportedMetrics.map((metric) => (
        <ComparisonMetricCard key={metric.key} metric={metric} />
      ))}

      <Notice
        title="Descriptive comparison only"
        body="A higher or lower value does not by itself mean your knee is safer, healthier, or injured. Compare sessions alongside context and measurement completeness."
        tone="info"
      />
      <Button
        label="Return to History"
        icon="time-outline"
        onPress={() => router.back()}
        variant="secondary"
      />
    </Page>
  );
}
