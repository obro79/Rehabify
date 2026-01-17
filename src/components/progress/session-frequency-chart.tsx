"use client";

import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockSessionFrequency, type SessionFrequencyDataPoint } from "@/lib/mock-data";

interface SessionFrequencyChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: SessionFrequencyDataPoint[];
  weeklyGoal?: number;
}

const SessionFrequencyChart = React.forwardRef<HTMLDivElement, SessionFrequencyChartProps>(
  ({ className, data = getMockSessionFrequency(), weeklyGoal, ...props }, ref) => {
    const gradientId = React.useId();
    const chartData = React.useMemo(() => {
      if (!data || data.length === 0) return [];
      return data;
    }, [data]);

    const maxSessions = React.useMemo(() => {
      if (chartData.length === 0) return 10;
      const max = Math.max(...chartData.map(d => d.sessionCount));
      return Math.max(max, weeklyGoal || 0) + 2; // Add padding
    }, [chartData, weeklyGoal]);

    const hasData = chartData.length > 0;

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Session Frequency</CardTitle>
            {weeklyGoal && (
              <div className="text-xs text-muted-foreground">
                Goal: {weeklyGoal} sessions/week
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div
              className="w-full h-[300px]"
              role="img"
              aria-label={`Session frequency chart showing sessions per week over the last ${chartData.length} weeks`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`frequency-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis
                    dataKey="week"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, maxSessions]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {payload[0].payload.week}
                              </span>
                              <span className="text-sm font-bold text-sage-600">
                                {payload[0].value} sessions
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {weeklyGoal && (
                    <ReferenceLine
                      y={weeklyGoal}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      label={{
                        value: 'Goal',
                        position: 'right',
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 12,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="sessionCount"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    fill={`url(#frequency-${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">No session data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
SessionFrequencyChart.displayName = "SessionFrequencyChart";

export { SessionFrequencyChart };
