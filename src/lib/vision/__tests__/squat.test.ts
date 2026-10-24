import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { analyzeSquat, createSquatState, type SquatState } from "../exercises/squat";
import { sideBody } from "./pose-fixtures";

describe("analyzeSquat", () => {
  let state: SquatState;
  let now: number;

  // Frames 500ms apart so descent-speed tracking stays out of the way
  const run = (angles: number[], opts: Parameters<typeof sideBody>[0] = {}) =>
    angles.map((thighAngle) => {
      now += 500;
      return analyzeSquat(sideBody({ ...opts, thighAngle }), {}, state);
    });

  beforeEach(() => {
    state = createSquatState();
    now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => vi.restoreAllMocks());

  it("walks through standing -> descending -> bottom -> ascending -> standing", () => {
    const phases = run([0, 30, 60, 80, 60, 30, 0]).map((r) => r.phase);
    expect(phases).toEqual([
      "standing",
      "descending",
      "descending",
      "bottom",
      "ascending",
      "ascending",
      "standing",
    ]);
  });

  it("counts exactly one rep for a full-depth squat", () => {
    const results = run([0, 30, 60, 80, 60, 30, 0]);
    expect(results.filter((r) => r.repIncremented)).toHaveLength(1);
    expect(results.at(-1)?.repIncremented).toBe(true);
    expect(results.at(-1)?.errors).toEqual([]);
  });

  it("ignores a dip that never reaches the minimum rep depth", () => {
    const results = run([0, 30, 0]);
    expect(results.some((r) => r.repIncremented)).toBe(false);
  });

  it("counts a shallow rep but flags insufficient depth", () => {
    const last = run([0, 50, 0]).at(-1)!;
    expect(last.repIncremented).toBe(true);
    expect(last.errors.map((e) => e.type)).toContain("insufficient_depth");
    expect(last.feedback).toMatch(/Shallow squat/);
  });

  it("warns about hands resting on the legs mid-rep", () => {
    const [, mid] = run([0, 60], { handsOnKnees: true });
    expect(mid.errors.map((e) => e.type)).toContain("hands_on_legs");
  });

  it("respects custom thresholds", () => {
    now += 500;
    analyzeSquat(sideBody({ thighAngle: 0 }), {}, state);
    now += 500;
    const result = analyzeSquat(sideBody({ thighAngle: 50 }), { min_depth_angle: 45 }, state);
    expect(result.phase).toBe("bottom");
  });
});
