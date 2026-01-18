/**
 * useAssessmentVapi Hook
 *
 * Extends useVapi with assessment-specific workflow handling.
 * Uses inline assistant configuration for proper conversation flow.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useVapi } from "./use-vapi";
import { useAssessmentStore } from "@/stores/assessment-store";
import { getPhaseFromNode } from "@/lib/vapi/assessment-workflow";

export interface UseAssessmentVapiOptions {
  /** Assessment workflow/assistant ID (optional - uses inline config by default) */
  workflowId?: string;
  /** Called when assessment completes */
  onComplete?: () => void;
  /** Called when red flag is detected */
  onRedFlag?: () => void;
}

export interface UseAssessmentVapiReturn {
  /** Start the assessment workflow */
  start: () => Promise<void>;
  /** Stop the assessment */
  stop: () => void;
  /** Whether connected to Vapi */
  isConnected: boolean;
  /** Whether assistant is speaking */
  isSpeaking: boolean;
  /** Toggle microphone mute */
  setMuted: (muted: boolean) => void;
  /** Inject context into the conversation */
  injectContext: (context: string) => void;
  /** Current workflow node */
  currentNode: string | null;
  /** Current phase (interview/movement/summary) */
  currentPhase: "interview" | "movement" | "summary";
}

// Node IDs that indicate movement phase is active
const MOVEMENT_NODES = [
  "movement_intro",
  "flexion_test",
  "extension_test",
  "sidebend_test",
];

// Node IDs that indicate summary phase
const SUMMARY_NODES = ["summary", "plan_generation", "complete"];

/**
 * System prompt for the assessment workflow (streamlined version)
 */
const ASSESSMENT_SYSTEM_PROMPT = `You are a friendly Rehabify physical therapy coach doing a quick lower back assessment.

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
 * Function tools for extracting structured data from the conversation
 */
const ASSESSMENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "recordChiefComplaint",
      description: "Record the patient's main complaint about their lower back",
      parameters: {
        type: "object",
        properties: {
          bodyPart: {
            type: "string",
            description: "Specific area of the lower back affected (e.g., 'lower back', 'left side', 'right side', 'across the whole back')",
          },
          symptomType: {
            type: "string",
            description: "Type of symptom (e.g., 'pain', 'stiffness', 'aching', 'sharp pain', 'dull ache')",
          },
          duration: {
            type: "string",
            description: "How long they've had the issue (e.g., '2 weeks', '3 months', 'years')",
          },
          onset: {
            type: "string",
            enum: ["gradual", "sudden", "injury"],
            description: "How the pain started",
          },
        },
        required: ["bodyPart", "symptomType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recordPainLevel",
      description: "Record the patient's pain level and triggers",
      parameters: {
        type: "object",
        properties: {
          currentLevel: {
            type: "number",
            description: "Current pain level 0-10",
            minimum: 0,
            maximum: 10,
          },
          aggravators: {
            type: "array",
            items: { type: "string" },
            description: "Activities that make pain worse (e.g., 'sitting', 'bending', 'lifting')",
          },
          relievers: {
            type: "array",
            items: { type: "string" },
            description: "Things that help reduce pain (e.g., 'walking', 'lying down', 'stretching')",
          },
        },
        required: ["currentLevel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recordGoals",
      description: "Record the patient's goals for treatment",
      parameters: {
        type: "object",
        properties: {
          goals: {
            type: "array",
            items: { type: "string" },
            description: "What the patient wants to achieve (e.g., 'return to running', 'sit without pain', 'play with kids')",
          },
          limitedActivities: {
            type: "array",
            items: { type: "string" },
            description: "Activities currently limited by pain",
          },
        },
        required: ["goals"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recordSafetyCheck",
      description: "Record the safety screening results",
      parameters: {
        type: "object",
        properties: {
          hasRedFlags: {
            type: "boolean",
            description: "Whether patient reported numbness, tingling, or bladder changes",
          },
          redFlagDetails: {
            type: "array",
            items: { type: "string" },
            description: "Specific red flags reported",
          },
        },
        required: ["hasRedFlags"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recordMovementTest",
      description: "Record the result of a movement test",
      parameters: {
        type: "object",
        properties: {
          testType: {
            type: "string",
            enum: ["flexion", "extension", "sideBend"],
            description: "Which movement test was performed",
          },
          painLevel: {
            type: "number",
            description: "Pain level during movement 0-10 (0 if no pain)",
            minimum: 0,
            maximum: 10,
          },
          painLocation: {
            type: "string",
            description: "Where pain was felt during movement",
          },
          comparison: {
            type: "string",
            enum: ["better", "worse", "same"],
            description: "For extension: compared to flexion",
          },
          tighterSide: {
            type: "string",
            enum: ["left", "right", "both", "neither"],
            description: "For side bend: which side felt tighter",
          },
        },
        required: ["testType", "painLevel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "completeAssessment",
      description: "Mark the assessment as complete and record final status",
      parameters: {
        type: "object",
        properties: {
          wantsToStartExercise: {
            type: "boolean",
            description: "Whether patient wants to start their first exercise",
          },
          focusAreas: {
            type: "array",
            items: { type: "string" },
            description: "Recommended focus areas based on assessment (e.g., 'flexibility', 'core strength')",
          },
        },
        required: ["wantsToStartExercise"],
      },
    },
  },
];

/**
 * Inline assistant configuration for the assessment workflow
 */
const ASSESSMENT_ASSISTANT_CONFIG = {
  name: "Rehabify Assessment Coach",
  firstMessage: `Hi! I'm your Rehabify coach. Let's create your personalized plan - just a few quick questions, then some movement tests. Takes about 4 minutes. What's going on with your lower back?`,
  model: {
    provider: "openai",
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: ASSESSMENT_SYSTEM_PROMPT,
      },
    ],
    tools: ASSESSMENT_TOOLS,
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
  },
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 900,
};

