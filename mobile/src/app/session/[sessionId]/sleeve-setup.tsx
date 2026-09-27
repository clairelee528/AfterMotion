import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Choice,
  Notice,
  Page,
  PageHeading,
  Progress,
  Row,
  SectionTitle,
  StatusTag,
  wireframeStyles,
} from '@/components/ui';
import { useSessionStore } from '@/state/session-store';

export default function SleeveSetupScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { setActivityStatus } = useSessionStore();
  const [mode, setMode] = useState<'demo' | 'manual' | 'bluetooth'>('demo');

  return (
    <Page>
      <Progress current={4} total={6} />
      <PageHeading
        eyebrow="Activity setup"
        title="Prepare the Motion Sleeve"
        highlight="READY TO MOVE"
        description="Choose how this prototype will record activity load."
      />
      <Card>
        <StatusTag
          label={mode === 'bluetooth' ? 'Not connected' : 'Ready'}
          tone={mode === 'bluetooth' ? 'error' : 'complete'}
        />
        <SectionTitle>Data source</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <Choice label="Demo" onPress={() => setMode('demo')} selected={mode === 'demo'} />
          <Choice label="Manual" onPress={() => setMode('manual')} selected={mode === 'manual'} />
          <Choice
            label="Bluetooth"
            onPress={() => setMode('bluetooth')}
            selected={mode === 'bluetooth'}
          />
        </View>
        <Row
          label="Motion Sleeve"
          value={mode === 'bluetooth' ? 'Not connected' : 'Ready'}
          icon="shirt-outline"
        />
      </Card>
      {mode === 'bluetooth' ? (
        <Notice
          title="Motion Sleeve not connected"
          body="Bluetooth hardware will be added later. Choose Demo or Manual to continue today."
          tone="error"
        />
      ) : null}
      <Button
        disabled={mode === 'bluetooth'}
        label="Start activity"
        onPress={() => {
          setActivityStatus(sessionId, 'active', 0);
          router.push({
            pathname: '/session/[sessionId]/activity',
            params: { sessionId },
          });
        }}
        variant="highlight"
      />
    </Page>
  );
}
