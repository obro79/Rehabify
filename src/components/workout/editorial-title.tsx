"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EditorialTitleProps {
  exerciseName: string;
  category: string;
  timer?: React.ReactNode;
  className?: string;
}

export function EditorialTitle({
  exerciseName,
  category,
  timer,
  className,
}: EditorialTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cn(
        "absolute top-8 md:top-12 left-0 right-0 z-20",
        "p-6 sm:p-8 lg:p-12",
        "pointer-events-none",
        className
      )}
    >
      {/* Mobile: Title above camera, center-aligned */}
      <div className="md:hidden text-center">
        <h1 className={cn(
          "font-display font-bold tracking-tight leading-[0.9]",
          "text-4xl sm:text-5xl",
          "text-white",
          "drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
          "select-none"
        )}>
          {exerciseName}
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="text-white/70 text-sm font-medium uppercase tracking-wider">
            {category.replace(/_/g, " ")}
          </span>
          {timer && (
            <>
              <span className="text-white/40">|</span>
              <span className="text-white/90 font-mono tabular-nums">{timer}</span>
            </>
          )}
        </div>
      </div>

      {/* Desktop: Large editorial title overlaid on camera */}
      <div className="hidden md:block">
        <h1 className={cn(
          "font-display font-bold tracking-tighter leading-[0.85]",
          "text-[clamp(4rem,10vw,8rem)]",
          "text-white",
          "drop-shadow-[0_6px_30px_rgba(0,0,0,0.5)]",
          "select-none"
        )}>
          {exerciseName}
        </h1>
        <div className="flex items-center gap-4 mt-3">
          <span className={cn(
            "px-4 py-1.5 rounded-full",
            "bg-white/15 backdrop-blur-md border border-white/20",
            "text-white/90 text-sm font-medium uppercase tracking-wider"
          )}>
            {category.replace(/_/g, " ")}
          </span>
          {timer && (
            <span className={cn(
              "px-4 py-1.5 rounded-full",
              "bg-white/15 backdrop-blur-md border border-white/20",
              "text-white font-mono text-lg tabular-nums"
            )}>
              {timer}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
