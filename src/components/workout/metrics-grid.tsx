"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RepCounter } from "@/components/ui/rep-counter";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { getFormScoreColor, getFormFeedback } from "@/lib/exercise-utils";

interface MetricsGridProps {
  repCount: number;
  targetReps: number;
  formScore: number;
  phase: string;
  phases?: string[];
}

export function MetricsGrid({
  repCount,
  targetReps,
  formScore,
  phase,
  phases,
}: MetricsGridProps): React.JSX.Element {
  const nextPhase = phases
    ? phases[(phases.indexOf(phase) + 1) % phases.length]
    : null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-4 flex items-center justify-center bg-white/80">
        <RepCounter current={repCount} target={targetReps} size="default" />
      </Card>

      <Card className="p-4 bg-white/80">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Form Score</p>
          <ProgressRing
            value={formScore}
            size="default"
            color={getFormScoreColor(formScore)}
          />
          <p
            className={cn(
              "text-xs font-medium text-center",
              formScore >= 70 ? "text-sage-600" : "text-coral-600"
            )}
          >
            {getFormFeedback(formScore)}
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-white/80">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Phase</p>
          <Badge variant="active" size="default" className="uppercase">
            {phase}
          </Badge>
          {nextPhase && (
            <p className="text-xs text-muted-foreground text-center line-clamp-1">
              Next: {nextPhase}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
