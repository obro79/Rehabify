import type { FormError } from "@/types";
import type { Exercise } from "@/lib/exercises/types";
import type { Landmark } from "@/types/vision";
import { analyzeSquat, createSquatState, type SquatState } from "./exercises/squat";

interface FormEngineResult {
  phase: string;
  formScore: number;
  errors: FormError[];
  feedback?: string;
  isCorrect: boolean;
  repIncremented: boolean;
  confidence: number;
  debug?: {
    // Squat fields
    kneeAngle?: number;
    trunkLean?: number;
    kneeForward?: number;
    descentSpeed?: number;
    minDepth?: number;

    // Lumbar extension fields
    hipAngle?: number;
    spineDepth?: number;
    depthChange?: number;
    baseline?: number;
    baselineSamples?: number;

    // Side bend fields
    shoulderTilt?: number;
    shoulderTiltAngle?: number;
    hipTilt?: number;
    bendingSide?: string;

    // Lunge fields
    leftThighAngle?: number;
    rightThighAngle?: number;
    bestDepthAngle?: number;
    shinAngle?: number;

    // Rotation fields
    torsion?: number;
    shoulderYaw?: number;
    hipYaw?: number;

    phase?: string;
    queuedErrors: string[];
  };
}

interface EngineState {
  lastPhase: string;
  lastRepPhase: string;
  lastExtendedSide: "left" | "right" | null;
  // Exercise-specific states
  squatState: SquatState;
  // Baseline tracking for lumbar extension
  baselineSpineDepth: number[];
  // Side bend tracking
  sideBendState: {
    leftDone: boolean;
    rightDone: boolean;
  };
  // Lunge rotation tracking
  lungeRotationState: {
    inLunge: boolean;
    rotatedLeft: boolean;
    rotatedRight: boolean;
  };
}

const LANDMARKS = {
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: (a.visibility + b.visibility) / 2,
  };
}

function distance2D(a: Landmark, b: Landmark) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleBetween(a: Landmark, b: Landmark, c: Landmark) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.sqrt(abx * abx + aby * aby) * Math.sqrt(cbx * cbx + cby * cby);
  if (mag === 0) return 0;
  const cos = clamp(dot / mag, -1, 1);
  return Math.acos(cos) * (180 / Math.PI);
}

function angleBetween3D(a: Landmark, b: Landmark, c: Landmark) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const abz = a.z - b.z;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const cbz = c.z - b.z;
  const dot = abx * cbx + aby * cby + abz * cbz;
  const mag =
    Math.sqrt(abx * abx + aby * aby + abz * abz) *
    Math.sqrt(cbx * cbx + cby * cby + cbz * cbz);
  if (mag === 0) return 0;
  const cos = clamp(dot / mag, -1, 1);
  return Math.acos(cos) * (180 / Math.PI);
}

function averageVisibility(landmarks: Landmark[], indices: number[]) {
  const total = indices.reduce((sum, index) => sum + (landmarks[index]?.visibility ?? 0), 0);
  return total / indices.length;
}

function baseFormScore(landmarks: Landmark[]) {
  const visibility = averageVisibility(landmarks, [
    LANDMARKS.leftShoulder,
    LANDMARKS.rightShoulder,
    LANDMARKS.leftHip,
    LANDMARKS.rightHip,
    LANDMARKS.leftKnee,
    LANDMARKS.rightKnee,
  ]);
  return clamp(Math.round(visibility * 100), 0, 100);
}

function scoreFromTargetAngle(angle: number, target: number, tolerance: number) {
  if (tolerance <= 0) return 0;
  const delta = Math.abs(angle - target);
  const ratio = clamp(1 - delta / tolerance, 0, 1);
  return Math.round(ratio * 100);
}

function scoreFromKneeAngle(angle: number, minAngle: number) {
  if (minAngle <= 0) return 0;
  const ratio = clamp(angle / minAngle, 0, 1);
  return Math.round(ratio * 100);
}

