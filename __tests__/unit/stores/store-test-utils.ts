/**
 * Store Test Utilities
 *
 * Type-safe helpers for testing Zustand stores.
 * Provides utilities to reset stores between tests and seed with test data.
 */

import { useExerciseStore } from '@/stores/exercise-store';
import { useSessionStore } from '@/stores/session-store';
import { useVoiceStore } from '@/stores/voice-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { usePTStore } from '@/stores/pt-store';
import type { FormError, ExerciseResult } from '@/types';
import type { TranscriptEntry } from '@/stores/voice-store';
import type { AssessmentDraft } from '@/stores/onboarding-store';

/**
 * Resets all Zustand stores to their initial state.
 * Call in beforeEach to ensure test isolation.
 */
export function resetAllStores(): void {
  useExerciseStore.getState().reset();
  useSessionStore.getState().reset();
  useVoiceStore.getState().reset();
  useOnboardingStore.getState().reset();
  usePTStore.getState().clearDraftPlan();
  usePTStore.getState().setSelectedPatient(null);
}

/**
 * Resets a specific store by name.
 * Use when only testing a single store to minimize reset overhead.
 */
export function resetStore(
  storeName: 'exercise' | 'session' | 'voice' | 'onboarding' | 'pt'
): void {
  switch (storeName) {
    case 'exercise':
      useExerciseStore.getState().reset();
      break;
    case 'session':
      useSessionStore.getState().reset();
      break;
    case 'voice':
      useVoiceStore.getState().reset();
      break;
    case 'onboarding':
      useOnboardingStore.getState().reset();
      break;
    case 'pt':
      usePTStore.getState().clearDraftPlan();
      usePTStore.getState().setSelectedPatient(null);
      break;
  }
}

/**
 * Creates a test FormError with sensible defaults.
 * Override any property by passing partial data.
 */
