/**
 * Form engine: picks the right per-exercise analyzer for an exercise and runs
 * it frame by frame, owning the state that persists between frames.
 *
 * Per-exercise rules live in ./exercises/*, shared math in ./geometry and
 * shared types in ./form-types.
 */
import type { Exercise } from "@/lib/exercises/types";
import type { Landmark } from "@/types/vision";
import type { EngineState, FormEngineResult } from "./form-types";
import { createEngineState } from "./form-types";
import { baseFormScore, coreConfidence } from "./geometry";
import { analyzeCatCamel, analyzeCobra, analyzeDeadBug } from "./exercises/floor";
import {
  analyzeStandingLumbarExtension,
  analyzeStandingLumbarFlexion,
  analyzeStandingLumbarSideBend,
} from "./exercises/lumbar";
import { analyzeLunge, analyzeLungeWithRotation, analyzeRDL } from "./exercises/standing";
import { analyzeSquat, createSquatState } from "./exercises/squat";

export type { EngineState, FormEngineResult } from "./form-types";

type Analyzer = (
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
) => FormEngineResult;

const ANALYZERS: Record<string, Analyzer> = {
  "cat-camel": analyzeCatCamel,
  "cat-cow": analyzeCatCamel,
  "cobra-stretch": analyzeCobra,
  "dead-bug": analyzeDeadBug,
  "standing-lumbar-flexion": analyzeStandingLumbarFlexion,
  "standing-lumbar-extension": analyzeStandingLumbarExtension,
  "standing-lumbar-side-bending": analyzeStandingLumbarSideBend,
  "romanian-deadlift": analyzeRDL,
  lunge: analyzeLunge,
  "lunge-with-rotation": analyzeLungeWithRotation,
};

const SQUAT_KEYS = new Set(["bodyweight-squat", "squat"]);

// Keys that only resolve by slug, matching the original behaviour where the
// id fallback did not include the lunge variants or cat-cow.
const SLUG_ONLY_KEYS = new Set(["lunge", "lunge-with-rotation", "cat-cow"]);

export function createFormEngine(exercise: Exercise) {
  const state = createEngineState();
  const squatState = createSquatState();

  const key =
    exercise.slug in ANALYZERS || SQUAT_KEYS.has(exercise.slug)
      ? exercise.slug
      : !SLUG_ONLY_KEYS.has(exercise.id)
        ? exercise.id
        : undefined;

  return (landmarks: Landmark[]): FormEngineResult => {
    const thresholds = exercise.detection_config?.thresholds ?? {};

    let result: FormEngineResult;
    if (key && SQUAT_KEYS.has(key)) {
      result = analyzeSquat(landmarks, thresholds, squatState);
    } else if (key && ANALYZERS[key]) {
      result = ANALYZERS[key](landmarks, thresholds, state);
    } else {
      result = {
        phase: exercise.detection_config?.phases?.[0] ?? "neutral",
        formScore: baseFormScore(landmarks),
        errors: [],
        isCorrect: true,
        repIncremented: false,
        confidence: coreConfidence(landmarks),
      };
    }

    state.lastPhase = result.phase;

    // Block rep counting if there are any warning-severity errors
    const hasWarning = result.errors.some((e) => e.severity === "warning");
    if (hasWarning && result.repIncremented) {
      result.repIncremented = false;
    }

    if (result.repIncremented) {
      state.lastRepPhase = result.phase;
    }

    return result;
  };
}
