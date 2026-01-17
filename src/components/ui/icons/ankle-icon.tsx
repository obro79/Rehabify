"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const AnkleIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();

    return (
      <svg
        ref={ref}
        width={ICON_SIZES[size]}
        height={ICON_SIZES[size]}
        className={cn("drop-shadow-md", className)}
        {...BASE_SVG_ATTRS}
        {...props}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <linearGradient id={`${id}-h`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Lower leg (tibia/fibula) */}
        <rect
          x="20"
          y="4"
          width="8"
          height="18"
          rx="4"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <rect
          x="20"
          y="4"
          width="4"
          height="18"
          rx="4"
          fill={`url(#${id}-h)`}
        />

        {/* Ankle joint */}
        <ellipse
          cx="24"
          cy="24"
          rx="7"
          ry="5"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <ellipse
          cx="24"
          cy="24"
          rx="3.5"
          ry="4"
          fill={`url(#${id}-h)`}
        />

        {/* Foot base */}
        <path
          d="M 17 28 L 17 32 L 35 32 L 35 28 Q 35 26 33 26 L 19 26 Q 17 26 17 28 Z"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <path
          d="M 17 28 L 17 32 L 26 32 L 26 28 Q 26 26 24 26 L 19 26 Q 17 26 17 28 Z"
          fill={`url(#${id}-h)`}
        />

        {/* Toes */}
        {[30, 33, 36].map((x, i) => (
          <rect
            key={i}
            x={x}
            y="34"
            width="3"
            height="6"
            rx="1.5"
            fill={`url(#${id}-g)`}
            filter={`url(#${id}-s)`}
          />
        ))}

        {/* Joint highlight */}
        <circle
          cx="24"
          cy="24"
          r="2"
          fill={colors.accent}
          fillOpacity="0.6"
        />
      </svg>
    );
  }
);
AnkleIcon.displayName = "AnkleIcon";

export { AnkleIcon };
