// Exercise Types - Exercise, ExerciseTier, BodyRegion
// Used by specs 10, 11, 13, 15

/**
 * Exercise tier levels
 * Tier 1: Full AI form detection with MediaPipe
 * Tier 2: Voice-guided only with timer/manual rep counting
 */
export type ExerciseTier = 1 | 2;

/**
 * Body region for filtering exercises
 */
export type BodyRegion =
  | 'neck'
  | 'shoulder'
  | 'back'
  | 'core'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'wrist'
  | 'full-body';

/**
 * Exercise difficulty level
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Exercise definition
 */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  tier: ExerciseTier;
  bodyRegion: BodyRegion;
  difficulty: DifficultyLevel;
  defaultSets: number;
  defaultReps: number;
  defaultHoldSeconds?: number;
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  /** For tier 1 exercises: phases to detect */
  phases?: string[];
  /** For tier 1 exercises: form rules */
  formRules?: string[];
}
