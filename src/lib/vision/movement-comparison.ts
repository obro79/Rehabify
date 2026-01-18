import DynamicTimeWarping from "dynamic-time-warping";

// Reference "good squat" pattern (thigh angles, 10-point averaged)
// Pattern: stand → descend → bottom → ascend → stand
const SQUAT_REFERENCE = [33, 60, 78, 90, 96, 91, 80, 64, 43, 26];

export interface ComparisonResult {
  score: number;
  feedback: string;
  distance: number;
}

export function compareSquatRep(userAngles: number[]): ComparisonResult {
  if (userAngles.length < 5) {
    return { score: 0, feedback: "Rep too short to analyze", distance: 999 };
  }

  // Downsample if user has way more frames than reference
  // This helps DTW performance and comparison accuracy
  const normalizedAngles = normalizeArrayLength(userAngles, 20);

  const dtw = new DynamicTimeWarping(
    normalizedAngles,
    SQUAT_REFERENCE,
    (a: number, b: number) => Math.abs(a - b)
  );

  const distance = dtw.getDistance();

  // Convert to 0-100 score (lower distance = higher score)
  // Typical good rep distance ~50-150, bad rep ~300+
  const maxDistance = 300;
  const rawScore = 100 - (distance / maxDistance) * 100;
  const score = Math.max(0, Math.min(100, rawScore));

  let feedback: string;
  if (score >= 80) {
    feedback = "Excellent form!";
  } else if (score >= 60) {
    feedback = "Good rep!";
  } else if (score >= 40) {
    feedback = "Work on consistency";
  } else {
    feedback = "Try to match the movement pattern";
  }

  console.log(`[DTW] Distance: ${distance.toFixed(1)}, Score: ${score.toFixed(0)}%, Frames: ${userAngles.length}`);

  // Log averaged angles (10 buckets) for recording a new reference
  const bucketSize = Math.max(1, Math.floor(userAngles.length / 10));
  const averaged: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, userAngles.length);
    const bucket = userAngles.slice(start, end);
    if (bucket.length > 0) {
      const avg = bucket.reduce((sum, v) => sum + v, 0) / bucket.length;
      averaged.push(Math.round(avg));
    }
  }
  console.log(`[DTW] Averaged (${averaged.length}pt): [${averaged.join(', ')}]`);

  return {
    score: Math.round(score),
    feedback,
    distance,
  };
}

// Normalize array to target length using linear interpolation
function normalizeArrayLength(arr: number[], targetLength: number): number[] {
  if (arr.length <= targetLength) return arr;

  const result: number[] = [];
  const step = (arr.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const idx = i * step;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const t = idx - lower;

    if (lower === upper || upper >= arr.length) {
      result.push(arr[lower]);
    } else {
      result.push(arr[lower] * (1 - t) + arr[upper] * t);
    }
  }

  return result;
}
