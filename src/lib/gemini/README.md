# Gemini Plan Generation

Complete implementation for generating 12-week rehabilitation plans using Google Gemini AI.

## Overview

This module provides:
- **Gemini API client** with retry logic and error handling
- **Prompt engineering** for converting assessments to structured plans
- **Validation** of generated plans (exercise IDs, progression, structure)
- **Type-safe** interfaces using Zod schemas

## Architecture

```
Assessment Data → Prompt Builder → Gemini API → JSON Parser → Validator → Plan Database
```

## Files

- `client.ts` - Gemini API wrapper with retry logic
- `prompts.ts` - Prompt templates for plan generation
- `plan-generator.ts` - Main generation logic with validation
- `types.ts` - Zod schemas and TypeScript types
- `index.ts` - Barrel exports

## Usage

### API Route

```typescript
POST /api/plans/generate
Body: {
  assessmentId: string; // UUID of completed assessment
  patientId: string;    // UUID of patient
}

Response: {
  data: {
    planId: string;
    structure: PlanStructure;
    summary: string;
    recommendations: Recommendation[];
  }
}
```

### Example Client Call

```typescript
async function generatePlanFromAssessment(assessmentId: string, patientId: string) {
  const response = await fetch('/api/plans/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentId, patientId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate plan');
  }

  const { data } = await response.json();
  return data;
}
```

### Direct Usage (Server-Side)

```typescript
import { generatePlan } from '@/lib/gemini';

const plan = await generatePlan({
  assessmentId: '...',
  patientId: '...',
});
```

## Validation

The system validates:

1. **Assessment exists** and belongs to patient
2. **Assessment is completed**
3. **No existing plan** for this assessment
4. **Exercise library** is populated
5. **Gemini response** is valid JSON
6. **Plan structure** matches schema (12 weeks, proper format)
7. **All exercise IDs** exist in database
8. **Progression** is gradual (no >50% jumps)

## Error Handling

- **Retry logic**: 3 attempts with exponential backoff
- **API errors**: Properly typed and handled
- **Validation errors**: Detailed messages with context
- **JSON parsing**: Handles markdown code blocks

## Plan Structure

```typescript
{
  structure: {
    weeks: [
      {
        weekNumber: 1-12,
        focus: string,
        notes: string,
        exercises: [
          {
            exerciseId: string (UUID),
            name: string,
            sets: 1-10,
            reps: 1-100,
            holdSeconds?: 0-300,
            days: number[] (0-6, 0=Sunday),
            order: number,
            notes?: string
          }
        ]
      }
    ]
  },
  summary: string (clinical summary for PT),
  recommendations: Recommendation[]
}
```

## Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - Model name (default: `gemini-2.5-flash`)

## Security

- **Authentication**: Only PTs and admins can generate plans
- **Authorization**: Assessment must belong to patient
- **Validation**: All inputs validated before processing
- **Error messages**: Don't expose sensitive data

## Testing

To test plan generation:

1. Ensure assessment exists and is completed
2. Ensure exercise library is populated
3. Call API with valid assessmentId and patientId
4. Verify plan structure and save to database

## Future Enhancements

- [ ] Fine-tune prompts based on PT feedback
- [ ] Cache exercise library for faster prompts
- [ ] Add plan modification suggestions
- [ ] Support for custom plan durations
- [ ] A/B testing different prompt variants

