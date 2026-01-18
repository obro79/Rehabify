/**
 * Barrel Export for Zustand Stores
 *
 * Re-exports all stores and selectors for clean imports:
 * import { useExerciseStore, selectRepCount } from '@/stores';
 */

// Exercise Store
export { useExerciseStore } from './exercise-store';
export type { ExerciseState, ExerciseActions } from './exercise-store';

// Exercise Store Selectors
export {
  selectPhase,
  selectRepCount,
  selectFormScore,
  selectActiveErrors,
  selectCurrentExercise,
  selectIsInPosition,
  selectConfidence,
  selectLastFrameAt,
  selectFormQuality,
  selectHasActiveErrors,
  selectActiveErrorCount,
  selectMostSevereError,
  selectVoiceContext,
} from './exercise-store-selectors';
export type { FormQuality, VoiceContextData } from './exercise-store-selectors';

// Session Store
export { useSessionStore } from './session-store';
export type { SessionState, SessionActions } from './session-store';

// Session Store Selectors
export {
  selectSessionId,
  selectIsPaused,
  selectTotalReps,
  selectAverageFormScore,
  selectTotalDuration,
  selectCurrentExerciseIndex,
  selectPlanId,
  selectStartedAt,
  selectSessionDuration,
  selectCompletedExerciseCount,
  selectIsSessionActive,
  selectHasNextExercise,
  selectCurrentExerciseId,
  selectSessionProgress,
  selectSessionSummary,
} from './session-store-selectors';
export type { SessionProgress, SessionSummary } from './session-store-selectors';

// Voice Store
export { useVoiceStore } from './voice-store';
export type {
  VoiceState,
  VoiceActions,
  ConnectionState,
  SpeakingStatus,
  TranscriptEntry,
} from './voice-store';

// Voice Store Selectors
export {
  selectConnectionState,
  selectSpeakingStatus,
  selectIsMuted,
  selectVolumeLevel,
  selectTranscript,
  selectLastSpokenFeedback,
  selectError,
  selectIsConnected,
  selectIsActive,
  selectVoiceIndicatorState,
  selectRecentTranscripts,
} from './voice-store-selectors';
export type { VoiceIndicatorState } from './voice-store-selectors';

// Onboarding Store
export { useOnboardingStore } from './onboarding-store';
export type {
  OnboardingState,
  OnboardingActions,
  OnboardingStep,
  PermissionStatus,
  PermissionType,
  AssessmentDraft,
} from './onboarding-store';

// Onboarding Store Selectors
export {
  selectCurrentStep,
  selectAssessmentDraft,
  selectBodyRegions,
  selectPainLevels,
  selectGoals,
  selectCameraPermission,
  selectMicPermission,
  selectIsComplete,
  selectHasAllPermissions,
  selectProgressPercentage,
} from './onboarding-store-selectors';

// Assessment Store
export { useAssessmentStore } from './assessment-store';
export type {
  AssessmentState,
  AssessmentActions,
  AssessmentData,
  ChiefComplaint,
  PainProfile,
  FunctionalImpact,
  MedicalHistory,
  MovementScreen,
} from './assessment-store';

// Assessment Store Selectors
export {
  selectCurrentPhase,
  selectCurrentNode,
  selectIsComplete as selectAssessmentIsComplete,
  selectHasRedFlag,
  selectChiefComplaint,
  selectPainProfile,
  selectFunctionalImpact,
  selectMedicalHistory,
  selectMovementScreen,
  selectIsInMovementPhase,
  selectIsInInterviewPhase,
  selectIsInSummaryPhase,
  selectShouldShowCamera,
  selectPainLevel,
  selectBodyPart,
  selectDirectionalPreference,
  selectAssessmentDuration,
  selectTranscript as selectAssessmentTranscript,
  selectLastTranscriptEntry,
} from './assessment-selectors';
