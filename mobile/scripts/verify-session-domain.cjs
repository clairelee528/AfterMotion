const assert = require('node:assert/strict');

const {
  createDemoSessionFixtures,
  DEMO_SAMPLE_RATE_HZ,
  getDemoActivityMetrics,
} = require('../.verification-build/data/demo-fixtures.js');
const {
  getCheckpointStatus,
  getClosedSessions,
  getCompletedRecoveryCount,
  getLatestClosedSession,
  getNextMissingSide,
  getNextSideAfterMeasurement,
  getRecommendedAction,
  getSessionStage,
  getSwellingSeries,
  getTemperatureSeries,
  isSessionComplete,
} = require('../.verification-build/domain/session-selectors.js');
const {
  decodeSessionState,
  encodeSessionState,
  SESSION_SCHEMA_VERSION,
} = require('../.verification-build/state/session-persistence.js');
const {
  getMeasurementTimerSnapshot,
} = require('../.verification-build/domain/measurement-timing.js');
const {
  MockMeasurementDataSource,
} = require('../.verification-build/data/mock-measurement-source.js');
const {
  saveMeasurementToSession,
  saveSymptomsToSession,
} = require('../.verification-build/domain/session-mutations.js');

function verifyFixturesAndSelectors() {
  const sessions = createDemoSessionFixtures();
  const active = sessions['demo-active'];
  const complete = sessions['demo-complete'];
  const partial = sessions['demo-ended-early'];

  assert.equal(Object.keys(sessions).length, 3);
  assert.equal(getSessionStage(active), 'activityPaused');
  assert.equal(getRecommendedAction(active), 'resumeActivity');
  assert.equal(getCheckpointStatus(active.recovery['0']), 'pending');
  assert.equal(getNextMissingSide(active.recovery['0']), 'left');
  assert.equal(getNextSideAfterMeasurement(active.recovery['0'], 'left'), 'right');
  assert.equal(getNextMissingSide(active.baseline), null);
  assert.equal(
    getCheckpointStatus({ ...active.baseline, symptomsRecordedAt: null }),
    'needsCheckIn',
  );

  assert.equal(isSessionComplete(complete), true);
  assert.equal(getCompletedRecoveryCount(complete), 5);
  assert.equal(getTemperatureSeries(complete, 'left').length, 6);
  assert.deepEqual(getSwellingSeries(complete), [1, 1, 1, 1, 1, 1]);

  assert.equal(isSessionComplete(partial), false);
  assert.equal(getSessionStage(partial), 'endedEarly');
  assert.equal(getCompletedRecoveryCount(partial), 2);

  assert.deepEqual(
    getClosedSessions(sessions).map((session) => session.id),
    ['demo-complete', 'demo-ended-early'],
  );
  assert.equal(getLatestClosedSession(sessions).id, 'demo-complete');

  const metrics = getDemoActivityMetrics(120);
  assert.equal(metrics.durationSeconds, 120);
  assert.equal(metrics.sampleCount, 120 * DEMO_SAMPLE_RATE_HZ);
}

function verifyV1MigrationAndV2RoundTrip() {
  const legacyState = {
    currentSessionId: 'legacy-1',
    sessions: {
      'legacy-1': {
        id: 'legacy-1',
        activityType: 'frisbee',
        injuredSide: 'right',
        source: 'mock',
        createdAt: '2026-09-20T01:00:00.000Z',
        baseline: {
          left: {
            recordedAt: '2026-09-20T01:01:00.000Z',
            stretchValue: 2400,
            temperatureCelsius: 33.2,
            pain: 4,
          },
          right: null,
          symptoms: { pain: 3, stiffness: 2, swelling: 'mild' },
        },
        activity: {
          status: 'planned',
          elapsedSeconds: 0,
          startedAt: null,
          endedAt: null,
        },
        recovery: {},
      },
    },
  };

  const migrated = decodeSessionState(JSON.stringify(legacyState));
  const session = migrated.sessions['legacy-1'];
  assert.equal(migrated.currentSessionId, 'legacy-1');
  assert.equal(session.measurementSource, 'mock');
  assert.equal(session.status, 'baseline');
  assert.equal(session.baseline.left.sessionId, 'legacy-1');
  assert.equal(session.baseline.left.side, 'left');
  assert.equal(session.baseline.left.checkpoint, 'baseline');
  assert.equal(session.baseline.symptoms.pain, 3);
  assert.equal(Object.keys(session.recovery).length, 5);

  session.baseline.left.quality = {
    bandTension: 'correct',
    stability: 'stable',
    temperatureStable: true,
  };

  const encoded = encodeSessionState(migrated);
  assert.equal(JSON.parse(encoded).schemaVersion, SESSION_SCHEMA_VERSION);
  assert.deepEqual(decodeSessionState(encoded), migrated);

  assert.throws(() => decodeSessionState('{broken json'));
  assert.throws(() =>
    decodeSessionState(JSON.stringify({ schemaVersion: 99, sessions: {} })),
  );
}

