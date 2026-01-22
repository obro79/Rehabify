"use client";

import * as React from "react";
import { useVapi } from "@/hooks/use-vapi";
import { useFormEventBridge } from "@/hooks/use-form-event-bridge";
import { useVoiceStore } from "@/stores/voice-store";
import type { Exercise } from "@/lib/exercises/types";

export type VoicePhase = "explaining" | "analyzing" | "finished";
export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

interface UseSessionVoiceOptions {
  exercise: Exercise | undefined;
  sessionId: string;
  targetReps: number;
}

interface UseSessionVoiceReturn {
  voiceState: VoiceState;
  voicePhase: VoicePhase;
  transcript: string;
  isConnected: boolean;
  isMuted: boolean;
  startVoice: () => void;
  stopVoice: () => void;
  toggleMute: () => void;
}

export function useSessionVoice({
  exercise,
  sessionId,
  targetReps,
}: UseSessionVoiceOptions): UseSessionVoiceReturn {
  const [voicePhase, setVoicePhase] = React.useState<VoicePhase>("explaining");
  const voicePhaseRef = React.useRef<VoicePhase>("explaining");
  voicePhaseRef.current = voicePhase;

  const handleUserReady = React.useCallback(() => {
    if (voicePhaseRef.current === "explaining") {
      setVoicePhase("analyzing");
    }
  }, []);

  const {
    start: startVapi,
    stop: stopVapi,
    isConnected,
    isSpeaking,
    setMuted,
    injectContext,
  } = useVapi({ onUserReady: handleUserReady });

  const {
    connectionState,
    speakingStatus,
    transcript: transcriptEntries,
    isMuted,
  } = useVoiceStore();

  useFormEventBridge({
    injectContext,
    isConnected,
    isSpeaking,
    isAnalyzing: voicePhase === "analyzing",
    exerciseName: exercise?.name,
    targetReps,
  });

  const voiceState = React.useMemo((): VoiceState => {
    if (connectionState === "connecting") return "connecting";
    if (connectionState === "error" || connectionState === "disconnected") return "idle";
    if (speakingStatus === "speaking") return "speaking";
    if (speakingStatus === "thinking") return "thinking";
    return "listening";
  }, [connectionState, speakingStatus]);

  const transcript = React.useMemo(() => {
    if (transcriptEntries.length === 0) {
      return isConnected ? "Listening..." : "Start voice coach for guidance";
    }
    return transcriptEntries.slice(-2).map((t) => t.content).join(" ");
  }, [transcriptEntries, isConnected]);

  const exerciseIntroContext = React.useMemo(() => {
    if (!exercise) return null;
    return `[EXERCISE INTRO]
Exercise: ${exercise.name}
Target area: ${exercise.target_area || exercise.category.replace(/_/g, " ")}
Key cue: ${exercise.instructions[0]}

Greet the user briefly. Tell them what exercise we're doing and give them ONE key thing to focus on.
Then ask: "Ready to start?"
Wait for their confirmation before we begin analyzing their form.`;
  }, [exercise]);

  const hasInjectedContext = React.useRef(false);

  React.useEffect(() => {
    if (isConnected && exerciseIntroContext && !hasInjectedContext.current) {
      hasInjectedContext.current = true;
      const timer = setTimeout(() => injectContext(exerciseIntroContext), 500);
      return () => clearTimeout(timer);
    }
    if (!isConnected) {
      hasInjectedContext.current = false;
      setVoicePhase("explaining");
    }
  }, [isConnected, exerciseIntroContext, injectContext]);

  React.useEffect(() => {
    if (voicePhase === "analyzing" && isConnected) {
      const context = `[EXERCISE STARTING]
The user is ready to begin. Say "Great, let's go - I'm watching your form."
From now on, give brief form corrections when I send you [FORM FEEDBACK NEEDED] messages.
Keep corrections to 5-15 words max. Focus on what TO do, not what's wrong.`;
      injectContext(context);
    }
  }, [voicePhase, isConnected, injectContext]);

  React.useEffect(() => {
    return () => {
      if (isConnected) stopVapi();
    };
  }, [isConnected, stopVapi]);

  const startVoice = React.useCallback(() => {
    startVapi(undefined, {
      sessionId,
      exerciseId: exercise?.id,
      exerciseName: exercise?.name,
      targetReps,
    });
  }, [startVapi, sessionId, exercise, targetReps]);

  const toggleMute = React.useCallback(() => {
    setMuted(!isMuted);
  }, [setMuted, isMuted]);

  return {
    voiceState,
    voicePhase,
    transcript,
    isConnected,
    isMuted,
    startVoice: startVoice,
    stopVoice: stopVapi,
    toggleMute,
  };
}
