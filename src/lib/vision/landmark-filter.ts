import { OneEuroFilter } from "1eurofilter";
import type { Landmark } from "@/types/vision";

const LANDMARK_COUNT = 33;

// Pose tracking params (from OneEuroFilter research)
// See: https://gery.casiez.net/1euro/
const CONFIG = {
  freq: 30, // ~30fps video
  mincutoff: 1.0, // Lower = less jitter, more lag
  beta: 0.007, // Higher = more responsive to fast movement
  dcutoff: 1.0,
};

export interface LandmarkFilterState {
  filters: OneEuroFilter[][]; // [landmark][x/y/z]
}

export function createLandmarkFilter(): LandmarkFilterState {
  const filters: OneEuroFilter[][] = [];
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    filters[i] = [
      new OneEuroFilter(CONFIG.freq, CONFIG.mincutoff, CONFIG.beta, CONFIG.dcutoff),
      new OneEuroFilter(CONFIG.freq, CONFIG.mincutoff, CONFIG.beta, CONFIG.dcutoff),
      new OneEuroFilter(CONFIG.freq, CONFIG.mincutoff, CONFIG.beta, CONFIG.dcutoff),
    ];
  }
  return { filters };
}

export function filterLandmarks(
  state: LandmarkFilterState,
  landmarks: Landmark[],
  timestamp?: number
): Landmark[] {
  const ts = timestamp ?? performance.now() / 1000; // Convert to seconds

  return landmarks.map((lm, i) => {
    // Safety check for landmarks array length
    if (!state.filters[i]) return lm;

    return {
      x: state.filters[i][0].filter(lm.x, ts),
      y: state.filters[i][1].filter(lm.y, ts),
      z: state.filters[i][2].filter(lm.z, ts),
      visibility: lm.visibility, // Don't filter visibility
    };
  });
}
