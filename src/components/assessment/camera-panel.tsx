"use client";

import { Card } from "@/components/ui/card";
import { ExerciseCamera } from "@/components/workout";
import type { Exercise } from "@/lib/exercises/types";

interface CameraPanelProps {
  exercise?: Exercise;
  isMovementPhase: boolean;
}

export function CameraPanel({ exercise, isMovementPhase }: CameraPanelProps): React.ReactElement {
  if (isMovementPhase && exercise) {
    return (
      <Card className="h-full overflow-hidden shadow-lg border-sage-200">
        <ExerciseCamera exercise={exercise} isPaused={false} className="h-full w-full" />
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden shadow-lg border-sage-200">
      <CameraPlaceholder />
    </Card>
  );
}

function CameraPlaceholder(): React.ReactElement {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center p-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-300/50 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">Camera Preview</p>
        <p className="text-xs text-slate-400">Your camera will activate during movement tests</p>
      </div>
    </div>
  );
}
