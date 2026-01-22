/**
 * Exercise Store - Real-time exercise state management
 *
 * Updated by VisionService (MediaPipe worker), read by FormEventBridge and UI components.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FormError } from '@/types';
import type { Exercise } from '@/lib/exercises/types';

export interface ExerciseState {
  currentExercise: Exercise | null;
  phase: string;
  repCount: number;
  formScore: number;
  activeErrors: FormError[];
  isInPosition: boolean;
  confidence: number;
}

export interface ExerciseActions {
  setExercise: (exercise: Exercise | null) => void;
  setPhase: (phase: string) => void;
  incrementRep: () => void;
  setFormScore: (score: number) => void;
  addError: (error: FormError) => void;
  clearError: (errorType: string) => void;
  clearAllErrors: () => void;
  setInPosition: (inPosition: boolean) => void;
  setConfidence: (confidence: number) => void;
  reset: () => void;
}

const initialState: ExerciseState = {
  currentExercise: null,
  phase: 'neutral',
  repCount: 0,
  formScore: 100,
  activeErrors: [],
  isInPosition: false,
  confidence: 0,
};

export const useExerciseStore = create<ExerciseState & ExerciseActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setExercise: (exercise) => set({ currentExercise: exercise }),
      setPhase: (phase) => set({ phase }),
      incrementRep: () => set((state) => ({ repCount: state.repCount + 1 })),
      setFormScore: (formScore) => set({ formScore }),

      addError: (error) =>
        set((state) => ({
          activeErrors: [...state.activeErrors, error],
        })),

      clearError: (errorType) =>
        set((state) => ({
          activeErrors: state.activeErrors.filter((e) => e.type !== errorType),
        })),

      clearAllErrors: () => set({ activeErrors: [] }),
      setInPosition: (isInPosition) => set({ isInPosition }),
      setConfidence: (confidence) => set({ confidence }),
      reset: () => set(initialState),
    }),
    { name: 'exercise-store', enabled: process.env.NODE_ENV === 'development' }
  )
);
