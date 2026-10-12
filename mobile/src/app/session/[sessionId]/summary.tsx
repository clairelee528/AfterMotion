import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { RecoveryLineChart } from '@/components/recovery-line-chart';
import {
  ActivityBadge,
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
import { recoveryCheckpoints } from '@/domain/models';
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
import {
  assessRecoveryCheckpoint,
  getRecoveryRangeLabel,
  getRecoveryTime,
  getRecoveryTimeLabel,
} from '@/domain/recovery-status';
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
  const recoveryTimeLabel = getRecoveryTimeLabel(recoveryTime);
  const summaryHighlight = endedEarly
    ? 'ENDED EARLY'
    : recoveryTime.status === 'recovered'
      ? recoveryTime.minutes === 0
        ? 'WITHIN RANGE POST ACTIVITY'
        : `WITHIN RANGE · ${recoveryTime.minutes} MIN`
      : recoveryTime.status === 'notRecovered'
        ? 'ABOVE RANGE AT 60 MIN'
        : trackedMinutes === null
          ? 'ACTIVITY RECORDED'
          : `${trackedMinutes} MIN TRACKED`;
  const postFeelingsRecorded = Boolean(postActivity?.symptomsRecordedAt);

  return (
    <Page>
      <PageHeading
        eyebrow="Session summary"
        title={endedEarly ? 'Session ended with partial data' : `${activity} session`}
        highlight={summaryHighlight}
        description={`${activity} · Saved on this device`}
      />
      <ActivityBadge activity={session.activityType} label={activity} />

      <Card variant="data">
        <StatusTag label={endedEarly ? 'Partial record' : 'Session complete'} tone={endedEarly ? 'warning' : 'complete'} />
        <Label inverse>Activity Load Index</Label>
        <Value inverse>
          {metrics ? `${metrics.loadIndex} · ${metrics.loadLevel}` : 'Not calculated'}
        </Value>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Duration" value={duration} highlighted />
          <MetricTile
            label="Movement intensity"
            value={metrics ? String(metrics.movementIntensity) : '—'}
            unit="/ 10"
          />
        </View>
        <Row
          label="Acceleration peaks"
          value={metrics ? String(metrics.accelerationPeakCount) : '—'}
          icon="trending-up-outline"
          inverse
        />
        <Row
          label="Sharp decelerations"
          value={metrics ? String(metrics.decelerationEventCount) : '—'}
          icon="trending-down-outline"
          inverse
        />
        <Row
          label="Impact-like events"
          value={metrics ? String(metrics.impactLikeEventCount) : '—'}
          icon="flash-outline"
          inverse
        />
      </Card>

      <Card>
        <SectionTitle>Immediate response</SectionTitle>
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
          value={postFeelingsRecorded ? formatScore(postActivity.symptoms.pain) : '—'}
          icon="fitness-outline"
        />
        <Row
          label="Reported stiffness"
          value={postFeelingsRecorded ? formatScore(postActivity.symptoms.stiffness) : '—'}
          icon="body-outline"
        />
        <Row
          label="Reported swelling"
          value={postFeelingsRecorded ? postActivity.symptoms.swelling : '—'}
          icon="water-outline"
        />
      </Card>

      <Card>
        <StatusTag
          label={
            recoveryTime.status === 'recovered'
              ? 'Recovery point found'
              : recoveryTime.status === 'notRecovered'
                ? 'Above range at 60 min'
                : 'Partial recovery data'
          }
          tone={
            recoveryTime.status === 'recovered'
              ? 'complete'
              : recoveryTime.status === 'notRecovered'
                ? 'warning'
                : 'info'
          }
        />
        <SectionTitle>Recovery overview</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Recovery time" value={recoveryTimeLabel} highlighted />
          <MetricTile label="Checks completed" value={String(completeChecks)} unit="/ 5" />
        </View>
        {recoveryCheckpoints.map((checkpoint) => {
          const assessment = assessRecoveryCheckpoint(session, checkpoint);
          return (
            <Row
              key={checkpoint}
              label={checkpoint === '0' ? 'Post activity' : `${checkpoint} min`}
              value={getRecoveryRangeLabel(assessment.status)}
              icon={
                assessment.status === 'withinBaselineRange'
                  ? 'checkmark-circle-outline'
                  : assessment.status === 'aboveBaselineRange'
                    ? 'alert-circle-outline'
                    : 'remove-circle-outline'
              }
            />
          );
        })}
      </Card>

      <Card>
        <SectionTitle>Recovery detail · Band stretch</SectionTitle>
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
        <SectionTitle>Recovery detail · Temperature</SectionTitle>
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
        <SectionTitle>Recovery detail · Pain and stiffness</SectionTitle>
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
        <SectionTitle>Recovery detail · Reported swelling</SectionTitle>
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
