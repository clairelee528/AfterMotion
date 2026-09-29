import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  ActivityBadge,
  Button,
  Card,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  StageCard,
  TimelineItem,
} from '@/components/ui';
import { recoveryCheckpoints, type KneeSide } from '@/domain/models';
import {
  areAllRecoveryCheckpointsComplete,
  getCheckpointStatus,
  getNextMissingSide,
  getRecommendedAction,
  isActivityInProgress,
  isBaselineComplete,
  isSessionComplete,
} from '@/domain/session-selectors';
import {
  assessRecoveryCheckpoint,
  getRecoveryRangeLabel,
} from '@/domain/recovery-status';
import { useSessionStore } from '@/state/session-store';
import { formatTemperature } from '@/utils/format';

const activityNames: Record<string, string> = {
  badminton: 'Badminton',
  frisbee: 'Frisbee',
  gym: 'Gym',
  other: 'Other',
  running: 'Running',
  tennis: 'Tennis',
};

const recommendedActionLabels = {
  completeBaseline: 'Complete your pre-activity baseline',
  startActivity: 'Start your activity',
  resumeActivity: 'Return to your activity recording',
  completePostActivity: 'Complete the post-activity check',
  continueRecovery: 'Continue recovery checks',
  completeSession: 'Complete this session',
  viewSummary: 'View your session summary',
} as const;

