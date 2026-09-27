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
import { useSessionStore } from '@/state/session-store';
import { formatDuration, formatScore, formatSignedPercent } from '@/utils/format';

const activityNames: Record<string, string> = {
  badminton: 'Badminton',
  frisbee: 'Frisbee',
  gym: 'Gym',
  other: 'Other',
  running: 'Running',
  tennis: 'Tennis',
};

const checkpoints = ['0', '15', '30', '45', '60'];
const chartLabels = ['Before', 'Post', '15m', '30m', '45m', '60m'];
const swellingScores = { normal: 0, mild: 1, moderate: 2, significant: 3 } as const;
const swellingLabels = ['None', 'Mild', 'Moderate', 'Significant'];

export default function SessionSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions } = useSessionStore();
  const session = sessions[sessionId];
  const completeChecks = session
    ? Object.values(session.recovery).filter((record) => record.left && record.right).length
    : 4;
  const duration = session ? formatDuration(session.activity.elapsedSeconds) : '68 min';
  const activity = session ? activityNames[session.activityType] : 'Frisbee';
  const endedEarly = session?.endedEarly ?? false;
  const recoveryRecords = checkpoints.map((checkpoint) => session?.recovery[checkpoint]);
  const baselineWasRecorded = Boolean(session?.baseline.left || session?.baseline.right);
  const swellingValues = [
    baselineWasRecorded && session ? swellingScores[session.baseline.symptoms.swelling] : null,
    ...recoveryRecords.map((record) =>
      record?.left || record?.right ? swellingScores[record.symptoms.swelling] : null,
    ),
  ];
  const leftTemperatures = [
    session?.baseline.left?.temperatureCelsius ?? null,
    ...recoveryRecords.map((record) => record?.left?.temperatureCelsius ?? null),
  ];
  const rightTemperatures = [
    session?.baseline.right?.temperatureCelsius ?? null,
    ...recoveryRecords.map((record) => record?.right?.temperatureCelsius ?? null),
  ];

  return (
    <Page>
      <PageHeading
        eyebrow="Session summary"
        title={endedEarly ? 'Session ended with partial data' : 'Your knee moved toward baseline'}
        highlight={endedEarly ? 'ENDED EARLY' : '48 MIN RECOVERY'}
        description={`${activity} · Saved on this device`}
      />
      <Card variant="data">
        <StatusTag label={endedEarly ? 'Partial record' : 'Session complete'} tone={endedEarly ? 'warning' : 'complete'} />
        <Label inverse>Activity Load Index</Label>
        <Value inverse>82 · High</Value>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Duration" value={duration} highlighted />
          <MetricTile label="Recovery checks" value={String(completeChecks)} unit="/ 5" />
        </View>
        <Row label="Sharp decelerations" value="18" icon="trending-down-outline" inverse />
      </Card>

      <Card>
        <SectionTitle>How each knee responded</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Right response" value={formatSignedPercent(1.5)} />
          <MetricTile label="Left response" value={formatSignedPercent(0.4)} />
        </View>
        <Row label="Right temperature" value="+0.7°C" icon="thermometer-outline" />
        <Row label="Left temperature" value="+0.3°C" icon="thermometer-outline" />
        <Row label="Reported pain" value={formatScore(2)} icon="fitness-outline" />
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
