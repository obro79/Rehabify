// Mock data for development - will be replaced with real API calls
import { getRecommendedExercises, tier1Exercises, toCardData } from "./exercises";
import type { DisplayCategory } from "./exercises/types";

// Get recommended exercises from the real exercise library
export const mockExercises = getRecommendedExercises(4);

// Recent sessions (mock data - will come from database)
export const mockSessions = [
  {
    date: "Today, 8:32 AM",
    exercise: "Cat-Camel",
    category: "Mobility" as const,
    reps: 12,
    score: 85,
    duration: "5:23",
  },
  {
    date: "Yesterday",
    exercise: "Dead Bug",
    category: "Stability" as const,
    reps: 20,
    score: 78,
    duration: "12:45",
  },
  {
    date: "2 days ago",
    exercise: "Bird Dog",
    category: "Stability" as const,
    reps: 10,
    score: 82,
    duration: "6:12",
  },
  {
    date: "3 days ago",
    exercise: "Cobra Stretch",
    category: "Mobility" as const,
    reps: 10,
    score: 91,
    duration: "4:15",
  },
  {
    date: "4 days ago",
    exercise: "Glute Bridge",
    category: "Strength" as const,
    reps: 15,
    score: 88,
    duration: "7:30",
  },
];

// Weekly activity (mock data - will come from database)
export const mockWeeklyActivity = [
  { date: new Date().toISOString().split("T")[0], completed: true },
  { date: new Date(Date.now() - 86400000).toISOString().split("T")[0], completed: true },
  { date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0], completed: false },
  { date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0], completed: true },
  { date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0], completed: true },
  { date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0], completed: false },
  { date: new Date(Date.now() - 86400000 * 6).toISOString().split("T")[0], completed: true },
];

export const motivationalQuotes = [
  "Consistency is more important than perfection. Keep up the great work!",
  "Every rep counts. You're building a stronger you.",
  "Small progress is still progress. Stay the course!",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The only bad workout is the one that didn't happen.",
];

