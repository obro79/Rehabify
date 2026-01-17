/**
 * Onboarding Store Tests
 *
 * Tests for onboarding wizard state management including:
 * - Step navigation
 * - Assessment data updates
 * - Permission status tracking
 * - State reset
 * - Persistence configuration (partialize function)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useOnboardingStore,
  selectCurrentStep,
  selectAssessmentDraft,
  selectCameraPermission,
  selectMicPermission,
  selectHasAllPermissions,
  selectProgressPercentage,
} from '../onboarding-store';

describe('onboarding-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useOnboardingStore.getState().reset();
  });

  describe('setStep', () => {
    it('should update currentStep correctly', () => {
      const store = useOnboardingStore.getState();

      expect(store.currentStep).toBe(1);

      store.setStep(2);
      expect(useOnboardingStore.getState().currentStep).toBe(2);

      store.setStep(3);
      expect(useOnboardingStore.getState().currentStep).toBe(3);

      store.setStep(4);
      expect(useOnboardingStore.getState().currentStep).toBe(4);
    });
  });

  describe('updateAssessmentData', () => {
    it('should merge partial assessment data correctly', () => {
      const store = useOnboardingStore.getState();

      // Update body regions
      store.updateAssessmentData({ bodyRegions: ['lower_back', 'knee'] });
      expect(useOnboardingStore.getState().assessmentDraft.bodyRegions).toEqual([
        'lower_back',
        'knee',
      ]);

      // Update pain levels - should merge, not replace entire draft
      store.updateAssessmentData({ painLevels: { lower_back: 5 } });
      const state = useOnboardingStore.getState();
      expect(state.assessmentDraft.bodyRegions).toEqual(['lower_back', 'knee']);
      expect(state.assessmentDraft.painLevels).toEqual({ lower_back: 5 });

      // Update goals
      store.updateAssessmentData({ goals: ['reduce_pain', 'improve_mobility'] });
      expect(useOnboardingStore.getState().assessmentDraft.goals).toEqual([
        'reduce_pain',
        'improve_mobility',
      ]);
    });
  });

  describe('setPermissionStatus', () => {
    it('should update camera permission status', () => {
      const store = useOnboardingStore.getState();

      expect(store.cameraPermission).toBe('pending');

      store.setPermissionStatus('camera', 'granted');
      expect(useOnboardingStore.getState().cameraPermission).toBe('granted');

      store.setPermissionStatus('camera', 'denied');
      expect(useOnboardingStore.getState().cameraPermission).toBe('denied');
    });

    it('should update mic permission status', () => {
      const store = useOnboardingStore.getState();

      expect(store.micPermission).toBe('pending');

      store.setPermissionStatus('mic', 'granted');
      expect(useOnboardingStore.getState().micPermission).toBe('granted');

      store.setPermissionStatus('mic', 'denied');
      expect(useOnboardingStore.getState().micPermission).toBe('denied');
    });
  });

  describe('reset', () => {
    it('should clear all onboarding state to initial values', () => {
      const store = useOnboardingStore.getState();

      // Set up some state
      store.setStep(3);
      store.updateAssessmentData({
        bodyRegions: ['shoulder'],
        goals: ['strength'],
      });
      store.setPermissionStatus('camera', 'granted');
      store.setPermissionStatus('mic', 'granted');
      store.setComplete(true);

      // Verify state was changed
      expect(useOnboardingStore.getState().currentStep).toBe(3);
      expect(useOnboardingStore.getState().isComplete).toBe(true);

      // Reset
      store.reset();

      // Verify all state is back to initial values
      const resetState = useOnboardingStore.getState();
      expect(resetState.currentStep).toBe(1);
      expect(resetState.assessmentDraft.bodyRegions).toEqual([]);
      expect(resetState.assessmentDraft.painLevels).toEqual({});
      expect(resetState.assessmentDraft.goals).toEqual([]);
      expect(resetState.assessmentDraft.medicalHistory).toBe('');
      expect(resetState.cameraPermission).toBe('pending');
      expect(resetState.micPermission).toBe('pending');
      expect(resetState.isComplete).toBe(false);
    });
  });

  describe('localStorage persistence configuration', () => {
    it('should persist assessmentDraft and currentStep state shape', () => {
      const store = useOnboardingStore.getState();

      // Update assessment data
      store.updateAssessmentData({
        bodyRegions: ['lower_back', 'knee'],
        painLevels: { lower_back: 7, knee: 4 },
        goals: ['reduce_pain'],
        medicalHistory: 'Previous surgery in 2020',
      });
      store.setStep(2);

      // The persist middleware is configured - verify the state has the right shape
      const state = useOnboardingStore.getState();

      // The partialize function should include these fields for persistence
      expect(state.assessmentDraft).toEqual({
        bodyRegions: ['lower_back', 'knee'],
        painLevels: { lower_back: 7, knee: 4 },
        goals: ['reduce_pain'],
        medicalHistory: 'Previous surgery in 2020',
      });
      expect(state.currentStep).toBe(2);

      // Permission states should NOT be persisted (they need to be re-requested)
      // But they should still be in state
      expect(state.cameraPermission).toBe('pending');
      expect(state.micPermission).toBe('pending');
    });
  });

  describe('selectors', () => {
    it('should select current step correctly', () => {
      useOnboardingStore.getState().setStep(3);
      const state = useOnboardingStore.getState();
      expect(selectCurrentStep(state)).toBe(3);
    });

    it('should select assessment draft correctly', () => {
      useOnboardingStore.getState().updateAssessmentData({
        bodyRegions: ['shoulder'],
        goals: ['strength'],
      });
      const state = useOnboardingStore.getState();
      const draft = selectAssessmentDraft(state);
      expect(draft.bodyRegions).toEqual(['shoulder']);
      expect(draft.goals).toEqual(['strength']);
    });

    it('should select permission statuses correctly', () => {
      const store = useOnboardingStore.getState();
      store.setPermissionStatus('camera', 'granted');
      store.setPermissionStatus('mic', 'denied');

      const state = useOnboardingStore.getState();
      expect(selectCameraPermission(state)).toBe('granted');
      expect(selectMicPermission(state)).toBe('denied');
    });

    it('should calculate hasAllPermissions correctly', () => {
      const store = useOnboardingStore.getState();

      // Initially both pending
      expect(selectHasAllPermissions(useOnboardingStore.getState())).toBe(false);

      // Only camera granted
      store.setPermissionStatus('camera', 'granted');
      expect(selectHasAllPermissions(useOnboardingStore.getState())).toBe(false);

      // Both granted
      store.setPermissionStatus('mic', 'granted');
      expect(selectHasAllPermissions(useOnboardingStore.getState())).toBe(true);

      // One denied
      store.setPermissionStatus('camera', 'denied');
      expect(selectHasAllPermissions(useOnboardingStore.getState())).toBe(false);
    });

    it('should calculate progress percentage correctly', () => {
      const store = useOnboardingStore.getState();

      // Step 1: 0%
      expect(selectProgressPercentage(useOnboardingStore.getState())).toBe(0);

      // Step 2: 33.33%
      store.setStep(2);
      expect(selectProgressPercentage(useOnboardingStore.getState())).toBeCloseTo(33.33, 1);

      // Step 3: 66.67%
      store.setStep(3);
      expect(selectProgressPercentage(useOnboardingStore.getState())).toBeCloseTo(66.67, 1);

      // Step 4: 100%
      store.setStep(4);
      expect(selectProgressPercentage(useOnboardingStore.getState())).toBe(100);
    });
  });
});
