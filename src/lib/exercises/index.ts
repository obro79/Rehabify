// Exercise data and utilities
import exerciseData from "./data.json";
import {
  Exercise,
  ExerciseCardData,
  ExerciseTier,
  DisplayCategory,
  mapToDisplayCategory,
  mapDifficultyToStars,
  formatDuration,
} from "./types";

// Export types
export * from "./types";

// All exercises from the database
export const exercises: Exercise[] = exerciseData.exercises as Exercise[];

// Exercise metadata
export const metadata = exerciseData.metadata;

// Tier 1 exercises (AI form detection)
export const tier1Exercises = exercises.filter((ex) => ex.tier === 1);

// Tier 2 exercises (guided only)
export const tier2Exercises = exercises.filter((ex) => ex.tier === 2);

// O(1) lookup Maps initialized at module load
const exercisesByIdMap = new Map<string, Exercise>(
  exercises.map((ex) => [ex.id, ex])
);

const exercisesBySlugMap = new Map<string, Exercise>(
  exercises.map((ex) => [ex.slug, ex])
);

// Get exercise by ID - O(1) lookup
export function getExerciseById(id: string): Exercise | undefined {
  return exercisesByIdMap.get(id);
}

// Get exercise by slug - O(1) lookup
export function getExerciseBySlug(slug: string): Exercise | undefined {
  return exercisesBySlugMap.get(slug);
}

// Build category map for O(1) lookup by category
const exercisesByCategoryMap = new Map<DisplayCategory, Exercise[]>();
exercises.forEach((ex) => {
  const category = mapToDisplayCategory(ex.category);
  const existing = exercisesByCategoryMap.get(category) || [];
  existing.push(ex);
  exercisesByCategoryMap.set(category, existing);
});

// Get exercises by category - O(1) lookup
export function getExercisesByCategory(category: DisplayCategory): Exercise[] {
  return exercisesByCategoryMap.get(category) || [];
}

// Get exercises by tier
export function getExercisesByTier(tier: ExerciseTier): Exercise[] {
  return exercises.filter((ex) => ex.tier === tier);
}

// Convert Exercise to ExerciseCardData for display
export function toCardData(exercise: Exercise): ExerciseCardData {
  return {
    id: exercise.id,
    name: exercise.name,
    category: mapToDisplayCategory(exercise.category),
    duration: formatDuration(exercise),
    reps: exercise.default_reps,
    difficulty: mapDifficultyToStars(exercise.difficulty),
    tier: exercise.tier,
    description: exercise.description,
  };
}

// Get recommended exercises for dashboard
// Returns a mix of Tier 1 (for demo) and Tier 2 exercises
export function getRecommendedExercises(count: number = 4): ExerciseCardData[] {
  // Prioritize Tier 1 for demo, then add variety
  const tier1 = tier1Exercises.slice(0, 2);
  const tier2 = tier2Exercises.slice(0, count - tier1.length);

  return [...tier1, ...tier2].map(toCardData);
}

// Get exercises by target area
export function getExercisesByTargetArea(targetArea: string): Exercise[] {
  return exercises.filter((ex) => ex.target_area === targetArea);
}

// Search exercises by name or description
export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.description.toLowerCase().includes(lowerQuery)
  );
}

// Get unique categories for filtering
export function getUniqueCategories(): DisplayCategory[] {
  const categories = new Set(exercises.map((ex) => mapToDisplayCategory(ex.category)));
  return Array.from(categories);
}

// Get unique target areas for filtering
export function getUniqueTargetAreas(): string[] {
  const areas = new Set(exercises.map((ex) => ex.target_area));
  return Array.from(areas);
}