function checkOrientation(landmarks: Landmark[], desired: "front" | "side"): { isCorrect: boolean; feedback?: string } {
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  
  const shoulderWidth = distance2D(leftShoulder, rightShoulder);
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const torsoHeight = distance2D(midShoulder, midHip) || 1; // Prevent div by zero
  
  // Ratio of shoulder width to torso height
  // Front view: Shoulders are wide (~0.8 - 1.2 ratio typically)
  // Side view: Shoulders are narrow (< 0.5 ratio)
  const ratio = shoulderWidth / torsoHeight;
  
  if (desired === "side") {
    // Expect narrow shoulders
    if (ratio > 0.6) return { isCorrect: false, feedback: "Turn to face the side" };
  } else {
    // Expect wide shoulders
    if (ratio < 0.5) return { isCorrect: false, feedback: "Turn to face forward" };
  }
  return { isCorrect: true };
}

function analyzeCatCamel(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);

  const spineCurve = midShoulder.y - midHip.y;
  const hipAngle = angleBetween(midShoulder, midHip, midKnee);

  const catThreshold = thresholds.cat_spine_curve ?? 0.1;
  const camelThreshold = thresholds.camel_spine_curve ?? -0.1;

  let phase = "neutral";
  if (spineCurve >= catThreshold) phase = "cat";
  if (spineCurve <= camelThreshold) phase = "camel";

  const repIncremented = state.lastPhase === "cat" && phase === "camel";

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];

  if (hipAngle < 70) {
    errors.push({
      type: "hip_alignment",
      message: "Keep hips stacked over knees",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "hips",
    });
  }

  return {
    phase,
    formScore,
    errors,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
  };
}

function analyzeCobra(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftElbow = landmarks[LANDMARKS.leftElbow];
  const rightElbow = landmarks[LANDMARKS.rightElbow];
  const leftWrist = landmarks[LANDMARKS.leftWrist];
  const rightWrist = landmarks[LANDMARKS.rightWrist];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);

  const chestLift = midHip.y - midShoulder.y;
  const minLift = thresholds.min_chest_lift ?? 0.1;
  const maxLift = thresholds.max_chest_lift ?? 0.35;

  let phase = "prone";
  if (chestLift > minLift) phase = "lift";
  if (chestLift > maxLift) phase = "hold";
  if (state.lastPhase === "hold" && chestLift <= minLift) phase = "lower";

  const repIncremented = state.lastPhase === "hold" && phase === "lower";
  const elbowAngleLeft = angleBetween(leftShoulder, leftElbow, leftWrist);
  const elbowAngleRight = angleBetween(rightShoulder, rightElbow, rightWrist);
  const elbowAngle = Math.min(elbowAngleLeft, elbowAngleRight);

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];

  if (chestLift > maxLift + 0.08) {
    errors.push({
      type: "overextension",
      message: "Lift only to a comfortable height",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "spine",
    });
  }
  if (elbowAngle < 120) {
    errors.push({
      type: "elbow_lock",
      message: "Soften the elbows slightly",
      severity: "info",
      timestamp: Date.now(),
      bodyPart: "elbows",
    });
  }

  return {
    phase,
    formScore,
    errors,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
  };
}

export function analyzeStandingLumbarFlexion(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const errors: FormError[] = [];
  
  // Check Orientation first
  const orientation = checkOrientation(landmarks, "side");
  if (!orientation.isCorrect && orientation.feedback) {
    errors.push({
      type: "orientation",
      message: orientation.feedback,
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "body",
    });
  }

  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

  const hipAngle = angleBetween3D(midShoulder, midHip, midKnee);
  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);

  const flexionPhaseAngle = 90; // Require deeper bend for flexion
  const neutralAngle = 160; // Relaxed return threshold
  const kneeAngleMin = 120; // Allow moderate knee bend - only warn for significant bend

  // Simple phase detection: neutral → flexion → neutral
  let phase = "neutral";

  if (hipAngle <= flexionPhaseAngle) {
    phase = "flexion";
  } else if (hipAngle < neutralAngle && state.lastPhase === "flexion") {
    // Stay in flexion until we cross back to neutral threshold
    phase = "flexion";
  }
  // else: hipAngle >= neutralAngle → phase = "neutral"

  // Rep counts when going from flexion back to neutral
  const repIncremented = state.lastPhase === "flexion" && phase === "neutral";

  if (state.lastPhase !== phase) {
    console.log(`[LUMBAR_FLEX] ${state.lastPhase} → ${phase} | hipAngle=${hipAngle.toFixed(0)}° kneeAngle=${kneeAngle.toFixed(0)}°`);
  }

  if (repIncremented) {
    console.log(`[LUMBAR_FLEX] ✓ REP COUNTED`);
  }

  const formScore = baseFormScore(landmarks);

  if (kneeAngle < kneeAngleMin) {
    errors.push({
      type: "knee_bend",
      message: "Keep legs straight",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "knees",
    });
  }

  return {
    phase,
    formScore,
    errors,
    feedback: errors.length === 0 && phase === "flexion" ? "Good stretch" : undefined,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
  };
}

