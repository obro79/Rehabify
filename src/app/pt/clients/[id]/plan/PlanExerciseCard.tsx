"use client";

import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import {
  formatCategory,
  getCategoryBadgeVariant,
  formatDaysToLabels,
} from "./plan-utils";
import type { ExerciseConfig } from "@/lib/mock-data/pt-data";

interface PlanExerciseCardProps {
  exerciseId: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  days: number[];
  index: number;
  onRemove: () => void;
  onUpdate: (config: ExerciseConfig) => void;
}

export function PlanExerciseCard({
  name,
  category,
  sets,
  reps,
  holdSeconds,
  days,
  index,
  onRemove,
  onUpdate,
}: PlanExerciseCardProps): React.JSX.Element {
  const hasMultipleDays = days.length > 1;
  const hasHold = holdSeconds !== undefined && holdSeconds > 0;

  return (
    <div className="relative p-4 rounded-xl surface-pillowy hover:shadow-pillowy-lg hover:scale-[1.02] transition-all duration-200">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-sage-100 hover:bg-red-100 flex items-center justify-center transition-colors group"
        aria-label={`Remove ${name} from plan`}
      >
        <X className="w-4 h-4 text-sage-500 group-hover:text-red-500" />
      </button>

      <div className="pr-10 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            #{index + 1}
          </span>
          <h4 className="font-medium text-foreground">{name}</h4>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge size="sm" variant={getCategoryBadgeVariant(category)}>
            {formatCategory(category)}
          </Badge>
          {hasMultipleDays && (
            <span className="text-xs text-muted-foreground">
              Days: {formatDaysToLabels(days)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumberInput
          label="Sets"
          value={sets}
          onChange={(value) => onUpdate({ sets: value })}
          min={1}
          max={10}
        />
        <NumberInput
          label="Reps"
          value={reps}
          onChange={(value) => onUpdate({ reps: value })}
          min={1}
          max={50}
        />
        {hasHold && (
          <NumberInput
            label="Hold"
            value={holdSeconds}
            onChange={(value) => onUpdate({ holdSeconds: value })}
            min={1}
            max={120}
            suffix="s"
          />
        )}
      </div>
    </div>
  );
}
