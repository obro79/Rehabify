/**
 * useAutoSave Hook
 *
 * Provides automatic session persistence for crash recovery.
 * Saves session state to localStorage at regular intervals.
 *
 * Note: The session-store already persists on pause, rep changes, and exercise completion.
 * This hook adds interval-based saves as a safety net for unexpected crashes.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';

/** Interval for automatic saves (30 seconds) */
const AUTO_SAVE_INTERVAL_MS = 30_000;

export interface AutoSaveOptions {
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Interval for automatic saves in ms (default: 30000) */
  interval?: number;
}

export interface AutoSaveState {
  /** Manually trigger a save */
  saveNow: () => boolean;
  /** Whether the last save was successful */
  lastSaveSucceeded: boolean;
}

/**
 * Hook for automatic session persistence.
 *
 * Sets up interval-based saves (every 30 seconds by default) as a safety net.
 * The session-store already persists on meaningful state changes, so this
 * primarily protects against unexpected browser crashes.
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function WorkoutSession() {
 *   const { saveNow } = useAutoSave();
 *
 *   // Auto-save is active while component is mounted
 *   // Manual save available via saveNow()
 *
 *   return <WorkoutUI onEmergencyStop={saveNow} />;
 * }
 * ```
 */
export function useAutoSave(options: AutoSaveOptions = {}): AutoSaveState {
  const { enabled = true, interval = AUTO_SAVE_INTERVAL_MS } = options;

  const lastSaveSucceededRef = useRef(true);
  const sessionId = useSessionStore((state) => state.sessionId);

  /**
   * Manually trigger a save.
   */
  const saveNow = useCallback((): boolean => {
    if (!sessionId) {
      return false;
    }

    const success = useSessionStore.getState().persistSession();
    lastSaveSucceededRef.current = success;
    return success;
  }, [sessionId]);

  // Set up interval for automatic saves
  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    const intervalId = setInterval(() => {
      const success = useSessionStore.getState().persistSession();
      lastSaveSucceededRef.current = success;
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, sessionId, interval]);

  return {
    saveNow,
    get lastSaveSucceeded() {
      return lastSaveSucceededRef.current;
    },
  };
}