export function createTestFormError(
  overrides: Partial<FormError> = {}
): FormError {
  return {
    type: 'test_error',
    message: 'Test error message',
    severity: 'warning',
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Creates a test ExerciseResult with sensible defaults.
 * Override any property by passing partial data.
 */
export function createTestExerciseResult(
  overrides: Partial<ExerciseResult> = {}
): ExerciseResult {
  const now = new Date().toISOString();
  return {
    exerciseId: 'test-exercise-id',
    exerciseName: 'Test Exercise',
    reps: 10,
    sets: 3,
    formScore: 85,
    duration: 120,
    startedAt: now,
    completedAt: now,
    ...overrides,
  };
}

/**
 * Creates a test TranscriptEntry with sensible defaults.
 */
export function createTestTranscript(
  overrides: Partial<TranscriptEntry> = {}
): TranscriptEntry {
  return {
    role: 'user',
    content: 'Test transcript message',
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Creates a test AssessmentDraft with sensible defaults.
 */
export function createTestAssessmentDraft(
  overrides: Partial<AssessmentDraft> = {}
): AssessmentDraft {
  return {
    bodyRegions: [],
    painLevels: {},
    goals: [],
    medicalHistory: '',
    ...overrides,
  };
}

/**
 * Seeds the exercise store with test state.
 */
export function seedExerciseStore(options: {
  phase?: string;
  repCount?: number;
  formScore?: number;
  errors?: FormError[];
  isInPosition?: boolean;
  confidence?: number;
} = {}): void {
  const store = useExerciseStore.getState();

  if (options.phase) store.setPhase(options.phase);
  if (options.repCount) {
    for (let i = 0; i < options.repCount; i++) {
      store.incrementRep();
    }
  }
  if (options.formScore !== undefined) store.setFormScore(options.formScore);
  if (options.errors) {
    options.errors.forEach((error) => store.addError(error));
  }
  if (options.isInPosition !== undefined) store.setInPosition(options.isInPosition);
  if (options.confidence !== undefined) store.setConfidence(options.confidence);
}

/**
 * Seeds the session store with a started session.
 */
export function seedSessionStore(options: {
  planId?: string;
  exerciseIds?: string[];
  reps?: number;
  exerciseResults?: ExerciseResult[];
} = {}): void {
  const store = useSessionStore.getState();
  store.startSession(options.planId, options.exerciseIds);

  if (options.reps) {
    store.addReps(options.reps);
  }

  if (options.exerciseResults) {
    options.exerciseResults.forEach((result) => {
      store.recordExerciseResult(result);
    });
  }
}

/**
 * Seeds the voice store with test state.
 */
export function seedVoiceStore(options: {
  connectionState?: 'disconnected' | 'connecting' | 'connected' | 'error';
  speakingStatus?: 'idle' | 'listening' | 'thinking' | 'speaking';
  error?: string | null;
  volumeLevel?: number;
  transcripts?: TranscriptEntry[];
  isMuted?: boolean;
} = {}): void {
  const store = useVoiceStore.getState();

  if (options.connectionState) store.setConnectionState(options.connectionState);
  if (options.speakingStatus) store.setSpeakingStatus(options.speakingStatus);
  if (options.error !== undefined) store.setError(options.error);
  if (options.volumeLevel !== undefined) store.setVolumeLevel(options.volumeLevel);
  if (options.transcripts) {
    options.transcripts.forEach((entry) => store.addTranscript(entry));
  }
  if (options.isMuted !== undefined) store.setMuted(options.isMuted);
}

/**
 * Seeds the onboarding store with test state.
 */
export function seedOnboardingStore(options: {
  step?: 1 | 2 | 3 | 4;
  assessmentDraft?: Partial<AssessmentDraft>;
  cameraPermission?: 'pending' | 'granted' | 'denied';
  micPermission?: 'pending' | 'granted' | 'denied';
  isComplete?: boolean;
} = {}): void {
  const store = useOnboardingStore.getState();

  if (options.step) store.setStep(options.step);
  if (options.assessmentDraft) store.updateAssessmentData(options.assessmentDraft);
  if (options.cameraPermission) store.setPermissionStatus('camera', options.cameraPermission);
  if (options.micPermission) store.setPermissionStatus('mic', options.micPermission);
  if (options.isComplete !== undefined) store.setComplete(options.isComplete);
}

/**
 * Creates a plan exercise for testing the PT store.
 */
export function createTestPlanExercise(
  overrides: Partial<{
    id: string;
    exerciseId: string;
    name: string;
    category: string;
    sets: number;
    reps: number;
    order: number;
  }> = {}
): {
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  order: number;
} {
  return {
    id: `test-plan-ex-${Date.now()}`,
    exerciseId: 'cat-camel',
    name: 'Cat-Camel',
    category: 'mobility',
    sets: 2,
    reps: 10,
    order: 0,
    ...overrides,
  };
}

/**
 * Seeds the PT store draft plan with exercises.
 */
export function seedPTStoreDraftPlan(exercises: Array<{
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  order: number;
}>): void {
  const store = usePTStore.getState();
  exercises.forEach((exercise) => {
    store.addExerciseToPlan(exercise);
  });
}

/**
 * Returns a snapshot of the current exercise store state.
 * Useful for assertions.
 */
export function getExerciseStoreSnapshot() {
  return useExerciseStore.getState();
}

/**
 * Returns a snapshot of the current session store state.
 */
export function getSessionStoreSnapshot() {
  return useSessionStore.getState();
}

/**
 * Returns a snapshot of the current voice store state.
 */
export function getVoiceStoreSnapshot() {
  return useVoiceStore.getState();
}

/**
 * Returns a snapshot of the current onboarding store state.
 */
export function getOnboardingStoreSnapshot() {
  return useOnboardingStore.getState();
}

/**
 * Returns a snapshot of the current PT store state.
 */
export function getPTStoreSnapshot() {
  return usePTStore.getState();
}
