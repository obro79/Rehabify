"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, MicOff, Volume2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepCounter } from "@/components/ui/rep-counter";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import { StepIndicator } from "@/components/assessment/step-indicator";
import { ExerciseCamera } from "@/components/workout";
import { cn } from "@/lib/utils";
import { useAssessmentStore } from "@/stores/assessment-store";
import {
  selectShouldShowCamera,
  selectAssessmentIsComplete,
  selectHasRedFlag,
} from "@/stores";
import { useVoiceStore } from "@/stores/voice-store";
import { useExerciseStore } from "@/stores/exercise-store";
import {
  selectFormScore,
  selectPhase,
  selectRepCount,
} from "@/stores/exercise-store-selectors";
import { useAssessmentVapi } from "@/hooks/use-assessment-vapi";
import exercisesData from "@/lib/exercises/data.json";
import type { Exercise } from "@/lib/exercises/types";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

const STEPS = [
  { id: "interview", label: "Interview" },
  { id: "movement", label: "Movement" },
  { id: "summary", label: "Summary" },
];

// Movement exercise slugs for the assessment
const MOVEMENT_SLUGS = [
  "standing-lumbar-flexion",
  "standing-lumbar-extension",
  "standing-lumbar-side-bending",
];

// Default assessment data when user skips
const DEFAULT_ASSESSMENT_DATA = {
  chiefComplaint: {
    bodyPart: "lower back",
    symptomType: "stiffness and discomfort",
    duration: "a few weeks",
    onset: "gradual" as const,
  },
  pain: {
    currentLevel: 4,
    worstLevel: 6,
    character: ["dull", "aching"],
    radiates: false,
    aggravators: ["prolonged sitting", "bending forward"],
    relievers: ["walking", "stretching"],
  },
  functional: {
    limitedActivities: ["sitting at desk", "lifting"],
    dailyImpact: "Mild interference with work and daily activities",
    goals: ["reduce stiffness", "improve mobility"],
  },
  history: {
    previousInjuries: false,
    imaging: null,
    currentTreatment: null,
    redFlags: [],
  },
  movementScreen: {
    flexion: { pain: 3, painLocation: "lower back" },
    extension: { pain: 2, comparison: "better" as const },
    sideBend: { pain: 2, painSide: "neither" as const },
  },
  movementResults: [],
};

// Keywords that indicate movement phase has started
const MOVEMENT_KEYWORDS = [
  "movement test",
  "stand facing",
  "stand where",
  "bend forward",
  "lean backward",
  "side bend",
  "3 quick tests",
  "three quick tests",
  "let's do 3",
  "let's do three",
];

// ============================================================================
// Left Panel - Assessment Instructions
// ============================================================================
interface AssessmentInstructionsPanelProps {
  currentPhase: "interview" | "movement" | "summary";
  isMovementPhase: boolean;
  currentExercise?: Exercise;
}

function AssessmentInstructionsPanel({
  currentPhase,
  isMovementPhase,
  currentExercise,
}: AssessmentInstructionsPanelProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Step Indicator */}
      <Card className="p-4 flex-shrink-0">
        <StepIndicator steps={STEPS} currentStep={currentPhase} />
      </Card>

      {/* Phase Content */}
      <Card className="flex-1 p-4 overflow-y-auto">
        {isMovementPhase && currentExercise ? (
          <MovementInstructions exercise={currentExercise} />
        ) : currentPhase === "summary" ? (
          <SummaryInstructions />
        ) : (
          <InterviewInstructions />
        )}
      </Card>
    </div>
  );
}

