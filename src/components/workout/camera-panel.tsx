"use client";

import * as React from "react";
import { ImageIcon, Pause, Play, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExerciseCamera } from "@/components/workout/exercise-camera";
import { getExerciseVideoUrl } from "@/lib/exercises/video-map";
import type { Exercise } from "@/lib/exercises/types";

interface CameraPanelProps {
  exercise: Exercise;
  isPaused: boolean;
  onResume: () => void;
}

export function CameraPanel({
  exercise,
  isPaused,
  onResume,
}: CameraPanelProps): React.JSX.Element {
  const [showGuide, setShowGuide] = React.useState(false);
  const guideVideoUrl = getExerciseVideoUrl(exercise.slug);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Card className="overflow-hidden shadow-lg">
          <ExerciseCamera
            exercise={exercise}
            isPaused={isPaused}
            className="h-[600px] w-full"
          >
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 gap-1.5 shadow-sm"
              onClick={() => setShowGuide(!showGuide)}
            >
              <ImageIcon className="h-4 w-4" />
              Guide
            </Button>

            {isPaused && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/90">
                    <Pause className="w-12 h-12 text-sage-600" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl">Paused</p>
                    <p className="text-white/80 text-sm mt-1">Press Resume to continue</p>
                  </div>
                  <Button variant="secondary" size="lg" onClick={onResume} className="gap-2">
                    <Play className="h-5 w-5" />
                    Resume Workout
                  </Button>
                </div>
              </div>
            )}
          </ExerciseCamera>
        </Card>

        {showGuide && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
            <Card className="max-w-xs mx-4 p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 z-10"
                onClick={() => setShowGuide(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-base">Reference Guide</h3>
                <div className="aspect-[3/4] bg-gradient-to-br from-sage-100 to-sage-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {guideVideoUrl ? (
                    <video
                      src={guideVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <p className="text-sage-600 text-xs text-center px-4">
                      Exercise illustration
                    </p>
                  )}
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {exercise.instructions.slice(0, 3).map((instruction, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-sage-500 font-bold">&#8226;</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
