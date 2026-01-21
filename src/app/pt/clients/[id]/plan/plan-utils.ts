/**
 * Plan Builder Utilities
 *
 * Helper functions for the plan builder page.
 */

import type { PlanWeek } from "@/lib/gemini/types";

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
 * Get badge variant for exercise category
 */
export function getCategoryBadgeVariant(
  category: string
): "default" | "success" | "info" | "warning" | "coral" | "muted" {
  const variants: Record<
    string,
    "default" | "success" | "info" | "warning" | "coral" | "muted"
  > = {
    mobility: "info",
    extension: "success",
    stretch: "warning",
    strengthening: "coral",
    core_stability: "success",
    neural_mobilization: "muted",
  };
  return variants[category] || "default";
}

/**
 * Get the full day label for a day value
 */
export function getDayLabel(dayValue: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === dayValue)?.fullLabel || "";
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
 * Generate a unique exercise ID
 */
export function generateExerciseId(): string {
  return `pe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

/**
 * Get the focus description for a week number
 */
export function getWeekFocus(weekNum: number): string {
  if (weekNum <= 2) return "Pain relief and gentle mobility";
  if (weekNum <= 4) return "Core activation and stability basics";
  if (weekNum <= 6) return "Progressive strengthening";
  if (weekNum <= 8) return "Functional movement patterns";
  if (weekNum <= 10) return "Advanced stability and endurance";
  return "Maintenance and independence";
}

/**
 * Get the notes for a week number
 */
export function getWeekNotes(weekNum: number): string {
  if (weekNum <= 2) return "Focus on pain-free movement. Stop if pain increases.";
  if (weekNum <= 4) return "Begin engaging core muscles. Maintain neutral spine.";
  if (weekNum <= 6) return "Increase difficulty gradually. Monitor fatigue.";
  if (weekNum <= 8) return "Apply exercises to daily movements.";
  if (weekNum <= 10) return "Build endurance. Longer holds, more reps.";
  return "You're ready for independent maintenance!";
}
