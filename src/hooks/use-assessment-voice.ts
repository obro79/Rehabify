/**
 * useAssessmentVoice Hook
 *
 * Drop-in replacement for useAssessmentVapi. Extends useGeminiVoice with
 * assessment-specific workflow handling. Uses inline configuration for
 * proper conversation flow with function-call-based data extraction.
 */

'use client';

import { useRef, useCallback } from 'react';
import { useGeminiVoice } from './use-gemini-voice';
import { useAssessmentStore } from '@/stores/assessment-store';

/**
 * Feature flag: Set to true for full demo workflow, false for short version
 * Toggle this back to false after demo recording
 */
const USE_FULL_WORKFLOW = true;

export interface UseAssessmentVoiceOptions {
  /** Assessment workflow ID (optional, kept for interface compatibility) */
  workflowId?: string;
  /** Called when assessment completes */
  onComplete?: () => void;
  /** Called when red flag is detected */
  onRedFlag?: () => void;
}

export interface UseAssessmentVoiceReturn {
  /** Start the assessment workflow */
  start: () => Promise<void>;
  /** Stop the assessment */
  stop: () => void;
  /** Whether connected to voice session */
  isConnected: boolean;
  /** Whether the model is speaking */
  isSpeaking: boolean;
  /** Toggle microphone mute */
  setMuted: (muted: boolean) => void;
  /** Inject context into the conversation */
  injectContext: (context: string) => void;
  /** Current workflow node (null for Gemini - no node-based workflow) */
  currentNode: string | null;
  /** Current phase (interview/movement/summary) */
  currentPhase: 'interview' | 'movement' | 'summary';
}

/**
 * System prompt - SHORT version (~4 min)
 */
const ASSESSMENT_SYSTEM_PROMPT_SHORT = `You are a friendly Rehabify physical therapy coach doing a quick lower back assessment.

## Style
- Warm and concise (under 20 words)
- ONE question at a time
- Skip small talk, stay focused

## Flow (5 essential questions)

### INTERVIEW (2 min)
1. "What's bothering your lower back? Tell me about the pain - where it is and how it feels."
2. "On a scale of 0-10, how bad is it? And what makes it worse?"
3. "What's your main goal - what do you want to get back to doing?"

### SAFETY CHECK
4. "Quick safety check: Any numbness, tingling down your legs, or changes in bladder control?"

If YES to safety: "I'd recommend seeing a doctor first before we continue. Once cleared, come back!"

### MOVEMENT (2 min)
5. "Let's do 3 quick movement tests. Stand where I can see you."

TEST 1: "Bend forward toward your toes, then back up. Any pain?"
TEST 2: "Now lean backwards gently. Better or worse than forward?"
TEST 3: "Side bend - slide hand down each leg. Which side feels tighter?"

### WRAP UP
"Based on what you shared, I've created your personalized plan focusing on [key area]. Ready to start your first exercise?"

## Rules
- Be brief, keep moving
- Don't repeat questions
- If user seems eager to move on, skip to next section

## IMPORTANT: Data Capture
After each section, IMMEDIATELY call the appropriate function to record the data:
- After question 1: call recordChiefComplaint
- After question 2: call recordPainLevel
- After question 3: call recordGoals
- After question 4: call recordSafetyCheck
- After each movement test: call recordMovementTest
- At wrap up: call completeAssessment`;

/**
 * System prompt - FULL version for demo (~8-10 min)
 */
