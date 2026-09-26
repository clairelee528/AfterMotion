import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Choice,
  Label,
  Page,
  PageHeading,
  SectionTitle,
  wireframeStyles,
} from '@/components/wireframe';
import type { SubjectiveSwelling } from '@/domain/models';
import { useSessionStore } from '@/state/session-store';

export default function FeelingsScreen() {
  const { sessionId, checkpoint = 'baseline' } = useLocalSearchParams<{
    sessionId: string;
    checkpoint?: string;
  }>();
  const { saveFeelings, sessions } = useSessionStore();
  const session = sessions[sessionId];
  const savedSymptoms = checkpoint === 'baseline'
    ? session?.baseline.symptoms
    : session?.recovery[checkpoint]?.symptoms;
  const [pain, setPain] = useState(savedSymptoms?.pain ?? 2);
  const [stiffness, setStiffness] = useState(savedSymptoms?.stiffness ?? 2);
  const [swelling, setSwelling] = useState<SubjectiveSwelling>(
    savedSymptoms?.swelling ?? 'mild',
  );
  const stage = checkpoint === 'baseline' ? 'Pre-activity' : checkpoint === '0' ? 'Post-activity' : `${checkpoint} min recovery`;

  return (
    <Page>
      <PageHeading
        eyebrow={stage}
        title="Edit how your knee felt"
        description="This changes your subjective check-in only. You do not need to repeat the sensor measurement."
      />
      <Card>
        <SectionTitle>Pain</SectionTitle>
        <Label>{pain}/10</Label>
        <View style={wireframeStyles.choiceGrid}>
          {[0, 2, 4, 6, 8, 10].map((value) => (
            <Choice key={value} label={String(value)} selected={pain === value} onPress={() => setPain(value)} />
          ))}
        </View>
      </Card>
      <Card>
        <SectionTitle>Stiffness</SectionTitle>
        <Label>{stiffness}/10</Label>
        <View style={wireframeStyles.choiceGrid}>
          {[0, 2, 4, 6, 8, 10].map((value) => (
            <Choice key={value} label={String(value)} selected={stiffness === value} onPress={() => setStiffness(value)} />
          ))}
        </View>
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
      <Button
        label="Save feelings"
        onPress={() => {
          saveFeelings(sessionId, checkpoint, { pain, stiffness, swelling });
          router.replace({ pathname: '/session/[sessionId]', params: { sessionId } });
        }}
      />
      <Button
        label="Cancel"
        onPress={() => router.back()}
        variant="text"
      />
    </Page>
  );
}
