"use client";

import { AlertTriangle } from "lucide-react";
import type { CameraStatus } from "@/hooks/use-camera";

interface CameraStatusOverlayProps {
  status: CameraStatus;
}

function getStatusMessage(status: CameraStatus): { title: string; description: string } {
  switch (status) {
    case "blocked":
      return {
        title: "Camera access blocked",
        description: "Allow camera access to continue the workout.",
      };
    case "error":
      return {
        title: "Camera unavailable",
        description: "Make sure your camera is enabled and not in use.",
      };
    default:
      return {
        title: "Starting camera...",
        description: "Make sure your camera is enabled and not in use.",
      };
  }
}

/**
 * Displays camera status when not ready (loading, blocked, or error states)
 */
export function CameraStatusOverlay({ status }: CameraStatusOverlayProps): React.ReactNode {
  if (status === "ready") return null;

  const { title, description } = getStatusMessage(status);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-sage-900/80 text-white">
      <div className="text-center space-y-2 px-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
          <AlertTriangle className="w-6 h-6 text-white/70" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/70">{description}</p>
      </div>
    </div>
  );
}
