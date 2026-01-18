/**
 * Form Event Debouncer
 *
 * Prevents repetitive voice corrections by tracking timing per error type.
 *
 * Timing rules:
 * - 500ms initial debounce before first voice injection
 * - 5 second cooldown per error type
 * - 10 second extended cooldown after 3+ occurrences
 */

import type { FormErrorType } from './types';

interface ErrorTrackingState {
  /** Last time this error was sent to voice */
  lastSentAt: number;
  /** Number of times this error has occurred */
  occurrenceCount: number;
}

/** Default cooldown between same error corrections (ms) */
const DEFAULT_COOLDOWN_MS = 5000;

/** Extended cooldown after repeated errors (ms) */
const EXTENDED_COOLDOWN_MS = 10000;

/** Threshold for switching to extended cooldown */
const EXTENDED_COOLDOWN_THRESHOLD = 3;

/** Initial debounce before first injection (ms) */
const INITIAL_DEBOUNCE_MS = 500;

export class FormEventDebouncer {
  private errorTracking: Map<string, ErrorTrackingState> = new Map();
  private sessionStartTime: number = Date.now();
  private lastAnyErrorSentAt: number = 0;

  constructor() {
    this.reset();
  }

  /**
   * Create a unique key for tracking errors per exercise
   */
  private getKey(exerciseId: string, errorType: FormErrorType): string {
    return `${exerciseId}:${errorType}`;
  }

  /**
   * Check if enough time has passed since session start for initial debounce
   */
  private hasPassedInitialDebounce(): boolean {
    return Date.now() - this.sessionStartTime >= INITIAL_DEBOUNCE_MS;
  }

  /**
   * Get the appropriate cooldown interval for an error
   */
  private getCooldownInterval(occurrenceCount: number): number {
    return occurrenceCount >= EXTENDED_COOLDOWN_THRESHOLD
      ? EXTENDED_COOLDOWN_MS
      : DEFAULT_COOLDOWN_MS;
  }

  /**
   * Check if we should send voice feedback for this error
   *
   * @param exerciseId - Current exercise ID
   * @param errorType - Type of form error
   * @returns Whether to send voice feedback
   */
  shouldSend(exerciseId: string, errorType: FormErrorType): boolean {
    // Check initial debounce
    if (!this.hasPassedInitialDebounce()) {
      return false;
    }

    const key = this.getKey(exerciseId, errorType);
    const state = this.errorTracking.get(key);
    const now = Date.now();

    // First occurrence - allow it
    if (!state) {
      return true;
    }

    // Check if cooldown has passed
    const cooldown = this.getCooldownInterval(state.occurrenceCount);
    const timeSinceLastSent = now - state.lastSentAt;

    return timeSinceLastSent >= cooldown;
  }

  /**
   * Record that an error was sent to voice
   *
   * @param exerciseId - Current exercise ID
   * @param errorType - Type of form error
   */
  recordSent(exerciseId: string, errorType: FormErrorType): void {
    const key = this.getKey(exerciseId, errorType);
    const state = this.errorTracking.get(key);
    const now = Date.now();

    if (state) {
      state.lastSentAt = now;
      state.occurrenceCount += 1;
    } else {
      this.errorTracking.set(key, {
        lastSentAt: now,
        occurrenceCount: 1,
      });
    }

    this.lastAnyErrorSentAt = now;
  }

  /**
   * Get the occurrence count for a specific error
   *
   * @param exerciseId - Current exercise ID
   * @param errorType - Type of form error
   * @returns Number of times this error has been sent
   */
  getOccurrenceCount(exerciseId: string, errorType: FormErrorType): number {
    const key = this.getKey(exerciseId, errorType);
    return this.errorTracking.get(key)?.occurrenceCount ?? 0;
  }

  /**
   * Check if an error has been sent recently (within any cooldown)
   */
  wasRecentlySent(exerciseId: string, errorType: FormErrorType): boolean {
    const key = this.getKey(exerciseId, errorType);
    const state = this.errorTracking.get(key);

    if (!state) return false;

    const cooldown = this.getCooldownInterval(state.occurrenceCount);
    return Date.now() - state.lastSentAt < cooldown;
  }

  /**
   * Get time until next allowed send (ms), or 0 if ready
   */
  getTimeUntilReady(exerciseId: string, errorType: FormErrorType): number {
    const key = this.getKey(exerciseId, errorType);
    const state = this.errorTracking.get(key);

    if (!state) return 0;

    const cooldown = this.getCooldownInterval(state.occurrenceCount);
    const timeSinceLastSent = Date.now() - state.lastSentAt;
    const remaining = cooldown - timeSinceLastSent;

    return Math.max(0, remaining);
  }

  /**
   * Reset all tracking state (call on session start/end)
   */
  reset(): void {
    this.errorTracking.clear();
    this.sessionStartTime = Date.now();
    this.lastAnyErrorSentAt = 0;
  }

  /**
   * Reset tracking for a specific exercise (call on exercise change)
   */
  resetForExercise(exerciseId: string): void {
    for (const key of this.errorTracking.keys()) {
      if (key.startsWith(`${exerciseId}:`)) {
        this.errorTracking.delete(key);
      }
    }
  }

  /**
   * Get statistics for debugging
   */
  getStats(): {
    trackedErrors: number;
    sessionDuration: number;
    lastErrorSentAgo: number;
  } {
    const now = Date.now();
    return {
      trackedErrors: this.errorTracking.size,
      sessionDuration: now - this.sessionStartTime,
      lastErrorSentAgo: this.lastAnyErrorSentAt ? now - this.lastAnyErrorSentAt : -1,
    };
  }
}

// Export singleton instance for easy use
export const formEventDebouncer = new FormEventDebouncer();
