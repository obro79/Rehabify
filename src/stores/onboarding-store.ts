/**
 * Onboarding Store
 *
 * Manages onboarding wizard state with localStorage persistence for resume capability.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BodyRegion } from '@/lib/exercises/types';

const STORAGE_KEY = 'rehabify_onboarding_draft';

export type OnboardingStep = 1 | 2 | 3 | 4;
export type PermissionStatus = 'pending' | 'granted' | 'denied';
export type PermissionType = 'camera' | 'mic';

export interface AssessmentDraft {
  bodyRegions: BodyRegion[];
  painLevels: Record<string, number>;
  goals: string[];
  medicalHistory: string;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  assessmentDraft: AssessmentDraft;
  cameraPermission: PermissionStatus;
  micPermission: PermissionStatus;
  isComplete: boolean;
}

export interface OnboardingActions {
  setStep: (step: OnboardingStep) => void;
  updateAssessmentData: (data: Partial<AssessmentDraft>) => void;
  setPermissionStatus: (type: PermissionType, status: PermissionStatus) => void;
  setComplete: (complete: boolean) => void;
  reset: () => void;
}

const initialAssessmentDraft: AssessmentDraft = {
  bodyRegions: [],
  painLevels: {},
  goals: [],
  medicalHistory: '',
};

const initialState: OnboardingState = {
  currentStep: 1,
  assessmentDraft: initialAssessmentDraft,
  cameraPermission: 'pending',
  micPermission: 'pending',
  isComplete: false,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setStep: (step) => set({ currentStep: step }, false, 'setStep'),

        updateAssessmentData: (data) =>
          set(
            (state) => ({
              assessmentDraft: { ...state.assessmentDraft, ...data },
            }),
            false,
            'updateAssessmentData'
          ),

        setPermissionStatus: (type, status) =>
          set(
            type === 'camera' ? { cameraPermission: status } : { micPermission: status },
            false,
            'setPermissionStatus'
          ),

        setComplete: (complete) => set({ isComplete: complete }, false, 'setComplete'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          assessmentDraft: state.assessmentDraft,
          currentStep: state.currentStep,
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.isComplete) {
            localStorage.removeItem(STORAGE_KEY);
          }
        },
      }
    ),
    { name: 'onboarding-store', enabled: process.env.NODE_ENV === 'development' }
  )
);

