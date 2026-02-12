"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardList, Play, Clock, Dumbbell } from "lucide-react";
import {
  getExerciseById,
  getExerciseBySlug,
  toCardData,
} from "@/lib/exercises";
import {
  getExerciseImage,
  getExerciseIconOrCategory,
  getCategoryBadgeVariant,
  getDifficultyBadgeVariant,
} from "@/lib/exercise-utils";
import type {
  PlanStructure,
  PlanWeek,
  PlanExercise,
  Recommendation,
} from "@/lib/gemini/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PlanData {
  name: string;
  summary: string;
  recommendations: Recommendation[];
  structure: PlanStructure;
  isSample?: boolean;
}

const SAMPLE_PLAN: PlanData = {
  name: "Sample Lower Back Rehab Plan",
  summary: "A gentle 4-week plan focusing on mobility, core stability, and strengthening.",
  recommendations: [],
  isSample: true,
  structure: {
    weeks: [
      {
        weekNumber: 1,
        focus: "Foundation & Mobility",
        notes: "Focus on gentle movements and building body awareness.",
        exercises: [
          { exerciseId: "cat-camel", exerciseSlug: "cat-camel", name: "Cat-Camel", sets: 2, reps: 10, order: 1, days: [1, 3, 5] },
          { exerciseId: "cobra-stretch", exerciseSlug: "cobra-stretch", name: "Cobra Stretch", sets: 2, reps: 10, holdSeconds: 5, order: 2, days: [1, 3, 5] },
          { exerciseId: "dead-bug", exerciseSlug: "dead-bug", name: "Dead Bug", sets: 2, reps: 10, order: 3, days: [1, 3, 5] },
          { exerciseId: "bird-dog", exerciseSlug: "bird-dog", name: "Bird Dog", sets: 2, reps: 10, holdSeconds: 3, order: 4, days: [2, 4] },
        ],
      },
      {
        weekNumber: 2,
        focus: "Building Stability",
        notes: "Introduce more core engagement while maintaining mobility work.",
        exercises: [
          { exerciseId: "cat-camel", exerciseSlug: "cat-camel", name: "Cat-Camel", sets: 2, reps: 12, order: 1, days: [1, 3, 5] },
          { exerciseId: "dead-bug", exerciseSlug: "dead-bug", name: "Dead Bug", sets: 3, reps: 10, order: 2, days: [1, 3, 5] },
          { exerciseId: "bird-dog", exerciseSlug: "bird-dog", name: "Bird Dog", sets: 3, reps: 10, holdSeconds: 3, order: 3, days: [1, 3, 5] },
          { exerciseId: "bodyweight-squat", exerciseSlug: "bodyweight-squat", name: "Bodyweight Squat", sets: 2, reps: 8, order: 4, days: [2, 4] },
        ],
      },
      {
        weekNumber: 3,
        focus: "Strength & Endurance",
        notes: "Increase reps and add strengthening exercises.",
        exercises: [
          { exerciseId: "dead-bug", exerciseSlug: "dead-bug", name: "Dead Bug", sets: 3, reps: 12, order: 1, days: [1, 3, 5] },
          { exerciseId: "bird-dog", exerciseSlug: "bird-dog", name: "Bird Dog", sets: 3, reps: 12, holdSeconds: 5, order: 2, days: [1, 3, 5] },
          { exerciseId: "bodyweight-squat", exerciseSlug: "bodyweight-squat", name: "Bodyweight Squat", sets: 3, reps: 10, order: 3, days: [2, 4] },
          { exerciseId: "cobra-stretch", exerciseSlug: "cobra-stretch", name: "Cobra Stretch", sets: 2, reps: 10, holdSeconds: 5, order: 4, days: [2, 4] },
        ],
      },
      {
        weekNumber: 4,
        focus: "Progress & Maintenance",
        notes: "Full routine with increased volume. Listen to your body.",
        exercises: [
          { exerciseId: "cat-camel", exerciseSlug: "cat-camel", name: "Cat-Camel", sets: 2, reps: 12, order: 1, days: [1, 3, 5] },
          { exerciseId: "dead-bug", exerciseSlug: "dead-bug", name: "Dead Bug", sets: 3, reps: 15, order: 2, days: [1, 3, 5] },
          { exerciseId: "bird-dog", exerciseSlug: "bird-dog", name: "Bird Dog", sets: 3, reps: 12, holdSeconds: 5, order: 3, days: [1, 3, 5] },
          { exerciseId: "bodyweight-squat", exerciseSlug: "bodyweight-squat", name: "Bodyweight Squat", sets: 3, reps: 12, order: 4, days: [2, 4] },
        ],
      },
    ],
  },
};

