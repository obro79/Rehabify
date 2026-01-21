"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExerciseById } from "@/lib/exercises";
import {
  getCategoryBadgeVariant,
  getExerciseIconOrCategory,
  getExerciseImage,
  getDifficultyBadgeVariant,
} from "@/lib/exercise-utils";

interface ExerciseCardData {
  id: string;
  name: string;
  slug: string;
  category: string;
  duration: string;
  reps: number;
}

interface ExerciseCardProps {
  exercise: ExerciseCardData;
}

export function ExerciseCard({ exercise }: ExerciseCardProps): ReactNode {
  const imageSrc = getExerciseImage(exercise.slug);
  const fullExercise = getExerciseById(exercise.id);
  const difficulty = fullExercise?.difficulty || "intermediate";
  const difficultyLabel =
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <Card
      variant="organic"
      className="group p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
    >
      <div className="exercise-image-container">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={exercise.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          getExerciseIconOrCategory(exercise.id, exercise.category, "md")
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{exercise.name}</h3>
          <Badge
            variant={getCategoryBadgeVariant(exercise.category)}
            size="sm"
          >
            {exercise.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {exercise.duration} &bull; {exercise.reps} reps
          </span>
          <Badge variant={getDifficultyBadgeVariant(difficulty)} size="sm">
            {difficultyLabel}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={`/workout/${exercise.slug}`}>Start</Link>
        </Button>
      </div>
    </Card>
  );
}
