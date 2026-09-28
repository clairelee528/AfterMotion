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

function verifyFixturesAndSelectors() {
  const sessions = createDemoSessionFixtures();
  const active = sessions['demo-active'];
  const complete = sessions['demo-complete'];
  const partial = sessions['demo-ended-early'];

  assert.equal(Object.keys(sessions).length, 3);
  assert.equal(getSessionStage(active), 'activityPaused');
  assert.equal(getRecommendedAction(active), 'resumeActivity');
  assert.equal(getCheckpointStatus(active.recovery['0']), 'pending');

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

  const encoded = encodeSessionState(migrated);
  assert.equal(JSON.parse(encoded).schemaVersion, SESSION_SCHEMA_VERSION);
  assert.deepEqual(decodeSessionState(encoded), migrated);

  assert.throws(() => decodeSessionState('{broken json'));
  assert.throws(() =>
    decodeSessionState(JSON.stringify({ schemaVersion: 99, sessions: {} })),
  );
}

verifyFixturesAndSelectors();
verifyV1MigrationAndV2RoundTrip();
console.log('Session domain verification passed.');
