"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsData } from "@/lib/analytics/patient-analytics";

export function PainTrackingCard({ analytics }: { analytics: AnalyticsData }): React.ReactElement {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Starting Pain Level</p>
            <p className="text-2xl font-bold text-foreground">{analytics.initialPainLevel}/10</p>
          </div>
          <div className="flex items-center gap-2 px-4">
            <div className="w-24 h-2 bg-sage-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage-500 rounded-full transition-all"
                style={{ width: `${Math.max(0, analytics.painReduction)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-sage-600">
              {analytics.painReduction}% reduction
            </span>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted-foreground">Current Pain Level</p>
            <p className="text-2xl font-bold text-foreground">{analytics.currentPainLevel}/10</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
