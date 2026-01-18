"use client";

import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { Exercise } from "@/lib/exercises/types";
import type { Landmark } from "@/types/vision";
import { cn } from "@/lib/utils";
import { getPoseLandmarker } from "@/lib/vision/pose-landmarker";
import { createFormEngine } from "@/lib/vision/form-engine";
import { createLandmarkFilter, filterLandmarks, type LandmarkFilterState } from "@/lib/vision/landmark-filter";
import { getCameraFeedback, type CameraFeedback } from "@/lib/vision/camera-feedback";
import { useExerciseStore } from "@/stores/exercise-store";

// Skeleton: both left and right sides
const POSE_CONNECTIONS: Array<[number, number]> = [
  // Left side
  [11, 23],  // left shoulder to left hip (torso)
  [23, 25],  // left hip to left knee (thigh)
  [25, 27],  // left knee to left ankle (shin)
  // Right side
  [12, 24],  // right shoulder to right hip (torso)
  [24, 26],  // right hip to right knee (thigh)
  [26, 28],  // right knee to right ankle (shin)
];

interface ExerciseCameraProps {
  exercise: Exercise;
  isPaused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type CameraStatus = "loading" | "ready" | "blocked" | "error";

export function ExerciseCamera({
  exercise,
  isPaused,
  className,
  children,
}: ExerciseCameraProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationRef = React.useRef<number | null>(null);
  const lastEmitRef = React.useRef(0);
  const lastFeedbackRef = React.useRef(0);
  const lastTimestampRef = React.useRef(0);
  const engineRef = React.useRef<ReturnType<typeof createFormEngine> | null>(null);
  const filterRef = React.useRef<LandmarkFilterState | null>(null);
  const [status, setStatus] = React.useState<CameraStatus>("loading");
  const [feedback, setFeedback] = React.useState<CameraFeedback>(null);
  const [formFeedback, setFormFeedback] = React.useState<CameraFeedback>(null);
  const [debugValues, setDebugValues] = React.useState<{
    // Squat fields
    kneeAngle?: number;
    trunkLean?: number;
    kneeForward?: number;
    descentSpeed?: number;
    minDepth?: number;

    // Lumbar extension fields
    hipAngle?: number;
    spineDepth?: number;
    depthChange?: number;
    baseline?: number;
    baselineSamples?: number;

    phase: string;
    queuedErrors: string[];
  } | null>(null);

  const setPhase = useExerciseStore((state) => state.setPhase);
  const setFormScore = useExerciseStore((state) => state.setFormScore);
  const setConfidence = useExerciseStore((state) => state.setConfidence);
  const incrementRep = useExerciseStore((state) => state.incrementRep);
  const clearAllErrors = useExerciseStore((state) => state.clearAllErrors);
  const addError = useExerciseStore((state) => state.addError);
  const updateLastFrame = useExerciseStore((state) => state.updateLastFrame);

  React.useEffect(() => {
    engineRef.current = createFormEngine(exercise);
    if (!filterRef.current) {
      filterRef.current = createLandmarkFilter();
    }
  }, [exercise]);

  React.useEffect(() => {
    let isMounted = true;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 720, height: 1280 },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");
      } catch (error) {
        setStatus(error instanceof DOMException ? "blocked" : "error");
      }
    };

    setupCamera();

