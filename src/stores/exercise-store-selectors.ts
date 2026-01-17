/**
 * Exercise Store Selectors
 *
 * Reusable selectors for useExerciseStore(selector) to prevent unnecessary re-renders.
 */

import type { ExerciseState } from './exercise-store';

export type FormQuality = 'good' | 'fair' | 'poor';

// Atomic Selectors

export const selectPhase = (state: ExerciseState): string => state.phase;
export const selectRepCount = (state: ExerciseState): number => state.repCount;
export const selectFormScore = (state: ExerciseState): number => state.formScore;
export const selectActiveErrors = (state: ExerciseState) => state.activeErrors;
export const selectCurrentExercise = (state: ExerciseState) => state.currentExercise;
export const selectIsInPosition = (state: ExerciseState): boolean => state.isInPosition;
export const selectConfidence = (state: ExerciseState): number => state.confidence;
export const selectLastFrameAt = (state: ExerciseState) => state.lastFrameAt;

// Derived Selectors

/** Form quality: good (80+), fair (60-79), poor (<60) */
export function selectFormQuality(state: ExerciseState): FormQuality {
  if (state.formScore >= 80) return 'good';
  if (state.formScore >= 60) return 'fair';
  return 'poor';
}

export function selectHasActiveErrors(state: ExerciseState): boolean {
  return state.activeErrors.length > 0;
}

export function selectActiveErrorCount(state: ExerciseState): number {
  return state.activeErrors.length;
}

/** Returns the most severe error (error > warning > info), or null if none */
export function selectMostSevereError(state: ExerciseState) {
  const { activeErrors } = state;
  if (activeErrors.length === 0) return null;

  const severityOrder = { error: 3, warning: 2, info: 1 };
  return activeErrors.reduce((mostSevere, current) => {
    const currentSeverity = severityOrder[current.severity] ?? 0;
    const mostSevereSeverity = severityOrder[mostSevere.severity] ?? 0;
    return currentSeverity > mostSevereSeverity ? current : mostSevere;
  });
}

// Voice Context (for FormEventBridge integration)

export interface VoiceContextData {
  exercise: string;
  phase: string;
  repCount: number;
  formQuality: FormQuality;
  primaryError: ExerciseState['activeErrors'][number] | null;
  confidence: number;
}

export function selectVoiceContext(state: ExerciseState): VoiceContextData {
  return {
    exercise: state.currentExercise?.name ?? '',
    phase: state.phase,
    repCount: state.repCount,
    formQuality: selectFormQuality(state),
    primaryError: state.activeErrors[0] ?? null,
    confidence: state.confidence,
  };
}
