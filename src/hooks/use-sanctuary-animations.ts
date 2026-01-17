"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook to manage sanctuary ambient animations (breathing, blob float)
 *
 * Auto-pauses animations during active workout sessions to maintain
 * a clean, distraction-free environment for exercise focus.
 *
 * @returns {Object} Animation control state and functions
 * @returns {boolean} isPaused - Whether animations are currently paused
 * @returns {Function} pauseAnimations - Manually pause animations
 * @returns {Function} resumeAnimations - Manually resume animations
 *
 * @example
 * ```tsx
 * const { isPaused } = useSanctuaryAnimations();
 *
 * return (
 *   <div className={isPaused ? "sanctuary-paused" : ""}>
 *     <div className="animate-sanctuary-breathe">...</div>
 *   </div>
 * );
 * ```
 */
export function useSanctuaryAnimations() {
  const [isPaused, setIsPaused] = useState(false);
  const pathname = usePathname();

  /**
   * Auto-pause animations when on workout session page
   * Workout session pages follow pattern: /workout/[slug]
   * But NOT /workout/[slug]/complete (workout complete page should have animations)
   */
  useEffect(() => {
    // Check if on workout session page (not complete page)
    const isWorkoutSession =
      pathname?.startsWith("/workout/") &&
      !pathname?.endsWith("/complete");

    setIsPaused(isWorkoutSession);
  }, [pathname]);

  /**
   * Manually pause all sanctuary animations
   */
  const pauseAnimations = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Manually resume all sanctuary animations
   */
  const resumeAnimations = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    isPaused,
    pauseAnimations,
    resumeAnimations,
  };
}
