import type { FormError } from "@/types";

export interface FormEngineResult {
  phase: string;
  formScore: number;
  errors: FormError[];
  feedback?: string;
  isCorrect: boolean;
  repIncremented: boolean;
  confidence: number;
  debug?: FormDebug;
}

export interface FormDebug {
  kneeAngle?: number;
  trunkLean?: number;
  kneeForward?: number;
  descentSpeed?: number;
  minDepth?: number;
  hipAngle?: number;
  spineDepth?: number;
  depthChange?: number;
  baseline?: number;
  baselineSamples?: number;
  shoulderTilt?: number;
  shoulderTiltAngle?: number;
  hipTilt?: number;
  bendingSide?: string;
  leftThighAngle?: number;
  rightThighAngle?: number;
  bestDepthAngle?: number;
  shinAngle?: number;
  torsion?: number;
  shoulderYaw?: number;
  hipYaw?: number;
  phase?: string;
  queuedErrors: string[];
}

export interface EngineState {
  lastPhase: string;
  lastRepPhase: string;
  lastExtendedSide: "left" | "right" | null;
  baselineSpineDepth: number[];
  sideBendState: {
    leftDone: boolean;
    rightDone: boolean;
  };
  lungeRotationState: {
    inLunge: boolean;
    rotatedLeft: boolean;
    rotatedRight: boolean;
  };
}

export function createEngineState(): EngineState {
  return {
    lastPhase: "neutral",
    lastRepPhase: "",
    lastExtendedSide: null,
    baselineSpineDepth: [],
    sideBendState: { leftDone: false, rightDone: false },
    lungeRotationState: { inLunge: false, rotatedLeft: false, rotatedRight: false },
  };
}

export function addOrientationError(
  errors: FormError[],
  orientation: { isCorrect: boolean; feedback?: string }
): void {
  if (!orientation.isCorrect && orientation.feedback) {
    errors.push(createError("orientation", orientation.feedback, "warning", "body"));
  }
}

export function createError(
  type: string,
  message: string,
  severity: "info" | "warning" | "error",
  bodyPart: string
): FormError {
  return { type, message, severity, timestamp: Date.now(), bodyPart };
}
