/**
 * Gemini Plan Generation Types
 *
 * Type definitions for plan generation request/response and validation.
 */

import { z } from 'zod';

/**
 * Exercise prescription within a week
 */
export const planExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  exerciseSlug: z.string().optional(),
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
 * Week structure in a plan
 */
export const planWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  focus: z.string().min(1).max(200),
  notes: z.string().min(1).max(500),
  exercises: z.array(planExerciseSchema).min(1).max(10),
});

export type PlanWeek = z.infer<typeof planWeekSchema>;

/**
 * Full plan structure (12 weeks)
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
 * Complete Gemini API response
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

