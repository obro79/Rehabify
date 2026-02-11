"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getExerciseById, getExerciseBySlug, toCardData } from "@/lib/exercises";
import type { PlanStructure } from "@/lib/gemini/types";
import type { ExerciseCardData } from "@/lib/exercises/types";
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
import { motivationalQuotes } from "@/lib/mock-data";
import {
  getCategoryIcon,
  getExerciseIconOrCategory,
  getCategoryBadgeVariant,
  getScoreBadgeVariant,
  getExerciseImage,
} from "@/lib/exercise-utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { getTimeOfDayGreeting } from "@/lib/date-utils";

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

interface ProfileData {
  displayName?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

interface SessionRecord {
  id: string;
  date: string;
  exercises: Array<{
    exerciseName: string;
    exerciseSlug: string;
    category: string;
    formScore: number;
    repsCompleted: number;
  }> | null;
  durationSeconds: number;
  overallFormScore: string | null;
  status: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const quote = motivationalQuotes[0];
  const greeting = getTimeOfDayGreeting();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [planExercises, setPlanExercises] = useState<ExerciseCardData[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<Array<{ date: string; completed: boolean }>>([]);
  const [weeklyStats, setWeeklyStats] = useState({ sessions: 0, goal: 7, totalReps: 0, totalMinutes: 0 });
  const [avgFormScore, setAvgFormScore] = useState(0);
  const [firstExerciseSlug, setFirstExerciseSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch profile and patient records in parallel
        const [profileRes, recordsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/patient-records"),
        ]);

        // Process profile
        if (profileRes.ok) {
          const profileResult = await profileRes.json();
          const p = profileResult.data || profileResult;
          setProfile({
            displayName: p.displayName || p.name,
            xp: p.xp ?? 0,
            level: p.level ?? 1,
            currentStreak: p.currentStreak ?? 0,
            longestStreak: p.longestStreak ?? 0,
          });
        }

        // Process records
        if (recordsRes.ok) {
          const recordsResult = await recordsRes.json();
          const data = recordsResult.data || recordsResult;

          // Process plans -> exercises for "Today's Recommended Exercises"
          const plans = data?.plans || [];
          if (plans.length > 0) {
            const activePlan = plans.find(
              (p: { status: string }) => p.status === "approved"
            ) || plans[0];

            if (activePlan?.structure) {
              let structure: PlanStructure;
              if (typeof activePlan.structure === "string") {
                structure = JSON.parse(activePlan.structure);
              } else {
                structure = activePlan.structure as PlanStructure;
              }

              if (structure?.weeks?.[0]?.exercises) {
                const week = structure.weeks[0];
                const sorted = [...week.exercises].sort((a, b) => a.order - b.order);

                // Convert plan exercises to card data
                const cards: ExerciseCardData[] = [];
                for (const planEx of sorted) {
                  const ex = planEx.exerciseSlug
                    ? getExerciseBySlug(planEx.exerciseSlug)
                    : planEx.exerciseId
                    ? getExerciseById(planEx.exerciseId)
                    : undefined;

                  if (ex) {
                    cards.push(toCardData(ex));
                  }
                }

                if (cards.length > 0) {
                  setPlanExercises(cards);
                  setFirstExerciseSlug(cards[0].slug);
                } else {
                  setFirstExerciseSlug("bodyweight-squat");
                }
              }
            }
          }

          if (planExercises.length === 0 && firstExerciseSlug === null) {
            // Fallback: try to create default plan
            try {
              await fetch("/api/plans/create-default", { method: "POST" });
              setFirstExerciseSlug("bodyweight-squat");
            } catch {
              setFirstExerciseSlug("bodyweight-squat");
            }
          }

          // Process sessions
          const sessions: SessionRecord[] = data?.sessions || [];
          setRecentSessions(sessions.slice(0, 5));

          // Calculate weekly stats
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
          const thisWeekSessions = sessions.filter(
            (s: SessionRecord) => new Date(s.date) >= oneWeekAgo
          );

          let totalReps = 0;
          let totalSeconds = 0;
          let formScoreSum = 0;
          let formScoreCount = 0;

          for (const s of thisWeekSessions) {
            totalSeconds += s.durationSeconds || 0;
            if (s.overallFormScore) {
              formScoreSum += parseFloat(s.overallFormScore);
              formScoreCount++;
            }
            if (Array.isArray(s.exercises)) {
              for (const ex of s.exercises) {
                totalReps += ex.repsCompleted || 0;
              }
            }
          }

          setWeeklyStats({
            sessions: thisWeekSessions.length,
            goal: 7,
            totalReps,
            totalMinutes: Math.round(totalSeconds / 60),
          });

          setAvgFormScore(formScoreCount > 0 ? Math.round(formScoreSum / formScoreCount) : 0);

          // Build weekly activity calendar
          const activityDays: Array<{ date: string; completed: boolean }> = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000);
            const dateStr = d.toISOString().split("T")[0];
            const hasSession = sessions.some(
              (s: SessionRecord) => s.date === dateStr
            );
            activityDays.push({ date: dateStr, completed: hasSession });
          }
          setWeeklyActivity(activityDays);
        }
      } catch (err) {
        console.error("[Dashboard] Failed to load data:", err);
        setFirstExerciseSlug("bodyweight-squat");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartRoutine = () => {
    const slug = firstExerciseSlug || "bodyweight-squat";
    router.push(`/workout/${slug}`);
  };

  const userName = profile?.displayName || "there";
  const daysCompleted = weeklyActivity.filter((d) => d.completed).length;
  const daysRemaining = 7 - daysCompleted;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="h-32 rounded-3xl bg-sage-50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-sage-50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-sage-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
              <StreakDisplay
                currentStreak={profile?.currentStreak ?? 0}
                bestStreak={profile?.longestStreak ?? 0}
              />
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
            <div className="flex items-center gap-3">
              <Link href="/plan" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                View Full Plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Button variant="primary" onClick={handleStartRoutine}>
                Start Full Routine
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {planExercises.map((exercise) => (
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
              value={`${weeklyStats.sessions}/${weeklyStats.goal}`}
              customIcon={<CalendarIcon size="sm" variant="sage" />}
              className="h-full"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              title="Total Reps"
              value={weeklyStats.totalReps}
              customIcon={<RepsIcon size="sm" variant="sage" />}
              variant="sage"
              className="h-full"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              title="Time Exercising"
              value={`${weeklyStats.totalMinutes} min`}
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
                <ProgressRing value={avgFormScore} size="lg" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {avgFormScore > 0
                      ? avgFormScore >= 80
                        ? "Your form is looking great!"
                        : "Keep working on your form"
                      : "Complete a session to see your score"}
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem className="md:col-span-2">
            <Card variant="organic" className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Weekly Activity</h3>
                <span className="text-sm text-muted-foreground">{daysCompleted} of 7 days</span>
              </div>
              <WeeklyCalendar activities={weeklyActivity} startOfWeek="monday" />
              <p className="text-sm text-muted-foreground mt-4">
                {daysRemaining > 0
                  ? `Keep going! Just ${daysRemaining} more day${daysRemaining > 1 ? "s" : ""} to hit your weekly goal.`
                  : "Amazing! You hit your weekly goal!"}
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
                {recentSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No sessions yet. Start your first workout!
                    </TableCell>
                  </TableRow>
                ) : (
                  recentSessions.map((session) => {
                    const ex = Array.isArray(session.exercises) ? session.exercises[0] : null;
                    const exerciseName = ex ? ex.exerciseName : "Exercise";
                    const category = ex ? ex.category : "general";
                    const reps = ex ? ex.repsCompleted : 0;
                    const score = session.overallFormScore ? parseFloat(session.overallFormScore) : 0;

                    return (
                      <TableRow key={session.id} className="cursor-pointer hover:bg-sage-50/50 transition-colors">
                        <TableCell className="text-muted-foreground">
                          {formatRelativeDate(session.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-sage-50 rounded-lg">
                              {getCategoryIcon(category as "Mobility" | "Strength" | "Stability", "sm")}
                            </div>
                            <span className="font-medium">{exerciseName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{reps}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getScoreBadgeVariant(Math.round(score))} size="sm">
                            {Math.round(score)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDuration(session.durationSeconds || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </section>
      </FadeIn>

    </div>
  );
}
