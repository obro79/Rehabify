/**
 * Gemini Prompt Templates
 *
 * Templates for generating rehabilitation plans from patient assessments.
 */

import type { Assessment, Exercise } from '@/db/schema';

/**
 * Format exercise library for prompt context
 */
function formatExerciseLibrary(exercises: Exercise[]): string {
  return exercises
    .map((ex) => {
      const contraindications = ex.contraindications?.length
        ? `\n  Contraindications: ${ex.contraindications.join(', ')}`
        : '';
      const modifications = ex.modifications && Object.keys(ex.modifications).length > 0
        ? `\n  Modifications: ${JSON.stringify(ex.modifications)}`
        : '';

      return `- ${ex.name} (slug: ${ex.slug})
  ID: ${ex.id}
  Category: ${ex.category}
  Body Region: ${ex.bodyRegion}
  Difficulty: ${ex.difficulty}
  Tier: ${ex.tier} (${ex.tier === 1 ? 'AI form detection' : 'Voice-guided'})
  Default: ${ex.defaultSets} sets × ${ex.defaultReps} reps${ex.defaultHoldSeconds ? `, hold ${ex.defaultHoldSeconds}s` : ''}
  Description: ${ex.description}${contraindications}${modifications}`;
    })
    .join('\n\n');
}

/**
 * Format assessment data for prompt context
 */
function formatAssessment(assessment: Assessment): string {
  const chiefComplaint = typeof assessment.chiefComplaint === 'object'
    ? JSON.stringify(assessment.chiefComplaint, null, 2)
    : String(assessment.chiefComplaint);

  const painProfile = typeof assessment.painProfile === 'object'
    ? JSON.stringify(assessment.painProfile, null, 2)
    : String(assessment.painProfile);

  const functionalImpact = assessment.functionalImpact
    ? typeof assessment.functionalImpact === 'object'
      ? JSON.stringify(assessment.functionalImpact, null, 2)
      : String(assessment.functionalImpact)
    : 'Not provided';

  const medicalHistory = assessment.medicalHistory
    ? typeof assessment.medicalHistory === 'object'
      ? JSON.stringify(assessment.medicalHistory, null, 2)
      : String(assessment.medicalHistory)
    : 'Not provided';

  const movementScreen = typeof assessment.movementScreen === 'object'
    ? JSON.stringify(assessment.movementScreen, null, 2)
    : String(assessment.movementScreen);

  const redFlags = assessment.redFlags && assessment.redFlags.length > 0
    ? assessment.redFlags.join(', ')
    : 'None identified';

  return `PATIENT ASSESSMENT:

Chief Complaint:
${chiefComplaint}

Pain Profile:
${painProfile}

Functional Impact:
${functionalImpact}

Medical History:
${medicalHistory}

Movement Screen Results:
${movementScreen}

Directional Preference: ${assessment.directionalPreference ?? 'Not determined'}

Red Flags: ${redFlags}`;
}

/**
 * Build the complete prompt for plan generation
 */
export function buildPlanGenerationPrompt(
  assessment: Assessment,
  exercises: Exercise[]
): string {
  const assessmentText = formatAssessment(assessment);
  const exerciseLibrary = formatExerciseLibrary(exercises);

  return `You are an expert physical therapist creating a personalized 12-week rehabilitation plan.

${assessmentText}

AVAILABLE EXERCISES:
${exerciseLibrary}

REQUIREMENTS:
1. Create a progressive 12-week rehabilitation plan
2. Each week must have a clear focus and patient-facing notes
3. Select 2-5 exercises per week from the available exercise library
4. Respect the patient's directional preference (flexion vs extension vs neutral)
5. Avoid exercises with contraindications matching the patient's red flags
6. Progress gradually: increase sets/reps by 10-20% every 2 weeks
7. Include rest days (don't schedule exercises every day)
8. Consider the patient's functional goals from their assessment
9. Start conservatively in weeks 1-2, then progress

WEEK-BY-WEEK PROGRESSION GUIDELINES:
- Weeks 1-2: Pain relief and gentle mobility (2 sets × 6-8 reps, 3-4 days/week)
- Weeks 3-4: Core activation and stability basics (2-3 sets × 8-10 reps, 4-5 days/week)
- Weeks 5-6: Progressive strengthening (3 sets × 10-12 reps, 5 days/week)
- Weeks 7-8: Functional movement patterns (3 sets × 12-15 reps, 5 days/week)
- Weeks 9-10: Advanced stability and endurance (3-4 sets × 15-20 reps, 5-6 days/week)
- Weeks 11-12: Maintenance and independence (2-3 sets × 12-15 reps, 3-4 days/week)

OUTPUT FORMAT (JSON only, no markdown):
{
  "structure": {
    "weeks": [
      {
        "weekNumber": 1,
        "focus": "Brief focus description (e.g., 'Pain relief and gentle extension mobility')",
        "notes": "Patient-facing instructions (e.g., 'Focus on pain-free movement. Stop if pain increases.')",
        "exercises": [
          {
            "exerciseId": "uuid-from-exercise-library",
            "exerciseSlug": "optional-slug-for-reference",
            "name": "Exercise Name",
            "sets": 2,
            "reps": 8,
            "holdSeconds": 0,
            "days": [1, 3, 5],
            "order": 0,
            "notes": "Optional exercise-specific notes"
          }
        ]
      }
      // ... 11 more weeks (weeks 2-12)
    ]
  },
  "summary": "Clinical summary for physical therapist review (2-4 sentences describing the plan rationale, key considerations, and expected progression)",
  "recommendations": [
    {
      "type": "contraindication|progression|modification|warning|encouragement",
      "severity": "low|medium|high",
      "message": "Brief recommendation message"
    }
  ]
}

CRITICAL CONSTRAINTS:
- Use ONLY exercise IDs from the provided exercise library
- Days array uses 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)
- Sets must be 1-10, reps must be 1-100, holdSeconds must be 0-300
- Each week must have at least 1 exercise, maximum 10 exercises
- Ensure gradual progression (no sudden jumps >50% in sets/reps)
- Include rest days - don't schedule exercises all 7 days
- Respect directional preference: if extension preference, avoid deep flexion exercises
- If red flags present, avoid contraindicated exercises

Return ONLY valid JSON. Do not include markdown code blocks or explanatory text.`;
}

