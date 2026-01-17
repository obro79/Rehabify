"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImmersivePauseOverlayProps {
  isVisible: boolean;
  onResume: () => void;
  onEnd: () => void;
  exerciseName?: string;
  instructions?: string[];
  className?: string;
}

export function ImmersivePauseOverlay({
  isVisible,
  onResume,
  onEnd,
  exerciseName,
  instructions = [],
  className,
}: ImmersivePauseOverlayProps) {
  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onResume();
      } else if (e.code === "Escape") {
        e.preventDefault();
        onEnd();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onResume, onEnd]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/60 backdrop-blur-md",
            "flex items-center justify-center",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center max-w-md mx-4"
          >
            {/* Animated Pause Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="relative inline-block mb-6"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-150" />

              {/* Icon container */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={cn(
                  "relative w-28 h-28 rounded-full",
                  "bg-white/95 backdrop-blur-sm",
                  "flex items-center justify-center",
                  "shadow-2xl"
                )}
              >
                <Pause className="w-14 h-14 text-sage-700" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2 mb-8"
            >
              <h2 className="text-white text-3xl font-display font-bold">
                Session Paused
              </h2>
              {exerciseName && (
                <p className="text-white/70 text-lg">
                  {exerciseName}
                </p>
              )}
            </motion.div>

            {/* Instructions preview */}
            {instructions.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  "mb-8 p-4 rounded-2xl",
                  "bg-white/10 backdrop-blur-sm",
                  "text-left"
                )}
              >
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                  Quick Reference
                </p>
                <ul className="space-y-1.5">
                  {instructions.slice(0, 3).map((instruction, i) => (
                    <li
                      key={i}
                      className="text-white/80 text-sm flex items-start gap-2"
                    >
                      <span className="text-sage-400 font-bold">{i + 1}.</span>
                      <span className="line-clamp-1">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button
                variant="secondary"
                size="lg"
                onClick={onResume}
                className="gap-2 min-w-[160px]"
              >
                <Play className="h-5 w-5" />
                Resume Workout
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={onEnd}
                className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
                End Session
              </Button>
            </motion.div>

            {/* Keyboard hints */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-white/40 text-xs"
            >
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">
                Space
              </kbd>{" "}
              to resume or{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">
                Esc
              </kbd>{" "}
              to end
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
