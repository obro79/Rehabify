"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Pause, Play, X, MicOff, Mic, Volume2, AlertTriangle, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionTimer } from "@/components/ui/session-timer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import { RepCounter } from "@/components/ui/rep-counter";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import exercisesData from "@/lib/exercises/data.json";
import { ExerciseCamera } from "@/components/workout";
import { getExerciseVideoUrl } from "@/lib/exercises/video-map";
import { useExerciseStore } from "@/stores/exercise-store";
import {
  selectFormScore,
  selectPhase,
  selectRepCount,
  selectActiveErrors,
} from "@/stores/exercise-store-selectors";
import type { Exercise } from "@/lib/exercises/types";
import { getFormScoreColor, getFormFeedback } from "@/lib/exercise-utils";
import { useVapi } from "@/hooks/use-vapi";
import { useFormEventBridge } from "@/hooks/use-form-event-bridge";
import { useVoiceStore } from "@/stores/voice-store";
import type { PlanStructure, PlanExercise } from "@/lib/gemini/types";

type SessionState = "active" | "paused" | "complete";
type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";
type VoicePhase = "explaining" | "analyzing" | "finished";

interface PlanContext {
  planName: string;
  currentWeekFocus: string;
  currentWeekNotes: string;
  exercises: PlanExercise[];
  currentIndex: number;
  totalExercises: number;
  nextExercise?: { name: string; slug: string };
}

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Find exercise by slug
  const exercise = React.useMemo(() => {
    const exercises = exercisesData.exercises as Exercise[];
    return exercises.find((ex) => ex.slug === slug);
  }, [slug]);

  // Plan context for voice coach and session saving
  const [planContext, setPlanContext] = React.useState<PlanContext | null>(null);
  const [planId, setPlanId] = React.useState<string | null>(null);

  // Fetch plan context on mount
  React.useEffect(() => {
    async function fetchPlanContext() {
      try {
        const response = await fetch("/api/patient-records");
        if (!response.ok) return;
        const result = await response.json();
        const data = result.data || result;
        const plans = data?.plans || [];
        if (plans.length === 0) return;

        const activePlan = plans.find(
          (p: { status: string }) => p.status === "approved"
        ) || plans[0];

        if (!activePlan?.structure) return;
        setPlanId(activePlan.id);

        let structure: PlanStructure;
        if (typeof activePlan.structure === "string") {
          structure = JSON.parse(activePlan.structure);
        } else {
          structure = activePlan.structure as PlanStructure;
        }

        if (!structure?.weeks?.[0]?.exercises) return;

        const week = structure.weeks[0];
        const sorted = [...week.exercises].sort((a, b) => a.order - b.order);
        const currentIdx = sorted.findIndex((e) => e.exerciseSlug === slug);

        const nextEx = currentIdx >= 0 && currentIdx < sorted.length - 1
          ? sorted[currentIdx + 1]
          : undefined;

        setPlanContext({
          planName: activePlan.name || "Rehabilitation Plan",
          currentWeekFocus: week.focus,
          currentWeekNotes: week.notes,
          exercises: sorted,
          currentIndex: currentIdx >= 0 ? currentIdx : 0,
          totalExercises: sorted.length,
          nextExercise: nextEx
            ? { name: nextEx.name, slug: nextEx.exerciseSlug }
            : undefined,
        });
      } catch (err) {
        console.error("[WorkoutPage] Failed to fetch plan context:", err);
      }
    }
    fetchPlanContext();
  }, [slug]);

  // Session state
  const [sessionState, setSessionState] = React.useState<SessionState>("active");
  const [isPaused, setIsPaused] = React.useState(false);
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [showGuideImage, setShowGuideImage] = React.useState(false);
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

  // Check if exercise has a demo video
  const demoVideoUrl = exercise ? getExerciseVideoUrl(exercise.slug) : null;

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
    nextExercise: planContext?.nextExercise || null,
    planName: planContext?.planName,
    commonMistakes: exercise?.common_mistakes,
    exerciseInstructions: exercise?.instructions,
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

  // Inline Vapi assistant config with exercise-specific system prompt
  const workoutAssistantConfig = React.useMemo(() => {
    if (!exercise) return null;

    const planInfo = planContext
      ? `The user is on exercise ${planContext.currentIndex + 1} of ${planContext.totalExercises} in their "${planContext.planName}" plan.`
      : "";

    const formCorrectionPhrases = exercise.common_mistakes.map((m: string) => {
      const key = m.toLowerCase().replace(/\s+/g, "_").slice(0, 30);
      return `- "${key}" → "${m.startsWith("Not") || m.startsWith("Excessive") ? m.replace(/^(Not |Excessive )/, "Try more ") : `Watch your ${m.toLowerCase()}`}"`;
    }).join("\n");

    const systemPrompt = `# CURRENT EXERCISE: ${exercise.name.toUpperCase()}

Name: ${exercise.name}
Target: ${exercise.target_area?.replace(/_/g, " ") || exercise.category.replace(/_/g, " ")}
${planInfo}
Difficulty: ${exercise.difficulty}
Reps: ${targetReps}
${exercise.rep_type === "hold" ? `Hold: ${exercise.default_hold_seconds}s per rep` : ""}

Key Instructions:
${exercise.instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join("\n")}

Common Mistakes to Watch:
${exercise.common_mistakes.map((m: string) => `- ${m}`).join("\n")}

ONLY discuss this exercise. Do not mention any other exercises.

## VOICE STYLE

- Calm, reassuring, clinical but warm
- Speak at a measured pace - never rush
- Use natural pauses between instructions
- Your tone should feel like a warm hug, not a drill sergeant

## SESSION WORKFLOW

1. Greet user: "Hi! Today we're working on ${exercise.name}"
2. Give ONE key cue based on the exercise instructions above
3. Ask: "Ready to start?"
4. Wait for confirmation, then say: "Great, let's go - I'm watching your form"
5. Provide brief feedback when you receive system messages
6. At session end, give a warm closing

## RESPONSE LENGTH

DURING ACTIVE MOVEMENT:
- Maximum 5-15 words per response
- Examples: "Good... keep breathing...", "Nice and slow", "Great form, keep going"

DURING REST:
- 1-3 sentences, check how they're feeling

## FORM CORRECTIONS

IMPORTANT: When you receive [FORM FEEDBACK NEEDED], respond VERBALLY only.
Do NOT call any tools - just speak the correction directly.

Common corrections for ${exercise.name}:
${formCorrectionPhrases}

## SYSTEM MESSAGES

Respond naturally - don't read out the message type:
[EXERCISE INTRO] - Greet and explain briefly
[EXERCISE STARTING] - User is ready, start coaching
[FORM FEEDBACK NEEDED] - Give ONE brief correction (5-15 words). DO NOT use tools.
[REP COMPLETED] - Brief acknowledgment
[SESSION END] - Warm closing

## THINGS YOU MUST NEVER DO

- Never mention any exercise except ${exercise.name}
- Never say "wrong," "bad," or "incorrect"
- Never give more than one correction at a time
- Never speak for more than 15 seconds during movement
- Never call tools when receiving form feedback - just speak

## PAIN HANDLING

MILD: "Let's take a moment there."
MODERATE: "Let's stop and rest. We can modify this."
SEVERE: "Please stop completely. That's not something to push through."

Remember: Every interaction should leave them feeling supported and capable.`;

    return {
      name: "Rehabify Exercise Coach",
      firstMessage: `Hi! Today we're working on ${exercise.name}. ${exercise.description} Ready to get started?`,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: { provider: "11labs", voiceId: "sarah" },
      transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 900,
    };
  }, [exercise, planContext, targetReps]);

  // Exercise intro context (plan-aware, full exercise coaching data)
  const exerciseIntroContext = React.useMemo(() => {
    if (!exercise) return null;

    const planInfo = planContext
      ? `\nPlan: "${planContext.planName}" - Exercise ${planContext.currentIndex + 1} of ${planContext.totalExercises}
Today's exercises: ${planContext.exercises.map((e, i) => `${i + 1}. ${e.name}${e.exerciseSlug === slug ? " (current)" : ""}`).join(", ")}
Week focus: ${planContext.currentWeekNotes}
Sets: ${planContext.exercises[planContext.currentIndex]?.sets || 2}, Reps: ${planContext.exercises[planContext.currentIndex]?.reps || targetReps}${planContext.exercises[planContext.currentIndex]?.holdSeconds ? `, Hold: ${planContext.exercises[planContext.currentIndex].holdSeconds}s` : ""}`
      : "";

    // Build rep type instructions
    const repInfo = exercise.rep_type === "hold" || exercise.rep_type === "timed_hold"
      ? `Rep type: Hold for ${exercise.default_hold_seconds} seconds each rep`
      : exercise.rep_type === "alternating"
        ? `Rep type: Alternating sides`
        : exercise.rep_type === "per_side"
          ? `Rep type: Do each side separately`
          : `Rep type: Standard reps`;

    return `[EXERCISE INTRO]
Exercise: ${exercise.name}
Category: ${exercise.category.replace(/_/g, " ")}
Target area: ${exercise.target_area?.replace(/_/g, " ") || exercise.category.replace(/_/g, " ")}
Difficulty: ${exercise.difficulty}
${repInfo}
Default: ${exercise.default_sets} sets x ${exercise.default_reps} reps${exercise.default_hold_seconds > 0 ? `, ${exercise.default_hold_seconds}s hold` : ""}
Equipment: ${exercise.equipment === "none" ? "No equipment needed" : exercise.equipment.replace(/_/g, " ")}
${planInfo}

DESCRIPTION: ${exercise.description}

STEP-BY-STEP INSTRUCTIONS (use these to guide the user):
${exercise.instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}

COMMON MISTAKES TO WATCH FOR:
${exercise.common_mistakes.map((m) => `- ${m}`).join("\n")}

MODIFICATIONS:
- Easier: ${exercise.modifications.easier}
- Harder: ${exercise.modifications.harder}

${exercise.contraindications.length > 0 ? `CONTRAINDICATIONS (stop if relevant): ${exercise.contraindications.join(", ")}` : ""}

YOUR COACHING APPROACH:
1. Greet the user${planContext ? ` and tell them this is exercise ${planContext.currentIndex + 1} of ${planContext.totalExercises} in their plan` : ""}.
2. Briefly describe what the exercise is and what it targets (1-2 sentences).
3. Walk them through the starting position (use the instructions above).
4. Give them ONE key cue to focus on.
5. Ask: "Ready to start?" and wait for confirmation.
Keep it conversational and encouraging. Don't read the full list - summarize naturally.`;
  }, [exercise, planContext, slug, targetReps]);

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

  // Inject analyze context with exercise-specific coaching reminders
  React.useEffect(() => {
    if (voicePhase === "analyzing" && isConnected && exercise) {
      const repTypeReminder = exercise.rep_type === "hold" || exercise.rep_type === "timed_hold"
        ? `This is a hold exercise - count to ${exercise.default_hold_seconds} for each rep.`
        : exercise.rep_type === "alternating"
          ? `This is an alternating exercise - coach both sides.`
          : "";
      const mistakesReminder = exercise.common_mistakes.length > 0
        ? `\nWatch for: ${exercise.common_mistakes.slice(0, 2).join("; ")}`
        : "";

      const context = `[EXERCISE STARTING]
The user is ready to begin ${exercise.name}. Say "Great, let's go - I'm watching your form."
${repTypeReminder}${mistakesReminder}
From now on, give brief form corrections when I send you [FORM FEEDBACK NEEDED] messages.
Keep corrections to 5-15 words max. Focus on what TO do, not what's wrong.
Use your knowledge of ${exercise.name} to give relevant cues.`;
      console.log("[WorkoutPage] Transitioning to analyze phase");
      injectContext(context);
    }
  }, [voicePhase, isConnected, injectContext, exercise]);

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

  // Save session to API
  const saveSessionRef = React.useRef(false);
  const saveSession = React.useCallback(async (finalReps: number, finalScore: number) => {
    if (saveSessionRef.current) return; // Prevent double-save
    saveSessionRef.current = true;

    const durationSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: slug,
          exerciseName: exercise?.name || slug,
          category: exercise?.category?.replace(/_/g, " ") || "general",
          formScore: finalScore,
          repsCompleted: finalReps,
          targetReps,
          durationSeconds,
          planId: planId || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store session result for the complete page
        sessionStorage.setItem("lastSessionResult", JSON.stringify(result.data));
        // Store plan context for the complete page
        if (planContext) {
          sessionStorage.setItem("lastPlanContext", JSON.stringify(planContext));
        }
      }
    } catch (err) {
      console.error("[WorkoutPage] Failed to save session:", err);
    }
  }, [slug, exercise, targetReps, startTime, planId, planContext]);

  // Auto-complete when target reps reached
  React.useEffect(() => {
    if (sessionState !== "active") return;
    if (repCount >= targetReps) {
      setSessionState("complete");
      saveSession(repCount, formScore).then(() => {
        router.push(`/workout/${slug}/complete?score=${formScore}&reps=${repCount}`);
      });
    }
  }, [repCount, router, sessionState, slug, targetReps, formScore, saveSession]);

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
  const handleConfirmEnd = () => {
    saveSession(repCount, formScore).then(() => {
      router.push(`/workout/${slug}/complete?score=${formScore}&reps=${repCount}`);
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

      {/* Main Content - Layout adapts based on whether demo video exists */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={cn(
          "grid grid-cols-1 gap-6",
          demoVideoUrl
            ? "lg:grid-cols-[280px_1fr_400px]"  // 3-column: Demo Video | Controls | Camera
            : "lg:grid-cols-[1fr_400px]"         // 2-column: Controls | Camera
        )}>
          {/* Demo Video Panel (only shown when video exists) */}
          {demoVideoUrl && (
            <div className="hidden lg:block">
              <Card className="overflow-hidden shadow-lg sticky top-20">
                <div className="aspect-[3/4] bg-black relative">
                  <video
                    src={demoVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-sage-700">
                      Demo
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm font-medium text-sage-800">{exercise?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Follow along with the video</p>
                </div>
              </Card>
            </div>
          )}

          {/* Middle Column: Coach, Metrics & Info */}
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
                      &ldquo;{transcript}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Voice Control Button */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  {!isConnected ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => startVapi(workoutAssistantConfig as unknown as string, {
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

              {/* Guide Image/Video Overlay */}
              {showGuideImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                  <Card className="max-w-xs mx-4 p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6 z-10"
                      onClick={() => setShowGuideImage(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="space-y-3 pt-2">
                      <h3 className="font-bold text-base">Reference Guide</h3>
                      <div className="aspect-[3/4] bg-gradient-to-br from-sage-100 to-sage-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {getExerciseVideoUrl(exercise.slug) ? (
                          <video
                            src={getExerciseVideoUrl(exercise.slug)!}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <p className="text-sage-600 text-xs text-center px-4">
                            Exercise illustration
                          </p>
                        )}
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
