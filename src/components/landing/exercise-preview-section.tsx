"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyStars } from "@/components/ui/difficulty-stars";
import { LibraryIcon } from "@/components/ui/icons";
import { ArrowRight } from "lucide-react";
import { mapDifficultyToStars, type Exercise } from "@/lib/exercises/types";
import { getExerciseImage } from "@/lib/exercise-utils";
import { ScrollReveal } from "@/components/motion";
import {
  previewExercises,
  totalExerciseCount,
  getCategoryBadgeVariant,
} from "./landing-data";

function ExerciseCard({
  exercise,
  index,
}: {
  exercise: Exercise;
  index: number;
}): React.ReactElement {
  const isFirst = index === 0;
  const imageSrc = getExerciseImage(exercise.slug);
  const offsetClass = index === 1 ? "lg:-mt-8" : index === 2 ? "lg:mt-4" : "";

  return (
    <ScrollReveal>
      <div className={offsetClass}>
        <Card
          variant="organic"
          className={`group p-6 hover-lift h-full ${isFirst ? "lg:row-span-2 lg:p-8" : ""}`}
        >
          <div
            className={`relative flex items-center justify-center bg-sage-50 rounded-2xl mb-5 group-hover:bg-sage-100 transition-colors overflow-hidden ${
              isFirst ? "h-40" : "h-28"
            }`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={exercise.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <LibraryIcon size={isFirst ? "lg" : "md"} variant="sage" />
            )}
          </div>

          <div className="space-y-3">
            <h3
              className={`font-display font-semibold text-sage-900 ${
                isFirst ? "text-xl" : "text-lg"
              }`}
            >
              {exercise.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getCategoryBadgeVariant(exercise.category)} size="sm">
                {exercise.category}
              </Badge>
              {exercise.tier === 1 && (
                <Badge variant="success" size="sm">
                  AI-Powered
                </Badge>
              )}
            </div>

            <p
              className={`text-sage-600 line-clamp-2 ${isFirst ? "text-base" : "text-sm"}`}
            >
              {exercise.description}
            </p>

            <div className="pt-2">
              <DifficultyStars level={mapDifficultyToStars(exercise.difficulty)} />
            </div>
          </div>
        </Card>
      </div>
    </ScrollReveal>
  );
}

export function ExercisePreviewSection(): React.ReactElement {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <h2 className="text-section-xl text-sage-900 mb-4">
                  Exercise Library
                </h2>
                <p className="text-xl text-sage-600">
                  Gentle movements designed by physiotherapists
                </p>
              </div>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/exercises">
                  See All {totalExerciseCount}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewExercises.map((exercise, index) => (
              <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
