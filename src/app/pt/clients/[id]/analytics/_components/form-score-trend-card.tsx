"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { AnalyticsData, TrendDirection } from "@/lib/analytics/patient-analytics";
import { getTrendColor } from "@/lib/analytics/patient-analytics";

const TREND_ICONS = { improving: TrendingUp, declining: TrendingDown, stable: Minus } as const;
const TREND_VARIANTS = { improving: "success", declining: "error", stable: "muted" } as const;

function capitalize(s: TrendDirection): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FormScoreTrendCard({ analytics }: { analytics: AnalyticsData }): React.ReactElement {
  const TrendIcon = TREND_ICONS[analytics.formScoreTrend];
  const prefix = analytics.formScoreChange > 0 ? "+" : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Performance</CardTitle>
          <Badge variant={TREND_VARIANTS[analytics.formScoreTrend]}>
            <TrendIcon size={14} className="mr-1" />
            {capitalize(analytics.formScoreTrend)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ProgressRing value={analytics.avgFormScore} size="lg" color="sage">
            <div className="text-center">
              <span className="text-2xl font-bold">{analytics.avgFormScore}</span>
              <span className="text-xs text-muted-foreground block">avg</span>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Last 5 Session Scores</p>
              <div className="flex gap-2">
                {analytics.recentScores.map((score, i) => (
                  <div key={i} className="flex-1 bg-sage-50 rounded-lg p-2 text-center border border-sage-100">
                    <span className="text-sm font-semibold text-foreground">{score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Trend:</span>
              <span className={getTrendColor(analytics.formScoreTrend)}>
                {prefix}{analytics.formScoreChange} points from first sessions
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
