/**
 * Plan Chat API Route
 *
 * POST /api/plans/chat
 * Chat with AI about exercises and plan recommendations.
 *
 * Requires: PT or admin role
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validation';
import { generateContent } from '@/lib/gemini/client';
import exerciseData from '@/lib/exercises/data.json';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  planContext: z.object({
    weekCount: z.number().optional(),
    currentWeek: z.number().optional(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number().optional(),
      reps: z.number().optional(),
      days: z.array(z.number()).optional(),
    })).optional(),
    weekFocus: z.string().optional(),
  }).optional(),
  assessmentSummary: z.string().optional(),
  patientInfo: z.object({
    name: z.string().optional(),
    condition: z.string().optional(),
  }).optional(),
});

// Build a compact exercise library summary for the system prompt
function getExerciseLibrarySummary(): string {
  const exercises = exerciseData.exercises as Array<{
    name: string;
    slug: string;
    category: string;
    body_region: string;
    difficulty: string;
    description: string;
    contraindications: string[];
  }>;

  const byCategory = new Map<string, string[]>();
  for (const ex of exercises) {
    const cat = ex.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(
      `${ex.name} (${ex.body_region}, ${ex.difficulty})${ex.contraindications.length > 0 ? ` [CI: ${ex.contraindications.join('; ')}]` : ''}`
    );
  }

  let summary = '';
  for (const [category, items] of byCategory) {
    summary += `\n${category.toUpperCase()}:\n`;
    summary += items.map(item => `  - ${item}`).join('\n');
  }
  return summary;
}

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await validateBody(request, chatRequestSchema);

    const planContextStr = body.planContext
      ? `\nCurrent plan context:
- Weeks: ${body.planContext.weekCount || 12}
- Current week: ${body.planContext.currentWeek || 1}
- Week focus: ${body.planContext.weekFocus || 'Not set'}
- Current exercises: ${body.planContext.exercises?.map(e => `${e.name} (${e.sets}x${e.reps})`).join(', ') || 'None'}`
      : '';

    const patientStr = body.patientInfo
      ? `\nPatient info: ${body.patientInfo.name || 'Unknown'}${body.patientInfo.condition ? `, Condition: ${body.patientInfo.condition}` : ''}`
      : '';

    const assessmentStr = body.assessmentSummary
      ? `\nAssessment summary: ${body.assessmentSummary}`
      : '';

    const exerciseLibrary = getExerciseLibrarySummary();

    const prompt = `You are a clinical exercise advisor assistant for physical therapists building rehabilitation plans.

ROLE: Help PTs choose appropriate exercises, modify prescriptions, and answer clinical questions about exercise programming.

AVAILABLE EXERCISE LIBRARY:
${exerciseLibrary}

${planContextStr}${patientStr}${assessmentStr}

GUIDELINES:
- Be concise and clinically relevant
- When suggesting exercises, use exact names from the exercise library above
- Include sets/reps recommendations when relevant
- Flag contraindications when applicable
- If asked about exercises not in the library, note they would need to be added

When you suggest exercises, format them in your response clearly with the exercise name in bold or on its own line so they are easy to identify.

If you want to suggest specific exercises to add, include a JSON block at the end of your response in this exact format (only if suggesting exercises):
\`\`\`exercises
[{"name": "Exercise Name", "slug": "exercise-slug", "sets": 3, "reps": 10}]
\`\`\`

PT's question: ${body.message}`;

    const rawReply = await generateContent(prompt);

    // Parse out suggested exercises if present
    let reply = rawReply;
    let suggestedExercises: Array<{ name: string; slug: string; sets: number; reps: number }> | undefined;

    const exerciseBlockMatch = rawReply.match(/```exercises\s*\n?([\s\S]*?)\n?```/);
    if (exerciseBlockMatch) {
      reply = rawReply.replace(/```exercises\s*\n?[\s\S]*?\n?```/, '').trim();
      try {
        const parsed = JSON.parse(exerciseBlockMatch[1]);
        if (Array.isArray(parsed)) {
          suggestedExercises = parsed;
        }
      } catch {
        // If parsing fails, just skip suggestions
      }
    }

    return success({ reply, suggestedExercises });
  },
  { roles: ['pt', 'admin'] }
);
