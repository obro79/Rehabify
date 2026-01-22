/**
 * Consolidated mock data for development
 * Generates realistic patient data with session history, alerts, and plans
 */

import { getRecommendedExercises, tier1Exercises, toCardData } from "../exercises";
import type { DisplayCategory } from "../exercises/types";

// ============================================================================
// Types
// ============================================================================

export interface Alert {
  id: string;
  type: "missed_session" | "pain_report" | "declining_form";
  severity: "low" | "medium" | "high";
  message: string;
  createdAt: Date;
}

export interface PlanExercise {
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  order: number;
  dayOfWeek?: number;
}

export interface Plan {
  id: string;
  name: string;
  status: "pending_review" | "approved" | "rejected" | "modified";
  exercises: PlanExercise[];
  createdAt: Date;
  reviewedAt?: Date;
  notes?: string;
}

export interface Session {
  id: string;
  date: Date;
  exerciseId: string;
  exerciseName: string;
  category: string;
  formScore: number;
  duration: string;
  repCount: number;
  painLevel?: number;
}

export interface MockPatient {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: "active" | "inactive" | "alert";
  memberSince: Date;
  alerts: Alert[];
  lastSession: Date | null;
  currentPlan: Plan | null;
  sessionHistory: Session[];
}

export interface FormScoreDataPoint {
  date: string;
  score: number;
  exerciseId: string;
}

export interface ActivityDataPoint {
  date: string;
  sessionCount: number;
}

export interface ExerciseScoreSummary {
  exerciseId: string;
  exerciseName: string;
  category: DisplayCategory;
  averageScore: number;
  sessionCount: number;
}

export interface PersonalRecords {
  bestScore: { score: number; exerciseName: string; date: string };
  longestStreak: number;
  totalSessions: number;
  totalTimeMinutes: number;
}

export interface SessionFrequencyDataPoint {
  week: string;
  sessionCount: number;
}

// ============================================================================
// Date Utilities (deterministic for SSR hydration)
// ============================================================================

const REFERENCE_DATE = new Date("2025-12-29T12:00:00Z");
const MS_PER_DAY = 86400000;

function daysAgo(days: number): Date {
  const date = new Date(REFERENCE_DATE);
  date.setDate(date.getDate() - days);
  return date;
}