function InterviewInstructions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Interview Phase
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Your coach will ask you about your symptoms, pain levels, and daily
        activities. Answer naturally - there are no wrong answers.
      </p>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">We'll cover:</p>
        <ul className="space-y-2 ml-1">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              1
            </span>
            <span className="text-muted-foreground">What's bothering you</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              2
            </span>
            <span className="text-muted-foreground">Pain levels and triggers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              3
            </span>
            <span className="text-muted-foreground">Your goals</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function MovementInstructions({ exercise }: { exercise: Exercise }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Movement Screen
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Your coach will guide you through simple movement tests. Go slowly and
        stop if anything hurts.
      </p>

      {/* Current Exercise */}
      <div className="p-3 bg-sage-50 rounded-lg mb-4">
        <p className="text-xs font-medium text-sage-600 mb-1">Current Test</p>
        <p className="text-sm font-semibold text-sage-800">{exercise.name}</p>
      </div>

      {/* Movement List */}
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold">
            1
          </span>
          <span className="text-muted-foreground">Forward bend (flexion)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold">
            2
          </span>
          <span className="text-muted-foreground">Backward bend (extension)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold">
            3
          </span>
          <span className="text-muted-foreground">Side bends (left and right)</span>
        </li>
      </ul>
    </div>
  );
}

function SummaryInstructions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Summary & Plan
      </h3>
      <p className="text-sm text-muted-foreground">
        Your coach will summarize the findings and create a personalized exercise
        plan based on your assessment.
      </p>
    </div>
  );
}

// ============================================================================
// Right Panel - Voice Coach + Stats
// ============================================================================
interface AssessmentStatsPanelProps {
  voiceState: VoiceState;
  transcript: string;
  isConnected: boolean;
  isMuted: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onToggleMute: () => void;
  isMovementPhase: boolean;
  repCount: number;
  formScore: number;
  exercisePhase: string;
}

