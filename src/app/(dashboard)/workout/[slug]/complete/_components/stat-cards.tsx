"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepsIcon, TimerIcon } from "@/components/ui/icons";
import { ReactElement, ReactNode } from "react";

interface StatCardProps {
  animationDelay: string;
}

interface StatCardWrapperProps {
  animationDelay: string;
  children: ReactNode;
}

function StatCardWrapper({ animationDelay, children }: StatCardWrapperProps): ReactElement {
  return (
    <Card
      className="surface-organic flex flex-col items-center justify-center p-6 animate-celebration-fade-in-up [animation-delay:var(--delay)]"
      style={{ "--delay": animationDelay } as React.CSSProperties}
    >
      <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
        {children}
      </CardContent>
    </Card>
  );
}

function IconContainer({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
      {children}
    </div>
  );
}

interface StatDisplayProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  status?: string;
}

function StatDisplay({ label, value, subtitle, status }: StatDisplayProps): ReactElement {
  return (
    <div className="space-y-1">
      <span className="block text-sm font-medium text-muted-foreground">{label}</span>
      <span className="block text-3xl font-bold text-foreground">{value}</span>
      {subtitle && (
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      )}
      {status && (
        <div className="text-xs font-medium text-sage-600">{status}</div>
      )}
    </div>
  );
}

interface FormScoreCardProps extends StatCardProps {
  score: number;
  color: "sage" | "coral";
  message: string;
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

interface RepsCardProps extends StatCardProps {
  completed: number;
  target: number;
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

interface DurationCardProps extends StatCardProps {
  duration: string;
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
