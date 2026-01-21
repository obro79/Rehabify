"use client";

import { ReactElement } from "react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepsIcon, TimerIcon } from "@/components/ui/icons";
import { StatCardWrapper } from "@/components/ui/stat-card-wrapper";
import { IconContainer } from "@/components/ui/icon-container";
import { StatDisplay } from "@/components/ui/stat-display";

interface FormScoreCardProps {
  score: number;
  color: "sage" | "coral";
  message: string;
  animationDelay: string;
}

export function FormScoreCard({
  score,
  color,
  message,
  animationDelay,
}: FormScoreCardProps): ReactElement {
  return (
    <StatCardWrapper animationDelay={animationDelay}>
      <span className="text-sm font-medium text-muted-foreground">FORM SCORE</span>
      <ProgressRing value={score} size="lg" color={color} />
      <span className="text-sm font-medium text-sage-600">{message}</span>
    </StatCardWrapper>
  );
}

interface RepsCardProps {
  completed: number;
  target: number;
  animationDelay: string;
}

function getCompletionStatus(completed: number, target: number): string {
  return completed >= target ? "Complete!" : "Keep going!";
}

export function RepsCard({
  completed,
  target,
  animationDelay,
}: RepsCardProps): ReactElement {
  return (
    <StatCardWrapper animationDelay={animationDelay}>
      <IconContainer>
        <RepsIcon size="sm" variant="sage" />
      </IconContainer>
      <StatDisplay
        label="REPS COMPLETED"
        value={completed}
        subtitle={`Target: ${target}`}
        status={getCompletionStatus(completed, target)}
      />
    </StatCardWrapper>
  );
}

interface DurationCardProps {
  duration: string;
  animationDelay: string;
}

export function DurationCard({
  duration,
  animationDelay,
}: DurationCardProps): ReactElement {
  return (
    <StatCardWrapper animationDelay={animationDelay}>
      <IconContainer>
        <TimerIcon size="sm" variant="sage" />
      </IconContainer>
      <StatDisplay
        label="DURATION"
        value={duration}
        subtitle="minutes"
        status="Good pace"
      />
    </StatCardWrapper>
  );
}