function verifyMeasurementTiming() {
  assert.deepEqual(getMeasurementTimerSnapshot(0, 8), {
    remainingSeconds: 8,
    progressPercent: 0,
    state: 'measuring',
  });
  assert.equal(getMeasurementTimerSnapshot(6, 8).state, 'stabilizing');
  assert.deepEqual(getMeasurementTimerSnapshot(8, 8), {
    remainingSeconds: 0,
    progressPercent: 100,
    state: 'complete',
  });
  assert.equal(getMeasurementTimerSnapshot(99, 8).remainingSeconds, 0);
}

async function verifyMockMeasurementSource() {
  const source = new MockMeasurementDataSource();
  await assert.rejects(() =>
    source.measure({ sessionId: 'source-test', checkpoint: '15', side: 'right' }),
  );
  await source.connect();
  const measurement = await source.measure({
    sessionId: 'source-test',
    checkpoint: '15',
    side: 'right',
  });
  assert.equal(measurement.sessionId, 'source-test');
  assert.equal(measurement.checkpoint, '15');
  assert.equal(measurement.side, 'right');
  assert.equal(measurement.source, 'mock');
  assert.equal(measurement.quality.bandTension, 'correct');
  await source.disconnect();
  await assert.rejects(() =>
    source.measure({ sessionId: 'source-test', checkpoint: '15', side: 'right' }),
  );
}

function verifySessionMutations() {
  const original = createDemoSessionFixtures()['demo-complete'];
  const previousRight = original.baseline.right;
  const previousSymptoms = original.baseline.symptoms;
  const previousSymptomsRecordedAt = original.baseline.symptomsRecordedAt;
  const replacementLeft = {
    ...original.baseline.left,
    id: 'replacement-left',
    recordedAt: '2026-09-28T01:00:00.000Z',
    stretchValue: 2501,
  };
  const afterRemeasure = saveMeasurementToSession(
    original,
    replacementLeft,
    '2026-09-28T01:00:01.000Z',
  );
  assert.equal(afterRemeasure.baseline.left.id, 'replacement-left');
  assert.equal(afterRemeasure.baseline.right, previousRight);
  assert.equal(afterRemeasure.baseline.symptoms, previousSymptoms);
  assert.equal(afterRemeasure.baseline.symptomsRecordedAt, previousSymptomsRecordedAt);

  const changedSymptoms = { pain: 5, stiffness: 4, swelling: 'moderate' };
  const afterCheckIn = saveSymptomsToSession(
    original,
    'baseline',
    changedSymptoms,
    '2026-09-28T01:05:00.000Z',
  );
  assert.equal(afterCheckIn.baseline.left, original.baseline.left);
  assert.equal(afterCheckIn.baseline.right, original.baseline.right);
  assert.deepEqual(afterCheckIn.baseline.symptoms, changedSymptoms);
  assert.equal(afterCheckIn.baseline.symptomsRecordedAt, '2026-09-28T01:05:00.000Z');

  assert.throws(() =>
    saveMeasurementToSession(original, {
      ...replacementLeft,
      sessionId: 'another-session',
    }),
  );
}

async function main() {
  verifyFixturesAndSelectors();
  verifyV1MigrationAndV2RoundTrip();
  verifyMeasurementTiming();
  verifySessionMutations();
  await verifyMockMeasurementSource();
  console.log('Session domain verification passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
