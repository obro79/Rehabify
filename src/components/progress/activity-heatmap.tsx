"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockActivityData, type ActivityDataPoint } from "@/lib/mock-data";

interface ActivityHeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: ActivityDataPoint[];
}

interface HeatmapCell {
  date: string;
  sessionCount: number;
  displayDate: string;
  month: number;
  week: number;
  dayOfWeek: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ActivityHeatmap = React.forwardRef<HTMLDivElement, ActivityHeatmapProps>(
  ({ className, data = getMockActivityData(), ...props }, ref) => {
    const [hoveredCell, setHoveredCell] = React.useState<HeatmapCell | null>(null);
    const [focusedCell, setFocusedCell] = React.useState<HeatmapCell | null>(null);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    const heatmapData = React.useMemo(() => {
      if (!data || data.length === 0) return { cells: [], weeks: 0, monthPositions: [] };

      // Get last 365 days
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 364);

      // Find the Sunday before start date
      const startDay = startDate.getDay();
      const adjustedStart = new Date(startDate);
      adjustedStart.setDate(adjustedStart.getDate() - startDay);

      const cells: HeatmapCell[] = [];
      const monthPositions: { month: string; weekIndex: number }[] = [];
      let currentMonth = -1;

      // Generate cells for each day
      let weekIndex = 0;
      const currentDate = new Date(adjustedStart);

      while (currentDate <= now) {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayData = data.find(d => d.date === dateString);
        const dayOfWeek = currentDate.getDay();

        // Track month changes for labels
        if (currentDate.getMonth() !== currentMonth) {
          currentMonth = currentDate.getMonth();
          monthPositions.push({
            month: MONTHS[currentMonth],
            weekIndex,
          });
        }

        cells.push({
          date: dateString,
          sessionCount: dayData?.sessionCount || 0,
          displayDate: currentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          month: currentDate.getMonth(),
          week: weekIndex,
          dayOfWeek,
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);

        // Increment week on Sunday
        if (dayOfWeek === 6) {
          weekIndex++;
        }
      }

      return { cells, weeks: weekIndex + 1, monthPositions };
    }, [data]);

    const getColorClass = (sessionCount: number): string => {
      if (sessionCount === 0) return "bg-sage-50 dark:bg-sage-950";
      if (sessionCount === 1) return "bg-sage-300 dark:bg-sage-700";
      return "bg-sage-600 dark:bg-sage-500";
    };

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="overflow-x-auto"
            role="img"
            aria-label="Activity heatmap showing session frequency over the past year"
          >
            <div className="min-w-[800px]">
              {/* Month labels */}
              <div className="flex gap-[2px] mb-2 ml-8">
                {heatmapData.monthPositions.map((pos, index) => (
                  <div
                    key={index}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft: index === 0 ? 0 : `${(pos.weekIndex - (heatmapData.monthPositions[index - 1]?.weekIndex || 0)) * 14 - 14}px`,
                    }}
                  >
                    {pos.month}
                  </div>
                ))}
              </div>

              {/* Grid container */}
              <div className="flex gap-2">
                {/* Day labels */}
                <div className="flex flex-col gap-[2px]">
                  {DAYS.map((day, index) => (
                    <div
                      key={day}
                      className={cn(
                        "text-xs text-muted-foreground h-3 flex items-center",
                        index % 2 === 1 ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div
                  className="grid gap-[2px] relative"
                  style={{
                    gridTemplateColumns: `repeat(${heatmapData.weeks}, 12px)`,
                    gridTemplateRows: 'repeat(7, 12px)',
                    gridAutoFlow: 'column',
                  }}
                >
                  {heatmapData.cells.map((cell, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-3 h-3 rounded-sm transition-all cursor-pointer hover:ring-2 hover:ring-sage-400 focus:ring-2 focus:ring-sage-400 focus:outline-none",
                        getColorClass(cell.sessionCount)
                      )}
                      tabIndex={0}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onFocus={() => setFocusedCell(cell)}
                      onBlur={() => setFocusedCell(null)}
                      aria-label={`${cell.displayDate}: ${cell.sessionCount} session${cell.sessionCount !== 1 ? 's' : ''}`}
                    />
                  ))}

                  {/* Tooltip */}
                  {(hoveredCell || focusedCell) && (
                    <div
                      ref={tooltipRef}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${(hoveredCell || focusedCell)!.week * 14}px`,
                        top: `${(hoveredCell || focusedCell)!.dayOfWeek * 14 + 20}px`,
                      }}
                    >
                      <div className="rounded-lg border bg-background p-2 shadow-md text-xs whitespace-nowrap">
                        <div className="font-medium">{(hoveredCell || focusedCell)!.displayDate}</div>
                        <div className="text-muted-foreground">
                          {(hoveredCell || focusedCell)!.sessionCount} session{(hoveredCell || focusedCell)!.sessionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 ml-8">
                <span className="text-xs text-muted-foreground">Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-sage-50 dark:bg-sage-950" />
                  <div className="w-3 h-3 rounded-sm bg-sage-300 dark:bg-sage-700" />
                  <div className="w-3 h-3 rounded-sm bg-sage-600 dark:bg-sage-500" />
                </div>
                <span className="text-xs text-muted-foreground">More</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
ActivityHeatmap.displayName = "ActivityHeatmap";

export { ActivityHeatmap };
