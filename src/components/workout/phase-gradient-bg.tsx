"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PHASE_GRADIENTS: Record<string, string> = {
  neutral: "from-sand-100 via-sand-200/50 to-background",
  cat: "from-sage-100/80 via-sage-50/60 to-background",
  camel: "from-terracotta-100/60 via-coral-300/20 to-background",
  extension: "from-coral-300/40 via-terracotta-100/30 to-background",
  flexion: "from-sage-200/60 via-sage-100/40 to-background",
  hold: "from-terracotta-50/50 via-sand-100/40 to-background",
};

interface PhaseGradientBgProps {
  phase: string;
  className?: string;
}

export function PhaseGradientBg({ phase, className }: PhaseGradientBgProps) {
  const gradientClass = PHASE_GRADIENTS[phase] || PHASE_GRADIENTS.neutral;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className={cn(
          "fixed inset-0 -z-10",
          "bg-gradient-to-b",
          gradientClass,
          className
        )}
        aria-hidden="true"
      />
    </AnimatePresence>
  );
}
