import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  CheckpointRecord,
  CreateSessionInput,
  KneeMeasurement,
  MeasurementCheckpoint,
  Session,
  SessionState,
  SymptomRecord,
} from '@/domain/models';
import {
  finishActivityRecord,
  pauseActivityRecord,
  startActivityRecord,
} from '@/domain/activity-transitions';
import {
  getActiveActivityFeatures,
  releaseActivitySignalProcessor,
  type ActivityFeatures,
} from '@/domain/activity-processing';
import { calculateActivityMetrics } from '@/domain/activity-load';
import {
  saveMeasurementToSession,
  saveSymptomsToSession,
} from '@/domain/session-mutations';
import {
  createDemoSessionFixtures,
  getDemoActivityMetrics,
} from '@/data/demo-fixtures';
import {
  decodeSessionState,
  emptySessionState,
  encodeSessionState,
  LEGACY_SESSION_STORAGE_KEY,
  SESSION_STORAGE_KEY,
} from '@/state/session-persistence';

interface SessionStoreValue extends SessionState {
  hydrated: boolean;
  currentSession: Session | null;
  createSession: (input: CreateSessionInput) => string;
  loadDemoFixtures: () => void;
  endSession: (sessionId: string, endedEarly: boolean) => void;
  finishActivity: (
    sessionId: string,
    features?: ActivityFeatures,
    nowIso?: string,
  ) => void;
  pauseActivity: (sessionId: string, nowIso?: string) => void;
  saveFeelings: (
    sessionId: string,
    checkpoint: MeasurementCheckpoint,
    symptoms: SymptomRecord,
  ) => void;
  saveMeasurement: (measurement: KneeMeasurement) => void;
  saveActivitySampleCount: (sessionId: string, sampleCount: number) => void;
  startActivity: (sessionId: string, nowIso?: string) => void;
}

const defaultSymptoms: SymptomRecord = {
  pain: 2,
  stiffness: 2,
  swelling: 'mild',
};

function emptyCheckpoint(): CheckpointRecord {
  return {
    left: null,
    right: null,
    symptoms: { ...defaultSymptoms },
    symptomsRecordedAt: null,
  };
}

const initialState: SessionState = emptySessionState();

const SessionStoreContext = createContext<SessionStoreValue | null>(null);

