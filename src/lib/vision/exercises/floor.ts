import type { Landmark } from "@/types/vision";
import type { FormError } from "@/types";
import type { FormEngineResult, EngineState } from "../form-types";
import { createError } from "../form-types";
import {
  LANDMARKS,
  midpoint,
  distance2D,
  angleBetween,
  baseFormScore,
  coreConfidence,
} from "../geometry";

export function analyzeCatCamel(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const midShoulder = midpoint(
    landmarks[LANDMARKS.leftShoulder],
    landmarks[LANDMARKS.rightShoulder]
  );
  const midHip = midpoint(landmarks[LANDMARKS.leftHip], landmarks[LANDMARKS.rightHip]);
  const midKnee = midpoint(landmarks[LANDMARKS.leftKnee], landmarks[LANDMARKS.rightKnee]);

  const spineCurve = midShoulder.y - midHip.y;
  const hipAngle = angleBetween(midShoulder, midHip, midKnee);

  const catThreshold = thresholds.cat_spine_curve ?? 0.1;
  const camelThreshold = thresholds.camel_spine_curve ?? -0.1;

  let phase = "neutral";
  if (spineCurve >= catThreshold) phase = "cat";
  if (spineCurve <= camelThreshold) phase = "camel";

  const errors: FormError[] = [];
  if (hipAngle < 70) {
    errors.push(createError("hip_alignment", "Keep hips stacked over knees", "warning", "hips"));
  }

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors,
    isCorrect: errors.length === 0,
    repIncremented: state.lastPhase === "cat" && phase === "camel",
    confidence: coreConfidence(landmarks),
  };
}

export function analyzeCobra(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftElbow = landmarks[LANDMARKS.leftElbow];
  const rightElbow = landmarks[LANDMARKS.rightElbow];
  const leftWrist = landmarks[LANDMARKS.leftWrist];
  const rightWrist = landmarks[LANDMARKS.rightWrist];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(landmarks[LANDMARKS.leftHip], landmarks[LANDMARKS.rightHip]);

  const chestLift = midHip.y - midShoulder.y;
  const minLift = thresholds.min_chest_lift ?? 0.1;
  const maxLift = thresholds.max_chest_lift ?? 0.35;

  let phase = "prone";
  if (chestLift > minLift) phase = "lift";
  if (chestLift > maxLift) phase = "hold";
  if (state.lastPhase === "hold" && chestLift <= minLift) phase = "lower";

  const elbowAngle = Math.min(
    angleBetween(leftShoulder, leftElbow, leftWrist),
    angleBetween(rightShoulder, rightElbow, rightWrist)
  );

  const errors: FormError[] = [];
  if (chestLift > maxLift + 0.08) {
    errors.push(createError("overextension", "Lift only to a comfortable height", "warning", "spine"));
  }
  if (elbowAngle < 120) {
    errors.push(createError("elbow_lock", "Soften the elbows slightly", "info", "elbows"));
  }

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors,
    isCorrect: errors.length === 0,
    repIncremented: state.lastPhase === "hold" && phase === "lower",
    confidence: coreConfidence(landmarks),
  };
}

export function analyzeDeadBug(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftWrist = landmarks[LANDMARKS.leftWrist];
  const rightWrist = landmarks[LANDMARKS.rightWrist];

  const extensionThreshold = thresholds.full_extension_threshold ?? 0.85;
  const rightExtended =
    distance2D(rightHip, rightAnkle) > extensionThreshold &&
    distance2D(leftShoulder, leftWrist) > extensionThreshold;
  const leftExtended =
    distance2D(leftHip, leftAnkle) > extensionThreshold &&
    distance2D(rightShoulder, rightWrist) > extensionThreshold;

  let phase = "start";
  if (rightExtended) phase = "extend_right";
  if (leftExtended) phase = "extend_left";
  if (state.lastPhase.startsWith("extend") && !(rightExtended || leftExtended)) {
    phase = "return";
  }

  if (rightExtended) state.lastExtendedSide = "right";
  else if (leftExtended) state.lastExtendedSide = "left";

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors: [],
    isCorrect: true,
    repIncremented:
      state.lastPhase.startsWith("extend") &&
      phase === "return" &&
      state.lastRepPhase !== phase,
    confidence: coreConfidence(landmarks),
  };
}