export default function SessionOverviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { endSession, hydrated, sessions } = useSessionStore();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const session = sessions[sessionId];

  if (!session) {
    return (
      <Page>
        <PageHeading
          eyebrow="Session overview"
          title={hydrated ? 'Session not found' : 'Restoring session'}
          description={
            hydrated
              ? 'This session is no longer stored on this device.'
              : 'Loading your locally saved progress.'
          }
        />
        {hydrated ? <Button label="Return to Training" onPress={() => router.dismissTo('/')} /> : null}
      </Page>
    );
  }

  const baselineComplete = isBaselineComplete(session);
  const activityInProgress = isActivityInProgress(session);
  const activityComplete = session.activity.status === 'complete';
  const allRecoveryComplete = areAllRecoveryCheckpointsComplete(session);
  const sessionComplete = isSessionComplete(session);

  function openMeasurement(phase: 'baseline' | 'recovery', side: KneeSide, checkpoint: string) {
    router.push({
      pathname: '/session/[sessionId]/measurement',
      params: { sessionId, phase, side, checkpoint },
    });
  }

  function editFeelings(checkpoint: string) {
    router.push({
      pathname: '/session/[sessionId]/feelings',
      params: { sessionId, checkpoint },
    });
  }

  function openCheckpoint(checkpoint: string) {
    const record = session.recovery[checkpoint];
    const checkpointStatus = getCheckpointStatus(record);
    if (checkpointStatus === 'complete') {
      router.push({
        pathname: '/session/[sessionId]/checkpoint',
        params: { sessionId, checkpoint },
      });
      return;
    }
    if (checkpointStatus === 'needsCheckIn') {
      router.push({
        pathname: '/session/[sessionId]/feelings',
        params: { sessionId, checkpoint, returnTo: 'checkpoint' },
      });
      return;
    }
    openMeasurement('recovery', getNextMissingSide(record) ?? 'left', checkpoint);
  }

  const elapsedMinutes = Math.floor(session.activity.elapsedSeconds / 60);
  const nextAction = recommendedActionLabels[getRecommendedAction(session)];
  const baselineStatus = getCheckpointStatus(session.baseline);

  return (
    <Page>
      <PageHeading
        eyebrow="Current session"
        title={`${activityNames[session.activityType]} · Today`}
        highlight={activityInProgress ? 'ACTIVITY LIVE' : undefined}
        description="Choose the stage you need. You can leave the app and continue here later."
      />
      <ActivityBadge activity={session.activityType} label={activityNames[session.activityType]} />

      <Notice title="Next recommended action" body={nextAction} tone="info" />

      <StageCard
        number={1}
        title="Before activity"
        status={
          baselineComplete
            ? 'Complete'
            : baselineStatus === 'needsCheckIn'
              ? 'Check-in needed'
              : 'Needs measurements'
        }
        tone={baselineComplete ? 'complete' : 'active'}>
        <Row
          label="Status"
          value={
            baselineComplete
              ? 'Complete'
              : baselineStatus === 'needsCheckIn'
                ? 'Check-in needed'
                : 'Needs measurements'
          }
          icon={baselineComplete ? 'checkmark-circle-outline' : 'ellipse-outline'}
        />
        {session.baseline.left ? (
          <Row
            label="Left knee"
            value={`${formatTemperature(session.baseline.left.temperatureCelsius)} · Recorded`}
            icon="arrow-back-circle-outline"
          />
        ) : (
          <Button
            label="Measure left knee"
            icon="scan-outline"
            onPress={() => openMeasurement('baseline', 'left', 'baseline')}
            variant="secondary"
          />
        )}
        {session.baseline.right ? (
          <Row
            label="Right knee"
            value={`${formatTemperature(session.baseline.right.temperatureCelsius)} · Recorded`}
            icon="arrow-forward-circle-outline"
          />
        ) : session.baseline.left ? (
          <Button
            label="Measure right knee"
            icon="scan-outline"
            onPress={() => openMeasurement('baseline', 'right', 'baseline')}
            variant="secondary"
          />
        ) : (
          <Row
            label="Right knee"
            value="Available after left knee"
            icon="lock-closed-outline"
          />
        )}
        {session.baseline.left || session.baseline.right ? (
          <Button
            label={
              session.baseline.symptomsRecordedAt
                ? 'Edit pre-activity feelings'
                : 'Record pre-activity feelings'
            }
            icon="create-outline"
            onPress={() => editFeelings('baseline')}
            variant="secondary"
          />
        ) : null}
        {baselineComplete ? (
          <Button
            label="View baseline results"
            icon="analytics-outline"
            onPress={() =>
              router.push({
                pathname: '/session/[sessionId]/checkpoint',
                params: { sessionId, checkpoint: 'baseline' },
              })
            }
            variant="secondary"
          />
        ) : null}
      </StageCard>

      <StageCard
        number={2}
        title="Activity"
        status={
          activityComplete
            ? 'Complete'
            : session.activity.status === 'paused'
              ? 'Paused'
              : activityInProgress
                ? 'In progress'
                : 'Not started'
        }
        tone={activityComplete ? 'complete' : activityInProgress ? 'active' : 'pending'}>
        <Row
          label="Status"
          icon="pulse-outline"
          value={
            activityComplete
              ? `Complete · ${elapsedMinutes} min`
              : session.activity.status === 'paused'
                ? `Paused · ${elapsedMinutes} min`
                : activityInProgress
                  ? `In progress · ${elapsedMinutes} min`
                  : 'Not started'
          }
        />
        {activityComplete ? (
          <Row
            label="Activity load"
            value={
              session.activity.metrics
                ? `${session.activity.metrics.loadIndex} · ${session.activity.metrics.loadLevel}`
                : 'Not calculated'
            }
            icon="speedometer-outline"
          />
        ) : null}
        {activityInProgress ? (
          <Row
            label="Live samples"
            value={String(session.activity.sampleCount)}
            icon="pulse-outline"
          />
        ) : null}
        <Button
          disabled={!baselineComplete}
          label={
            activityComplete
              ? 'View completed activity'
              : activityInProgress
                ? 'Return to activity'
                : 'Set up activity'
          }
          icon={activityComplete ? 'analytics-outline' : activityInProgress ? 'play-circle-outline' : 'shirt-outline'}
          onPress={() =>
            router.push({
              pathname: activityComplete
                ? '/session/[sessionId]/activity-summary'
                : activityInProgress
                  ? '/session/[sessionId]/activity'
                  : '/session/[sessionId]/sleeve-setup',
              params: { sessionId },
            })
          }
          variant="secondary"
        />
      </StageCard>

      <StageCard
        number={3}
        title="After activity"
        status={allRecoveryComplete ? 'Complete' : activityComplete ? 'In progress' : 'Locked'}
        tone={allRecoveryComplete ? 'complete' : activityComplete ? 'active' : 'pending'}>
        {recoveryCheckpoints.map((checkpoint) => {
          const record = session.recovery[checkpoint];
          const checkpointStatus = getCheckpointStatus(record);
          const complete = checkpointStatus === 'complete';
          const partiallyComplete = checkpointStatus === 'partial';
          const recoveryAssessment = assessRecoveryCheckpoint(session, checkpoint);
          const label = checkpoint === '0' ? 'Post activity' : `${checkpoint} min`;
          const status = complete
            ? getRecoveryRangeLabel(recoveryAssessment.status)
            : checkpointStatus === 'needsCheckIn'
              ? 'Check-in needed'
              : partiallyComplete
              ? `${record.left ? 'Left' : 'Right'} knee complete`
              : activityComplete
                ? 'Pending'
                : 'Locked';
          return (
            <TimelineItem
              key={checkpoint}
              disabled={!activityComplete}
              label={label}
              status={status}
              tone={
                complete
                  ? recoveryAssessment.status === 'withinBaselineRange'
                    ? 'complete'
                    : recoveryAssessment.status === 'aboveBaselineRange'
                      ? 'warning'
                      : 'info'
                  : checkpointStatus === 'needsCheckIn'
                    ? 'active'
                    : partiallyComplete
                    ? 'active'
                    : activityComplete
                      ? 'pending'
                      : 'pending'
              }
              onPress={() => openCheckpoint(checkpoint)}
            />
          );
        })}
      </StageCard>

      {confirmEnd ? (
        <Card>
          <SectionTitle>{sessionComplete ? 'Complete this session?' : 'End this session early?'}</SectionTitle>
          <Notice
            title="Your recorded data will be kept"
            body="The session will leave the Training home. Measurements already saved on this device will not be deleted."
            tone="warning"
          />
          <Button
            label={sessionComplete ? 'Complete session' : 'End session early'}
            onPress={() => {
              endSession(sessionId, !sessionComplete);
              router.dismissTo('/');
            }}
          />
          <Button label="Keep session open" onPress={() => setConfirmEnd(false)} variant="secondary" />
        </Card>
      ) : (
        <Button
            label={sessionComplete ? 'Complete session' : 'End current session'}
          icon="stop-circle-outline"
          onPress={() => setConfirmEnd(true)}
          variant="danger"
        />
      )}
    </Page>
  );
}
