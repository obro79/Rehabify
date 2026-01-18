/**
 * useFormEventBridge Hook
 *
 * Wires the vision system (exerciseStore) to Vapi voice feedback.
 * Only sends feedback AFTER rep completion (not during).
 * Collects errors during rep and summarizes them in one voice message.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useExerciseStore } from '@/stores/exercise-store';
import { FORM_ERROR_CORRECTIONS } from '@/lib/voice/types';
import type { FormErrorType } from '@/lib/voice/types';

export interface UseFormEventBridgeOptions {
  /** Vapi say method */
  say: (text: string) => void;
  /** Vapi injectContext method */
  injectContext: (context: string) => void;
  /** Whether Vapi is connected */
  isConnected: boolean;
  /** Current exercise ID */
  exerciseId?: string;
  /** Target reps for current exercise */
  targetReps?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook to wire exerciseStore events to Vapi voice feedback
 * Only triggers voice on REP COMPLETE - batches errors from the rep
 */
export function useFormEventBridge(options: UseFormEventBridgeOptions): void {
  const {
    say,
    injectContext,
    isConnected,
    exerciseId = 'unknown',
    targetReps = 10,
    debug = true,
  } = options;

  const prevRepCountRef = useRef<number>(0);
  const repErrorsRef = useRef<Set<string>>(new Set());

  // Subscribe to store changes - collect errors and speak on rep completion
  useEffect(() => {
    let prevErrors: string[] = [];
    let prevRepCount = prevRepCountRef.current;

    const unsubscribe = useExerciseStore.subscribe((state) => {
      // Collect new errors
      const currentErrorTypes = state.activeErrors.map((e) => e.type);
      const newErrors = currentErrorTypes.filter((e) => !prevErrors.includes(e));

      newErrors.forEach((errorType) => {
        repErrorsRef.current.add(errorType);
      });

      if (debug && newErrors.length > 0) {
        console.log(`[useFormEventBridge] Errors queued: ${Array.from(repErrorsRef.current).join(', ')}`);
      }

      prevErrors = currentErrorTypes;

      // Check for rep completion
      if (state.repCount > prevRepCount && isConnected) {
        const formScore = state.formScore;
        const errors = Array.from(repErrorsRef.current);

        console.log(`[useFormEventBridge] Rep ${state.repCount}/${targetReps} | Score: ${formScore}% | Errors: ${errors.join(', ') || 'none'}`);

        // Build voice feedback
        let feedback = '';

        // Milestone reps (halfway, complete)
        const isHalfway = state.repCount === Math.floor(targetReps / 2);
        const isComplete = state.repCount >= targetReps;

        if (isComplete) {
          feedback = `That's ${state.repCount}! Great set.`;
        } else if (isHalfway) {
          feedback = `Nice, that's ${state.repCount}. Halfway there.`;
        } else if (errors.length > 0) {
          // Give correction for the most important error
          const primaryError = errors[0] as FormErrorType;
          const correction = FORM_ERROR_CORRECTIONS[primaryError] || 'Good effort';
          feedback = correction;
        } else if (formScore >= 80) {
          // Occasional encouragement for good form
          if (state.repCount % 3 === 0) {
            feedback = 'Nice form!';
          }
        }

        // Speak if we have feedback
        if (feedback) {
          console.log(`[useFormEventBridge] Speaking: "${feedback}"`);
          say(feedback);
        }

        // Reset errors for next rep
        repErrorsRef.current.clear();
      }

      prevRepCount = state.repCount;
      prevRepCountRef.current = state.repCount;
    });

    return unsubscribe;
  }, [isConnected, targetReps, say, debug]);

  // Reset when exercise changes
  useEffect(() => {
    prevRepCountRef.current = 0;
    repErrorsRef.current.clear();
    console.log(`[useFormEventBridge] Reset for exercise: ${exerciseId}`);
  }, [exerciseId]);
}

export default useFormEventBridge;