function weeksAgo(weeks: number): Date {
  return daysAgo(weeks * 7);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDuration(seed: number, baseMinutes: number, variance: number): string {
  const minutes = Math.floor(seededRandom(seed) * variance + baseMinutes);
  const seconds = Math.floor(seededRandom(seed * 2 + 7) * 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// ============================================================================
// Session Generation Factories
// ============================================================================

type Trend = "improving" | "declining" | "stable";

interface ExerciseConfig {
  id: string;
  name: string;
  category: string;
  reps: number;
}

function generateFormScoreTrend(
  count: number,
  trend: Trend,
  baseScore: number
): number[] {
  const scores: number[] = [];
  for (let i = 0; i < count; i++) {
    const variance = seededRandom(i * 17 + baseScore) * 5;
    let score = baseScore;
    if (trend === "improving") {
      score = Math.min(95, baseScore + i * 3 + variance);
    } else if (trend === "declining") {
      score = Math.max(40, baseScore - i * 2.5 + variance);
    } else {
      score = baseScore + (seededRandom(i * 31 + baseScore) * 10 - 5);
    }
    scores.push(Math.round(score));
  }
  return scores;
}

function generatePainLevels(formScores: number[]): number[] {
  return formScores.map((score, i) => {
    const basePain = 10 - score / 10;
    const variance = seededRandom(i * 23 + score) * 2 - 1;
    return Math.max(0, Math.min(10, Math.round(basePain + variance)));
  });
}

function createSessions(
  patientId: string,
  config: {
    count: number;
    trend: Trend;
    baseScore: number;
    seedOffset: number;
    startDaysAgo: number;
    exercises: ExerciseConfig[];
    painOverride?: { index: number; value: number };
  }
): Session[] {
  const scores = generateFormScoreTrend(config.count, config.trend, config.baseScore);
  const painLevels = generatePainLevels(scores);

  if (config.painOverride) {
    painLevels[config.painOverride.index] = config.painOverride.value;
  }

  return scores.map((score, i) => {
    const exercise = config.exercises[i % config.exercises.length];
    return {
      id: `session-${patientId}-${i}`,
      date: daysAgo(config.startDaysAgo - i),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      formScore: score,
      duration: generateDuration(i + config.seedOffset, 7, 4),
      repCount: exercise.reps,
      painLevel: painLevels[i],
    };
  });
}

// ============================================================================
// Exercise Definitions (shared across patients)
// ============================================================================

const EXERCISES: Record<string, ExerciseConfig> = {
  catCamel: { id: "cat-camel", name: "Cat-Camel", category: "mobility", reps: 10 },
  birdDog: { id: "bird-dog", name: "Bird Dog", category: "stability", reps: 8 },
  quadSets: { id: "quad-sets", name: "Quad Sets", category: "strength", reps: 12 },
  wallSlides: { id: "wall-slides", name: "Wall Slides", category: "mobility", reps: 10 },
  deadBug: { id: "dead-bug", name: "Dead Bug", category: "stability", reps: 10 },
  plank: { id: "plank", name: "Plank", category: "strength", reps: 1 },
  clamshells: { id: "clamshells", name: "Clamshells", category: "strength", reps: 15 },
  anklePumps: { id: "ankle-pumps", name: "Ankle Pumps", category: "mobility", reps: 20 },
  cobra: { id: "cobra", name: "Cobra", category: "stretch", reps: 5 },
  chinTucks: { id: "chin-tucks", name: "Chin Tucks", category: "posture", reps: 12 },
};

// ============================================================================
// Plan Factory
// ============================================================================

function createPlanExercise(
  id: string,
  exercise: ExerciseConfig,
  order: number,
  sets: number = 3,
  holdSeconds?: number
): PlanExercise {
  return {
    id,
    exerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    sets,
    reps: exercise.reps,
    order,
    ...(holdSeconds && { holdSeconds }),
  };
}

function createPlan(
  id: string,
  name: string,
  status: Plan["status"],
  exercises: PlanExercise[],
  createdWeeksAgo: number,
  notes?: string
): Plan {
  const createdAt = status === "pending_review" ? daysAgo(1) : weeksAgo(createdWeeksAgo);
  return {
    id,
    name,
    status,
    exercises,
    createdAt,
    reviewedAt: status === "approved" ? createdAt : undefined,
    notes,
  };
}

// ============================================================================
// Alert Factory
// ============================================================================

function createAlert(
  id: string,
  type: Alert["type"],
  severity: Alert["severity"],
  message: string,
  daysAgoCreated: number
): Alert {
  return { id, type, severity, message, createdAt: daysAgo(daysAgoCreated) };
}

// ============================================================================
// Patient Factory
// ============================================================================

interface PatientConfig {
  id: string;
  name: string;
  email: string;
  status: MockPatient["status"];
  memberWeeksAgo: number;
  lastSessionDaysAgo: number | null;
  alerts: Alert[];
  plan: Plan | null;
  sessionConfig: Parameters<typeof createSessions>[1];
}

function createPatient(config: PatientConfig): MockPatient {
  return {
    id: config.id,
    name: config.name,
    email: config.email,
    status: config.status,
    memberSince: weeksAgo(config.memberWeeksAgo),
    alerts: config.alerts,
    lastSession: config.lastSessionDaysAgo !== null ? daysAgo(config.lastSessionDaysAgo) : null,
    currentPlan: config.plan,
    sessionHistory: createSessions(config.id, config.sessionConfig),
  };
}

// ============================================================================
// Mock Patients (PT Dashboard)
// ============================================================================

export const mockPatients: MockPatient[] = [
  createPatient({
    id: "pt-001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    status: "active",
    memberWeeksAgo: 12,
    lastSessionDaysAgo: 1,
    alerts: [],
    plan: createPlan("plan-001", "Lower Back Recovery Program", "approved", [
      createPlanExercise("pe-001", EXERCISES.catCamel, 0, 2),
      createPlanExercise("pe-002", EXERCISES.birdDog, 1, 3),
    ], 6),
    sessionConfig: {
      count: 24,
      trend: "improving",
      baseScore: 65,
      seedOffset: 100,
      startDaysAgo: 24,
      exercises: [EXERCISES.catCamel, EXERCISES.birdDog],
    },
  }),
  createPatient({
    id: "pt-002",
    name: "Michael Chen",
    email: "michael.chen@email.com",
    status: "alert",
    memberWeeksAgo: 8,
    lastSessionDaysAgo: 2,
    alerts: [
      createAlert("alert-001", "pain_report", "medium", "Pain level reported at 7/10 during last session", 2),
    ],
    plan: createPlan(
      "plan-002",
      "Modified Knee Strengthening",
      "pending_review",
      [createPlanExercise("pe-003", EXERCISES.quadSets, 0)],
      0,
      "AI-suggested plan based on recent pain reports"
    ),
    sessionConfig: {
      count: 18,
      trend: "stable",
      baseScore: 72,
      seedOffset: 200,
      startDaysAgo: 18,
      exercises: [EXERCISES.quadSets],
      painOverride: { index: 17, value: 7 },
    },
  }),
  createPatient({
    id: "pt-003",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@email.com",
    status: "alert",
    memberWeeksAgo: 16,
    lastSessionDaysAgo: 5,
    alerts: [
      createAlert("alert-002", "declining_form", "high", "Form score declined 18 points from baseline", 3),
      createAlert("alert-003", "missed_session", "medium", "Missed 2 sessions in the last week", 1),
    ],
    plan: createPlan("plan-003", "Shoulder Mobility Protocol", "approved", [
      createPlanExercise("pe-004", EXERCISES.wallSlides, 0, 2),
    ], 10),
    sessionConfig: {
      count: 20,
      trend: "declining",
      baseScore: 78,
      seedOffset: 300,
      startDaysAgo: 25,
      exercises: [EXERCISES.wallSlides],
    },
  }),
  createPatient({
    id: "pt-004",
    name: "David Kim",
    email: "david.kim@email.com",
    status: "active",
    memberWeeksAgo: 4,
    lastSessionDaysAgo: 1,
    alerts: [],
    plan: createPlan(
      "plan-004",
      "Core Stabilization Program",
      "pending_review",
      [
        createPlanExercise("pe-005", EXERCISES.deadBug, 0),
        createPlanExercise("pe-006", EXERCISES.plank, 1, 3, 30),
      ],
      0,
      "Progression plan after successful completion of basic program"
    ),
    sessionConfig: {
      count: 12,
      trend: "improving",
      baseScore: 68,
      seedOffset: 400,
      startDaysAgo: 12,
      exercises: [EXERCISES.catCamel, EXERCISES.cobra],
    },
  }),
  createPatient({
    id: "pt-005",
    name: "Jessica Martinez",
    email: "jessica.martinez@email.com",
    status: "alert",
    memberWeeksAgo: 20,
    lastSessionDaysAgo: 12,
    alerts: [
      createAlert("alert-004", "missed_session", "high", "No activity in the last 10 days", 3),
    ],
    plan: createPlan("plan-005", "Hip Strengthening", "approved", [
      createPlanExercise("pe-007", EXERCISES.clamshells, 0),
    ], 14),
    sessionConfig: {
      count: 15,
      trend: "stable",
      baseScore: 75,
      seedOffset: 500,
      startDaysAgo: 30,
      exercises: [EXERCISES.clamshells],
    },
  }),
  createPatient({
    id: "pt-006",
    name: "Robert Taylor",
    email: "robert.taylor@email.com",
    status: "active",
    memberWeeksAgo: 10,
    lastSessionDaysAgo: 2,
    alerts: [],
    plan: createPlan("plan-006", "Ankle Mobility & Strength", "approved", [
      createPlanExercise("pe-008", EXERCISES.anklePumps, 0),
    ], 8),
    sessionConfig: {
      count: 22,
      trend: "stable",
      baseScore: 80,
      seedOffset: 600,
      startDaysAgo: 22,
      exercises: [EXERCISES.anklePumps],
    },
  }),
  createPatient({
    id: "pt-007",
    name: "Amanda Lee",
    email: "amanda.lee@email.com",
    status: "active",
    memberWeeksAgo: 6,
    lastSessionDaysAgo: 1,
    alerts: [],
    plan: createPlan(
      "plan-007",
      "Comprehensive Back Care",
      "pending_review",
      [
        createPlanExercise("pe-009", EXERCISES.catCamel, 0, 2),
        createPlanExercise("pe-010", EXERCISES.cobra, 1, 3, 15),
        createPlanExercise("pe-011", EXERCISES.birdDog, 2),
      ],
      0,
      "Progressive plan upgrade based on 6-week improvement"
    ),
    sessionConfig: {
      count: 18,
      trend: "improving",
      baseScore: 62,
      seedOffset: 700,
      startDaysAgo: 18,
      exercises: [EXERCISES.catCamel, EXERCISES.cobra, EXERCISES.birdDog],
    },
  }),
  createPatient({
    id: "pt-008",
    name: "Christopher Brown",
    email: "chris.brown@email.com",
    status: "alert",
    memberWeeksAgo: 14,
    lastSessionDaysAgo: 1,
    alerts: [
      createAlert("alert-005", "pain_report", "medium", "Pain level increased to 6/10", 1),
    ],
    plan: createPlan("plan-008", "Neck & Upper Back Relief", "approved", [
      createPlanExercise("pe-012", EXERCISES.chinTucks, 0),
    ], 12),
    sessionConfig: {
      count: 26,
      trend: "improving",
      baseScore: 70,
      seedOffset: 800,
      startDaysAgo: 26,
      exercises: [EXERCISES.chinTucks],
      painOverride: { index: 25, value: 6 },
    },
  }),
  createPatient({
    id: "pt-009",
    name: "Sophia Patel",
    email: "sophia.patel@email.com",
    status: "active",
    memberWeeksAgo: 3,
    lastSessionDaysAgo: 0,
    alerts: [],
    plan: createPlan("plan-009", "Beginner Core Program", "approved", [
      createPlanExercise("pe-013", EXERCISES.catCamel, 0, 2),
    ], 3),
    sessionConfig: {
      count: 10,
      trend: "improving",
      baseScore: 55,
      seedOffset: 900,
      startDaysAgo: 10,
      exercises: [EXERCISES.catCamel],
    },
  }),
  createPatient({
    id: "pt-010",
    name: "Daniel Wilson",
    email: "daniel.wilson@email.com",
    status: "active",
    memberWeeksAgo: 18,
    lastSessionDaysAgo: 1,
    alerts: [],
    plan: createPlan("plan-010", "Advanced Stability Training", "approved", [
      createPlanExercise("pe-014", EXERCISES.deadBug, 0),
      createPlanExercise("pe-015", EXERCISES.birdDog, 1),
    ], 15),
    sessionConfig: {
      count: 28,
      trend: "stable",
      baseScore: 85,
      seedOffset: 1000,
      startDaysAgo: 28,
      exercises: [EXERCISES.deadBug, EXERCISES.birdDog],
    },
  }),
];

// ============================================================================
// Patient Dashboard Mock Data
// ============================================================================

export const mockExercises = getRecommendedExercises(4);
export const aiEnabledExercises = tier1Exercises.map(toCardData);

export const motivationalQuotes = [
  "Consistency is more important than perfection. Keep up the great work!",
  "Every rep counts. You're building a stronger you.",
  "Small progress is still progress. Stay the course!",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The only bad workout is the one that didn't happen.",
];

export function getRandomQuote(): string {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

export const mockSessions = [
  { date: "Today, 8:32 AM", exercise: "Cat-Camel", category: "Mobility" as const, reps: 12, score: 85, duration: "5:23" },
  { date: "Yesterday", exercise: "Dead Bug", category: "Stability" as const, reps: 20, score: 78, duration: "12:45" },
  { date: "2 days ago", exercise: "Bird Dog", category: "Stability" as const, reps: 10, score: 82, duration: "6:12" },
  { date: "3 days ago", exercise: "Cobra Stretch", category: "Mobility" as const, reps: 10, score: 91, duration: "4:15" },
  { date: "4 days ago", exercise: "Glute Bridge", category: "Strength" as const, reps: 15, score: 88, duration: "7:30" },
];

export const mockWeeklyActivity = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - MS_PER_DAY * i).toISOString().split("T")[0],
  completed: i !== 2 && i !== 5,
}));

