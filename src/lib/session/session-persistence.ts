/**
 * Session Persistence Module
 *
 * Provides localStorage-based crash recovery for workout sessions.
 * Sessions can be recovered if the user accidentally closes the browser
 * or navigates away within a 5-minute window.
 */

import type { SessionState } from '@/stores/session-store';

export const STORAGE_KEYS = {
  session: 'rehabify_session',
  timestamp: 'rehabify_session_timestamp',
} as const;

/** Time window during which a session can be resumed (5 minutes) */
export const RESUME_WINDOW_MS = 5 * 60 * 1000;

/**
 * Extract only the state properties (no actions) from a full store state.
 * Used by both session-store and persistence.
 */
export function extractSessionState<T extends SessionState>(fullState: T): SessionState {
  return {
    sessionId: fullState.sessionId,
    startedAt: fullState.startedAt,
    pausedAt: fullState.pausedAt,
    isPaused: fullState.isPaused,
    totalReps: fullState.totalReps,
    averageFormScore: fullState.averageFormScore,
    totalDuration: fullState.totalDuration,
    exerciseHistory: fullState.exerciseHistory,
    currentExerciseIndex: fullState.currentExerciseIndex,
    planId: fullState.planId,
    planExercises: fullState.planExercises,
  };
}

/** Serialize SessionState to JSON string */
export function serializeSession(state: SessionState): string {
  return JSON.stringify(extractSessionState(state));
}

/** Deserialize JSON string back to SessionState. Returns null if parsing fails. */
export function deserializeSession(json: string): SessionState | null {
  try {
    const parsed = JSON.parse(json) as SessionState;

    // Validate sessionId is string or null
    if (typeof parsed.sessionId !== 'string' && parsed.sessionId !== null) {
      return null;
    }

    // Ensure arrays have defaults
    return {
      ...parsed,
      exerciseHistory: parsed.exerciseHistory ?? [],
      planExercises: parsed.planExercises ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Persist session state to localStorage.
 * Returns false if no active session or localStorage fails.
 */
export function persist(state: SessionState): boolean {
  if (!state.sessionId) return false;

  try {
    localStorage.setItem(STORAGE_KEYS.session, serializeSession(state));
    localStorage.setItem(STORAGE_KEYS.timestamp, Date.now().toString());
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[session-persistence] Failed to persist:', error);
    }
    return false;
  }
}

/**
 * Attempt to restore a session from localStorage
 *
 * Checks if a persisted session exists and is within the 5-minute resume window.
 * If the session is stale or invalid, clears storage and returns null.
 *
 * @returns Restored SessionState if valid and within window, null otherwise
 */
export function restore(): SessionState | null {
  try {
    const sessionData = localStorage.getItem(STORAGE_KEYS.session);
    const timestampStr = localStorage.getItem(STORAGE_KEYS.timestamp);

    // No persisted session exists
    if (!sessionData || !timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);

    // Check if timestamp is valid
    if (isNaN(timestamp)) {
      clearPersisted();
      return null;
    }

    // Check if session is within the resume window
    const age = Date.now() - timestamp;
    if (age > RESUME_WINDOW_MS) {
      // Session is stale, clear it
      clearPersisted();
      return null;
    }

    // Deserialize the session state
    const restoredState = deserializeSession(sessionData);

    if (!restoredState) {
      // Deserialization failed, clear invalid data
      clearPersisted();
      return null;
    }

    return restoredState;
  } catch {
    // localStorage access failed, return null
    clearPersisted();
    return null;
  }
}

/**
 * Clear persisted session data from localStorage
 *
 * Removes both the session data and timestamp keys.
 * Fails silently if localStorage is unavailable.
 */
export function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.timestamp);
  } catch {
    // Fail silently - localStorage might be unavailable
    if (process.env.NODE_ENV === 'development') {
      console.warn('[session-persistence] Failed to clear persisted session');
    }
  }
}

/**
 * Get the age of the persisted session in milliseconds
 * Returns null if no session is persisted or timestamp is invalid
 */
export function getPersistedSessionAge(): number | null {
  try {
    const timestampStr = localStorage.getItem(STORAGE_KEYS.timestamp);
    if (!timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return null;
    }

    return Date.now() - timestamp;
  } catch {
    return null;
  }
}
