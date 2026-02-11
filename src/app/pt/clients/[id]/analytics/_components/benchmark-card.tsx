"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BENCHMARKS, getBenchmarkStatusMessage } from "@/lib/mock-data/pt-benchmarks";

type BenchmarkStatus = "above" | "within" | "below";
export type BenchmarkKey = "formScoreImprovement" | "sessionCompletionRate" | "painReduction";

export interface BenchmarkComparison {
  patientValue: number;
  status: BenchmarkStatus;
}

const BADGE_VARIANTS = {
  above: "success",
  within: "info",
  below: "warning",
} as const;

export function BenchmarkCard({
  benchmarkKey,
  comparison,
}: {
  benchmarkKey: BenchmarkKey;
  comparison: BenchmarkComparison;
}): React.ReactElement {
  const benchmark = BENCHMARKS[benchmarkKey];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{benchmark.metric}</p>
            <p className="text-xs text-muted-foreground">{benchmark.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{comparison.patientValue}%</p>
              <p className="text-xs text-muted-foreground">
                Target: {benchmark.minValue}-{benchmark.maxValue}%
              </p>
            </div>
            <Badge variant={BADGE_VARIANTS[comparison.status]} size="sm">
              {getBenchmarkStatusMessage(comparison.status)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
