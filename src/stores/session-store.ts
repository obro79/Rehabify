/**
 * Session Store
 *
 * Tracks workout session lifecycle, exercise history, and accumulated metrics.
 * Includes localStorage persistence for crash recovery within a 5-minute window.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ExerciseResult } from '@/types';
import {
  persist as persistToStorage,
  restore as restoreFromStorage,
  clearPersisted as clearPersistedStorage,
  extractSessionState,
} from '@/lib/session/session-persistence';

export interface SessionState {
  sessionId: string | null;
  startedAt: number | null;
  pausedAt: number | null;
  isPaused: boolean;
  totalReps: number;
  averageFormScore: number;
  totalDuration: number;
  exerciseHistory: ExerciseResult[];
  currentExerciseIndex: number;
  planId: string | null;
  planExercises: string[];
}

export interface SessionActions {
  startSession: (planId?: string, exerciseIds?: string[]) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  recordExerciseResult: (result: ExerciseResult) => void;
  advanceToNextExercise: () => void;
  updateDuration: () => void;
  addReps: (count: number) => void;
  updateAverageFormScore: (newScore: number) => void;
  reset: () => void;
  // Persistence actions
  persistSession: () => boolean;
  restoreSession: () => SessionState | null;
  clearPersistedSession: () => void;
}

const initialState: SessionState = {
  sessionId: null,
  startedAt: null,
  pausedAt: null,
  isPaused: false,
  totalReps: 0,
  averageFormScore: 0,
  totalDuration: 0,
  exerciseHistory: [],
  currentExerciseIndex: 0,
  planId: null,
  planExercises: [],
};


export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      startSession: (planId?: string, exerciseIds?: string[]) => {
        set({
          sessionId: crypto.randomUUID(),
          startedAt: Date.now(),
          pausedAt: null,
          isPaused: false,
          totalReps: 0,
          averageFormScore: 0,
          totalDuration: 0,
          exerciseHistory: [],
          currentExerciseIndex: 0,
          planId: planId ?? null,
          planExercises: exerciseIds ?? [],
        });
      },

      pauseSession: () => {
        set({ isPaused: true, pausedAt: Date.now() });
        // Persist on pause for crash recovery
        const state = extractSessionState(get());
        persistToStorage(state);
      },

      resumeSession: () => {
        set({ isPaused: false, pausedAt: null });
      },

      endSession: () => {
        get().updateDuration();
        // Clear persisted data on session end
        clearPersistedStorage();
        set(initialState);
      },

      recordExerciseResult: (result: ExerciseResult) => {
        set((state) => ({
          exerciseHistory: [...state.exerciseHistory, result],
        }));
        // Persist on exercise complete
        const state = extractSessionState(get());
        persistToStorage(state);
      },

      advanceToNextExercise: () => {
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
        }));
      },

      updateDuration: () => {
        const state = get();
        if (!state.startedAt) return;

        const now = state.isPaused && state.pausedAt ? state.pausedAt : Date.now();
        const elapsedSeconds = Math.floor((now - state.startedAt) / 1000);
        set({ totalDuration: elapsedSeconds });
      },

      addReps: (count: number) => {
        set((state) => ({ totalReps: state.totalReps + count }));
        // Persist on rep complete
        const state = extractSessionState(get());
        persistToStorage(state);
      },

      updateAverageFormScore: (newScore: number) => {
        const state = get();
        const totalExercises = state.exerciseHistory.length + 1;
        const currentTotal = state.averageFormScore * state.exerciseHistory.length;
        const newAverage = (currentTotal + newScore) / totalExercises;
        set({ averageFormScore: Math.round(newAverage) });
      },

      reset: () => set(initialState),

      // Persistence actions

      /**
       * Persist current session state to localStorage
       * @returns true if persistence succeeded
       */
      persistSession: () => {
        const state = extractSessionState(get());
        return persistToStorage(state);
      },

      /**
       * Attempt to restore a session from localStorage
       * Returns the restored state if within the 5-minute window, null otherwise
       */
      restoreSession: () => {
        return restoreFromStorage();
      },

      /**
       * Clear persisted session data from localStorage
       */
      clearPersistedSession: () => {
        clearPersistedStorage();
      },
    }),
    { name: 'session-store', enabled: process.env.NODE_ENV === 'development' }
  )
);