const ASSESSMENT_SYSTEM_PROMPT_FULL = `You are a friendly, professional Rehabify physical therapy coach conducting a comprehensive lower back assessment.

## Style
- Warm, empathetic, and professional
- Ask ONE question at a time, wait for response
- Use empathy inserts like "I'm sorry to hear that" or "That sounds frustrating"
- Keep responses concise (under 25 words when possible)

## PHASE 1: GREETING
Start by setting expectations:
"Hi, I'm your Rehabify coach. I'm here to understand your situation and create a personalized rehab plan just for you. This will take about 8 to 10 minutes. I'll ask you some questions about what's bothering you, and then we'll do a few simple movement tests so I can see how your body is moving. Ready to get started?"

Wait for confirmation. If they ask about privacy: "Great question. I don't store any video - your camera helps me see your movements in real-time, but nothing is recorded or saved."

## PHASE 2: CHIEF COMPLAINT (ask one at a time)
1. "What's the main issue that brought you here today?"
2. "Can you point to or describe exactly where you feel it?"
3. "When did this start? Was it days, weeks, or months ago?"
4. "Did something specific trigger it, like an injury, or did it come on gradually?"

Probe if vague:
- Location vague: "If you had to put your finger on the exact spot, where would that be?"
- Injury reported: "Tell me a bit more about what happened."
- Gradual onset: "Has it been getting worse over time, staying the same, or does it come and go?"

After gathering: call recordChiefComplaint

## PHASE 3: PAIN CHARACTERIZATION (ask one at a time)
1. "Right now, how would you rate the pain on a scale of 0 to 10, where 0 is no pain and 10 is the worst imaginable?"
2. "And at its worst, what does it get up to?"
3. "How would you describe the feeling - is it more of a sharp pain, a dull ache, burning, or something else?"
4. "Does the pain stay in one spot, or does it travel anywhere, like down your leg or into your hip?"
5. "What activities or positions tend to make it worse?"
6. "And what helps? Anything that makes it feel better?"

Follow-up probes:
- Pain > 7: "That's pretty significant. Is it affecting your sleep?"
- Radiating pain: "How far down does it go? To your knee? Your foot?"
- Multiple aggravators: "Which one of those is the biggest trigger?"

After gathering: call recordPainLevel

## PHASE 4: FUNCTIONAL IMPACT (ask one at a time)
1. "What activities are hardest for you right now because of this?"
2. "How is this affecting your daily life - things like work, household tasks, or getting around?"
3. "If we could get you back to doing one thing you miss, what would that be?"

Follow-up probes:
- Work mentioned: "What kind of work do you do? Desk job, or more physical?"
- Exercise/sports mentioned: "What were you doing before this started? How active were you?"
- Sleep affected: "About how many hours of sleep are you getting?"

After gathering: call recordGoals

## PHASE 5: MEDICAL HISTORY & SAFETY SCREENING
Ask these questions:
1. "Have you had any previous injuries or problems with this area before?"
2. "Have you had any imaging done for this - like an X-ray or MRI?"
3. "Are you currently seeing anyone else for this - a doctor, physio, or chiropractor?"

CRITICAL - Screen for red flags:
4. "Have you noticed any unexplained weight loss recently?"
5. "Any fever or feeling generally unwell along with this pain?"
6. "Any changes in bladder or bowel control?"
7. "Have you noticed the weakness getting progressively worse?"

After gathering: call recordSafetyCheck

If ANY red flag detected:
"Thank you for telling me that. Based on what you've shared, I'd strongly recommend you see a healthcare provider before starting any exercises. This is something that really should be evaluated by a professional first. Once you've been cleared, come back and we can get started on your program."
Then call completeAssessment with hasRedFlags: true

## PHASE 6: MOVEMENT SCREEN
Transition: "Great, thanks for answering all those questions. Now I'd like to see how your body actually moves - this tells me a lot more than words alone. I'll guide you through 3 quick movement tests. Stand facing your camera, about an arm's length away, so I can see your whole body. Go slowly through each movement, and stop immediately if anything hurts. Ready?"

Wait for confirmation.

TEST 1 - FORWARD BEND:
"First test: I want you to slowly bend forward, reaching your hands toward your toes. Go as far as is comfortable, pause for a moment at the bottom, then slowly come back up. Ready? Go ahead."
After: "Did that cause any pain?" If yes: "Where exactly, and what number would you give it?"
"Did you feel any pulling or tightness?"
Say "Good job" or "Nice work"
Call recordMovementTest with testType: "flexion"

TEST 2 - BACKWARD BEND:
"Good. Now put your hands on your lower back for support. I want you to gently lean backwards, looking up at the ceiling. Don't force it - just go as far as feels comfortable, then come back to standing. Ready? Go ahead."
After: "Any pain with that one?" If yes: "Same place as before, or somewhere different?"
"Was that better, worse, or about the same as bending forward?"
Call recordMovementTest with testType: "extension"

TEST 3 - SIDE BENDS:
"Last one. Keep your feet shoulder-width apart. Slide your right hand down the side of your leg toward your knee, bending to the right. Come back up, then do the same thing to the left. Ready? Start with the right side."
After: "Did one side feel tighter or more painful than the other?" If asymmetric: "Which side was harder - the left or the right?"
Say "Great job with those movement tests!"
Call recordMovementTest with testType: "sideBend"

## PHASE 7: SUMMARY & WRAP UP
Summarize findings:
"Let me make sure I've got this right. You're dealing with [BODY PART] pain that started about [DURATION] ago. The pain is [CHARACTER] and you'd rate it [CURRENT]/10 right now. It tends to flare up when you [TOP AGGRAVATOR], and [RELIEVER] helps. Your main goal is to get back to [GOAL].

On the movement tests, I noticed [KEY FINDING - e.g., 'bending backward felt better than bending forward'].

Does that sound accurate?"

If they correct something: "Got it, let me update that." Re-confirm.

Wait for confirmation, then:
"Perfect. Give me just a moment while I put together your personalized plan based on everything you've told me..."

Then: "Alright, your plan is ready. Based on what you've told me and what I saw in your movements, we're going to focus on [FOCUS AREAS]. Your plan is 12 weeks long. Your physical therapist will review this plan, but you don't need to wait - you can start your first exercise right now if you'd like. Would you like to try your first exercise?"

If "yes": "Great! Let me take you to your first exercise."
If "no"/"later": "No problem. Your plan is saved and ready whenever you are. You can access it from your dashboard."

Call completeAssessment

## Rules
- Be warm and professional throughout
- Use the patient's words when summarizing
- Give encouragement during movement tests
- Never rush the red flag screening`;

