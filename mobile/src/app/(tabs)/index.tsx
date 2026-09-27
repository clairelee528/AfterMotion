import { router } from 'expo-router';

import {
  ActivityBadge,
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  StatusTag,
} from '@/components/ui';
import { useSessionStore } from '@/state/session-store';

export default function TrainingScreen() {
  const { currentSession, hydrated } = useSessionStore();
  const activityLabel = currentSession
    ? currentSession.activityType.charAt(0).toUpperCase() + currentSession.activityType.slice(1)
    : '';
  const currentStage = !currentSession
    ? ''
    : currentSession.activity.status === 'active'
      ? 'Activity in progress'
      : currentSession.activity.status === 'paused'
        ? 'Activity paused'
        : currentSession.activity.status === 'complete'
          ? 'Waiting for post-activity check'
          : currentSession.baseline.left && currentSession.baseline.right
            ? 'Ready to start activity'
            : 'Complete pre-activity baseline';

  return (
    <Page>
      <PageHeading
        eyebrow="Training"
        title="How is your knee responding?"
        highlight="RECOVERY IN MOTION"
        description="Create a session to connect activity load with your post-activity response."
      />

      {currentSession ? (
        <Card variant="hero">
          <StatusTag
            label={
              currentSession.activity.status === 'active'
                ? 'Activity live'
                : currentSession.activity.status === 'paused'
                  ? 'Activity paused'
                  : 'Session in progress'
            }
            tone={currentSession.activity.status === 'active' ? 'active' : 'pending'}
          />
          <SectionTitle>Session in progress</SectionTitle>
          <ActivityBadge activity={currentSession.activityType} label={activityLabel} />
          <Row label="Current stage" value={currentStage} icon="navigate-circle-outline" />
          <Row label="Saved locally" value="Available after reopening the app" icon="phone-portrait-outline" />
          <Button
            label="Continue current session"
            icon="arrow-forward-circle-outline"
            onPress={() => router.push(`/session/${currentSession.id}`)}
            variant="highlight"
          />
        </Card>
      ) : hydrated ? (
        <Notice title="No session in progress" body="Create a session when you are ready to train." />
      ) : (
        <Notice title="Loading session" body="Restoring your locally saved progress." />
      )}

      <SectionTitle>Create a new session</SectionTitle>
      <Button
        label="Start new session"
        icon="add-circle-outline"
        onPress={() => router.push('/session/new')}
        variant="secondary"
      />

      <Notice
        title="Prototype mode"
        body="Day 2 uses demo measurements. Bluetooth hardware will be connected later without changing this workflow."
        tone="info"
      />

      <Card>
        <StatusTag label="Complete" tone="complete" />
        <SectionTitle>Recent session</SectionTitle>
        <ActivityBadge activity="frisbee" label="Frisbee" />
        <Row label="Load" value="High · 82" icon="speedometer-outline" />
        <Row label="Recovery" value="48 min" icon="time-outline" />
        <Button
          label="View summary"
          icon="analytics-outline"
          onPress={() => router.push('/session/demo-previous/summary')}
          variant="secondary"
        />
      </Card>
    </Page>
  );
}
