"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCategory, getCategoryBadgeVariant } from "./plan-utils";

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  tier: number;
  body_region: string;
  category: string;
  difficulty: string;
  default_reps: number;
  default_sets: number;
  default_hold_seconds?: number;
  description?: string;
}

interface ExerciseLibraryItemProps {
  exercise: Exercise;
  isInPlan: boolean;
  onAdd: () => void;
}

export function ExerciseLibraryItem({
  exercise,
  isInPlan,
  onAdd,
}: ExerciseLibraryItemProps): React.JSX.Element {
  const buttonClasses = isInPlan
    ? "bg-sage-100 opacity-50 cursor-not-allowed"
    : "surface-pillowy hover:shadow-pillowy-lg hover:scale-[1.02] cursor-pointer";

  return (
    <button
      onClick={onAdd}
      disabled={isInPlan}
      className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${buttonClasses}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {exercise.name}
            </span>
            {exercise.tier === 1 && (
              <Badge size="sm" variant="coral">
                AI Guided
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              size="sm"
              variant={getCategoryBadgeVariant(exercise.category)}
            >
              {formatCategory(exercise.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {exercise.default_sets} sets x {exercise.default_reps} reps
              {exercise.default_hold_seconds && (
                <> ({exercise.default_hold_seconds}s hold)</>
              )}
            </span>
          </div>
        </div>
        {!isInPlan && (
          <Plus className="w-5 h-5 text-sage-500 flex-shrink-0 ml-2" />
        )}
      </div>
    </button>
  );
}
