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
import {
  getCompletedRecoveryCount,
  getLatestClosedSession,
  getRecommendedAction,
  getSessionStage,
} from '@/domain/session-selectors';
import { useSessionStore } from '@/state/session-store';

const stageLabels = {
  completeBaseline: 'Complete pre-activity baseline',
  startActivity: 'Ready to start activity',
  resumeActivity: 'Return to activity recording',
  completePostActivity: 'Waiting for post-activity check',
  continueRecovery: 'Continue recovery checks',
  completeSession: 'Ready to complete session',
  viewSummary: 'Session complete',
} as const;

export default function TrainingScreen() {
  const { currentSession, hydrated, sessions } = useSessionStore();
  const recentSession = getLatestClosedSession(sessions);
  const activityLabel = currentSession
    ? currentSession.activityType.charAt(0).toUpperCase() + currentSession.activityType.slice(1)
    : '';
  const sessionStage = currentSession ? getSessionStage(currentSession) : null;
  const currentStage = currentSession
    ? stageLabels[getRecommendedAction(currentSession)]
    : '';

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
              sessionStage === 'activityActive'
                ? 'Activity live'
                : sessionStage === 'activityPaused'
                  ? 'Activity paused'
                  : 'Session in progress'
            }
            tone={sessionStage === 'activityActive' ? 'active' : 'pending'}
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

      {recentSession ? (
        <Card>
          <StatusTag
            label={recentSession.endedEarly ? 'Ended early' : 'Complete'}
            tone={recentSession.endedEarly ? 'warning' : 'complete'}
          />
          <SectionTitle>Recent session</SectionTitle>
          <ActivityBadge
            activity={recentSession.activityType}
            label={
              recentSession.activityType.charAt(0).toUpperCase() +
              recentSession.activityType.slice(1)
            }
          />
          <Row
            label="Load"
            value={
              recentSession.activity.metrics
                ? `${recentSession.activity.metrics.loadLevel} · ${recentSession.activity.metrics.loadIndex}`
                : 'Not calculated'
            }
            icon="speedometer-outline"
          />
          <Row
            label="Recovery checks"
            value={`${getCompletedRecoveryCount(recentSession)} / 5`}
            icon="checkmark-done-circle-outline"
          />
          <Button
            label="View summary"
            icon="analytics-outline"
            onPress={() =>
              router.push({
                pathname: '/session/[sessionId]/summary',
                params: { sessionId: recentSession.id },
              })
            }
            variant="secondary"
          />
        </Card>
      ) : null}
    </Page>
  );
}
