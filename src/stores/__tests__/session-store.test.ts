/**
 * Session Store Tests
 * Tests for session lifecycle and metrics accumulation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../session-store';
import type { ExerciseResult } from '@/types';

describe('session-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSessionStore.getState().reset();
  });

  describe('startSession', () => {
    it('generates sessionId and sets startedAt', () => {
      const store = useSessionStore.getState();

      expect(store.sessionId).toBeNull();
      expect(store.startedAt).toBeNull();

      store.startSession();

      const state = useSessionStore.getState();
      expect(state.sessionId).toBeTruthy();
      expect(typeof state.sessionId).toBe('string');
      expect(state.sessionId!.length).toBeGreaterThan(0);
      expect(state.startedAt).toBeTruthy();
      expect(typeof state.startedAt).toBe('number');
    });

    it('accepts optional planId and exerciseIds', () => {
      const store = useSessionStore.getState();
      const planId = 'plan-123';
      const exerciseIds = ['ex-1', 'ex-2', 'ex-3'];

      store.startSession(planId, exerciseIds);

      const state = useSessionStore.getState();
      expect(state.planId).toBe(planId);
      expect(state.planExercises).toEqual(exerciseIds);
    });
  });

  describe('pauseSession', () => {
    it('sets isPaused true and pausedAt timestamp', () => {
      const store = useSessionStore.getState();
      store.startSession();

      expect(useSessionStore.getState().isPaused).toBe(false);
      expect(useSessionStore.getState().pausedAt).toBeNull();

      store.pauseSession();

      const state = useSessionStore.getState();
      expect(state.isPaused).toBe(true);
      expect(state.pausedAt).toBeTruthy();
      expect(typeof state.pausedAt).toBe('number');
    });
  });

  describe('resumeSession', () => {
    it('clears pausedAt and sets isPaused false', () => {
      const store = useSessionStore.getState();
      store.startSession();
      store.pauseSession();

      expect(useSessionStore.getState().isPaused).toBe(true);
      expect(useSessionStore.getState().pausedAt).toBeTruthy();

      store.resumeSession();

      const state = useSessionStore.getState();
      expect(state.isPaused).toBe(false);
      expect(state.pausedAt).toBeNull();
    });
  });

  describe('recordExerciseResult', () => {
    it('appends to exerciseHistory', () => {
      const store = useSessionStore.getState();
      store.startSession();

      expect(useSessionStore.getState().exerciseHistory).toHaveLength(0);

      const result: ExerciseResult = {
        exerciseId: 'ex-1',
        exerciseName: 'Cat-Camel',
        reps: 10,
        sets: 3,
        formScore: 85,
        duration: 120,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      store.recordExerciseResult(result);

      const state = useSessionStore.getState();
      expect(state.exerciseHistory).toHaveLength(1);
      expect(state.exerciseHistory[0]).toEqual(result);

      // Add another result
      const result2: ExerciseResult = {
        exerciseId: 'ex-2',
        exerciseName: 'Cobra',
        reps: 8,
        sets: 2,
        formScore: 90,
        duration: 90,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      store.recordExerciseResult(result2);

      expect(useSessionStore.getState().exerciseHistory).toHaveLength(2);
    });
  });

  describe('addReps', () => {
    it('accumulates totalReps correctly', () => {
      const store = useSessionStore.getState();
      store.startSession();

      expect(useSessionStore.getState().totalReps).toBe(0);

      store.addReps(5);
      expect(useSessionStore.getState().totalReps).toBe(5);

      store.addReps(3);
      expect(useSessionStore.getState().totalReps).toBe(8);

      store.addReps(10);
      expect(useSessionStore.getState().totalReps).toBe(18);
    });
  });

  describe('reset', () => {
    it('clears all session state', () => {
      const store = useSessionStore.getState();

      // Set up a session with some data
      store.startSession('plan-123', ['ex-1', 'ex-2']);
      store.addReps(10);
      store.recordExerciseResult({
        exerciseId: 'ex-1',
        exerciseName: 'Test Exercise',
        reps: 10,
        sets: 2,
        formScore: 80,
        duration: 60,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      // Verify state is populated
      expect(useSessionStore.getState().sessionId).toBeTruthy();
      expect(useSessionStore.getState().totalReps).toBe(10);
      expect(useSessionStore.getState().exerciseHistory).toHaveLength(1);

      // Reset
      store.reset();

      // Verify all state is cleared
      const state = useSessionStore.getState();
      expect(state.sessionId).toBeNull();
      expect(state.startedAt).toBeNull();
      expect(state.pausedAt).toBeNull();
      expect(state.isPaused).toBe(false);
      expect(state.totalReps).toBe(0);
      expect(state.averageFormScore).toBe(0);
      expect(state.totalDuration).toBe(0);
      expect(state.exerciseHistory).toHaveLength(0);
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.planId).toBeNull();
      expect(state.planExercises).toHaveLength(0);
    });
  });
});
