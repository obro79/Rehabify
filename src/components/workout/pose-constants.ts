// Pose detection constants for skeleton visualization

// Skeleton connections: pairs of landmark indices to draw lines between
// Covers both left and right sides of the body
export const POSE_CONNECTIONS: Array<[number, number]> = [
  // Left side
  [11, 23], // left shoulder to left hip (torso)
  [23, 25], // left hip to left knee (thigh)
  [25, 27], // left knee to left ankle (shin)
  // Right side
  [12, 24], // right shoulder to right hip (torso)
  [24, 26], // right hip to right knee (thigh)
  [26, 28], // right knee to right ankle (shin)
];

// Landmark indices to render as dots: shoulder, hip, knee, ankle (both sides)
export const LANDMARKS_TO_SHOW = [11, 23, 25, 27, 12, 24, 26, 28];