// ============================================================================
// History Sessions (generated from compact data)
// ============================================================================

// Format: [daysAgo, dateString, time, exercise, category, reps, score, duration]
type HistoryTuple = [number, string, string, string, DisplayCategory, number, number, string];
const HISTORY_DATA: HistoryTuple[] = [
  [0, "Today", "8:32 AM", "Cat-Camel", "Mobility", 12, 85, "5:23"],
  [1, "Yesterday", "7:15 AM", "Dead Bug", "Stability", 20, 78, "12:45"],
  [1, "Yesterday", "6:45 PM", "Glute Bridge", "Strength", 15, 92, "8:20"],
  [2, "2 days ago", "9:00 AM", "Bird Dog", "Stability", 10, 82, "6:12"],
  [3, "3 days ago", "7:30 AM", "Cobra Stretch", "Mobility", 10, 91, "4:15"],
  [4, "4 days ago", "8:15 AM", "Glute Bridge", "Strength", 15, 88, "7:30"],
  [5, "5 days ago", "6:00 PM", "Pelvic Tilt", "Mobility", 15, 76, "5:45"],
  [6, "6 days ago", "7:00 AM", "Wall Squat", "Strength", 8, 68, "10:30"],
  [7, "1 week ago", "8:45 AM", "Cat-Camel", "Mobility", 12, 80, "5:10"],
  [8, "8 days ago", "7:20 AM", "Dead Bug", "Stability", 18, 75, "11:30"],
  [10, "10 days ago", "6:30 PM", "Child's Pose", "Mobility", 5, 95, "3:20"],
  [12, "12 days ago", "8:00 AM", "Plank", "Stability", 3, 87, "6:00"],
  [14, "2 weeks ago", "7:15 AM", "Hip Flexor Stretch", "Mobility", 8, 89, "4:40"],
  [15, "15 days ago", "6:45 PM", "Clamshell", "Strength", 20, 73, "8:15"],
  [18, "18 days ago", "9:00 AM", "Bird Dog", "Stability", 12, 84, "7:05"],
  [20, "20 days ago", "7:30 AM", "Cat-Camel", "Mobility", 10, 79, "4:50"],
  [22, "22 days ago", "8:15 AM", "Knee to Chest", "Mobility", 10, 86, "5:30"],
  [25, "25 days ago", "6:00 PM", "Superman", "Strength", 15, 71, "9:20"],
  [27, "27 days ago", "7:00 AM", "Dead Bug", "Stability", 16, 77, "10:45"],
  [29, "29 days ago", "8:30 AM", "Glute Bridge", "Strength", 12, 90, "7:10"],
];

