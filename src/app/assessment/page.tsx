"use client";

import * as React from "react";
import Link from "next/link";
import { Pause, Play, X, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepCounter } from "@/components/ui/rep-counter";
import { SessionTimer } from "@/components/ui/session-timer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import exercisesData from "@/lib/exercises/data.json";
import type { Exercise } from "@/lib/exercises/types";
import { ExerciseCamera } from "@/components/workout";
import { useExerciseStore } from "@/stores/exercise-store";
import {
  selectFormScore,
  selectPhase,
  selectRepCount,
} from "@/stores/exercise-store-selectors";

type SessionState = "active" | "paused" | "complete";

const ASSESSMENT_SLUGS = [
  "standing-lumbar-flexion",
  "standing-lumbar-extension",
  "standing-lumbar-side-bending",
];

type AssessmentResult = {
  slug: string;
  name: string;
  score: number;
};

export default function AssessmentPage() {
  const exercises = React.useMemo(() => {
    const list = exercisesData.exercises as Exercise[];
    return ASSESSMENT_SLUGS.map((slug) => list.find((ex) => ex.slug === slug)).filter(
      (exercise): exercise is Exercise => Boolean(exercise)
    );
  }, []);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [sessionState, setSessionState] = React.useState<SessionState>("active");
  const [isPaused, setIsPaused] = React.useState(false);
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [showGuideImage, setShowGuideImage] = React.useState(false);
  const [scoreSamples, setScoreSamples] = React.useState<number[]>([]);
  const [assessmentResults, setAssessmentResults] = React.useState<AssessmentResult[]>([]);
  const [startTime] = React.useState(new Date());

  const currentExercise = exercises[currentIndex];

  const repCount = useExerciseStore(selectRepCount);
  const formScore = useExerciseStore(selectFormScore);
  const phase = useExerciseStore(selectPhase);
  const setExercise = useExerciseStore((state) => state.setExercise);
  const resetExercise = useExerciseStore((state) => state.reset);

  React.useEffect(() => {
    if (!currentExercise) return;
    resetExercise();
    setExercise(currentExercise);
    setScoreSamples([]);
  }, [currentExercise, resetExercise, setExercise]);

  React.useEffect(() => {
    if (sessionState !== "active" || isPaused) return;
    if (!currentExercise) return;
    if (phase !== "neutral" && phase !== "return") {
      setScoreSamples((prev) => {
        const next = prev.length >= 60 ? prev.slice(1) : prev;
        return [...next, formScore];
      });
    }
  }, [currentExercise, formScore, isPaused, phase, sessionState]);

  React.useEffect(() => {
    if (!currentExercise || sessionState !== "active") return;
    const targetReps = currentExercise.default_reps || 1;
    if (repCount < targetReps) return;
    if (assessmentResults.some((result) => result.slug === currentExercise.slug)) return;

    const averageScore =
      scoreSamples.length > 0
        ? Math.round(scoreSamples.reduce((sum, score) => sum + score, 0) / scoreSamples.length)
        : Math.round(formScore);

    setAssessmentResults((prev) => [
      ...prev,
      {
        slug: currentExercise.slug,
        name: currentExercise.name,
        score: averageScore,
      },
    ]);
  }, [
    assessmentResults,
    currentExercise,
    formScore,
    repCount,
    scoreSamples,
    sessionState,
  ]);

  React.useEffect(() => {
    if (!currentExercise || sessionState !== "active") return;
    if (!assessmentResults.some((result) => result.slug === currentExercise.slug)) return;

    const timer = setTimeout(() => {
      if (currentIndex < exercises.length - 1) {
        resetExercise();
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionState("complete");
        resetExercise();
      }
    }, 1500); // 1.5s delay to show "Complete!"

    return () => clearTimeout(timer);
  }, [
    assessmentResults,
    currentExercise,
    currentIndex,
    exercises.length,
    resetExercise,
    sessionState,
  ]);

  if (exercises.length !== ASSESSMENT_SLUGS.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">
            Assessment exercises are missing. Please check the exercise data.
          </p>
        </Card>
      </div>
    );
  }

  const averageAssessmentScore =
    assessmentResults.length > 0
      ? Math.round(
          assessmentResults.reduce((sum, result) => sum + result.score, 0) /
            assessmentResults.length
        )
      : 0;

  const getFormScoreColor = (score: number): "sage" | "coral" => {
    return score >= 70 ? "sage" : "coral";
  };

  const getFormFeedback = (score: number): string => {
    if (score >= 90) return "Excellent alignment";
    if (score >= 70) return "Good control";
    if (score >= 50) return "Adjust and try again";
    return "Pause - reset your posture";
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEnd = () => {
    setSessionState("complete");
    resetExercise();
  };

  if (sessionState === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-100 to-background">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-sage-200/60 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-lg font-bold text-foreground">Assessment Complete</h1>
                <p className="text-xs text-muted-foreground">Lumbar mobility screening</p>
              </div>
              <SessionTimer startTime={startTime} isPaused={false} size="default" />
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Card className="p-6 bg-white/80 border-sage-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Your Summary</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scores reflect your movement control and range during each stretch.
                  </p>
                </div>
                <ProgressRing
                  value={averageAssessmentScore}
                  size="lg"
                  color={getFormScoreColor(averageAssessmentScore)}
                />
              </div>
            </Card>

            <Card className="p-6 bg-white/80 border-sage-200">
              <div className="space-y-4">
                {assessmentResults.map((result) => (
                  <div key={result.slug} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{result.name}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <Badge
                      variant={result.score >= 70 ? "success" : "warning"}
                      size="sm"
                    >
                      {result.score}%
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Assessment exercise not found.</p>
        </Card>
      </div>
    );
  }

  const targetReps = currentExercise.default_reps || 1;
  const assessmentStep = `${currentIndex + 1} of ${exercises.length}`;

  return (
    <div className="sanctuary-paused min-h-screen bg-gradient-to-b from-sand-100 to-background">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-sage-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{currentExercise.name}</h1>
              <p className="text-xs text-muted-foreground">
                Lumbar Assessment • Step {assessmentStep}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <SessionTimer startTime={startTime} isPaused={isPaused} size="default" />
              <Button variant="ghost" size="sm" onClick={handlePauseToggle} className="gap-1.5">
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
                End Assessment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <Card className="p-6 bg-white/50 backdrop-blur-sm border-sage-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Assessment Progress</h2>
                <Badge variant="outlined" className="bg-white/60">
                  Step {assessmentStep}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {exercises.map((exercise, index) => {
                  const isComplete = assessmentResults.some((result) => result.slug === exercise.slug);
                  const isCurrent = index === currentIndex;
                  return (
                    <div
                      key={exercise.slug}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-medium",
                        isComplete
                          ? "bg-sage-100 border-sage-200 text-sage-700"
                          : isCurrent
                            ? "bg-white border-sage-300 text-foreground"
                            : "bg-white/60 border-sage-200 text-muted-foreground"
                      )}
                    >
                      {exercise.name}
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 flex items-center justify-center bg-white/80">
                <RepCounter current={repCount} target={targetReps} size="default" />
              </Card>

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

              <Card className="p-4 bg-white/80">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Phase</p>
                  <Badge variant="active" size="default" className="uppercase">
                    {phase}
                  </Badge>
                  {currentExercise.detection_config?.phases && (
                    <p className="text-xs text-muted-foreground text-center line-clamp-1">
                      Next:{" "}
                      {
                        currentExercise.detection_config.phases[
                          (currentExercise.detection_config.phases.indexOf(phase) + 1) %
                            currentExercise.detection_config.phases.length
                        ]
                      }
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <Card className="bg-white/50">
              <Collapsible defaultOpen={false} className="p-4">
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80">
                  <span className="text-base font-semibold">Assessment Instructions</span>
                  <div className="h-px bg-sage-200 flex-1 ml-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-4 mt-4 pt-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        How to Perform:
                      </h3>
                      <ol className="space-y-3">
                        {currentExercise.instructions.map((instruction, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold text-xs border border-sage-200">
                              {i + 1}
                            </span>
                            <span className="text-sage-700 leading-relaxed">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {currentExercise.common_mistakes.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-sage-100">
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          Common Mistakes:
                        </h3>
                        <ul className="space-y-2">
                          {currentExercise.common_mistakes.map((mistake, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm bg-coral-50/50 p-2 rounded-lg text-coral-800"
                            >
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

          <div className="space-y-4">
            <div className="relative">
              <Card className="overflow-hidden shadow-lg border-sage-200">
                <ExerciseCamera
                  exercise={currentExercise}
                  isPaused={isPaused}
                  className="h-[600px] w-full"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 right-4 gap-1.5 shadow-sm"
                    onClick={() => setShowGuideImage(!showGuideImage)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Guide
                  </Button>

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
                        <Button variant="secondary" size="lg" onClick={handlePauseToggle}>
                          <Play className="h-5 w-5 mr-2" />
                          Resume Assessment
                        </Button>
                      </div>
                    </div>
                  )}
                </ExerciseCamera>
              </Card>

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
                          Assessment illustration
                        </p>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {currentExercise.instructions.slice(0, 3).map((instruction, i) => (
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

      <ConfirmDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        title="End this assessment?"
        description={`You've completed ${repCount}/${targetReps} reps for this step.`}
        confirmLabel="End Assessment"
        cancelLabel="Cancel"
        onConfirm={handleConfirmEnd}
        variant="destructive"
      />
    </div>
  );
}
