"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Play, Home, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Progress } from "@/components/ui/progress";
import { StreakDisplay } from "@/components/ui/streak-display";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RepsIcon, TimerIcon, TrophyIcon } from "@/components/ui/icons";
import { CelebrationAnimation } from "@/components/ui/celebration-animation";
import { SanctuaryBackground } from "@/components/ui/sanctuary-background";

// Mock data - in production this would come from session state/API
const MOCK_SESSION_DATA = {
  exerciseName: "Cat-Camel",
  userName: "Sarah",
  formScore: 85,
  repsCompleted: 10,
  targetReps: 10,
  duration: "5:23",
  xpEarned: 125,
  currentLevel: 3,
  levelProgress: 67,
  currentXP: 325,
  nextLevelXP: 500,
  currentStreak: 6,
  bestStreak: 12,
  formBreakdown: [
    { metric: "Spine Curvature", score: 95, feedback: "Excellent!" },
    { metric: "Head Position", score: 82, feedback: "Good" },
    { metric: "Hip Alignment", score: 78, feedback: "Try keeping hips more stable" },
    { metric: "Movement Pace", score: 88, feedback: "Great control" },
  ],
  coachSummary:
    "Excellent session! Your spine mobility is improving. Focus on keeping your hips more stable during the camel phase next time. Overall, this was a great workout!",
  nextExercise: {
    name: "Cobra Extension",
    slug: "cobra",
    duration: "5 min",
  },
};

function getFormScoreMessage(score: number): string {
  if (score >= 90) return "Perfect form!";
  if (score >= 80) return "Great form!";
  if (score >= 70) return "Good work!";
  if (score >= 60) return "Keep practicing!";
  return "Review the basics";
}

function getFormScoreColor(score: number): "sage" | "coral" {
  return score >= 70 ? "sage" : "coral";
}

