"use client";

import { Mic, MicOff, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import type { VoiceState } from "@/app/assessment/lower-back/constants";

interface VoiceCoachPanelProps {
  voiceState: VoiceState;
  transcript: string;
  isConnected: boolean;
  isMuted: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
}

export function VoiceCoachPanel({
  voiceState,
  transcript,
  isConnected,
  isMuted,
  onStart,
  onStop,
  onToggleMute,
}: VoiceCoachPanelProps): React.ReactElement {
  const stateLabel = voiceState === "listening" ? "Listening" : voiceState === "speaking" ? "Speaking" : voiceState;

  return (
    <Card className="p-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Voice Coach</h3>
        <Badge variant="outlined" className="text-xs capitalize">
          {stateLabel}
        </Badge>
      </div>

      <div className="flex justify-center py-3">
        <VoiceIndicator state={voiceState} size="md" />
      </div>

      <div className="bg-muted/50 rounded-lg p-3 mb-3 min-h-[60px]">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          "{transcript}"
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Button variant="ghost" size="sm" onClick={onStop} className="flex-1 gap-1.5">
              <X className="h-3.5 w-3.5" />
              End
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleMute}>
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={onStart} className="flex-1 gap-1.5">
            <Volume2 className="h-3.5 w-3.5" />
            Start Assessment
          </Button>
        )}
      </div>
    </Card>
  );
}
