"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_SESSION_DATA } from "./constants";
import type { NextExercise, SessionData } from "./types";

interface User {
  displayName?: string;
  name?: string;
}

interface UseSessionDataResult {
  user: User | null;
  sessionData: SessionData;
  nextExercise: NextExercise;
}

export function useSessionData(slug: string): UseSessionDataResult {
  const searchParams = useSearchParams();
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    async function fetchUser(): Promise<void> {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const result = await response.json();
        setUser(result.data || result);
      }
    }
    fetchUser().catch((error) => {
      console.error("Failed to fetch user in completion page:", error);
    });
  }, []);

  const urlScore = searchParams.get("score");
  const urlReps = searchParams.get("reps");

  const formScore = urlScore ? parseInt(urlScore) : MOCK_SESSION_DATA.formScore;
  const repsCompleted = urlReps
    ? parseInt(urlReps)
    : MOCK_SESSION_DATA.repsCompleted;

  const nextExercise = React.useMemo((): NextExercise => {
    if (slug === "bodyweight-squat") {
      return { name: "Lunge", slug: "lunge", duration: "5 min" };
    }
    return { name: "Dashboard", slug: "/dashboard", duration: "" };
  }, [slug]);

  const sessionData: SessionData = {
    formScore,
    repsCompleted,
    targetReps: MOCK_SESSION_DATA.targetReps,
    duration: MOCK_SESSION_DATA.duration,
    xpEarned: MOCK_SESSION_DATA.xpEarned,
    currentLevel: MOCK_SESSION_DATA.currentLevel,
    levelProgress: MOCK_SESSION_DATA.levelProgress,
    currentXP: MOCK_SESSION_DATA.currentXP,
    nextLevelXP: MOCK_SESSION_DATA.nextLevelXP,
    currentStreak: MOCK_SESSION_DATA.currentStreak,
    bestStreak: MOCK_SESSION_DATA.bestStreak,
    formBreakdown: MOCK_SESSION_DATA.formBreakdown,
    coachSummary: MOCK_SESSION_DATA.coachSummary,
  };

  return { user, sessionData, nextExercise };
}
