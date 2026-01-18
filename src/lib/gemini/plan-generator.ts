/**
 * Plan Generator
 *
 * Main logic for generating rehabilitation plans using Gemini AI.
 */

import { eq, inArray } from 'drizzle-orm';
import { db, assessments, exercises, plans } from '@/db';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { generateContent, parseGeminiJson } from './client';
import { buildPlanGenerationPrompt } from './prompts';
import {
  geminiPlanResponseSchema,
  type GeminiPlanResponse,
  type GeneratePlanRequest,
} from './types';

/**
 * Validate that all exercise IDs in the plan exist in the database
 */
async function validateExerciseIds(
  exerciseIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(exerciseIds)];

  if (uniqueIds.length === 0) {
    return;
  }

  // Fetch all exercise IDs in one query
  const foundExercises = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(inArray(exercises.id, uniqueIds));

  const foundIds = new Set(foundExercises.map((e) => e.id));

  // Check for missing IDs
  const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid exercise IDs: ${missingIds.join(', ')}`
    );
  }
}

/**
 * Extract all exercise IDs from a plan structure
 */
function extractExerciseIds(response: GeminiPlanResponse): string[] {
  const ids: string[] = [];
  for (const week of response.structure.weeks) {
    for (const exercise of week.exercises) {
      ids.push(exercise.exerciseId);
    }
  }
  return ids;
}

/**
 * Validate plan progression (no sudden jumps)
 */
function validateProgression(response: GeminiPlanResponse): void {
  for (let i = 1; i < response.structure.weeks.length; i++) {
    const prevWeek = response.structure.weeks[i - 1];
    const currWeek = response.structure.weeks[i];

    // Check for exercises that appear in both weeks
    for (const currEx of currWeek.exercises) {
      const prevEx = prevWeek.exercises.find(
        (e) => e.exerciseId === currEx.exerciseId
      );

      if (prevEx) {
        // Check for sudden increases (>50%)
        const setsIncrease = ((currEx.sets - prevEx.sets) / prevEx.sets) * 100;
        const repsIncrease = ((currEx.reps - prevEx.reps) / prevEx.reps) * 100;

        if (setsIncrease > 50 || repsIncrease > 50) {
          throw new APIError(
            ErrorCode.VALIDATION_ERROR,
            `Sudden progression detected in week ${currWeek.weekNumber}: ${currEx.name} increased by more than 50%`
          );
        }
      }
    }
  }
}

/**
 * Generate a rehabilitation plan from an assessment
 *
 * @param request - Plan generation request with assessmentId and patientId
 * @returns Generated plan data
 * @throws APIError if generation fails
 */
export async function generatePlan(
  request: GeneratePlanRequest
): Promise<GeminiPlanResponse> {
  const { assessmentId, patientId } = request;

  // 1. Fetch and validate assessment
  const assessmentResults = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (assessmentResults.length === 0) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Assessment not found');
  }

  const assessment = assessmentResults[0];

  // Verify assessment belongs to patient
  if (assessment.patientId !== patientId) {
    throw new APIError(
      ErrorCode.FORBIDDEN,
      'Assessment does not belong to this patient'
    );
  }

  // Check if assessment is completed
  if (!assessment.completed) {
    throw new APIError(
      ErrorCode.BAD_REQUEST,
      'Assessment must be completed before generating a plan'
    );
  }

  // Check if plan already exists for this assessment
  if (assessment.planId) {
    const existingPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, assessment.planId))
      .limit(1);

    if (existingPlan.length > 0) {
      throw new APIError(
        ErrorCode.CONFLICT,
        'Plan already exists for this assessment'
      );
    }
  }

  // 2. Fetch exercise library
  const exerciseLibrary = await db.select().from(exercises);

  if (exerciseLibrary.length === 0) {
    throw new APIError(
      ErrorCode.INTERNAL_ERROR,
      'Exercise library is empty'
    );
  }

  // 3. Build prompt
  const prompt = buildPlanGenerationPrompt(assessment, exerciseLibrary);

  // 4. Generate plan with Gemini
  let rawResponse: string;
  try {
    rawResponse = await generateContent(prompt);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      ErrorCode.INTERNAL_ERROR,
      `Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // 5. Parse and validate JSON response
  let parsedResponse: GeminiPlanResponse;
  try {
    parsedResponse = parseGeminiJson<GeminiPlanResponse>(rawResponse);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      ErrorCode.INTERNAL_ERROR,
      `Failed to parse plan response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // 6. Validate response structure
  try {
    geminiPlanResponseSchema.parse(parsedResponse);
  } catch (error) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid plan structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
      422,
      { rawResponse: rawResponse.substring(0, 1000) }
    );
  }

  // 7. Validate all exercise IDs exist
  const exerciseIds = extractExerciseIds(parsedResponse);
  await validateExerciseIds(exerciseIds);

  // 8. Validate progression
  validateProgression(parsedResponse);

  return parsedResponse;
}

