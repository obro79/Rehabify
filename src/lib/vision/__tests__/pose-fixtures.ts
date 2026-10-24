import type { Landmark } from "@/types/vision";
import { LANDMARKS } from "../geometry";

const point = (x: number, y: number, z = 0, visibility = 1): Landmark => ({ x, y, z, visibility });

/**
 * Side-on body with left and right landmarks stacked, in normalized image
 * coordinates (y grows downward).
 *
 * thighAngle: degrees of thigh rotation from vertical (0 = standing, 90 = parallel squat)
 * shoulderZ / shoulderY: let callers lean the torso forward for hip-hinge exercises
 * kneeBend: moves the ankles forward to bend the knees
 * handsOnKnees: rests the wrists on the knees instead of holding them away from the body
 */
export function sideBody({
  thighAngle = 0,
  shoulderY = 0.1,
  shoulderZ = 0,
  kneeBend = 0,
  handsOnKnees = false,
}: {
  thighAngle?: number;
  shoulderY?: number;
  shoulderZ?: number;
  kneeBend?: number;
  handsOnKnees?: boolean;
} = {}): Landmark[] {
  const landmarks = Array.from({ length: 33 }, () => point(0, 0));
  const rad = (thighAngle * Math.PI) / 180;
  const hip = point(0.5, 0.4);
  const knee = point(hip.x - 0.3 * Math.sin(rad), hip.y + 0.3 * Math.cos(rad));
  const ankle = point(knee.x + kneeBend, knee.y + 0.3);
  const shoulder = point(0.5, shoulderY, shoulderZ);
  const ear = point(0.5, shoulderY - 0.08, shoulderZ);
  const wrist = handsOnKnees ? { ...knee } : point(0.95, 0.4);

  const pairs: [number, number, Landmark][] = [
    [LANDMARKS.leftEar, LANDMARKS.rightEar, ear],
    [LANDMARKS.leftShoulder, LANDMARKS.rightShoulder, shoulder],
    [LANDMARKS.leftWrist, LANDMARKS.rightWrist, wrist],
    [LANDMARKS.leftHip, LANDMARKS.rightHip, hip],
    [LANDMARKS.leftKnee, LANDMARKS.rightKnee, knee],
    [LANDMARKS.leftAnkle, LANDMARKS.rightAnkle, ankle],
  ];
  for (const [left, right, p] of pairs) {
    landmarks[left] = { ...p };
    landmarks[right] = { ...p };
  }
  return landmarks;
}
