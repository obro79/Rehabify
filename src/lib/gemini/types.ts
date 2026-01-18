/**
 * Gemini Plan Generation Types
 *
 * Type definitions for plan generation request/response and validation.
 */

import { z } from 'zod';

/**
 * Raw exercise from Gemini (uses slug, no ID)
 */
export const rawPlanExerciseSchema = z.object({
  exerciseSlug: z.string().min(1),
  name: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(100),
  holdSeconds: z.number().int().min(0).max(300).optional(),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  order: z.number().int().min(0),
  notes: z.string().optional(),
});

export type RawPlanExercise = z.infer<typeof rawPlanExerciseSchema>;

/**
 * Exercise prescription within a week (after slug-to-ID mapping)
 */
export const planExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  exerciseSlug: z.string(),
  name: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(100),
  holdSeconds: z.number().int().min(0).max(300).optional(),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  order: z.number().int().min(0),
  notes: z.string().optional(),
});

export type PlanExercise = z.infer<typeof planExerciseSchema>;

/**
 * Raw week structure from Gemini (uses slugs)
 */
export const rawPlanWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  focus: z.string().min(1).max(200),
  notes: z.string().min(1).max(500),
  exercises: z.array(rawPlanExerciseSchema).min(1).max(10),
});

export type RawPlanWeek = z.infer<typeof rawPlanWeekSchema>;

/**
 * Raw plan structure from Gemini (12 weeks, uses slugs)
 */
export const rawPlanStructureSchema = z.object({
  weeks: z.array(rawPlanWeekSchema).length(12),
});

export type RawPlanStructure = z.infer<typeof rawPlanStructureSchema>;

/**
 * Week structure in a plan (after slug-to-ID mapping)
 */
export const planWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  focus: z.string().min(1).max(200),
  notes: z.string().min(1).max(500),
  exercises: z.array(planExerciseSchema).min(1).max(10),
});

export type PlanWeek = z.infer<typeof planWeekSchema>;

/**
 * Full plan structure (12 weeks, after slug-to-ID mapping)
 */
export const planStructureSchema = z.object({
  weeks: z.array(planWeekSchema).length(12),
});

export type PlanStructure = z.infer<typeof planStructureSchema>;

/**
 * Recommendation from AI
 */
export const recommendationSchema = z.object({
  type: z.enum(['contraindication', 'progression', 'modification', 'warning', 'encouragement']),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  message: z.string().min(1).max(500),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

/**
 * Raw Gemini API response (before slug-to-ID mapping)
 */
export const rawGeminiPlanResponseSchema = z.object({
  structure: rawPlanStructureSchema,
  summary: z.string().min(50).max(2000),
  recommendations: z.array(recommendationSchema).default([]),
});

export type RawGeminiPlanResponse = z.infer<typeof rawGeminiPlanResponseSchema>;

/**
 * Complete Gemini API response (after slug-to-ID mapping)
 */
export const geminiPlanResponseSchema = z.object({
  structure: planStructureSchema,
  summary: z.string().min(50).max(2000),
  recommendations: z.array(recommendationSchema).default([]),
});

export type GeminiPlanResponse = z.infer<typeof geminiPlanResponseSchema>;

/**
 * Request payload for plan generation
 */
export const generatePlanRequestSchema = z.object({
  assessmentId: z.string().uuid(),
  patientId: z.string().uuid(),
});

export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;

