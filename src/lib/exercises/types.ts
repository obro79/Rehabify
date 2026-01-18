// Exercise type definitions matching the seed data schema

// Duration calculation constants
const SECONDS_PER_REP = 3;
const DEFAULT_REST_SECONDS = 15;

export type ExerciseTier = 1 | 2;

export type ExerciseCategory =
  | "mobility"
  | "extension"
  | "core_stability"
  | "strengthening"
  | "stretch"
  | "neural_mobilization";

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export type RepType =
  | "standard"
  | "alternating"
  | "per_side"
  | "timed_hold"
  | "hold";

export type Equipment =
  | "yoga_mat"
  | "chair"
  | "wall"
  | "foam_roller"
  | "doorway"
  | "bed"
  | "none"
  | "resistance_band"
  | "step_platform"
  | "dumbbell"
  | "sliders"
  | "partner_or_anchor"
  | "bench"
  | "stationary_bike"
  | "balance_board"
  | "balance_pad"
  | "bosu_ball"
  | "leg_press_machine"
  | "leg_extension_machine"
  | "hamstring_curl_machine"
  | "box"
  | "towel"
  | "marbles"
  | "frozen_bottle"
  | "wobble_board"
  | "jump_rope"
  | "agility_ladder"
  | "strap"
  | "wand"
  | "table";

export type BodyRegion =
  | "lower_back"
  | "knee"
  | "ankle"
  | "shoulder";

export interface ExerciseModifications {
  easier: string;
  harder: string;
}

export interface DetectionConfig {
  phases: string[];
  key_landmarks: string[];
  thresholds: Record<string, number>;
}

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  tier: ExerciseTier;
  body_region: BodyRegion;
  category: ExerciseCategory;
  target_area: string;
  difficulty: ExerciseDifficulty;
  description: string;
  instructions: string[];
  common_mistakes: string[];
  modifications: ExerciseModifications;
  contraindications: string[];
  default_reps: number;
  default_sets: number;
  default_hold_seconds: number;
  rep_type: RepType;
  equipment: Equipment;
  video_url: string | null;
  thumbnail_url: string | null;
  form_detection_enabled: boolean;
  detection_config?: DetectionConfig;
}

// Simplified exercise for display in cards/lists
export interface ExerciseCardData {
  id: string;
  slug: string;
  name: string;
  category: DisplayCategory;
  duration: string;
  reps: number;
  difficulty: 1 | 2 | 3 | 4 | 5; // Star rating
  tier: ExerciseTier;
  description: string;
}

// Display categories (simplified for UI)
export type DisplayCategory = "Mobility" | "Strength" | "Stability" | "Stretch";

// Map raw categories to display categories
export function mapToDisplayCategory(category: ExerciseCategory): DisplayCategory {
  switch (category) {
    case "mobility":
    case "extension":
      return "Mobility";
    case "core_stability":
      return "Stability";
    case "strengthening":
      return "Strength";
    case "stretch":
    case "neural_mobilization":
      return "Stretch";
    default:
      return "Mobility";
  }
}

// Difficulty level mapping constant
export const DIFFICULTY_LEVELS: Record<ExerciseDifficulty, 1 | 2 | 3 | 4 | 5> = {
  beginner: 2,
  intermediate: 3,
  advanced: 4,
};

// Map difficulty to star rating (1-5)
export function mapDifficultyToStars(difficulty: ExerciseDifficulty): 1 | 2 | 3 | 4 | 5 {
  return DIFFICULTY_LEVELS[difficulty] ?? 2;
}

// Format duration from reps/sets/hold time
export function formatDuration(exercise: Exercise): string {
  if (exercise.rep_type === "timed_hold" || exercise.rep_type === "hold") {
    const totalSeconds = exercise.default_hold_seconds * exercise.default_sets;
    if (totalSeconds >= 60) {
      return `${Math.round(totalSeconds / 60)} min`;
    }
    return `${totalSeconds} sec`;
  }
  // Estimate using defined constants
  const estimatedSeconds = exercise.default_reps * exercise.default_sets * SECONDS_PER_REP +
    (exercise.default_sets - 1) * DEFAULT_REST_SECONDS;
  return `${Math.round(estimatedSeconds / 60)} min`;
}
