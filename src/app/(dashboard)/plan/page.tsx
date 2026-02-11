"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { ArrowRight, ClipboardList, Play, Clock, Dumbbell } from "lucide-react";
import {
  getExerciseById,
  getExerciseBySlug,
  toCardData,
} from "@/lib/exercises";
import type { ExerciseCardData } from "@/lib/exercises/types";
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
}

/** Convert a PlanExercise to ExerciseCardData for display */
function toCard(planEx: PlanExercise): ExerciseCardData | null {
  const ex = planEx.exerciseSlug
    ? getExerciseBySlug(planEx.exerciseSlug)
    : planEx.exerciseId
    ? getExerciseById(planEx.exerciseId)
    : undefined;
  return ex ? toCardData(ex) : null;
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState("1");
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
          }
        }
      } catch (err) {
        console.error("[Plan] Failed to load plan:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, []);

  const currentWeek: PlanWeek | undefined = plan?.structure.weeks.find(
    (w) => String(w.weekNumber) === selectedWeek
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
      {/* Plan Header */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-sm">
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sage-200/30 to-terracotta-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            aria-hidden="true"
          />
          <div className="relative space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
            {plan.summary && (
              <p className="text-muted-foreground max-w-2xl text-sm">
                {plan.summary}
              </p>
            )}
            {plan.recommendations.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {plan.recommendations.map((rec, i) => (
                  <Badge
                    key={i}
                    variant={
                      rec.type === "warning" || rec.type === "contraindication"
                        ? "warning"
                        : rec.type === "encouragement"
                        ? "success"
                        : "info"
                    }
                    size="sm"
                  >
                    {rec.message}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeIn>

      {/* Week Selector */}
      <FadeIn delay={0.1}>
        <Tabs value={selectedWeek} onValueChange={setSelectedWeek}>
          <TabsList className="w-full flex flex-wrap gap-1">
            {plan.structure.weeks.map((week) => (
              <TabsTrigger
                key={week.weekNumber}
                value={String(week.weekNumber)}
                className="min-w-[3rem]"
              >
                W{week.weekNumber}
              </TabsTrigger>
            ))}
          </TabsList>

          {plan.structure.weeks.map((week) => (
            <TabsContent
              key={week.weekNumber}
              value={String(week.weekNumber)}
            >
              {/* Week Info */}
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Week {week.weekNumber}: {week.focus}
                </h2>
                <p className="text-sm text-muted-foreground">{week.notes}</p>
              </div>

              <div className="space-y-4">
                {/* Day Tabs — only show if days info exists */}
                {activeDays.length > 0 && (
                  <div className="flex gap-2">
                    {activeDays.map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedDay === day
                            ? "bg-sage-900 text-white"
                            : "bg-sage-100 text-sage-600 hover:bg-sage-200"
                        }`}
                      >
                        {DAY_NAMES[day]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Start Session Button */}
                {dayExercises.length > 0 && (
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
                )}

                {/* Exercise Cards Grid — matching dashboard style */}
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
                            {/* Image/Icon area */}
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

                            {/* Content */}
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
                      No exercises scheduled for this week. Your plan may focus on rest and recovery during this period.
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </FadeIn>
    </div>
  );
}