/**
 * Hook for managing Vapi assessment workflow
 */
export function useAssessmentVapi(
  options: UseAssessmentVapiOptions = {}
): UseAssessmentVapiReturn {
  const { workflowId, onComplete, onRedFlag } = options;

  // Assessment store actions
  const {
    currentNodeId,
    currentPhase,
    startAssessment,
    setCurrentNode,
    setPhase,
    setComplete,
    setRedFlag,
    updateChiefComplaint,
    updatePain,
    updateFunctional,
    updateHistory,
    updateMovementScreen,
    setSummaryConfirmed,
    setWantsToStart,
    addTranscript,
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
      console.log("[useAssessmentVapi] 📝 Function call:", name, args);

      switch (name) {
        case "recordChiefComplaint":
          updateChiefComplaint({
            bodyPart: args.bodyPart as string,
            symptomType: args.symptomType as string,
            duration: args.duration as string,
            onset: args.onset as "gradual" | "sudden" | "injury",
          });
          console.log("[useAssessmentVapi] ✅ Chief complaint recorded");
          break;

        case "recordPainLevel":
          updatePain({
            currentLevel: args.currentLevel as number,
            aggravators: args.aggravators as string[] || [],
            relievers: args.relievers as string[] || [],
          });
          console.log("[useAssessmentVapi] ✅ Pain level recorded");
          break;

        case "recordGoals":
          updateFunctional({
            goals: args.goals as string[] || [],
            limitedActivities: args.limitedActivities as string[] || [],
          });
          console.log("[useAssessmentVapi] ✅ Goals recorded");
          break;

        case "recordSafetyCheck":
          const hasRedFlags = args.hasRedFlags as boolean;
          const redFlagDetails = args.redFlagDetails as string[] || [];
          updateHistory({
            redFlags: hasRedFlags ? redFlagDetails : [],
          });
          if (hasRedFlags) {
            setRedFlag();
            onRedFlagRef.current?.();
            console.log("[useAssessmentVapi] ⚠️ Red flags detected!");
          }
          console.log("[useAssessmentVapi] ✅ Safety check recorded");
          break;

        case "recordMovementTest":
          const testType = args.testType as "flexion" | "extension" | "sideBend";
          const painLevel = args.painLevel as number;

          if (testType === "flexion") {
            updateMovementScreen({
              flexion: {
                pain: painLevel,
                painLocation: args.painLocation as string,
              },
            });
          } else if (testType === "extension") {
            updateMovementScreen({
              extension: {
                pain: painLevel,
                comparison: args.comparison as "better" | "worse" | "same",
              },
            });
          } else if (testType === "sideBend") {
            updateMovementScreen({
              sideBend: {
                pain: painLevel,
                painSide: args.tighterSide as "left" | "right" | "both" | "neither",
              },
            });
          }
          console.log(`[useAssessmentVapi] ✅ Movement test (${testType}) recorded`);
          break;

        case "completeAssessment":
          setWantsToStart(args.wantsToStartExercise as boolean);
          setComplete();
          onCompleteRef.current?.();
          console.log("[useAssessmentVapi] ✅ Assessment complete!");
          break;

        default:
          console.log("[useAssessmentVapi] Unknown function:", name);
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

  // Base Vapi hook
  const {
    start: vapiStart,
    stop: vapiStop,
    isConnected,
    isSpeaking,
    setMuted,
    injectContext,
  } = useVapi({
    onConnectionChange: (connected) => {
      if (connected) {
        // Initialize assessment when connected
        startAssessment(`workflow_${Date.now()}`);
      }
    },
    onFunctionCall: handleFunctionCall,
  });

  // Start assessment with inline assistant config
  const start = useCallback(async () => {
    resetAssessment();
    // Pass inline assistant config instead of just an ID
    await vapiStart(ASSESSMENT_ASSISTANT_CONFIG as unknown as string);
  }, [vapiStart, resetAssessment]);

  // Stop assessment
  const stop = useCallback(() => {
    vapiStop();
    resetAssessment();
  }, [vapiStop, resetAssessment]);

  // Handle extracted variables from workflow
  // This would be called by the webhook when Vapi sends variable extractions
  const handleVariableExtraction = useCallback(
    (nodeId: string, variables: Record<string, unknown>) => {
      console.log("[useAssessmentVapi] Variable extraction:", nodeId, variables);

      // Update store based on which node extracted variables
      switch (nodeId) {
        case "chief_complaint":
          updateChiefComplaint({
            bodyPart: variables.bodyPart as string,
            symptomType: variables.symptomType as string,
            duration: variables.duration as string,
            onset: variables.onset as "gradual" | "sudden" | "injury",
          });
          break;

        case "pain_characterization":
          updatePain({
            currentLevel: variables.currentLevel as number,
            worstLevel: variables.worstLevel as number,
            character: variables.character as string[],
            radiates: variables.radiates as boolean,
            radiationPattern: variables.radiationPattern as string,
            aggravators: variables.aggravators as string[],
            relievers: variables.relievers as string[],
          });
          break;

        case "functional_impact":
          updateFunctional({
            limitedActivities: variables.limitedActivities as string[],
            dailyImpact: variables.dailyImpact as string,
            goals: variables.goals as string[],
          });
          break;

        case "medical_history":
          const redFlags = variables.redFlags as string[] | undefined;
          updateHistory({
            previousInjuries: variables.previousInjuries as boolean,
            previousInjuryDetails: variables.previousInjuryDetails as string,
            imaging: variables.imaging as "xray" | "mri" | "ct" | "none",
            imagingFindings: variables.imagingFindings as string,
            currentTreatment: variables.currentTreatment as string,
            redFlags: redFlags || [],
          });

          // Check for red flags
          if (redFlags && redFlags.length > 0) {
            setRedFlag();
            onRedFlagRef.current?.();
          }
          break;

        case "flexion_test":
          updateMovementScreen({
            flexion: {
              pain: variables.flexionPain as number,
              painLocation: variables.flexionPainLocation as string,
            },
          });
          break;

        case "extension_test":
          updateMovementScreen({
            extension: {
              pain: variables.extensionPain as number,
              comparison: variables.extensionComparison as "better" | "worse" | "same",
            },
          });
          break;

        case "sidebend_test":
          updateMovementScreen({
            sideBend: {
              pain: variables.sideBendPain as number,
              painSide: variables.sideBendPainSide as "left" | "right" | "both" | "neither",
            },
          });
          break;

        case "summary":
          setSummaryConfirmed(variables.confirmed as boolean);
          break;

        case "plan_generation":
          setWantsToStart(variables.wantsToStart as boolean);
          break;

        case "complete":
          setComplete();
          onCompleteRef.current?.();
          break;
      }
    },
    [
      updateChiefComplaint,
      updatePain,
      updateFunctional,
      updateHistory,
      updateMovementScreen,
      setSummaryConfirmed,
      setWantsToStart,
      setComplete,
      setRedFlag,
    ]
  );

  // Handle node transition from workflow
  const handleNodeTransition = useCallback(
    (newNodeId: string) => {
      console.log("[useAssessmentVapi] Node transition:", newNodeId);
      setCurrentNode(newNodeId);

      // Update phase based on node
      const newPhase = getPhaseFromNode(newNodeId);
      if (newPhase !== currentPhase) {
        setPhase(newPhase);
      }

      // Check for completion
      if (newNodeId === "complete") {
        setComplete();
        onCompleteRef.current?.();
      }

      // Check for red flag exit
      if (newNodeId === "red_flag_exit") {
        setRedFlag();
        onRedFlagRef.current?.();
      }
    },
    [currentPhase, setCurrentNode, setPhase, setComplete, setRedFlag]
  );

  // Expose handlers for webhook to call
  // In a real implementation, these would be called via a context or event system
  useEffect(() => {
    // Register handlers on window for webhook access (temporary approach)
    // A more robust solution would use a proper event bus or context
    (window as unknown as Record<string, unknown>).__assessmentHandlers = {
      handleNodeTransition,
      handleVariableExtraction,
    };

    return () => {
      delete (window as unknown as Record<string, unknown>).__assessmentHandlers;
    };
  }, [handleNodeTransition, handleVariableExtraction]);

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

export default useAssessmentVapi;
