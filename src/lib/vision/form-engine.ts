import type { FormError } from "@/types";
import type { Exercise } from "@/lib/exercises/types";
import type { Landmark } from "@/types/vision";

interface FormEngineResult {
  phase: string;
  formScore: number;
  errors: FormError[];
  feedback?: string;
  isCorrect: boolean;
  repIncremented: boolean;
  confidence: number;
}

interface EngineState {
  lastPhase: string;
  lastRepPhase: string;
  lastExtendedSide: "left" | "right" | null;
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

function analyzeStandingLumbarFlexion(
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
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

  const hipAngle = angleBetween3D(midShoulder, midHip, midAnkle);
  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);
  const spineDepth = midShoulder.z - midHip.z;

  const flexionPhaseAngle = thresholds.flexion_phase_angle ?? 150;
  const flexionTargetAngle = thresholds.flexion_target_angle ?? 120;
  const flexionTolerance = thresholds.flexion_angle_tolerance ?? 25;
  const neutralAngle = thresholds.neutral_angle ?? 165;
  const kneeAngleMin = thresholds.knee_angle_min ?? 150;
  const flexionDepthThreshold = thresholds.flexion_spine_depth ?? -0.05;

  let phase = "neutral";
  if (hipAngle <= flexionPhaseAngle || spineDepth <= flexionDepthThreshold) phase = "flexion";
  if (state.lastPhase === "flexion" && hipAngle >= neutralAngle) phase = "return";

  const repIncremented = state.lastPhase === "flexion" && phase === "return";

  const hipScore = scoreFromTargetAngle(hipAngle, flexionTargetAngle, flexionTolerance);
  const kneeScore = scoreFromKneeAngle(kneeAngle, kneeAngleMin);
  const formScore = Math.round(hipScore * 0.7 + kneeScore * 0.3);
  const errors: FormError[] = [];

  if (kneeAngle < kneeAngleMin) {
    errors.push({
      type: "knee_bend",
      message: "Keep a soft bend in the knees without squatting",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "knees",
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

function analyzeStandingLumbarExtension(
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
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

  const hipAngle = angleBetween3D(midShoulder, midHip, midAnkle);
  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);
  const spineDepth = midShoulder.z - midHip.z;

  const extensionDepthThreshold = thresholds.extension_spine_depth ?? 0.04;
  const extensionTargetAngle = thresholds.extension_target_angle ?? 175;
  const extensionTolerance = thresholds.extension_angle_tolerance ?? 10;
  const neutralAngle = thresholds.neutral_angle ?? 165;
  const kneeAngleMin = thresholds.knee_angle_min ?? 150;

  let phase = "neutral";
  if (spineDepth >= extensionDepthThreshold) phase = "extension";
  if (state.lastPhase === "extension" && hipAngle <= neutralAngle) phase = "return";

  const repIncremented = state.lastPhase === "extension" && phase === "return";

  const hipScore = scoreFromTargetAngle(hipAngle, extensionTargetAngle, extensionTolerance);
  const kneeScore = scoreFromKneeAngle(kneeAngle, kneeAngleMin);
  const formScore = Math.round(hipScore * 0.7 + kneeScore * 0.3);
  const errors: FormError[] = [];

  if (kneeAngle < kneeAngleMin) {
    errors.push({
      type: "knee_bend",
      message: "Keep knees softly straight as you extend",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "knees",
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

function analyzeStandingLumbarSideBend(
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
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

  const lateralAngle = angleBetween(midShoulder, midHip, midAnkle);
  const kneeAngle = angleBetween3D(midHip, midKnee, midAnkle);

  const bendPhaseAngle = thresholds.side_bend_phase_angle ?? 165;
  const bendTargetAngle = thresholds.side_bend_target_angle ?? 150;
  const bendTolerance = thresholds.side_bend_angle_tolerance ?? 20;
  const neutralAngle = thresholds.neutral_angle ?? 175;
  const kneeAngleMin = thresholds.knee_angle_min ?? 150;

  let phase = "neutral";
  if (lateralAngle <= bendPhaseAngle) phase = "side_bend";
  if (state.lastPhase === "side_bend" && lateralAngle >= neutralAngle) phase = "return";

  const repIncremented = state.lastPhase === "side_bend" && phase === "return";

  const bendScore = scoreFromTargetAngle(lateralAngle, bendTargetAngle, bendTolerance);
  const kneeScore = scoreFromKneeAngle(kneeAngle, kneeAngleMin);
  const formScore = Math.round(bendScore * 0.7 + kneeScore * 0.3);
  const errors: FormError[] = [];

  if (kneeAngle < kneeAngleMin) {
    errors.push({
      type: "knee_bend",
      message: "Keep knees softly straight during the bend",
      severity: "warning",
      timestamp: Date.now(),
      bodyPart: "knees",
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

  // Midpoints for analysis
  const midEar = midpoint(leftEar, rightEar);
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const midKnee = midpoint(leftKnee, rightKnee);
  const midAnkle = midpoint(leftAnkle, rightAnkle);

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

  const formScore = baseFormScore(landmarks);
  const errors: FormError[] = [];
  let feedback = "";

  // Feedback Logic
  if (kneeAngle < 140) {
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
    ]),
  };
}

export function createFormEngine(exercise: Exercise) {
  const state: EngineState = {
    lastPhase: "neutral",
    lastRepPhase: "",
    lastExtendedSide: null,
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
    if (result.repIncremented) {
      state.lastRepPhase = result.phase;
    }

    return result;
  };
}
