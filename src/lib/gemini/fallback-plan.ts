/**
 * Fallback Plan Generator
 *
 * Creates a safe, generic rehabilitation plan when Gemini fails.
 * Used as a last resort to ensure users always get a plan.
 */

import { db, exercises } from '@/db';
import { eq } from 'drizzle-orm';
import type { GeminiPlanResponse } from './types';

// Core exercises for lower back by directional preference
const EXTENSION_EXERCISES = [
  'cobra-stretch',
  'prone-press-up',
  'sphinx-pose',
  'standing-back-extension',
  'bird-dog',
  'dead-bug',
  'glute-bridge',
  'clamshell',
  'cat-camel',
  'pelvic-tilt',
];

const FLEXION_EXERCISES = [
  'knee-to-chest',
  'double-knee-to-chest',
  'child-pose',
  'cat-camel',
  'pelvic-tilt',
  'dead-bug',
  'supine-twist',
  'piriformis-stretch',
  'figure-four-stretch',
  'glute-bridge',
];

const NEUTRAL_EXERCISES = [
  'cat-camel',
  'pelvic-tilt',
  'dead-bug',
  'bird-dog',
  'glute-bridge',
  'abdominal-brace',
  'clamshell',
  'supine-marching',
  'plank',
  'side-plank',
];

interface FallbackPlanOptions {
  directionalPreference: 'flexion' | 'extension' | 'neutral';
}

/**
 * Generate a fallback 12-week plan
 */
