import type { FormBreakdownItem, NextExercise } from "./types";

export const MOCK_SESSION_DATA = {
  userName: "Sarah",
  formScore: 85,
  repsCompleted: 10,
  targetReps: 10,
  duration: "5:23",
  xpEarned: 125,
  currentLevel: 3,
  levelProgress: 67,
  currentXP: 325,
  nextLevelXP: 500,
  currentStreak: 6,
  bestStreak: 12,
  formBreakdown: [
    { metric: "Range of Motion", score: 95, feedback: "Excellent!" },
    { metric: "Head Position", score: 82, feedback: "Good" },
    { metric: "Alignment", score: 78, feedback: "Maintain stability" },
    { metric: "Movement Pace", score: 88, feedback: "Great control" },
  ] as FormBreakdownItem[],
  coachSummary:
    "Excellent session! Your form is improving significantly. Focus on maintaining control throughout the entire range of motion next time. Overall, this was a great workout!",
  nextExercise: {
    name: "Cobra Extension",
    slug: "cobra-stretch",
    duration: "5 min",
  } as NextExercise,
} as const;

export const ANIMATION_DELAYS = {
  formScore: "0ms",
  reps: "100ms",
  duration: "200ms",
  xp: "300ms",
  streak: "400ms",
  coach: "500ms",
  nextSteps: "600ms",
} as const;