// Helper to get a random quote
export function getRandomQuote() {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

// Export tier 1 exercises for AI demo features
export const aiEnabledExercises = tier1Exercises.map(toCardData);

// Extended session history for History page (20 sessions spanning 30 days)
export const mockHistorySessions = [
  {
    id: "1",
    date: new Date(),
    dateString: "Today",
    time: "8:32 AM",
    exercise: "Cat-Camel",
    category: "Mobility" as const,
    reps: 12,
    score: 85,
    duration: "5:23",
  },
  {
    id: "2",
    date: new Date(Date.now() - 86400000),
    dateString: "Yesterday",
    time: "7:15 AM",
    exercise: "Dead Bug",
    category: "Stability" as const,
    reps: 20,
    score: 78,
    duration: "12:45",
  },
  {
    id: "3",
    date: new Date(Date.now() - 86400000),
    dateString: "Yesterday",
    time: "6:45 PM",
    exercise: "Glute Bridge",
    category: "Strength" as const,
    reps: 15,
    score: 92,
    duration: "8:20",
  },
  {
    id: "4",
    date: new Date(Date.now() - 86400000 * 2),
    dateString: "2 days ago",
    time: "9:00 AM",
    exercise: "Bird Dog",
    category: "Stability" as const,
    reps: 10,
    score: 82,
    duration: "6:12",
  },
  {
    id: "5",
    date: new Date(Date.now() - 86400000 * 3),
    dateString: "3 days ago",
    time: "7:30 AM",
    exercise: "Cobra Stretch",
    category: "Mobility" as const,
    reps: 10,
    score: 91,
    duration: "4:15",
  },
  {
    id: "6",
    date: new Date(Date.now() - 86400000 * 4),
    dateString: "4 days ago",
    time: "8:15 AM",
    exercise: "Glute Bridge",
    category: "Strength" as const,
    reps: 15,
    score: 88,
    duration: "7:30",
  },
  {
    id: "7",
    date: new Date(Date.now() - 86400000 * 5),
    dateString: "5 days ago",
    time: "6:00 PM",
    exercise: "Pelvic Tilt",
    category: "Mobility" as const,
    reps: 15,
    score: 76,
    duration: "5:45",
  },
  {
    id: "8",
    date: new Date(Date.now() - 86400000 * 6),
    dateString: "6 days ago",
    time: "7:00 AM",
    exercise: "Wall Squat",
    category: "Strength" as const,
    reps: 8,
    score: 68,
    duration: "10:30",
  },
  {
    id: "9",
    date: new Date(Date.now() - 86400000 * 7),
    dateString: "1 week ago",
    time: "8:45 AM",
    exercise: "Cat-Camel",
    category: "Mobility" as const,
    reps: 12,
    score: 80,
    duration: "5:10",
  },
  {
    id: "10",
    date: new Date(Date.now() - 86400000 * 8),
    dateString: "8 days ago",
    time: "7:20 AM",
    exercise: "Dead Bug",
    category: "Stability" as const,
    reps: 18,
    score: 75,
    duration: "11:30",
  },
  {
    id: "11",
    date: new Date(Date.now() - 86400000 * 10),
    dateString: "10 days ago",
    time: "6:30 PM",
    exercise: "Child's Pose",
    category: "Mobility" as const,
    reps: 5,
    score: 95,
    duration: "3:20",
  },
  {
    id: "12",
    date: new Date(Date.now() - 86400000 * 12),
    dateString: "12 days ago",
    time: "8:00 AM",
    exercise: "Plank",
    category: "Stability" as const,
    reps: 3,
    score: 87,
    duration: "6:00",
  },
  {
    id: "13",
    date: new Date(Date.now() - 86400000 * 14),
    dateString: "2 weeks ago",
    time: "7:15 AM",
    exercise: "Hip Flexor Stretch",
    category: "Mobility" as const,
    reps: 8,
    score: 89,
    duration: "4:40",
  },
  {
    id: "14",
    date: new Date(Date.now() - 86400000 * 15),
    dateString: "15 days ago",
    time: "6:45 PM",
    exercise: "Clamshell",
    category: "Strength" as const,
    reps: 20,
    score: 73,
    duration: "8:15",
  },
  {
    id: "15",
    date: new Date(Date.now() - 86400000 * 18),
    dateString: "18 days ago",
    time: "9:00 AM",
    exercise: "Bird Dog",
    category: "Stability" as const,
    reps: 12,
    score: 84,
    duration: "7:05",
  },
  {
    id: "16",
    date: new Date(Date.now() - 86400000 * 20),
    dateString: "20 days ago",
    time: "7:30 AM",
    exercise: "Cat-Camel",
    category: "Mobility" as const,
    reps: 10,
    score: 79,
    duration: "4:50",
  },
  {
    id: "17",
    date: new Date(Date.now() - 86400000 * 22),
    dateString: "22 days ago",
    time: "8:15 AM",
    exercise: "Knee to Chest",
    category: "Mobility" as const,
    reps: 10,
    score: 86,
    duration: "5:30",
  },
  {
    id: "18",
    date: new Date(Date.now() - 86400000 * 25),
    dateString: "25 days ago",
    time: "6:00 PM",
    exercise: "Superman",
    category: "Strength" as const,
    reps: 15,
    score: 71,
    duration: "9:20",
  },
  {
    id: "19",
    date: new Date(Date.now() - 86400000 * 27),
    dateString: "27 days ago",
    time: "7:00 AM",
    exercise: "Dead Bug",
    category: "Stability" as const,
    reps: 16,
    score: 77,
    duration: "10:45",
  },
  {
    id: "20",
    date: new Date(Date.now() - 86400000 * 29),
    dateString: "29 days ago",
    time: "8:30 AM",
    exercise: "Glute Bridge",
    category: "Strength" as const,
    reps: 12,
    score: 90,
    duration: "7:10",
  },
];

// Progress page mock data types (Task 1.2)

export interface FormScoreDataPoint {
  date: string;  // ISO date
  score: number; // 0-100
  exerciseId: string;
}

export interface ActivityDataPoint {
  date: string;  // ISO date
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
  week: string; // e.g., "Week 1", "Week 2"
  sessionCount: number;
}

// Progress page mock data generation (Task 1.3)

// Lazy-loaded form score data
let _mockFormScores: FormScoreDataPoint[] | null = null;

function generateFormScores(): FormScoreDataPoint[] {
  const scores: FormScoreDataPoint[] = [];
  const exercises = ["cat-camel", "dead-bug", "cobra-stretch", "bird-dog", "glute-bridge"];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate 0-2 sessions per day
    const sessionsPerDay = Math.floor(Math.random() * 3);

    for (let j = 0; j < sessionsPerDay; j++) {
      scores.push({
        date: date.toISOString().split('T')[0],
        score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
        exerciseId: exercises[Math.floor(Math.random() * exercises.length)],
      });
    }
  }

  return scores;
}

// Generate 30 days of form score data points (lazy)
export function getMockFormScores(): FormScoreDataPoint[] {
  if (!_mockFormScores) {
    _mockFormScores = generateFormScores();
  }
  return _mockFormScores;
}