export async function generateFallbackPlan(
  options: FallbackPlanOptions
): Promise<GeminiPlanResponse> {
  const { directionalPreference } = options;

  // Get the exercise slugs based on preference
  const preferredSlugs =
    directionalPreference === 'extension'
      ? EXTENSION_EXERCISES
      : directionalPreference === 'flexion'
        ? FLEXION_EXERCISES
        : NEUTRAL_EXERCISES;

  // Fetch exercise IDs from database
  const exerciseRecords = await db
    .select({ id: exercises.id, slug: exercises.slug, name: exercises.name })
    .from(exercises);

  const slugToExercise = new Map(
    exerciseRecords.map((e) => [e.slug, { id: e.id, name: e.name }])
  );

  // Build exercises with IDs
  const buildExercise = (
    slug: string,
    sets: number,
    reps: number,
    days: number[],
    order: number,
    holdSeconds?: number
  ) => {
    const ex = slugToExercise.get(slug);
    if (!ex) return null;
    return {
      exerciseId: ex.id,
      exerciseSlug: slug,
      name: ex.name,
      sets,
      reps,
      holdSeconds: holdSeconds || 0,
      days,
      order,
    };
  };

  // Week templates with progressive difficulty
  const weeks = [
    // Weeks 1-2: Foundation - gentle, 3x/week
    {
      weekNumber: 1,
      focus: 'Pain relief and gentle mobility',
      notes: 'Focus on pain-free movement. Stop if pain increases beyond 3/10.',
      exercises: [
        buildExercise(preferredSlugs[0], 2, 8, [1, 3, 5], 0),
        buildExercise(preferredSlugs[1], 2, 8, [1, 3, 5], 1),
        buildExercise(preferredSlugs[8], 2, 8, [1, 3, 5], 2),
      ].filter(Boolean),
    },
    {
      weekNumber: 2,
      focus: 'Building movement confidence',
      notes: 'Gradually increase range of motion as comfort allows.',
      exercises: [
        buildExercise(preferredSlugs[0], 2, 10, [1, 3, 5], 0),
        buildExercise(preferredSlugs[1], 2, 10, [1, 3, 5], 1),
        buildExercise(preferredSlugs[2], 2, 8, [1, 3, 5], 2),
        buildExercise(preferredSlugs[8], 2, 10, [1, 3, 5], 3),
      ].filter(Boolean),
    },
    // Weeks 3-4: Core activation
    {
      weekNumber: 3,
      focus: 'Core activation basics',
      notes: 'Engage your deep core muscles before each exercise.',
      exercises: [
        buildExercise(preferredSlugs[0], 2, 10, [1, 2, 4, 5], 0),
        buildExercise(preferredSlugs[3], 2, 8, [1, 2, 4, 5], 1),
        buildExercise(preferredSlugs[4], 2, 8, [1, 2, 4, 5], 2),
        buildExercise(preferredSlugs[5], 2, 10, [1, 2, 4, 5], 3),
      ].filter(Boolean),
    },
    {
      weekNumber: 4,
      focus: 'Stability foundations',
      notes: 'Maintain neutral spine throughout all exercises.',
      exercises: [
        buildExercise(preferredSlugs[0], 3, 10, [1, 2, 4, 5], 0),
        buildExercise(preferredSlugs[3], 2, 10, [1, 2, 4, 5], 1),
        buildExercise(preferredSlugs[4], 2, 10, [1, 2, 4, 5], 2),
        buildExercise(preferredSlugs[5], 3, 10, [1, 2, 4, 5], 3),
        buildExercise(preferredSlugs[6], 2, 10, [1, 2, 4, 5], 4),
      ].filter(Boolean),
    },
    // Weeks 5-6: Progressive strengthening
    {
      weekNumber: 5,
      focus: 'Progressive strengthening',
      notes: 'Increase intensity slightly. Quality over quantity.',
      exercises: [
        buildExercise(preferredSlugs[3], 3, 10, [1, 2, 3, 5, 6], 0),
        buildExercise(preferredSlugs[4], 3, 10, [1, 2, 3, 5, 6], 1),
        buildExercise(preferredSlugs[5], 3, 12, [1, 2, 3, 5, 6], 2),
        buildExercise(preferredSlugs[6], 3, 10, [1, 2, 3, 5, 6], 3),
      ].filter(Boolean),
    },
    {
      weekNumber: 6,
      focus: 'Building endurance',
      notes: 'You should feel muscles working but not sharp pain.',
      exercises: [
        buildExercise(preferredSlugs[3], 3, 12, [1, 2, 3, 5, 6], 0),
        buildExercise(preferredSlugs[4], 3, 12, [1, 2, 3, 5, 6], 1),
        buildExercise(preferredSlugs[5], 3, 12, [1, 2, 3, 5, 6], 2),
        buildExercise(preferredSlugs[6], 3, 12, [1, 2, 3, 5, 6], 3),
        buildExercise(preferredSlugs[7], 2, 10, [1, 2, 3, 5, 6], 4),
      ].filter(Boolean),
    },
    // Weeks 7-8: Functional patterns
    {
      weekNumber: 7,
      focus: 'Functional movement integration',
      notes: 'Apply these movements to daily activities.',
      exercises: [
        buildExercise(preferredSlugs[3], 3, 12, [1, 2, 3, 5, 6], 0),
        buildExercise(preferredSlugs[4], 3, 12, [1, 2, 3, 5, 6], 1),
        buildExercise(preferredSlugs[6], 3, 12, [1, 2, 3, 5, 6], 2),
        buildExercise(preferredSlugs[7], 3, 10, [1, 2, 3, 5, 6], 3),
        buildExercise(preferredSlugs[9], 3, 10, [1, 2, 3, 5, 6], 4),
      ].filter(Boolean),
    },
    {
      weekNumber: 8,
      focus: 'Movement confidence',
      notes: 'Focus on smooth, controlled movements.',
      exercises: [
        buildExercise(preferredSlugs[3], 3, 15, [1, 2, 3, 5, 6], 0),
        buildExercise(preferredSlugs[4], 3, 15, [1, 2, 3, 5, 6], 1),
        buildExercise(preferredSlugs[6], 3, 15, [1, 2, 3, 5, 6], 2),
        buildExercise(preferredSlugs[7], 3, 12, [1, 2, 3, 5, 6], 3),
        buildExercise(preferredSlugs[9], 3, 12, [1, 2, 3, 5, 6], 4),
      ].filter(Boolean),
    },
    // Weeks 9-10: Advanced stability
    {
      weekNumber: 9,
      focus: 'Advanced stability challenges',
      notes: 'Maintain form as exercises become more challenging.',
      exercises: [
        buildExercise(preferredSlugs[4], 3, 15, [1, 2, 4, 5, 6], 0),
        buildExercise(preferredSlugs[6], 3, 15, [1, 2, 4, 5, 6], 1),
        buildExercise(preferredSlugs[7], 3, 12, [1, 2, 4, 5, 6], 2),
        buildExercise(preferredSlugs[9], 3, 15, [1, 2, 4, 5, 6], 3),
      ].filter(Boolean),
    },
    {
      weekNumber: 10,
      focus: 'Endurance and resilience',
      notes: 'Your back is getting stronger. Keep consistent.',
      exercises: [
        buildExercise(preferredSlugs[4], 4, 15, [1, 2, 4, 5, 6], 0),
        buildExercise(preferredSlugs[6], 4, 15, [1, 2, 4, 5, 6], 1),
        buildExercise(preferredSlugs[7], 3, 15, [1, 2, 4, 5, 6], 2),
        buildExercise(preferredSlugs[9], 4, 15, [1, 2, 4, 5, 6], 3),
      ].filter(Boolean),
    },
    // Weeks 11-12: Maintenance
    {
      weekNumber: 11,
      focus: 'Maintenance routine',
      notes: 'This routine can be continued long-term for back health.',
      exercises: [
        buildExercise(preferredSlugs[0], 2, 12, [1, 3, 5], 0),
        buildExercise(preferredSlugs[4], 3, 12, [1, 3, 5], 1),
        buildExercise(preferredSlugs[6], 3, 12, [1, 3, 5], 2),
        buildExercise(preferredSlugs[9], 3, 12, [1, 3, 5], 3),
      ].filter(Boolean),
    },
    {
      weekNumber: 12,
      focus: 'Long-term independence',
      notes: 'Congratulations! Continue this routine 3x/week for ongoing back health.',
      exercises: [
        buildExercise(preferredSlugs[0], 2, 12, [1, 3, 5], 0),
        buildExercise(preferredSlugs[4], 3, 12, [1, 3, 5], 1),
        buildExercise(preferredSlugs[6], 3, 12, [1, 3, 5], 2),
        buildExercise(preferredSlugs[9], 3, 12, [1, 3, 5], 3),
      ].filter(Boolean),
    },
  ];

  return {
    structure: { weeks: weeks as GeminiPlanResponse['structure']['weeks'] },
    summary: `This is a standard 12-week ${directionalPreference}-focused rehabilitation plan designed for lower back recovery. It progresses from gentle mobility exercises to functional strengthening, building a foundation for long-term back health.`,
    recommendations: [
      {
        type: 'warning',
        severity: 'medium',
        message:
          'Stop any exercise that causes sharp or radiating pain. Mild muscle fatigue is normal.',
      },
      {
        type: 'encouragement',
        message:
          'Consistency is key. Even on busy days, doing a few exercises is better than skipping entirely.',
      },
      {
        type: 'progression',
        severity: 'low',
        message:
          'If exercises feel too easy, you can add an extra set or increase reps by 2-3.',
      },
    ],
  };
}
