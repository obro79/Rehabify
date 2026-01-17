"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const RepsIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const d = `url(#${id}-d)`;
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
          <linearGradient id={`${id}-d`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.darker} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Circular background */}
        <circle cx="24" cy="24" r="20" fill={g} filter={s} />
        <path
          d="M24 4 A20 20 0 0 0 6 18"
          stroke="white"
          strokeWidth="6"
          strokeOpacity="0.3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner circle */}
        <circle cx="24" cy="24" r="14" fill="white" fillOpacity="0.9" />

        {/* Refresh arrows */}
        <g fill={d}>
          {/* Top arrow */}
          <path d="M24 12 C17 12 12 17 12 24 L16 24 C16 19.5 19.5 16 24 16 L24 12 Z" />
          <path d="M24 12 L28 16 L24 20 L24 12 Z" />

          {/* Bottom arrow */}
          <path d="M24 36 C31 36 36 31 36 24 L32 24 C32 28.5 28.5 32 24 32 L24 36 Z" />
          <path d="M24 36 L20 32 L24 28 L24 36 Z" />
        </g>

        {/* Center dot */}
        <circle cx="24" cy="24" r="3" fill={d} />
      </svg>
    );
  }
);
RepsIcon.displayName = "RepsIcon";

export { RepsIcon };
