"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePTStore } from "@/stores/pt-store";
import { StatsCard } from "@/components/ui/stats-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BENCHMARKS,
  compareToBenchmark,
  calculateFormScoreImprovement,
  calculatePainReduction,
  getBenchmarkStatusMessage,
} from "@/lib/mock-data/pt-benchmarks";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { GoalIcon, CalendarIcon, ChartIcon } from "@/components/ui/icons";

type TrendDirection = "improving" | "declining" | "stable";

interface AnalyticsData {
  avgFormScore: number;
  formScoreTrend: TrendDirection;
  formScoreChange: number;
  sessionCompletionRate: number;
  totalSessions: number;
  expectedSessions: number;
  initialPainLevel: number;
  currentPainLevel: number;
  painReduction: number;
  recentScores: number[];
}

function calculateAnalytics(
  sessionHistory: Array<{ formScore: number; painLevel?: number; date: Date }>
): AnalyticsData {
  if (sessionHistory.length === 0) {
    return {
      avgFormScore: 0,
      formScoreTrend: "stable",
      formScoreChange: 0,
      sessionCompletionRate: 0,
      totalSessions: 0,
      expectedSessions: 0,
      initialPainLevel: 0,
      currentPainLevel: 0,
      painReduction: 0,
      recentScores: [],
    };
  }

  // Calculate average form score
  const avgFormScore = Math.round(
    sessionHistory.reduce((sum, s) => sum + s.formScore, 0) /
      sessionHistory.length
  );

  // Get recent scores for display (last 5)
  const recentScores = sessionHistory
    .slice(-5)
    .map((s) => s.formScore);

  // Calculate form score trend: compare first 5 vs last 5 sessions
  const first5 = sessionHistory.slice(0, Math.min(5, sessionHistory.length));
  const last5 = sessionHistory.slice(-Math.min(5, sessionHistory.length));

  const first5Avg =
    first5.reduce((sum, s) => sum + s.formScore, 0) / first5.length;
  const last5Avg =
    last5.reduce((sum, s) => sum + s.formScore, 0) / last5.length;

  const formScoreChange = Math.round(last5Avg - first5Avg);
  let formScoreTrend: TrendDirection = "stable";
  if (formScoreChange > 3) {
    formScoreTrend = "improving";
  } else if (formScoreChange < -3) {
    formScoreTrend = "declining";
  }

  // Calculate session completion rate (sessions in last 4 weeks / expected 3-4 per week)
  // Use most recent session date as reference point to avoid hydration mismatch
  const sortedByDate = [...sessionHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const mostRecentDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].date) : new Date(0);
  const fourWeeksBeforeRecent = new Date(mostRecentDate);
  fourWeeksBeforeRecent.setDate(fourWeeksBeforeRecent.getDate() - 28);

  const sessionsInLast4Weeks = sessionHistory.filter(
    (s) => new Date(s.date) >= fourWeeksBeforeRecent
  ).length;

  const expectedSessions = 14; // Assuming 3.5 sessions per week for 4 weeks
  const sessionCompletionRate = Math.min(
    100,
    Math.round((sessionsInLast4Weeks / expectedSessions) * 100)
  );

  // Calculate pain levels
  const sessionsWithPain = sessionHistory.filter(
    (s) => s.painLevel !== undefined
  );
  const initialPainLevel =
    sessionsWithPain.length > 0 ? sessionsWithPain[0].painLevel ?? 0 : 0;
  const currentPainLevel =
    sessionsWithPain.length > 0
      ? sessionsWithPain[sessionsWithPain.length - 1].painLevel ?? 0
      : 0;
  const painReduction = calculatePainReduction(initialPainLevel, currentPainLevel);

  return {
    avgFormScore,
    formScoreTrend,
    formScoreChange,
    sessionCompletionRate,
    totalSessions: sessionsInLast4Weeks,
    expectedSessions,
    initialPainLevel,
    currentPainLevel,
    painReduction,
    recentScores,
  };
}

function getTrendIcon(trend: TrendDirection) {
  switch (trend) {
    case "improving":
      return TrendingUp;
    case "declining":
      return TrendingDown;
    default:
      return Minus;
  }
}

function getTrendBadgeVariant(trend: TrendDirection) {
  switch (trend) {
    case "improving":
      return "success" as const;
    case "declining":
      return "error" as const;
    default:
      return "muted" as const;
  }
}

function getBenchmarkBadgeVariant(status: "above" | "within" | "below") {
  switch (status) {
    case "above":
      return "success" as const;
    case "within":
      return "info" as const;
    case "below":
      return "warning" as const;
  }
}

