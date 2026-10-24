import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzeStandingLumbarFlexion } from "../exercises/lumbar";
import { createEngineState, type EngineState } from "../form-types";
import { sideBody } from "./pose-fixtures";

// Hip angles (shoulder-hip-knee): neutral ~180°, partial ~117°, full flexion ~81°
const neutral = sideBody();
const partialBend = sideBody({ shoulderY: 0.3, shoulderZ: -0.2 });
const fullBend = sideBody({ shoulderY: 0.45, shoulderZ: -0.3 });

describe("analyzeStandingLumbarFlexion", () => {
  let state: EngineState;

  const step = (landmarks = neutral) => {
    const result = analyzeStandingLumbarFlexion(landmarks, {}, state);
    state.lastPhase = result.phase;
    return result;
  };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    state = createEngineState();
  });

  it("counts a rep on a full neutral -> flexion -> neutral cycle", () => {
    expect(step(neutral)).toMatchObject({ phase: "neutral", repIncremented: false });
    expect(step(fullBend)).toMatchObject({ phase: "flexion", repIncremented: false });
    expect(step(neutral)).toMatchObject({ phase: "neutral", repIncremented: true });
    expect(step(neutral)).toMatchObject({ phase: "neutral", repIncremented: false });
  });

  it("does not enter flexion on a partial bend", () => {
    expect(step(partialBend).phase).toBe("neutral");
  });

  it("stays in flexion while partially returning (hysteresis)", () => {
    step(fullBend);
    const result = step(partialBend);
    expect(result).toMatchObject({ phase: "flexion", repIncremented: false });
  });

  it("does not count a rep while holding flexion", () => {
    step(fullBend);
    expect(step(fullBend)).toMatchObject({ phase: "flexion", repIncremented: false });
  });

  it("gives positive feedback during a clean stretch", () => {
    expect(step(fullBend).feedback).toBe("Good stretch");
  });

  it("warns when the knees are bent", () => {
    const result = step(sideBody({ shoulderY: 0.45, shoulderZ: -0.3, kneeBend: 0.6 }));
    expect(result.errors.map((e) => e.type)).toContain("knee_bend");
    expect(result.isCorrect).toBe(false);
  });
});
