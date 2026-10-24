import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Exercise } from "@/lib/exercises/types";
import { createFormEngine } from "../form-engine";
import { sideBody } from "./pose-fixtures";

const exercise = (slug: string, id = slug, phases?: string[]) =>
  ({ id, slug, detection_config: { thresholds: {}, phases } }) as unknown as Exercise;

const neutral = sideBody();
const fullBend = sideBody({ shoulderY: 0.45, shoulderZ: -0.3 });
const bentKnees = sideBody({ kneeBend: 0.6 });

describe("createFormEngine", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("tracks phase across frames so reps are counted", () => {
    const analyze = createFormEngine(exercise("standing-lumbar-flexion"));
    analyze(neutral);
    analyze(fullBend);
    expect(analyze(neutral).repIncremented).toBe(true);
  });

  it("keeps state separate between engine instances", () => {
    const a = createFormEngine(exercise("standing-lumbar-flexion"));
    const b = createFormEngine(exercise("standing-lumbar-flexion"));
    a(fullBend);
    expect(b(neutral).repIncremented).toBe(false);
  });

  it("blocks a rep when the completing frame has a warning", () => {
    const analyze = createFormEngine(exercise("standing-lumbar-flexion"));
    analyze(fullBend);
    const result = analyze(bentKnees);
    expect(result.phase).toBe("neutral");
    expect(result.errors.some((e) => e.severity === "warning")).toBe(true);
    expect(result.repIncremented).toBe(false);
  });

  it("falls back to the exercise id when the slug is unknown", () => {
    const analyze = createFormEngine(exercise("not-a-slug", "standing-lumbar-flexion"));
    expect(analyze(fullBend).phase).toBe("flexion");
  });

  it("routes squat slugs to the squat analyzer", () => {
    const analyze = createFormEngine(exercise("bodyweight-squat"));
    expect(analyze(sideBody({ thighAngle: 80 })).phase).toBe("bottom");
  });

  it("returns a neutral passthrough for unsupported exercises", () => {
    const analyze = createFormEngine(exercise("plank", "plank", ["hold"]));
    const result = analyze(neutral);
    expect(result).toMatchObject({
      phase: "hold",
      errors: [],
      isCorrect: true,
      repIncremented: false,
      formScore: 100,
      confidence: 1,
    });
  });
});
