import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  ActivityStatus,
  CheckpointRecord,
  CreateSessionInput,
  KneeMeasurement,
  KneeSide,
  MeasurementPhase,
  Session,
  SessionState,
  SymptomRecord,
} from '@/domain/models';
import { isRecoveryCheckpoint } from '@/domain/models';
import {
  createDemoSessionFixtures,
  getDemoActivityMetrics,
  getDemoMeasurementReading,
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
  finishActivity: (sessionId: string, elapsedSeconds: number) => void;
  saveFeelings: (sessionId: string, checkpoint: string, symptoms: SymptomRecord) => void;
  saveMeasurement: (
    sessionId: string,
    phase: MeasurementPhase,
    side: KneeSide,
    checkpoint: string,
    pain: number,
  ) => void;
  setActivityStatus: (
    sessionId: string,
    status: ActivityStatus,
    elapsedSeconds?: number,
  ) => void;
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

  function saveMeasurement(
    sessionId: string,
    phase: MeasurementPhase,
    side: KneeSide,
    checkpoint: string,
    pain: number,
  ) {
    const measurementCheckpoint =
      phase === 'baseline' || !isRecoveryCheckpoint(checkpoint) ? 'baseline' : checkpoint;
    const reading = getDemoMeasurementReading(side, measurementCheckpoint);
    const measurement: KneeMeasurement = {
      id: `${sessionId}-${checkpoint}-${side}-${Date.now()}`,
      sessionId,
      checkpoint: measurementCheckpoint,
      side,
      recordedAt: new Date().toISOString(),
      ...reading,
      source: state.sessions[sessionId]?.measurementSource ?? 'mock',
    };
    updateSession(sessionId, (session) => {
      if (phase === 'baseline') {
        return {
          ...session,
          updatedAt: new Date().toISOString(),
          baseline: {
            ...session.baseline,
            [side]: measurement,
            symptoms: { ...session.baseline.symptoms, pain },
          },
        };
      }
      const previous = session.recovery[checkpoint] ?? emptyCheckpoint();
      return {
        ...session,
        updatedAt: new Date().toISOString(),
        recovery: {
          ...session.recovery,
          [checkpoint]: {
            ...previous,
            [side]: measurement,
            symptoms: { ...previous.symptoms, pain },
          },
        },
      };
    });
  }

  function endSession(sessionId: string, endedEarly: boolean) {
    setState((current) => {
      const session = current.sessions[sessionId];
      if (!session) return current;
      return {
        currentSessionId:
          current.currentSessionId === sessionId ? null : current.currentSessionId,
        sessions: {
          ...current.sessions,
          [sessionId]: {
            ...session,
            status: endedEarly ? 'endedEarly' : 'complete',
            updatedAt: new Date().toISOString(),
            closedAt: new Date().toISOString(),
            endedEarly,
            activity:
              session.activity.status === 'active' || session.activity.status === 'paused'
                ? {
                    ...session.activity,
                    status: 'complete',
                    startedAt: null,
                    endedAt: new Date().toISOString(),
                  }
                : session.activity,
          },
        },
      };
    });
  }

  function saveFeelings(sessionId: string, checkpoint: string, symptoms: SymptomRecord) {
    updateSession(sessionId, (session) => {
      if (checkpoint === 'baseline') {
        return {
          ...session,
          updatedAt: new Date().toISOString(),
          baseline: { ...session.baseline, symptoms },
        };
      }
      const previous = session.recovery[checkpoint] ?? emptyCheckpoint();
      return {
        ...session,
        updatedAt: new Date().toISOString(),
        recovery: { ...session.recovery, [checkpoint]: { ...previous, symptoms } },
      };
    });
  }

  function setActivityStatus(
    sessionId: string,
    status: ActivityStatus,
    elapsedSeconds?: number,
  ) {
    updateSession(sessionId, (session) => ({
      ...session,
      status: status === 'planned' ? session.status : 'activity',
      updatedAt: new Date().toISOString(),
      activity: {
        ...session.activity,
        status,
        elapsedSeconds: elapsedSeconds ?? session.activity.elapsedSeconds,
        startedAt:
          status === 'active' ? new Date().toISOString() : null,
      },
    }));
  }

  function finishActivity(sessionId: string, elapsedSeconds: number) {
    const metrics = getDemoActivityMetrics(elapsedSeconds);
    updateSession(sessionId, (session) => ({
      ...session,
      status: 'recovery',
      updatedAt: new Date().toISOString(),
      activity: {
        ...session.activity,
        status: 'complete',
        elapsedSeconds,
        startedAt: null,
        endedAt: new Date().toISOString(),
        metrics,
      },
    }));
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
    saveFeelings,
    saveMeasurement,
    setActivityStatus,
  };

  return <SessionStoreContext.Provider value={value}>{children}</SessionStoreContext.Provider>;
}

export function useSessionStore() {
  const value = useContext(SessionStoreContext);
  if (!value) throw new Error('useSessionStore must be used inside SessionStoreProvider');
  return value;
}
