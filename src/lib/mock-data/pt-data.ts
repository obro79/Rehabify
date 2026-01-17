/**
 * Mock data for PT dashboard
 * Generates realistic patient data with session history, alerts, and plans
 */

export interface Alert {
  id: string;
  type: 'missed_session' | 'pain_report' | 'declining_form';
  severity: 'low' | 'medium' | 'high';
  message: string;
  createdAt: Date;
}

export interface PlanExercise {
  id: string;
  exerciseId: string; // Reference to exercise library
  name: string;
  category: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  order: number;
  dayOfWeek?: number; // 0-6 for weekly plans
}

export interface Plan {
  id: string;
  name: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'modified';
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
  formScore: number; // 0-100
  duration: string; // e.g., "12:34"
  repCount: number;
  painLevel?: number; // 0-10 scale
}

export interface MockPatient {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'alert';
  memberSince: Date;
  alerts: Alert[];
  lastSession: Date | null;
  currentPlan: Plan | null;
  sessionHistory: Session[];
}

// Fixed reference date to avoid hydration mismatch (use a stable date instead of new Date())
// This represents "today" for mock data purposes - Dec 29, 2025
const REFERENCE_DATE = new Date('2025-12-29T12:00:00Z');

// Helper to generate dates relative to reference date (NOT current time)
const daysAgo = (days: number): Date => {
  const date = new Date(REFERENCE_DATE);
  date.setDate(date.getDate() - days);
  return date;
};

const weeksAgo = (weeks: number): Date => {
  return daysAgo(weeks * 7);
};

// Seeded pseudo-random for deterministic values (avoids hydration mismatch)
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Helper to generate realistic form score trends (deterministic)
const generateFormScoreTrend = (
  sessions: number,
  trend: 'improving' | 'declining' | 'stable',
  baseScore: number = 70
): number[] => {
  const scores: number[] = [];
  for (let i = 0; i < sessions; i++) {
    let score = baseScore;
    const variance = seededRandom(i * 17 + baseScore) * 5; // Deterministic variance
    if (trend === 'improving') {
      score = Math.min(95, baseScore + (i * 3) + variance);
    } else if (trend === 'declining') {
      score = Math.max(40, baseScore - (i * 2.5) + variance);
    } else {
      score = baseScore + (seededRandom(i * 31 + baseScore) * 10 - 5);
    }
    scores.push(Math.round(score));
  }
  return scores;
};

// Helper to generate realistic pain level trends (deterministic)
const generatePainLevels = (formScores: number[]): number[] => {
  return formScores.map((score, i) => {
    // Higher form scores = lower pain
    const basePain = 10 - (score / 10);
    const variance = seededRandom(i * 23 + score) * 2 - 1; // Deterministic variance
    return Math.max(0, Math.min(10, Math.round(basePain + variance)));
  });
};

