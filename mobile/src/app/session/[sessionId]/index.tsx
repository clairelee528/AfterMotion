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
import type { KneeSide } from '@/domain/models';
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

  const baselineComplete = Boolean(session.baseline.left && session.baseline.right);
  const activityInProgress =
    session.activity.status === 'active' || session.activity.status === 'paused';
  const activityComplete = session.activity.status === 'complete';
  const immediateRecovery = session.recovery['0'];
  const immediateComplete = Boolean(immediateRecovery?.left && immediateRecovery?.right);
  const recoveryCheckpoints = ['0', '15', '30', '45', '60'];
  const allRecoveryComplete = recoveryCheckpoints.every((checkpoint) => {
    const record = session.recovery[checkpoint];
    return Boolean(record?.left && record?.right);
  });
  const sessionComplete = baselineComplete && activityComplete && allRecoveryComplete;

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
    if (record?.left && record?.right) {
      router.push({
        pathname: '/session/[sessionId]/checkpoint',
        params: { sessionId, checkpoint },
      });
      return;
    }
    openMeasurement('recovery', record?.left ? 'right' : 'left', checkpoint);
  }

  const elapsedMinutes = Math.floor(session.activity.elapsedSeconds / 60);
  const nextAction = !baselineComplete
    ? 'Complete your pre-activity baseline'
    : !activityComplete
      ? activityInProgress
        ? 'Return to your activity recording'
        : 'Start your activity'
      : !immediateComplete
        ? 'Complete the post-activity check'
        : 'Continue recovery checks';

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
        status={baselineComplete ? 'Complete' : 'Needs measurements'}
        tone={baselineComplete ? 'complete' : 'active'}>
        <Row
          label="Status"
          value={baselineComplete ? 'Complete' : 'Needs measurements'}
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
        ) : (
          <Button
            label="Measure right knee"
            icon="scan-outline"
            onPress={() => openMeasurement('baseline', 'right', 'baseline')}
            variant="secondary"
          />
        )}
        {session.baseline.left || session.baseline.right ? (
          <Button
            label="Edit pre-activity feelings"
            icon="create-outline"
            onPress={() => editFeelings('baseline')}
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
          <Row label="Activity load" value="82 · High" icon="speedometer-outline" />
        ) : null}
        {activityInProgress ? (
          <Row
            label="Live samples"
            value={String(session.activity.elapsedSeconds * 50)}
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
          const complete = Boolean(record?.left && record?.right);
          const partiallyComplete = Boolean(record?.left || record?.right);
          const label = checkpoint === '0' ? 'Post activity' : `${checkpoint} min`;
          const status = complete
            ? 'Complete'
            : partiallyComplete
              ? '1 of 2 knees complete'
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
                  ? 'complete'
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
