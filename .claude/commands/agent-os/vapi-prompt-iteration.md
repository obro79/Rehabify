# Vapi Prompt Iteration

A/B test voice prompts for naturalness, timing, and effectiveness. This skill helps iterate on Vapi voice AI prompts by generating variants, testing latency, and scoring responses for the Calm Physio persona.

## When to Use

- Voice responses feel robotic or unnatural
- Latency is too high (>800ms target)
- Same phrases repeat too often
- Tone doesn't match Calm Physio persona
- Users report confusing or unhelpful corrections

## Process Overview

PHASE 1: Identify prompt area to iterate on
PHASE 2: Generate prompt variants
PHASE 3: Test variants for latency and naturalness
PHASE 4: Score and select best variants
PHASE 5: Update prompt files and Vapi config

Follow each phase IN SEQUENCE:

---

## PHASE 1: Identify Prompt Area

Determine which prompt type needs iteration:

### Prompt Categories

```
1. System Prompt (Calm Physio persona)
   - Overall personality and tone
   - Response guidelines
   - What to say / not say

2. Exercise Introductions
   - cat-camel intro
   - cobra intro
   - dead-bug intro

3. Correction Cues (per error type)
   - insufficient_curve
   - hips_not_level
   - moving_too_fast
   - [etc.]

4. Positive Reinforcement
   - Rep completion acknowledgments
   - Form recovery praise
   - Session completion

5. First Message / Greeting
   - Initial user greeting
   - Exercise start prompts
```

Ask user which area to iterate:

```
Which prompt area would you like to iterate on?

1. **System Prompt** - Overall Calm Physio persona
2. **Exercise Intros** - Introduction for specific exercise
3. **Correction Cues** - Responses to form errors
4. **Reinforcement** - Positive feedback phrases
5. **Greetings** - First message and session start

Or describe a specific issue you're experiencing.
```

Load current prompts from:
```
src/lib/voice/prompts/system-prompt.ts
src/lib/voice/prompts/correction-cues.ts
```

---

## PHASE 2: Generate Prompt Variants

For the selected prompt area, generate 3-5 variants.

### Variant Generation Guidelines

**For Correction Cues:**
- Keep under 8 words (during exercise)
- Start with action verb or gentle suggestion
- Avoid "you" accusations ("You're doing it wrong")
- Use "let's" or "try" for collaborative tone

**For Exercise Intros:**
- 2-3 sentences max
- Explain the "what" and "why" briefly
- End with readiness check
- Avoid medical jargon

**For Positive Reinforcement:**
- 3-5 words max during exercise
- Vary the vocabulary (not just "good")
- Match energy to exercise phase

### Variant Template

```yaml
prompt_iteration:
  area: "[prompt area]"
  current: |
    [current prompt text]

  variants:
    - id: A
      text: |
        [variant A text]
      rationale: "[why this might work better]"

    - id: B
      text: |
        [variant B text]
      rationale: "[why this might work better]"

    - id: C
      text: |
        [variant C text]
      rationale: "[why this might work better]"

  evaluation_criteria:
    - naturalness: "Does it sound like a real physio?"
    - brevity: "Is it appropriately short?"
    - clarity: "Is the instruction clear?"
    - tone: "Does it match Calm Physio persona?"
    - latency: "Will it process quickly?"
```

Present variants to user:

```
## Prompt Variants: [area]

### Current
> [current prompt]

### Variant A
> [variant A]
Rationale: [why]

### Variant B
> [variant B]
Rationale: [why]

### Variant C
> [variant C]
Rationale: [why]

Would you like to:
1. Test these variants
2. Modify a variant
3. Generate more variants
4. Skip to manual selection
```

---

## PHASE 3: Test Variants

Test each variant for latency and output quality.

### Latency Testing

For each variant, measure end-to-end time:

```yaml
latency_test:
  variant: A
  method: |
    1. Send prompt to Vapi assistant
    2. Measure time to first audio byte
    3. Measure total response time

  results:
    time_to_first_byte_ms: [number]
    total_response_ms: [number]
    within_target: [true/false]  # <800ms target
```

### Audio Output Testing

If possible, capture audio output:

```yaml
audio_test:
  variant: A
  output_text: "[transcription of audio response]"
  duration_seconds: [number]
  observations:
    - "[observation about pacing]"
    - "[observation about tone]"
```

### Context Injection Test

Test how the prompt responds to different contexts:

```yaml
context_tests:
  variant: A
  scenarios:
    - context: "Form error: hips_not_level, severity: medium"
      expected: "Brief correction about hips"
      actual: "[what was actually said]"
      pass: [true/false]

    - context: "Rep completed: rep 5, form score 92"
      expected: "Brief acknowledgment"
      actual: "[what was actually said]"
      pass: [true/false]
```

Present test results:

