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
  leftShoulder: 11,
  rightShoulder: 12,
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
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  // Midpoints for analysis
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

  // 3. Knee position relative to ankle (X axis)
  const kneeForward = midKnee.x - midAnkle.x;

  // 4. Speed detection - hip Y velocity
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
  const maxTrunkLean = thresholds.max_trunk_lean ?? 30;
  const maxKneeForward = thresholds.max_knee_forward ?? 0.12;
  const maxDescentSpeed = thresholds.max_descent_speed ?? 5.0;

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
  // But only if we reached minRepAngle (40°) - otherwise it's just noise
  const isRepTransition = (state.lastPhase === "ascending" || state.lastPhase === "descending") && phase === "standing";
  const reachedMinDepth = state.maxThighAngle >= minRepAngle;
  const repIncremented = isRepTransition && reachedMinDepth;
  const wasShallowRep = state.lastPhase === "descending" && phase === "standing" && reachedMinDepth;

  // Debug logging
  if (state.lastPhase !== phase) {
    console.log(`[SQUAT] ${state.lastPhase} → ${phase} | thigh=${thighAngle.toFixed(0)}° (stand<${standingAngle}, depth≥${minDepthAngle})`);
  }
  if (isRepTransition && !reachedMinDepth) {
    console.log(`[SQUAT] ✗ Ignored (max ${state.maxThighAngle.toFixed(0)}° < ${minRepAngle}° min)`);
  }
  if (repIncremented) {
    console.log(`[SQUAT] ✓ REP COUNTED${wasShallowRep ? " (shallow - not deep enough)" : ""}`);
  }

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

  // Track maximum thigh angle during rep (higher = deeper squat)
  if (phase !== "standing" && thighAngle > state.maxThighAngle) {
    state.maxThighAngle = thighAngle;
  }

  // Record angles for DTW comparison
  if (phase !== "standing") {
    state.repAngles.push(thighAngle);
  }

  // Queue errors during rep
  if (phase !== "standing") {
    if (trunkLean > maxTrunkLean) {
      state.repErrors.add("forward_lean");
    }
    if (kneeForward > maxKneeForward) {
      state.repErrors.add("knee_forward");
    }
  }

  // Check peak speed when transitioning out of descent
  if (state.lastPhase === "descending" && phase !== "descending") {
    if (state.peakDescentSpeed > maxDescentSpeed) {
      state.repErrors.add("speed_too_fast");
      console.log(`[SQUAT] Peak speed: ${state.peakDescentSpeed.toFixed(2)} > ${maxDescentSpeed}`);
    }
  }

  // Depth feedback at bottom
  if (phase === "bottom") {
    feedback = `Depth: ${state.maxThighAngle.toFixed(0)}° - Good!`;
  }

  // Emit errors when rep completes
  if (repIncremented) {
    if (state.maxThighAngle < minDepthAngle) {
      state.repErrors.add("insufficient_depth");
    }

    console.log(`[SQUAT] Rep complete! Max depth: ${state.maxThighAngle.toFixed(0)}° (target: ≥${minDepthAngle}°) | Errors: ${Array.from(state.repErrors).join(", ") || "none"}`);

    if (state.repErrors.has("forward_lean")) {
      errors.push({
        type: "forward_lean",
        message: "Keep your chest up",
        severity: "warning",
        timestamp: Date.now(),
        bodyPart: "torso",
      });
    }
    if (state.repErrors.has("knee_forward")) {
      errors.push({
        type: "knee_forward",
        message: "Sit back more, keep knees over ankles",
        severity: "warning",
        timestamp: Date.now(),
        bodyPart: "knees",
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
    if (state.repErrors.has("insufficient_depth")) {
      errors.push({
        type: "insufficient_depth",
        message: "Try to squat a bit deeper",
        severity: "info",
        timestamp: Date.now(),
        bodyPart: "legs",
      });
    }

    const errorList = Array.from(state.repErrors);
    const depthInfo = `(${state.maxThighAngle.toFixed(0)}°)`;

    // Run DTW comparison against reference movement
    const dtwResult = compareSquatRep(state.repAngles);

    if (errorList.length === 0) {
      feedback = `${dtwResult.feedback} ${dtwResult.score}% ${depthInfo}`;
    } else {
      feedback = `${dtwResult.feedback} ${dtwResult.score}% - ${errorList.map(e => e.replace(/_/g, " ")).join(", ")} ${depthInfo}`;
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
      kneeForward,
      descentSpeed: state.peakDescentSpeed,
      minDepth: state.maxThighAngle,
      queuedErrors: Array.from(state.repErrors),
    },
  };
}
