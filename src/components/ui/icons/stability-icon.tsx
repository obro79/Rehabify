"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const StabilityIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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
          <linearGradient id={`${id}-h`} x1="0%" y1="0%" x2="100%" y2="100%">
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

        {/* Head */}
        <circle cx="10" cy="18" r="5" fill={g} filter={s} />
        <circle cx="8" cy="16" r="2.5" fill={h} />

        {/* Torso */}
        <rect x="14" y="16" width="20" height="6" rx="3" fill={g} filter={s} />
        <rect x="14" y="16" width="10" height="6" rx="3" fill={h} />

        {/* Arms */}
        <rect x="8" y="22" width="5" height="14" rx="2.5" fill={g} filter={s} />
        <rect x="8" y="22" width="2.5" height="14" rx="2.5" fill={h} />

        {/* Legs */}
        <rect x="32" y="18" width="12" height="5" rx="2.5" fill={g} filter={s} />
        <rect x="32" y="18" width="6" height="5" rx="2.5" fill={h} />
        <rect x="40" y="22" width="5" height="10" rx="2.5" fill={g} filter={s} />
        <rect x="40" y="22" width="2.5" height="10" rx="2.5" fill={h} />

        {/* Ground */}
        <rect x="4" y="36" width="40" height="4" rx="2" fill={d} filter={s} />

        {/* Core indicator */}
        <circle cx="24" cy="19" r="3" fill="white" fillOpacity="0.7" />
        <circle cx="24" cy="19" r="1.5" fill={colors.accent} />

        {/* Balance marks */}
        {[10, 24, 38].map(x => (
          <line key={x} x1={x} y1="42" x2={x} y2="44" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
    );
  }
);
StabilityIcon.displayName = "StabilityIcon";

export { StabilityIcon };
