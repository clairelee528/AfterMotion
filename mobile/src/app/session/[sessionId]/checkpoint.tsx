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
import { isRecoveryCheckpoint } from '@/domain/models';
import { getNextMissingSide } from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';
import { formatRecordedTime, formatScore, formatTemperature } from '@/utils/format';

export default function CheckpointScreen() {
  const { sessionId, checkpoint = '0' } = useLocalSearchParams<{
    sessionId: string;
    checkpoint?: string;
  }>();
  const { sessions } = useSessionStore();
  const session = sessions[sessionId];
  const safeCheckpoint =
    checkpoint === 'baseline' || isRecoveryCheckpoint(checkpoint) ? checkpoint : 'baseline';
  const isBaseline = safeCheckpoint === 'baseline';
  const record = isBaseline ? session?.baseline : session?.recovery[safeCheckpoint];
  const missingSide = getNextMissingSide(record);
  const checkInComplete = Boolean(record?.symptomsRecordedAt);
  const title = isBaseline
    ? 'Pre-activity baseline'
    : safeCheckpoint === '0'
      ? 'Post-activity response'
      : `${safeCheckpoint} minute response`;

  function remeasure(side: 'left' | 'right') {
    router.push({
      pathname: '/session/[sessionId]/measurement',
      params: {
        sessionId,
        phase: isBaseline ? 'baseline' : 'recovery',
        side,
        checkpoint: safeCheckpoint,
        mode: 'remeasure',
      },
    });
  }

  if (!record?.left || !record.right || !session) {
    return (
      <Page>
        <PageHeading
          eyebrow="Recovery check"
          title="Measurement incomplete"
          description="Continue from the missing knee. Measurements already saved will be kept."
        />
        <Button
          label={missingSide ? `Measure ${missingSide} knee` : 'Return to session overview'}
          onPress={() =>
            missingSide
              ? router.replace({
                  pathname: '/session/[sessionId]/measurement',
                  params: {
                    sessionId,
                    phase: isBaseline ? 'baseline' : 'recovery',
                    side: missingSide,
                    checkpoint: safeCheckpoint,
                  },
                })
              : router.replace({ pathname: '/session/[sessionId]', params: { sessionId } })
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeading
        eyebrow={`${isBaseline ? 'Baseline' : 'Recovery check'} · ${checkInComplete ? 'Complete' : 'Check-in needed'}`}
        title={title}
        highlight={checkInComplete ? 'RECORDED' : 'MEASUREMENTS SAVED'}
        description={
          checkInComplete
            ? 'Both knee measurements and your reported feelings are saved locally.'
            : 'Both knee measurements are safe. Add your subjective check-in to complete this time point.'
        }
      />
      <Card>
        <SideBadge side="left" injured={session.injuredSide === 'left'} />
        <SectionTitle>Left knee</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Temperature" value={formatTemperature(record.left.temperatureCelsius)} />
          <MetricTile label="Stretch" value={String(record.left.stretchValue)} />
        </View>
        <Row label="Recorded" value={formatRecordedTime(record.left.recordedAt)} icon="time-outline" />
        <Row
          label="Measurement quality"
          value={
            record.left.quality?.stability === 'stable' &&
            record.left.quality.bandTension === 'correct'
              ? 'Stable · Target tension'
              : 'Quality not available'
          }
          icon="checkmark-circle-outline"
        />
        <Button
          label="Measure left knee again"
          icon="refresh-outline"
          onPress={() => remeasure('left')}
          variant="secondary"
        />
      </Card>
      <Card>
        <SideBadge side="right" injured={session.injuredSide === 'right'} />
        <SectionTitle>Right knee</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <MetricTile label="Temperature" value={formatTemperature(record.right.temperatureCelsius)} />
          <MetricTile label="Stretch" value={String(record.right.stretchValue)} />
        </View>
        <Row label="Recorded" value={formatRecordedTime(record.right.recordedAt)} icon="time-outline" />
        <Row
          label="Measurement quality"
          value={
            record.right.quality?.stability === 'stable' &&
            record.right.quality.bandTension === 'correct'
              ? 'Stable · Target tension'
              : 'Quality not available'
          }
          icon="checkmark-circle-outline"
        />
        <Button
          label="Measure right knee again"
          icon="refresh-outline"
          onPress={() => remeasure('right')}
          variant="secondary"
        />
      </Card>
      <Card>
        <StatusTag
          label={checkInComplete ? 'Subjective check-in recorded' : 'Check-in needed'}
          tone={checkInComplete ? 'complete' : 'warning'}
        />
        <SectionTitle>How your knee felt</SectionTitle>
        <Row label="Pain" value={formatScore(record.symptoms.pain)} icon="fitness-outline" />
        <Row label="Stiffness" value={formatScore(record.symptoms.stiffness)} icon="body-outline" />
        <Row label="Swelling" value={record.symptoms.swelling} icon="water-outline" />
        {record.symptomsRecordedAt ? (
          <Row
            label="Check-in saved"
            value={formatRecordedTime(record.symptomsRecordedAt)}
            icon="time-outline"
          />
        ) : null}
        <Button
          label={checkInComplete ? 'Edit feelings' : 'Record feelings'}
          icon="create-outline"
          onPress={() =>
            router.push({
              pathname: '/session/[sessionId]/feelings',
              params: { sessionId, checkpoint: safeCheckpoint, returnTo: 'checkpoint' },
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
      <Button
        label="Return to session overview"
        icon="grid-outline"
        onPress={() =>
          router.replace({ pathname: '/session/[sessionId]', params: { sessionId } })
        }
        variant="secondary"
      />
    </Page>
  );
}
