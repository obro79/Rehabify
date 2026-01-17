"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Pause, Play, X, Image as ImageIcon, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepCounter } from "@/components/ui/rep-counter";
import { SessionTimer } from "@/components/ui/session-timer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import { cn } from "@/lib/utils";
import exercisesData from "@/lib/exercises/data.json";

type SessionState = "active" | "paused" | "complete";
type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Find exercise by slug
  const exercise = React.useMemo(
    () => exercisesData.exercises.find((ex) => ex.slug === slug),
    [slug]
  );

  // Session state
  const [sessionState, setSessionState] = React.useState<SessionState>("active");
  const [isPaused, setIsPaused] = React.useState(false);
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [showGuideImage, setShowGuideImage] = React.useState(false);
  const [startTime] = React.useState(new Date());

  // Mock workout metrics
  const [currentReps, setCurrentReps] = React.useState(0);
  const [targetReps] = React.useState(exercise?.default_reps || 10);
  const [formScore] = React.useState(85);
  const [phase, setPhase] = React.useState<string>("neutral");
  const [voiceState, setVoiceState] = React.useState<VoiceState>("listening");
  const [transcript] = React.useState(
    "Nice and slow... hold that position... beautiful arch..."
  );

  // Consolidated simulation interval - combines rep counting, phase changes, and voice state
  React.useEffect(() => {
    if (sessionState !== "active" || isPaused) return;

    // Refs to avoid re-renders for internal counters
    const phaseIndexRef = { current: 0 };
    const voiceIndexRef = { current: 0 };
    const repTickRef = { current: 0 };
    const phaseTickRef = { current: 0 };
    const voiceTickRef = { current: 0 };

    const phases = exercise?.detection_config?.phases;
    const voiceStates: VoiceState[] = ["listening", "thinking", "speaking"];

    // Single interval running every 500ms
    const interval = setInterval(() => {
      repTickRef.current += 500;
      phaseTickRef.current += 500;
      voiceTickRef.current += 500;

      // Update reps every 3000ms (3 seconds)
      if (repTickRef.current >= 3000) {
        repTickRef.current = 0;
        setCurrentReps((prev) => {
          if (prev >= targetReps) {
            clearInterval(interval);
            setSessionState("complete");
            router.push(`/workout/${slug}/complete`);
            return prev;
          }
          return prev + 1;
        });
      }

      // Update phase every 2000ms (2 seconds)
      if (phases && phaseTickRef.current >= 2000) {
        phaseTickRef.current = 0;
        phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;
        setPhase(phases[phaseIndexRef.current]);
      }

      // Update voice state every 4000ms (4 seconds)
      if (voiceTickRef.current >= 4000) {
        voiceTickRef.current = 0;
        voiceIndexRef.current = (voiceIndexRef.current + 1) % voiceStates.length;
        setVoiceState(voiceStates[voiceIndexRef.current]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sessionState, isPaused, targetReps, slug, router, exercise]);

  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Exercise not found</p>
        </Card>
      </div>
    );
  }

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEnd = () => {
    router.push(`/workout/${slug}/complete`);
  };

  const getFormScoreColor = (score: number): "sage" | "coral" => {
    return score >= 70 ? "sage" : "coral";
  };

  const getFormFeedback = (score: number): string => {
    if (score >= 90) return "Perfect form!";
    if (score >= 70) return "Great spinal curve!";
    if (score >= 50) return "Try arching more";
    return "Pause - let me help";
  };

  return (
    <div className="sanctuary-paused min-h-screen bg-gradient-to-b from-sand-100 to-background">
      {/* Minimal Session Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-sage-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{exercise.name}</h1>
              <p className="text-xs text-muted-foreground capitalize">
                {exercise.category.replace(/_/g, " ")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <SessionTimer
                startTime={startTime}
                isPaused={isPaused}
                size="default"
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseToggle}
                className="gap-1.5"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Column: Voice Coach */}
          <Card className="p-6 flex flex-col">
            <h2 className="text-sm font-bold text-foreground mb-4">Voice Coach</h2>

            {/* Large Voice Indicator */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <VoiceIndicator state={voiceState} size="lg" showLabel />
            </div>

            {/* Transcript */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-sage-50 to-sage-100/50 rounded-xl p-4 border border-sage-200/60">
                <p className="text-sm text-sage-700 italic leading-relaxed">
                  {transcript}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-2 py-0.5 rounded bg-sage-100 border border-sage-200 font-mono text-xs">SPACE</kbd> to talk
                </p>
              </div>
            </div>
          </Card>

          {/* Right Column: Camera + Metrics */}
          <div className="space-y-4">
            {/* Camera Feed - Reduced Height */}
            <div className="relative">
              <Card className="overflow-hidden">
                <div
                  className={cn(
                    "relative bg-gradient-to-br from-sage-100 to-sage-200",
                    "flex items-center justify-center",
                    "h-[400px]"
                  )}
                >
                  {/* Placeholder content */}
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/50 backdrop-blur-sm">
                      <Volume2 className="w-10 h-10 text-sage-500" />
                    </div>
                    <p className="text-sage-700 font-medium">
                      Camera feed would appear here
                    </p>
                    <p className="text-sage-600 text-sm">
                      MediaPipe skeleton overlay with joint tracking
                    </p>
                  </div>

                  {/* Guide Image Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 right-4 gap-1.5"
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
                </div>
              </Card>

              {/* Guide Image Overlay */}
              {showGuideImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
                  <Card className="max-w-md mx-4 p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg">Reference Guide</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowGuideImage(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="aspect-video bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl flex items-center justify-center">
                        <p className="text-sage-600 text-sm">
                          Exercise illustration would appear here
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium text-sm text-foreground">Key Points:</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {exercise.instructions.slice(0, 3).map((instruction, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-sage-500 font-bold">•</span>
                              {instruction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Rep Counter */}
              <Card className="p-4 flex items-center justify-center">
                <RepCounter current={currentReps} target={targetReps} size="default" />
              </Card>

              {/* Form Score */}
              <Card className="p-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Form Score</p>
                  <ProgressRing
                    value={formScore}
                    size="default"
                    color={getFormScoreColor(formScore)}
                  />
                  <p
                    className={cn(
                      "text-xs font-medium",
                      formScore >= 70 ? "text-sage-600" : "text-coral-600"
                    )}
                  >
                    {getFormFeedback(formScore)}
                  </p>
                </div>
              </Card>

              {/* Phase Indicator */}
              <Card className="p-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Phase</p>
                  <Badge variant="active" size="default" className="uppercase">
                    {phase}
                  </Badge>
                  {exercise.detection_config?.phases && (
                    <p className="text-xs text-muted-foreground">
                      Next: {exercise.detection_config.phases[(exercise.detection_config.phases.indexOf(phase) + 1) % exercise.detection_config.phases.length]}
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Exercise Instructions (Collapsible) */}
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger>
                <span className="text-base font-semibold">Exercise Instructions</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 mt-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      How to Perform:
                    </h3>
                    <ol className="space-y-2">
                      {exercise.instructions.map((instruction, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold text-xs">
                            {i + 1}
                          </span>
                          <span className="text-sage-700">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {exercise.common_mistakes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        Common Mistakes to Avoid:
                      </h3>
                      <ul className="space-y-1.5">
                        {exercise.common_mistakes.map((mistake, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-coral-700">
                            <span className="text-coral-500 font-bold">•</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </main>

      {/* End Session Confirmation Dialog */}
      <ConfirmDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        title="End this session?"
        description={`You've completed ${currentReps}/${targetReps} reps with an ${formScore}% form score.`}
        confirmLabel="End & Save"
        cancelLabel="Cancel"
        onConfirm={handleConfirmEnd}
        variant="destructive"
      />
    </div>
  );
}