export const mockHistorySessions = HISTORY_DATA.map(([daysAgo, dateString, time, exercise, category, reps, score, duration], i) => ({
  id: String(i + 1),
  date: new Date(Date.now() - MS_PER_DAY * daysAgo),
  dateString,
  time,
  exercise,
  category,
  reps,
  score,
  duration,
}));

// ============================================================================
// Progress Data (lazy-loaded for performance)
// ============================================================================

let _mockFormScores: FormScoreDataPoint[] | null = null;
let _mockActivityData: ActivityDataPoint[] | null = null;
let _mockExerciseBreakdown: ExerciseScoreSummary[] | null = null;
let _mockPersonalRecords: PersonalRecords | null = null;
let _mockSessionFrequency: SessionFrequencyDataPoint[] | null = null;

export function getMockFormScores(): FormScoreDataPoint[] {
  if (_mockFormScores) return _mockFormScores;

  const scores: FormScoreDataPoint[] = [];
  const exercises = ["cat-camel", "dead-bug", "cobra-stretch", "bird-dog", "glute-bridge"];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const sessionsPerDay = Math.floor(Math.random() * 3);

    for (let j = 0; j < sessionsPerDay; j++) {
      scores.push({
        date: date.toISOString().split("T")[0],
        score: Math.floor(Math.random() * 30) + 70,
        exerciseId: exercises[Math.floor(Math.random() * exercises.length)],
      });
    }
  }

  _mockFormScores = scores;
  return scores;
}

