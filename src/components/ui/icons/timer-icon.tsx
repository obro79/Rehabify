"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const TimerIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Buttons */}
        <rect x="20" y="2" width="8" height="6" rx="2" fill={d} filter={s} />
        <rect x="38" y="14" width="6" height="4" rx="1" fill={d} filter={s} />

        {/* Body */}
        <circle cx="24" cy="26" r="18" fill={g} filter={s} />
        <path d="M24 8 A18 18 0 0 0 8 20" stroke="white" strokeWidth="6" strokeOpacity="0.3" strokeLinecap="round" fill="none" />

        {/* Face */}
        <circle cx="24" cy="26" r="14" fill="white" fillOpacity="0.9" />

        {/* Markers */}
        {[[24, 14], [36, 26], [24, 38], [12, 26]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.5" fill={d} />
        ))}

        {/* Hands */}
        <line x1="24" y1="26" x2="24" y2="17" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="26" x2="31" y2="26" stroke={colors.light} strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="26" r="2.5" fill={d} />
      </svg>
    );
  }
);
TimerIcon.displayName = "TimerIcon";

export { TimerIcon };
