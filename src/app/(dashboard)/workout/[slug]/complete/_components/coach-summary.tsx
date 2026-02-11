"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CoachSummaryProps {
  summary: string;
  animationDelay: string;
}

export function CoachSummary({
  summary,
  animationDelay,
}: CoachSummaryProps) {
  return (
    <Card
      className="surface-organic animate-celebration-fade-in-up"
      style={{ animationDelay }}
    >
      <CardHeader>
        <CardTitle>Coach Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-sage-700 leading-relaxed">{summary}</p>
        <Button variant="ghost" className="w-full" disabled>
          <Play size={16} />
          Play Audio Summary
        </Button>
      </CardContent>
    </Card>
  );
}
