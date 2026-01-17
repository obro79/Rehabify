// Vision Types - FormError, FormAnalysis, LandmarkData, etc.
// Used by specs 10, 11, 12, 13

/**
 * Severity level for form errors
 */
export type ErrorSeverity = 'info' | 'warning' | 'error';

/**
 * A detected form error during exercise execution
 */
export interface FormError {
  /** Unique error type identifier (e.g., 'hip_drop', 'spine_not_curved') */
  type: string;
  /** Human-readable error message for voice coaching */
  message: string;
  /** Severity level for prioritizing corrections */
  severity: ErrorSeverity;
  /** When the error was detected */
  timestamp: number;
  /** Optional: affected body part for targeted feedback */
  bodyPart?: string;
}

/**
 * Result of analyzing a video frame for exercise form
 */
export interface FormAnalysis {
  /** Whether current form is acceptable */
  isCorrect: boolean;
  /** Current phase of the exercise (e.g., 'cat', 'neutral', 'camel') */
  phase: string;
  /** Array of detected form errors */
  errors: FormError[];
  /** Current rep count */
  repCount: number;
  /** Form quality score 0-100 */
  formScore: number;
  /** Optional: confidence level of the analysis */
  confidence?: number;
}

/**
 * MediaPipe pose landmark structure
 * 33 body landmarks with 3D coordinates and visibility
 */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/**
 * Full set of pose landmarks from MediaPipe
 */
export interface LandmarkData {
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
  timestamp: number;
}

/**
 * Message sent from vision worker to main thread
 */
export interface VisionWorkerMessage {
  type: 'landmarks' | 'analysis' | 'error' | 'ready';
  landmarks?: LandmarkData;
  analysis?: FormAnalysis;
  error?: string;
}

/**
 * Message sent from main thread to vision worker
 */
export interface VisionWorkerCommand {
  type: 'init' | 'frame' | 'setExercise' | 'reset';
  frame?: ImageData;
  exerciseId?: string;
}
