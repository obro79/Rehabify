"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepCounter } from "@/components/ui/rep-counter";

interface MovementMetricsProps {
  repCount: number;
  formScore: number;
  phase: string;
}

export function MovementMetrics({ repCount, formScore, phase }: MovementMetricsProps): React.ReactElement {
  const formColor = formScore >= 70 ? "sage" : "coral";

  return (
    <>
      <Card className="p-4 flex-shrink-0">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">Reps</p>
          <RepCounter current={repCount} target={1} size="lg" />
        </div>
      </Card>

      <Card className="p-4 flex-shrink-0">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">Form</p>
          <ProgressRing value={formScore} size="default" color={formColor} />
        </div>
      </Card>

      <Card className="p-4 flex-1">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">Phase</p>
          <Badge variant="active" size="default" className="uppercase">
            {phase || "ready"}
          </Badge>
        </div>
      </Card>
    </>
  );
}