export function getMockActivityData(): ActivityDataPoint[] {
  if (_mockActivityData) return _mockActivityData;

  const activity: ActivityDataPoint[] = [];
  const now = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const hasSession = Math.random() < 0.7;

    activity.push({
      date: date.toISOString().split("T")[0],
      sessionCount: hasSession ? Math.floor(Math.random() * 3) + 1 : 0,
    });
  }

  _mockActivityData = activity;
  return activity;
}

export function getMockExerciseBreakdown(): ExerciseScoreSummary[] {
  if (_mockExerciseBreakdown) return _mockExerciseBreakdown;

  const exerciseMap = new Map<string, { scores: number[]; category: DisplayCategory }>();

  mockHistorySessions.forEach((session) => {
    const key = session.exercise;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { scores: [], category: session.category });
    }
    exerciseMap.get(key)!.scores.push(session.score);
  });

  const summaries: ExerciseScoreSummary[] = [];
  exerciseMap.forEach((data, exerciseName) => {
    const averageScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
    summaries.push({
      exerciseId: exerciseName.toLowerCase().replace(/\s+/g, "-"),
      exerciseName,
      category: data.category,
      averageScore: Math.round(averageScore),
      sessionCount: data.scores.length,
    });
  });

  _mockExerciseBreakdown = summaries.sort((a, b) => b.averageScore - a.averageScore);
  return _mockExerciseBreakdown;
}