function analyzeStandingLumbarExtension(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const errors: FormError[] = [];
  
  // Check Orientation
  const orientation = checkOrientation(landmarks, "side");
  if (!orientation.isCorrect && orientation.feedback) {
    errors.push({
      type: "orientation",
      message: orientation.feedback,
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "body",
    });
  }

  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

  const hipAngle = angleBetween3D(midShoulder, midHip, midAnkle);
  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);
  
  // Extension check: Shoulder should be behind Hip
  // In side view (assume moving right?), x coords change.
  // Using angle: hipAngle > 180? No, angleBetween is usually 0-180.
  // Use Trunk Lean.
  const dy = midHip.y - midShoulder.y;
  const dx = midHip.x - midShoulder.x;
  const trunkAngle = Math.atan2(dx, dy) * (180 / Math.PI); 
  // Upright = 0. Leaning back depends on orientation.
  // Absolute lean > 10 degrees BACK?
  // We can't know "back" easily without tracking sequence or checking heel-toe.
  // Assume extension means hipAngle < 180 but "open" front?
  // Actually angleBetween3D(shoulder, hip, ankle) will decrease if extending (hyperextending).
  // Standard standing is ~170-180.
  // Extension: < 170? No, that's flexion too?
  // Angle logic:
  // Flexion: Shoulder moves forward -> Angle < 180.
  // Extension: Shoulder moves backward -> Angle < 180 (on other side).
  // Need Signed Angle or check Z/X relative positions.
  
  // Simple heuristic: If hipAngle < 170 AND shoulder is behind hip (x check relative to orientation)
  // Or just check "spineDepth" (z) if robust.
  const spineDepth = midShoulder.z - midHip.z;
  const absSpineDepth = Math.abs(spineDepth);

  // Build baseline over first 60 frames (2 seconds at 30fps)
  const isCalibrating = state.baselineSpineDepth.length < 60;
  if (isCalibrating) {
    state.baselineSpineDepth.push(absSpineDepth);
  }

  // Calculate baseline average
  const baseline = state.baselineSpineDepth.length > 0
    ? state.baselineSpineDepth.reduce((sum, val) => sum + val, 0) / state.baselineSpineDepth.length
    : absSpineDepth;

  // Detect extension as a DECREASE in spine depth from baseline
  // When extending backward, the spine straightens and depth decreases
  const depthChange = absSpineDepth - baseline;
  const extensionThreshold = -0.05; // Depth must decrease by 0.15 from baseline
  const returnThreshold = -0.02; // Return when depth is within 0.05 of baseline

  let phase = "neutral";
  // Extension = depth DECREASES from baseline (spine straightens)
  if (depthChange <= extensionThreshold) {
    phase = "extension";
  }

  // Count rep when returning from extension to neutral
  const repIncremented = state.lastPhase === "extension" && phase === "neutral";

  if (state.lastPhase !== phase) {
    console.log(`[LUMBAR_EXT] 🔄 PHASE CHANGE: ${state.lastPhase} → ${phase}`);
  }

  const formScore = baseFormScore(landmarks);

  if (kneeAngle < 135) {
    errors.push({
      type: "knee_bend",
      message: "Keep knees straight",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "knees",
    });
  }

  if (repIncremented && errors.length > 0) {
    console.log(`[LUMBAR_EXT] 🚫 REP BLOCKED - Errors:`, errors.map(e => e.type));
  }

  if (repIncremented && errors.length === 0) {
    console.log(`[LUMBAR_EXT] ✅ REP COUNTED`);
  }

  // Determine feedback message
  let feedback: string | undefined;
  if (isCalibrating) {
    feedback = "Wait for a second, calibrating to your normal stance";
  } else if (phase === "extension") {
    feedback = "Hold extension";
  }

  return {
    phase,
    formScore,
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
    // debug: {
    //   hipAngle,
    //   kneeAngle,
    //   spineDepth: absSpineDepth,
    //   depthChange,
    //   baseline,
    //   baselineSamples: state.baselineSpineDepth.length,
    //   phase,
    //   queuedErrors: errors.map(e => e.type),
    // }
  };
}

