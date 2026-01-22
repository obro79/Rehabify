"use client";

import { useEffect, useRef } from "react";
import type { Exercise } from "@/lib/exercises/types";
import type { Landmark } from "@/types/vision";
import type { CameraFeedback } from "@/lib/vision/camera-feedback";
import { getPoseLandmarker } from "@/lib/vision/pose-landmarker";
import { createFormEngine } from "@/lib/vision/form-engine";
import {
  createLandmarkFilter,
  filterLandmarks,
  type LandmarkFilterState,
} from "@/lib/vision/landmark-filter";
import { getCameraFeedback } from "@/lib/vision/camera-feedback";
import { useExerciseStore } from "@/stores/exercise-store";
import type { CameraStatus } from "./use-camera";

// Throttle intervals in milliseconds
const FEEDBACK_THROTTLE_MS = 500;
const EMIT_THROTTLE_MS = 500;

interface UsePoseDetectionOptions {
  exercise: Exercise;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  isPaused?: boolean;
  onLandmarksDetected?: (landmarks: Landmark[]) => void;
  onCameraFeedback?: (feedback: CameraFeedback) => void;
  onFormFeedback?: (feedback: CameraFeedback) => void;
}

/**
 * Hook to manage pose detection and form analysis
 * Handles MediaPipe processing, landmark filtering, and store updates
 */
export function usePoseDetection({
  exercise,
  videoRef,
  status,
  isPaused,
  onLandmarksDetected,
  onCameraFeedback,
  onFormFeedback,
}: UsePoseDetectionOptions): void {
  const animationRef = useRef<number | null>(null);
  const lastEmitRef = useRef(0);
  const lastFeedbackRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const engineRef = useRef<ReturnType<typeof createFormEngine> | null>(null);
  const filterRef = useRef<LandmarkFilterState | null>(null);

  const setPhase = useExerciseStore((state) => state.setPhase);
  const setFormScore = useExerciseStore((state) => state.setFormScore);
  const setConfidence = useExerciseStore((state) => state.setConfidence);
  const incrementRep = useExerciseStore((state) => state.incrementRep);
  const clearAllErrors = useExerciseStore((state) => state.clearAllErrors);
  const addError = useExerciseStore((state) => state.addError);

  // Initialize form engine when exercise changes
  useEffect(() => {
    engineRef.current = createFormEngine(exercise);
    if (!filterRef.current) {
      filterRef.current = createLandmarkFilter();
    }
  }, [exercise]);

  // Main vision processing loop
  useEffect(() => {
    let isActive = true;
    lastTimestampRef.current = performance.now();

    async function runVision(): Promise<void> {
      if (!videoRef.current || status !== "ready") return;

      const landmarker = await getPoseLandmarker();
      const video = videoRef.current;

      function processFrame(): void {
        if (!isActive || !videoRef.current || status !== "ready") return;
        if (video.readyState < 2) {
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const now = performance.now();
        const timestamp = Math.max(now, lastTimestampRef.current + 1);
        lastTimestampRef.current = timestamp;

        let result;
        try {
          result = landmarker.detectForVideo(video, timestamp);
        } catch (error) {
          console.warn("Pose detection error, skipping frame:", error);
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const rawLandmarks = result.landmarks?.[0] as Landmark[] | undefined;
        const landmarks =
          rawLandmarks && filterRef.current
            ? filterLandmarks(filterRef.current, rawLandmarks)
            : rawLandmarks;

        if (landmarks) {
          onLandmarksDetected?.(landmarks);
        }

        // Camera positioning feedback (throttled)
        if (isPaused) {
          onCameraFeedback?.(null);
          onFormFeedback?.(null);
        } else if (now - lastFeedbackRef.current > FEEDBACK_THROTTLE_MS) {
          lastFeedbackRef.current = now;
          if (landmarks) {
            onCameraFeedback?.(getCameraFeedback(landmarks));
          } else {
            onCameraFeedback?.({ message: "No person detected", type: "warning" });
          }
        }

        // Form analysis
        if (!isPaused && exercise.form_detection_enabled && landmarks) {
          const engine = engineRef.current;
          if (engine) {
            const analysis = engine(landmarks);

            // Rep counting must happen immediately (not throttled)
            if (analysis.repIncremented) {
              clearAllErrors();
              analysis.errors.forEach((error) => addError(error));
              incrementRep();
            }

            // Update form feedback (throttled)
            if (now - lastEmitRef.current > EMIT_THROTTLE_MS) {
              lastEmitRef.current = now;

              const warningError = analysis.errors.find((e) => e.severity === "warning");
              if (warningError) {
                onFormFeedback?.({ message: warningError.message, type: "warning" });
              } else if (analysis.feedback) {
                const isPositive =
                  analysis.feedback.includes("Excellent") ||
                  analysis.feedback.includes("Good");
                onFormFeedback?.({
                  message: analysis.feedback,
                  type: isPositive ? "success" : "info",
                });
              } else {
                onFormFeedback?.(null);
              }

              setPhase(analysis.phase);
              setFormScore(analysis.formScore);
              setConfidence(analysis.confidence);
              clearAllErrors();
              analysis.errors.forEach((error) => addError(error));
            }
          }
        }

        animationRef.current = requestAnimationFrame(processFrame);
      }

      processFrame();
    }

    runVision();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    exercise.form_detection_enabled,
    incrementRep,
    isPaused,
    setConfidence,
    setFormScore,
    setPhase,
    status,
    addError,
    clearAllErrors,
    videoRef,
    onLandmarksDetected,
    onCameraFeedback,
    onFormFeedback,
  ]);
}
