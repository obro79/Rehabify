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
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Helper to check visibility
  const isVisible = (lm: Landmark) => (lm.visibility ?? 0) > 0.6;
  
  // 1. Check if user is too far (subject is too small)
  // Calculate approximate height of the subject
  let minY = 1, maxY = 0;
  landmarks.forEach(lm => {
    if (isVisible(lm)) {
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
    }
  });
  
  const height = maxY - minY;
  
  if (height < 0.4) {
    return { message: "Too far, move closer", type: "warning" };
  }

  // 2. Check visibility of key body parts
  const isHeadVisible = isVisible(nose) || (isVisible(leftShoulder) && isVisible(rightShoulder));
  const isLowerBodyVisible = isVisible(leftHip) || isVisible(rightHip);
  const areFeetVisible = isVisible(leftAnkle) || isVisible(rightAnkle);

  // If we can't see the head (and y is low, meaning near top edge)
  if (!isHeadVisible) {
     return { message: "Cannot see head", type: "warning" };
  }
  
  // If hips are not visible, major issue
  if (!isLowerBodyVisible) {
      return { message: "Cannot see body", type: "warning" };
  }

  // 3. Check for "Too Close" (Out of bounds)
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
      if (!areFeetVisible) {
           return { message: "Cannot see feet", type: "warning" };
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
  
  // 4. Specific body part checks for common issues
  if (!areFeetVisible && height > 0.6) {
      // If the person is reasonably large but we can't see feet, they are likely cut off
      return { message: "Cannot see feet", type: "warning" };
  }

  return null; // Good positioning
}
