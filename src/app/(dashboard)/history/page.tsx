"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import {
  getCategoryIcon,
  getScoreBadgeVariant,
  getCategoryBadgeVariant,
} from "@/lib/exercise-utils";

// Items per page
const ITEMS_PER_PAGE = 10;

interface SessionExercise {
  exerciseName: string;
  exerciseSlug: string;
  category: string;
  formScore: number;
  repsCompleted: number;
}

interface SessionRecord {
  id: string;
  date: string;
  exercises: SessionExercise[] | null;
  durationSeconds: number;
  overallFormScore: string | null;
  createdAt: string;
}

interface HistorySession {
  id: string;
  date: Date;
  dateString: string;
  time: string;
  exercise: string;
  category: string;
  reps: number;
  score: number;
  duration: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function transformSessions(records: SessionRecord[]): HistorySession[] {
  return records.map((record) => {
    const ex = Array.isArray(record.exercises) ? record.exercises[0] : null;
    const createdAt = record.createdAt ? new Date(record.createdAt) : new Date(record.date);

    return {
      id: record.id,
      date: new Date(record.date),
      dateString: formatRelativeDate(record.date),
      time: createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      exercise: ex ? ex.exerciseName : "Exercise",
      category: ex ? ex.category : "general",
      reps: ex ? ex.repsCompleted : 0,
      score: record.overallFormScore ? Math.round(parseFloat(record.overallFormScore)) : 0,
      duration: formatDuration(record.durationSeconds || 0),
    };
  });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function HistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState("all");
  const [exerciseType, setExerciseType] = useState("all");
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch("/api/patient-records");
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const result = await response.json();
        const data = result.data || result;
        const records: SessionRecord[] = data?.sessions || [];
        setSessions(transformSessions(records));
      } catch (err) {
        console.error("[History] Failed to fetch sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // Filter sessions based on selected filters
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Filter by date range
    if (dateRange !== "all") {
      const now = Date.now();
      const daysAgo = {
        "7days": 7,
        "30days": 30,
      }[dateRange] || 30;

      filtered = filtered.filter((session) => {
        const sessionTime = session.date.getTime();
        return now - sessionTime <= daysAgo * 86400000;
      });
    }

    // Filter by exercise type
    if (exerciseType !== "all") {
      filtered = filtered.filter(
        (session) => session.category.toLowerCase() === exerciseType.toLowerCase()
      );
    }

    return filtered;
  }, [sessions, dateRange, exerciseType]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setCurrentPage(1);
  };

  const handleExerciseTypeChange = (value: string) => {
    setExerciseType(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Session History</h1>
          <p className="text-muted-foreground">Loading your sessions...</p>
        </div>
        <div className="h-16 rounded-3xl bg-sage-50 animate-pulse" />
        <div className="h-64 rounded-3xl bg-sage-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {/* Subtle organic background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-radial from-sage-100/25 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-radial from-terracotta-100/15 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Session History</h1>
        <p className="text-muted-foreground">
          View and track your exercise sessions over time
        </p>
      </div>

      {/* Filters - with organic styling */}
      <Card className="p-4 rounded-3xl">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Range Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Date Range
            </label>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise Type Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Exercise Type
            </label>
            <Select value={exerciseType} onValueChange={handleExerciseTypeChange}>
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue placeholder="Select exercise type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mobility">Mobility</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="stability">Stability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Button */}
          {(dateRange !== "all" || exerciseType !== "all") && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setDateRange("all");
                  setExerciseType("all");
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {/* Filter Summary */}
        {filteredSessions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-sage-100">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSessions.length} session
              {filteredSessions.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </Card>

      {/* Sessions Table or Empty State */}
      {paginatedSessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No sessions found"
            description={
              dateRange !== "all" || exerciseType !== "all"
                ? "Try adjusting your filters to see more sessions"
                : "Start your first exercise session to see your history here"
            }
            action={
              dateRange !== "all" || exerciseType !== "all"
                ? {
                    label: "Clear Filters",
                    onClick: () => {
                      setDateRange("all");
                      setExerciseType("all");
                      setCurrentPage(1);
                    },
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden rounded-3xl">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-sage-100/50">
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Exercise Name</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead className="text-center">Reps</TableHead>
                  <TableHead className="text-center">Form Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-sage-50/70 transition-all duration-200 border-b border-sage-100/30"
                  >
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">
                          {session.dateString}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sage-50 rounded-lg">
                          {getCategoryIcon(capitalizeFirst(session.category) as "Mobility" | "Strength" | "Stability", "sm")}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-medium">{session.exercise}</div>
                          <Badge
                            variant={getCategoryBadgeVariant(capitalizeFirst(session.category) as "Mobility" | "Strength" | "Stability")}
                            size="sm"
                          >
                            {capitalizeFirst(session.category)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {session.duration}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {session.reps}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getScoreBadgeVariant(session.score)}
                        size="sm"
                      >
                        {session.score}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