export default function SessionCompletePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isFormBreakdownOpen, setIsFormBreakdownOpen] = React.useState(false);
  const [showCelebration, setShowCelebration] = React.useState(true);

  const {
    exerciseName,
    userName,
    formScore,
    repsCompleted,
    targetReps,
    duration,
    xpEarned,
    currentLevel,
    levelProgress,
    currentXP,
    nextLevelXP,
    currentStreak,
    bestStreak,
    formBreakdown,
    coachSummary,
    nextExercise,
  } = MOCK_SESSION_DATA;

  const formScoreMessage = getFormScoreMessage(formScore);
  const formScoreColor = getFormScoreColor(formScore);

  return (
    <SanctuaryBackground variant="celebration">
      {/* Celebration Animation */}
      {showCelebration && (
        <CelebrationAnimation
          onComplete={() => setShowCelebration(false)}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Celebration Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle2
                size={80}
                className="text-sage-500"
                fill="currentColor"
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-sage-400/20 blur-xl rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Great Session, {userName}!
            </h1>
            <p className="text-lg text-muted-foreground">
              You completed{" "}
              <span className="font-semibold text-sage-600">
                {exerciseName}
              </span>{" "}
              with excellent form
            </p>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Form Score */}
          <Card className="surface-organic flex flex-col items-center justify-center p-6 animate-celebration-fade-in-up" style={{ animationDelay: "0ms" }}>
            <CardContent className="p-0 flex flex-col items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                FORM SCORE
              </span>
              <ProgressRing
                value={formScore}
                size="lg"
                color={formScoreColor}
              />
              <span className="text-sm font-medium text-sage-600">
                {formScoreMessage}
              </span>
            </CardContent>
          </Card>

          {/* Reps Completed */}
          <Card className="surface-organic flex flex-col items-center justify-center p-6 animate-celebration-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="p-0 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
                <RepsIcon size="sm" variant="sage" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground block">
                  REPS COMPLETED
                </span>
                <span className="text-3xl font-bold text-foreground block">
                  {repsCompleted}
                </span>
                <span className="text-xs text-muted-foreground block">
                  Target: {targetReps}
                </span>
                <div className="text-xs font-medium text-sage-600">
                  {repsCompleted >= targetReps ? "Complete!" : "Keep going!"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card className="surface-organic flex flex-col items-center justify-center p-6 animate-celebration-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardContent className="p-0 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
                <TimerIcon size="sm" variant="sage" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground block">
                  DURATION
                </span>
                <span className="text-3xl font-bold text-foreground block">
                  {duration}
                </span>
                <span className="text-xs text-muted-foreground block">
                  minutes
                </span>
                <div className="text-xs font-medium text-sage-600">
                  Good pace
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* XP Earned */}
          <Card className="surface-organic animate-celebration-fade-in-up" style={{ animationDelay: "300ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon size="sm" variant="sage" />
                XP Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-sage-600">
                  +{xpEarned} XP
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Level {currentLevel}</span>
                  <span className="font-medium text-foreground">
                    {currentXP} / {nextLevelXP} XP
                  </span>
                </div>
                <Progress
                  value={currentXP}
                  max={nextLevelXP}
                  size="lg"
                  color="sage"
                />
                <div className="text-center text-xs text-muted-foreground">
                  {levelProgress}% to Level {currentLevel + 1}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="surface-organic animate-celebration-fade-in-up" style={{ animationDelay: "400ms" }}>
            <CardHeader>
              <CardTitle>Streak</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-4">
              <StreakDisplay
                currentStreak={currentStreak}
                bestStreak={bestStreak}
                size="lg"
              />
            </CardContent>
          </Card>
        </div>

        {/* Form Breakdown (Collapsible) */}
        <Collapsible
          open={isFormBreakdownOpen}
          onOpenChange={setIsFormBreakdownOpen}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Form Analysis</span>
              <span className="text-sm text-muted-foreground">
                {isFormBreakdownOpen ? "Hide" : "Show"} Details
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {formBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="space-y-2 p-4 rounded-xl bg-sage-50/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {item.metric}
                    </span>
                    <span className="text-sm font-bold text-sage-600">
                      {item.score}%
                    </span>
                  </div>
                  <Progress
                    value={item.score}
                    size="default"
                    color={item.score >= 80 ? "sage" : "coral"}
                  />
                  <div className="text-xs text-muted-foreground">
                    {item.feedback}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Coach Summary */}
        <Card className="surface-organic animate-celebration-fade-in-up" style={{ animationDelay: "500ms" }}>
          <CardHeader>
            <CardTitle>Coach Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-sage-700 leading-relaxed">
              {coachSummary}
            </p>
            <Button variant="ghost" className="w-full" disabled>
              <Play size={16} />
              Play Audio Summary
            </Button>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="space-y-3 animate-celebration-fade-in-up" style={{ animationDelay: "600ms" }}>
          <h2 className="text-lg font-semibold text-foreground text-center">
            What&apos;s Next?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Do Again */}
            <Button
              variant="ghost"
              className="h-auto flex-col gap-2 py-4 rounded-3xl"
              asChild
            >
              <Link href={`/workout/${slug}`}>
                <RotateCcw size={24} />
                <span className="font-medium">Do Again</span>
              </Link>
            </Button>

            {/* Next Exercise */}
            <Button
              variant="terracotta"
              className="h-auto flex-col gap-2 py-4 rounded-3xl"
              asChild
            >
              <Link href={`/workout/${nextExercise.slug}`}>
                <ArrowRight size={24} />
                <span className="font-medium">Next Exercise</span>
                <span className="text-xs opacity-90">
                  {nextExercise.name}
                </span>
              </Link>
            </Button>

            {/* Back to Dashboard */}
            <Button
              variant="secondary"
              className="h-auto flex-col gap-2 py-4 rounded-3xl"
              asChild
            >
              <Link href="/dashboard">
                <Home size={24} />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
        </div>
      </div>
    </SanctuaryBackground>
  );
}
