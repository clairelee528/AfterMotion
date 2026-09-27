import { router, useLocalSearchParams } from 'expo-router';

import {
  Button,
  Card,
  MetricTile,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  SideBadge,
  StatusTag,
  wireframeStyles,
} from '@/components/ui';
import { View } from 'react-native';
import { useSessionStore } from '@/state/session-store';
import { formatRecordedTime, formatScore, formatTemperature } from '@/utils/format';

export default function CheckpointScreen() {
  const { sessionId, checkpoint = '0' } = useLocalSearchParams<{
    sessionId: string;
    checkpoint?: string;
  }>();
  const { sessions } = useSessionStore();
  const record = sessions[sessionId]?.recovery[checkpoint];
  const title = checkpoint === '0' ? 'Post-activity response' : `${checkpoint} minute response`;

  if (!record?.left || !record.right) {
    return (
      <Page>
        <PageHeading
          eyebrow="Recovery check"
          title="Measurement incomplete"
          description="Return to the Session overview to complete the missing knee measurement."
        />
        <Button
          label="Return to session overview"
          onPress={() =>
            router.replace({ pathname: '/session/[sessionId]', params: { sessionId } })
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeading
        eyebrow="Recovery check · Complete"
        title={title}
        highlight="RECORDED"
        description="Both knee measurements and your reported feelings are saved locally."
      />
      <Card>
        <SideBadge side="left" injured={sessions[sessionId]?.injuredSide === 'left'} />
        <SectionTitle>Left knee</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Temperature" value={formatTemperature(record.left.temperatureCelsius)} />
          <MetricTile label="Stretch" value={String(record.left.stretchValue)} />
        </View>
        <Row label="Recorded" value={formatRecordedTime(record.left.recordedAt)} icon="time-outline" />
      </Card>
      <Card>
        <SideBadge side="right" injured={sessions[sessionId]?.injuredSide === 'right'} />
        <SectionTitle>Right knee</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Temperature" value={formatTemperature(record.right.temperatureCelsius)} />
          <MetricTile label="Stretch" value={String(record.right.stretchValue)} />
        </View>
        <Row label="Recorded" value={formatRecordedTime(record.right.recordedAt)} icon="time-outline" />
      </Card>
      <Card>
        <StatusTag label="Subjective check-in" tone="info" />
        <SectionTitle>How your knee felt</SectionTitle>
        <Row label="Pain" value={formatScore(record.symptoms.pain)} icon="fitness-outline" />
        <Row label="Stiffness" value={formatScore(record.symptoms.stiffness)} icon="body-outline" />
        <Row label="Swelling" value={record.symptoms.swelling} icon="water-outline" />
        <Button
          label="Edit feelings"
          icon="create-outline"
          onPress={() =>
            router.push({
              pathname: '/session/[sessionId]/feelings',
              params: { sessionId, checkpoint },
            })
          }
          variant="text"
        />
      </Card>
      <Notice
        title="Measurement values are preserved"
        body="Editing feelings does not replace the temperature or stretch readings."
        tone="success"
      />
    </Page>
  );
}
