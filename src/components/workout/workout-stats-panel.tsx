"use client";

import * as React from "react";
import { Volume2, Mic, MicOff, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RepCounter } from "@/components/ui/rep-counter";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import { cn } from "@/lib/utils";
import { getFormScoreColor, getFormFeedback } from "@/lib/exercise-utils";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

interface WorkoutStatsPanelProps {
  // Voice
  voiceState: VoiceState;
  transcript: string;
  isConnected: boolean;
  isMuted: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onToggleMute: () => void;
  // Metrics
  repCount: number;
  targetReps: number;
  formScore: number;
  phase: string;
  className?: string;
}

export function WorkoutStatsPanel({
  voiceState,
  transcript,
  isConnected,
  isMuted,
  onStartVoice,
  onStopVoice,
  onToggleMute,
  repCount,
  targetReps,
  formScore,
  phase,
  className,
}: WorkoutStatsPanelProps) {
  return (
    <div className={cn("flex flex-col h-full gap-4", className)}>
      {/* Voice Coach Section */}
      <Card className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Voice Coach</h3>
          <Badge variant="outlined" className="text-xs">
            {voiceState === "listening"
              ? "Listening"
              : voiceState === "speaking"
              ? "Speaking"
              : voiceState}
          </Badge>
        </div>

        {/* Compact Voice Indicator */}
        <div className="flex justify-center py-3">
          <VoiceIndicator state={voiceState} size="md" />
        </div>

        {/* Transcript - compact */}
        <div className="bg-muted/50 rounded-lg p-3 mb-3 min-h-[60px]">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            "{transcript}"
          </p>
        </div>

        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onStartVoice}
              className="flex-1 gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Start Coach
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStopVoice}
                className="flex-1 gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Stop
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Rep Counter - Prominent */}
      <Card className="p-4 flex-shrink-0">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">Reps</p>
          <RepCounter current={repCount} target={targetReps} size="lg" />
        </div>
      </Card>

      {/* Form Score */}
      <Card className="p-4 flex-shrink-0">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Form Score
          </p>
          <ProgressRing
            value={formScore}
            size="default"
            color={getFormScoreColor(formScore)}
          />
          <p
            className={cn(
              "text-xs font-medium mt-2",
              formScore >= 70 ? "text-sage-600" : "text-coral-600"
            )}
          >
            {getFormFeedback(formScore)}
          </p>
        </div>
      </Card>

      {/* Phase Indicator */}
      <Card className="p-4 flex-1">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-muted-foreground mb-2">Phase</p>
          <Badge variant="active" size="default" className="uppercase">
            {phase}
          </Badge>
        </div>
      </Card>
    </div>
  );
}
