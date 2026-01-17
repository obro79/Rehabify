/**
 * useMultiTabGuard Hook
 *
 * Provides multi-tab blocking functionality for workout sessions.
 * Prevents concurrent workouts across multiple browser tabs.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSessionGuard } from '@/lib/session/session-guard';

export interface MultiTabGuardState {
  /** Whether there's a conflict with another tab */
  hasConflict: boolean;
  /** Whether this tab owns the session */
  isOwner: boolean;
  /** Whether a claim attempt is in progress */
  isClaiming: boolean;
  /** Force take over the session from another tab */
  forceTakeOver: () => Promise<boolean>;
  /** Claim session ownership */
  claim: () => Promise<boolean>;
  /** Release session ownership */
  release: () => void;
}

/**
 * Hook for multi-tab session blocking.
 *
 * Automatically attempts to claim session ownership on mount.
 * If another tab has an active session, hasConflict will be true.
 *
 * @param autoClaimOnMount - Whether to automatically claim on mount (default: true)
 *
 * @example
 * ```tsx
 * const { hasConflict, forceTakeOver } = useMultiTabGuard();
 *
 * if (hasConflict) {
 *   return (
 *     <BlockingModal
 *       onTakeOver={forceTakeOver}
 *       onCancel={() => router.push('/dashboard')}
 *     />
 *   );
 * }
 * ```
 */
export function useMultiTabGuard(autoClaimOnMount = true): MultiTabGuardState {
  const [hasConflict, setHasConflict] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [guard] = useState(() => getSessionGuard());

  // Set up conflict callback
  useEffect(() => {
    guard.onConflict(() => {
      setHasConflict(true);
      setIsOwner(false);
    });
  }, [guard]);

  // Auto-claim on mount if enabled
  useEffect(() => {
    if (!autoClaimOnMount) {
      return;
    }

    let cancelled = false;

    const attemptClaim = async () => {
      setIsClaiming(true);
      const success = await guard.claim();

      if (!cancelled) {
        setIsOwner(success);
        setHasConflict(!success);
        setIsClaiming(false);
      }
    };

    attemptClaim();

    return () => {
      cancelled = true;
    };
  }, [autoClaimOnMount, guard]);

  /**
   * Manually claim session ownership.
   */
  const claim = useCallback(async (): Promise<boolean> => {
    setIsClaiming(true);
    const success = await guard.claim();
    setIsOwner(success);
    setHasConflict(!success);
    setIsClaiming(false);
    return success;
  }, [guard]);

  /**
   * Release session ownership.
   */
  const release = useCallback((): void => {
    guard.release();
    setIsOwner(false);
    setHasConflict(false);
  }, [guard]);

  /**
   * Force take over the session from another tab.
   *
   * This first releases the guard (to clear any existing claim),
   * then waits briefly for the other tab to receive the release,
   * and finally attempts to claim again.
   *
   * Note: The other tab should detect this and show an appropriate message.
   */
  const forceTakeOver = useCallback(async (): Promise<boolean> => {
    // If we're already the owner, nothing to do
    if (isOwner) {
      return true;
    }

    setIsClaiming(true);

    // Check if the other session has been abandoned
    if (guard.isSessionAbandoned()) {
      // Session was abandoned, we can claim directly
      const success = await guard.claim();
      setIsOwner(success);
      setHasConflict(!success);
      setIsClaiming(false);
      return success;
    }

    // Wait a brief moment for any pending messages
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Attempt to claim again
    const success = await guard.claim();
    setIsOwner(success);
    setHasConflict(!success);
    setIsClaiming(false);

    return success;
  }, [guard, isOwner]);

  return {
    hasConflict,
    isOwner,
    isClaiming,
    forceTakeOver,
    claim,
    release,
  };
}
