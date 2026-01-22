"use client";

import { CheckCircle2 } from "lucide-react";

interface CelebrationHeaderProps {
  userName: string;
  exerciseName: string;
}

export function CelebrationHeader({
  userName,
  exerciseName,
}: CelebrationHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <CheckCircle2 size={80} className="text-sage-500" fill="currentColor" />
          <div className="absolute inset-0 bg-sage-400/20 blur-xl rounded-full animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Great Session, {userName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          You completed{" "}
          <span className="font-semibold text-sage-600">{exerciseName}</span>{" "}
          with excellent form
        </p>
      </div>
    </div>
  );
}
