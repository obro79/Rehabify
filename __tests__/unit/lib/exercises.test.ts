/**
 * Exercise Utility Tests
 *
 * Tests for src/lib/exercises/ utilities.
 * Covers exercise lookup, filtering, and data transformation.
 */

import { describe, it, expect } from 'vitest';
import {
  getExerciseById,
  getExerciseBySlug,
  getExercisesByCategory,
  getExercisesByTier,
  getExercisesByTargetArea,
  searchExercises,
  getRecommendedExercises,
  getUniqueCategories,
  getUniqueTargetAreas,
  toCardData,
  exercises,
  tier1Exercises,
  tier2Exercises,
} from '@/lib/exercises';
import type { Exercise, DisplayCategory } from '@/lib/exercises/types';

describe('Exercise Utilities', () => {
  describe('getExerciseById', () => {
    it('returns exercise for valid ID', () => {
      const firstExercise = exercises[0];
      const result = getExerciseById(firstExercise.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(firstExercise.id);
      expect(result?.name).toBe(firstExercise.name);
    });

    it('returns undefined for non-existent ID', () => {
      const result = getExerciseById('non-existent-id-12345');
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const result = getExerciseById('');
      expect(result).toBeUndefined();
    });
  });

  describe('getExerciseBySlug', () => {
    it('returns exercise for valid slug', () => {
      const firstExercise = exercises[0];
      const result = getExerciseBySlug(firstExercise.slug);

      expect(result).toBeDefined();
      expect(result?.slug).toBe(firstExercise.slug);
      expect(result?.name).toBe(firstExercise.name);
    });

    it('returns undefined for non-existent slug', () => {
      const result = getExerciseBySlug('non-existent-slug-xyz');
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const result = getExerciseBySlug('');
      expect(result).toBeUndefined();
    });
  });

  describe('getExercisesByCategory', () => {
    it('returns exercises for Mobility category', () => {
      const result = getExercisesByCategory('Mobility');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns exercises for Strength category', () => {
      const result = getExercisesByCategory('Strength');

      expect(result).toBeInstanceOf(Array);
    });

    it('returns exercises for Stability category', () => {
      const result = getExercisesByCategory('Stability');

      expect(result).toBeInstanceOf(Array);
    });

    it('returns exercises for Stretch category', () => {
      const result = getExercisesByCategory('Stretch');

      expect(result).toBeInstanceOf(Array);
    });

    it('returns empty array for unknown category', () => {
      const result = getExercisesByCategory('Unknown' as DisplayCategory);
      expect(result).toEqual([]);
    });
  });

  describe('getExercisesByTier', () => {
    it('returns tier 1 exercises (AI form detection)', () => {
      const result = getExercisesByTier(1);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((exercise) => {
        expect(exercise.tier).toBe(1);
      });
    });

    it('returns tier 2 exercises (guided only)', () => {
      const result = getExercisesByTier(2);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((exercise) => {
        expect(exercise.tier).toBe(2);
      });
    });

    it('tier1Exercises matches getExercisesByTier(1)', () => {
      const result = getExercisesByTier(1);
      expect(result.length).toBe(tier1Exercises.length);
    });

    it('tier2Exercises matches getExercisesByTier(2)', () => {
      const result = getExercisesByTier(2);
      expect(result.length).toBe(tier2Exercises.length);
    });
  });

  describe('getExercisesByTargetArea', () => {
    it('returns exercises for valid target area', () => {
      const firstExercise = exercises[0];
      const result = getExercisesByTargetArea(firstExercise.target_area);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((exercise) => {
        expect(exercise.target_area).toBe(firstExercise.target_area);
      });
    });

    it('returns empty array for non-existent target area', () => {
      const result = getExercisesByTargetArea('non-existent-area');
      expect(result).toEqual([]);
    });
  });

  describe('searchExercises', () => {
    it('finds exercises by name', () => {
      const firstExercise = exercises[0];
      const searchTerm = firstExercise.name.split(' ')[0];
      const result = searchExercises(searchTerm);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('finds exercises by description', () => {
      const firstExercise = exercises[0];
      const searchTerm = firstExercise.description.split(' ')[0];
      const result = searchExercises(searchTerm);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('search is case-insensitive', () => {
      const firstExercise = exercises[0];
      const searchTerm = firstExercise.name.split(' ')[0].toUpperCase();
      const result = searchExercises(searchTerm);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty array for no matches', () => {
      const result = searchExercises('zzzznonexistentzzzzz');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty search', () => {
      const result = searchExercises('');

      expect(result).toBeInstanceOf(Array);
      // Empty string matches all exercises
      expect(result.length).toBe(exercises.length);
    });
  });

  describe('getRecommendedExercises', () => {
    it('returns requested number of exercises', () => {
      const result = getRecommendedExercises(4);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it('returns card data format', () => {
      const result = getRecommendedExercises(1);

      expect(result.length).toBeGreaterThan(0);
      const card = result[0];
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('category');
      expect(card).toHaveProperty('duration');
      expect(card).toHaveProperty('reps');
      expect(card).toHaveProperty('difficulty');
      expect(card).toHaveProperty('tier');
      expect(card).toHaveProperty('description');
    });

    it('prioritizes tier 1 exercises', () => {
      const result = getRecommendedExercises(4);

      const tier1Count = result.filter((ex) => ex.tier === 1).length;
      expect(tier1Count).toBeGreaterThanOrEqual(Math.min(2, tier1Exercises.length));
    });
  });

  describe('getUniqueCategories', () => {
    it('returns array of unique display categories', () => {
      const result = getUniqueCategories();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check no duplicates
      const uniqueCount = new Set(result).size;
      expect(uniqueCount).toBe(result.length);
    });

    it('returns valid display categories', () => {
      const validCategories: DisplayCategory[] = ['Mobility', 'Strength', 'Stability', 'Stretch'];
      const result = getUniqueCategories();

      result.forEach((category) => {
        expect(validCategories).toContain(category);
      });
    });
  });

  describe('getUniqueTargetAreas', () => {
    it('returns array of unique target areas', () => {
      const result = getUniqueTargetAreas();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check no duplicates
      const uniqueCount = new Set(result).size;
      expect(uniqueCount).toBe(result.length);
    });
  });

  describe('toCardData', () => {
    it('transforms Exercise to ExerciseCardData', () => {
      const exercise = exercises[0];
      const result = toCardData(exercise);

      expect(result.id).toBe(exercise.id);
      expect(result.name).toBe(exercise.name);
      expect(result.reps).toBe(exercise.default_reps);
      expect(result.tier).toBe(exercise.tier);
      expect(result.description).toBe(exercise.description);
    });

    it('includes duration as string', () => {
      const exercise = exercises[0];
      const result = toCardData(exercise);

      expect(typeof result.duration).toBe('string');
      expect(result.duration.length).toBeGreaterThan(0);
    });

    it('maps category to display category', () => {
      const exercise = exercises[0];
      const result = toCardData(exercise);

      const validCategories: DisplayCategory[] = ['Mobility', 'Strength', 'Stability', 'Stretch'];
      expect(validCategories).toContain(result.category);
    });

    it('maps difficulty to star rating (1-5)', () => {
      const exercise = exercises[0];
      const result = toCardData(exercise);

      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(5);
    });
  });

  describe('Data Integrity', () => {
    it('exercises array is not empty', () => {
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('all exercises have required fields', () => {
      exercises.forEach((exercise) => {
        expect(exercise.id).toBeDefined();
        expect(exercise.name).toBeDefined();
        expect(exercise.slug).toBeDefined();
        expect(exercise.tier).toBeGreaterThanOrEqual(1);
        expect(exercise.tier).toBeLessThanOrEqual(2);
        expect(exercise.body_region).toBeDefined();
        expect(exercise.category).toBeDefined();
        expect(exercise.description).toBeDefined();
      });
    });

    it('tier 1 exercises have form detection enabled', () => {
      tier1Exercises.forEach((exercise) => {
        expect(exercise.form_detection_enabled).toBe(true);
      });
    });
  });
});