function analyzeStandingLumbarSideBend(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const errors: FormError[] = [];
  
  // Check Orientation
  const orientation = checkOrientation(landmarks, "front");
  if (!orientation.isCorrect && orientation.feedback) {
    errors.push({
      type: "orientation",
      message: orientation.feedback,
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "body",
    });
  }

  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);

  // Calculate angle of shoulder line relative to horizontal
  // 0 = horizontal.
  const dy = rightShoulder.y - leftShoulder.y;
  const dx = rightShoulder.x - leftShoulder.x;
  const shoulderTiltAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  const shoulderTilt = Math.abs(shoulderTiltAngle);

  // Determine which side is bending (positive dy = right shoulder lower = bending right)
  // We use a small threshold (0.02) to avoid noise when near neutral
  const bendingSide = dy > 0.02 ? "right" : dy < -0.02 ? "left" : "neutral";

  // Calculate hip tilt to ensure bending is happening from the torso
  const hipDy = rightHip.y - leftHip.y;
  const hipDx = rightHip.x - leftHip.x;
  const hipTilt = Math.abs(Math.atan2(hipDy, hipDx) * (180 / Math.PI));

  // Threshold: shoulder angle around 165 degrees indicates good stretch
  // (measured from horizontal, ~15 degree tilt)
  const bendThreshold = 168;
  const returnThreshold = 172; // Closer to neutral (180 degrees = horizontal)

  let phase = "neutral";

  // Check if shoulder tilt is close to 165 degrees (good stretch position)
  if (shoulderTilt <= bendThreshold && bendingSide !== "neutral") {
    phase = bendingSide === "left" ? "bend_left" : "bend_right";
  } else if (state.lastPhase.startsWith("bend_") && shoulderTilt >= returnThreshold) {
    phase = "neutral";
  } else if (state.lastPhase.startsWith("bend_")) {
    // Hold the bend
    phase = state.lastPhase;
  }

  // Count rep when returning to neutral from a bend
  let repIncremented = false;
  let feedback = phase.startsWith("bend_") ? "Good stretch" : undefined;

  if (state.lastPhase.startsWith("bend_") && phase === "neutral") {
    if (state.lastPhase === "bend_left") {
      state.sideBendState.leftDone = true;
    } else if (state.lastPhase === "bend_right") {
      state.sideBendState.rightDone = true;
    }

    if (state.sideBendState.leftDone && state.sideBendState.rightDone) {
      repIncremented = true;
      state.sideBendState.leftDone = false;
      state.sideBendState.rightDone = false;
      feedback = "Good job! Both sides done";
    } else {
      if (state.sideBendState.leftDone) feedback = "Great, now repeat for the right side";
      if (state.sideBendState.rightDone) feedback = "Great, now repeat for the left side";
    }
  }

  if (state.lastPhase !== phase) {
    console.log(`[SIDE_BEND] 🔄 PHASE CHANGE: ${state.lastPhase} → ${phase} | tilt=${shoulderTilt.toFixed(1)}°`);
  }

  if (repIncremented) {
    console.log(`[SIDE_BEND] ✅ REP COUNTED (${state.lastPhase} → ${phase})`);
  }

  const formScore = baseFormScore(landmarks);

  return {
    phase,
    formScore,
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
    // debug: {
    //   shoulderTilt,
    //   shoulderTiltAngle,
    //   hipTilt,
    //   bendingSide,
    //   phase,
    //   queuedErrors: errors.map(e => e.type),
    // }
  };
}

