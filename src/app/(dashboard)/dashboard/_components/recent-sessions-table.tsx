"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { getCategoryIcon, getScoreBadgeVariant } from "@/lib/exercise-utils";

interface SessionData {
  date: string;
  exercise: string;
  category: "Mobility" | "Stability" | "Strength";
  reps: number;
  score: number;
  duration: string;
}

interface RecentSessionsTableProps {
  sessions: SessionData[];
}

export function RecentSessionsTable({
  sessions,
}: RecentSessionsTableProps): ReactNode {
  return (
    <section className="space-y-4">
      <div className="section-header">
        <h2 className="section-title">Recent Sessions</h2>
        <Link href="/history" className="link-muted">
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Card variant="organic" className="overflow-hidden rounded-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Exercise</TableHead>
              <TableHead className="text-center">Reps</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, i) => (
              <TableRow
                key={i}
                className="cursor-pointer hover:bg-sage-50/50 transition-colors"
              >
                <TableCell className="text-muted-foreground">
                  {session.date}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="icon-wrapper-sm">
                      {getCategoryIcon(session.category, "sm")}
                    </div>
                    <span className="font-medium">{session.exercise}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{session.reps}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={getScoreBadgeVariant(session.score)}
                    size="sm"
                  >
                    {session.score}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {session.duration}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
