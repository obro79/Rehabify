import { describe, it, expect } from "vitest";
import type { Landmark } from "@/types/vision";
import {
  angleBetween,
  angleBetween3D,
  checkOrientation,
  clamp,
  midpoint,
  LANDMARKS,
} from "../geometry";

const p = (x: number, y: number, z = 0, visibility = 1): Landmark => ({ x, y, z, visibility });

describe("geometry", () => {
  it("clamps values into range", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("averages position and visibility at the midpoint", () => {
    expect(midpoint(p(0, 0, 0, 0), p(1, 2, 4, 1))).toEqual(p(0.5, 1, 2, 0.5));
  });

  it("measures 2D joint angles in degrees", () => {
    expect(angleBetween(p(0, 1), p(0, 0), p(1, 0))).toBeCloseTo(90);
    expect(angleBetween(p(-1, 0), p(0, 0), p(1, 0))).toBeCloseTo(180);
  });

  it("uses depth for 3D joint angles", () => {
    // Same image-plane points, but the first is pushed toward the camera
    expect(angleBetween(p(0, -1, -1), p(0, 0), p(0, 1))).toBeCloseTo(180);
    expect(angleBetween3D(p(0, -1, -1), p(0, 0), p(0, 1))).toBeCloseTo(135);
  });

  it("returns 0 for degenerate angles instead of NaN", () => {
    expect(angleBetween(p(0, 0), p(0, 0), p(1, 0))).toBe(0);
    expect(angleBetween3D(p(0, 0), p(0, 0), p(1, 0))).toBe(0);
  });

  describe("checkOrientation", () => {
    const body = (shoulderWidth: number) => {
      const lm = Array.from({ length: 33 }, () => p(0, 0));
      lm[LANDMARKS.leftShoulder] = p(0.5 - shoulderWidth / 2, 0.2);
      lm[LANDMARKS.rightShoulder] = p(0.5 + shoulderWidth / 2, 0.2);
      lm[LANDMARKS.leftHip] = p(0.45, 0.6);
      lm[LANDMARKS.rightHip] = p(0.55, 0.6);
      return lm;
    };

    it("accepts a narrow silhouette when a side view is required", () => {
      expect(checkOrientation(body(0.05), "side").isCorrect).toBe(true);
    });

    it("asks the user to turn when facing the camera for a side exercise", () => {
      expect(checkOrientation(body(0.4), "side")).toEqual({
        isCorrect: false,
        feedback: "Turn to face the side",
      });
    });

    it("asks the user to face forward for a front exercise", () => {
      expect(checkOrientation(body(0.05), "front").feedback).toBe("Turn to face forward");
    });
  });
});
