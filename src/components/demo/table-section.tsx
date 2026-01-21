"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const TABLE_HEADERS = ["Date", "Exercise", "Reps", "Duration", "Score"];

const TABLE_DATA = [
  { date: "Dec 23, 2025", exercise: "Cat-Camel", reps: "10", duration: "5:30", score: "95%", variant: "success" as const },
  { date: "Dec 22, 2025", exercise: "Cobra Stretch", reps: "8", duration: "4:15", score: "88%", variant: "success" as const },
  { date: "Dec 21, 2025", exercise: "Dead Bug", reps: "12", duration: "6:00", score: "72%", variant: "warning" as const },
];

export function TableSection(): React.JSX.Element {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {TABLE_HEADERS.map(h => <TableHead key={h}>{h}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {TABLE_DATA.map(row => (
          <TableRow key={row.date}>
            <TableCell>{row.date}</TableCell>
            <TableCell>{row.exercise}</TableCell>
            <TableCell>{row.reps}</TableCell>
            <TableCell>{row.duration}</TableCell>
            <TableCell><Badge variant={row.variant} size="sm">{row.score}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
