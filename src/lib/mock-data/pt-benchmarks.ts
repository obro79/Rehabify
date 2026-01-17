/**
 * Benchmark data for comparing patient progress against expected outcomes
 * These are hardcoded values representing clinical expectations
 */

export interface Benchmark {
  metric: string;
  minValue: number;
  maxValue: number;
  unit: string;
  description: string;
  timeframe: string;
}

export interface BenchmarkComparison {
  metric: string;
  patientValue: number;
  benchmarkMin: number;
  benchmarkMax: number;
  unit: string;
  status: 'above' | 'within' | 'below';
  description: string;
}

/**
 * Standard clinical benchmarks for rehabilitation progress
 */
export const BENCHMARKS: Record<string, Benchmark> = {
  formScoreImprovement: {
    metric: 'Form Score Improvement',
    minValue: 15,
    maxValue: 20,
    unit: '%',
    description: 'Average form score improvement over 4 weeks',
    timeframe: '4 weeks',
  },
  sessionCompletionRate: {
    metric: 'Session Completion Rate',
    minValue: 70,
    maxValue: 80,
    unit: '%',
    description: 'Typical session completion rate',
    timeframe: 'ongoing',
  },
  painReduction: {
    metric: 'Pain Reduction',
    minValue: 20,
    maxValue: 30,
    unit: '%',
    description: 'Expected pain reduction in first month',
    timeframe: '1 month',
  },
  weeklySessionFrequency: {
    metric: 'Weekly Session Frequency',
    minValue: 3,
    maxValue: 5,
    unit: 'sessions',
    description: 'Recommended sessions per week',
    timeframe: 'weekly',
  },
  avgFormScore: {
    metric: 'Average Form Score',
    minValue: 75,
    maxValue: 85,
    unit: 'points',
    description: 'Target form score range after 6 weeks',
    timeframe: '6 weeks',
  },
  planAdherence: {
    metric: 'Plan Adherence',
    minValue: 75,
    maxValue: 90,
    unit: '%',
    description: 'Expected adherence to prescribed plan',
    timeframe: 'ongoing',
  },
};

/**
 * Compare a patient's metric value against the benchmark
 */
export function compareToBenchmark(
  metric: keyof typeof BENCHMARKS,
  patientValue: number
): BenchmarkComparison {
  const benchmark = BENCHMARKS[metric];

  let status: 'above' | 'within' | 'below';
  if (patientValue > benchmark.maxValue) {
    status = 'above';
  } else if (patientValue < benchmark.minValue) {
    status = 'below';
  } else {
    status = 'within';
  }

  return {
    metric: benchmark.metric,
    patientValue,
    benchmarkMin: benchmark.minValue,
    benchmarkMax: benchmark.maxValue,
    unit: benchmark.unit,
    status,
    description: benchmark.description,
  };
}

/**
 * Calculate form score improvement percentage
 */
export function calculateFormScoreImprovement(
  initialScore: number,
  currentScore: number
): number {
  if (initialScore === 0) return 0;
  return Math.round(((currentScore - initialScore) / initialScore) * 100);
}

/**
 * Calculate session completion rate
 */
export function calculateCompletionRate(
  completedSessions: number,
  totalSessions: number
): number {
  if (totalSessions === 0) return 0;
  return Math.round((completedSessions / totalSessions) * 100);
}

/**
 * Calculate pain reduction percentage
 */
export function calculatePainReduction(
  initialPain: number,
  currentPain: number
): number {
  if (initialPain === 0) return 0;
  return Math.round(((initialPain - currentPain) / initialPain) * 100);
}

/**
 * Get benchmark status color for UI
 */
export function getBenchmarkStatusColor(status: 'above' | 'within' | 'below'): string {
  switch (status) {
    case 'above':
      return 'success'; // Green - exceeding expectations
    case 'within':
      return 'info'; // Blue - meeting expectations
    case 'below':
      return 'warning'; // Orange - below expectations
  }
}

/**
 * Get benchmark status message
 */
export function getBenchmarkStatusMessage(status: 'above' | 'within' | 'below'): string {
  switch (status) {
    case 'above':
      return 'Exceeding expectations';
    case 'within':
      return 'Meeting expectations';
    case 'below':
      return 'Below expected range';
  }
}