/**
 * Assessment tools in Gemini FunctionDeclaration format.
 * Converted from Vapi format: removed `type: "function"` wrapper and `function:` nesting.
 * Parameters use the same JSON Schema format accepted by both Vapi and Gemini.
 */
const ASSESSMENT_TOOLS = [
  {
    name: 'recordChiefComplaint',
    description: "Record the patient's main complaint about their lower back",
    parameters: {
      type: 'object',
      properties: {
        bodyPart: {
          type: 'string',
          description:
            "Specific area of the lower back affected (e.g., 'lower back', 'left side', 'right side', 'across the whole back')",
        },
        symptomType: {
          type: 'string',
          description:
            "Type of symptom (e.g., 'pain', 'stiffness', 'aching', 'sharp pain', 'dull ache')",
        },
        duration: {
          type: 'string',
          description:
            "How long they've had the issue (e.g., '2 weeks', '3 months', 'years')",
        },
        onset: {
          type: 'string',
          enum: ['gradual', 'sudden', 'injury'],
          description: 'How the pain started',
        },
      },
      required: ['bodyPart', 'symptomType'],
    },
  },
  {
    name: 'recordPainLevel',
    description: "Record the patient's pain level and triggers",
    parameters: {
      type: 'object',
      properties: {
        currentLevel: {
          type: 'number',
          description: 'Current pain level 0-10',
          minimum: 0,
          maximum: 10,
        },
        aggravators: {
          type: 'array',
          items: { type: 'string' },
          description:
            "Activities that make pain worse (e.g., 'sitting', 'bending', 'lifting')",
        },
        relievers: {
          type: 'array',
          items: { type: 'string' },
          description:
            "Things that help reduce pain (e.g., 'walking', 'lying down', 'stretching')",
        },
      },
      required: ['currentLevel'],
    },
  },
  {
    name: 'recordGoals',
    description: "Record the patient's goals for treatment",
    parameters: {
      type: 'object',
      properties: {
        goals: {
          type: 'array',
          items: { type: 'string' },
          description:
            "What the patient wants to achieve (e.g., 'return to running', 'sit without pain', 'play with kids')",
        },
        limitedActivities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Activities currently limited by pain',
        },
      },
      required: ['goals'],
    },
  },
  {
    name: 'recordSafetyCheck',
    description: 'Record the safety screening results',
    parameters: {
      type: 'object',
      properties: {
        hasRedFlags: {
          type: 'boolean',
          description:
            'Whether patient reported numbness, tingling, or bladder changes',
        },
        redFlagDetails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific red flags reported',
        },
      },
      required: ['hasRedFlags'],
    },
  },
  {
    name: 'recordMovementTest',
    description: 'Record the result of a movement test',
    parameters: {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['flexion', 'extension', 'sideBend'],
          description: 'Which movement test was performed',
        },
        painLevel: {
          type: 'number',
          description: 'Pain level during movement 0-10 (0 if no pain)',
          minimum: 0,
          maximum: 10,
        },
        painLocation: {
          type: 'string',
          description: 'Where pain was felt during movement',
        },
        comparison: {
          type: 'string',
          enum: ['better', 'worse', 'same'],
          description: 'For extension: compared to flexion',
        },
        tighterSide: {
          type: 'string',
          enum: ['left', 'right', 'both', 'neither'],
          description: 'For side bend: which side felt tighter',
        },
      },
      required: ['testType', 'painLevel'],
    },
  },
  {
    name: 'completeAssessment',
    description: 'Mark the assessment as complete and record final status',
    parameters: {
      type: 'object',
      properties: {
        wantsToStartExercise: {
          type: 'boolean',
          description:
            'Whether patient wants to start their first exercise',
        },
        focusAreas: {
          type: 'array',
          items: { type: 'string' },
          description:
            "Recommended focus areas based on assessment (e.g., 'flexibility', 'core strength')",
        },
      },
      required: ['wantsToStartExercise'],
    },
  },
];

