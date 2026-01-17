import type { Landmark } from "@/types/vision";

export type CameraFeedback = {
  message: string;
  type: "warning" | "info" | "success";
} | null;

/**
 * Analyzes pose landmarks to provide feedback on camera positioning.
 * Returns a feedback object or null if positioning is good.
 */
export function getCameraFeedback(landmarks: Landmark[]): CameraFeedback {
  if (!landmarks || landmarks.length === 0) {
    return { message: "No person detected", type: "warning" };
  }

  // Key landmarks indices (MediaPipe Pose)
  // 0: nose
  // 11: left shoulder, 12: right shoulder
  // 23: left hip, 24: right hip
  // 27: left ankle, 28: right ankle
  // 31: left foot index, 32: right foot index
  
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Helper to check visibility
  const isVisible = (lm: Landmark) => (lm.visibility ?? 0) > 0.6;
  
  // 1. Calculate bounding box of VISIBLE landmarks
  let minX = 1, maxX = 0;
  let minY = 1, maxY = 0;
  let hasVisibleLandmarks = false;

  landmarks.forEach(lm => {
    if (isVisible(lm)) {
      hasVisibleLandmarks = true;
      minX = Math.min(minX, lm.x);
      maxX = Math.max(maxX, lm.x);
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
    }
  });

  if (!hasVisibleLandmarks) {
    return { message: "No person detected", type: "warning" };
  }
  
  const height = maxY - minY;
  const width = maxX - minX;
  const maxDimension = Math.max(height, width);

  // 2. Check visibility of key body parts
  const isHeadVisible = isVisible(nose) || (isVisible(leftShoulder) && isVisible(rightShoulder));
  const isLowerBodyVisible = isVisible(leftHip) || isVisible(rightHip);
  const areKneesVisible = isVisible(leftKnee) || isVisible(rightKnee);

  // Critical visibility checks (Priority 1)
  
  // If we see head but no body, they are likely too close or camera is aimed high
  if (isHeadVisible && !isLowerBodyVisible) {
    return { message: "Move back to show body", type: "warning" };
  }

  // If hips are not visible, major issue
  if (!isLowerBodyVisible) {
      return { message: "Cannot see body", type: "warning" };
  }

  // If we can't see the head (and y is low, meaning near top edge)
  if (!isHeadVisible) {
     return { message: "Cannot see head", type: "warning" };
  }

  // 3. Check if user is too far (subject is too small)
  // Use maxDimension to handle standing (height dominant) and lying (width dominant) poses
  if (maxDimension < 0.4) {
    return { message: "Too far, move closer", type: "warning" };
  }

  // 4. Check for "Too Close" (Out of bounds)
  // If visible landmarks are very close to edges
  const margin = 0.02;
  const isTouchingTop = nose && nose.y < margin;
  const isTouchingBottom = (leftAnkle && leftAnkle.y > 1 - margin) || (rightAnkle && rightAnkle.y > 1 - margin);
  const isTouchingLeft = landmarks.some(lm => isVisible(lm) && lm.x < margin);
  const isTouchingRight = landmarks.some(lm => isVisible(lm) && lm.x > 1 - margin);

  if (isTouchingTop) {
      return { message: "Too close to top", type: "warning" };
  }
  
  if (isTouchingBottom) {
      // Often means feet are cut off
      if (!areKneesVisible) {
           return { message: "Cannot see knees", type: "warning" };
      }
      return { message: "Too close to bottom", type: "warning" };
  }
  
  if (isTouchingLeft || isTouchingRight) {
       return { message: "Too close to edge", type: "warning" };
  }

  // General check for "Too Close" based on size
  if (height > 0.9) {
       return { message: "Too close, move back", type: "warning" };
  }
  
  // 5. Specific body part checks for common issues
  if (!areKneesVisible && height > 0.6) {
      // If the person is reasonably large but we can't see knees, legs are likely cut off
      return { message: "Cannot see knees", type: "warning" };
  }

  return null; // Good positioning
}
