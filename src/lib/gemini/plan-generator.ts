/**
 * Plan Generator
 *
 * Main logic for generating rehabilitation plans using Gemini AI.
 */

import { eq } from 'drizzle-orm';
import { db, assessments, exercises, plans } from '@/db';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { generateContent, parseGeminiJson } from './client';
import { buildPlanGenerationPrompt } from './prompts';
import {
  rawGeminiPlanResponseSchema,
  type RawGeminiPlanResponse,
  type GeminiPlanResponse,
  type GeneratePlanRequest,
} from './types';
import type { Exercise } from '@/db/schema';

/**
 * Build a slug-to-ID map from the exercise library
 */
function buildSlugToIdMap(exerciseLibrary: Exercise[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const ex of exerciseLibrary) {
    map.set(ex.slug, ex.id);
  }
  return map;
}

/**
 * Try to find a matching slug using fuzzy matching
 * Returns the best match or null if no good match found
 */
function findClosestSlug(
  inputSlug: string,
  validSlugs: string[]
): string | null {
  // Exact match
  if (validSlugs.includes(inputSlug)) {
    return inputSlug;
  }

  // Try removing common prefixes/suffixes
  const variations = [
    inputSlug,
    inputSlug.replace('kneeling-', ''),
    inputSlug.replace('standing-', ''),
    inputSlug.replace('seated-', ''),
    inputSlug.replace('supine-', ''),
    inputSlug.replace('prone-', ''),
    inputSlug.replace('-stretch', ''),
    inputSlug.replace('-exercise', ''),
  ];

  for (const variant of variations) {
    if (validSlugs.includes(variant)) {
      return variant;
    }
  }

  // Try finding a slug that contains most of the input words
  const inputWords = inputSlug.split('-');
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const slug of validSlugs) {
    const slugWords = slug.split('-');
    let score = 0;
    for (const word of inputWords) {
      if (slugWords.includes(word)) {
        score++;
      }
    }
    // Require at least 2 matching words or 50% match
    if (score > bestScore && (score >= 2 || score / inputWords.length >= 0.5)) {
      bestScore = score;
      bestMatch = slug;
    }
  }

  return bestMatch;
}

/**
 * Map exercise slugs to IDs and validate all slugs exist
 */
function mapSlugsToIds(
  rawResponse: RawGeminiPlanResponse,
  slugToIdMap: Map<string, string>
): GeminiPlanResponse {
  const missingSlugs: string[] = [];
  const validSlugs = Array.from(slugToIdMap.keys());

  const mappedWeeks = rawResponse.structure.weeks.map((week) => ({
    ...week,
    exercises: week.exercises.map((ex) => {
      // Try exact match first
      let exerciseId = slugToIdMap.get(ex.exerciseSlug);
      let finalSlug = ex.exerciseSlug;

      // If no exact match, try fuzzy matching
      if (!exerciseId) {
        const closestSlug = findClosestSlug(ex.exerciseSlug, validSlugs);
        if (closestSlug) {
          exerciseId = slugToIdMap.get(closestSlug);
          finalSlug = closestSlug;
        }
      }

      if (!exerciseId) {
        missingSlugs.push(ex.exerciseSlug);
        return { ...ex, exerciseId: '' }; // Placeholder, will throw below
      }

      return {
        ...ex,
        exerciseSlug: finalSlug,
        exerciseId,
      };
    }),
  }));

  if (missingSlugs.length > 0) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid exercise slugs: ${[...new Set(missingSlugs)].join(', ')}`
    );
  }

  return {
    structure: { weeks: mappedWeeks },
    summary: rawResponse.summary,
    recommendations: rawResponse.recommendations,
  };
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

  // 5. Parse JSON response
  let parsedRawResponse: RawGeminiPlanResponse;
  try {
    parsedRawResponse = parseGeminiJson<RawGeminiPlanResponse>(rawResponse);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      ErrorCode.INTERNAL_ERROR,
      `Failed to parse plan response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // 6. Validate raw response structure
  try {
    rawGeminiPlanResponseSchema.parse(parsedRawResponse);
  } catch (error) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid plan structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
      422,
      { rawResponse: rawResponse.substring(0, 1000) }
    );
  }

  // 7. Map exercise slugs to IDs (also validates slugs exist)
  const slugToIdMap = buildSlugToIdMap(exerciseLibrary);
  const mappedResponse = mapSlugsToIds(parsedRawResponse, slugToIdMap);

  // 8. Validate progression
  validateProgression(mappedResponse);

  return mappedResponse;
}

