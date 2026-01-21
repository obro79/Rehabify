/**
 * Voice Event Types
 *
 * Types for the FormEventBridge that routes vision events to voice feedback.
 */

/**
 * Types of events that can trigger voice feedback
 */
export type FormEventType =
  | 'FORM_ERROR'
  | 'REP_COMPLETE'
  | 'PHASE_CHANGE'
  | 'SESSION_START'
  | 'SESSION_END'
  | 'REST_PERIOD'
  | 'PAIN_INDICATION';

/**
 * Common form error types detected by vision system
 */
export type FormErrorType =
  | 'hip_sag'
  | 'hip_pike'
  | 'lumbar_hyperextension'
  | 'lumbar_flexion'
  | 'insufficient_flexion'
  | 'insufficient_extension'
  | 'shoulder_shrug'
  | 'neck_hyperextension'
  | 'asymmetry'
  | 'speed_too_fast'
  | 'speed_too_slow'
  | 'range_of_motion'
  | 'position_drift'
  | 'knee_forward'
  | 'forward_lean'
  | 'insufficient_depth'
  | 'hands_on_legs'
  | 'unknown';

/**
 * Exercise phases
 */
export type ExercisePhase =
  | 'neutral'
  | 'cat'
  | 'camel'
  | 'up'
  | 'down'
  | 'hold'
  | 'transition'
  | 'rest';

/**
 * Priority levels for voice feedback routing
 * Higher priority = more immediate feedback
 */
export enum EventPriority {
  LOW = 1,      // Rep complete, phase change - context for LLM
  MEDIUM = 2,   // First/second form error - context for LLM
  HIGH = 3,     // Repeated form error (3rd+) - immediate cue
  CRITICAL = 4, // Pain/safety issue - immediate stop
}

/**
 * Details for different event types
 */
export interface FormErrorDetails {
  errorType: FormErrorType;
  severity: 'mild' | 'moderate' | 'severe';
  bodyPart?: string;
  correction?: string;
}

export interface RepCompleteDetails {
  repNumber: number;
  targetReps: number;
  formScore: number;
}

export interface PhaseChangeDetails {
  previousPhase: ExercisePhase;
  newPhase: ExercisePhase;
}

export interface SessionDetails {
  exerciseId: string;
  exerciseName: string;
  totalReps?: number;
  averageFormScore?: number;
  duration?: number;
}

export interface PainDetails {
  painLevel: number;
  location: string;
}

/**
 * Union type for event details
 */
export type FormEventDetails =
  | { type: 'FORM_ERROR'; data: FormErrorDetails }
  | { type: 'REP_COMPLETE'; data: RepCompleteDetails }
  | { type: 'PHASE_CHANGE'; data: PhaseChangeDetails }
  | { type: 'SESSION_START'; data: SessionDetails }
  | { type: 'SESSION_END'; data: SessionDetails }
  | { type: 'REST_PERIOD'; data: { duration: number } }
  | { type: 'PAIN_INDICATION'; data: PainDetails };

/**
 * A form event that may trigger voice feedback
 */
export interface FormEvent {
  /** Event type */
  type: FormEventType;
  /** Exercise ID */
  exerciseId: string;
  /** Event timestamp */
  timestamp: number;
  /** Event-specific details */
  details: FormEventDetails;
}

/**
 * Message format for Vapi context injection
 */
export interface VapiContextMessage {
  type: 'add-message';
  message: {
    role: 'system';
    content: string;
  };
}

/**
 * Interface for Vapi methods used by event handlers
 */
export interface VapiMethods {
  say: (text: string) => void;
  injectContext: (context: string) => void;
}

/**
 * Correction phrase mapping for form errors
 */
export const FORM_ERROR_CORRECTIONS: Record<FormErrorType, string> = {
  hip_sag: 'Try lifting your hips a bit higher',
  hip_pike: 'Lower your hips to form a straight line',
  lumbar_hyperextension: 'Press your lower back toward the floor',
  lumbar_flexion: 'Keep your spine neutral',
  insufficient_flexion: 'Try bending a little more',
  insufficient_extension: 'Extend a bit further if comfortable',
  shoulder_shrug: 'Relax your shoulders away from your ears',
  neck_hyperextension: 'Keep your neck neutral, look at the floor',
  asymmetry: 'Try to keep both sides even',
  speed_too_fast: 'Slow down just a bit',
  speed_too_slow: 'You can move a little faster',
  range_of_motion: 'Try to increase your range slightly',
  position_drift: 'Come back to center',
  knee_forward: 'Sit back more, keep knees over ankles',
  forward_lean: 'Keep your chest up',
  insufficient_depth: 'Try to get a bit lower if comfortable',
  hands_on_legs: 'Keep your hands off your legs for balance',
  unknown: 'Adjust your form slightly',
};

/**
 * Priority mapping for error types
 */
export const ERROR_PRIORITY: Record<FormErrorType, EventPriority> = {
  hip_sag: EventPriority.MEDIUM,
  hip_pike: EventPriority.MEDIUM,
  lumbar_hyperextension: EventPriority.HIGH, // Safety concern
  lumbar_flexion: EventPriority.HIGH, // Safety concern
  insufficient_flexion: EventPriority.LOW,
  insufficient_extension: EventPriority.LOW,
  shoulder_shrug: EventPriority.LOW,
  neck_hyperextension: EventPriority.MEDIUM,
  asymmetry: EventPriority.LOW,
  speed_too_fast: EventPriority.LOW,
  speed_too_slow: EventPriority.LOW,
  range_of_motion: EventPriority.LOW,
  position_drift: EventPriority.MEDIUM,
  knee_forward: EventPriority.MEDIUM,
  forward_lean: EventPriority.HIGH, // Safety concern - spine position
  insufficient_depth: EventPriority.LOW,
  hands_on_legs: EventPriority.MEDIUM,
  unknown: EventPriority.LOW,
};
