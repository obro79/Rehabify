"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CelebrationAnimationProps {
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
  /**
   * Callback when user dismisses animation early
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * CelebrationAnimation Component
 *
 * Displays an elaborate celebration animation with organic blob shapes
 * that animate outward from the center using terracotta and sage colors.
 *
 * Features:
 * - Central success indicator that scales in with bounce
 * - 6-8 organic blob shapes animating outward
 * - 2-3 second total animation duration
 * - Skippable via click/tap
 * - GPU-accelerated CSS animations only
 *
 * @example
 * ```tsx
 * <CelebrationAnimation
 *   onComplete={() => console.log('done')}
 *   onDismiss={() => console.log('skipped')}
 * />
 * ```
 */
export function CelebrationAnimation({
  onComplete,
  onDismiss,
  className,
}: CelebrationAnimationProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  // Auto-complete after animation duration
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2500); // 2.5 seconds to allow animation to complete

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Blob configurations with different directions
  const blobs = [
    { color: "sage-300", tx: "-150px", ty: "-150px", delay: "0ms", size: 120 },
    { color: "terracotta-200", tx: "150px", ty: "-150px", delay: "100ms", size: 100 },
    { color: "sage-400", tx: "180px", ty: "0px", delay: "200ms", size: 110 },
    { color: "terracotta-300", tx: "150px", ty: "150px", delay: "300ms", size: 90 },
    { color: "sage-300", tx: "0px", ty: "180px", delay: "100ms", size: 105 },
    { color: "terracotta-200", tx: "-150px", ty: "150px", delay: "200ms", size: 95 },
    { color: "sage-400", tx: "-180px", ty: "0px", delay: "300ms", size: 115 },
    { color: "terracotta-300", tx: "-100px", ty: "-100px", delay: "150ms", size: 85 },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/10 backdrop-blur-sm",
        "cursor-pointer",
        className
      )}
      onClick={handleDismiss}
      role="presentation"
      aria-label="Celebration animation. Click to dismiss."
    >
      <div className="relative">
        {/* Central Success Indicator */}
        <div
          className={cn(
            "relative z-10",
            "w-32 h-32 rounded-full",
            "bg-gradient-to-br from-sage-300 to-sage-500",
            "flex items-center justify-center",
            "animate-celebration-scale-in",
            "shadow-2xl"
          )}
          style={{
            boxShadow: "0 20px 60px rgba(122, 142, 114, 0.4)",
          }}
        >
          {/* Checkmark */}
          <svg
            className="w-16 h-16 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Celebration Blobs */}
        {blobs.map((blob, index) => (
          <div
            key={index}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "rounded-full",
              `bg-${blob.color}`,
              "animate-celebration-blob",
              "will-change-transform"
            )}
            style={
              {
                width: `${blob.size}px`,
                height: `${blob.size}px`,
                "--tx": blob.tx,
                "--ty": blob.ty,
                animationDelay: blob.delay,
                filter: "blur(20px)",
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        ))}

        {/* Additional glow effect */}
        <div
          className="absolute inset-0 rounded-full bg-sage-400/30 blur-3xl animate-celebration-scale-in"
          aria-hidden="true"
        />
      </div>

      {/* Dismiss hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-sm text-sage-700 bg-white/90 px-4 py-2 rounded-full shadow-sm">
          Tap to continue
        </p>
      </div>
    </div>
  );
}