    return () => {
      isMounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  React.useEffect(() => {
    let isActive = true;
    // Reset timestamp tracking to avoid conflicts with cached landmarker
    lastTimestampRef.current = performance.now();

    const runVision = async () => {
      if (!videoRef.current || status !== "ready") return;

      const landmarker = await getPoseLandmarker();
      const video = videoRef.current;

      const processFrame = () => {
        if (!isActive || !videoRef.current || status !== "ready") return;
        if (video.readyState < 2) {
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const now = performance.now();
        // Ensure monotonically increasing timestamps for MediaPipe
        const timestamp = Math.max(now, lastTimestampRef.current + 1);
        lastTimestampRef.current = timestamp;

        let result;
        try {
          result = landmarker.detectForVideo(video, timestamp);
        } catch (error) {
          // Skip frame on detection error (e.g., XNNPACK delegate issues)
          console.warn("Pose detection error, skipping frame:", error);
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }
        const rawLandmarks = result.landmarks?.[0] as Landmark[] | undefined;

        // Apply OneEuroFilter for smooth landmarks
        const landmarks = rawLandmarks && filterRef.current
          ? filterLandmarks(filterRef.current, rawLandmarks)
          : rawLandmarks;

        if (landmarks && canvasRef.current) {
          drawSkeleton(canvasRef.current, landmarks);
        }

        // Camera positioning feedback (throttled)
        if (isPaused) {
          setFeedback(null);
          setFormFeedback(null); // Also clear form feedback when paused
        } else if (now - lastFeedbackRef.current > 500) {
          lastFeedbackRef.current = now;
          if (landmarks) {
            setFeedback(getCameraFeedback(landmarks));
          } else {
            // No landmarks detected
            setFeedback({ message: "No person detected", type: "warning" });
          }
        }

        if (!isPaused && exercise.form_detection_enabled && landmarks) {
          const engine = engineRef.current;
          if (engine) {
            const analysis = engine(landmarks);

            // Rep counting must happen immediately (not throttled)
            // because repIncremented is only true for one frame
            if (analysis.repIncremented) {
              incrementRep();
            }

            // Update form feedback (throttled to 500ms for readability)
            if (now - lastEmitRef.current > 500) {
              lastEmitRef.current = now;

              // Show warning errors on overlay (they block reps, so user needs to see them)
              const warningError = analysis.errors.find(e => e.severity === "warning");
              if (warningError) {
                setFormFeedback({
                  message: warningError.message,
                  type: "warning"
                });
              } else if (analysis.feedback) {
                setFormFeedback({
                  message: analysis.feedback,
                  type: analysis.feedback.includes("Excellent") || analysis.feedback.includes("Good") ? "success" : "info"
                });
              } else {
                setFormFeedback(null);
              }

              setPhase(analysis.phase);
              setFormScore(analysis.formScore);
              setConfidence(analysis.confidence);
              clearAllErrors();
              analysis.errors.forEach((error) => addError(error));
              updateLastFrame();

              // Update debug values if available
              if (analysis.debug) {
                setDebugValues({
                  ...analysis.debug,
                  phase: analysis.phase,
                });
              }
            }
          }
        }

        animationRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    };

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
    updateLastFrame,
  ]);

  const activeFeedback = feedback || formFeedback;

  return (
    <div
      className={cn(
        "relative h-[400px] w-full overflow-hidden bg-sage-950",
        className
      )}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full scale-x-[-1]"
      />

      {/* Debug Overlay for tuning thresholds - DISABLED */}
      {/* {debugValues && (
        <div className="absolute top-24 left-2 bg-black/95 text-green-400 p-4 rounded-xl font-mono z-30 space-y-1 min-w-[200px]">
          <div className="text-yellow-400 font-bold text-2xl mb-2 uppercase">{debugValues.phase}</div>

          {debugValues.trunkLean !== undefined && (
            <>
              <div className="text-xl font-bold">thigh: {debugValues.kneeAngle?.toFixed(0) ?? 'N/A'}°</div>
              <div className="text-xl font-bold">lean: {debugValues.trunkLean.toFixed(0)}°</div>
              <div className="text-xl font-bold">fwd: {debugValues.kneeForward?.toFixed(2) ?? 'N/A'}</div>
              <div className="text-xl font-bold">spd: {debugValues.descentSpeed?.toFixed(2) ?? 'N/A'}</div>
              <div className="text-cyan-400 font-bold">max: {debugValues.minDepth?.toFixed(0) ?? 'N/A'}°</div>
            </>
          )}

          {debugValues.hipAngle !== undefined && (
            <>
              <div className="text-xl font-bold">hip: {debugValues.hipAngle.toFixed(0)}°</div>
              <div className="text-xl font-bold">knee: {debugValues.kneeAngle?.toFixed(0) ?? 'N/A'}°</div>
              <div className="text-xl font-bold">depth: {debugValues.spineDepth?.toFixed(3) ?? 'N/A'}</div>
              <div className={`text-xl font-bold ${(debugValues.depthChange ?? 0) <= -0.15 ? 'text-cyan-400' : ''}`}>
                Δ: {debugValues.depthChange?.toFixed(3) ?? 'N/A'}
              </div>
              <div className="text-sm">base: {debugValues.baseline?.toFixed(3) ?? 'N/A'} ({debugValues.baselineSamples ?? 0})</div>
            </>
          )}

          {debugValues.queuedErrors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-orange-500/50">
              <div className="text-orange-400 text-sm font-bold mb-1">QUEUED:</div>
              {debugValues.queuedErrors.map((err, i) => (
                <div key={i} className="text-orange-500 text-sm font-bold">{err}</div>
              ))}
            </div>
          )}
        </div>
      )} */}

      {/* Feedback Overlay (Camera Positioning or Exercise Form) */}
      {activeFeedback && status === "ready" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className={cn(
            "px-6 py-4 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-xl transition-all duration-300",
            activeFeedback.type === "warning" ? "bg-amber-500/90 text-white" :
            activeFeedback.type === "success" ? "bg-emerald-500/90 text-white" :
            "bg-blue-500/90 text-white"
          )}>
            {activeFeedback.type === "warning" && <AlertTriangle className="w-8 h-8" />}
            {activeFeedback.type !== "warning" && <Info className="w-8 h-8" />}
            <span className="text-xl font-bold">{activeFeedback.message}</span>
          </div>
        </div>
      )}

      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sage-900/80 text-white">
          <div className="text-center space-y-2 px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
              <AlertTriangle className="w-6 h-6 text-white/70" />
            </div>
            <p className="text-sm font-semibold">
              {status === "blocked"
                ? "Camera access blocked"
                : status === "error"
                  ? "Camera unavailable"
                  : "Starting camera..."}
            </p>
            <p className="text-xs text-white/70">
              {status === "blocked"
                ? "Allow camera access to continue the workout."
                : "Make sure your camera is enabled and not in use."}
            </p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

function drawSkeleton(canvas: HTMLCanvasElement, landmarks: Landmark[]) {
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

  POSE_CONNECTIONS.forEach(([start, end]) => {
    const from = landmarks[start];
    const to = landmarks[end];
    if (!from || !to) return;
    ctx.beginPath();
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();
  });

  // Landmarks for both sides: shoulder, hip, knee, ankle
  const landmarksToShow = [11, 23, 25, 27, 12, 24, 26, 28];  // left and right sides
  landmarksToShow.forEach((index) => {
    const landmark = landmarks[index];
    if (!landmark) return;
    ctx.beginPath();
    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}