```
## Test Results

| Variant | Latency (ms) | Within Target | Naturalness | Notes |
|---------|--------------|---------------|-------------|-------|
| Current | 650 | ✅ | 3/5 | Repetitive phrasing |
| A | 580 | ✅ | 4/5 | Good variety |
| B | 720 | ✅ | 4/5 | Slightly verbose |
| C | 890 | ❌ | 5/5 | Too long, high latency |
```

---

## PHASE 4: Score and Select

Score each variant on multiple dimensions:

### Scoring Rubric

```yaml
scoring:
  dimensions:
    naturalness:
      weight: 0.3
      scale: 1-5
      criteria: "Sounds like a real physio speaking"

    brevity:
      weight: 0.2
      scale: 1-5
      criteria: "Appropriately concise for context"

    clarity:
      weight: 0.2
      scale: 1-5
      criteria: "Instruction is immediately understandable"

    tone:
      weight: 0.2
      scale: 1-5
      criteria: "Matches Calm Physio persona"

    latency:
      weight: 0.1
      scale: 1-5
      criteria: "Response time within target"

  scores:
    current:
      naturalness: 3
      brevity: 4
      clarity: 4
      tone: 3
      latency: 4
      weighted_total: 3.4

    variant_A:
      naturalness: 4
      brevity: 4
      clarity: 5
      tone: 4
      latency: 5
      weighted_total: 4.3

    [etc.]

  recommendation: variant_A
  rationale: |
    Variant A scores highest overall, with particularly strong
    clarity and latency scores. The phrasing feels more natural
    while remaining appropriately brief.
```

Present recommendation:

```
## Scoring Results

| Variant | Natural | Brief | Clear | Tone | Latency | **Total** |
|---------|---------|-------|-------|------|---------|-----------|
| Current | 3 | 4 | 4 | 3 | 4 | 3.4 |
| **A** | **4** | **4** | **5** | **4** | **5** | **4.3** ⭐ |
| B | 4 | 3 | 4 | 4 | 4 | 3.8 |
| C | 5 | 2 | 4 | 5 | 2 | 3.6 |

**Recommendation:** Variant A

Rationale: Best balance of naturalness and performance.

Proceed with Variant A? (yes/compare more/pick different)
```

---

## PHASE 5: Update Prompts

Apply the selected variant to the codebase.

### Update Prompt Files

Based on prompt area, update the relevant file:

**System Prompt:**
```typescript
// src/lib/voice/prompts/system-prompt.ts
export const CALM_PHYSIO_PROMPT = `
[new prompt text]
`
```

**Correction Cues:**
```typescript
// src/lib/voice/prompts/correction-cues.ts
export const CORRECTION_CUES = {
  'cat-camel': {
    '[error_type]': {
      brief: [
        '[new variant 1]',
        '[new variant 2]',
        '[new variant 3]',
      ],
      detailed: [...]
    }
  }
}
```

### Update Vapi Dashboard

If system prompt changed, remind user:

```
⚠️ Remember to update Vapi Dashboard!

1. Go to dashboard.vapi.ai
2. Select "Rehabify Coach" assistant
3. Update System Prompt with new text
4. Test in playground

Or use Vapi API:
```bash
curl -X PATCH "https://api.vapi.ai/assistant/$ASSISTANT_ID" \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": {"systemPrompt": "[new prompt]"}}'
```
```

### Log Iteration

Create iteration log for tracking:

```yaml
# agent-os/specs/[spec]/voice-iterations/[timestamp].yaml
iteration:
  timestamp: "[ISO timestamp]"
  area: "[prompt area]"

  before:
    text: "[old prompt]"
    scores:
      naturalness: 3
      total: 3.4

  after:
    text: "[new prompt]"
    scores:
      naturalness: 4
      total: 4.3

  improvement: "+0.9 weighted score"

  variants_tested: 3
  selected: A

  tester: "[user or automated]"
  notes: |
    [Any observations or context]
```

---

## Final Output

```
## Prompt Iteration Complete

✅ Updated: src/lib/voice/prompts/[file].ts
✅ Logged: agent-os/specs/[spec]/voice-iterations/[timestamp].yaml

### Summary
- Area: [prompt area]
- Variants tested: 3
- Selected: Variant A
- Improvement: +0.9 weighted score (+26%)

### Before/After
**Before:** "[old text]"
**After:** "[new text]"

### Next Steps
⚠️ Update Vapi Dashboard if system prompt changed
👉 Run `/vapi-prompt-iteration` again for another area
👉 Test in production with real exercises
```

---

## Quick Iteration Mode

For rapid testing without full scoring:

```
/vapi-prompt-iteration --quick [area]
```

Generates 3 variants, user picks one, updates immediately.

---

## Bulk Cue Generation

Generate multiple correction cue variants at once:

```
/vapi-prompt-iteration --bulk-cues [exercise]
```

Generates 3 variants for each error type in that exercise.