function analyzeDeadBug(
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

  const leftLegExtension = distance2D(leftHip, leftAnkle);
  const rightLegExtension = distance2D(rightHip, rightAnkle);
  const leftArmExtension = distance2D(leftShoulder, leftWrist);
  const rightArmExtension = distance2D(rightShoulder, rightWrist);

  const extensionThreshold = thresholds.full_extension_threshold ?? 0.85;
  const rightExtended = rightLegExtension > extensionThreshold && leftArmExtension > extensionThreshold;
  const leftExtended = leftLegExtension > extensionThreshold && rightArmExtension > extensionThreshold;

  let phase = "start";
  if (rightExtended) phase = "extend_right";
  if (leftExtended) phase = "extend_left";
  if (state.lastPhase.startsWith("extend") && !(rightExtended || leftExtended)) {
    phase = "return";
  }

  const repIncremented =
    state.lastPhase.startsWith("extend") && phase === "return" && state.lastRepPhase !== phase;

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];

  if (rightExtended) {
    state.lastExtendedSide = "right";
  } else if (leftExtended) {
    state.lastExtendedSide = "left";
  }

  return {
    phase,
    formScore,
    errors,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
  };
}

function analyzeRDL(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftEar = landmarks[LANDMARKS.leftEar];
  const rightEar = landmarks[LANDMARKS.rightEar];
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];
  const leftWrist = landmarks[LANDMARKS.leftWrist];
  const rightWrist = landmarks[LANDMARKS.rightWrist];

  // Midpoints for analysis
  const midEar = midpoint(leftEar, rightEar);
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);
  const midWrist = midpoint(leftWrist, rightWrist);

  // 1. Knee Angle (Hip-Knee-Ankle)
  // We want a "soft bend" (approx 150-170 degrees), not locked (180) and not squatting (<140)
  const kneeAngle = angleBetween(midHip, midKnee, midAnkle);

  // 2. Neck/Head Alignment (Ear-Shoulder-Hip)
  // Should be roughly 180 (straight line)
  const neckAngle = angleBetween(midEar, midShoulder, midHip);

  // 3. Trunk Lean (Vertical vs Shoulder-Hip)
  // Vertical is 0 degrees (upright). Hinging increases this angle.
  // Calculate angle of torso relative to Y-axis
  const dy = midHip.y - midShoulder.y; // Positive if standing upright (hip below shoulder)
  const dx = midHip.x - midShoulder.x;
  // Angle in degrees from vertical (0 = upright, 90 = horizontal)
  const trunkLean = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));

  // 4. Hip Shift (Horizontal distance between Hip and Ankle)
  // Essential for RDL: Hips must move BACK as torso moves DOWN.
  const legLength = distance2D(midHip, midAnkle) || 1;
  const hipShift = Math.abs(midHip.x - midAnkle.x);
  const normalizedShift = hipShift / legLength;

  // 5. Bar Path (Horizontal distance between Wrist and Knee/Shin)
  // Weights should stay close to legs.
  const barDist = Math.abs(midWrist.x - midKnee.x);
  const normalizedBarDist = barDist / legLength;

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];
  let feedback = "";

  // Feedback Logic
  if (kneeAngle < 115) {
    errors.push({
      type: "knee_bend",
      message: "Too much knee bend - hinge at hips",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "knees",
    });
  } else if (kneeAngle > 175) {
     errors.push({
      type: "knee_lock",
      message: "Unlock your knees slightly",
      severity: "info",
      timestamp: Date.now(),
      bodyPart: "knees",
    });
  }

  if (neckAngle < 150 || neckAngle > 210) {
    errors.push({
      type: "neck_alignment",
      message: "Keep head neutral with spine",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "head",
    });
  }

  // Detect Rounding / Poor Hinge
  // If leaning forward but hips haven't shifted back, user is likely rounding the spine.
  if (trunkLean > 30 && normalizedShift < 0.15) {
    errors.push({
      type: "poor_hinge",
      message: "Push hips back to flatten spine",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "hips",
    });
  }

  // Detect Bar Drift
  // If leaning and bar is far from legs, it increases spinal load/rounding risk.
  if (trunkLean > 30 && normalizedBarDist > 0.2) {
    errors.push({
      type: "bar_drift",
      message: "Keep weights close to legs",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "arms",
    });
  }

  // If major form points are okay, give positive reinforcement on depth
  if (errors.length === 0) {
    if (trunkLean > 45) {
      feedback = "Excellent depth! Keep back straight.";
    } else if (trunkLean > 20) {
      feedback = "Good hinge, go lower if comfortable.";
    } else {
      feedback = "Hinge forward from hips.";
    }
  }

  // Phase detection (simple hinge logic)
  let phase = "standing";
  if (trunkLean > 20) phase = "hinging";
  if (trunkLean > 60) phase = "bottom";

  const repIncremented = state.lastPhase === "hinging" && phase === "standing";

  return {
    phase,
    formScore,
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
  };
}