// Helper to generate deterministic duration string
const generateDuration = (seed: number, baseMinutes: number, variance: number): string => {
  const minutes = Math.floor(seededRandom(seed) * variance + baseMinutes);
  const seconds = Math.floor(seededRandom(seed * 2 + 7) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// Generate mock patients with realistic data
export const mockPatients: MockPatient[] = [
  // Patient 1: Improving, no alerts
  {
    id: 'pt-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    status: 'active',
    memberSince: weeksAgo(12),
    alerts: [],
    lastSession: daysAgo(1),
    currentPlan: {
      id: 'plan-001',
      name: 'Lower Back Recovery Program',
      status: 'approved',
      exercises: [
        {
          id: 'pe-001',
          exerciseId: 'cat-camel',
          name: 'Cat-Camel',
          category: 'mobility',
          sets: 2,
          reps: 10,
          order: 0,
        },
        {
          id: 'pe-002',
          exerciseId: 'bird-dog',
          name: 'Bird Dog',
          category: 'stability',
          sets: 3,
          reps: 8,
          order: 1,
        },
      ],
      createdAt: weeksAgo(6),
      reviewedAt: weeksAgo(6),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(24, 'improving', 65);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-001-${i}`,
        date: daysAgo(24 - i),
        exerciseId: i % 2 === 0 ? 'cat-camel' : 'bird-dog',
        exerciseName: i % 2 === 0 ? 'Cat-Camel' : 'Bird Dog',
        category: i % 2 === 0 ? 'mobility' : 'stability',
        formScore: score,
        duration: generateDuration(i + 100, 8, 5),
        repCount: i % 2 === 0 ? 10 : 8,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 2: Pending review plan, some alerts
  {
    id: 'pt-002',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    status: 'alert',
    memberSince: weeksAgo(8),
    alerts: [
      {
        id: 'alert-001',
        type: 'pain_report',
        severity: 'medium',
        message: 'Pain level reported at 7/10 during last session',
        createdAt: daysAgo(2),
      },
    ],
    lastSession: daysAgo(2),
    currentPlan: {
      id: 'plan-002',
      name: 'Modified Knee Strengthening',
      status: 'pending_review',
      exercises: [
        {
          id: 'pe-003',
          exerciseId: 'quad-sets',
          name: 'Quad Sets',
          category: 'strength',
          sets: 3,
          reps: 12,
          order: 0,
        },
      ],
      createdAt: daysAgo(1),
      notes: 'AI-suggested plan based on recent pain reports',
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(18, 'stable', 72);
      const painLevels = generatePainLevels(scores);
      painLevels[painLevels.length - 1] = 7; // Recent pain spike
      return scores.map((score, i) => ({
        id: `session-002-${i}`,
        date: daysAgo(18 - i),
        exerciseId: 'quad-sets',
        exerciseName: 'Quad Sets',
        category: 'strength',
        formScore: score,
        duration: generateDuration(i + 200, 6, 4),
        repCount: 12,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 3: Declining form scores, multiple alerts
  {
    id: 'pt-003',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    status: 'alert',
    memberSince: weeksAgo(16),
    alerts: [
      {
        id: 'alert-002',
        type: 'declining_form',
        severity: 'high',
        message: 'Form score declined 18 points from baseline',
        createdAt: daysAgo(3),
      },
      {
        id: 'alert-003',
        type: 'missed_session',
        severity: 'medium',
        message: 'Missed 2 sessions in the last week',
        createdAt: daysAgo(1),
      },
    ],
    lastSession: daysAgo(5),
    currentPlan: {
      id: 'plan-003',
      name: 'Shoulder Mobility Protocol',
      status: 'approved',
      exercises: [
        {
          id: 'pe-004',
          exerciseId: 'wall-slides',
          name: 'Wall Slides',
          category: 'mobility',
          sets: 2,
          reps: 10,
          order: 0,
        },
      ],
      createdAt: weeksAgo(10),
      reviewedAt: weeksAgo(10),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(20, 'declining', 78);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-003-${i}`,
        date: daysAgo(25 - i),
        exerciseId: 'wall-slides',
        exerciseName: 'Wall Slides',
        category: 'mobility',
        formScore: score,
        duration: generateDuration(i + 300, 7, 5),
        repCount: 10,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 4: New plan pending review
  {
    id: 'pt-004',
    name: 'David Kim',
    email: 'david.kim@email.com',
    status: 'active',
    memberSince: weeksAgo(4),
    alerts: [],
    lastSession: daysAgo(1),
    currentPlan: {
      id: 'plan-004',
      name: 'Core Stabilization Program',
      status: 'pending_review',
      exercises: [
        {
          id: 'pe-005',
          exerciseId: 'dead-bug',
          name: 'Dead Bug',
          category: 'stability',
          sets: 3,
          reps: 10,
          order: 0,
        },
        {
          id: 'pe-006',
          exerciseId: 'plank',
          name: 'Plank',
          category: 'strength',
          sets: 3,
          reps: 1,
          holdSeconds: 30,
          order: 1,
        },
      ],
      createdAt: daysAgo(2),
      notes: 'Progression plan after successful completion of basic program',
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(12, 'improving', 68);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-004-${i}`,
        date: daysAgo(12 - i),
        exerciseId: i % 2 === 0 ? 'cat-camel' : 'cobra',
        exerciseName: i % 2 === 0 ? 'Cat-Camel' : 'Cobra',
        category: i % 2 === 0 ? 'mobility' : 'stretch',
        formScore: score,
        duration: generateDuration(i + 400, 6, 4),
        repCount: 10,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 5: Inactive, missed sessions
  {
    id: 'pt-005',
    name: 'Jessica Martinez',
    email: 'jessica.martinez@email.com',
    status: 'alert',
    memberSince: weeksAgo(20),
    alerts: [
      {
        id: 'alert-004',
        type: 'missed_session',
        severity: 'high',
        message: 'No activity in the last 10 days',
        createdAt: daysAgo(3),
      },
    ],
    lastSession: daysAgo(12),
    currentPlan: {
      id: 'plan-005',
      name: 'Hip Strengthening',
      status: 'approved',
      exercises: [
        {
          id: 'pe-007',
          exerciseId: 'clamshells',
          name: 'Clamshells',
          category: 'strength',
          sets: 3,
          reps: 15,
          order: 0,
        },
      ],
      createdAt: weeksAgo(14),
      reviewedAt: weeksAgo(14),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(15, 'stable', 75);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-005-${i}`,
        date: daysAgo(30 - i),
        exerciseId: 'clamshells',
        exerciseName: 'Clamshells',
        category: 'strength',
        formScore: score,
        duration: generateDuration(i + 500, 6, 5),
        repCount: 15,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 6: Stable progress
  {
    id: 'pt-006',
    name: 'Robert Taylor',
    email: 'robert.taylor@email.com',
    status: 'active',
    memberSince: weeksAgo(10),
    alerts: [],
    lastSession: daysAgo(2),
    currentPlan: {
      id: 'plan-006',
      name: 'Ankle Mobility & Strength',
      status: 'approved',
      exercises: [
        {
          id: 'pe-008',
          exerciseId: 'ankle-pumps',
          name: 'Ankle Pumps',
          category: 'mobility',
          sets: 3,
          reps: 20,
          order: 0,
        },
      ],
      createdAt: weeksAgo(8),
      reviewedAt: weeksAgo(8),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(22, 'stable', 80);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-006-${i}`,
        date: daysAgo(22 - i),
        exerciseId: 'ankle-pumps',
        exerciseName: 'Ankle Pumps',
        category: 'mobility',
        formScore: score,
        duration: generateDuration(i + 600, 5, 3),
        repCount: 20,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 7: Pending review with detailed exercises
  {
    id: 'pt-007',
    name: 'Amanda Lee',
    email: 'amanda.lee@email.com',
    status: 'active',
    memberSince: weeksAgo(6),
    alerts: [],
    lastSession: daysAgo(1),
    currentPlan: {
      id: 'plan-007',
      name: 'Comprehensive Back Care',
      status: 'pending_review',
      exercises: [
        {
          id: 'pe-009',
          exerciseId: 'cat-camel',
          name: 'Cat-Camel',
          category: 'mobility',
          sets: 2,
          reps: 10,
          order: 0,
        },
        {
          id: 'pe-010',
          exerciseId: 'cobra',
          name: 'Cobra',
          category: 'stretch',
          sets: 3,
          reps: 5,
          holdSeconds: 15,
          order: 1,
        },
        {
          id: 'pe-011',
          exerciseId: 'bird-dog',
          name: 'Bird Dog',
          category: 'stability',
          sets: 3,
          reps: 8,
          order: 2,
        },
      ],
      createdAt: daysAgo(1),
      notes: 'Progressive plan upgrade based on 6-week improvement',
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(18, 'improving', 62);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-007-${i}`,
        date: daysAgo(18 - i),
        exerciseId: i % 3 === 0 ? 'cat-camel' : i % 3 === 1 ? 'cobra' : 'bird-dog',
        exerciseName: i % 3 === 0 ? 'Cat-Camel' : i % 3 === 1 ? 'Cobra' : 'Bird Dog',
        category: i % 3 === 0 ? 'mobility' : i % 3 === 1 ? 'stretch' : 'stability',
        formScore: score,
        duration: generateDuration(i + 700, 8, 5),
        repCount: i % 3 === 0 ? 10 : i % 3 === 1 ? 5 : 8,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 8: Good progress, recent pain spike
  {
    id: 'pt-008',
    name: 'Christopher Brown',
    email: 'chris.brown@email.com',
    status: 'alert',
    memberSince: weeksAgo(14),
    alerts: [
      {
        id: 'alert-005',
        type: 'pain_report',
        severity: 'medium',
        message: 'Pain level increased to 6/10',
        createdAt: daysAgo(1),
      },
    ],
    lastSession: daysAgo(1),
    currentPlan: {
      id: 'plan-008',
      name: 'Neck & Upper Back Relief',
      status: 'approved',
      exercises: [
        {
          id: 'pe-012',
          exerciseId: 'chin-tucks',
          name: 'Chin Tucks',
          category: 'posture',
          sets: 3,
          reps: 12,
          order: 0,
        },
      ],
      createdAt: weeksAgo(12),
      reviewedAt: weeksAgo(12),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(26, 'improving', 70);
      const painLevels = generatePainLevels(scores);
      painLevels[painLevels.length - 1] = 6; // Recent pain spike
      return scores.map((score, i) => ({
        id: `session-008-${i}`,
        date: daysAgo(26 - i),
        exerciseId: 'chin-tucks',
        exerciseName: 'Chin Tucks',
        category: 'posture',
        formScore: score,
        duration: generateDuration(i + 800, 5, 4),
        repCount: 12,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 9: New patient, improving quickly
  {
    id: 'pt-009',
    name: 'Sophia Patel',
    email: 'sophia.patel@email.com',
    status: 'active',
    memberSince: weeksAgo(3),
    alerts: [],
    lastSession: daysAgo(0),
    currentPlan: {
      id: 'plan-009',
      name: 'Beginner Core Program',
      status: 'approved',
      exercises: [
        {
          id: 'pe-013',
          exerciseId: 'cat-camel',
          name: 'Cat-Camel',
          category: 'mobility',
          sets: 2,
          reps: 10,
          order: 0,
        },
      ],
      createdAt: weeksAgo(3),
      reviewedAt: weeksAgo(3),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(10, 'improving', 55);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-009-${i}`,
        date: daysAgo(10 - i),
        exerciseId: 'cat-camel',
        exerciseName: 'Cat-Camel',
        category: 'mobility',
        formScore: score,
        duration: generateDuration(i + 900, 6, 4),
        repCount: 10,
        painLevel: painLevels[i],
      }));
    })(),
  },

  // Patient 10: Consistent performer
  {
    id: 'pt-010',
    name: 'Daniel Wilson',
    email: 'daniel.wilson@email.com',
    status: 'active',
    memberSince: weeksAgo(18),
    alerts: [],
    lastSession: daysAgo(1),
    currentPlan: {
      id: 'plan-010',
      name: 'Advanced Stability Training',
      status: 'approved',
      exercises: [
        {
          id: 'pe-014',
          exerciseId: 'dead-bug',
          name: 'Dead Bug',
          category: 'stability',
          sets: 3,
          reps: 10,
          order: 0,
        },
        {
          id: 'pe-015',
          exerciseId: 'bird-dog',
          name: 'Bird Dog',
          category: 'stability',
          sets: 3,
          reps: 10,
          order: 1,
        },
      ],
      createdAt: weeksAgo(15),
      reviewedAt: weeksAgo(15),
    },
    sessionHistory: (() => {
      const scores = generateFormScoreTrend(28, 'stable', 85);
      const painLevels = generatePainLevels(scores);
      return scores.map((score, i) => ({
        id: `session-010-${i}`,
        date: daysAgo(28 - i),
        exerciseId: i % 2 === 0 ? 'dead-bug' : 'bird-dog',
        exerciseName: i % 2 === 0 ? 'Dead Bug' : 'Bird Dog',
        category: 'stability',
        formScore: score,
        duration: generateDuration(i + 1000, 9, 5),
        repCount: 10,
        painLevel: painLevels[i],
      }));
    })(),
  },
];
