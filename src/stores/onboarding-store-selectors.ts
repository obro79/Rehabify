/**
 * Onboarding Store Selectors
 *
 * Reusable selectors for useOnboardingStore(selector) to prevent unnecessary re-renders.
 */

import type { OnboardingState, OnboardingStep } from './onboarding-store';

// Atomic Selectors

export const selectCurrentStep = (state: OnboardingState): OnboardingStep =>
  state.currentStep;
export const selectAssessmentDraft = (state: OnboardingState) =>
  state.assessmentDraft;
export const selectBodyRegions = (state: OnboardingState) =>
  state.assessmentDraft.bodyRegions;
export const selectPainLevels = (state: OnboardingState) =>
  state.assessmentDraft.painLevels;
export const selectGoals = (state: OnboardingState) =>
  state.assessmentDraft.goals;
export const selectCameraPermission = (state: OnboardingState) =>
  state.cameraPermission;
export const selectMicPermission = (state: OnboardingState) =>
  state.micPermission;
export const selectIsComplete = (state: OnboardingState) => state.isComplete;

// Derived Selectors

export function selectHasAllPermissions(state: OnboardingState): boolean {
  return (
    state.cameraPermission === 'granted' && state.micPermission === 'granted'
  );
}

export function selectProgressPercentage(state: OnboardingState): number {
  return ((state.currentStep - 1) / 3) * 100;
}