function AssessmentStatsPanel({
  voiceState,
  transcript,
  isConnected,
  isMuted,
  onStartVoice,
  onStopVoice,
  onToggleMute,
  isMovementPhase,
  repCount,
  formScore,
  exercisePhase,
}: AssessmentStatsPanelProps) {
  const getFormScoreColor = (score: number): "sage" | "coral" => {
    return score >= 70 ? "sage" : "coral";
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Voice Coach Card */}
      <Card className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Voice Coach</h3>
          <Badge variant="outlined" className="text-xs capitalize">
            {voiceState === "listening"
              ? "Listening"
              : voiceState === "speaking"
              ? "Speaking"
              : voiceState}
          </Badge>
        </div>

        {/* Voice Indicator */}
        <div className="flex justify-center py-3">
          <VoiceIndicator state={voiceState} size="md" />
        </div>

        {/* Transcript */}
        <div className="bg-muted/50 rounded-lg p-3 mb-3 min-h-[60px]">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            "{transcript}"
          </p>
        </div>

        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onStartVoice}
              className="flex-1 gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Start Assessment
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStopVoice}
                className="flex-1 gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                End
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Movement Metrics (only during movement phase) */}
      {isMovementPhase && (
        <>
          <Card className="p-4 flex-shrink-0">
            <div className="flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground mb-2">Reps</p>
              <RepCounter current={repCount} target={1} size="lg" />
            </div>
          </Card>

          <Card className="p-4 flex-shrink-0">
            <div className="flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground mb-2">Form</p>
              <ProgressRing
                value={formScore}
                size="default"
                color={getFormScoreColor(formScore)}
              />
            </div>
          </Card>

          <Card className="p-4 flex-1">
            <div className="flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground mb-2">Phase</p>
              <Badge variant="active" size="default" className="uppercase">
                {exercisePhase || "ready"}
              </Badge>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Center Panel - Exercise Demo Placeholder
// ============================================================================
function ExerciseDemoPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100">
      <div className="text-center p-8">
        {/* Person icon placeholder */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sage-200/50 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-sage-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="12" y1="12" x2="8" y2="10" />
            <line x1="12" y1="12" x2="16" y2="10" />
            <line x1="12" y1="16" x2="9" y2="21" />
            <line x1="12" y1="16" x2="15" y2="21" />
          </svg>
        </div>
        <p className="text-sm font-medium text-sage-600 mb-1">
          Exercise Demo
        </p>
        <p className="text-xs text-sage-500">
          Movement tests will appear here
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Center Panel - Camera Placeholder
// ============================================================================
function CameraPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center p-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-300/50 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">
          Camera Preview
        </p>
        <p className="text-xs text-slate-400">
          Your camera will activate during movement tests
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================
export default function LowerBackAssessmentPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [currentMovementIndex, setCurrentMovementIndex] = React.useState(0);
  const [isMovementPhase, setIsMovementPhase] = React.useState(false);

  // Movement exercises for camera tracking
  const movementExercises = React.useMemo(() => {
    const list = exercisesData.exercises as Exercise[];
    return MOVEMENT_SLUGS.map((slug) => list.find((ex) => ex.slug === slug)).filter(
      (ex): ex is Exercise => Boolean(ex)
    );
  }, []);

  const currentMovementExercise = movementExercises[currentMovementIndex];

  // Exercise store for camera tracking
  const repCount = useExerciseStore(selectRepCount);
  const formScore = useExerciseStore(selectFormScore);
  const exercisePhase = useExerciseStore(selectPhase);
  const setExercise = useExerciseStore((state) => state.setExercise);
  const resetExercise = useExerciseStore((state) => state.reset);

  // Assessment store
  const shouldShowCamera = useAssessmentStore(selectShouldShowCamera);
  const isComplete = useAssessmentStore(selectAssessmentIsComplete);
  const hasRedFlag = useAssessmentStore(selectHasRedFlag);
  const resetAssessment = useAssessmentStore((state) => state.reset);
  const getAssessmentPayload = useAssessmentStore((state) => state.getAssessmentPayload);
  const transcript = useAssessmentStore((state) => state.transcript);
  const addMovementResult = useAssessmentStore((state) => state.addMovementResult);
  const updateChiefComplaint = useAssessmentStore((state) => state.updateChiefComplaint);
  const updatePain = useAssessmentStore((state) => state.updatePain);
  const updateFunctional = useAssessmentStore((state) => state.updateFunctional);
  const updateHistory = useAssessmentStore((state) => state.updateHistory);
  const updateMovementScreen = useAssessmentStore((state) => state.updateMovementScreen);

  // Voice store
  const { connectionState, speakingStatus, transcript: transcriptEntries, isMuted } = useVoiceStore();

  // Save assessment when complete
  const saveAssessment = React.useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = getAssessmentPayload();
      const transcriptText = transcript
        .map((t) => `${t.role}: ${t.content}`)
        .join("\n");

      const response = await fetch("/api/assessments/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          transcript: transcriptText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save assessment");
      }

      const result = await response.json();
      console.log("[AssessmentPage] Assessment saved:", result);

      // Navigate to dashboard or results
      router.push("/dashboard");
    } catch (err) {
      console.error("[AssessmentPage] Save error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [getAssessmentPayload, transcript, router]);

  // Assessment Vapi integration
  const {
    start: startVapi,
    stop: stopVapi,
    isConnected,
    isSpeaking,
    setMuted,
    injectContext,
    currentPhase,
  } = useAssessmentVapi({
    onComplete: () => {
      console.log("[AssessmentPage] Assessment complete");
      // Auto-save when complete
      saveAssessment();
    },
    onRedFlag: () => {
      console.log("[AssessmentPage] Red flag detected");
    },
  });

  // Detect movement phase from transcript keywords
  React.useEffect(() => {
    if (!isMovementPhase && transcriptEntries.length > 0) {
      // Check recent assistant messages for movement keywords
      const recentMessages = transcriptEntries.slice(-5);
      for (const entry of recentMessages) {
        if (entry.role === "assistant") {
          const lowerContent = entry.content.toLowerCase();
          const hasMovementKeyword = MOVEMENT_KEYWORDS.some((kw) =>
            lowerContent.includes(kw.toLowerCase())
          );
          if (hasMovementKeyword) {
            console.log("[AssessmentPage] Movement phase detected from transcript");
            setIsMovementPhase(true);
            break;
          }
        }
      }
    }
  }, [transcriptEntries, isMovementPhase]);

  // Set exercise when entering movement phase
  React.useEffect(() => {
    if (isMovementPhase && currentMovementExercise) {
      console.log("[AssessmentPage] Setting movement exercise:", currentMovementExercise.name);
      setExercise(currentMovementExercise);
    } else if (!isMovementPhase) {
      resetExercise();
    }
  }, [isMovementPhase, currentMovementExercise, setExercise, resetExercise]);

  // Track previous rep count for detecting completion
  const prevRepCountRef = React.useRef(repCount);

  // Handle rep completion - signal voice to ask about pain
  React.useEffect(() => {
    if (isMovementPhase && repCount > prevRepCountRef.current && currentMovementExercise) {
      console.log("[AssessmentPage] Rep completed:", repCount);

      // Save movement result
      addMovementResult({
        exerciseSlug: currentMovementExercise.slug,
        exerciseName: currentMovementExercise.name,
        formScore,
        repCount,
      });

      // Signal voice coach that movement is complete
      injectContext(
        `[MOVEMENT COMPLETE] User completed ${currentMovementExercise.name}. Ask about pain: "Did that cause any pain? Where, and what number?"`
      );
    }
    prevRepCountRef.current = repCount;
  }, [repCount, isMovementPhase, currentMovementExercise, injectContext, formScore, addMovementResult]);

  // Map connection state to VoiceIndicator state
  const voiceState = React.useMemo((): VoiceState => {
    if (connectionState === "connecting") return "connecting";
    if (connectionState === "error") return "idle";
    if (connectionState === "disconnected") return "idle";
    if (speakingStatus === "speaking") return "speaking";
    if (speakingStatus === "thinking") return "thinking";
    return "listening";
  }, [connectionState, speakingStatus]);

  // Get latest transcript for display
  const displayTranscript = React.useMemo(() => {
    if (transcriptEntries.length === 0) {
      return isConnected ? "Listening..." : "Click 'Start Assessment' to begin";
    }
    // Show last assistant message
    const lastAssistant = [...transcriptEntries]
      .reverse()
      .find((t) => t.role === "assistant");
    return lastAssistant?.content || "Listening...";
  }, [transcriptEntries, isConnected]);

  // Auto-start Vapi when component mounts
  React.useEffect(() => {
    if (!isConnected) {
      startVapi();
    }
  }, [isConnected, startVapi]);

  // Handle start/stop
  const handleStartStop = async () => {
    if (isConnected) {
      stopVapi();
      resetAssessment();
      setIsMovementPhase(false);
    } else {
      await startVapi();
    }
  };

  // Handle exit
  const handleExit = () => {
    if (isConnected) {
      stopVapi();
    }
    resetAssessment();
    setIsMovementPhase(false);
    router.push("/assessment");
  };

  // Handle toggle mute
  const handleToggleMute = () => {
    setMuted(!isMuted);
  };

  // Handle skip - skip to next phase or complete
  const handleSkip = () => {
    if (!isMovementPhase && currentPhase === "interview") {
      // Skip interview → trigger movement phase WITHOUT voice
      console.log("[AssessmentPage] Skipping to movement phase (no voice)");

      // Stop voice if connected
      if (isConnected) {
        stopVapi();
      }

      // Populate default interview data
      updateChiefComplaint(DEFAULT_ASSESSMENT_DATA.chiefComplaint);
      updatePain(DEFAULT_ASSESSMENT_DATA.pain);
      updateFunctional(DEFAULT_ASSESSMENT_DATA.functional);
      updateHistory(DEFAULT_ASSESSMENT_DATA.history);

      // Trigger movement phase
      setIsMovementPhase(true);
    } else if (isMovementPhase) {
      // Skip movement → go to dashboard (complete)
      console.log("[AssessmentPage] Skipping movement, completing assessment");
      updateMovementScreen(DEFAULT_ASSESSMENT_DATA.movementScreen);
      if (isConnected) {
        stopVapi();
      }
      router.push("/dashboard");
    } else {
      // Summary or other → complete
      console.log("[AssessmentPage] Completing assessment");
      if (isConnected) {
        stopVapi();
      }
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-100 to-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-sage-200/60 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Button>

            <h1 className="text-base font-bold text-foreground">
              Lower Back Assessment
            </h1>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isSaving}
              className="text-muted-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating plan...
                </>
              ) : !isMovementPhase && currentPhase === "interview" ? (
                "Skip to Movement"
              ) : (
                "Skip to Dashboard"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <main className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="grid grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-90px)]">
          {/* Left Panel - Step Indicator + Exercise Demo */}
          <div className="flex flex-col gap-4">
            {/* Step Indicator */}
            <Card className="p-4 flex-shrink-0">
              <StepIndicator steps={STEPS} currentStep={currentPhase} />
            </Card>

            {/* Exercise Demo - more vertical space */}
            <Card className="flex-1 overflow-hidden">
              <ExerciseDemoPlaceholder />
            </Card>
          </div>

          {/* Center Panel - Camera */}
          <div className="relative">
            <Card className="h-full overflow-hidden shadow-lg border-sage-200">
              {isMovementPhase && currentMovementExercise ? (
                <ExerciseCamera
                  exercise={currentMovementExercise}
                  isPaused={false}
                  className="h-full w-full"
                />
              ) : (
                <CameraPlaceholder />
              )}
            </Card>

            {/* Red flag warning overlay */}
            {hasRedFlag && (
              <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center z-10">
                <Card className="p-6 max-w-sm border-destructive/50 bg-white">
                  <h2 className="text-lg font-semibold text-destructive mb-2">
                    Medical Evaluation Recommended
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Based on your responses, we recommend seeing a healthcare provider
                    before starting exercises. Your safety is our priority.
                  </p>
                </Card>
              </div>
            )}

            {/* Completion overlay */}
            {isComplete && !hasRedFlag && (
              <div className="absolute inset-0 bg-sage-50/90 backdrop-blur-sm flex items-center justify-center z-10">
                <Card className="p-6 max-w-sm border-sage-300">
                  <h2 className="text-lg font-semibold text-sage-700 mb-2">
                    Assessment Complete
                  </h2>
                  {isSaving ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating your personalized recovery plan...
                      </div>
                      <p className="text-xs text-muted-foreground/70">
                        This may take up to a minute
                      </p>
                    </div>
                  ) : saveError ? (
                    <div className="space-y-3">
                      <p className="text-sm text-destructive">{saveError}</p>
                      <Button onClick={saveAssessment} variant="ghost" size="sm">
                        Retry Save
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Great job! Your personalized plan is ready.
                      </p>
                      <Button onClick={() => router.push("/dashboard")}>
                        Go to Dashboard
                      </Button>
                    </>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Right Panel - Instructions + Voice Coach */}
          <div className="flex flex-col h-full gap-4">
            {/* Phase Instructions */}
            <Card className="p-4 flex-shrink-0">
              {isMovementPhase && currentMovementExercise ? (
                <MovementInstructions exercise={currentMovementExercise} />
              ) : currentPhase === "summary" ? (
                <SummaryInstructions />
              ) : (
                <InterviewInstructions />
              )}
            </Card>

            {/* Voice Coach */}
            <AssessmentStatsPanel
              voiceState={voiceState}
              transcript={displayTranscript}
              isConnected={isConnected}
              isMuted={isMuted}
              onStartVoice={handleStartStop}
              onStopVoice={() => {
                stopVapi();
                resetAssessment();
                setIsMovementPhase(false);
              }}
              onToggleMute={handleToggleMute}
              isMovementPhase={isMovementPhase}
              repCount={repCount}
              formScore={formScore}
              exercisePhase={exercisePhase}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