/** Convert a PlanExercise to ExerciseCardData for display */
function toCard(planEx: PlanExercise): ReturnType<typeof toCardData> | null {
  const ex = planEx.exerciseSlug
    ? getExerciseBySlug(planEx.exerciseSlug)
    : planEx.exerciseId
    ? getExerciseById(planEx.exerciseId)
    : undefined;
  return ex ? toCardData(ex) : null;
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [selectedWeekNum, setSelectedWeekNum] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch("/api/patient-records");
        if (!res.ok) throw new Error("Failed to fetch records");

        const result = await res.json();
        const data = result.data || result;
        const plans = data?.plans || [];

        if (plans.length > 0) {
          const activePlan =
            plans.find((p: { status: string }) => p.status === "approved") ||
            plans[0];

          if (activePlan?.structure) {
            let structure: PlanStructure;
            if (typeof activePlan.structure === "string") {
              structure = JSON.parse(activePlan.structure);
            } else {
              structure = activePlan.structure as PlanStructure;
            }

            setPlan({
              name: activePlan.name || "My Rehab Plan",
              summary: activePlan.summary || "",
              recommendations: activePlan.recommendations || [],
              structure,
            });
            return;
          }
        }
        // No plans found — show sample
        setPlan(SAMPLE_PLAN);
      } catch (err) {
        console.error("[Plan] Failed to load plan, showing sample:", err);
        setPlan(SAMPLE_PLAN);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, []);

  const totalWeeks = plan?.structure.weeks.length ?? 0;
  const currentWeek: PlanWeek | undefined = plan?.structure.weeks.find(
    (w) => w.weekNumber === selectedWeekNum
  );

  // Sorted unique days that have exercises in the current week
  const activeDays = useMemo(() => {
    if (!currentWeek) return [];
    const daySet = new Set<number>();
    for (const ex of currentWeek.exercises) {
      if (ex.days && Array.isArray(ex.days)) {
        for (const d of ex.days) daySet.add(d);
      }
    }
    return Array.from(daySet).sort((a, b) => a - b);
  }, [currentWeek]);

  // Reset selected day to first active day when week changes
  useEffect(() => {
    setSelectedDay(activeDays.length > 0 ? activeDays[0] : null);
  }, [activeDays]);

  // Exercises for the selected day, sorted by order
  // If no days info available, show ALL exercises in the week
  const dayExercises = useMemo(() => {
    if (!currentWeek) return [];
    if (activeDays.length === 0) {
      // No day info — show all exercises in this week
      return [...currentWeek.exercises].sort((a, b) => a.order - b.order);
    }
    if (selectedDay === null) return [];
    return [...currentWeek.exercises]
      .filter((ex) => ex.days?.includes(selectedDay))
      .sort((a, b) => a.order - b.order);
  }, [currentWeek, selectedDay, activeDays]);

  // Estimate session duration: ~2 min per exercise
  const estimatedMinutes = dayExercises.length * 2;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-24 rounded-3xl bg-sage-50 animate-pulse" />
        <div className="h-12 rounded-xl bg-sage-50 animate-pulse w-full max-w-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-sage-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <Card variant="organic" className="p-12 text-center space-y-4">
            <ClipboardList className="h-12 w-12 text-sage-400 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              No Plan Yet
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete an assessment to generate your personalized 12-week rehab
              plan.
            </p>
            <Button variant="primary" asChild>
              <Link href="/assessment/lower-back">Take Assessment</Link>
            </Button>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sample Plan Banner */}
      {plan.isSample && (
        <FadeIn>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Sample Plan</p>
              <p className="text-sm text-amber-700 mt-0.5">
                This is an example plan. Complete an assessment to get your personalized plan.
              </p>
            </div>
            <Button variant="primary" size="sm" asChild className="shrink-0">
              <Link href="/assessment/lower-back">Take Assessment</Link>
            </Button>
          </div>
        </FadeIn>
      )}

      {/* Week Header with Arrows */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedWeekNum((w) => Math.max(1, w - 1))}
              disabled={selectedWeekNum <= 1}
              className="p-2 rounded-full hover:bg-sage-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="text-center min-w-[140px]">
              <h1 className="text-2xl font-bold text-foreground">
                Week {selectedWeekNum}
              </h1>
              <p className="text-xs text-muted-foreground">
                of {totalWeeks}
              </p>
            </div>
            <button
              onClick={() => setSelectedWeekNum((w) => Math.min(totalWeeks, w + 1))}
              disabled={selectedWeekNum >= totalWeeks}
              className="p-2 rounded-full hover:bg-sage-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </div>
          {/* Week progress dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {plan.structure.weeks.map((week) => (
              <button
                key={week.weekNumber}
                onClick={() => setSelectedWeekNum(week.weekNumber)}
                className={`w-2 h-2 rounded-full transition-all ${
                  week.weekNumber === selectedWeekNum
                    ? "bg-sage-900 scale-125"
                    : "bg-sage-200 hover:bg-sage-400"
                }`}
                aria-label={`Go to week ${week.weekNumber}`}
              />
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Week Focus */}
      {currentWeek && (currentWeek.focus || currentWeek.notes) && (
        <FadeIn delay={0.05}>
          <div className="space-y-1">
            {currentWeek.focus && (
              <p className="text-sm font-medium text-foreground">{currentWeek.focus}</p>
            )}
            {currentWeek.notes && (
              <p className="text-sm text-muted-foreground">{currentWeek.notes}</p>
            )}
          </div>
        </FadeIn>
      )}

      {/* Day Tabs */}
      {activeDays.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeDays.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                  selectedDay === day
                    ? "bg-sage-900 text-white"
                    : "bg-sage-100 text-sage-600 hover:bg-sage-200"
                }`}
              >
                {DAY_NAMES[day]}
              </button>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Start Session Button */}
      {dayExercises.length > 0 && (
        <FadeIn delay={0.15}>
          <Link
            href={`/workout/${dayExercises[0].exerciseSlug}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sage-800 to-sage-900 p-5 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]">
              <div
                className="absolute inset-0 bg-gradient-to-r from-sage-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm">
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-base">
                      Start Session
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-sage-200 text-xs">
                        <Dumbbell className="h-3 w-3" />
                        {dayExercises.length} exercise{dayExercises.length !== 1 && "s"}
                      </span>
                      <span className="flex items-center gap-1 text-sage-200 text-xs">
                        <Clock className="h-3 w-3" />
                        ~{estimatedMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </FadeIn>
      )}

      {/* Exercise Cards Grid */}
      <FadeIn delay={0.2}>
        {dayExercises.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dayExercises.map((exercise) => {
              const cardData = toCard(exercise);
              return (
                <StaggerItem key={exercise.exerciseId || exercise.exerciseSlug}>
                  <Card
                    variant="organic"
                    className="group p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-center h-24 bg-sage-50 rounded-2xl mb-3 group-hover:bg-sage-100 transition-colors relative overflow-hidden">
                      {getExerciseImage(exercise.exerciseSlug) ? (
                        <Image
                          src={getExerciseImage(exercise.exerciseSlug)!}
                          alt={exercise.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        cardData
                          ? getExerciseIconOrCategory(cardData.id, cardData.category, "md")
                          : <Dumbbell className="h-8 w-8 text-sage-300" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-foreground text-sm leading-snug">
                          {exercise.name}
                        </h3>
                        {cardData && (
                          <Badge variant={getCategoryBadgeVariant(cardData.category)} size="sm" className="shrink-0">
                            {cardData.category}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {exercise.sets} &times; {exercise.reps} reps
                          {exercise.holdSeconds != null && exercise.holdSeconds > 0 && (
                            <> &middot; {exercise.holdSeconds}s hold</>
                          )}
                        </span>
                        {cardData && (() => {
                          const fullExercise = getExerciseById(cardData.id);
                          const difficulty = fullExercise?.difficulty || "intermediate";
                          return (
                            <Badge variant={getDifficultyBadgeVariant(difficulty)} size="sm">
                              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </Badge>
                          );
                        })()}
                      </div>

                      <Button variant="ghost" size="sm" className="w-full mt-2 h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground" asChild>
                        <Link href={`/workout/${exercise.exerciseSlug}`}>
                          Start
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        ) : (
          <Card variant="organic" className="p-8 text-center space-y-2">
            <Dumbbell className="h-8 w-8 text-sage-300 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No exercises scheduled for this day. Your plan may focus on rest and recovery.
            </p>
          </Card>
        )}
      </FadeIn>
    </div>
  );
}
