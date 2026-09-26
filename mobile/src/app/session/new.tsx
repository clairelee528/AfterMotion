import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Choice,
  Page,
  PageHeading,
  SectionTitle,
  wireframeStyles,
} from '@/components/wireframe';
import type { ActivityType, KneeSide, MeasurementSource } from '@/domain/models';
import { useSessionStore } from '@/state/session-store';

const activities: { label: string; value: ActivityType }[] = [
  { label: 'Frisbee', value: 'frisbee' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Tennis', value: 'tennis' },
  { label: 'Running', value: 'running' },
  { label: 'Gym', value: 'gym' },
  { label: 'Other', value: 'other' },
];

export default function NewSessionScreen() {
  const { createSession } = useSessionStore();
  const [activity, setActivity] = useState<ActivityType>('frisbee');
  const [injuredSide, setInjuredSide] = useState<KneeSide>('right');
  const [source, setSource] = useState<MeasurementSource>('mock');

  return (
    <Page>
      <PageHeading
        eyebrow="Setup · 1 of 2"
        title="Plan this session"
        description="These choices provide context for your baseline and recovery measurements."
      />
      <Card>
        <SectionTitle>Activity</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          {activities.map((item) => (
            <Choice
              key={item.value}
              label={item.label}
              onPress={() => setActivity(item.value)}
              selected={activity === item.value}
            />
          ))}
        </View>
      </Card>
      <Card>
        <SectionTitle>Injured side</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <Choice
            label="Left"
            onPress={() => setInjuredSide('left')}
            selected={injuredSide === 'left'}
          />
          <Choice
            label="Right"
            onPress={() => setInjuredSide('right')}
            selected={injuredSide === 'right'}
          />
        </View>
      </Card>
      <Card>
        <SectionTitle>Measurement source</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          <Choice
            label="Demo data"
            onPress={() => setSource('mock')}
            selected={source === 'mock'}
          />
          <Choice
            label="Manual"
            onPress={() => setSource('manual')}
            selected={source === 'manual'}
          />
          <Choice
            label="Bluetooth"
            onPress={() => setSource('bluetooth')}
            selected={source === 'bluetooth'}
          />
        </View>
      </Card>
      <Button
        label="Create session"
        onPress={() => {
          const sessionId = createSession({
            activityType: activity,
            injuredSide,
            source,
          });
          router.replace({
            pathname: '/session/[sessionId]',
            params: { sessionId },
          });
        }}
      />
    </Page>
  );
}
