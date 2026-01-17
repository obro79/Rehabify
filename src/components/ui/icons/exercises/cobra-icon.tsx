"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "../shared";

const CobraIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const s = `url(#${id}-s)`;

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
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx="24" cy="24" r="22" fill={g} filter={s} />
        <path
          d="M24 2 A22 22 0 0 0 4 18"
          stroke="white"
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
          fill="none"
        />

        {/* Figure in cobra pose (prone with upper body lifted) */}
        <g fill="white" fillOpacity="0.95">
          {/* Head - lifted up */}
          <circle cx="14" cy="16" r="4" />

          {/* Upper back curve (extension) */}
          <path
            d="M16 18 Q22 24 32 32"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />

          {/* Arms pushing up */}
          <path
            d="M18 22 L16 30"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />
          <path
            d="M24 26 L22 32"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />

          {/* Legs (lying flat) */}
          <path
            d="M32 32 L40 34"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />
        </g>

        {/* Ground line */}
        <line
          x1="8"
          y1="36"
          x2="42"
          y2="36"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
);
CobraIcon.displayName = "CobraIcon";

export { CobraIcon };
