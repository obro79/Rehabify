"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const ShoulderIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Clavicle (collarbone) */}
        <path
          d="M 8 16 Q 14 14 20 16 L 22 18 L 10 20 Q 8 18 8 16 Z"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <path
          d="M 8 16 Q 14 14 20 16 L 15 17 L 10 18 Q 8 17 8 16 Z"
          fill={`url(#${id}-h)`}
        />

        {/* Shoulder joint (ball and socket) */}
        <circle
          cx="24"
          cy="20"
          r="9"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <ellipse
          cx="24"
          cy="20"
          rx="4.5"
          ry="7"
          fill={`url(#${id}-h)`}
        />

        {/* Scapula (shoulder blade) */}
        <path
          d="M 22 12 L 30 8 L 34 18 L 28 22 Q 24 20 22 12 Z"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <path
          d="M 22 12 L 30 8 L 32 13 L 26 17 Q 24 15 22 12 Z"
          fill={`url(#${id}-h)`}
        />

        {/* Upper arm (humerus) */}
        <rect
          x="18"
          y="26"
          width="12"
          height="18"
          rx="6"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <rect
          x="18"
          y="26"
          width="6"
          height="18"
          rx="6"
          fill={`url(#${id}-h)`}
        />

        {/* Joint highlight */}
        <circle
          cx="24"
          cy="20"
          r="3"
          fill={colors.accent}
          fillOpacity="0.6"
        />

        {/* Rotator cuff indicators (small dots around joint) */}
        {[
          { cx: 19, cy: 16 },
          { cx: 29, cy: 16 },
          { cx: 19, cy: 24 },
          { cx: 29, cy: 24 },
        ].map((pos, i) => (
          <circle
            key={i}
            cx={pos.cx}
            cy={pos.cy}
            r="1.5"
            fill={colors.accent}
            fillOpacity="0.4"
          />
        ))}
      </svg>
    );
  }
);
ShoulderIcon.displayName = "ShoulderIcon";

export { ShoulderIcon };
