"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getExerciseVideoUrl } from "@/lib/exercises/video-map";
import type { Exercise } from "@/lib/exercises/types";

interface ExerciseDemoPanelProps {
  exercise: Exercise;
  className?: string;
}

export function ExerciseDemoPanel({ exercise, className }: ExerciseDemoPanelProps) {
  const [showMore, setShowMore] = React.useState(false);
  const videoUrl = getExerciseVideoUrl(exercise.slug);

  // Show first 3 instructions, rest in expandable
  const primaryInstructions = exercise.instructions.slice(0, 3);
  const additionalInstructions = exercise.instructions.slice(3);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Demo Visual */}
      <Card className="flex-shrink-0 overflow-hidden mb-4">
        <div className="aspect-[3/4] bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center relative">
          {videoUrl ? (
            /* Video player */
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder when no video */
            <div className="text-center p-4">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-sage-300/50 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-sage-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="5" r="3" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="12" y1="12" x2="8" y2="10" />
                  <line x1="12" y1="12" x2="16" y2="10" />
                  <line x1="12" y1="16" x2="9" y2="21" />
                  <line x1="12" y1="16" x2="15" y2="21" />
                </svg>
              </div>
              <p className="text-sm font-medium text-sage-700">{exercise.name}</p>
              <p className="text-xs text-sage-500 mt-1 capitalize">
                {exercise.category.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* Demo badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-sage-700">
              Demo
            </span>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          How to Perform
        </h3>

        <ol className="space-y-3">
          {primaryInstructions.map((instruction, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-muted-foreground leading-relaxed">
                {instruction}
              </span>
            </li>
          ))}
        </ol>

        {/* Expandable additional instructions */}
        {additionalInstructions.length > 0 && (
          <div className="mt-3">
            {showMore && (
              <ol className="space-y-3 mb-3" start={4}>
                {additionalInstructions.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold">
                      {i + 4}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">
                      {instruction}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              className="w-full gap-1 text-xs"
            >
              {showMore ? (
                <>
                  Show less <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  {additionalInstructions.length} more steps <ChevronDown className="w-3 h-3" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Common mistakes hint */}
        {exercise.common_mistakes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-sage-100">
            <p className="text-xs font-medium text-coral-600 mb-2">
              Watch out for:
            </p>
            <p className="text-xs text-muted-foreground">
              {exercise.common_mistakes[0]}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
