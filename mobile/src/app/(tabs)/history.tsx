import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  ActivityBadge,
  Button,
  Card,
  Choice,
  MetricTile,
  Notice,
  Page,
  PageHeading,
  Row,
  SectionTitle,
  StatusTag,
  wireframeStyles,
} from '@/components/ui';
import { getClosedSessions, getCompletedRecoveryCount } from '@/domain/session-selectors';
import { getRecoveryTime, getRecoveryTimeLabel } from '@/domain/recovery-status';
import {
  selectHistorySessions,
  type HistoryActivityFilter,
  type HistorySortOrder,
  type HistoryStatusFilter,
} from '@/domain/history-selectors';
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

const activityFilters: { label: string; value: HistoryActivityFilter }[] = [
  { label: 'All activities', value: 'all' },
  { label: 'Frisbee', value: 'frisbee' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Tennis', value: 'tennis' },
  { label: 'Running', value: 'running' },
  { label: 'Gym', value: 'gym' },
  { label: 'Other', value: 'other' },
];

const statusFilters: { label: string; value: HistoryStatusFilter }[] = [
  { label: 'All records', value: 'all' },
  { label: 'Complete', value: 'complete' },
  { label: 'Ended early', value: 'endedEarly' },
];

export default function HistoryScreen() {
  const { sessions } = useSessionStore();
  const savedSessions = getClosedSessions(sessions);
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('latest');
  const [activityFilter, setActivityFilter] =
    useState<HistoryActivityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const filteredSessions = selectHistorySessions(savedSessions, {
    activity: activityFilter,
    status: statusFilter,
    sortOrder,
  });

  function resetFilters() {
    setActivityFilter('all');
    setStatusFilter('all');
    setSortOrder('latest');
  }

  function toggleComparisonSelection(sessionId: string) {
    setSelectedSessionIds((current) => {
      if (current.includes(sessionId)) {
        return current.filter((id) => id !== sessionId);
      }
      if (current.length >= 2) return current;
      const selectedActivity = current[0]
        ? sessions[current[0]]?.activityType
        : null;
      const nextActivity = sessions[sessionId]?.activityType;
      if (selectedActivity && nextActivity !== selectedActivity) return current;
      return [...current, sessionId];
    });
  }

  const firstSelectedSession = selectedSessionIds[0]
    ? sessions[selectedSessionIds[0]]
    : null;
  const hasComparablePair = savedSessions.some((session, index) =>
    savedSessions
      .slice(index + 1)
      .some((candidate) => candidate.activityType === session.activityType),
  );
  const compatibleSessionCount = firstSelectedSession
    ? savedSessions.filter(
        (session) =>
          session.id !== firstSelectedSession.id &&
          session.activityType === firstSelectedSession.activityType,
      ).length
    : 0;

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
        <>
          <Card variant="muted">
            <SectionTitle>Filter by activity</SectionTitle>
            <View style={wireframeStyles.choiceGrid}>
              {activityFilters.map((filter) => (
                <Choice
                  key={filter.value}
                  label={filter.label}
                  selected={activityFilter === filter.value}
                  onPress={() => setActivityFilter(filter.value)}
                />
              ))}
            </View>
            <SectionTitle>Record status</SectionTitle>
            <View style={wireframeStyles.choiceGrid}>
              {statusFilters.map((filter) => (
                <Choice
                  key={filter.value}
                  label={filter.label}
                  selected={statusFilter === filter.value}
                  onPress={() => setStatusFilter(filter.value)}
                />
              ))}
            </View>
            <SectionTitle>Sort sessions</SectionTitle>
            <View style={wireframeStyles.choiceGrid}>
              <Choice
                label="Latest first"
                selected={sortOrder === 'latest'}
                onPress={() => setSortOrder('latest')}
              />
              <Choice
                label="Earliest first"
                selected={sortOrder === 'earliest'}
                onPress={() => setSortOrder('earliest')}
              />
            </View>
            <Row
              label="Matching sessions"
              value={String(filteredSessions.length)}
              icon="filter-outline"
            />
          </Card>

          <Card>
            <StatusTag
              label={`${selectedSessionIds.length} of 2 selected`}
              tone={selectedSessionIds.length === 2 ? 'complete' : 'active'}
            />
            <SectionTitle>Compare two sessions</SectionTitle>
            <Notice
              title={
                firstSelectedSession && compatibleSessionCount === 0
                  ? `No other ${activityNames[firstSelectedSession.activityType]} session yet`
                  : hasComparablePair
                    ? 'Choose the same activity type'
                    : 'No comparable pair yet'
              }
              body={
                firstSelectedSession
                  ? compatibleSessionCount === 0
                    ? 'Complete another session with this activity, or remove the current selection and choose an activity with multiple records.'
                    : `Choose one more ${activityNames[firstSelectedSession.activityType]} session, or remove the current selection.`
                  : hasComparablePair
                    ? 'Select two history cards below. The earlier and latest order will be determined automatically.'
                    : 'Complete the same activity at least twice to unlock a session comparison.'
              }
              tone="info"
            />
            {selectedSessionIds.map((selectedId, index) => {
              const selectedSession = sessions[selectedId];
              if (!selectedSession) return null;
              return (
                <Row
                  key={selectedId}
                  label={index === 0 ? 'First selection' : 'Second selection'}
                  value={`${activityNames[selectedSession.activityType]} · ${new Date(
                    selectedSession.closedAt ?? selectedSession.createdAt,
                  ).toLocaleDateString()}`}
                  icon="checkmark-circle-outline"
                />
              );
            })}
            <Button
              disabled={selectedSessionIds.length !== 2}
              label="Compare selected sessions"
              icon="git-compare-outline"
              onPress={() =>
                router.push({
                  pathname: '/history/compare',
                  params: {
                    earlierId: selectedSessionIds[0],
                    latestId: selectedSessionIds[1],
                  },
                })
              }
              variant="highlight"
            />
            {selectedSessionIds.length > 0 ? (
              <Button
                label="Clear comparison selection"
                icon="close-circle-outline"
                onPress={() => setSelectedSessionIds([])}
                variant="secondary"
              />
            ) : null}
          </Card>

          {filteredSessions.length === 0 ? (
            <Card variant="muted">
              <SectionTitle>No sessions match these filters</SectionTitle>
              <Notice
                title="Your history is still saved"
                body="Change or reset the filters to show other completed sessions."
                tone="info"
              />
              <Button
                label="Reset filters"
                icon="refresh-outline"
                onPress={resetFilters}
                variant="secondary"
              />
            </Card>
          ) : null}

          {filteredSessions.map((session) => {
            const completeChecks = getCompletedRecoveryCount(session);
            const metrics = session.activity.metrics;
            const recoveryTime = getRecoveryTime(session);
            const savedAt = new Date(session.closedAt ?? session.createdAt);
            const selectedForComparison = selectedSessionIds.includes(session.id);
            const incompatibleActivity = Boolean(
              firstSelectedSession &&
                firstSelectedSession.activityType !== session.activityType,
            );
            const comparisonSelectionFull =
              selectedSessionIds.length >= 2 && !selectedForComparison;
            const hasMatchingPeer = savedSessions.some(
              (candidate) =>
                candidate.id !== session.id &&
                candidate.activityType === session.activityType,
            );
            const noMatchingPeer = !selectedForComparison && !hasMatchingPeer;
            return (
              <Card key={session.id} variant="hero">
                <StatusTag
                  label={session.endedEarly ? 'Ended early · Partial data' : 'Complete session'}
                  tone={session.endedEarly ? 'warning' : 'complete'}
                />
                <ActivityBadge
                  activity={session.activityType}
                  label={activityNames[session.activityType]}
                />
                <Row
                  label="Saved"
                  value={`${savedAt.toLocaleDateString()} · ${savedAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
                  icon="calendar-outline"
                />
                <View style={wireframeStyles.choiceGrid}>
                  <MetricTile
                    label="Activity load"
                    value={metrics ? String(metrics.loadIndex) : '—'}
                    unit={metrics ? metrics.loadLevel : undefined}
                    highlighted
                  />
                  <MetricTile
                    label="Recovery time"
                    value={getRecoveryTimeLabel(recoveryTime)}
                  />
                </View>
                <Row
                  label="Duration"
                  value={formatDuration(session.activity.elapsedSeconds)}
                  icon="time-outline"
                />
                <Row
                  label="Recovery checks"
                  value={`${completeChecks} / 5`}
                  icon="checkmark-done-circle-outline"
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
                <Button
                  disabled={
                    incompatibleActivity || comparisonSelectionFull || noMatchingPeer
                  }
                  label={
                    selectedForComparison
                      ? 'Remove from comparison'
                      : incompatibleActivity
                        ? `Choose another ${activityNames[firstSelectedSession!.activityType]} session`
                        : comparisonSelectionFull
                          ? 'Two sessions already selected'
                          : noMatchingPeer
                            ? `No matching ${activityNames[session.activityType]} session`
                          : 'Select for comparison'
                  }
                  icon={selectedForComparison ? 'close-circle-outline' : 'git-compare-outline'}
                  onPress={() => toggleComparisonSelection(session.id)}
                  variant={selectedForComparison ? 'highlight' : 'secondary'}
                />
              </Card>
            );
          })}
        </>
      ) : (
        <Card variant="muted">
          <SectionTitle>No completed sessions yet</SectionTitle>
          <Row
            label="What appears here"
            value="Completed and ended sessions"
            icon="archive-outline"
          />
          <Button
            label="Start your first session"
            icon="add-circle-outline"
            onPress={() => router.push('/session/new')}
            variant="highlight"
          />
        </Card>
      )}
    </Page>
  );
}