/**
 * First messages for each mode
 */
const FIRST_MESSAGE_SHORT =
  "Hi! I'm your Rehabify coach. Let's create your personalized plan - just a few quick questions, then some movement tests. Takes about 4 minutes. What's going on with your lower back?";

const FIRST_MESSAGE_FULL =
  "Hi, I'm your Rehabify coach. I'm here to understand your situation and create a personalized rehab plan just for you. This will take about 8 to 10 minutes. I'll ask you some questions about what's bothering you, and then we'll do a few simple movement tests so I can see how your body is moving. Ready to get started?";

/**
 * Inline assistant configuration for the assessment workflow.
 * Structured in Vapi format so useGeminiVoice.start() can extract and convert it.
 */
const ASSESSMENT_ASSISTANT_CONFIG = {
  name: 'Rehabify Assessment Coach',
  firstMessage: USE_FULL_WORKFLOW ? FIRST_MESSAGE_FULL : FIRST_MESSAGE_SHORT,
  model: {
    provider: 'google',
    model: 'gemini-2.5-flash-preview-native-audio-dialog',
    messages: [
      {
        role: 'system',
        content: USE_FULL_WORKFLOW
          ? ASSESSMENT_SYSTEM_PROMPT_FULL
          : ASSESSMENT_SYSTEM_PROMPT_SHORT,
      },
    ],
    tools: ASSESSMENT_TOOLS.map((t) => ({
      type: 'function' as const,
      function: t,
    })),
  },
  voice: {
    provider: '11labs',
    voiceId: 'sarah',
  },
};

/**
 * Hook for managing Gemini Live assessment workflow.
 * Drop-in replacement for useAssessmentVapi.
 */
