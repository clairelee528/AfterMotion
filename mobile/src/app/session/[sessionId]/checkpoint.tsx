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
import {
  assessRecoveryCheckpoint,
  getRecoveryRangeLabel,
} from '@/domain/recovery-status';
import {
  getCircumferenceResponse,
  getTemperatureResponse,
} from '@/domain/recovery-metrics';
import { useSessionStore } from '@/state/session-store';
import {
  formatRecordedTime,
  formatScore,
  formatSignedPercent,
  formatSignedTemperature,
  formatTemperature,
} from '@/utils/format';

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
  const circumferenceResponse = session
    ? getCircumferenceResponse(session, safeCheckpoint)
    : null;
  const temperatureResponse = session
    ? getTemperatureResponse(session, safeCheckpoint)
    : null;
  const recoveryAssessment =
    session && !isBaseline
      ? assessRecoveryCheckpoint(session, safeCheckpoint)
      : null;

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
            : 'Both knee measurements are saved. Add your subjective check-in to complete this time point.'
        }
      />
      {recoveryAssessment ? (
        <Card>
          <StatusTag
            label={getRecoveryRangeLabel(recoveryAssessment.status)}
            tone={
              recoveryAssessment.status === 'withinBaselineRange'
                ? 'complete'
                : recoveryAssessment.status === 'aboveBaselineRange'
                  ? 'warning'
                  : 'info'
            }
          />
          <SectionTitle>Personal baseline comparison</SectionTitle>
          <Notice
            title={
              recoveryAssessment.status === 'withinBaselineRange'
                ? 'Main indicators are back in range'
                : recoveryAssessment.status === 'aboveBaselineRange'
                  ? 'Some indicators remain outside range'
                  : 'More data is needed'
            }
            body={
              recoveryAssessment.status === 'aboveBaselineRange'
                ? recoveryAssessment.outsideMetrics.join(', ')
                : recoveryAssessment.status === 'withinBaselineRange'
                  ? 'This checkpoint meets the prototype comparison rules for your own pre-activity baseline.'
                  : 'Both knee measurements and the subjective check-in are required.'
            }
            tone={
              recoveryAssessment.status === 'withinBaselineRange'
                ? 'success'
                : recoveryAssessment.status === 'aboveBaselineRange'
                  ? 'warning'
                  : 'info'
            }
          />
          <Notice
            title="Prototype comparison limits"
            body="Stretch response ≤0.5%, side-to-side stretch difference ≤0.5%, temperature change ≤0.3°C, temperature-response difference ≤0.3°C, pain and stiffness no more than +1, and swelling no higher than baseline."
            tone="info"
          />
        </Card>
      ) : null}
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
      {!isBaseline && circumferenceResponse ? (
        <Card>
          <SectionTitle>Band stretch response</SectionTitle>
          <View style={wireframeStyles.choiceGrid}>
            <MetricTile
              label="Left vs baseline"
              value={
                circumferenceResponse.leftPercent === null
                  ? '—'
                  : formatSignedPercent(circumferenceResponse.leftPercent)
              }
            />
            <MetricTile
              label="Right vs baseline"
              value={
                circumferenceResponse.rightPercent === null
                  ? '—'
                  : formatSignedPercent(circumferenceResponse.rightPercent)
              }
            />
          </View>
          <Row
            label={`${circumferenceResponse.injuredSide === 'left' ? 'Left' : 'Right'} vs contralateral`}
            value={
              circumferenceResponse.contralateralDifferencePercent === null
                ? '—'
                : formatSignedPercent(
                    circumferenceResponse.contralateralDifferencePercent,
                  )
            }
            icon="git-compare-outline"
          />
          <Notice
            title="Relative sensor response"
            body="This percentage compares Recovery Band stretch with your own pre-activity baseline. It is not a circumference measurement in centimeters."
            tone="info"
          />
        </Card>
      ) : null}
      {!isBaseline && temperatureResponse ? (
        <Card>
          <SectionTitle>Temperature response</SectionTitle>
          <View style={wireframeStyles.choiceGrid}>
            <MetricTile
              label="Left vs baseline"
              value={
                temperatureResponse.leftDeltaCelsius === null
                  ? '—'
                  : formatSignedTemperature(temperatureResponse.leftDeltaCelsius)
              }
            />
            <MetricTile
              label="Right vs baseline"
              value={
                temperatureResponse.rightDeltaCelsius === null
                  ? '—'
                  : formatSignedTemperature(temperatureResponse.rightDeltaCelsius)
              }
            />
          </View>
          <Row
            label={`${temperatureResponse.injuredSide === 'left' ? 'Left' : 'Right'} vs contralateral now`}
            value={
              temperatureResponse.currentAsymmetryCelsius === null
                ? '—'
                : formatSignedTemperature(temperatureResponse.currentAsymmetryCelsius)
            }
            icon="thermometer-outline"
          />
          <Row
            label="Difference in temperature response"
            value={
              temperatureResponse.responseDifferenceCelsius === null
                ? '—'
                : formatSignedTemperature(temperatureResponse.responseDifferenceCelsius)
            }
            icon="git-compare-outline"
          />
          <Notice
            title="Compared with your own baseline"
            body="Temperature changes describe this session's skin-temperature response. They do not diagnose inflammation or injury."
            tone="info"
          />
        </Card>
      ) : null}
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
