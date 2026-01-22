// Dashboard configuration constants

export const DASHBOARD_USER_NAME = "Sarah";

export const WEEKLY_STATS = {
  sessionsCompleted: "4/7",
  sessionsTrend: "+1 from last week",
  totalReps: 120,
  repsTrend: "+15%",
  timeExercising: "45 min",
} as const;

export const FORM_SCORE_CONFIG = {
  score: 82,
  improvement: "+5%",
  focusArea: "Hip alignment",
} as const;

export const WEEKLY_ACTIVITY_CONFIG = {
  completedDays: 4,
  totalDays: 7,
  remainingDays: 3,
} as const;

// Re-export from centralized date-utils
export { getTimeOfDayGreeting } from "@/lib/date-utils";
