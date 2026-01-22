"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";

interface FormScoreCardProps {
  score: number;
  improvement: string;
  focusArea: string;
}

export function FormScoreCard({
  score,
  improvement,
  focusArea,
}: FormScoreCardProps): ReactNode {
  return (
    <Card variant="organic" className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Average Form Score</h3>
        <span className="text-sm text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex items-center gap-6">
        <ProgressRing value={score} size="lg" />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Your form has improved!
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {improvement}
            </Badge>
            <span className="text-sm text-muted-foreground">vs last week</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Focus area: {focusArea}
          </p>
        </div>
      </div>
    </Card>
  );
}
