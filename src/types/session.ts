// Session Types - SessionState, ExerciseResult, SessionMetrics
// Used by specs 10, 13, 14, 21

/**
 * Status of a workout session
 */
export type SessionStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

/**
 * Result data for a single exercise within a session
 */
export interface ExerciseResult {
  /** Exercise identifier */
  exerciseId: string;
  /** Exercise name for display */
  exerciseName: string;
  /** Reps completed */
  reps: number;
  /** Sets completed */
  sets: number;
  /** Average form score 0-100 */
  formScore: number;
  /** Duration in seconds */
  duration: number;
  /** Pain level reported 1-10 (optional) */
  painLevel?: number;
  /** Voice feedback transcript (optional) */
  voiceFeedback?: string;
  /** Timestamps */
  startedAt: string;
  completedAt: string;
}

/**
 * Metrics aggregated for a session
 */
export interface SessionMetrics {
  /** Total exercises completed */
  exercisesCompleted: number;
  /** Total exercises prescribed */
  exercisesPrescribed: number;
  /** Average form score across exercises */
  averageFormScore: number;
  /** Total reps across all exercises */
  totalReps: number;
  /** Session duration in seconds */
  totalDuration: number;
  /** Overall pain rating 1-10 */
  overallPain?: number;
  /** Overall satisfaction rating 1-5 */
  overallRating?: number;
}

/**
 * An exercise prescription (what the patient should do)
 */
export interface ExercisePrescription {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  restSeconds?: number;
  notes?: string;
  /** Whether this exercise has tier 1 (vision) support */
  hasVisionSupport: boolean;
}

/**
 * Full session state (for Zustand store)
 */
export interface SessionState {
  /** Session identifier */
  id: string | null;
  /** Current status */
  status: SessionStatus;
  /** Prescribed exercises for this session */
  exercises: ExercisePrescription[];
  /** Completed exercise results */
  results: ExerciseResult[];
  /** Aggregated metrics */
  metrics: SessionMetrics;
  /** When session started */
  startedAt: string | null;
  /** When session ended */
  completedAt: string | null;
}

/**
 * Pain log entry for daily check-in
 */
export interface PainLogEntry {
  id: string;
  userId: string;
  date: string;
  painLevel: number; // 1-10
  location: string;
  notes?: string;
  createdAt: string;
}