export function getMockPersonalRecords(): PersonalRecords {
  if (_mockPersonalRecords) return _mockPersonalRecords;

  const bestSession = mockHistorySessions.reduce((best, session) =>
    session.score > best.score ? session : best
  );

  const totalTimeMinutes = mockHistorySessions.reduce((total, session) => {
    const [minutes, seconds] = session.duration.split(":").map(Number);
    return total + minutes + seconds / 60;
  }, 0);

  const sortedSessions = [...mockHistorySessions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  sortedSessions.forEach((session) => {
    if (lastDate) {
      const dayDiff = Math.floor(
        (session.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayDiff === 1) {
        currentStreak++;
      } else if (dayDiff > 1) {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    lastDate = session.date;
  });
  longestStreak = Math.max(longestStreak, currentStreak);

  _mockPersonalRecords = {
    bestScore: {
      score: bestSession.score,
      exerciseName: bestSession.exercise,
      date: bestSession.date.toISOString().split("T")[0],
    },
    longestStreak,
    totalSessions: mockHistorySessions.length,
    totalTimeMinutes: Math.round(totalTimeMinutes),
  };

  return _mockPersonalRecords;
}

export function getMockSessionFrequency(): SessionFrequencyDataPoint[] {
  if (_mockSessionFrequency) return _mockSessionFrequency;

  const frequency: SessionFrequencyDataPoint[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const sessionsInWeek = mockHistorySessions.filter(
      (session) => session.date >= weekStart && session.date < weekEnd
    ).length;

    frequency.push({
      week: `Week ${12 - i}`,
      sessionCount: sessionsInWeek > 0 ? sessionsInWeek : Math.floor(Math.random() * 5) + 2,
    });
  }

  _mockSessionFrequency = frequency;
  return frequency;
}