// Lazy-loaded activity data
let _mockActivityData: ActivityDataPoint[] | null = null;

function generateActivityData(): ActivityDataPoint[] {
  const activity: ActivityDataPoint[] = [];
  const now = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // 70% chance of having a session on any given day
    const hasSession = Math.random() < 0.7;
    const sessionCount = hasSession ? Math.floor(Math.random() * 3) + 1 : 0; // 1-3 sessions

    activity.push({
      date: date.toISOString().split('T')[0],
      sessionCount,
    });
  }

  return activity;
}

// Generate 365 days of activity data for heatmap (lazy)
export function getMockActivityData(): ActivityDataPoint[] {
  if (!_mockActivityData) {
    _mockActivityData = generateActivityData();
  }
  return _mockActivityData;
}

// Lazy-loaded exercise breakdown
let _mockExerciseBreakdown: ExerciseScoreSummary[] | null = null;

function generateExerciseBreakdown(): ExerciseScoreSummary[] {
  const exerciseMap = new Map<string, { scores: number[]; category: DisplayCategory }>();

  // Aggregate data from mockHistorySessions
  mockHistorySessions.forEach(session => {
    const key = session.exercise;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { scores: [], category: session.category });
    }
    exerciseMap.get(key)!.scores.push(session.score);
  });

  // Convert to ExerciseScoreSummary array
  const summaries: ExerciseScoreSummary[] = [];
  exerciseMap.forEach((data, exerciseName) => {
    const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
    summaries.push({
      exerciseId: exerciseName.toLowerCase().replace(/\s+/g, '-'),
      exerciseName,
      category: data.category,
      averageScore: Math.round(averageScore),
      sessionCount: data.scores.length,
    });
  });

  // Sort by average score (highest first)
  return summaries.sort((a, b) => b.averageScore - a.averageScore);
}

// Generate exercise breakdown from existing sessions (lazy)
export function getMockExerciseBreakdown(): ExerciseScoreSummary[] {
  if (!_mockExerciseBreakdown) {
    _mockExerciseBreakdown = generateExerciseBreakdown();
  }
  return _mockExerciseBreakdown;
}

// Lazy-loaded personal records
let _mockPersonalRecords: PersonalRecords | null = null;

function generatePersonalRecords(): PersonalRecords {
  // Find best score from all sessions
  const bestSession = mockHistorySessions.reduce((best, session) =>
    session.score > best.score ? session : best
  );

  // Calculate total time in minutes
  const totalTimeMinutes = mockHistorySessions.reduce((total, session) => {
    const [minutes, seconds] = session.duration.split(':').map(Number);
    return total + minutes + (seconds / 60);
  }, 0);

  // Calculate longest streak
  const sortedSessions = [...mockHistorySessions].sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  );

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  sortedSessions.forEach(session => {
    if (lastDate) {
      const dayDiff = Math.floor((session.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
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

  return {
    bestScore: {
      score: bestSession.score,
      exerciseName: bestSession.exercise,
      date: bestSession.date.toISOString().split('T')[0],
    },
    longestStreak,
    totalSessions: mockHistorySessions.length,
    totalTimeMinutes: Math.round(totalTimeMinutes),
  };
}

// Generate personal records object (lazy)
export function getMockPersonalRecords(): PersonalRecords {
  if (!_mockPersonalRecords) {
    _mockPersonalRecords = generatePersonalRecords();
  }
  return _mockPersonalRecords;
}

// Lazy-loaded session frequency data
let _mockSessionFrequency: SessionFrequencyDataPoint[] | null = null;

function generateSessionFrequency(): SessionFrequencyDataPoint[] {
  const frequency: SessionFrequencyDataPoint[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));

    // Count sessions in this week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const sessionsInWeek = mockHistorySessions.filter(session => {
      return session.date >= weekStart && session.date < weekEnd;
    }).length;

    // Add some variability for weeks beyond our session history
    const sessionCount = sessionsInWeek > 0 ? sessionsInWeek : Math.floor(Math.random() * 5) + 2;

    frequency.push({
      week: `Week ${12 - i}`,
      sessionCount,
    });
  }

  return frequency;
}

// Generate 12 weeks of session frequency data (lazy)
export function getMockSessionFrequency(): SessionFrequencyDataPoint[] {
  if (!_mockSessionFrequency) {
    _mockSessionFrequency = generateSessionFrequency();
  }
  return _mockSessionFrequency;
}