function analyzeLunge(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftWrist = landmarks[LANDMARKS.leftWrist];
  const rightWrist = landmarks[LANDMARKS.rightWrist];

  // Midpoints
  const midHip = midpoint(leftHip, rightHip);
  const midShoulder = midpoint(leftShoulder, rightShoulder);

  // 1. Detect Lunge Position
  // Stride width (x-axis spread)
  const strideWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  
  // Height check: Hips should be lower than standing.
  // We can approximate by checking knee angles.
  const leftKneeAngle = angleBetween(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = angleBetween(rightHip, rightKnee, rightAnkle);
  const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

  // Lunge Thresholds
  const isInLunge = minKneeAngle < 130 && strideWidth > 0.3; // Normalized stride width
  const isStanding = minKneeAngle > 150; // Strict threshold for resetting (hysteresis)

  let phase = "standing";
  let feedback = "Step forward into a lunge";

  // State machine: standing -> lunge_hold -> standing (rep)
  
  if (isInLunge) {
    phase = "lunge_hold";
    feedback = "Good lunge. Push back to start";
  } else if (state.lastPhase === "lunge_hold" && !isStanding) {
    // HYSTERESIS: If we were holding lunge and haven't fully stood up yet (knee angle 130-150),
    // stay in lunge_hold state to prevent flickering/double counting.
    phase = "lunge_hold";
    feedback = "Push back to start";
  } else {
    // Fully standing or currently standing
    phase = "standing";
  }

  // Count Rep: Transition from lunge_hold back to standing
  const repIncremented = state.lastPhase === "lunge_hold" && phase === "standing";

  if (repIncremented) {
      feedback = "Rep complete!";
  }

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];
  
  // Calculate form metrics (Always calculate for debug visibility)
  // 1. Trunk Lean
  const dy = midHip.y - midShoulder.y;
  const dx = midHip.x - midShoulder.x;
  const trunkLean = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));

  // 2. Thigh Angles & Depth
  const leftThighDx = Math.abs(leftHip.x - leftKnee.x);
  const leftThighDy = Math.abs(leftHip.y - leftKnee.y);
  const leftThighAngle = Math.atan2(leftThighDy, leftThighDx) * (180 / Math.PI);

  const rightThighDx = Math.abs(rightHip.x - rightKnee.x);
  const rightThighDy = Math.abs(rightHip.y - rightKnee.y);
  const rightThighAngle = Math.atan2(rightThighDy, rightThighDx) * (180 / Math.PI);

  const bestDepthAngle = Math.min(leftThighAngle, rightThighAngle);
  
  // Determine front leg (flatter thigh = front leg assumption for depth)
  const isLeftFront = leftThighAngle < rightThighAngle;
  const frontKnee = isLeftFront ? leftKnee : rightKnee;
  const frontAnkle = isLeftFront ? leftAnkle : rightAnkle;
  const frontHip = isLeftFront ? leftHip : rightHip;
  
  // 3. Shin Angle
  const shinDx = Math.abs(frontKnee.x - frontAnkle.x);
  const shinDy = Math.abs(frontKnee.y - frontAnkle.y);
  const shinAngle = Math.atan2(shinDx, shinDy) * (180 / Math.PI);

  // STRICT FORM CHECKS (Only apply during lunge hold)
  if (isInLunge) {
      if (trunkLean > 20) {
          errors.push({
              type: "forward_lean",
              message: "Keep chest up",
              severity: "warning",
              timestamp: Date.now(),
              bodyPart: "torso"
          });
      }
      
      // Threshold 15 degrees
      if (bestDepthAngle > 15) { 
           errors.push({
              type: "insufficient_depth",
              message: "Lower hips until thigh is parallel",
              severity: "info",
              timestamp: Date.now(),
              bodyPart: "legs"
          });
      }
      
      if (shinAngle > 20) {
           errors.push({
              type: "knee_forward",
              message: "Keep front knee behind toes",
              severity: "warning",
              timestamp: Date.now(),
              bodyPart: "knee"
          });
      }
      
      // 4. Hands on Legs
      const leftHandKneeDist = Math.min(distance2D(leftWrist, leftKnee), distance2D(leftWrist, rightKnee));
      const rightHandKneeDist = Math.min(distance2D(rightWrist, leftKnee), distance2D(rightWrist, rightKnee));
      
      if (leftHandKneeDist < 0.15 || rightHandKneeDist < 0.15) {
           errors.push({
              type: "hands_on_legs",
              message: "Don't rest hands on legs",
              severity: "warning",
              timestamp: Date.now(),
              bodyPart: "arms"
          });
      }
  }
  
  return {
    phase,
    formScore,
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
    debug: {
        phase,
        leftThighAngle,
        rightThighAngle,
        bestDepthAngle,
        trunkLean,
        shinAngle,
        queuedErrors: errors.map(e => e.type)
    }
  };
}


