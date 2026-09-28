import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { RecoveryLineChart } from '@/components/recovery-line-chart';
import {
  Button,
  Card,
  Label,
  MetricTile,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  StatusTag,
  Value,
  wireframeStyles,
} from '@/components/ui';
import {
  getCompletedRecoveryCount,
  getLastCompletedRecoveryMinutes,
  getSwellingSeries,
  getTemperatureSeries,
} from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';
import {
  formatDuration,
  formatScore,
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

const chartLabels = ['Before', 'Post', '15m', '30m', '45m', '60m'];
const swellingLabels = ['None', 'Mild', 'Moderate', 'Significant'];

export default function SessionSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions } = useSessionStore();
  const session = sessions[sessionId];

  if (!session) {
    return (
      <Page>
        <PageHeading
          eyebrow="Session summary"
          title="Session not found"
          description="This session is no longer stored on this device."
        />
        <Button label="Return to Training" onPress={() => router.dismissTo('/')} />
      </Page>
    );
  }

  const completeChecks = getCompletedRecoveryCount(session);
  const duration = formatDuration(session.activity.elapsedSeconds);
  const activity = activityNames[session.activityType];
  const endedEarly = session.endedEarly;
  const metrics = session.activity.metrics;
  const swellingValues = getSwellingSeries(session);
  const leftTemperatures = getTemperatureSeries(session, 'left');
  const rightTemperatures = getTemperatureSeries(session, 'right');
  const trackedMinutes = getLastCompletedRecoveryMinutes(session);
  const postActivity = session.recovery['0'];
  const responsePercent = (side: 'left' | 'right') => {
    const baseline = session.baseline[side]?.stretchValue;
    const post = postActivity?.[side]?.stretchValue;
    return baseline && post ? ((post - baseline) / baseline) * 100 : 0;
  };
  const temperatureChange = (side: 'left' | 'right') => {
    const baseline = session.baseline[side]?.temperatureCelsius;
    const post = postActivity?.[side]?.temperatureCelsius;
    return baseline !== undefined && post !== undefined ? post - baseline : 0;
  };

  return (
    <Page>
      <PageHeading
        eyebrow="Session summary"
        title={endedEarly ? 'Session ended with partial data' : 'Review your knee response'}
        highlight={
          endedEarly
            ? 'ENDED EARLY'
            : trackedMinutes === null
              ? 'ACTIVITY RECORDED'
              : `${trackedMinutes} MIN TRACKED`
        }
        description={`${activity} · Saved on this device`}
      />
      <Card variant="data">
        <StatusTag label={endedEarly ? 'Partial record' : 'Session complete'} tone={endedEarly ? 'warning' : 'complete'} />
        <Label inverse>Activity Load Index</Label>
        <Value inverse>
          {metrics ? `${metrics.loadIndex} · ${metrics.loadLevel}` : 'Not calculated'}
        </Value>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Duration" value={duration} highlighted />
          <MetricTile label="Recovery checks" value={String(completeChecks)} unit="/ 5" />
        </View>
        <Row
          label="Sharp decelerations"
          value={metrics ? String(metrics.decelerationEventCount) : '—'}
          icon="trending-down-outline"
          inverse
        />
      </Card>

      <Card>
        <SectionTitle>How each knee responded</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Right response" value={formatSignedPercent(responsePercent('right'))} />
          <MetricTile label="Left response" value={formatSignedPercent(responsePercent('left'))} />
        </View>
        <Row
          label="Right temperature change"
          value={formatSignedTemperature(temperatureChange('right'))}
          icon="thermometer-outline"
        />
        <Row
          label="Left temperature change"
          value={formatSignedTemperature(temperatureChange('left'))}
          icon="thermometer-outline"
        />
        <Row
          label="Reported pain"
          value={formatScore(postActivity?.symptoms.pain ?? session.baseline.symptoms.pain)}
          icon="fitness-outline"
        />
      </Card>

      <Card>
        <SectionTitle>Swelling across recovery</SectionTitle>
        <RecoveryLineChart
          labels={chartLabels}
          series={[{ label: 'Reported swelling', color: '#087885', values: swellingValues }]}
          valueFormatter={(value) => swellingLabels[Math.max(0, Math.min(3, Math.round(value)))]}
        />
      </Card>

      <Card>
        <SectionTitle>Temperature across recovery</SectionTitle>
        <RecoveryLineChart
          labels={chartLabels}
          series={[
            { label: 'Left knee', color: '#3976A8', values: leftTemperatures },
            { label: 'Right knee', color: '#B8643F', values: rightTemperatures },
          ]}
          valueFormatter={(value) => `${value.toFixed(1)}°C`}
        />
      </Card>

      <Notice
        title="Personal baseline still developing"
        body="Complete more comparable sessions to establish your typical response and recovery range."
        tone="info"
      />
      <Notice
        title="Not a medical diagnosis"
        body="AfterMotion describes activity load and personal response trends. Clinical decisions remain with your care team."
        tone="warning"
      />
      <Button label="Return to Training" onPress={() => router.dismissTo('/')} variant="highlight" icon="barbell-outline" />
    </Page>
  );
}
