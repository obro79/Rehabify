"use client";

import * as React from "react";
import { FormScoreChart } from "@/components/progress/form-score-chart";
import { ActivityHeatmap } from "@/components/progress/activity-heatmap";
import { ExerciseBreakdownChart } from "@/components/progress/exercise-breakdown-chart";
import { SessionFrequencyChart } from "@/components/progress/session-frequency-chart";
import { PersonalRecordsSection } from "@/components/progress/personal-records";
import { FadeIn, ScrollReveal, StaggerContainer, StaggerItem } from "@/components/motion";
import type {
  FormScoreDataPoint,
  ActivityDataPoint,
  ExerciseScoreSummary,
  PersonalRecords,
  SessionFrequencyDataPoint,
} from "@/lib/mock-data";

interface SessionExercise {
  exerciseName: string;
  exerciseSlug: string;
  category: string;
  formScore: number;
  repsCompleted: number;
}

interface SessionRecord {
  id: string;
  date: string;
  exercises: SessionExercise[] | null;
  durationSeconds: number;
  overallFormScore: string | null;
  createdAt: string;
}

function buildProgressData(sessions: SessionRecord[]) {
  // Form Score Chart data - one point per session
  const formScores: FormScoreDataPoint[] = sessions
    .filter((s) => s.overallFormScore)
    .map((s) => {
      const ex = Array.isArray(s.exercises) ? s.exercises[0] : null;
      return {
        date: s.date,
        score: Math.round(parseFloat(s.overallFormScore!)),
        exerciseId: ex?.exerciseSlug || "unknown",
      };
    })
    .reverse(); // Chronological order

  // Activity Heatmap - session count per day over last year
  const activityMap = new Map<string, number>();
  for (const s of sessions) {
    activityMap.set(s.date, (activityMap.get(s.date) || 0) + 1);
  }
  const now = new Date();
  const activityData: ActivityDataPoint[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    activityData.push({
      date: dateStr,
      sessionCount: activityMap.get(dateStr) || 0,
    });
  }

  // Exercise Breakdown - average score per exercise
  const exerciseMap = new Map<string, { scores: number[]; category: string }>();
  for (const s of sessions) {
    if (!Array.isArray(s.exercises)) continue;
    for (const ex of s.exercises) {
      const key = ex.exerciseName;
      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, { scores: [], category: ex.category });
      }
      exerciseMap.get(key)!.scores.push(ex.formScore);
    }
  }
  const exerciseBreakdown: ExerciseScoreSummary[] = [];
  exerciseMap.forEach((data, exerciseName) => {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    exerciseBreakdown.push({
      exerciseId: exerciseName.toLowerCase().replace(/\s+/g, "-"),
      exerciseName,
      category: (data.category.charAt(0).toUpperCase() + data.category.slice(1)) as ExerciseScoreSummary["category"],
      averageScore: Math.round(avg),
      sessionCount: data.scores.length,
    });
  });
  exerciseBreakdown.sort((a, b) => b.averageScore - a.averageScore);

  // Personal Records
  let bestScore = { score: 0, exerciseName: "", date: "" };
  let totalTimeMinutes = 0;

  for (const s of sessions) {
    totalTimeMinutes += (s.durationSeconds || 0) / 60;
    const score = s.overallFormScore ? parseFloat(s.overallFormScore) : 0;
    if (score > bestScore.score) {
      const ex = Array.isArray(s.exercises) ? s.exercises[0] : null;
      bestScore = {
        score: Math.round(score),
        exerciseName: ex?.exerciseName || "Exercise",
        date: s.date,
      };
    }
  }

  // Calculate longest streak
  const sortedDates = [...new Set(sessions.map((s) => s.date))].sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    if (prevDate) {
      const diff = Math.floor((date.getTime() - prevDate.getTime()) / 86400000);
      if (diff === 1) {
        currentStreak++;
      } else if (diff > 1) {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  const personalRecords: PersonalRecords = {
    bestScore,
    longestStreak,
    totalSessions: sessions.length,
    totalTimeMinutes: Math.round(totalTimeMinutes),
  };

  // Session Frequency - sessions per week (last 12 weeks)
  const sessionFrequency: SessionFrequencyDataPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const count = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d < weekEnd;
    }).length;
    sessionFrequency.push({
      week: `Week ${12 - i}`,
      sessionCount: count,
    });
  }

  return {
    formScores,
    activityData,
    exerciseBreakdown,
    personalRecords,
    sessionFrequency,
  };
}

export default function ProgressPage() {
  const [data, setData] = React.useState<ReturnType<typeof buildProgressData> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/patient-records");
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const result = await response.json();
        const records = result.data || result;
        const sessions: SessionRecord[] = records?.sessions || [];

        if (sessions.length > 0) {
          setData(buildProgressData(sessions));
        }
      } catch (err) {
        console.error("[Progress] Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
          <p className="text-muted-foreground">Loading your progress data...</p>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-3xl bg-sage-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 relative">
      {/* Subtle organic background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-radial from-sage-100/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-radial from-terracotta-100/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Page Header */}
      <FadeIn direction="up">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
          <p className="text-muted-foreground">
            Track your improvement and stay motivated with detailed analytics
          </p>
        </div>
      </FadeIn>

      {/* Personal Records Section */}
      <FadeIn delay={0.1}>
        <section aria-labelledby="personal-records-heading">
          <h2 id="personal-records-heading" className="sr-only">
            Personal Records
          </h2>
          <PersonalRecordsSection data={data?.personalRecords} />
        </section>
      </FadeIn>

      {/* Form Score Trend Section */}
      <ScrollReveal>
        <section aria-labelledby="form-score-heading">
          <h2 id="form-score-heading" className="sr-only">
            Form Score Trend
          </h2>
          <FormScoreChart data={data?.formScores} />
        </section>
      </ScrollReveal>

      {/* Two-column layout for desktop */}
      <StaggerContainer className="grid gap-6 lg:grid-cols-2">
        {/* Activity Heatmap Section */}
        <StaggerItem className="lg:col-span-2">
          <ScrollReveal>
            <section aria-labelledby="activity-heatmap-heading">
              <h2 id="activity-heatmap-heading" className="sr-only">
                Activity Heatmap
              </h2>
              <ActivityHeatmap data={data?.activityData} />
            </section>
          </ScrollReveal>
        </StaggerItem>

        {/* Exercise Breakdown Section */}
        <StaggerItem>
          <ScrollReveal>
            <section aria-labelledby="exercise-breakdown-heading">
              <h2 id="exercise-breakdown-heading" className="sr-only">
                Exercise Breakdown
              </h2>
              <ExerciseBreakdownChart data={data?.exerciseBreakdown} />
            </section>
          </ScrollReveal>
        </StaggerItem>

        {/* Session Frequency Section */}
        <StaggerItem>
          <ScrollReveal>
            <section aria-labelledby="session-frequency-heading">
              <h2 id="session-frequency-heading" className="sr-only">
                Session Frequency
              </h2>
              <SessionFrequencyChart data={data?.sessionFrequency} weeklyGoal={4} />
            </section>
          </ScrollReveal>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
