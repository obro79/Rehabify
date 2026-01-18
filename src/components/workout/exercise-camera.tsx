"use client";

import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { Exercise } from "@/lib/exercises/types";
import type { Landmark } from "@/types/vision";
import { cn } from "@/lib/utils";
import { getPoseLandmarker } from "@/lib/vision/pose-landmarker";
import { createFormEngine } from "@/lib/vision/form-engine";
import { getCameraFeedback, type CameraFeedback } from "@/lib/vision/camera-feedback";
import { useExerciseStore } from "@/stores/exercise-store";

const POSE_CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 31],
  [28, 32],
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
  const [status, setStatus] = React.useState<CameraStatus>("loading");
  const [feedback, setFeedback] = React.useState<CameraFeedback>(null);
  const [formFeedback, setFormFeedback] = React.useState<CameraFeedback>(null);

  const setPhase = useExerciseStore((state) => state.setPhase);
  const setFormScore = useExerciseStore((state) => state.setFormScore);
  const setConfidence = useExerciseStore((state) => state.setConfidence);
  const incrementRep = useExerciseStore((state) => state.incrementRep);
  const clearAllErrors = useExerciseStore((state) => state.clearAllErrors);
  const addError = useExerciseStore((state) => state.addError);
  const updateLastFrame = useExerciseStore((state) => state.updateLastFrame);

  React.useEffect(() => {
    engineRef.current = createFormEngine(exercise);
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
        const landmarks = result.landmarks?.[0] as Landmark[] | undefined;
        
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

            // Update form feedback
            if (now - lastEmitRef.current > 150) {
              lastEmitRef.current = now;
              
              if (analysis.feedback) {
                let type: "success" | "info" | "warning" = "info";
                if (analysis.feedback.includes("Excellent") || analysis.feedback.includes("Good")) {
                  type = "success";
                } else if (analysis.feedback.includes("Turn") || analysis.feedback.includes("Face")) {
                  type = "warning";
                }
                
                setFormFeedback({ 
                  message: analysis.feedback, 
                  type
                });
              } else {
                setFormFeedback(null);
              }

              setPhase(analysis.phase);
              setFormScore(analysis.formScore);
              setConfidence(analysis.confidence);
              clearAllErrors();
              analysis.errors.forEach((error) => addError(error));
              if (analysis.repIncremented) {
                incrementRep();
              }
              updateLastFrame();
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
      
      {/* Feedback Overlay (Camera Positioning or Exercise Form) */}
      {activeFeedback && status === "ready" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className={cn(
            "px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 shadow-lg transition-all duration-300",
            activeFeedback.type === "warning" ? "bg-amber-500/80 text-white" : 
            activeFeedback.type === "success" ? "bg-emerald-500/80 text-white" :
            "bg-blue-500/80 text-white"
          )}>
            {activeFeedback.type === "warning" && <AlertTriangle className="w-4 h-4" />}
            {activeFeedback.type !== "warning" && <Info className="w-4 h-4" />}
            <span className="text-sm font-medium">{activeFeedback.message}</span>
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

  landmarks.forEach((landmark) => {
    ctx.beginPath();
    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}