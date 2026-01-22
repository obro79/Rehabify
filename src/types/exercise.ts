// Exercise Types - Re-exported from lib/exercises/types (source of truth)
// Used by specs 10, 11, 13, 15
//
// This module re-exports exercise types from the canonical source at
// @/lib/exercises/types to ensure a single source of truth for exercise
// type definitions throughout the codebase.

export {
  type Exercise,
  type ExerciseTier,
  type BodyRegion,
  type ExerciseDifficulty,
  type ExerciseCategory,
  type RepType,
  type Equipment,
  type ExerciseModifications,
  type DetectionConfig,
  type ExerciseCardData,
  type DisplayCategory,
  mapToDisplayCategory,
  mapDifficultyToStars,
  formatDuration,
  DIFFICULTY_LEVELS,
} from '@/lib/exercises/types';

// Alias for backward compatibility
export type { ExerciseDifficulty as DifficultyLevel } from '@/lib/exercises/types';
