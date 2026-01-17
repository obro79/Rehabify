"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

interface KineticMetricsBarProps {
  currentReps: number;
  targetReps: number;
  formScore: number;
  phase: string;
  isPaused: boolean;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onShowGuide: () => void;
  autoHide?: boolean;
  className?: string;
}

export function KineticMetricsBar({
  currentReps,
  targetReps,
  formScore,
  phase,
  isPaused,
  onPauseToggle,
  onEndSession,
  onShowGuide,
  autoHide = true,
  className,
}: KineticMetricsBarProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-hide logic
  React.useEffect(() => {
    if (!autoHide) return;

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(true);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Initial timer
    resetTimer();

    // Show on mouse movement near bottom
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY > window.innerHeight - 150) {
        resetTimer();
      }
    };

    // Show on any user interaction
    const handleInteraction = () => resetTimer();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [autoHide]);

  // Always visible on mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const shouldShow = !autoHide || isMobile || isVisible || isPaused;

  const getFormColor = (): "sage" | "coral" => {
    return formScore >= 70 ? "sage" : "coral";
  };

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{
        y: shouldShow ? 0 : 80,
        opacity: shouldShow ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "metrics-bar-frost",
        className
      )}
    >
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Metrics */}
          <div className="flex items-center gap-4">
            {/* Rep Counter */}
            <div className="metric-pill">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                  Reps
                </span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={currentReps}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl font-bold tabular-nums text-foreground"
                  >
                    {currentReps}
                    <span className="text-muted-foreground text-lg">/{targetReps}</span>
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Form Score */}
            <div className="metric-pill">
              <div className="flex items-center gap-3">
                <ProgressRing
                  value={formScore}
                  size="sm"
                  color={getFormColor()}
                />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                    Form
                  </span>
                  <span className={cn(
                    "text-sm font-semibold",
                    formScore >= 70 ? "text-sage-600" : "text-coral-600"
                  )}>
                    {formScore >= 90 ? "Perfect!" : formScore >= 70 ? "Good" : "Adjust"}
                  </span>
                </div>
              </div>
            </div>

            {/* Phase */}
            <div className="metric-pill">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                  Phase
                </span>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={phase}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge variant="active" size="sm" className="uppercase">
                      {phase}
                    </Badge>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowGuide}
              className="gap-1.5"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onPauseToggle}
              className="gap-1.5"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onEndSession}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              End
            </Button>
          </div>
        </div>

        {/* Mobile Layout - Grid */}
        <div className="md:hidden space-y-3">
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Reps */}
            <div className="metric-pill metric-pill-compact flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Reps</span>
              <span className="text-lg font-bold tabular-nums">
                {currentReps}/{targetReps}
              </span>
            </div>

            {/* Form */}
            <div className="metric-pill metric-pill-compact flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Form</span>
              <span className={cn(
                "text-lg font-bold",
                formScore >= 70 ? "text-sage-600" : "text-coral-600"
              )}>
                {formScore}%
              </span>
            </div>

            {/* Phase */}
            <div className="metric-pill metric-pill-compact flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Phase</span>
              <Badge variant="active" size="sm" className="uppercase text-[10px]">
                {phase}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowGuide}
              className="flex-1"
            >
              <HelpCircle className="h-4 w-4 mr-1.5" />
              Guide
            </Button>

            <Button
              variant={isPaused ? "secondary" : "ghost"}
              size="sm"
              onClick={onPauseToggle}
              className="flex-1"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1.5" />
                  Pause
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onEndSession}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1.5" />
              End
            </Button>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
