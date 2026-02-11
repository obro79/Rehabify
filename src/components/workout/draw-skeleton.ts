import type { Landmark } from "@/types/vision";
import { POSE_CONNECTIONS, LANDMARKS_TO_SHOW } from "./pose-constants";

/**
 * Draws pose skeleton overlay on canvas
 * Renders connection lines and landmark dots based on detected pose
 */
export function drawSkeleton(canvas: HTMLCanvasElement, landmarks: Landmark[]): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

  // Draw connection lines
  for (const [start, end] of POSE_CONNECTIONS) {
    const from = landmarks[start];
    const to = landmarks[end];
    if (!from || !to) continue;
    ctx.beginPath();
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();
  }

  // Draw landmark dots
  for (const index of LANDMARKS_TO_SHOW) {
    const landmark = landmarks[index];
    if (!landmark) continue;
    ctx.beginPath();
    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
