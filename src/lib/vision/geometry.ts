import type { Landmark } from "@/types/vision";

export const LANDMARKS = {
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
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: (a.visibility + b.visibility) / 2,
  };
}

export function distance2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
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

export function angleBetween3D(a: Landmark, b: Landmark, c: Landmark): number {
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

export function averageVisibility(landmarks: Landmark[], indices: number[]): number {
  const total = indices.reduce((sum, index) => sum + (landmarks[index]?.visibility ?? 0), 0);
  return total / indices.length;
}

export function baseFormScore(landmarks: Landmark[]): number {
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

export function coreConfidence(landmarks: Landmark[]): number {
  return averageVisibility(landmarks, [
    LANDMARKS.leftShoulder,
    LANDMARKS.rightShoulder,
    LANDMARKS.leftHip,
    LANDMARKS.rightHip,
  ]);
}

export function checkOrientation(
  landmarks: Landmark[],
  desired: "front" | "side"
): { isCorrect: boolean; feedback?: string } {
  const leftShoulder = landmarks[LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[LANDMARKS.rightShoulder];
  const leftHip = landmarks[LANDMARKS.leftHip];
  const rightHip = landmarks[LANDMARKS.rightHip];

  const shoulderWidth = distance2D(leftShoulder, rightShoulder);
  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const midHip = midpoint(leftHip, rightHip);
  const torsoHeight = distance2D(midShoulder, midHip) || 1;

  const ratio = shoulderWidth / torsoHeight;

  if (desired === "side") {
    if (ratio > 0.6) return { isCorrect: false, feedback: "Turn to face the side" };
  } else {
    if (ratio < 0.5) return { isCorrect: false, feedback: "Turn to face forward" };
  }
  return { isCorrect: true };
}

export function trunkLeanAngle(shoulder: Landmark, hip: Landmark): number {
  const dy = hip.y - shoulder.y;
  const dx = hip.x - shoulder.x;
  return Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
}

export function thighAngleFromVertical(hip: Landmark, knee: Landmark): number {
  const dx = Math.abs(hip.x - knee.x);
  const dy = Math.abs(hip.y - knee.y);
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export function shinAngleFromVertical(knee: Landmark, ankle: Landmark): number {
  const dx = Math.abs(knee.x - ankle.x);
  const dy = Math.abs(knee.y - ankle.y);
  return Math.atan2(dx, dy) * (180 / Math.PI);
}