function analyzeLungeWithRotation(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];

  const midHip = midpoint(leftHip, rightHip);
  const midShoulder = midpoint(leftShoulder, rightShoulder);

  // 1. Detect Lunge Position
  // Check vertical distance between hip and knee (lunge depth)
  // And horizontal spread between feet (stride)
  
  // Stride width (x-axis spread)
  const strideWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  
  // Height check: Hips should be lower than standing.
  // We can approximate by checking knee angles.
  const leftKneeAngle = angleBetween(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = angleBetween(rightHip, rightKnee, rightAnkle);
  const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

  // Lunge Thresholds
  const isInLunge = minKneeAngle < 130 && strideWidth > 0.3; // Normalized stride width

  let phase = "standing";
  let feedback = "Step into a lunge position";

  if (isInLunge) {
    state.lungeRotationState.inLunge = true;
    phase = "lunge_hold";
    feedback = "Good lunge. Now rotate torso Left and Right";
  } else {
    // If we stood up, reset rotation state for next rep
    if (state.lungeRotationState.inLunge) {
       // Reset if we leave lunge
       // state.lungeRotationState.inLunge = false; // Keep it true? No, reset.
    }
    state.lungeRotationState.inLunge = false;
    // Don't reset rotation flags yet if we are finishing a rep?
    // Actually, rep counts when we finish rotations AND stand up? 
    // Or just finish rotations while in lunge?
    // "Check static lunge... then prompt to rotate".
    // Usually you do lunge -> rotate -> rotate -> return.
  }

  // 2. Detect Rotation (Yaw)
  // Calculate shoulder rotation relative to hips
  // Vector for shoulders
  const shoulderDx = rightShoulder.x - leftShoulder.x;
  const shoulderDz = rightShoulder.z - leftShoulder.z;
  const shoulderYaw = Math.atan2(shoulderDz, shoulderDx) * (180 / Math.PI);

  // Vector for hips
  const hipDx = rightHip.x - leftHip.x;
  const hipDz = rightHip.z - leftHip.z;
  const hipYaw = Math.atan2(hipDz, hipDx) * (180 / Math.PI);

  // Relative rotation (torsion)
  let torsion = shoulderYaw - hipYaw;
  
  // Normalize torsion to [-180, 180] to handle wrap-around
  if (torsion > 180) torsion -= 360;
  if (torsion < -180) torsion += 360;

  // Threshold for rotation (reduced to 15 degrees for better detection)
  if (state.lungeRotationState.inLunge) {
    if (torsion < -15) {
      state.lungeRotationState.rotatedRight = true; 
      phase = "rotated_right";
    } else if (torsion > 15) {
      state.lungeRotationState.rotatedLeft = true;
      phase = "rotated_left";
    }
    
    if (state.lungeRotationState.rotatedLeft && state.lungeRotationState.rotatedRight) {
        feedback = "Great! Stand up to finish rep";
        phase = "rotation_done";
    } else if (state.lungeRotationState.rotatedLeft) {
        feedback = "Now rotate Right";
    } else if (state.lungeRotationState.rotatedRight) {
        feedback = "Now rotate Left";
    }
  }

  // Count Rep: Must have lunged, rotated both ways, and returned to standing
  let repIncremented = false;
  if (!isInLunge && state.lungeRotationState.inLunge === false && 
      state.lungeRotationState.rotatedLeft && state.lungeRotationState.rotatedRight) {
      
      repIncremented = true;
      // Reset flags
      state.lungeRotationState.rotatedLeft = false;
      state.lungeRotationState.rotatedRight = false;
      feedback = "Rep complete!";
  }

  // Auto-reset flags if we stand up without finishing (optional, or strict form)
  // For now, let's keep it simple.

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];

  return {
    phase,
    formScore,
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented,
    confidence: averageVisibility(landmarks, [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
    ]),
    debug: {
        phase,
        torsion,
        shoulderYaw,
        hipYaw,
        queuedErrors: []
    }
  };
}


