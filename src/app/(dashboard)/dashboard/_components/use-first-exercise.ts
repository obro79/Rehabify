"use client";

import { useState, useEffect } from "react";
import { getExerciseById } from "@/lib/exercises";
import type { PlanStructure } from "@/lib/gemini/types";

const DEFAULT_EXERCISE_SLUG = "bodyweight-squat";

interface FirstExerciseResult {
  slug: string | null;
  isLoading: boolean;
}

async function createDefaultPlan(): Promise<void> {
  try {
    await fetch("/api/plans/create-default", { method: "POST" });
  } catch (error) {
    console.error("[Dashboard] Failed to create default plan:", error);
  }
}

function parseStructure(structure: unknown): PlanStructure | null {
  if (typeof structure === "string") {
    try {
      return JSON.parse(structure);
    } catch {
      return null;
    }
  }
  return structure as PlanStructure;
}

function extractFirstExerciseSlug(structure: PlanStructure): string | null {
  if (!structure?.weeks?.length) return null;

  const firstWeek = structure.weeks[0];
  if (!firstWeek?.exercises?.length) return null;

  const sortedExercises = [...firstWeek.exercises].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );
  const firstExercise = sortedExercises[0];
  if (!firstExercise) return null;

  if (firstExercise.exerciseSlug) {
    return firstExercise.exerciseSlug;
  }

  if (firstExercise.exerciseId) {
    const exercise = getExerciseById(firstExercise.exerciseId);
    if (exercise?.slug) {
      return exercise.slug;
    }
  }

  return null;
}

export function useFirstExercise(): FirstExerciseResult {
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFirstExercise(): Promise<void> {
      try {
        const response = await fetch("/api/patient-records");

        if (!response.ok) {
          await createDefaultPlan();
          setSlug(DEFAULT_EXERCISE_SLUG);
          return;
        }

        const result = await response.json();
        const data = result.data || result;
        const plans = data?.plans || [];

        if (plans.length === 0) {
          await createDefaultPlan();
          setSlug(DEFAULT_EXERCISE_SLUG);
          return;
        }

        const activePlan =
          plans.find(
            (plan: { status: string }) => plan.status === "approved"
          ) || plans[0];

        if (!activePlan?.structure) {
          await createDefaultPlan();
          setSlug(DEFAULT_EXERCISE_SLUG);
          return;
        }

        const structure = parseStructure(activePlan.structure);
        if (!structure) {
          console.error("[Dashboard] Failed to parse plan structure");
          await createDefaultPlan();
          setSlug(DEFAULT_EXERCISE_SLUG);
          return;
        }

        const exerciseSlug = extractFirstExerciseSlug(structure);
        setSlug(exerciseSlug || DEFAULT_EXERCISE_SLUG);
      } catch (error) {
        console.error("[Dashboard] Failed to fetch plan:", error);
        await createDefaultPlan();
        setSlug(DEFAULT_EXERCISE_SLUG);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFirstExercise();
  }, []);

  return { slug, isLoading };
}
