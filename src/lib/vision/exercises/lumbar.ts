import type { Landmark } from "@/types/vision";
import type { FormError } from "@/types";
import type { FormEngineResult, EngineState } from "../form-types";
import { addOrientationError, createError } from "../form-types";
import {
  LANDMARKS,
  midpoint,
  angleBetween3D,
  baseFormScore,
  coreConfidence,
  checkOrientation,
} from "../geometry";

export function analyzeStandingLumbarFlexion(
  landmarks: Landmark[],
  _thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const errors: FormError[] = [];
  addOrientationError(errors, checkOrientation(landmarks, "side"));

  const midShoulder = midpoint(
    landmarks[LANDMARKS.leftShoulder],
    landmarks[LANDMARKS.rightShoulder]
  );
  const midHip = midpoint(landmarks[LANDMARKS.leftHip], landmarks[LANDMARKS.rightHip]);
  const midKnee = midpoint(landmarks[LANDMARKS.leftKnee], landmarks[LANDMARKS.rightKnee]);
  const midAnkle = midpoint(landmarks[LANDMARKS.leftAnkle], landmarks[LANDMARKS.rightAnkle]);

  const hipAngle = angleBetween3D(midShoulder, midHip, midKnee);
  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);

  let phase = "neutral";
  if (hipAngle <= 90) {
    phase = "flexion";
  } else if (hipAngle < 160 && state.lastPhase === "flexion") {
    phase = "flexion";
  }

  if (kneeAngle < 120) {
    errors.push(createError("knee_bend", "Keep legs straight", "warning", "knees"));
  }

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors,
    feedback: errors.length === 0 && phase === "flexion" ? "Good stretch" : undefined,
    isCorrect: errors.length === 0,
    repIncremented: state.lastPhase === "flexion" && phase === "neutral",
    confidence: coreConfidence(landmarks),
  };
}

export function analyzeStandingLumbarExtension(
  landmarks: Landmark[],
  _thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const errors: FormError[] = [];
  addOrientationError(errors, checkOrientation(landmarks, "side"));

  const midShoulder = midpoint(
    landmarks[LANDMARKS.leftShoulder],
    landmarks[LANDMARKS.rightShoulder]
  );
  const midHip = midpoint(landmarks[LANDMARKS.leftHip], landmarks[LANDMARKS.rightHip]);
  const midKnee = midpoint(landmarks[LANDMARKS.leftKnee], landmarks[LANDMARKS.rightKnee]);
  const midAnkle = midpoint(landmarks[LANDMARKS.leftAnkle], landmarks[LANDMARKS.rightAnkle]);

  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);
  const spineDepth = Math.abs(midShoulder.z - midHip.z);

  const isCalibrating = state.baselineSpineDepth.length < 60;
  if (isCalibrating) {
    state.baselineSpineDepth.push(spineDepth);
  }

  const baseline =
    state.baselineSpineDepth.length > 0
      ? state.baselineSpineDepth.reduce((sum, val) => sum + val, 0) /
        state.baselineSpineDepth.length
      : spineDepth;

  const depthChange = spineDepth - baseline;

  let phase = "neutral";
  if (depthChange <= -0.05) {
    phase = "extension";
  }

  if (kneeAngle < 135) {
    errors.push(createError("knee_bend", "Keep knees straight", "warning", "knees"));
  }

  let feedback: string | undefined;
  if (isCalibrating) {
    feedback = "Wait for a second, calibrating to your normal stance";
  } else if (phase === "extension") {
    feedback = "Hold extension";
  }

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented: state.lastPhase === "extension" && phase === "neutral",
    confidence: coreConfidence(landmarks),
  };
}

export function analyzeStandingLumbarSideBend(
  landmarks: Landmark[],
  _thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const errors: FormError[] = [];
  addOrientationError(errors, checkOrientation(landmarks, "front"));

  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];

  const dy = rightShoulder.y - leftShoulder.y;
  const dx = rightShoulder.x - leftShoulder.x;
  const shoulderTilt = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

  const bendingSide = dy > 0.02 ? "right" : dy < -0.02 ? "left" : "neutral";

  let phase = "neutral";
  if (shoulderTilt <= 168 && bendingSide !== "neutral") {
    phase = bendingSide === "left" ? "bend_left" : "bend_right";
  } else if (state.lastPhase.startsWith("bend_") && shoulderTilt >= 172) {
    phase = "neutral";
  } else if (state.lastPhase.startsWith("bend_")) {
    phase = state.lastPhase;
  }

  let repIncremented = false;
  let feedback = phase.startsWith("bend_") ? "Good stretch" : undefined;

  if (state.lastPhase.startsWith("bend_") && phase === "neutral") {
    if (state.lastPhase === "bend_left") {
      state.sideBendState.leftDone = true;
    } else if (state.lastPhase === "bend_right") {
      state.sideBendState.rightDone = true;
    }

    const { leftDone, rightDone } = state.sideBendState;
    if (leftDone && rightDone) {
      repIncremented = true;
      state.sideBendState.leftDone = false;
      state.sideBendState.rightDone = false;
      feedback = "Good job! Both sides done";
    } else if (leftDone) {
      feedback = "Great, now repeat for the right side";
    } else if (rightDone) {
      feedback = "Great, now repeat for the left side";
    }
  }

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: coreConfidence(landmarks),
  };
}
