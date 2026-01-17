"use client";

import * as React from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockFormScores, type FormScoreDataPoint } from "@/lib/mock-data";

type TimeRange = "7d" | "30d" | "all";

interface FormScoreChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: FormScoreDataPoint[];
}

interface ChartDataPoint {
  date: string;
  score: number;
  displayDate: string;
}

const FormScoreChart = React.forwardRef<HTMLDivElement, FormScoreChartProps>(
  ({ className, data = getMockFormScores(), ...props }, ref) => {
    const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
    const gradientId = React.useId();

    const chartData = React.useMemo(() => {
      if (!data || data.length === 0) return [];

      const now = new Date();
      const filteredData = data.filter((point) => {
        const pointDate = new Date(point.date);
        if (timeRange === "7d") {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return pointDate >= sevenDaysAgo;
        } else if (timeRange === "30d") {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return pointDate >= thirtyDaysAgo;
        }
        return true; // "all"
      });

      // Group by date and calculate average score per day
      const groupedByDate = filteredData.reduce((acc, point) => {
        if (!acc[point.date]) {
          acc[point.date] = [];
        }
        acc[point.date].push(point.score);
        return acc;
      }, {} as Record<string, number[]>);

      // Convert to chart data points with averages
      const chartPoints: ChartDataPoint[] = Object.entries(groupedByDate)
        .map(([date, scores]) => {
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          const dateObj = new Date(date);
          const displayDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          return {
            date,
            score: Math.round(avgScore),
            displayDate,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return chartPoints;
    }, [data, timeRange]);

    const hasData = chartData.length > 0;

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Score Trend</CardTitle>
            <div className="flex gap-1 rounded-lg bg-sage-100/50 p-1">
              <button
                onClick={() => setTimeRange("7d")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  timeRange === "7d"
                    ? "bg-white text-sage-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="View last 7 days"
              >
                7 days
              </button>
              <button
                onClick={() => setTimeRange("30d")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  timeRange === "30d"
                    ? "bg-white text-sage-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="View last 30 days"
              >
                30 days
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  timeRange === "all"
                    ? "bg-white text-sage-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="View all time"
              >
                All Time
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div
              className="w-full h-[300px]"
              role="img"
              aria-label={`Form score trend chart showing ${chartData.length} data points over ${timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : "all time"}`}
              tabIndex={0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`score-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {payload[0].payload.displayDate}
                              </span>
                              <span className="text-sm font-bold text-sage-600">
                                Score: {payload[0].value}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    fill={`url(#score-${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">Complete your first session to see trends</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
FormScoreChart.displayName = "FormScoreChart";

export { FormScoreChart };
