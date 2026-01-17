/**
 * Utility Function Tests
 *
 * Tests for src/lib/utils.ts and src/lib/exercises/types.ts utilities.
 * Covers className merging, category mapping, difficulty mapping, and duration formatting.
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';
import {
  mapToDisplayCategory,
  mapDifficultyToStars,
  formatDuration,
  DIFFICULTY_LEVELS,
} from '@/lib/exercises/types';
import type {
  Exercise,
  ExerciseCategory,
  ExerciseDifficulty,
  DisplayCategory,
} from '@/lib/exercises/types';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles undefined values', () => {
      const result = cn('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles null values', () => {
      const result = cn('class1', null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles false values (conditional classes)', () => {
      const result = cn('class1', false && 'class2', 'class3');
      expect(result).toBe('class1 class3');
    });

    it('handles true conditional values', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base active');
    });

    it('merges Tailwind conflicting classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('handles object syntax', () => {
      const result = cn({ 'class1': true, 'class2': false, 'class3': true });
      expect(result).toBe('class1 class3');
    });

    it('handles array syntax', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('handles mixed syntax', () => {
      const result = cn('base', ['array-class'], { 'object-class': true });
      expect(result).toBe('base array-class object-class');
    });

    it('returns empty string for no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('returns empty string for only falsy values', () => {
      const result = cn(null, undefined, false, '');
      expect(result).toBe('');
    });
  });
});

describe('Exercise Type Utilities', () => {
  describe('mapToDisplayCategory', () => {
    it('maps "mobility" to "Mobility"', () => {
      expect(mapToDisplayCategory('mobility')).toBe('Mobility');
    });

    it('maps "extension" to "Mobility"', () => {
      expect(mapToDisplayCategory('extension')).toBe('Mobility');
    });

    it('maps "core_stability" to "Stability"', () => {
      expect(mapToDisplayCategory('core_stability')).toBe('Stability');
    });

    it('maps "strengthening" to "Strength"', () => {
      expect(mapToDisplayCategory('strengthening')).toBe('Strength');
    });

    it('maps "stretch" to "Stretch"', () => {
      expect(mapToDisplayCategory('stretch')).toBe('Stretch');
    });

    it('maps "neural_mobilization" to "Stretch"', () => {
      expect(mapToDisplayCategory('neural_mobilization')).toBe('Stretch');
    });

    it('returns valid DisplayCategory for all ExerciseCategory values', () => {
      const allCategories: ExerciseCategory[] = [
        'mobility',
        'extension',
        'core_stability',
        'strengthening',
        'stretch',
        'neural_mobilization',
      ];
      const validDisplayCategories: DisplayCategory[] = ['Mobility', 'Strength', 'Stability', 'Stretch'];

      allCategories.forEach((category) => {
        const result = mapToDisplayCategory(category);
        expect(validDisplayCategories).toContain(result);
      });
    });
  });

  describe('mapDifficultyToStars', () => {
    it('maps "beginner" to 2 stars', () => {
      expect(mapDifficultyToStars('beginner')).toBe(2);
    });

    it('maps "intermediate" to 3 stars', () => {
      expect(mapDifficultyToStars('intermediate')).toBe(3);
    });

    it('maps "advanced" to 4 stars', () => {
      expect(mapDifficultyToStars('advanced')).toBe(4);
    });

    it('returns value between 1 and 5', () => {
      const difficulties: ExerciseDifficulty[] = ['beginner', 'intermediate', 'advanced'];

      difficulties.forEach((difficulty) => {
        const result = mapDifficultyToStars(difficulty);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(5);
      });
    });

    it('DIFFICULTY_LEVELS constant matches function output', () => {
      expect(DIFFICULTY_LEVELS.beginner).toBe(mapDifficultyToStars('beginner'));
      expect(DIFFICULTY_LEVELS.intermediate).toBe(mapDifficultyToStars('intermediate'));
      expect(DIFFICULTY_LEVELS.advanced).toBe(mapDifficultyToStars('advanced'));
    });
  });

  describe('formatDuration', () => {
    it('formats timed hold exercises in seconds', () => {
      const exercise = createMockExercise({
        rep_type: 'timed_hold',
        default_hold_seconds: 10,
        default_sets: 3,
      });
      const result = formatDuration(exercise);

      expect(result).toBe('30 sec');
    });

    it('formats timed hold exercises in minutes when >= 60 seconds', () => {
      const exercise = createMockExercise({
        rep_type: 'timed_hold',
        default_hold_seconds: 30,
        default_sets: 3,
      });
      const result = formatDuration(exercise);

      expect(result).toBe('2 min');
    });

    it('formats hold exercises in seconds', () => {
      const exercise = createMockExercise({
        rep_type: 'hold',
        default_hold_seconds: 20,
        default_sets: 2,
      });
      const result = formatDuration(exercise);

      expect(result).toBe('40 sec');
    });

    it('formats standard rep exercises in minutes', () => {
      const exercise = createMockExercise({
        rep_type: 'standard',
        default_reps: 10,
        default_sets: 3,
        default_hold_seconds: 0,
      });
      const result = formatDuration(exercise);

      // 10 reps * 3 sets * 3 sec/rep + 2 rest periods * 15 sec = 120 sec = 2 min
      expect(result).toBe('2 min');
    });

    it('formats alternating rep exercises in minutes', () => {
      const exercise = createMockExercise({
        rep_type: 'alternating',
        default_reps: 8,
        default_sets: 2,
        default_hold_seconds: 0,
      });
      const result = formatDuration(exercise);

      // 8 reps * 2 sets * 3 sec/rep + 1 rest period * 15 sec = 63 sec = 1 min
      expect(result).toBe('1 min');
    });

    it('handles single set exercises (no rest time)', () => {
      const exercise = createMockExercise({
        rep_type: 'standard',
        default_reps: 10,
        default_sets: 1,
        default_hold_seconds: 0,
      });
      const result = formatDuration(exercise);

      // 10 reps * 1 set * 3 sec/rep + 0 rest = 30 sec = 1 min (rounded)
      expect(result).toBe('1 min');
    });

    it('returns string with unit', () => {
      const exercise = createMockExercise({ rep_type: 'standard' });
      const result = formatDuration(exercise);

      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d+ (min|sec)/);
    });
  });
});

/**
 * Helper to create mock exercise objects for testing
 */
function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
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
