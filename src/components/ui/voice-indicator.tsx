"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export interface VoiceIndicatorProps {
  state: VoiceState;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { container: 56, outer: 48, core: 34, glow: 24 },
  md: { container: 96, outer: 84, core: 60, glow: 42 },
  lg: { container: 140, outer: 120, core: 86, glow: 60 },
} as const;

const STATE_CONFIG = {
  idle: {
    label: "Offline",
    outer: ["var(--muted)", "var(--muted-dark)"],
    core: ["var(--muted-dark)", "var(--muted)"],
    glow: "var(--muted)",
  },
  connecting: {
    label: "Connecting...",
    outer: ["var(--sage-200)", "var(--sage-300)"],
    core: ["var(--sage-300)", "var(--sage-400)"],
    glow: "var(--sage-200)",
  },
  listening: {
    label: "Listening...",
    outer: ["var(--sage-300)", "var(--sage-400)"],
    core: ["var(--sage-400)", "var(--sage-600)"],
    glow: "var(--sage-300)",
  },
  thinking: {
    label: "Thinking...",
    outer: ["var(--sage-light)", "var(--sage-500)"],
    core: ["var(--sage-500)", "var(--sage-700)"],
    glow: "var(--sage-400)",
  },
  speaking: {
    label: "Speaking...",
    outer: ["var(--coral-300)", "var(--coral-400)"],
    core: ["var(--coral-400)", "var(--coral-500)"],
    glow: "var(--coral-300)",
  },
} as const;

const LABEL_COLORS: Record<VoiceState, string> = {
  idle: "text-muted-foreground",
  connecting: "text-sage-400",
  listening: "text-sage-500",
  thinking: "text-sage-600",
  speaking: "text-coral-500",
};

const VoiceIndicator = React.forwardRef<HTMLDivElement, VoiceIndicatorProps>(
  ({ state, size = "md", showLabel = true, className }, ref) => {
    const dim = SIZE_CONFIG[size];
    const config = STATE_CONFIG[state];
    const isActive = state !== "idle";
    const isSpeaking = state === "speaking";
    const isThinking = state === "thinking";
    const isListening = state === "listening";

    const barHeights = [0.5, 0.8, 1, 0.9, 0.6, 0.85, 0.55];
    const barWidth = size === "sm" ? 2 : size === "md" ? 3 : 4;
    const barMaxHeight = size === "sm" ? 12 : size === "md" ? 18 : 26;
    const dotSize = size === "sm" ? 5 : size === "md" ? 7 : 10;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-2", className)}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: dim.container, height: dim.container }}
        >
          {/* Ambient glow */}
          {isActive && (
            <div
              className={cn(
                "absolute rounded-full blur-md transition-opacity duration-500",
                isSpeaking && "animate-[glow-pulse_1.2s_ease-in-out_infinite]",
                isListening && "animate-[glow-pulse_2s_ease-in-out_infinite]"
              )}
              style={{
                width: dim.outer + 20,
                height: dim.outer + 20,
                backgroundColor: config.glow,
                opacity: isSpeaking ? 0.6 : 0.4,
              }}
            />
          )}

          {/* Ripple rings */}
          {isActive && (
            <>
              <div
                className="absolute rounded-full border animate-[ripple_2s_ease-out_infinite]"
                style={{
                  width: dim.outer,
                  height: dim.outer,
                  borderColor: config.outer[1],
                }}
              />
              <div
                className="absolute rounded-full border animate-[ripple_2s_ease-out_infinite_0.6s]"
                style={{
                  width: dim.outer,
                  height: dim.outer,
                  borderColor: config.outer[1],
                }}
              />
            </>
          )}

          {/* Outer ring */}
          <div
            className={cn(
              "absolute rounded-full shadow-pillowy-colored transition-all duration-300",
              isActive && "animate-[breathe_4s_ease-in-out_infinite]"
            )}
            style={{
              width: dim.outer,
              height: dim.outer,
              background: `linear-gradient(145deg, ${config.outer[0]}, ${config.outer[1]})`,
            }}
          />

          {/* Core orb */}
          <div
            className={cn(
              "absolute rounded-full transition-all duration-300",
              isSpeaking && "animate-[speak-pulse_0.6s_ease-in-out_infinite]"
            )}
            style={{
              width: dim.core,
              height: dim.core,
              background: `
                radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, transparent 40%),
                linear-gradient(145deg, ${config.core[0]}, ${config.core[1]})
              `,
              boxShadow: `
                0 4px 16px rgba(0,0,0,0.2),
                inset 0 2px 2px rgba(255,255,255,0.4),
                inset 0 -3px 6px rgba(0,0,0,0.15)
              `,
            }}
          />

          {/* Shine spot */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: dim.glow,
              height: dim.glow * 0.6,
              top: dim.container / 2 - dim.core / 2 + dim.core * 0.15,
              left: dim.container / 2 - dim.glow / 2 + dim.glow * 0.1,
              background: "radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)",
              filter: "blur(1px)",
            }}
          />

          {/* Speaking: Audio bars */}
          {isSpeaking && (
            <div className="absolute flex items-center justify-center gap-[2px]">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="bg-white/90 rounded-full shadow-sm animate-[wave-bar_0.5s_ease-in-out_infinite]"
                  style={{
                    width: barWidth,
                    height: barMaxHeight * h,
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Thinking: Bouncing dots */}
          {isThinking && (
            <div className="absolute flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white/90 rounded-full shadow-sm animate-[bounce-dot_1s_ease-in-out_infinite]"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Listening: Expanding rings */}
          {isListening && (
            <>
              <div
                className="absolute rounded-full border border-white/30 animate-[listening-ring_2s_ease-out_infinite]"
                style={{ width: dim.core * 0.6, height: dim.core * 0.6 }}
              />
              <div
                className="absolute rounded-full border border-white/20 animate-[listening-ring_2s_ease-out_infinite_0.5s]"
                style={{ width: dim.core * 0.6, height: dim.core * 0.6 }}
              />
            </>
          )}
        </div>

        {/* Label */}
        {showLabel && (
          <span
            className={cn(
              "font-medium transition-colors",
              size === "sm" && "text-[10px]",
              size === "md" && "text-xs",
              size === "lg" && "text-sm",
              LABEL_COLORS[state]
            )}
          >
            {config.label}
          </span>
        )}
      </div>
    );
  }
);
VoiceIndicator.displayName = "VoiceIndicator";

export { VoiceIndicator };
