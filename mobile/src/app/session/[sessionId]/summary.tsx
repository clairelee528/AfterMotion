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
  getPainSeries,
  getStiffnessSeries,
  getSwellingSeries,
} from '@/domain/session-selectors';
import {
  getCircumferenceResponseSeries,
  getCircumferenceResponse,
  getTemperatureDeltaSeries,
  getTemperatureResponse,
} from '@/domain/recovery-metrics';
import { getRecoveryTime } from '@/domain/recovery-status';
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
  const painValues = getPainSeries(session);
  const stiffnessValues = getStiffnessSeries(session);
  const leftStretchResponses = getCircumferenceResponseSeries(session, 'left');
  const rightStretchResponses = getCircumferenceResponseSeries(session, 'right');
  const leftTemperatureDeltas = getTemperatureDeltaSeries(session, 'left');
  const rightTemperatureDeltas = getTemperatureDeltaSeries(session, 'right');
  const trackedMinutes = getLastCompletedRecoveryMinutes(session);
  const postActivity = session.recovery['0'];
  const circumferenceResponse = getCircumferenceResponse(session, '0');
  const temperatureResponse = getTemperatureResponse(session, '0');
  const recoveryTime = getRecoveryTime(session);
  const recoveryTimeLabel =
    recoveryTime.status === 'recovered'
      ? recoveryTime.minutes === 0
        ? 'Post activity'
        : `${recoveryTime.minutes} min`
      : recoveryTime.status === 'notRecovered'
        ? '> 60 min'
        : 'Insufficient data';

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
        <Row
          label="Recovery time"
          value={recoveryTimeLabel}
          icon="time-outline"
        />
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile
            label="Right stretch response"
            value={
              circumferenceResponse.rightPercent === null
                ? '—'
                : formatSignedPercent(circumferenceResponse.rightPercent)
            }
          />
          <MetricTile
            label="Left stretch response"
            value={
              circumferenceResponse.leftPercent === null
                ? '—'
                : formatSignedPercent(circumferenceResponse.leftPercent)
            }
          />
        </View>
        <Row
          label={`${circumferenceResponse.injuredSide === 'left' ? 'Left' : 'Right'} vs contralateral stretch`}
          value={
            circumferenceResponse.contralateralDifferencePercent === null
              ? '—'
              : formatSignedPercent(circumferenceResponse.contralateralDifferencePercent)
          }
          icon="git-compare-outline"
        />
        <Row
          label="Right temperature change"
          value={
            temperatureResponse.rightDeltaCelsius === null
              ? '—'
              : formatSignedTemperature(temperatureResponse.rightDeltaCelsius)
          }
          icon="thermometer-outline"
        />
        <Row
          label="Left temperature change"
          value={
            temperatureResponse.leftDeltaCelsius === null
              ? '—'
              : formatSignedTemperature(temperatureResponse.leftDeltaCelsius)
          }
          icon="thermometer-outline"
        />
        <Row
          label={`${temperatureResponse.injuredSide === 'left' ? 'Left' : 'Right'} vs contralateral temperature`}
          value={
            temperatureResponse.currentAsymmetryCelsius === null
              ? '—'
              : formatSignedTemperature(temperatureResponse.currentAsymmetryCelsius)
          }
          icon="git-compare-outline"
        />
        <Row
          label="Reported pain"
          value={formatScore(postActivity?.symptoms.pain ?? session.baseline.symptoms.pain)}
          icon="fitness-outline"
        />
      </Card>

      <Card>
        <SectionTitle>Band stretch response</SectionTitle>
        <RecoveryLineChart
          labels={chartLabels}
          series={[
            { label: 'Left knee', color: '#3976A8', values: leftStretchResponses },
            { label: 'Right knee', color: '#B8643F', values: rightStretchResponses },
          ]}
          valueFormatter={formatSignedPercent}
        />
        <Notice
          title="Relative Recovery Band response"
          body="Values show percentage change from each knee's own pre-activity reading, not centimeters."
          tone="info"
        />
      </Card>

      <Card>
        <SectionTitle>Temperature response</SectionTitle>
        <RecoveryLineChart
          labels={chartLabels}
          series={[
            { label: 'Left knee', color: '#3976A8', values: leftTemperatureDeltas },
            { label: 'Right knee', color: '#B8643F', values: rightTemperatureDeltas },
          ]}
          valueFormatter={formatSignedTemperature}
        />
      </Card>

      <Card>
        <SectionTitle>Pain and stiffness</SectionTitle>
        <RecoveryLineChart
          labels={chartLabels}
          series={[
            { label: 'Pain', color: '#B8643F', values: painValues },
            { label: 'Stiffness', color: '#087885', values: stiffnessValues },
          ]}
          valueFormatter={(value) => `${value.toFixed(0)} / 10`}
        />
      </Card>

      <Card>
        <SectionTitle>Reported swelling</SectionTitle>
        <RecoveryLineChart
          labels={chartLabels}
          series={[{ label: 'Swelling', color: '#087885', values: swellingValues }]}
          valueFormatter={(value) => swellingLabels[Math.max(0, Math.min(3, Math.round(value)))]}
        />
      </Card>

      <Notice
        title="Personal baseline still developing"
        body="The prototype range uses ≤0.5% stretch response, ≤0.5% side difference, ≤0.3°C temperature change, ≤0.3°C response difference, pain/stiffness no more than +1, and swelling no higher than this session's baseline. More sessions are needed to establish a truly personal range."
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
