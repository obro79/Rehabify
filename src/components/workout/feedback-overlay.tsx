"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { CameraFeedback } from "@/lib/vision/camera-feedback";
import { cn } from "@/lib/utils";

interface FeedbackOverlayProps {
  feedback: CameraFeedback;
}

/**
 * Displays camera positioning or exercise form feedback
 * Shows warning, success, or info messages with appropriate styling
 */
export function FeedbackOverlay({ feedback }: FeedbackOverlayProps): React.ReactNode {
  if (!feedback) return null;

  const bgColor =
    feedback.type === "warning"
      ? "bg-amber-500/90"
      : feedback.type === "success"
        ? "bg-emerald-500/90"
        : "bg-blue-500/90";

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div
        className={cn(
          "px-6 py-4 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-xl transition-all duration-300 text-white",
          bgColor
        )}
      >
        {feedback.type === "warning" ? (
          <AlertTriangle className="w-8 h-8" />
        ) : (
          <Info className="w-8 h-8" />
        )}
        <span className="text-xl font-bold">{feedback.message}</span>
      </div>
    </div>
  );
}
