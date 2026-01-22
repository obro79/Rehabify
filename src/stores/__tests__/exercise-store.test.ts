/**
 * Focused tests for exercise-store functionality
 * Testing core state transitions and selectors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useExerciseStore } from '../exercise-store';
import type { FormError } from '@/types';

describe('Exercise Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useExerciseStore.getState().reset();
  });

  describe('Phase Management', () => {
    it('should update phase correctly with setPhase', () => {
      const store = useExerciseStore.getState();

      expect(store.phase).toBe('neutral');

      store.setPhase('cat');
      expect(useExerciseStore.getState().phase).toBe('cat');

      store.setPhase('camel');
      expect(useExerciseStore.getState().phase).toBe('camel');
    });
  });

  describe('Rep Counting', () => {
    it('should increment repCount by 1 with incrementRep', () => {
      const store = useExerciseStore.getState();

      expect(store.repCount).toBe(0);

      store.incrementRep();
      expect(useExerciseStore.getState().repCount).toBe(1);

      store.incrementRep();
      store.incrementRep();
      expect(useExerciseStore.getState().repCount).toBe(3);
    });
  });

  describe('Error Management', () => {
    it('should append error to activeErrors with addError', () => {
      const store = useExerciseStore.getState();

      const error1: FormError = {
        type: 'hip_drop',
        message: 'Keep your hips level',
        severity: 'warning',
        timestamp: Date.now(),
      };

      const error2: FormError = {
        type: 'spine_not_curved',
        message: 'Arch your back more',
        severity: 'error',
        timestamp: Date.now(),
        bodyPart: 'spine',
      };

      expect(store.activeErrors).toHaveLength(0);

      store.addError(error1);
      expect(useExerciseStore.getState().activeErrors).toHaveLength(1);
      expect(useExerciseStore.getState().activeErrors[0].type).toBe('hip_drop');

      store.addError(error2);
      expect(useExerciseStore.getState().activeErrors).toHaveLength(2);
      expect(useExerciseStore.getState().activeErrors[1].type).toBe('spine_not_curved');
    });

    it('should remove specific error by type with clearError', () => {
      const store = useExerciseStore.getState();

      // Add multiple errors
      store.addError({
        type: 'hip_drop',
        message: 'Keep your hips level',
        severity: 'warning',
        timestamp: Date.now(),
      });

      store.addError({
        type: 'spine_not_curved',
        message: 'Arch your back more',
        severity: 'error',
        timestamp: Date.now(),
      });

      store.addError({
        type: 'knee_past_toes',
        message: 'Keep knees behind toes',
        severity: 'warning',
        timestamp: Date.now(),
      });

      expect(useExerciseStore.getState().activeErrors).toHaveLength(3);

      // Clear specific error by type
      store.clearError('spine_not_curved');

      const remainingErrors = useExerciseStore.getState().activeErrors;
      expect(remainingErrors).toHaveLength(2);
      expect(remainingErrors.find(e => e.type === 'spine_not_curved')).toBeUndefined();
      expect(remainingErrors.find(e => e.type === 'hip_drop')).toBeDefined();
      expect(remainingErrors.find(e => e.type === 'knee_past_toes')).toBeDefined();
    });
  });

  describe('Form Score', () => {
    it('should update formScore value with setFormScore', () => {
      const store = useExerciseStore.getState();

      expect(store.formScore).toBe(100);

      store.setFormScore(85);
      expect(useExerciseStore.getState().formScore).toBe(85);

      store.setFormScore(0);
      expect(useExerciseStore.getState().formScore).toBe(0);

      store.setFormScore(100);
      expect(useExerciseStore.getState().formScore).toBe(100);
    });
  });

  describe('Reset', () => {
    it('should return all state to initial values with reset', () => {
      const store = useExerciseStore.getState();

      // Modify state
      store.setPhase('cat');
      store.incrementRep();
      store.incrementRep();
      store.setFormScore(75);
      store.addError({
        type: 'test_error',
        message: 'Test',
        severity: 'info',
        timestamp: Date.now(),
      });
      store.setInPosition(true);
      store.setConfidence(0.95);

      // Verify state was modified
      let state = useExerciseStore.getState();
      expect(state.phase).toBe('cat');
      expect(state.repCount).toBe(2);
      expect(state.formScore).toBe(75);
      expect(state.activeErrors).toHaveLength(1);
      expect(state.isInPosition).toBe(true);
      expect(state.confidence).toBe(0.95);

      // Reset
      store.reset();

      // Verify initial state
      state = useExerciseStore.getState();
      expect(state.currentExercise).toBeNull();
      expect(state.phase).toBe('neutral');
      expect(state.repCount).toBe(0);
      expect(state.formScore).toBe(100);
      expect(state.activeErrors).toHaveLength(0);
      expect(state.isInPosition).toBe(false);
      expect(state.confidence).toBe(0);
    });
  });
});
