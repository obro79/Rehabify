"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

interface FloatingVoiceCoachProps {
  voiceState: VoiceState;
  transcript: string;
  className?: string;
}

export function FloatingVoiceCoach({
  voiceState,
  transcript,
  className,
}: FloatingVoiceCoachProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-expand when speaking on desktop
  React.useEffect(() => {
    if (!isMobile && voiceState === "speaking") {
      setIsExpanded(true);
    }
  }, [voiceState, isMobile]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed z-40",
        "bottom-24 md:bottom-28 left-4 md:left-6",
        className
      )}
    >
      {/* Mobile: Compact orb only */}
      {isMobile ? (
        <motion.button
          onClick={toggleExpand}
          className={cn(
            "relative",
            "rounded-full",
            "voice-coach-pill",
            "p-3",
            "transition-all duration-300",
            isExpanded && "rounded-2xl p-4"
          )}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-3">
            <VoiceIndicator state={voiceState} size="sm" />

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-foreground text-sm max-w-[180px] line-clamp-2">
                    {transcript}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expand indicator */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sage-200 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-sage-600" />
            ) : (
              <ChevronUp className="w-3 h-3 text-sage-600" />
            )}
          </div>
        </motion.button>
      ) : (
        /* Desktop: Floating pill with transcript */
        <motion.div
          className={cn(
            "voice-coach-pill",
            "rounded-full",
            "transition-all duration-300 ease-out",
            "cursor-pointer",
            isExpanded ? "rounded-2xl px-5 py-4" : "px-4 py-3"
          )}
          onClick={toggleExpand}
          layout
        >
          <div className="flex items-center gap-4">
            {/* Voice Orb */}
            <div className="flex-shrink-0">
              <VoiceIndicator state={voiceState} size="md" />
            </div>

            {/* Collapsed state - no labels, just visual indicator */}

            {/* Transcript (expanded) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="max-w-[280px]">
                    <p className="text-foreground text-sm leading-relaxed italic">
                      &ldquo;{transcript}&rdquo;
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expand/Collapse indicator */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="flex-shrink-0 text-sage-400"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
