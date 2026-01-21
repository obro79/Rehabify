"use client";

import React from "react";
import { Mic, MicOff, Volume2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import type { VoiceState } from "@/hooks/use-session-voice";

interface VoiceCoachCardProps {
  voiceState: VoiceState;
  transcript: string;
  isConnected: boolean;
  isMuted: boolean;
  isConnecting: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
}

function getVoiceStateLabel(state: VoiceState): string {
  switch (state) {
    case "listening":
      return "Listening...";
    case "speaking":
      return "Speaking";
    default:
      return state;
  }
}

export function VoiceCoachCard({
  voiceState,
  transcript,
  isConnected,
  isMuted,
  isConnecting,
  onStart,
  onStop,
  onToggleMute,
}: VoiceCoachCardProps): React.JSX.Element {
  return (
    <Card className="p-6 flex flex-col bg-white/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-foreground">Voice Coach</h2>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
              className="h-8 w-8 p-0"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Badge variant="outlined" className="bg-white/50">
            {getVoiceStateLabel(voiceState)}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-6 min-h-[160px]">
        <VoiceIndicator state={voiceState} size="lg" />
      </div>

      <div className="space-y-3 mt-4">
        <div className="relative">
          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-sage-200 transform rotate-45 z-10" />
          <div className="bg-white rounded-2xl p-4 shadow-sm relative z-0">
            <p className="text-sm text-sage-800 font-medium leading-relaxed">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          {!isConnected ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={onStart}
              disabled={isConnecting}
              className="w-full gap-2"
            >
              <Volume2 className="h-4 w-4" />
              {isConnecting ? "Connecting..." : "Start Voice Coach"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="lg"
              onClick={onStop}
              className="w-full gap-2"
            >
              <X className="h-4 w-4" />
              Stop Voice Coach
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
