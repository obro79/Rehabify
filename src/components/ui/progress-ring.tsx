"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  value: number;
  size?: "sm" | "default" | "lg";
  color?: "sage" | "coral";
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SIZE_CONFIG = {
  sm: { dimension: 48, stroke: 6, fontSize: "text-xs" },
  default: { dimension: 80, stroke: 8, fontSize: "text-lg" },
  lg: { dimension: 120, stroke: 10, fontSize: "text-2xl" },
} as const;

const COLOR_CONFIG = {
  sage: {
    progressLight: "var(--sage-light)",
    progressDark: "var(--sage-500)",
    trackLight: "var(--sage-100)",
    trackDark: "var(--sage-200)",
  },
  coral: {
    progressLight: "var(--coral-light)",
    progressDark: "var(--coral-500)",
    trackLight: "var(--coral-200)",
    trackDark: "var(--coral-300)",
  },
} as const;

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      size = "default",
      color = "sage",
      strokeWidth,
      showValue = true,
      className,
      children,
    },
    ref
  ) => {
    const config = SIZE_CONFIG[size];
    const colors = COLOR_CONFIG[color];
    const stroke = strokeWidth ?? config.stroke;
    const radius = (config.dimension - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const gradientId = React.useId();
    const trackGradientId = `${gradientId}-track`;
    const progressGradientId = `${gradientId}-progress`;

    // Animated value state - count up from 0 to actual value
    const [animatedValue, setAnimatedValue] = React.useState(0);
    const prefersReducedMotion = typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    React.useEffect(() => {
      // Skip animation if reduced motion is preferred
      if (prefersReducedMotion) {
        setAnimatedValue(value);
        return;
      }

      // Animate from 0 to value over 1000ms with ease-out
      const duration = 1000;
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (value - startValue) * easeOut;

        setAnimatedValue(Math.round(currentValue));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [value, prefersReducedMotion]);

    const offset = circumference - (animatedValue / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: config.dimension, height: config.dimension }}
      >
        <svg
          className="-rotate-90"
          width={config.dimension}
          height={config.dimension}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
          style={{
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.12))",
          }}
        >
          <defs>
            {/* Track gradient - pillowy inset look */}
            <linearGradient id={trackGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.trackLight} />
              <stop offset="100%" stopColor={colors.trackDark} />
            </linearGradient>
            {/* Progress gradient - raised pillowy look */}
            <linearGradient id={progressGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.progressLight} />
              <stop offset="100%" stopColor={colors.progressDark} />
            </linearGradient>
          </defs>

          {/* Track - pillowy gradient */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke={`url(#${trackGradientId})`}
            strokeWidth={stroke}
          />

          {/* Progress - raised pillowy gradient */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke={`url(#${progressGradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          {children ?? (
            showValue && (
              <span className={cn("font-bold text-foreground", config.fontSize)}>
                {animatedValue}%
              </span>
            )
          )}
        </div>
      </div>
    );
  }
);
ProgressRing.displayName = "ProgressRing";

export { ProgressRing };