export function useAssessmentVoice(
  options: UseAssessmentVoiceOptions = {}
): UseAssessmentVoiceReturn {
  const { workflowId, onComplete, onRedFlag } = options;

  // Assessment store actions
  const {
    currentNodeId,
    currentPhase,
    startAssessment,
    setComplete,
    setRedFlag,
    updateChiefComplaint,
    updatePain,
    updateFunctional,
    updateHistory,
    updateMovementScreen,
    setWantsToStart,
    reset: resetAssessment,
  } = useAssessmentStore();

  // Store callbacks in refs
  const onCompleteRef = useRef(onComplete);
  const onRedFlagRef = useRef(onRedFlag);
  onCompleteRef.current = onComplete;
  onRedFlagRef.current = onRedFlag;

  // Handle function calls from the LLM to extract structured data
  const handleFunctionCall = useCallback(
    (name: string, args: Record<string, unknown>) => {
      console.log('[useAssessmentVoice] Function call:', name, args);

      switch (name) {
        case 'recordChiefComplaint':
          updateChiefComplaint({
            bodyPart: args.bodyPart as string,
            symptomType: args.symptomType as string,
            duration: args.duration as string,
            onset: args.onset as 'gradual' | 'sudden' | 'injury',
          });
          console.log('[useAssessmentVoice] Chief complaint recorded');
          break;

        case 'recordPainLevel':
          updatePain({
            currentLevel: args.currentLevel as number,
            aggravators: (args.aggravators as string[]) || [],
            relievers: (args.relievers as string[]) || [],
          });
          console.log('[useAssessmentVoice] Pain level recorded');
          break;

        case 'recordGoals':
          updateFunctional({
            goals: (args.goals as string[]) || [],
            limitedActivities: (args.limitedActivities as string[]) || [],
          });
          console.log('[useAssessmentVoice] Goals recorded');
          break;

        case 'recordSafetyCheck': {
          const hasRedFlags = args.hasRedFlags as boolean;
          const redFlagDetails = (args.redFlagDetails as string[]) || [];
          updateHistory({
            redFlags: hasRedFlags ? redFlagDetails : [],
          });
          if (hasRedFlags) {
            setRedFlag();
            onRedFlagRef.current?.();
            console.log('[useAssessmentVoice] Red flags detected!');
          }
          console.log('[useAssessmentVoice] Safety check recorded');
          break;
        }

        case 'recordMovementTest': {
          const testType = args.testType as 'flexion' | 'extension' | 'sideBend';
          const painLevel = args.painLevel as number;

          if (testType === 'flexion') {
            updateMovementScreen({
              flexion: {
                pain: painLevel,
                painLocation: args.painLocation as string,
              },
            });
          } else if (testType === 'extension') {
            updateMovementScreen({
              extension: {
                pain: painLevel,
                comparison: args.comparison as 'better' | 'worse' | 'same',
              },
            });
          } else if (testType === 'sideBend') {
            updateMovementScreen({
              sideBend: {
                pain: painLevel,
                painSide: args.tighterSide as 'left' | 'right' | 'both' | 'neither',
              },
            });
          }
          console.log(`[useAssessmentVoice] Movement test (${testType}) recorded`);
          break;
        }

        case 'completeAssessment':
          setWantsToStart(args.wantsToStartExercise as boolean);
          setComplete();
          onCompleteRef.current?.();
          console.log('[useAssessmentVoice] Assessment complete!');
          break;

        default:
          console.log('[useAssessmentVoice] Unknown function:', name);
      }
    },
    [
      updateChiefComplaint,
      updatePain,
      updateFunctional,
      updateHistory,
      updateMovementScreen,
      setWantsToStart,
      setComplete,
      setRedFlag,
    ]
  );

  // Base Gemini voice hook
  const {
    start: geminiStart,
    stop: geminiStop,
    isConnected,
    isSpeaking,
    setMuted,
    injectContext,
  } = useGeminiVoice({
    onConnectionChange: (connected) => {
      if (connected) {
        startAssessment(`workflow_${Date.now()}`);
      }
    },
    onFunctionCall: handleFunctionCall,
  });

  // Start assessment with inline assistant config
  const start = useCallback(async () => {
    resetAssessment();
    await geminiStart(ASSESSMENT_ASSISTANT_CONFIG as Record<string, unknown>);
  }, [geminiStart, resetAssessment]);

  // Stop assessment
  const stop = useCallback(() => {
    geminiStop();
    resetAssessment();
  }, [geminiStop, resetAssessment]);

  return {
    start,
    stop,
    isConnected,
    isSpeaking,
    setMuted,
    injectContext,
    currentNode: currentNodeId,
    currentPhase,
  };
}

export default useAssessmentVoice;
