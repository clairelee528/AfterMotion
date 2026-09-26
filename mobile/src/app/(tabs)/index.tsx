import { router } from 'expo-router';

import {
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
} from '@/components/wireframe';
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
        description="Create a session to connect activity load with your post-activity response."
      />

      {currentSession ? (
        <Card>
          <SectionTitle>Session in progress</SectionTitle>
          <Row label="Activity" value={activityLabel} />
          <Row label="Current stage" value={currentStage} />
          <Row label="Saved locally" value="Available after reopening the app" />
          <Button
            label="Continue current session"
            onPress={() => router.push(`/session/${currentSession.id}`)}
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
        onPress={() => router.push('/session/new')}
        variant="secondary"
      />

      <Notice
        title="Prototype mode"
        body="Day 2 uses demo measurements. Bluetooth hardware will be connected later without changing this workflow."
      />

      <Card>
        <SectionTitle>Recent session</SectionTitle>
        <Row label="Activity" value="Frisbee" />
        <Row label="Load" value="High · 82" />
        <Row label="Recovery" value="48 min" />
        <Button
          label="View summary"
          onPress={() => router.push('/session/demo-previous/summary')}
          variant="secondary"
        />
      </Card>
    </Page>
  );
}
