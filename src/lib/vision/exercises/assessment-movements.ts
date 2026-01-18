/**
 * Assessment Movement Analysis
 *
 * Measures range of motion (ROM) for assessment movement tests:
 * - Flexion (forward bend)
 * - Extension (backward bend)
 * - Side bends (lateral flexion)
 */

import type { Landmark } from "@/types/vision";

// MediaPipe landmark indices
const LANDMARKS = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

export interface AssessmentMovementState {
  currentTest: "flexion" | "extension" | "sidebend_left" | "sidebend_right" | "idle";
  maxFlexionAngle: number;
  maxExtensionAngle: number;
  maxSideBendLeftAngle: number;
  maxSideBendRightAngle: number;
  isCapturing: boolean;
}

export interface AssessmentMovementResult {
  trunkAngle: number; // Current trunk angle from vertical
  lateralAngle: number; // Current lateral tilt angle
  isValidPose: boolean;
  confidence: number;
}

/**
 * Create initial state for assessment movement tracking
 */
export function createAssessmentMovementState(): AssessmentMovementState {
  return {
    currentTest: "idle",
    maxFlexionAngle: 0,
    maxExtensionAngle: 0,
    maxSideBendLeftAngle: 0,
    maxSideBendRightAngle: 0,
    isCapturing: false,
  };
}

/**
 * Calculate midpoint between two landmarks
 */
function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: (a.visibility + b.visibility) / 2,
  };
}

/**
 * Calculate angle between three points (in degrees)
 * Returns angle at point B
 */
function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Calculate trunk angle from vertical (sagittal plane)
 * Positive = forward lean (flexion)
 * Negative = backward lean (extension)
 */
function calculateTrunkAngle(landmarks: Landmark[]): number {
  const shoulder = midpoint(
    landmarks[LANDMARKS.leftShoulder],
    landmarks[LANDMARKS.rightShoulder]
  );
  const hip = midpoint(
    landmarks[LANDMARKS.leftHip],
    landmarks[LANDMARKS.rightHip]
  );

  // Calculate angle from vertical
  // In MediaPipe, Y increases downward
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;

  // Angle from vertical (negative dy means shoulder is above hip)
  const angleFromVertical = Math.atan2(dx, -dy) * (180 / Math.PI);

  return angleFromVertical;
}

/**
 * Calculate lateral trunk angle (frontal plane)
 * Positive = leaning right
 * Negative = leaning left
 */
function calculateLateralAngle(landmarks: Landmark[]): number {
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];

  // Calculate shoulder midpoint and hip midpoint
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  // Calculate lateral tilt
  // Positive angle = leaning right, negative = leaning left
  const dx = shoulderMid.x - hipMid.x;
  const dy = shoulderMid.y - hipMid.y;

  // Small dx relative to dy indicates minimal lateral tilt
  const lateralAngle = Math.atan2(dx, -dy) * (180 / Math.PI);

  return lateralAngle;
}

/**
 * Check if pose landmarks have sufficient visibility
 */
function isPoseValid(landmarks: Landmark[]): boolean {
  const requiredLandmarks = [
    LANDMARKS.leftShoulder,
    LANDMARKS.rightShoulder,
    LANDMARKS.leftHip,
    LANDMARKS.rightHip,
  ];

  const avgVisibility =
    requiredLandmarks.reduce(
      (sum, idx) => sum + (landmarks[idx]?.visibility ?? 0),
      0
    ) / requiredLandmarks.length;

  return avgVisibility > 0.5;
}

/**
 * Calculate confidence based on landmark visibility
 */
function calculateConfidence(landmarks: Landmark[]): number {
  const allLandmarks = [
    LANDMARKS.leftShoulder,
    LANDMARKS.rightShoulder,
    LANDMARKS.leftHip,
    LANDMARKS.rightHip,
    LANDMARKS.leftKnee,
    LANDMARKS.rightKnee,
  ];

  const avgVisibility =
    allLandmarks.reduce(
      (sum, idx) => sum + (landmarks[idx]?.visibility ?? 0),
      0
    ) / allLandmarks.length;

  return Math.round(avgVisibility * 100);
}

