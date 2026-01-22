export interface FormBreakdownItem {
  metric: string;
  score: number;
  feedback: string;
}

export interface NextExercise {
  name: string;
  slug: string;
  duration: string;
}

export interface SessionData {
  formScore: number;
  repsCompleted: number;
  targetReps: number;
  duration: string;
  xpEarned: number;
  currentLevel: number;
  levelProgress: number;
  currentXP: number;
  nextLevelXP: number;
  currentStreak: number;
  bestStreak: number;
  formBreakdown: FormBreakdownItem[];
  coachSummary: string;
}
