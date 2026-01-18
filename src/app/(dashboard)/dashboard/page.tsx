"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getExerciseById } from "@/lib/exercises";
import type { PlanStructure } from "@/lib/gemini/types";
import { Badge } from "@/components/ui/badge";
import { StreakDisplay } from "@/components/ui/streak-display";
import { StatsCard } from "@/components/ui/stats-card";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  CalendarIcon,
  TimerIcon,
  RepsIcon,
} from "@/components/ui/icons";
import {
  ArrowRight,
} from "lucide-react";
import {
  mockExercises,
  mockSessions,
  mockWeeklyActivity,
  motivationalQuotes,
} from "@/lib/mock-data";
import {
  getCategoryIcon,
  getExerciseIconOrCategory,
  getCategoryBadgeVariant,
  getScoreBadgeVariant,
  getExerciseImage,
} from "@/lib/exercise-utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDifficultyBadgeVariant(difficulty: string): "easy" | "medium" | "hard" {
  switch (difficulty) {
    case "beginner":
      return "easy";
    case "intermediate":
      return "medium";
    case "advanced":
      return "hard";
    default:
      return "medium";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const userName = "Sarah";
  const quote = motivationalQuotes[0];
  const greeting = getTimeOfDayGreeting();
  const [firstExerciseSlug, setFirstExerciseSlug] = useState<string | null>(null);

  // Fetch user's plan and get first exercise, create default if none exists
  useEffect(() => {
    async function fetchFirstExercise() {
      try {
        const response = await fetch("/api/patient-records");
        if (!response.ok) {
          // Try to create a default plan
          await createDefaultPlan();
          return;
        }

        const result = await response.json();

        // API returns { data: { plans: [...], assessments: [...], sessions: [...] } }
        const data = result.data || result;

        if (!data) {
          await createDefaultPlan();
          return;
        }

        const plans = data.plans || [];

        if (plans.length === 0) {
          // No plans exist, create a default one
          await createDefaultPlan();
          return;
        }

        // Get the most recent approved plan, or first plan if none approved
        const activePlan = plans.find(
          (plan: { status: string }) => plan.status === "approved"
        ) || plans[0];

        if (!activePlan?.structure) {
          await createDefaultPlan();
          return;
        }

        // Parse structure if it's a string (JSONB from database might be stringified)
        let structure: PlanStructure;
        if (typeof activePlan.structure === 'string') {
          try {
            structure = JSON.parse(activePlan.structure);
          } catch (e) {
            console.error("[Dashboard] Failed to parse plan structure:", e);
            await createDefaultPlan();
            return;
          }
        } else {
          structure = activePlan.structure as PlanStructure;
        }

        // Validate structure has weeks
        if (!structure?.weeks || !Array.isArray(structure.weeks) || structure.weeks.length === 0) {
          await createDefaultPlan();
          return;
        }

        // Get first week
        const firstWeek = structure.weeks[0];

        if (!firstWeek?.exercises || !Array.isArray(firstWeek.exercises) || firstWeek.exercises.length === 0) {
          await createDefaultPlan();
          return;
        }

        // Get first exercise (sorted by order)
        const sortedExercises = [...firstWeek.exercises].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );
        const firstExercise = sortedExercises[0];

        if (!firstExercise) {
          await createDefaultPlan();
          return;
        }

        // Use exerciseSlug if available, otherwise look up by exerciseId
        let slug = firstExercise.exerciseSlug;
        if (!slug && firstExercise.exerciseId) {
          const exercise = getExerciseById(firstExercise.exerciseId);
          if (exercise?.slug) {
            slug = exercise.slug;
          }
        }

        if (slug) {
          setFirstExerciseSlug(slug);
        } else {
          // Fallback to bodyweight-squat if slug not found
          setFirstExerciseSlug('bodyweight-squat');
        }
      } catch (error) {
        console.error("[Dashboard] Failed to fetch plan:", error);
        // Try to create default plan as fallback
        await createDefaultPlan();
      }
    }

    async function createDefaultPlan() {
      try {
        const response = await fetch("/api/plans/create-default", {
          method: "POST",
        });

        if (response.ok) {
          // Default plan created, set slug to bodyweight-squat
          setFirstExerciseSlug('bodyweight-squat');
        } else {
          // If creation fails, still set to squat as fallback
          setFirstExerciseSlug('squat');
        }
      } catch (error) {
        console.error("[Dashboard] Failed to create default plan:", error);
        // Still set to bodyweight-squat as fallback
        setFirstExerciseSlug('bodyweight-squat');
      }
    }

    fetchFirstExercise();
  }, []);

  const handleStartRoutine = () => {
    // Use first exercise slug if available, otherwise default to bodyweight-squat
    const slug = firstExerciseSlug || 'bodyweight-squat';
    router.push(`/workout/${slug}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {/* Organic decorations in corners with breathing animation */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-sage-200/20 to-terracotta-200/15 rounded-full blur-3xl animate-sanctuary-breathe pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/3 -left-20 w-48 h-48 bg-gradient-to-tr from-terracotta-200/15 to-sage-200/20 rounded-full blur-3xl animate-sanctuary-breathe pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden="true" />

      {/* Welcome Section - Full Width Card */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sage-200/30 to-terracotta-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-sanctuary-breathe" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {greeting}, {userName}!
              </h1>
              <p className="text-muted-foreground max-w-md">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-3xl p-4 shadow-sm">
              <StreakDisplay currentStreak={5} bestStreak={12} />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Recommended Exercises - Enhanced Cards */}
      <section className="space-y-4">
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Today&apos;s Recommended Exercises
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your progress and recovery goals
              </p>
            </div>
            <Button variant="primary" onClick={handleStartRoutine}>
              Start Full Routine
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockExercises.map((exercise) => (
            <StaggerItem key={exercise.name}>
              <Card
                variant="organic"
                className="group p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                {/* Image/Icon area */}
                <div className="flex items-center justify-center h-24 bg-sage-50 rounded-2xl mb-3 group-hover:bg-sage-100 transition-colors relative overflow-hidden">
                  {getExerciseImage(exercise.slug) ? (
                    <Image
                      src={getExerciseImage(exercise.slug)!}
                      alt={exercise.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    getExerciseIconOrCategory(exercise.id, exercise.category, "md")
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                    <Badge variant={getCategoryBadgeVariant(exercise.category)} size="sm">
                      {exercise.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{exercise.duration} • {exercise.reps} reps</span>
                    {(() => {
                      const fullExercise = getExerciseById(exercise.id);
                      const difficulty = fullExercise?.difficulty || "intermediate";
                      return (
                        <Badge variant={getDifficultyBadgeVariant(difficulty)} size="sm">
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </Badge>
                      );
                    })()}
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-2 h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground" asChild>
                    <Link href={`/workout/${exercise.slug}`}>
                      Start
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Progress Section - Bento Style Grid */}
      <section className="space-y-4">
        <FadeIn>
          <h2 className="text-lg font-semibold text-foreground">This Week</h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1: Three Stats Cards */}
          <StaggerItem>
            <StatsCard
              title="Sessions Completed"
              value="4/7"
              customIcon={<CalendarIcon size="sm" variant="sage" />}
              trend={{ direction: "up", value: "+1 from last week" }}
              className="h-full"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              title="Total Reps"
              value={120}
              customIcon={<RepsIcon size="sm" variant="sage" />}
              trend={{ direction: "up", value: "+15%" }}
              variant="sage"
              className="h-full"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              title="Time Exercising"
              value="45 min"
              customIcon={<TimerIcon size="sm" variant="coral" />}
              variant="coral"
              className="h-full"
            />
          </StaggerItem>

          {/* Row 2: Form Score and Weekly Activity */}
          <StaggerItem>
            <Card variant="organic" className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Average Form Score</h3>
                <span className="text-sm text-muted-foreground">Last 7 days</span>
              </div>
              <div className="flex items-center gap-6">
                <ProgressRing value={82} size="lg" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your form has improved!
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">+5%</Badge>
                    <span className="text-sm text-muted-foreground">vs last week</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Focus area: Hip alignment
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem className="md:col-span-2">
            <Card variant="organic" className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Weekly Activity</h3>
                <span className="text-sm text-muted-foreground">4 of 7 days</span>
              </div>
              <WeeklyCalendar activities={mockWeeklyActivity} startOfWeek="monday" />
              <p className="text-sm text-muted-foreground mt-4">
                Keep going! Just 3 more days to hit your weekly goal.
              </p>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Recent Sessions - Enhanced Table */}
      <FadeIn>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Sessions</h2>
            <Link href="/history" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Card variant="organic" className="overflow-hidden rounded-3xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead className="text-center">Reps</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSessions.map((session, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-sage-50/50 transition-colors">
                    <TableCell className="text-muted-foreground">{session.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sage-50 rounded-lg">
                          {getCategoryIcon(session.category, "sm")}
                        </div>
                        <span className="font-medium">{session.exercise}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{session.reps}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getScoreBadgeVariant(session.score)} size="sm">
                        {session.score}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{session.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </FadeIn>

    </div>
  );
}