/**
 * Analyze current frame for assessment movement
 */
export function analyzeAssessmentMovement(
  landmarks: Landmark[],
  state: AssessmentMovementState
): AssessmentMovementResult {
  const isValidPose = isPoseValid(landmarks);
  const confidence = calculateConfidence(landmarks);

  if (!isValidPose) {
    return {
      trunkAngle: 0,
      lateralAngle: 0,
      isValidPose: false,
      confidence,
    };
  }

  const trunkAngle = calculateTrunkAngle(landmarks);
  const lateralAngle = calculateLateralAngle(landmarks);

  return {
    trunkAngle,
    lateralAngle,
    isValidPose: true,
    confidence,
  };
}

/**
 * Update state during movement capture
 * Call this on each frame while test is active
 */
export function updateAssessmentState(
  state: AssessmentMovementState,
  result: AssessmentMovementResult
): AssessmentMovementState {
  if (!state.isCapturing || !result.isValidPose) {
    return state;
  }

  const newState = { ...state };

  switch (state.currentTest) {
    case "flexion":
      // Forward bend - track maximum forward angle
      if (result.trunkAngle > state.maxFlexionAngle) {
        newState.maxFlexionAngle = result.trunkAngle;
      }
      break;

    case "extension":
      // Backward bend - track maximum backward angle (negative trunkAngle)
      const extensionAngle = Math.abs(Math.min(0, result.trunkAngle));
      if (extensionAngle > state.maxExtensionAngle) {
        newState.maxExtensionAngle = extensionAngle;
      }
      break;

    case "sidebend_left":
      // Left side bend - track maximum left lateral angle (negative)
      const leftAngle = Math.abs(Math.min(0, result.lateralAngle));
      if (leftAngle > state.maxSideBendLeftAngle) {
        newState.maxSideBendLeftAngle = leftAngle;
      }
      break;

    case "sidebend_right":
      // Right side bend - track maximum right lateral angle (positive)
      const rightAngle = Math.max(0, result.lateralAngle);
      if (rightAngle > state.maxSideBendRightAngle) {
        newState.maxSideBendRightAngle = rightAngle;
      }
      break;
  }

  return newState;
}

/**
 * Start capturing a specific movement test
 */
export function startMovementTest(
  state: AssessmentMovementState,
  test: "flexion" | "extension" | "sidebend_left" | "sidebend_right"
): AssessmentMovementState {
  return {
    ...state,
    currentTest: test,
    isCapturing: true,
  };
}

/**
 * Stop capturing and return to idle
 */
export function stopMovementTest(
  state: AssessmentMovementState
): AssessmentMovementState {
  return {
    ...state,
    currentTest: "idle",
    isCapturing: false,
  };
}

/**
 * Get ROM results from state
 */
export function getROMResults(state: AssessmentMovementState) {
  return {
    flexion: {
      angle: Math.round(state.maxFlexionAngle),
      // Normal ROM for lumbar flexion is approximately 40-60 degrees
      percentOfNormal: Math.round((state.maxFlexionAngle / 50) * 100),
    },
    extension: {
      angle: Math.round(state.maxExtensionAngle),
      // Normal ROM for lumbar extension is approximately 20-35 degrees
      percentOfNormal: Math.round((state.maxExtensionAngle / 25) * 100),
    },
    sideBendLeft: {
      angle: Math.round(state.maxSideBendLeftAngle),
      // Normal ROM for lateral flexion is approximately 15-20 degrees
      percentOfNormal: Math.round((state.maxSideBendLeftAngle / 20) * 100),
    },
    sideBendRight: {
      angle: Math.round(state.maxSideBendRightAngle),
      percentOfNormal: Math.round((state.maxSideBendRightAngle / 20) * 100),
    },
  };
}

/**
 * Reset all ROM measurements
 */
export function resetROMState(): AssessmentMovementState {
  return createAssessmentMovementState();
}
