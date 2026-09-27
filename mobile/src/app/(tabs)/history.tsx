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
import { formatDuration } from '@/utils/format';

const activityNames: Record<string, string> = {
  badminton: 'Badminton',
  frisbee: 'Frisbee',
  gym: 'Gym',
  other: 'Other',
  running: 'Running',
  tennis: 'Tennis',
};

export default function HistoryScreen() {
  const { sessions } = useSessionStore();
  const savedSessions = Object.values(sessions)
    .filter((session) => session.closedAt)
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));

  return (
    <Page>
      <PageHeading
        eyebrow="History"
        title="Your recovery over time"
        highlight="BUILD YOUR PATTERN"
        description="Compare your knee response under similar activity loads."
      />
      <Notice
        title="Personal baseline in progress"
        body="Complete more sessions to build your typical response and recovery range."
        tone="info"
      />

      {savedSessions.length > 0 ? (
        savedSessions.map((session) => {
          const completeChecks = Object.values(session.recovery).filter(
            (record) => record.left && record.right,
          ).length;
          return (
            <Card key={session.id} variant="hero">
              <StatusTag
                label={session.endedEarly ? 'Ended early' : 'Complete'}
                tone={session.endedEarly ? 'warning' : 'complete'}
              />
              <ActivityBadge
                activity={session.activityType}
                label={activityNames[session.activityType]}
              />
              <Row label="Duration" value={formatDuration(session.activity.elapsedSeconds)} icon="time-outline" />
              <Row label="Recovery checks" value={`${completeChecks} / 5`} icon="checkmark-done-circle-outline" />
              <Row
                label="Saved"
                value={new Date(session.closedAt ?? session.createdAt).toLocaleDateString()}
                icon="calendar-outline"
              />
              <Button
                label="Open session summary"
                icon="analytics-outline"
                onPress={() =>
                  router.push({
                    pathname: '/session/[sessionId]/summary',
                    params: { sessionId: session.id },
                  })
                }
                variant="secondary"
              />
            </Card>
          );
        })
      ) : (
        <Card variant="muted">
          <SectionTitle>No completed sessions yet</SectionTitle>
          <Row
            label="What appears here"
            value="Completed and ended sessions"
            icon="archive-outline"
          />
          <Button label="Return to Training" onPress={() => router.push('/')} variant="secondary" />
        </Card>
      )}
    </Page>
  );
}
