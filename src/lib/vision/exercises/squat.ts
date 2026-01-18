import type { FormError } from "@/types";
import type { Landmark } from "@/types/vision";
import { compareSquatRep } from "../movement-comparison";

// Re-export types needed by form-engine
export interface SquatDebug {
  kneeAngle: number;
  trunkLean: number;
  kneeForward: number;
  descentSpeed: number;
  minDepth: number;
  queuedErrors: string[];
}

export interface SquatState {
  lastPhase: string;
  lastHipY: number | null;
  lastHipTimestamp: number | null;
  peakDescentSpeed: number;
  repErrors: Set<string>;
  maxThighAngle: number;
  repAngles: number[]; // Thigh angles recorded during rep for DTW comparison
}

export interface SquatResult {
  phase: string;
  formScore: number;
  errors: FormError[];
  feedback?: string;
  isCorrect: boolean;
  repIncremented: boolean;
  confidence: number;
  debug: SquatDebug;
}

const LANDMARKS = {
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

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
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return Math.acos(cos) * (180 / Math.PI);
}

function averageVisibility(landmarks: Landmark[], indices: number[]) {
  const total = indices.reduce((sum, index) => sum + (landmarks[index]?.visibility ?? 0), 0);
  return total / indices.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

export function createSquatState(): SquatState {
  return {
    lastPhase: "standing",
    lastHipY: null,
    lastHipTimestamp: null,
    peakDescentSpeed: 0,
    repErrors: new Set(),
    maxThighAngle: 0,
    repAngles: [],
  };
}

export function analyzeSquat(
  landmarks: Landmark[],
  thresholds: Record<string, number>,
  state: SquatState
): SquatResult {
  const leftEar = landmarks[LANDMARKS.leftEar];
  const rightEar = landmarks[LANDMARKS.rightEar];
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftWrist = landmarks[LANDMARKS.leftWrist];
  const rightWrist = landmarks[LANDMARKS.rightWrist];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  // Midpoints for analysis
  const midEar = midpoint(leftEar, rightEar);
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

  // 1. Thigh Angle from Vertical (primary depth metric)
  // 0° = standing straight, 90° = thigh horizontal (parallel squat)
  const thighDx = midHip.x - midKnee.x;
  const thighDy = midHip.y - midKnee.y;
  const thighAngle = Math.abs(Math.atan2(thighDx, -thighDy) * (180 / Math.PI));

  // 2. Trunk Lean - angle from vertical
  const trunkDy = midHip.y - midShoulder.y;
  const trunkDx = midHip.x - midShoulder.x;
  const trunkLean = Math.abs(Math.atan2(trunkDx, trunkDy) * (180 / Math.PI));

  // 3. Shin Angle - angle of shin from vertical
  const shinDx = midKnee.x - midAnkle.x;
  const shinDy = midKnee.y - midAnkle.y;
  const shinAngle = Math.abs(Math.atan2(shinDx, -shinDy) * (180 / Math.PI));

  // 4. Neck/Head Alignment (Ear-Shoulder-Hip)
  const neckAngle = angleBetween(midEar, midShoulder, midHip);

  // 5. Hands on Legs
  const leftHandKneeDist = Math.min(distance2D(leftWrist, leftKnee), distance2D(leftWrist, rightKnee));
  const rightHandKneeDist = Math.min(distance2D(rightWrist, leftKnee), distance2D(rightWrist, rightKnee));
  const isHandOnLeg = leftHandKneeDist < 0.15 || rightHandKneeDist < 0.15;

  // 6. Speed detection - hip Y velocity
  const now = Date.now();
  let descentSpeed = 0;
  if (state.lastHipY !== null && state.lastHipTimestamp !== null) {
    const timeDelta = now - state.lastHipTimestamp;
    if (timeDelta > 0 && timeDelta < 200) {
      const hipYDelta = midHip.y - state.lastHipY;
      descentSpeed = hipYDelta / (timeDelta / 1000);

      if (descentSpeed > state.peakDescentSpeed) {
        state.peakDescentSpeed = descentSpeed;
      }
    }
  }
  state.lastHipY = midHip.y;
  state.lastHipTimestamp = now;

  // Thresholds with defaults
  const standingAngle = thresholds.standing_angle ?? 20;
  const minDepthAngle = thresholds.min_depth_angle ?? 70;
  const minRepAngle = thresholds.min_rep_angle ?? 40; // Minimum depth to count as a rep attempt
  const maxTrunkLean = thresholds.max_trunk_lean ?? 60; // Relaxed from 45
  const maxShinAngle = thresholds.max_shin_angle ?? 45; // Relaxed from 25
  const maxDescentSpeed = thresholds.max_descent_speed ?? 10.0; // Relaxed from 5.0
  const minNeckAngle = thresholds.min_neck_angle ?? 120; // Relaxed from 150
  const handsOnLegThreshold = thresholds.hands_on_legs_distance ?? 0.08; // Relaxed from 0.15

  // Phase detection using thigh angle (higher = deeper squat)
  let phase = "standing";

  if (thighAngle >= minDepthAngle) {
    phase = "bottom";
  } else if (thighAngle >= standingAngle) {
    if (state.lastPhase === "bottom" || state.lastPhase === "ascending") {
      phase = "ascending";
    } else {
      phase = "descending";
    }
  }

  // Rep counts when coming back to standing from ascending OR descending (shallow rep)
  const isRepTransition = (state.lastPhase === "ascending" || state.lastPhase === "descending") && phase === "standing";
  const reachedMinDepth = state.maxThighAngle >= minRepAngle;
  const repIncremented = isRepTransition && reachedMinDepth;

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];
  let feedback = "";

  // Reset tracking when starting new rep
  if (phase === "descending" && state.lastPhase === "standing") {
    state.repErrors.clear();
    state.peakDescentSpeed = 0;
    state.maxThighAngle = thighAngle;
    state.repAngles = []; // Reset DTW recording
  }

  // Track maximum thigh angle during rep
  if (phase !== "standing" && thighAngle > state.maxThighAngle) {
    state.maxThighAngle = thighAngle;
  }

  // Record angles for DTW comparison
  if (phase !== "standing") {
    state.repAngles.push(thighAngle);
  }

  // Real-time checks during rep
  if (phase !== "standing") {
    if (trunkLean > maxTrunkLean) {
      state.repErrors.add("forward_lean");
      errors.push({
        type: "forward_lean",
        message: "Keep your chest up",
        severity: "warning",
        timestamp: Date.now(),
        bodyPart: "torso",
      });
    }
    if (shinAngle > maxShinAngle) {
      state.repErrors.add("knee_forward");
      errors.push({
        type: "knee_forward",
        message: "Sit back more, keep knees behind toes",
        severity: "warning",
        timestamp: Date.now(),
        bodyPart: "knees",
      });
    }
    if (neckAngle < minNeckAngle) {
      state.repErrors.add("upper_back_round");
      errors.push({
        type: "upper_back_round",
        message: "Don't round your upper back",
        severity: "warning",
        timestamp: Date.now(),
        bodyPart: "head",
      });
    }
    if (leftHandKneeDist < handsOnLegThreshold || rightHandKneeDist < handsOnLegThreshold) {
      state.repErrors.add("hands_on_legs");
      errors.push({
        type: "hands_on_legs",
        message: "Don't rest your hands on your legs",
        severity: "warning",
        timestamp: Date.now(),
        bodyPart: "arms",
      });
    }
  }

  // Check peak speed when transitioning out of descent
  if (state.lastPhase === "descending" && phase !== "descending") {
    if (state.peakDescentSpeed > maxDescentSpeed) {
      state.repErrors.add("speed_too_fast");
    }
  }

  // Dynamic feedback
  if (phase === "descending" || phase === "ascending") {
    if (state.maxThighAngle < minDepthAngle) {
      feedback = "Squat a bit deeper";
    } else {
      feedback = "Great depth! Now stand up";
    }
  } else if (phase === "bottom") {
    feedback = "Good depth, hold it!";
  } else if (phase === "standing" && state.lastPhase === "ascending") {
    feedback = "Rep complete!";
  }

  // Emit summary errors and run DTW when rep completes
  if (repIncremented) {
    if (state.maxThighAngle < minDepthAngle) {
      state.repErrors.add("insufficient_depth");
      errors.push({
        type: "insufficient_depth",
        message: "Try to squat a bit deeper next time",
        severity: "info",
        timestamp: Date.now(),
        bodyPart: "legs",
      });
    }

    if (state.repErrors.has("speed_too_fast")) {
      errors.push({
        type: "speed_too_fast",
        message: "Slow down, control the descent",
        severity: "info",
        timestamp: Date.now(),
        bodyPart: "overall",
      });
    }

    const errorList = Array.from(state.repErrors);
    const depthInfo = `(${state.maxThighAngle.toFixed(0)}°)`;

    // Run DTW comparison against reference movement
    const dtwResult = compareSquatRep(state.repAngles);

    if (errorList.length === 0) {
      feedback = `${dtwResult.feedback} ${dtwResult.score}% ${depthInfo}`;
    } else {
      // Prioritize depth error in feedback
      if (state.repErrors.has("insufficient_depth")) {
        feedback = `Shallow squat ${depthInfo}. Try to go deeper.`;
      } else {
        feedback = `${dtwResult.feedback} ${dtwResult.score}% - Check your form ${depthInfo}`;
      }
    }
  }

  // Update state for next frame
  state.lastPhase = phase;

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
      LANDMARKS.leftKnee,
      LANDMARKS.rightKnee,
    ]),
    debug: {
      kneeAngle: thighAngle,
      trunkLean,
      kneeForward: shinAngle, // Use shin angle in debug for consistency
      descentSpeed: state.peakDescentSpeed,
      minDepth: state.maxThighAngle,
      queuedErrors: Array.from(state.repErrors),
    },
  };
}


