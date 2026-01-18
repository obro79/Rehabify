/**
 * Assessment Store Selectors
 *
 * Memoized selectors for derived assessment state.
 */

import type { AssessmentState, AssessmentActions } from './assessment-store';

type AssessmentStore = AssessmentState & AssessmentActions;

// Phase selectors
export const selectCurrentPhase = (state: AssessmentStore) => state.currentPhase;
export const selectCurrentNode = (state: AssessmentStore) => state.currentNodeId;
export const selectIsComplete = (state: AssessmentStore) => state.isComplete;
export const selectHasRedFlag = (state: AssessmentStore) => state.hasRedFlag;

// Data selectors
export const selectChiefComplaint = (state: AssessmentStore) => state.data.chiefComplaint;
export const selectPainProfile = (state: AssessmentStore) => state.data.pain;
export const selectFunctionalImpact = (state: AssessmentStore) => state.data.functional;
export const selectMedicalHistory = (state: AssessmentStore) => state.data.history;
export const selectMovementScreen = (state: AssessmentStore) => state.data.movementScreen;

// Derived selectors
export const selectIsInMovementPhase = (state: AssessmentStore) =>
  state.currentPhase === 'movement';

export const selectIsInInterviewPhase = (state: AssessmentStore) =>
  state.currentPhase === 'interview';

export const selectIsInSummaryPhase = (state: AssessmentStore) =>
  state.currentPhase === 'summary';

export const selectShouldShowCamera = (state: AssessmentStore) =>
  state.currentPhase === 'movement' && !state.isComplete;

export const selectPainLevel = (state: AssessmentStore) =>
  state.data.pain.currentLevel;

export const selectBodyPart = (state: AssessmentStore) =>
  state.data.chiefComplaint.bodyPart;

export const selectDirectionalPreference = (state: AssessmentStore): 'flexion' | 'extension' | 'neutral' => {
  const { flexion, extension } = state.data.movementScreen;

  if (flexion.pain === null || extension.pain === null) {
    return 'neutral';
  }

  // Flexion intolerant = prefers extension
  if (flexion.pain > 5 && extension.pain < 3) {
    return 'extension';
  }

  // Extension intolerant = prefers flexion
  if (extension.pain > 5 && flexion.pain < 3) {
    return 'flexion';
  }

  return 'neutral';
};

export const selectAssessmentDuration = (state: AssessmentStore) => {
  if (!state.startedAt) return 0;
  return Math.floor((Date.now() - state.startedAt) / 1000);
};

export const selectTranscript = (state: AssessmentStore) => state.transcript;

export const selectLastTranscriptEntry = (state: AssessmentStore) =>
  state.transcript[state.transcript.length - 1];