export default function PatientAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const getPatientById = usePTStore((state) => state.getPatientById);
  const patient = getPatientById(patientId);

  const analytics = useMemo(() => {
    if (!patient) return null;
    return calculateAnalytics(patient.sessionHistory);
  }, [patient]);

  const benchmarkComparisons = useMemo(() => {
    if (!analytics) return null;

    // Calculate form score improvement percentage
    const formScoreImprovement = calculateFormScoreImprovement(
      analytics.recentScores[0] ?? analytics.avgFormScore,
      analytics.recentScores[analytics.recentScores.length - 1] ?? analytics.avgFormScore
    );

    return {
      formScoreImprovement: compareToBenchmark(
        "formScoreImprovement",
        Math.abs(formScoreImprovement)
      ),
      sessionCompletionRate: compareToBenchmark(
        "sessionCompletionRate",
        analytics.sessionCompletionRate
      ),
      painReduction: compareToBenchmark(
        "painReduction",
        analytics.painReduction
      ),
    };
  }, [analytics]);

  if (!patient || !analytics) {
    return (
      <div className="max-w-4xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Patient not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TrendIcon = getTrendIcon(analytics.formScoreTrend);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {patient.name} - Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Progress tracking and benchmark comparison
          </p>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Key Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Average Form Score"
            value={analytics.avgFormScore}
            customIcon={<GoalIcon className="w-5 h-5" />}
            variant="sage"
            trend={{
              direction:
                analytics.formScoreTrend === "improving"
                  ? "up"
                  : analytics.formScoreTrend === "declining"
                  ? "down"
                  : "neutral",
              value:
                analytics.formScoreChange > 0
                  ? `+${analytics.formScoreChange} pts`
                  : analytics.formScoreChange < 0
                  ? `${analytics.formScoreChange} pts`
                  : "Stable",
            }}
          />

          <StatsCard
            title="Session Completion"
            value={`${analytics.sessionCompletionRate}%`}
            customIcon={<CalendarIcon className="w-5 h-5" />}
            trend={{
              direction: analytics.sessionCompletionRate >= 70 ? "up" : "down",
              value: `${analytics.totalSessions}/${analytics.expectedSessions} sessions`,
            }}
          />

          <StatsCard
            title="Pain Reduction"
            value={`${analytics.painReduction}%`}
            customIcon={<ChartIcon className="w-5 h-5" />}
            variant={analytics.painReduction >= 20 ? "sage" : "default"}
            trend={{
              direction: analytics.painReduction > 0 ? "up" : "neutral",
              value: `${analytics.initialPainLevel} -> ${analytics.currentPainLevel}/10`,
            }}
          />
        </div>
      </section>

      {/* Form Score Trend Details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Form Score Trend</h2>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Performance</CardTitle>
              <Badge variant={getTrendBadgeVariant(analytics.formScoreTrend)}>
                <TrendIcon size={14} className="mr-1" />
                {analytics.formScoreTrend.charAt(0).toUpperCase() +
                  analytics.formScoreTrend.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ProgressRing value={analytics.avgFormScore} size="lg" color="sage">
                <div className="text-center">
                  <span className="text-2xl font-bold">{analytics.avgFormScore}</span>
                  <span className="text-xs text-muted-foreground block">avg</span>
                </div>
              </ProgressRing>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Last 5 Session Scores
                  </p>
                  <div className="flex gap-2">
                    {analytics.recentScores.map((score, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-sage-50 rounded-lg p-2 text-center border border-sage-100"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Trend:</span>
                  <span
                    className={
                      analytics.formScoreTrend === "improving"
                        ? "text-green-600 font-medium"
                        : analytics.formScoreTrend === "declining"
                        ? "text-red-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {analytics.formScoreChange > 0 ? "+" : ""}
                    {analytics.formScoreChange} points from first sessions
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pain Level Tracking */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Pain Level Tracking</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Starting Pain Level</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.initialPainLevel}/10
                </p>
              </div>

              <div className="flex items-center gap-2 px-4">
                <div className="w-24 h-2 bg-sage-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage-500 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, analytics.painReduction)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-sage-600">
                  {analytics.painReduction}% reduction
                </span>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Current Pain Level</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.currentPainLevel}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Benchmark Comparisons */}
      {benchmarkComparisons && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Benchmark Comparisons
          </h2>
          <p className="text-sm text-muted-foreground -mt-2">
            How this patient compares to typical clinical outcomes
          </p>

          <div className="grid grid-cols-1 gap-4">
            {/* Form Score Improvement Benchmark */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {BENCHMARKS.formScoreImprovement.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {BENCHMARKS.formScoreImprovement.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {benchmarkComparisons.formScoreImprovement.patientValue}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: {BENCHMARKS.formScoreImprovement.minValue}-
                        {BENCHMARKS.formScoreImprovement.maxValue}%
                      </p>
                    </div>
                    <Badge
                      variant={getBenchmarkBadgeVariant(
                        benchmarkComparisons.formScoreImprovement.status
                      )}
                      size="sm"
                    >
                      {getBenchmarkStatusMessage(
                        benchmarkComparisons.formScoreImprovement.status
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Completion Rate Benchmark */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {BENCHMARKS.sessionCompletionRate.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {BENCHMARKS.sessionCompletionRate.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {benchmarkComparisons.sessionCompletionRate.patientValue}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: {BENCHMARKS.sessionCompletionRate.minValue}-
                        {BENCHMARKS.sessionCompletionRate.maxValue}%
                      </p>
                    </div>
                    <Badge
                      variant={getBenchmarkBadgeVariant(
                        benchmarkComparisons.sessionCompletionRate.status
                      )}
                      size="sm"
                    >
                      {getBenchmarkStatusMessage(
                        benchmarkComparisons.sessionCompletionRate.status
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pain Reduction Benchmark */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {BENCHMARKS.painReduction.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {BENCHMARKS.painReduction.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {benchmarkComparisons.painReduction.patientValue}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: {BENCHMARKS.painReduction.minValue}-
                        {BENCHMARKS.painReduction.maxValue}%
                      </p>
                    </div>
                    <Badge
                      variant={getBenchmarkBadgeVariant(
                        benchmarkComparisons.painReduction.status
                      )}
                      size="sm"
                    >
                      {getBenchmarkStatusMessage(
                        benchmarkComparisons.painReduction.status
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
