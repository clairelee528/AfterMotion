import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  ActivityType,
  KneeSide,
  MeasurementSource,
  SymptomRecord,
} from '@/domain/models';

export type ActivityProgress = 'planned' | 'active' | 'paused' | 'complete';
export type MeasurementPhase = 'baseline' | 'recovery';

export interface StoredMeasurement {
  recordedAt: string;
  stretchValue: number;
  temperatureCelsius: number;
  pain: number;
}

export interface CheckpointRecord {
  left: StoredMeasurement | null;
  right: StoredMeasurement | null;
  symptoms: SymptomRecord;
}

export interface LocalSession {
  id: string;
  activityType: ActivityType;
  injuredSide: KneeSide;
  source: MeasurementSource;
  createdAt: string;
  closedAt?: string | null;
  endedEarly?: boolean;
  baseline: CheckpointRecord;
  activity: {
    status: ActivityProgress;
    elapsedSeconds: number;
    startedAt: string | null;
    endedAt: string | null;
  };
  recovery: Record<string, CheckpointRecord>;
}

interface SessionState {
  currentSessionId: string | null;
  sessions: Record<string, LocalSession>;
}

interface CreateSessionInput {
  activityType: ActivityType;
  injuredSide: KneeSide;
  source: MeasurementSource;
}

interface SessionStoreValue extends SessionState {
  hydrated: boolean;
  currentSession: LocalSession | null;
  createSession: (input: CreateSessionInput) => string;
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
    status: ActivityProgress,
    elapsedSeconds?: number,
  ) => void;
}

const STORAGE_KEY = '@aftermotion/session-state/v1';
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

const demoMeasurement = (temperatureCelsius: number): StoredMeasurement => ({
  recordedAt: new Date().toISOString(),
  stretchValue: 2418,
  temperatureCelsius,
  pain: 2,
});

const initialState: SessionState = {
  currentSessionId: 'demo-001',
  sessions: {
    'demo-001': {
      id: 'demo-001',
      activityType: 'frisbee',
      injuredSide: 'right',
      source: 'mock',
      createdAt: new Date().toISOString(),
      closedAt: null,
      endedEarly: false,
      baseline: {
        left: demoMeasurement(33.4),
        right: demoMeasurement(33.7),
        symptoms: { ...defaultSymptoms },
      },
      activity: {
        status: 'complete',
        elapsedSeconds: 68 * 60,
        startedAt: new Date(Date.now() - 68 * 60 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
      },
      recovery: {
        '0': emptyCheckpoint(),
        '15': emptyCheckpoint(),
        '30': emptyCheckpoint(),
        '45': emptyCheckpoint(),
        '60': emptyCheckpoint(),
      },
    },
  },
};

const SessionStoreContext = createContext<SessionStoreValue | null>(null);

export function SessionStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function hydrate() {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) setState(JSON.parse(savedState) as SessionState);
      } catch {
        setState(initialState);
      } finally {
        setHydrated(true);
      }
    }

    void hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  function updateSession(sessionId: string, update: (session: LocalSession) => LocalSession) {
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
    const session: LocalSession = {
      id,
      ...input,
      createdAt: new Date().toISOString(),
      closedAt: null,
      endedEarly: false,
      baseline: emptyCheckpoint(),
      activity: {
        status: 'planned',
        elapsedSeconds: 0,
        startedAt: null,
        endedAt: null,
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
    const recoveryTemperatureOffset: Record<string, number> = {
      '0': 0.8,
      '15': 0.65,
      '30': 0.45,
      '45': 0.25,
      '60': 0.1,
    };
    const baselineTemperature = side === 'left' ? 33.4 : 33.7;
    const demoTemperature =
      phase === 'baseline'
        ? baselineTemperature
        : baselineTemperature + (recoveryTemperatureOffset[checkpoint] ?? 0.2);
    const measurement: StoredMeasurement = {
      recordedAt: new Date().toISOString(),
      stretchValue: 2418,
      temperatureCelsius: Number(demoTemperature.toFixed(2)),
      pain,
    };
    updateSession(sessionId, (session) => {
      if (phase === 'baseline') {
        return { ...session, baseline: { ...session.baseline, [side]: measurement } };
      }
      const previous = session.recovery[checkpoint] ?? emptyCheckpoint();
      return {
        ...session,
        recovery: {
          ...session.recovery,
          [checkpoint]: { ...previous, [side]: measurement },
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
        return { ...session, baseline: { ...session.baseline, symptoms } };
      }
      const previous = session.recovery[checkpoint] ?? emptyCheckpoint();
      return {
        ...session,
        recovery: { ...session.recovery, [checkpoint]: { ...previous, symptoms } },
      };
    });
  }

  function setActivityStatus(
    sessionId: string,
    status: ActivityProgress,
    elapsedSeconds?: number,
  ) {
    updateSession(sessionId, (session) => ({
      ...session,
      activity: {
        ...session.activity,
        status,
        elapsedSeconds: elapsedSeconds ?? session.activity.elapsedSeconds,
        startedAt:
          status === 'active' && session.activity.status !== 'active'
            ? new Date().toISOString()
            : status === 'active'
              ? session.activity.startedAt
              : null,
      },
    }));
  }

  function finishActivity(sessionId: string, elapsedSeconds: number) {
    updateSession(sessionId, (session) => ({
      ...session,
      activity: {
        ...session.activity,
        status: 'complete',
        elapsedSeconds,
        startedAt: null,
        endedAt: new Date().toISOString(),
      },
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
