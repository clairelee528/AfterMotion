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
  createMockActivitySample,
  MockActivityDataSource,
} = require('../.verification-build/data/mock-activity-source.js');
const {
  saveMeasurementToSession,
  saveSymptomsToSession,
} = require('../.verification-build/domain/session-mutations.js');
const {
  finishActivityRecord,
  getActivityElapsedSeconds,
  pauseActivityRecord,
  startActivityRecord,
} = require('../.verification-build/domain/activity-transitions.js');
const {
  ActivitySignalProcessor,
} = require('../.verification-build/domain/activity-processing.js');
const {
  calculateActivityMetrics,
  getActivityLoadLevel,
} = require('../.verification-build/domain/activity-load.js');

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
          sampleCount: 0,
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
  assert.equal(session.activity.sampleCount, 0);
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

async function verifyMockActivitySource() {
  let nowMs = 1_000;
  let scheduledCallback = null;
  let scheduledIntervalMs = null;
  const scheduler = {
    now: () => nowMs,
    setInterval(callback, intervalMs) {
      scheduledCallback = callback;
      scheduledIntervalMs = intervalMs;
      return callback;
    },
    clearInterval(handle) {
      if (scheduledCallback === handle) scheduledCallback = null;
    },
  };
  const source = new MockActivityDataSource(scheduler);
  const samples = [];

  await assert.rejects(() => source.start((sample) => samples.push(sample)));
  await source.connect();
  assert.equal(source.isConnected, true);
  await source.start((sample) => samples.push(sample));
  assert.equal(source.isRunning, true);
  assert.equal(scheduledIntervalMs, 100);
  await assert.rejects(() => source.start(() => {}));

  scheduledCallback();
  assert.equal(samples.length, 5);
  assert.deepEqual(
    samples.map((sample) => sample.timestampMs),
    [1_000, 1_020, 1_040, 1_060, 1_080],
  );
  assert.deepEqual(samples[0], createMockActivitySample(0, 1_000));
  assert.equal(source.sampleCount, 5);

  await source.stop();
  assert.equal(source.isRunning, false);
  assert.equal(scheduledCallback, null);

  nowMs = 2_000;
  await source.start((sample) => samples.push(sample));
  scheduledCallback();
  assert.equal(samples.length, 10);
  assert.equal(samples[5].timestampMs, 2_000);
  assert.deepEqual(samples[5], createMockActivitySample(5, 2_000));

  await source.disconnect();
  assert.equal(source.isConnected, false);
  assert.equal(source.isRunning, false);
  await assert.rejects(() => source.start(() => {}));
}

function verifyActivitySignalProcessing() {
  const firstProcessor = new ActivitySignalProcessor();
  const secondProcessor = new ActivitySignalProcessor();
  for (let index = 0; index < 1_500; index += 1) {
    const sample = createMockActivitySample(index, index * 20);
    firstProcessor.addSample(sample);
    secondProcessor.addSample(sample);
  }

  const features = firstProcessor.getFeatures();
  assert.deepEqual(features, secondProcessor.getFeatures());
  assert.equal(features.sampleCount, 1_500);
  assert.ok(features.movementIntensity > 0);
  assert.ok(features.accelerationPeakCount > 0);
  assert.ok(features.decelerationEventCount > 0);
  assert.ok(features.impactLikeEventCount > 0);

  const stationaryProcessor = new ActivitySignalProcessor();
  for (let index = 0; index < 500; index += 1) {
    stationaryProcessor.addSample({
      timestampMs: index * 20,
      accelerationX: 0,
      accelerationY: 0,
      accelerationZ: 1,
      gyroscopeX: 0,
      gyroscopeY: 0,
      gyroscopeZ: 0,
    });
  }
  assert.deepEqual(stationaryProcessor.getFeatures(), {
    sampleCount: 500,
    movementIntensity: 0,
    accelerationPeakCount: 0,
    decelerationEventCount: 0,
    impactLikeEventCount: 0,
  });
}

function verifyActivityLoadCalculation() {
  const emptyFeatures = {
    sampleCount: 0,
    movementIntensity: 0,
    accelerationPeakCount: 0,
    decelerationEventCount: 0,
    impactLikeEventCount: 0,
  };
  assert.deepEqual(calculateActivityMetrics(emptyFeatures, 0), {
    durationSeconds: 0,
    sampleCount: 0,
    movementIntensity: 0,
    accelerationPeakCount: 0,
    decelerationEventCount: 0,
    impactLikeEventCount: 0,
    loadIndex: 0,
    loadLevel: 'light',
  });

  const moderateFeatures = {
    sampleCount: 1_500,
    movementIntensity: 3.2,
    accelerationPeakCount: 12,
    decelerationEventCount: 12,
    impactLikeEventCount: 12,
  };
  const firstResult = calculateActivityMetrics(moderateFeatures, 30);
  assert.deepEqual(firstResult, calculateActivityMetrics(moderateFeatures, 30));
  assert.equal(firstResult.loadIndex, 56);
  assert.equal(firstResult.loadLevel, 'moderate');

  const highResult = calculateActivityMetrics(
    {
      sampleCount: 180_000,
      movementIntensity: 10,
      accelerationPeakCount: 1_000,
      decelerationEventCount: 1_000,
      impactLikeEventCount: 1_000,
    },
    3_600,
  );
  assert.equal(highResult.loadIndex, 100);
  assert.equal(highResult.loadLevel, 'high');
  assert.equal(getActivityLoadLevel(34), 'light');
  assert.equal(getActivityLoadLevel(35), 'moderate');
  assert.equal(getActivityLoadLevel(69), 'moderate');
  assert.equal(getActivityLoadLevel(70), 'high');
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

function verifyActivityTransitions() {
  const planned = {
    status: 'planned',
    elapsedSeconds: 0,
    sampleCount: 0,
    startedAt: null,
    endedAt: null,
    metrics: null,
  };
  const started = startActivityRecord(planned, '2026-09-28T02:00:00.000Z');
  assert.equal(started.status, 'active');
  assert.equal(
    getActivityElapsedSeconds(started, new Date('2026-09-28T02:00:05.500Z').getTime()),
    5,
  );
  assert.equal(startActivityRecord(started, '2026-09-28T02:00:03.000Z'), started);

  const paused = pauseActivityRecord(started, '2026-09-28T02:00:05.500Z');
  assert.equal(paused.status, 'paused');
  assert.equal(paused.elapsedSeconds, 5);
  assert.equal(paused.startedAt, null);
  assert.equal(
    getActivityElapsedSeconds(paused, new Date('2026-09-28T02:10:00.000Z').getTime()),
    5,
  );

  const resumed = startActivityRecord(paused, '2026-09-28T02:10:00.000Z');
  const finished = finishActivityRecord(resumed, '2026-09-28T02:10:03.900Z');
  assert.equal(finished.status, 'complete');
  assert.equal(finished.elapsedSeconds, 8);
  assert.equal(finished.endedAt, '2026-09-28T02:10:03.900Z');
  assert.equal(
    finishActivityRecord(finished, '2026-09-28T03:00:00.000Z'),
    finished,
  );
}

async function main() {
  verifyFixturesAndSelectors();
  verifyV1MigrationAndV2RoundTrip();
  verifyMeasurementTiming();
  verifySessionMutations();
  verifyActivityTransitions();
  await verifyMockMeasurementSource();
  await verifyMockActivitySource();
  verifyActivitySignalProcessing();
  verifyActivityLoadCalculation();
  console.log('Session domain verification passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
