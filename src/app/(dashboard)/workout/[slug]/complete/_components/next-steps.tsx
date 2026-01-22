"use client";

import Link from "next/link";
import { Home, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NextExercise } from "./types";

interface NextStepsProps {
  currentSlug: string;
  nextExercise: NextExercise;
  animationDelay: string;
}

export function NextSteps({
  currentSlug,
  nextExercise,
  animationDelay,
}: NextStepsProps) {
  const nextHref = nextExercise.slug.startsWith("/")
    ? nextExercise.slug
    : `/workout/${nextExercise.slug}`;

  return (
    <div
      className="space-y-3 animate-celebration-fade-in-up"
      style={{ animationDelay }}
    >
      <h2 className="text-lg font-semibold text-foreground text-center">
        What&apos;s Next?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          variant="ghost"
          className="h-auto flex-col gap-2 py-4 rounded-3xl"
          asChild
        >
          <Link href={`/workout/${currentSlug}`}>
            <RotateCcw size={24} />
            <span className="font-medium">Do Again</span>
          </Link>
        </Button>

        <Button
          variant="terracotta"
          className="h-auto flex-col gap-2 py-4 rounded-3xl"
          asChild
        >
          <Link href={nextHref}>
            <ArrowRight size={24} />
            <span className="font-medium">Next Exercise</span>
            {nextExercise.name !== "Dashboard" && (
              <span className="text-xs opacity-90">{nextExercise.name}</span>
            )}
          </Link>
        </Button>

        <Button
          variant="secondary"
          className="h-auto flex-col gap-2 py-4 rounded-3xl"
          asChild
        >
          <Link href="/dashboard">
            <Home size={24} />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
