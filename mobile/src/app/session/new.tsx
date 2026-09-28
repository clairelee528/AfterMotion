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
  SideBadge,
  StatusTag,
  wireframeStyles,
} from '@/components/ui';
import type { ActivityType, KneeSide, MeasurementSource } from '@/domain/models';
import { useSessionStore } from '@/state/session-store';
import { ActivityIcon, AppIcon } from '@/components/icons';

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
        highlight="NEW SESSION"
        description="These choices provide context for your baseline and recovery measurements."
      />
      <Card>
        <SectionTitle>Activity</SectionTitle>
        <View style={wireframeStyles.choiceGrid}>
          {activities.map((item) => (
            <Choice
              key={item.value}
              label={item.label}
              leading={<ActivityIcon activity={item.value} size={20} />}
              onPress={() => setActivity(item.value)}
              selected={activity === item.value}
            />
          ))}
        </View>
      </Card>
      <Card>
        <SectionTitle>Injured side</SectionTitle>
        <SideBadge side={injuredSide} injured />
        <View style={wireframeStyles.choiceGrid}>
          <Choice
            label="Left"
            leading={<AppIcon name="arrow-back-circle-outline" size={18} />}
            onPress={() => setInjuredSide('left')}
            selected={injuredSide === 'left'}
          />
          <Choice
            label="Right"
            leading={<AppIcon name="arrow-forward-circle-outline" size={18} />}
            onPress={() => setInjuredSide('right')}
            selected={injuredSide === 'right'}
          />
        </View>
      </Card>
      <Card>
        <SectionTitle>Measurement source</SectionTitle>
        <StatusTag
          label={source === 'bluetooth' ? 'Hardware selected' : source === 'manual' ? 'Manual entry' : 'Prototype data'}
          tone={source === 'bluetooth' ? 'warning' : 'info'}
        />
        <View style={wireframeStyles.choiceGrid}>
          <Choice
            label="Demo data"
            leading={<AppIcon name="flask-outline" size={18} />}
            onPress={() => setSource('mock')}
            selected={source === 'mock'}
          />
          <Choice
            label="Manual"
            leading={<AppIcon name="create-outline" size={18} />}
            onPress={() => setSource('manual')}
            selected={source === 'manual'}
          />
          <Choice
            label="Bluetooth"
            leading={<AppIcon name="bluetooth-outline" size={18} />}
            onPress={() => setSource('bluetooth')}
            selected={source === 'bluetooth'}
          />
        </View>
      </Card>
      <Button
        label="Create session"
        icon="add-circle-outline"
        onPress={() => {
          const sessionId = createSession({
            activityType: activity,
            injuredSide,
            measurementSource: source,
          });
          router.replace({
            pathname: '/session/[sessionId]',
            params: { sessionId },
          });
        }}
        variant="highlight"
      />
    </Page>
  );
}
