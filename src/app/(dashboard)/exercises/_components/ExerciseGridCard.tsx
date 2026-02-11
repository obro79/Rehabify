"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Exercise } from "@/lib/exercises/types";
import {
  getCategoryIcon,
  getCategoryBadgeVariant,
  getCategoryLabel,
  getExerciseImage,
  getDifficultyBadgeVariant,
} from "@/lib/exercise-utils";

interface ExerciseGridCardProps {
  exercise: Exercise;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ExerciseGridCard({ exercise }: ExerciseGridCardProps) {
  const imageSrc = getExerciseImage(exercise.slug);

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.location.href = `/workout/${exercise.slug}`;
    }
  }

  return (
    <Card
      variant="organic"
      className="group p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] focus-within:ring-2 focus-within:ring-sage-400 focus-within:ring-offset-2"
      tabIndex={0}
      role="button"
      aria-label={`${exercise.name} - ${getCategoryLabel(exercise.category)} exercise`}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-center h-32 bg-sage-50 rounded-2xl mb-3 group-hover:bg-sage-100 transition-colors relative overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={exercise.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          getCategoryIcon(exercise.category, "md")
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-2">
          {exercise.name}
        </h3>

        <div className="flex items-center gap-2">
          <Badge
            variant={getCategoryBadgeVariant(exercise.category)}
            size="sm"
          >
            {getCategoryLabel(exercise.category)}
          </Badge>
          <Badge
            variant={getDifficultyBadgeVariant(exercise.difficulty)}
            size="sm"
          >
            {capitalizeFirst(exercise.difficulty)}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {exercise.default_sets} sets x {exercise.default_reps} reps
        </p>

        <Link href={`/workout/${exercise.slug}`}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            Start
          </Button>
        </Link>
      </div>
    </Card>
  );
}
