"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMockExerciseBreakdown, type ExerciseScoreSummary } from "@/lib/mock-data";
import type { DisplayCategory } from "@/lib/exercises/types";

interface ExerciseBreakdownChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: ExerciseScoreSummary[];
  maxExercises?: number;
}

const CATEGORY_COLORS: Record<DisplayCategory, string> = {
  Mobility: "hsl(142, 71%, 45%)", // sage-500
  Strength: "hsl(14, 91%, 60%)",  // coral-500
  Stability: "hsl(239, 84%, 67%)", // indigo-500
  Stretch: "hsl(262, 83%, 58%)", // purple-500
};

const ExerciseBreakdownChart = React.forwardRef<HTMLDivElement, ExerciseBreakdownChartProps>(
  ({ className, data = getMockExerciseBreakdown(), maxExercises = 8, ...props }, ref) => {
    const [showAll, setShowAll] = React.useState(false);

    const chartData = React.useMemo(() => {
      if (!data || data.length === 0) return [];

      // Sort by average score (highest first)
      const sorted = [...data].sort((a, b) => b.averageScore - a.averageScore);

      // Limit to maxExercises unless showAll is true
      const limited = showAll ? sorted : sorted.slice(0, maxExercises);

      return limited.map((exercise) => ({
        name: exercise.exerciseName,
        score: exercise.averageScore,
        category: exercise.category,
        sessionCount: exercise.sessionCount,
        color: CATEGORY_COLORS[exercise.category],
      }));
    }, [data, maxExercises, showAll]);

    const hasMoreExercises = (data?.length ?? 0) > maxExercises;
    const hasData = chartData.length > 0;

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exercise Breakdown</CardTitle>
            {hasMoreExercises && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs font-medium text-sage-600 hover:text-sage-700 transition-colors"
                aria-label={`View all ${data?.length ?? 0} exercises`}
              >
                View All ({data?.length ?? 0})
              </button>
            )}
            {showAll && (
              <button
                onClick={() => setShowAll(false)}
                className="text-xs font-medium text-sage-600 hover:text-sage-700 transition-colors"
                aria-label="Show fewer exercises"
              >
                Show Less
              </button>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-sage-500" />
              <span className="text-xs text-muted-foreground">Mobility</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-coral-500" />
              <span className="text-xs text-muted-foreground">Strength</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
              <span className="text-xs text-muted-foreground">Stability</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span className="text-xs text-muted-foreground">Stretch</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div
              className="w-full"
              style={{ height: `${Math.max(300, chartData.length * 40)}px` }}
              role="img"
              aria-label={`Exercise breakdown showing ${chartData.length} exercises by average form score`}
              tabIndex={0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold">{data.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outlined" className="text-xs">
                                  {data.category}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Average Score: <span className="font-bold text-foreground">{data.score}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Sessions: {data.sessionCount}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">No exercise data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
ExerciseBreakdownChart.displayName = "ExerciseBreakdownChart";

export { ExerciseBreakdownChart };
