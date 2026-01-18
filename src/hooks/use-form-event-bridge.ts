/**
 * useFormEventBridge Hook
 *
 * Wires the vision system (exerciseStore) to Vapi voice feedback.
 * Uses injectContext() to send structured data to the LLM, which then
 * formulates natural responses based on its system prompt.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useExerciseStore } from '@/stores/exercise-store';

export interface UseFormEventBridgeOptions {
  /** Vapi injectContext method */
  injectContext: (context: string) => void;
  /** Whether Vapi is connected */
  isConnected: boolean;
  /** Current exercise name */
  exerciseName?: string;
  /** Target reps for current exercise */
  targetReps?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook to wire exerciseStore events to Vapi voice feedback via LLM
 * Sends structured context so the assistant can formulate natural responses
 */
export function useFormEventBridge(options: UseFormEventBridgeOptions): void {
  const {
    injectContext,
    isConnected,
    exerciseName = 'exercise',
    targetReps = 10,
    debug = true,
  } = options;

  const prevRepCountRef = useRef<number>(0);
  const repErrorsRef = useRef<Set<string>>(new Set());
  const lastFeedbackTimeRef = useRef<number>(0);

  // Minimum time between feedback (ms) to avoid overwhelming the user
  const FEEDBACK_COOLDOWN = 3000;

  // Subscribe to store changes - collect errors and send context on rep completion
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
        const now = Date.now();
        const timeSinceLastFeedback = now - lastFeedbackTimeRef.current;

        // Respect cooldown unless it's a milestone
        const isHalfway = state.repCount === Math.floor(targetReps / 2);
        const isComplete = state.repCount >= targetReps;
        const isMilestone = isHalfway || isComplete;

        if (timeSinceLastFeedback < FEEDBACK_COOLDOWN && !isMilestone) {
          // Skip feedback but still clear errors
          repErrorsRef.current.clear();
          prevRepCount = state.repCount;
          prevRepCountRef.current = state.repCount;
          return;
        }

        const formScore = state.formScore;
        const errors = Array.from(repErrorsRef.current);
        const phase = state.phase;

        console.log(`[useFormEventBridge] Rep ${state.repCount}/${targetReps} | Score: ${formScore}% | Errors: ${errors.join(', ') || 'none'}`);

        // Build context for LLM
        let context = '';

        if (isComplete) {
          // Session complete
          context = `[SESSION END]
Exercise: ${exerciseName}
Reps completed: ${state.repCount}/${targetReps}
Final form score: ${formScore}%
The user has completed all reps. Provide a warm closing.`;
        } else if (isHalfway) {
          // Halfway milestone
          context = `[REP COMPLETED]
Exercise: ${exerciseName}
Rep: ${state.repCount}/${targetReps} (HALFWAY POINT)
Form score: ${formScore}%
${errors.length > 0 ? `Form issues this rep: ${errors.join(', ')}` : 'Form was good this rep.'}
Acknowledge the halfway milestone briefly.`;
        } else if (errors.length > 0) {
          // Form feedback needed
          context = `[FORM FEEDBACK NEEDED]
Exercise: ${exerciseName}
Rep: ${state.repCount}/${targetReps}
Form score: ${formScore}%
Form issues detected: ${errors.join(', ')}
Current phase: ${phase}
Give ONE brief correction (5-15 words max). Focus on what TO do, not what's wrong.`;
        } else if (formScore >= 80) {
          // Good form - occasional encouragement
          if (state.repCount % 3 === 0) {
            context = `[REP COMPLETED]
Exercise: ${exerciseName}
Rep: ${state.repCount}/${targetReps}
Form score: ${formScore}%
Form was good. Brief encouragement (5 words max).`;
          }
        }

        // Send context to LLM if we have any
        if (context) {
          console.log(`[useFormEventBridge] Injecting context:\n${context}`);
          injectContext(context);
          lastFeedbackTimeRef.current = now;
        }

        // Reset errors for next rep
        repErrorsRef.current.clear();
      }

      prevRepCount = state.repCount;
      prevRepCountRef.current = state.repCount;
    });

    return unsubscribe;
  }, [isConnected, targetReps, exerciseName, injectContext, debug]);

  // Reset when exercise changes
  useEffect(() => {
    prevRepCountRef.current = 0;
    repErrorsRef.current.clear();
    lastFeedbackTimeRef.current = 0;
    console.log(`[useFormEventBridge] Reset for exercise: ${exerciseName}`);
  }, [exerciseName]);
}

export default useFormEventBridge;