export function SessionStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);

  useEffect(() => {
    async function hydrate() {
      try {
        const savedV2State = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (savedV2State) {
          setState(decodeSessionState(savedV2State));
          setPersistenceEnabled(true);
          return;
        }

        const savedV1State = await AsyncStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
        if (savedV1State) {
          const migratedState = decodeSessionState(savedV1State);
          setState(migratedState);
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, encodeSessionState(migratedState));
        }
        setPersistenceEnabled(true);
      } catch (error) {
        console.warn('Unable to restore saved sessions.', error);
        setState(initialState);
      } finally {
        setHydrated(true);
      }
    }

    void hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || !persistenceEnabled) return;
    void AsyncStorage.setItem(SESSION_STORAGE_KEY, encodeSessionState(state)).catch((error) => {
      console.warn('Unable to save sessions.', error);
    });
  }, [hydrated, persistenceEnabled, state]);

  function updateSession(sessionId: string, update: (session: Session) => Session) {
    setState((current) => {
      const session = current.sessions[sessionId];
      if (!session) return current;
      return {
        ...current,
        sessions: { ...current.sessions, [sessionId]: update(session) },
      };
    });
  }

  function createSession(input: CreateSessionInput) {
    const id = `session-${Date.now()}`;
    const session: Session = {
      id,
      ...input,
      status: 'baseline',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: null,
      endedEarly: false,
      baseline: emptyCheckpoint(),
      activity: {
        status: 'planned',
        elapsedSeconds: 0,
        sampleCount: 0,
        startedAt: null,
        endedAt: null,
        metrics: null,
      },
      recovery: {
        '0': emptyCheckpoint(),
        '15': emptyCheckpoint(),
        '30': emptyCheckpoint(),
        '45': emptyCheckpoint(),
        '60': emptyCheckpoint(),
      },
    };
    setState((current) => ({
      currentSessionId: id,
      sessions: { ...current.sessions, [id]: session },
    }));
    return id;
  }

  function saveMeasurement(measurement: KneeMeasurement) {
    updateSession(measurement.sessionId, (session) =>
      saveMeasurementToSession(session, measurement),
    );
  }

  function endSession(sessionId: string, endedEarly: boolean) {
    const liveFeatures = getActiveActivityFeatures(sessionId);
    releaseActivitySignalProcessor(sessionId);
    setState((current) => {
      const session = current.sessions[sessionId];
      if (!session) return current;
      const nowIso = new Date().toISOString();
      const stoppedActivity =
        session.activity.status === 'active' || session.activity.status === 'paused'
          ? finishActivityRecord(session.activity, nowIso)
          : session.activity;
      const activity =
        stoppedActivity.status === 'complete' && !stoppedActivity.metrics
          ? (() => {
              const sampleCount = Math.max(
                stoppedActivity.sampleCount,
                liveFeatures?.sampleCount ?? 0,
              );
              return {
                ...stoppedActivity,
                sampleCount,
                metrics: liveFeatures
                  ? calculateActivityMetrics(
                      { ...liveFeatures, sampleCount },
                      stoppedActivity.elapsedSeconds,
                    )
                  : {
                      ...getDemoActivityMetrics(stoppedActivity.elapsedSeconds),
                      sampleCount,
                    },
              };
            })()
          : stoppedActivity;
      return {
        currentSessionId:
          current.currentSessionId === sessionId ? null : current.currentSessionId,
        sessions: {
          ...current.sessions,
          [sessionId]: {
            ...session,
            status: endedEarly ? 'endedEarly' : 'complete',
            updatedAt: nowIso,
            closedAt: nowIso,
            endedEarly,
            activity,
          },
        },
      };
    });
  }

  function saveFeelings(
    sessionId: string,
    checkpoint: MeasurementCheckpoint,
    symptoms: SymptomRecord,
  ) {
    updateSession(sessionId, (session) =>
      saveSymptomsToSession(session, checkpoint, symptoms),
    );
  }

  function startActivity(sessionId: string, nowIso = new Date().toISOString()) {
    updateSession(sessionId, (session) => ({
      ...session,
      status: session.activity.status === 'complete' ? session.status : 'activity',
      updatedAt: nowIso,
      activity: startActivityRecord(session.activity, nowIso),
    }));
  }

  function pauseActivity(sessionId: string, nowIso = new Date().toISOString()) {
    updateSession(sessionId, (session) => ({
      ...session,
      updatedAt: nowIso,
      activity: pauseActivityRecord(session.activity, nowIso),
    }));
  }

  function saveActivitySampleCount(sessionId: string, sampleCount: number) {
    updateSession(sessionId, (session) => ({
      ...session,
      activity: {
        ...session.activity,
        sampleCount: Math.max(session.activity.sampleCount, Math.floor(sampleCount)),
      },
    }));
  }

  function finishActivity(
    sessionId: string,
    features?: ActivityFeatures,
    nowIso = new Date().toISOString(),
  ) {
    updateSession(sessionId, (session) => {
      const activity = finishActivityRecord(session.activity, nowIso);
      const finalSampleCount = Math.max(
        activity.sampleCount,
        Math.floor(features?.sampleCount ?? activity.sampleCount),
      );
      const fallbackMetrics = getDemoActivityMetrics(activity.elapsedSeconds);
      const calculatedMetrics = features
        ? calculateActivityMetrics(
            { ...features, sampleCount: finalSampleCount },
            activity.elapsedSeconds,
          )
        : { ...fallbackMetrics, sampleCount: finalSampleCount };
      return {
        ...session,
        status: 'recovery',
        updatedAt: nowIso,
        activity: {
          ...activity,
          sampleCount: finalSampleCount,
          metrics: activity.metrics ?? calculatedMetrics,
        },
      };
    });
  }

  function loadDemoFixtures() {
    const demoSessions = createDemoSessionFixtures();
    setState((current) => ({
      currentSessionId: current.currentSessionId ?? 'demo-active',
      sessions: { ...current.sessions, ...demoSessions },
    }));
  }

  const value: SessionStoreValue = {
    ...state,
    hydrated,
    currentSession: state.currentSessionId
      ? state.sessions[state.currentSessionId] ?? null
      : null,
    createSession,
    endSession,
    finishActivity,
    loadDemoFixtures,
    pauseActivity,
    saveFeelings,
    saveActivitySampleCount,
    saveMeasurement,
    startActivity,
  };

  return <SessionStoreContext.Provider value={value}>{children}</SessionStoreContext.Provider>;
}

export function useSessionStore() {
  const value = useContext(SessionStoreContext);
  if (!value) throw new Error('useSessionStore must be used inside SessionStoreProvider');
  return value;
}