export function createFormEngine(exercise: Exercise) {
  const state: EngineState = {
    lastPhase: "neutral",
    lastRepPhase: "",
    lastExtendedSide: null,
    squatState: createSquatState(),
    baselineSpineDepth: [],
    sideBendState: {
      leftDone: false,
      rightDone: false,
    },
    lungeRotationState: {
      inLunge: false,
      rotatedLeft: false,
      rotatedRight: false,
    },
  };

  return (landmarks: Landmark[]): FormEngineResult => {
    const thresholds = exercise.detection_config?.thresholds ?? {};

    let result: FormEngineResult;
    switch (exercise.slug) {
      case "cat-camel":
      case "cat-cow":
        result = analyzeCatCamel(landmarks, thresholds, state);
        break;
      case "cobra-stretch":
        result = analyzeCobra(landmarks, thresholds, state);
        break;
      case "dead-bug":
        result = analyzeDeadBug(landmarks, thresholds, state);
        break;
      case "standing-lumbar-flexion":
        result = analyzeStandingLumbarFlexion(landmarks, thresholds, state);
        break;
      case "standing-lumbar-extension":
        result = analyzeStandingLumbarExtension(landmarks, thresholds, state);
        break;
      case "standing-lumbar-side-bending":
        result = analyzeStandingLumbarSideBend(landmarks, thresholds, state);
        break;
      case "romanian-deadlift":
        result = analyzeRDL(landmarks, thresholds, state);
        break;
      case "lunge":
        result = analyzeLunge(landmarks, thresholds, state);
        break;
      case "lunge-with-rotation":
        result = analyzeLungeWithRotation(landmarks, thresholds, state);
        break;
      case "bodyweight-squat":
      case "squat":
        result = analyzeSquat(landmarks, thresholds, state.squatState);
        break;
      default:
        // Use ID as fallback if slug doesn't match
        switch (exercise.id) {
            case "cat-camel":
                result = analyzeCatCamel(landmarks, thresholds, state);
                break;
            case "cobra-stretch":
                result = analyzeCobra(landmarks, thresholds, state);
                break;
            case "dead-bug":
                result = analyzeDeadBug(landmarks, thresholds, state);
                break;
            case "standing-lumbar-flexion":
                result = analyzeStandingLumbarFlexion(landmarks, thresholds, state);
                break;
            case "standing-lumbar-extension":
                result = analyzeStandingLumbarExtension(landmarks, thresholds, state);
                break;
            case "standing-lumbar-side-bending":
                result = analyzeStandingLumbarSideBend(landmarks, thresholds, state);
                break;
            case "romanian-deadlift":
                result = analyzeRDL(landmarks, thresholds, state);
                break;
            case "bodyweight-squat":
            case "squat":
                result = analyzeSquat(landmarks, thresholds, state.squatState);
                break;
            default:
                result = {
                    phase: exercise.detection_config?.phases?.[0] ?? "neutral",
                    formScore: baseFormScore(landmarks),
                    errors: [],
                    isCorrect: true,
                    repIncremented: false,
                    confidence: averageVisibility(landmarks, [
                        LANDMARKS.leftShoulder,
                        LANDMARKS.rightShoulder,
                        LANDMARKS.leftHip,
                        LANDMARKS.rightHip,
                    ]),
                };
        }
        break;
    }

    state.lastPhase = result.phase;

    // Block rep counting if there are any warning-severity errors
    const hasWarning = result.errors.some(e => e.severity === "warning");
    if (hasWarning && result.repIncremented) {
      console.log(`[FORM_ENGINE] ⚠ REP BLOCKED due to warnings:`, result.errors.filter(e => e.severity === "warning").map(e => e.message));
      result.repIncremented = false;
    }

    if (result.repIncremented) {
      state.lastRepPhase = result.phase;
    }

    return result;
  };
}