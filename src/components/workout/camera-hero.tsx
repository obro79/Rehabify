"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraHeroProps {
  isPaused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CameraHero({ isPaused, className, children }: CameraHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative w-full overflow-hidden",
        "h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[calc(100vh-88px)]",
        "bg-sage-900",
        className
      )}
    >
      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)"
        }}
        aria-hidden="true"
      />

      {/* Camera placeholder - gradient background with subtle animation */}
      <div className={cn(
        "absolute inset-0",
        "bg-gradient-to-br from-sage-800 via-sage-700 to-sage-900",
        "flex items-center justify-center"
      )}>
        {/* Grid overlay for visual interest */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
          aria-hidden="true"
        />

        {/* Centered placeholder icon */}
        <div className="relative z-20 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            {isPaused ? (
              <VideoOff className="w-12 h-12 text-white/60" />
            ) : (
              <Video className="w-12 h-12 text-white/60" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-white/80 font-medium text-lg">Camera Preview</p>
            <p className="text-white/50 text-sm">MediaPipe skeleton overlay active</p>
          </div>
        </div>
      </div>

      {/* Children overlay (for title, controls, etc.) */}
      {children}

      {/* Bottom gradient fade for metrics bar transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to top, rgba(245,243,238,0.95) 0%, transparent 100%)"
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
