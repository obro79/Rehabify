/**
 * useSessionResume Hook
 *
 * Provides crash recovery functionality for workout sessions.
 * Checks for persisted sessions on mount and provides methods to resume or discard.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import {
  restore,
  clearPersisted,
  getPersistedSessionAge,
  RESUME_WINDOW_MS,
} from '@/lib/session/session-persistence';
import type { SessionState } from '@/stores/session-store';

export interface SessionResumeState {
  /** Whether a recoverable session was found */
  hasRecoverableSession: boolean;
  /** Age of the persisted session in milliseconds, or null if none */
  sessionAge: number | null;
  /** The restored session state, if available */
  restoredSession: SessionState | null;
  /** Time remaining before session expires, formatted as "X:XX" */
  timeRemaining: string | null;
  /** Resume the persisted session */
  resumeSession: () => void;
  /** Discard the persisted session and start fresh */
  discardSession: () => void;
}

/**
 * Format milliseconds remaining as "M:SS" string
 */
function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Hook for session crash recovery.
 *
 * On mount, checks localStorage for a persisted session within the 5-minute window.
 * Provides methods to resume the session or discard it.
 *
 * @example
 * ```tsx
 * const { hasRecoverableSession, resumeSession, discardSession } = useSessionResume();
 *
 * if (hasRecoverableSession) {
 *   return <ResumeModal onResume={resumeSession} onDiscard={discardSession} />;
 * }
 * ```
 */
export function useSessionResume(): SessionResumeState {
  const [restoredSession, setRestoredSession] = useState<SessionState | null>(null);
  const [sessionAge, setSessionAge] = useState<number | null>(null);
  const [hasRecoverableSession, setHasRecoverableSession] = useState(false);

  // Check for persisted session on mount
  useEffect(() => {
    const restored = restore();
    const age = getPersistedSessionAge();

    if (restored && age !== null && age < RESUME_WINDOW_MS) {
      setRestoredSession(restored);
      setSessionAge(age);
      setHasRecoverableSession(true);
    } else {
      setRestoredSession(null);
      setSessionAge(null);
      setHasRecoverableSession(false);
    }
  }, []);

  // Calculate time remaining before session expires
  const timeRemaining =
    sessionAge !== null && hasRecoverableSession
      ? formatTimeRemaining(RESUME_WINDOW_MS - sessionAge)
      : null;

  /**
   * Resume the persisted session by applying restored state to the session store.
   */
  const resumeSession = useCallback(() => {
    if (!restoredSession) {
      return;
    }

    // Use setState directly to apply all persisted values
    useSessionStore.setState({
      sessionId: restoredSession.sessionId,
      startedAt: restoredSession.startedAt,
      pausedAt: restoredSession.pausedAt,
      isPaused: restoredSession.isPaused,
      totalReps: restoredSession.totalReps,
      averageFormScore: restoredSession.averageFormScore,
      totalDuration: restoredSession.totalDuration,
      exerciseHistory: restoredSession.exerciseHistory,
      currentExerciseIndex: restoredSession.currentExerciseIndex,
      planId: restoredSession.planId,
      planExercises: restoredSession.planExercises,
    });

    // Clear local state
    setHasRecoverableSession(false);
    setRestoredSession(null);
    setSessionAge(null);
  }, [restoredSession]);

  /**
   * Discard the persisted session and clear storage.
   */
  const discardSession = useCallback(() => {
    clearPersisted();
    setHasRecoverableSession(false);
    setRestoredSession(null);
    setSessionAge(null);
  }, []);

  return {
    hasRecoverableSession,
    sessionAge,
    restoredSession,
    timeRemaining,
    resumeSession,
    discardSession,
  };
}
