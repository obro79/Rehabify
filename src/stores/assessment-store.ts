/**
 * Assessment Store - State management for voice-guided assessment
 *
 * Tracks current phase, interview data, ROM measurements, and session metadata.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interview data types
export interface ChiefComplaint {
  bodyPart: string | null;
  symptomType: string | null;
  duration: string | null;
  onset: 'gradual' | 'sudden' | 'injury' | null;
  onsetDetails?: string;
}

export interface PainProfile {
  currentLevel: number | null;
  worstLevel: number | null;
  character: string[];
  radiates: boolean;
  radiationPattern?: string;
  aggravators: string[];
  relievers: string[];
}

export interface FunctionalImpact {
  limitedActivities: string[];
  dailyImpact: string | null;
  goals: string[];
}

export interface MedicalHistory {
  previousInjuries: boolean;
  previousInjuryDetails?: string;
  imaging: 'xray' | 'mri' | 'ct' | 'none' | null;
  imagingFindings?: string;
  currentTreatment: string | null;
  redFlags: string[];
}

export interface MovementScreen {
  flexion: {
    pain: number | null;
    painLocation?: string;
    romAngle?: number; // From vision
  };
  extension: {
    pain: number | null;
    comparison?: 'better' | 'worse' | 'same';
    romAngle?: number; // From vision
  };
  sideBend: {
    pain: number | null;
    painSide?: 'left' | 'right' | 'both' | 'neither';
    leftAngle?: number; // From vision
    rightAngle?: number; // From vision
  };
}

// Movement result from camera tracking
export interface MovementResult {
  exerciseSlug: string;
  exerciseName: string;
  formScore: number;
  repCount: number;
  completedAt: number;
}

export interface AssessmentData {
  chiefComplaint: ChiefComplaint;
  pain: PainProfile;
  functional: FunctionalImpact;
  history: MedicalHistory;
  movementScreen: MovementScreen;
  movementResults: MovementResult[];
  summaryConfirmed: boolean;
  wantsToStartExercise: boolean;
}

export interface AssessmentState {
  // Workflow state
  currentNodeId: string | null;
  currentPhase: 'interview' | 'movement' | 'summary';
  isComplete: boolean;
  hasRedFlag: boolean;

  // Session metadata
  startedAt: number | null;
  workflowId: string | null;

  // Collected data
  data: AssessmentData;

  // Voice transcript
  transcript: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export interface AssessmentActions {
  // Workflow actions
  startAssessment: (workflowId: string) => void;
  setCurrentNode: (nodeId: string) => void;
  setPhase: (phase: 'interview' | 'movement' | 'summary') => void;
  setComplete: () => void;
  setRedFlag: () => void;

  // Data updates
  updateChiefComplaint: (data: Partial<ChiefComplaint>) => void;
  updatePain: (data: Partial<PainProfile>) => void;
  updateFunctional: (data: Partial<FunctionalImpact>) => void;
  updateHistory: (data: Partial<MedicalHistory>) => void;
  updateMovementScreen: (data: Partial<MovementScreen>) => void;
  setSummaryConfirmed: (confirmed: boolean) => void;
  setWantsToStart: (wantsToStart: boolean) => void;

  // ROM from vision
  setFlexionROM: (angle: number) => void;
  setExtensionROM: (angle: number) => void;
  setSideBendROM: (leftAngle: number, rightAngle: number) => void;

  // Movement results from camera
  addMovementResult: (result: Omit<MovementResult, 'completedAt'>) => void;

  // Transcript
  addTranscript: (entry: { role: 'user' | 'assistant'; content: string }) => void;

  // Utility
  reset: () => void;
  getAssessmentPayload: () => AssessmentData & { duration: number };
}

const initialData: AssessmentData = {
  chiefComplaint: {
    bodyPart: null,
    symptomType: null,
    duration: null,
    onset: null,
  },
  pain: {
    currentLevel: null,
    worstLevel: null,
    character: [],
    radiates: false,
    aggravators: [],
    relievers: [],
  },
  functional: {
    limitedActivities: [],
    dailyImpact: null,
    goals: [],
  },
  history: {
    previousInjuries: false,
    imaging: null,
    currentTreatment: null,
    redFlags: [],
  },
  movementScreen: {
    flexion: { pain: null },
    extension: { pain: null },
    sideBend: { pain: null },
  },
  movementResults: [],
  summaryConfirmed: false,
  wantsToStartExercise: false,
};

const initialState: AssessmentState = {
  currentNodeId: null,
  currentPhase: 'interview',
  isComplete: false,
  hasRedFlag: false,
  startedAt: null,
  workflowId: null,
  data: initialData,
  transcript: [],
};

export const useAssessmentStore = create<AssessmentState & AssessmentActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Workflow actions
      startAssessment: (workflowId) =>
        set({
          workflowId,
          startedAt: Date.now(),
          currentNodeId: 'greeting',
          currentPhase: 'interview',
        }),

      setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),

      setPhase: (phase) => set({ currentPhase: phase }),

      setComplete: () => set({ isComplete: true }),

      setRedFlag: () => set({ hasRedFlag: true }),

      // Data updates
      updateChiefComplaint: (data) =>
        set((state) => ({
          data: {
            ...state.data,
            chiefComplaint: { ...state.data.chiefComplaint, ...data },
          },
        })),

      updatePain: (data) =>
        set((state) => ({
          data: {
            ...state.data,
            pain: { ...state.data.pain, ...data },
          },
        })),

      updateFunctional: (data) =>
        set((state) => ({
          data: {
            ...state.data,
            functional: { ...state.data.functional, ...data },
          },
        })),

      updateHistory: (data) =>
        set((state) => ({
          data: {
            ...state.data,
            history: { ...state.data.history, ...data },
          },
        })),

      updateMovementScreen: (data) =>
        set((state) => ({
          data: {
            ...state.data,
            movementScreen: { ...state.data.movementScreen, ...data },
          },
        })),

      setSummaryConfirmed: (confirmed) =>
        set((state) => ({
          data: { ...state.data, summaryConfirmed: confirmed },
        })),

      setWantsToStart: (wantsToStart) =>
        set((state) => ({
          data: { ...state.data, wantsToStartExercise: wantsToStart },
        })),

      // ROM from vision
      setFlexionROM: (angle) =>
        set((state) => ({
          data: {
            ...state.data,
            movementScreen: {
              ...state.data.movementScreen,
              flexion: { ...state.data.movementScreen.flexion, romAngle: angle },
            },
          },
        })),

      setExtensionROM: (angle) =>
        set((state) => ({
          data: {
            ...state.data,
            movementScreen: {
              ...state.data.movementScreen,
              extension: { ...state.data.movementScreen.extension, romAngle: angle },
            },
          },
        })),

      setSideBendROM: (leftAngle, rightAngle) =>
        set((state) => ({
          data: {
            ...state.data,
            movementScreen: {
              ...state.data.movementScreen,
              sideBend: {
                ...state.data.movementScreen.sideBend,
                leftAngle,
                rightAngle,
              },
            },
          },
        })),

      // Movement results from camera
      addMovementResult: (result) =>
        set((state) => ({
          data: {
            ...state.data,
            movementResults: [
              ...state.data.movementResults,
              { ...result, completedAt: Date.now() },
            ],
          },
        })),

      // Transcript
      addTranscript: (entry) =>
        set((state) => ({
          transcript: [
            ...state.transcript,
            { ...entry, timestamp: Date.now() },
          ],
        })),

      // Utility
      reset: () => set(initialState),

      getAssessmentPayload: () => {
        const state = get();
        const duration = state.startedAt
          ? Math.floor((Date.now() - state.startedAt) / 1000)
          : 0;
        return {
          ...state.data,
          duration,
        };
      },
    }),
    { name: 'assessment-store', enabled: process.env.NODE_ENV === 'development' }
  )
);
