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
  /** Whether the assistant is currently speaking */
  isSpeaking: boolean;
  /** Whether we're in the analyzing phase (form feedback enabled) */
  isAnalyzing: boolean;
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
    isSpeaking,
    isAnalyzing,
    exerciseName = 'exercise',
    targetReps = 10,
    debug = true,
  } = options;

  const prevRepCountRef = useRef<number>(0);
  const repErrorsRef = useRef<Set<string>>(new Set());
  const lastFeedbackTimeRef = useRef<number>(0);
  const pendingContextRef = useRef<string | null>(null);

  // Minimum time between feedback (ms) to avoid overwhelming the user
  const FEEDBACK_COOLDOWN = 3000;

  // Send pending context when assistant stops speaking
  useEffect(() => {
    if (!isSpeaking && pendingContextRef.current && isConnected) {
      console.log(`[useFormEventBridge] 🎤 Assistant stopped speaking, sending queued context`);
      injectContext(pendingContextRef.current);
      lastFeedbackTimeRef.current = Date.now();
      pendingContextRef.current = null;
    }
  }, [isSpeaking, isConnected, injectContext]);

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
          // Form feedback needed - include specific cue suggestions for variety
          const errorCues: Record<string, string[]> = {
            forward_lean: ['chest up', 'tall spine', 'proud chest', 'shoulders back', 'look forward'],
            insufficient_depth: ['sink deeper', 'drop lower', 'hips below knees', 'deeper squat', 'all the way down'],
            knee_forward: ['knees out', 'push knees wide', 'track over toes', 'spread the floor', 'knees follow toes'],
            knee_valgus: ['knees out', 'push knees apart', 'knees over pinky toes', 'spread the floor'],
            heel_rise: ['heels down', 'weight in heels', 'press through heels', 'ground your heels'],
          };

          // Pick a random cue for the primary error
          const primaryError = errors[0];
          const cues = errorCues[primaryError] || ['good form'];
          const suggestedCue = cues[Math.floor(Math.random() * cues.length)];

          context = `[FORM FEEDBACK NEEDED]
Exercise: ${exerciseName}
Rep: ${state.repCount}/${targetReps}
Form score: ${formScore}%
Form issues detected: ${errors.join(', ')}
Current phase: ${phase}
Give ONE brief correction (5-15 words max). Use varied phrasing each time.
Suggested cue: "${suggestedCue}" - rephrase this naturally, don't repeat exactly.`;
        } else {
          // Good form - give brief encouragement on every rep
          context = `[REP COMPLETED]
Exercise: ${exerciseName}
Rep: ${state.repCount}/${targetReps}
Form score: ${formScore}%
Form was good. Brief encouragement (3-5 words max). Examples: "Nice!", "Good rep!", "Keep it up!"`;
        }

        // Send context to LLM if we have any
        if (context) {
          console.log(`[useFormEventBridge] 📤 Preparing context for Vapi:\n${context}`);
          console.log(`[useFormEventBridge] ⏱️ Time since last feedback: ${timeSinceLastFeedback}ms`);
          console.log(`[useFormEventBridge] 🎤 Assistant speaking: ${isSpeaking}`);

          if (isSpeaking) {
            // Queue context to send when assistant stops speaking
            console.log(`[useFormEventBridge] ⏸️ Assistant is speaking, queuing context...`);
            pendingContextRef.current = context;
          } else {
            // Send immediately
            injectContext(context);
            lastFeedbackTimeRef.current = now;
            console.log(`[useFormEventBridge] ✅ Context injection complete`);
          }
        } else {
          console.log(`[useFormEventBridge] ⏭️ No context to inject (score=${formScore}%, errors=${errors.length}, rep=${state.repCount})`);
        }

        // Reset errors for next rep
        repErrorsRef.current.clear();
      }

      prevRepCount = state.repCount;
      prevRepCountRef.current = state.repCount;
    });

    return unsubscribe;
  }, [isConnected, isSpeaking, targetReps, exerciseName, injectContext, debug]);

  // Reset when exercise changes
  useEffect(() => {
    prevRepCountRef.current = 0;
    repErrorsRef.current.clear();
    lastFeedbackTimeRef.current = 0;
    console.log(`[useFormEventBridge] Reset for exercise: ${exerciseName}`);
  }, [exerciseName]);
}

export default useFormEventBridge;
