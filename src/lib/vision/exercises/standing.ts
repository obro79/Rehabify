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
  trunkLeanAngle,
  thighAngleFromVertical,
  shinAngleFromVertical,
} from "../geometry";

export function analyzeRDL(
  landmarks: Landmark[],
  _thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const midEar = midpoint(landmarks[LANDMARKS.leftEar], landmarks[LANDMARKS.rightEar]);
  const midShoulder = midpoint(
    landmarks[LANDMARKS.leftShoulder],
    landmarks[LANDMARKS.rightShoulder]
  );
  const midHip = midpoint(landmarks[LANDMARKS.leftHip], landmarks[LANDMARKS.rightHip]);
  const midKnee = midpoint(landmarks[LANDMARKS.leftKnee], landmarks[LANDMARKS.rightKnee]);
  const midAnkle = midpoint(landmarks[LANDMARKS.leftAnkle], landmarks[LANDMARKS.rightAnkle]);
  const midWrist = midpoint(landmarks[LANDMARKS.leftWrist], landmarks[LANDMARKS.rightWrist]);

  const kneeAngle = angleBetween(midHip, midKnee, midAnkle);
  const neckAngle = angleBetween(midEar, midShoulder, midHip);
  const trunkLean = trunkLeanAngle(midShoulder, midHip);

  const legLength = distance2D(midHip, midAnkle) || 1;
  const normalizedShift = Math.abs(midHip.x - midAnkle.x) / legLength;
  const normalizedBarDist = Math.abs(midWrist.x - midKnee.x) / legLength;

  const errors: FormError[] = [];
  let feedback = "";

  if (kneeAngle < 115) {
    errors.push(createError("knee_bend", "Too much knee bend - hinge at hips", "warning", "knees"));
  } else if (kneeAngle > 175) {
    errors.push(createError("knee_lock", "Unlock your knees slightly", "info", "knees"));
  }

  if (neckAngle < 150 || neckAngle > 210) {
    errors.push(createError("neck_alignment", "Keep head neutral with spine", "warning", "head"));
  }

  if (trunkLean > 30 && normalizedShift < 0.15) {
    errors.push(createError("poor_hinge", "Push hips back to flatten spine", "warning", "hips"));
  }

  if (trunkLean > 30 && normalizedBarDist > 0.2) {
    errors.push(createError("bar_drift", "Keep weights close to legs", "warning", "arms"));
  }

  if (errors.length === 0) {
    if (trunkLean > 45) {
      feedback = "Excellent depth! Keep back straight.";
    } else if (trunkLean > 20) {
      feedback = "Good hinge, go lower if comfortable.";
    } else {
      feedback = "Hinge forward from hips.";
    }
  }

  let phase = "standing";
  if (trunkLean > 20) phase = "hinging";
  if (trunkLean > 60) phase = "bottom";

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors,
    feedback,
    isCorrect: errors.length === 0,
    repIncremented: state.lastPhase === "hinging" && phase === "standing",
    confidence: coreConfidence(landmarks),
  };
}

