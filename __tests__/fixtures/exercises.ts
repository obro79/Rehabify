/**
 * Exercise Test Fixtures
 *
 * Shared mock data factories for exercise-related tests.
 * Use these helpers to create consistent test data across test files.
 */

import type { Exercise } from '@/lib/exercises/types';

/**
 * Creates a mock exercise with sensible defaults.
 * Override any property by passing partial data.
 */
export function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-exercise-1',
    name: 'Test Exercise',
    slug: 'test-exercise',
    tier: 2,
    body_region: 'lower_back',
    category: 'mobility',
    target_area: 'spine',
    difficulty: 'beginner',
    description: 'A test exercise for unit testing',
    instructions: ['Step 1', 'Step 2'],
    common_mistakes: ['Mistake 1'],
    modifications: {
      easier: 'Do less',
      harder: 'Do more',
    },
    contraindications: [],
    default_reps: 10,
    default_sets: 3,
    default_hold_seconds: 0,
    rep_type: 'standard',
    equipment: 'none',
    video_url: null,
    thumbnail_url: null,
    form_detection_enabled: false,
    ...overrides,
  };
}

/**
 * Creates a mock tier 1 exercise with form detection enabled.
 */
export function createMockTier1Exercise(overrides: Partial<Exercise> = {}): Exercise {
  return createMockExercise({
    tier: 1,
    form_detection_enabled: true,
    detection_config: {
      phases: ['neutral', 'cat', 'camel'],
      key_landmarks: ['hip', 'shoulder', 'spine'],
      thresholds: { hip_angle: 15, spine_curvature: 20 },
    },
    ...overrides,
  });
}

/**
 * Creates a mock timed hold exercise.
 */
export function createMockTimedExercise(overrides: Partial<Exercise> = {}): Exercise {
  return createMockExercise({
    rep_type: 'timed_hold',
    default_hold_seconds: 30,
    default_reps: 0,
    ...overrides,
  });
}
