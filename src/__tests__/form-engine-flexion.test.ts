import { describe, it, expect, beforeEach } from "vitest";
import type { Landmark } from "@/types/vision";
import type { EngineState } from "@/lib/vision/form-engine";
import { analyzeStandingLumbarFlexion } from "@/lib/vision/form-engine";

const mockLandmark = (x = 0, y = 0, z = 0, visibility = 1): Landmark => ({
  x,
  y,
  z,
  visibility,
});

// Create a mock set of landmarks for a body
const createBody = (shoulderY: number, shoulderZ: number): Landmark[] => {
  const landmarks = new Array(33).fill(null).map(() => mockLandmark());
  landmarks[11] = mockLandmark(0.5, shoulderY, shoulderZ); // Left Shoulder
  landmarks[12] = mockLandmark(0.5, shoulderY, shoulderZ); // Right Shoulder
  landmarks[23] = mockLandmark(0.5, 0.4, 0); // Left Hip
  landmarks[24] = mockLandmark(0.5, 0.4, 0); // Right Hip
  landmarks[25] = mockLandmark(0.5, 0.7, 0); // Left Knee
  landmarks[26] = mockLandmark(0.5, 0.7, 0); // Right Knee
  landmarks[27] = mockLandmark(0.5, 1.0, 0); // Left Ankle
  landmarks[28] = mockLandmark(0.5, 1.0, 0); // Right Ankle
  return landmarks;
};

// Standing straight, hip angle ~180
const neutralLandmarks = createBody(0.1, 0);
// Bending forward, hip angle decreases
const flexionLandmarks = createBody(0.3, -0.2);
// Back to straight
const returnLandmarks = createBody(0.1, 0);

describe("analyzeStandingLumbarFlexion", () => {
  let state: EngineState;

  beforeEach(() => {
    state = {
      lastPhase: "neutral",
      lastRepPhase: "",
      lastExtendedSide: null,
    };
  });

  it("should correctly count a rep on flexion -> return cycle", () => {
    // 1. Start in neutral
    let result = analyzeStandingLumbarFlexion(neutralLandmarks, {}, state);
    expect(result.phase).toBe("neutral");
    expect(result.repIncremented).toBe(false);
    state.lastPhase = result.phase;

    // 2. Move to flexion
    result = analyzeStandingLumbarFlexion(flexionLandmarks, {}, state);
    expect(result.phase).toBe("flexion");
    expect(result.repIncremented).toBe(false);
    state.lastPhase = result.phase;

    // 3. Return to neutral
    result = analyzeStandingLumbarFlexion(returnLandmarks, {}, state);
    expect(result.phase).toBe("return");
    expect(result.repIncremented).toBe(true);
    state.lastPhase = result.phase;

    // 4. Stay at neutral
    result = analyzeStandingLumbarFlexion(returnLandmarks, {}, state);
    expect(result.phase).toBe("neutral");
    expect(result.repIncremented).toBe(false);
  });

  it("should not count a rep if returning to flexion", () => {
    // 1. Start in neutral
    let result = analyzeStandingLumbarFlexion(neutralLandmarks, {}, state);
    state.lastPhase = result.phase;

    // 2. Move to flexion
    result = analyzeStandingLumbarFlexion(flexionLandmarks, {}, state);
    state.lastPhase = result.phase;

    // 3. Still in flexion
    result = analyzeStandingLumbarFlexion(flexionLandmarks, {}, state);
    expect(result.phase).toBe("flexion");
    expect(result.repIncremented).toBe(false);
  });
});