export function analyzeLunge(
  landmarks: Landmark[],
  _thresholds: Record<string, number>,
  state: EngineState
): FormEngineResult {
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];
  const leftKnee = landmarks[LANDMARKS.leftKnee];
  const rightKnee = landmarks[LANDMARKS.rightKnee];
  const leftAnkle = landmarks[LANDMARKS.leftAnkle];
  const rightAnkle = landmarks[LANDMARKS.rightAnkle];

  const midHip = midpoint(leftHip, rightHip);
  const midShoulder = midpoint(
    landmarks[LANDMARKS.leftShoulder],
    landmarks[LANDMARKS.rightShoulder]
  );

  const strideWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  const minKneeAngle = Math.min(
    angleBetween(leftHip, leftKnee, leftAnkle),
    angleBetween(rightHip, rightKnee, rightAnkle)
  );

  const isInLunge = minKneeAngle < 130 && strideWidth > 0.3;
  const isStanding = minKneeAngle > 150;

  let phase = "standing";
  let feedback = "Step forward into a lunge";

  if (isInLunge) {
    phase = "lunge_hold";
    feedback = "Good lunge. Push back to start";
  } else if (state.lastPhase === "lunge_hold" && !isStanding) {
    phase = "lunge_hold";
    feedback = "Push back to start";
  }

  const repIncremented = state.lastPhase === "lunge_hold" && phase === "standing";
  if (repIncremented) feedback = "Rep complete!";

  const errors: FormError[] = [];

  if (isInLunge) {
    const trunkLean = trunkLeanAngle(midShoulder, midHip);
    const leftThighAngle = thighAngleFromVertical(leftHip, leftKnee);
    const rightThighAngle = thighAngleFromVertical(rightHip, rightKnee);
    const bestDepthAngle = Math.min(leftThighAngle, rightThighAngle);

    const isLeftFront = leftThighAngle < rightThighAngle;
    const frontKnee = isLeftFront ? leftKnee : rightKnee;
    const frontAnkle = isLeftFront ? leftAnkle : rightAnkle;
    const shinAngle = shinAngleFromVertical(frontKnee, frontAnkle);

    if (trunkLean > 20) {
      errors.push(createError("forward_lean", "Keep chest up", "warning", "torso"));
    }
    if (bestDepthAngle > 15) {
      errors.push(createError("insufficient_depth", "Lower hips until thigh is parallel", "info", "legs"));
    }
    if (shinAngle > 20) {
      errors.push(createError("knee_forward", "Keep front knee behind toes", "warning", "knee"));
    }

    const leftWrist = landmarks[LANDMARKS.leftWrist];
    const rightWrist = landmarks[LANDMARKS.rightWrist];
    const leftHandDist = Math.min(distance2D(leftWrist, leftKnee), distance2D(leftWrist, rightKnee));
    const rightHandDist = Math.min(distance2D(rightWrist, leftKnee), distance2D(rightWrist, rightKnee));

    if (leftHandDist < 0.15 || rightHandDist < 0.15) {
      errors.push(createError("hands_on_legs", "Don't rest hands on legs", "warning", "arms"));
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

export function analyzeLungeWithRotation(
  landmarks: Landmark[],
  _thresholds: Record<string, number>,
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

  const strideWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  const minKneeAngle = Math.min(
    angleBetween(leftHip, leftKnee, leftAnkle),
    angleBetween(rightHip, rightKnee, rightAnkle)
  );

  const isInLunge = minKneeAngle < 130 && strideWidth > 0.3;

  let phase = "standing";
  let feedback = "Step into a lunge position";

  if (isInLunge) {
    state.lungeRotationState.inLunge = true;
    phase = "lunge_hold";
    feedback = "Good lunge. Now rotate torso Left and Right";
  } else {
    state.lungeRotationState.inLunge = false;
  }

  const shoulderYaw = Math.atan2(
    rightShoulder.z - leftShoulder.z,
    rightShoulder.x - leftShoulder.x
  ) * (180 / Math.PI);
  const hipYaw = Math.atan2(rightHip.z - leftHip.z, rightHip.x - leftHip.x) * (180 / Math.PI);

  let torsion = shoulderYaw - hipYaw;
  if (torsion > 180) torsion -= 360;
  if (torsion < -180) torsion += 360;

  if (state.lungeRotationState.inLunge) {
    if (torsion < -15) {
      state.lungeRotationState.rotatedRight = true;
      phase = "rotated_right";
    } else if (torsion > 15) {
      state.lungeRotationState.rotatedLeft = true;
      phase = "rotated_left";
    }

    const { rotatedLeft, rotatedRight } = state.lungeRotationState;
    if (rotatedLeft && rotatedRight) {
      feedback = "Great! Stand up to finish rep";
      phase = "rotation_done";
    } else if (rotatedLeft) {
      feedback = "Now rotate Right";
    } else if (rotatedRight) {
      feedback = "Now rotate Left";
    }
  }

  let repIncremented = false;
  const { inLunge, rotatedLeft, rotatedRight } = state.lungeRotationState;
  if (!isInLunge && !inLunge && rotatedLeft && rotatedRight) {
    repIncremented = true;
    state.lungeRotationState.rotatedLeft = false;
    state.lungeRotationState.rotatedRight = false;
    feedback = "Rep complete!";
  }

  return {
    phase,
    formScore: baseFormScore(landmarks),
    errors: [],
    feedback,
    isCorrect: true,
    repIncremented,
    confidence: coreConfidence(landmarks),
  };
}
