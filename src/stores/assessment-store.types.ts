/**
 * Assessment Store Types and Initial State
 *
 * Defines all types for the voice-guided assessment workflow.
 */

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
    romAngle?: number;
  };
  extension: {
    pain: number | null;
    comparison?: 'better' | 'worse' | 'same';
    romAngle?: number;
  };
  sideBend: {
    pain: number | null;
    painSide?: 'left' | 'right' | 'both' | 'neither';
    leftAngle?: number;
    rightAngle?: number;
  };
}

export interface MovementResult {
  exerciseSlug: string;
  exerciseName: string;
  formScore: number;
  repCount: number;
  completedAt: number;
}

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type AssessmentPhase = 'interview' | 'movement' | 'summary';

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
  currentNodeId: string | null;
  currentPhase: AssessmentPhase;
  isComplete: boolean;
  hasRedFlag: boolean;
  startedAt: number | null;
  workflowId: string | null;
  data: AssessmentData;
  transcript: TranscriptEntry[];
}

export interface AssessmentActions {
  startAssessment: (workflowId: string) => void;
  setCurrentNode: (nodeId: string) => void;
  setPhase: (phase: AssessmentPhase) => void;
  setComplete: () => void;
  setRedFlag: () => void;
  updateChiefComplaint: (data: Partial<ChiefComplaint>) => void;
  updatePain: (data: Partial<PainProfile>) => void;
  updateFunctional: (data: Partial<FunctionalImpact>) => void;
  updateHistory: (data: Partial<MedicalHistory>) => void;
  updateMovementScreen: (data: Partial<MovementScreen>) => void;
  setSummaryConfirmed: (confirmed: boolean) => void;
  setWantsToStart: (wantsToStart: boolean) => void;
  setFlexionROM: (angle: number) => void;
  setExtensionROM: (angle: number) => void;
  setSideBendROM: (leftAngle: number, rightAngle: number) => void;
  addMovementResult: (result: Omit<MovementResult, 'completedAt'>) => void;
  addTranscript: (entry: { role: 'user' | 'assistant'; content: string }) => void;
  reset: () => void;
  getAssessmentPayload: () => AssessmentData & { duration: number };
}

export type AssessmentStore = AssessmentState & AssessmentActions;

export const initialData: AssessmentData = {
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

export const initialState: AssessmentState = {
  currentNodeId: null,
  currentPhase: 'interview',
  isComplete: false,
  hasRedFlag: false,
  startedAt: null,
  workflowId: null,
  data: initialData,
  transcript: [],
};
