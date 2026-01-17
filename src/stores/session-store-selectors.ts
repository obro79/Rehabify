/**
 * Session Store Selectors
 *
 * Reusable selectors for useSessionStore(selector) to prevent unnecessary re-renders.
 */

import type { SessionState } from './session-store';

// Atomic Selectors

export const selectSessionId = (state: SessionState): string | null => state.sessionId;
export const selectIsPaused = (state: SessionState): boolean => state.isPaused;
export const selectTotalReps = (state: SessionState): number => state.totalReps;
export const selectAverageFormScore = (state: SessionState): number => state.averageFormScore;
export const selectTotalDuration = (state: SessionState): number => state.totalDuration;
export const selectCurrentExerciseIndex = (state: SessionState): number => state.currentExerciseIndex;
export const selectPlanId = (state: SessionState): string | null => state.planId;
export const selectStartedAt = (state: SessionState): number | null => state.startedAt;

// Derived Selectors

export function selectSessionDuration(state: SessionState): number {
  if (!state.startedAt) return 0;
  const now = state.isPaused && state.pausedAt ? state.pausedAt : Date.now();
  return Math.floor((now - state.startedAt) / 1000);
}

export function selectCompletedExerciseCount(state: SessionState): number {
  return state.exerciseHistory.length;
}

export function selectIsSessionActive(state: SessionState): boolean {
  return state.sessionId !== null && state.startedAt !== null;
}

export function selectHasNextExercise(state: SessionState): boolean {
  return (
    state.planExercises.length > 0 &&
    state.currentExerciseIndex < state.planExercises.length - 1
  );
}

export function selectCurrentExerciseId(state: SessionState): string | null {
  if (state.planExercises.length === 0) return null;
  if (state.currentExerciseIndex >= state.planExercises.length) return null;
  return state.planExercises[state.currentExerciseIndex];
}

// Progress Selector

export interface SessionProgress {
  completed: number;
  total: number;
  percentage: number;
  currentIndex: number;
  isComplete: boolean;
}

export function selectSessionProgress(state: SessionState): SessionProgress {
  const completed = state.exerciseHistory.length;
  const total = state.planExercises.length || 1;
  const percentage = Math.min(Math.round((completed / total) * 100), 100);

  return {
    completed,
    total: state.planExercises.length,
    percentage,
    currentIndex: state.currentExerciseIndex,
    isComplete: state.planExercises.length > 0 && completed >= state.planExercises.length,
  };
}

// Summary Selector

export interface SessionSummary {
  duration: number;
  formattedDuration: string;
  totalReps: number;
  averageFormScore: number;
  exercisesCompleted: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function selectSessionSummary(state: SessionState): SessionSummary {
  return {
    duration: state.totalDuration,
    formattedDuration: formatDuration(state.totalDuration),
    totalReps: state.totalReps,
    averageFormScore: state.averageFormScore,
    exercisesCompleted: state.exerciseHistory.length,
  };
}
