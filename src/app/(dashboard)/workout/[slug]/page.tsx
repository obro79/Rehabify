"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Pause, Play, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionTimer } from "@/components/ui/session-timer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import exercisesData from "@/lib/exercises/data.json";
import {
  ExerciseCamera,
  ExerciseDemoPanel,
  WorkoutStatsPanel,
} from "@/components/workout";
import { useExerciseStore } from "@/stores/exercise-store";
import {
  selectFormScore,
  selectPhase,
  selectRepCount,
  selectActiveErrors,
} from "@/stores/exercise-store-selectors";
import type { Exercise } from "@/lib/exercises/types";
import { useVapi } from "@/hooks/use-vapi";
import { useFormEventBridge } from "@/hooks/use-form-event-bridge";
import { useVoiceStore } from "@/stores/voice-store";

type SessionState = "active" | "paused" | "complete";
type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";
type VoicePhase = "explaining" | "analyzing" | "finished";

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Find exercise by slug
  const exercise = React.useMemo(() => {
    const exercises = exercisesData.exercises as Exercise[];
    return exercises.find((ex) => ex.slug === slug);
  }, [slug]);

  // Session state
  const [sessionState, setSessionState] = React.useState<SessionState>("active");
  const [isPaused, setIsPaused] = React.useState(false);
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [startTime] = React.useState(new Date());
  const [sessionId] = React.useState(
    () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );

  const repCount = useExerciseStore(selectRepCount);
  const formScore = useExerciseStore(selectFormScore);
  const phase = useExerciseStore(selectPhase);
  const activeErrors = useExerciseStore(selectActiveErrors);
  const setExercise = useExerciseStore((state) => state.setExercise);
  const resetExercise = useExerciseStore((state) => state.reset);
  const setExercisePhase = useExerciseStore((state) => state.setPhase);
  const incrementRep = useExerciseStore((state) => state.incrementRep);
  const targetReps = exercise?.default_reps || 10;

  // Voice coaching phase
  const [voicePhase, setVoicePhase] = React.useState<VoicePhase>("explaining");
  const voicePhaseRef = React.useRef<VoicePhase>("explaining");
  voicePhaseRef.current = voicePhase;

  const handleUserReady = React.useCallback(() => {
    if (voicePhaseRef.current === "explaining") {
      console.log("[WorkoutPage] User ready, transitioning to analyze phase");
      setVoicePhase("analyzing");
    }
  }, []);

  // Vapi integration
  const {
    start: startVapi,
    stop: stopVapi,
    isConnected,
    isSpeaking,
    setMuted,
    injectContext,
  } = useVapi({
    onUserReady: handleUserReady,
  });
  const {
    connectionState,
    speakingStatus,
    transcript: transcriptEntries,
    isMuted,
  } = useVoiceStore();

  // Form event bridge
  useFormEventBridge({
    injectContext,
    isConnected,
    isSpeaking,
    isAnalyzing: voicePhase === "analyzing",
    exerciseName: exercise?.name,
    targetReps,
  });

  // Voice state for UI
  const voiceState = React.useMemo((): VoiceState => {
    if (connectionState === "connecting") return "connecting";
    if (connectionState === "error") return "idle";
    if (connectionState === "disconnected") return "idle";
    if (speakingStatus === "speaking") return "speaking";
    if (speakingStatus === "thinking") return "thinking";
    return "listening";
  }, [connectionState, speakingStatus]);

  // Transcript for display
  const transcript = React.useMemo(() => {
    if (transcriptEntries.length === 0) {
      return isConnected ? "Listening..." : "Start voice coach for guidance";
    }
    return transcriptEntries.slice(-2).map((t) => t.content).join(" ");
  }, [transcriptEntries, isConnected]);

  // Exercise intro context
  const exerciseIntroContext = React.useMemo(() => {
    if (!exercise) return null;
    return `[EXERCISE INTRO]
Exercise: ${exercise.name}
Target area: ${exercise.target_area || exercise.category.replace(/_/g, " ")}
Key cue: ${exercise.instructions[0]}

Greet the user briefly. Tell them what exercise we're doing and give them ONE key thing to focus on.
Then ask: "Ready to start?"
Wait for their confirmation before we begin analyzing their form.`;
  }, [exercise]);

  // Inject context when connected
  const hasInjectedContext = React.useRef(false);
  React.useEffect(() => {
    if (isConnected && exerciseIntroContext && !hasInjectedContext.current) {
      hasInjectedContext.current = true;
      const timer = setTimeout(() => {
        console.log("[WorkoutPage] Injecting exercise intro context");
        injectContext(exerciseIntroContext);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!isConnected) {
      hasInjectedContext.current = false;
      setVoicePhase("explaining");
    }
  }, [isConnected, exerciseIntroContext, injectContext]);

  // Inject analyze context
  React.useEffect(() => {
    if (voicePhase === "analyzing" && isConnected) {
      const context = `[EXERCISE STARTING]
The user is ready to begin. Say "Great, let's go - I'm watching your form."
From now on, give brief form corrections when I send you [FORM FEEDBACK NEEDED] messages.
Keep corrections to 5-15 words max. Focus on what TO do, not what's wrong.`;
      console.log("[WorkoutPage] Transitioning to analyze phase");
      injectContext(context);
    }
  }, [voicePhase, isConnected, injectContext]);

  // Sync state for webhook
  React.useEffect(() => {
    if (!exercise || !isConnected) return;
    const syncState = async () => {
      try {
        await fetch("/api/session-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            formScore,
            activeErrors: activeErrors.map((e) => e.type),
            repCount,
            targetReps,
            phase,
            isTracking: true,
          }),
        });
      } catch (err) {
        console.error("[WorkoutPage] Failed to sync state:", err);
      }
    };
    syncState();
    const interval = setInterval(syncState, 1000);
    return () => clearInterval(interval);
  }, [exercise, isConnected, sessionId, formScore, activeErrors, repCount, phase, targetReps]);

  // Stop voice on unmount
  React.useEffect(() => {
    return () => {
      if (isConnected) stopVapi();
    };
  }, [isConnected, stopVapi]);

  // Set exercise in store
  React.useEffect(() => {
    if (!exercise) return;
    setExercise(exercise);
    return () => resetExercise();
  }, [exercise, resetExercise, setExercise]);

  // Auto-complete when target reps reached
  React.useEffect(() => {
    if (sessionState !== "active") return;
    if (repCount >= targetReps) {
      setSessionState("complete");
      router.push(`/workout/${slug}/complete`);
    }
  }, [repCount, router, sessionState, slug, targetReps]);

  // Demo mode for non-vision exercises
  React.useEffect(() => {
    if (!exercise || exercise.form_detection_enabled) return;
    if (sessionState !== "active" || isPaused) return;
    const phases = exercise.detection_config?.phases;
    let phaseIndex = 0;
    const interval = setInterval(() => {
      incrementRep();
      if (phases && phases.length > 0) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        setExercisePhase(phases[phaseIndex]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [exercise, incrementRep, isPaused, sessionState, setExercisePhase]);

  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Exercise not found</p>
        </Card>
      </div>
    );
  }

  const handlePauseToggle = () => setIsPaused(!isPaused);
  const handleEndSession = () => setShowEndDialog(true);
  const handleConfirmEnd = () => router.push(`/workout/${slug}/complete`);

  const handleStartVoice = () => {
    startVapi(undefined, {
      sessionId,
      exerciseId: exercise?.id,
      exerciseName: exercise?.name,
      targetReps,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-100 to-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-sage-200/60 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-base font-bold text-foreground">{exercise.name}</h1>

            <div className="flex items-center gap-3">
              <SessionTimer startTime={startTime} isPaused={isPaused} size="default" />

              <Button variant="ghost" size="sm" onClick={handlePauseToggle} className="gap-1.5">
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                )}
              </Button>

              <Button variant="destructive" size="sm" onClick={handleEndSession} className="gap-1.5">
                <X className="h-4 w-4" /> End
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <main className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="grid grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-90px)]">
          {/* Left Panel - Demo */}
          <ExerciseDemoPanel exercise={exercise} />

          {/* Center Panel - Camera */}
          <div className="relative">
            <Card className="h-full overflow-hidden shadow-lg border-sage-200">
              <ExerciseCamera exercise={exercise} isPaused={isPaused} className="h-full w-full">
                {/* Paused Overlay */}
                {isPaused && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/90">
                        <Pause className="w-10 h-10 text-sage-600" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">Paused</p>
                        <p className="text-white/80 text-sm mt-1">Press Resume to continue</p>
                      </div>
                      <Button variant="secondary" size="lg" onClick={handlePauseToggle} className="gap-2">
                        <Play className="h-5 w-5" /> Resume
                      </Button>
                    </div>
                  </div>
                )}
              </ExerciseCamera>
            </Card>
          </div>

          {/* Right Panel - Stats */}
          <WorkoutStatsPanel
            voiceState={voiceState}
            transcript={transcript}
            isConnected={isConnected}
            isMuted={isMuted}
            onStartVoice={handleStartVoice}
            onStopVoice={stopVapi}
            onToggleMute={() => setMuted(!isMuted)}
            repCount={repCount}
            targetReps={targetReps}
            formScore={formScore}
            phase={phase}
          />
        </div>
      </main>

      {/* End Dialog */}
      <ConfirmDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        title="End this session?"
        description={`You've completed ${repCount}/${targetReps} reps with an ${formScore}% form score.`}
        confirmLabel="End & Save"
        cancelLabel="Cancel"
        onConfirm={handleConfirmEnd}
        variant="destructive"
      />
    </div>
  );
}
