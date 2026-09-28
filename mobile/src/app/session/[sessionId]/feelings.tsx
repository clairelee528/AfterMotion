import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SymptomScoreControl } from '@/components/symptom-score-control';
import {
  Button,
  Card,
  Choice,
  Notice,
  Page,
  PageHeading,
  SectionTitle,
  wireframeStyles,
} from '@/components/ui';
import {
  isRecoveryCheckpoint,
  type MeasurementCheckpoint,
  type SubjectiveSwelling,
} from '@/domain/models';
import { useSessionStore } from '@/state/session-store';

export default function FeelingsScreen() {
  const { sessionId, checkpoint = 'baseline', returnTo } = useLocalSearchParams<{
    sessionId: string;
    checkpoint?: string;
    returnTo?: 'checkpoint';
  }>();
  const { saveFeelings, sessions } = useSessionStore();
  const session = sessions[sessionId];
  const safeCheckpoint: MeasurementCheckpoint =
    checkpoint === 'baseline' || isRecoveryCheckpoint(checkpoint) ? checkpoint : 'baseline';
  const checkpointRecord = safeCheckpoint === 'baseline'
    ? session?.baseline
    : session?.recovery[safeCheckpoint];
  const savedSymptoms = safeCheckpoint === 'baseline'
    ? session?.baseline.symptoms
    : session?.recovery[safeCheckpoint]?.symptoms;
  const [pain, setPain] = useState(savedSymptoms?.pain ?? 2);
  const [stiffness, setStiffness] = useState(savedSymptoms?.stiffness ?? 2);
  const [swelling, setSwelling] = useState<SubjectiveSwelling>(
    savedSymptoms?.swelling ?? 'mild',
  );
  const stage = safeCheckpoint === 'baseline'
    ? 'Pre-activity'
    : safeCheckpoint === '0'
      ? 'Post-activity'
      : `${safeCheckpoint} min recovery`;
  const isEditing = Boolean(checkpointRecord?.symptomsRecordedAt);

  if (!session) {
    return (
      <Page>
        <PageHeading
          eyebrow="Subjective check-in"
          title="Session not found"
          description="This session is no longer stored on this device."
        />
        <Button label="Return to Training" onPress={() => router.dismissTo('/')} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeading
        eyebrow={stage}
        title={isEditing ? 'Edit how your knee felt' : 'How did your knee feel?'}
        highlight="CHECK-IN"
        description={
          isEditing
            ? 'This changes your subjective check-in only. You do not need to repeat the sensor measurement.'
            : 'Record one overall check-in for this time point. Your left and right sensor measurements stay separate.'
        }
      />
      <Card>
        <SymptomScoreControl label="Pain" value={pain} onChange={setPain} />
      </Card>
      <Card>
        <SymptomScoreControl label="Stiffness" value={stiffness} onChange={setStiffness} />
      </Card>
      <Card>
        <SectionTitle>Subjective swelling</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          {(['normal', 'mild', 'moderate', 'significant'] as SubjectiveSwelling[]).map((value) => (
            <Choice
              key={value}
              label={value === 'normal' ? 'None' : value.charAt(0).toUpperCase() + value.slice(1)}
              selected={swelling === value}
              onPress={() => setSwelling(value)}
            />
          ))}
        </View>
      </Card>
      <Notice
        title="One check-in per time point"
        body="Report your overall knee experience for this checkpoint. Left and right sensor readings remain separate and will not be replaced."
        tone="info"
      />
      <Button
        label={isEditing ? 'Save changes' : 'Save check-in'}
        icon="save-outline"
        onPress={() => {
          saveFeelings(sessionId, safeCheckpoint, { pain, stiffness, swelling });
          router.replace(
            returnTo === 'checkpoint'
              ? {
                  pathname: '/session/[sessionId]/checkpoint',
                  params: { sessionId, checkpoint: safeCheckpoint },
                }
              : { pathname: '/session/[sessionId]', params: { sessionId } },
          );
        }}
        variant="highlight"
      />
      <Button
        label="Cancel"
        icon="close-outline"
        onPress={() => router.back()}
        variant="secondary"
      />
    </Page>
  );
}
