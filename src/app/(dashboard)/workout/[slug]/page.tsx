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
      router.push(`/workout/${slug}/complete?score=${formScore}&reps=${repCount}`);
    }
  }, [repCount, router, sessionState, slug, targetReps, formScore]);

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
  const handleConfirmEnd = () => router.push(`/workout/${slug}/complete?score=${formScore}&reps=${repCount}`);

  const handleStartVoice = () => {
    startVapi(undefined, {
      sessionId,
      exerciseId: exercise?.id,
      exerciseName: exercise?.name,
      targetReps,
    });
  };

  return (
    <div className="sanctuary-paused min-h-screen bg-gradient-to-b from-sand-100 to-background">
      {/* Minimal Session Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{exercise.name}</h1>
              <p className="text-xs text-muted-foreground capitalize">
                {exercise.category.replace(/_/g, " ")}
              </p>
            </div>

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

      {/* Main Content - Two Column Layout (Controls Left, Vertical Camera Right) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column: Coach, Metrics & Info */}
          <div className="space-y-6">
            {/* Voice Coach Card */}
            <Card className="p-6 flex flex-col bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Voice Coach</h2>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMuted(!isMuted)}
                      className="h-8 w-8 p-0"
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Badge variant="outlined" className="bg-white/50">
                    {voiceState === "listening" ? "Listening..." : voiceState === "speaking" ? "Speaking" : voiceState}
                  </Badge>
                </div>
              </div>

              {/* Voice Visualization Area */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 min-h-[160px]">
                <VoiceIndicator state={voiceState} size="lg" />
              </div>

              {/* Transcript Bubble */}
              <div className="space-y-3 mt-4">
                <div className="relative">
                  <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-sage-200 transform rotate-45 z-10"></div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm relative z-0">
                    <p className="text-sm text-sage-800 font-medium leading-relaxed">
                      "{transcript}"
                    </p>
                  </div>
                </div>

                {/* Voice Control Button */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  {!isConnected ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => startVapi(undefined, {
                        sessionId,
                        exerciseId: exercise?.id,
                        exerciseName: exercise?.name,
                        targetReps,
                      })}
                      disabled={connectionState === 'connecting'}
                      className="w-full gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      {connectionState === 'connecting' ? 'Connecting...' : 'Start Voice Coach'}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => stopVapi()}
                      className="w-full gap-2"
                    >
                      <X className="h-4 w-4" />
                      Stop Voice Coach
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Rep Counter */}
              <Card className="p-4 flex items-center justify-center bg-white/80">
                <RepCounter current={repCount} target={targetReps} size="default" />
              </Card>

              {/* Form Score */}
              <Card className="p-4 bg-white/80">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Form Score</p>
                  <ProgressRing
                    value={formScore}
                    size="default"
                    color={getFormScoreColor(formScore)}
                  />
                  <p
                    className={cn(
                      "text-xs font-medium text-center",
                      formScore >= 70 ? "text-sage-600" : "text-coral-600"
                    )}
                  >
                    {getFormFeedback(formScore)}
                  </p>
                </div>
              </Card>

              {/* Phase Indicator */}
              <Card className="p-4 bg-white/80">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Phase</p>
                  <Badge variant="active" size="default" className="uppercase">
                    {phase}
                  </Badge>
                  {exercise.detection_config?.phases && (
                    <p className="text-xs text-muted-foreground text-center line-clamp-1">
                      Next: {exercise.detection_config.phases[(exercise.detection_config.phases.indexOf(phase) + 1) % exercise.detection_config.phases.length]}
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Exercise Instructions (Collapsible) */}
            <Card className="bg-white/50">
              <Collapsible defaultOpen={false} className="p-4">
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80">
                  <span className="text-base font-semibold">Exercise Instructions</span>
                  <div className="h-px bg-sage-200 flex-1 ml-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-4 mt-4 pt-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        How to Perform:
                      </h3>
                      <ol className="space-y-3">
                        {exercise.instructions.map((instruction, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold text-xs border border-sage-200">
                              {i + 1}
                            </span>
                            <span className="text-sage-700 leading-relaxed">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {exercise.common_mistakes.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-sage-100">
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          Common Mistakes:
                        </h3>
                        <ul className="space-y-2">
                          {exercise.common_mistakes.map((mistake, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm bg-coral-50/50 p-2 rounded-lg text-coral-800">
                              <AlertTriangle className="w-4 h-4 text-coral-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Right Column: Vertical Camera */}
          <div className="space-y-4">
            <div className="relative">
              <Card className="overflow-hidden shadow-lg">
                <ExerciseCamera
                  exercise={exercise}
                  isPaused={isPaused}
                  className="h-[600px] w-full"
                >
                  {/* Guide Image Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 right-4 gap-1.5 shadow-sm"
                    onClick={() => setShowGuideImage(!showGuideImage)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Guide
                  </Button>

                  {/* Paused Overlay */}
                  {isPaused && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/90">
                          <Pause className="w-12 h-12 text-sage-600" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-xl">Paused</p>
                          <p className="text-white/80 text-sm mt-1">
                            Press Resume to continue
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={handlePauseToggle}
                          className="gap-2"
                        >
                          <Play className="h-5 w-5" />
                          Resume Workout
                        </Button>
                      </div>
                    </div>
                  )}
                </ExerciseCamera>
              </Card>

              {/* Guide Image Overlay */}
              {showGuideImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                  <Card className="max-w-xs mx-4 p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => setShowGuideImage(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="space-y-3 pt-2">
                      <h3 className="font-bold text-base">Reference Guide</h3>
                      <div className="aspect-[3/4] bg-gradient-to-br from-sage-100 to-sage-200 rounded-lg flex items-center justify-center">
                        <p className="text-sage-600 text-xs text-center px-4">
                          Exercise illustration
                        </p>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {exercise.instructions.slice(0, 3).map((instruction, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-sage-500 font-bold">•</span>
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </div>
              )}
            </div>
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
