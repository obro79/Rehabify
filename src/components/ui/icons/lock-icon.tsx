"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const LockIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const h = `url(#${id}-h)`;
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
          <linearGradient id={`${id}-h`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-d`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.darker} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Shackle (U-shaped top) */}
        <path
          d="M16 20 L16 14 C16 8, 32 8, 32 14 L32 20"
          stroke={d}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          filter={s}
        />
        {/* Shackle highlight */}
        <path
          d="M16 20 L16 14 C16 8, 32 8, 32 14 L32 20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.3"
          fill="none"
          style={{ transform: "translateX(-1px)" }}
        />

        {/* Lock body */}
        <rect x="10" y="20" width="28" height="22" rx="4" fill={g} filter={s} />
        <rect x="10" y="20" width="14" height="22" rx="4" fill={h} />

        {/* Keyhole - outer circle */}
        <circle cx="24" cy="29" r="4" fill={d} />

        {/* Keyhole - inner shape */}
        <circle cx="24" cy="28" r="2.5" fill={colors.accent} />
        <rect x="22.5" y="29" width="3" height="6" rx="1" fill={colors.accent} />

        {/* Keyhole highlight */}
        <circle cx="23" cy="27" r="1" fill="white" fillOpacity="0.4" />
      </svg>
    );
  }
);
LockIcon.displayName = "LockIcon";

export { LockIcon };
