/**
 * Plan Builder Utilities
 *
 * Helper functions for the plan builder page.
 */

import type { PlanWeek } from "@/lib/gemini/types";

// Re-export from canonical source
export { getCategoryBadgeVariant } from "@/lib/exercise-utils";

/**
 * Day configuration for weekly plan tabs
 */
export const DAYS_OF_WEEK = [
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
  { value: 0, label: "Sun", fullLabel: "Sunday" },
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/**
 * Format category string for display (snake_case to Title Case)
 */
export function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the short day label for a day value
 */
export function getShortDayLabel(dayValue: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === dayValue)?.label || "";
}

/**
 * Format days array to comma-separated short labels
 */
export function formatDaysToLabels(days: number[]): string {
  return days.map((d) => getShortDayLabel(d)).join(", ");
}

/**
 * Get exercise count for a specific day in a week
 */
export function getExerciseCountForDay(
  currentWeek: PlanWeek | null | undefined,
  legacyPlan: Array<{ dayOfWeek?: number }>,
  day: number
): number {
  if (currentWeek) {
    return currentWeek.exercises.filter((ex) => ex.days.includes(day)).length;
  }
  return legacyPlan.filter((ex) => ex.dayOfWeek === day).length;
}
