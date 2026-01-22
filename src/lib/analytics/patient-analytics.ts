import { calculatePainReduction } from "@/lib/mock-data/pt-benchmarks";

export type TrendDirection = "improving" | "declining" | "stable";

export interface AnalyticsData {
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

const EMPTY_ANALYTICS: AnalyticsData = {
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

function calculateTrend(change: number): TrendDirection {
  if (change > 3) return "improving";
  if (change < -3) return "declining";
  return "stable";
}

function getAverage(sessions: Array<{ formScore: number }>): number {
  return sessions.reduce((sum, s) => sum + s.formScore, 0) / sessions.length;
}

export function calculateAnalytics(
  sessionHistory: Array<{ formScore: number; painLevel?: number; date: Date }>
): AnalyticsData {
  if (sessionHistory.length === 0) return EMPTY_ANALYTICS;

  const avgFormScore = Math.round(getAverage(sessionHistory));
  const recentScores = sessionHistory.slice(-5).map((s) => s.formScore);

  const first5 = sessionHistory.slice(0, Math.min(5, sessionHistory.length));
  const last5 = sessionHistory.slice(-Math.min(5, sessionHistory.length));
  const formScoreChange = Math.round(getAverage(last5) - getAverage(first5));

  const sortedByDate = [...sessionHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const mostRecentDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].date) : new Date(0);
  const fourWeeksAgo = new Date(mostRecentDate);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const sessionsInLast4Weeks = sessionHistory.filter(
    (s) => new Date(s.date) >= fourWeeksAgo
  ).length;

  const expectedSessions = 14;
  const sessionCompletionRate = Math.min(100, Math.round((sessionsInLast4Weeks / expectedSessions) * 100));

  const sessionsWithPain = sessionHistory.filter((s) => s.painLevel !== undefined);
  const initialPainLevel = sessionsWithPain[0]?.painLevel ?? 0;
  const currentPainLevel = sessionsWithPain[sessionsWithPain.length - 1]?.painLevel ?? 0;

  return {
    avgFormScore,
    formScoreTrend: calculateTrend(formScoreChange),
    formScoreChange,
    sessionCompletionRate,
    totalSessions: sessionsInLast4Weeks,
    expectedSessions,
    initialPainLevel,
    currentPainLevel,
    painReduction: calculatePainReduction(initialPainLevel, currentPainLevel),
    recentScores,
  };
}

export function getTrendDirection(trend: TrendDirection): "up" | "down" | "neutral" {
  if (trend === "improving") return "up";
  if (trend === "declining") return "down";
  return "neutral";
}

export function formatTrendValue(change: number): string {
  if (change > 0) return `+${change} pts`;
  if (change < 0) return `${change} pts`;
  return "Stable";
}

export function getTrendColor(trend: TrendDirection): string {
  if (trend === "improving") return "text-green-600 font-medium";
  if (trend === "declining") return "text-red-600 font-medium";
  return "text-muted-foreground";
}
