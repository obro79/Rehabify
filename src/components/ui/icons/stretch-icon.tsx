"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const StretchIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const h = `url(#${id}-h)`;
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
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Head */}
        <circle cx="34" cy="18" r="5" fill={g} filter={s} />
        <circle cx="32" cy="16" r="2.5" fill={h} />

        {/* Torso */}
        <path d="M18 32 Q 24 24, 32 20" stroke={g} strokeWidth="6" strokeLinecap="round" fill="none" filter={s} />

        {/* Arms */}
        <path d="M34 22 Q 30 28, 12 36" stroke={g} strokeWidth="5" strokeLinecap="round" fill="none" filter={s} />
        <circle cx="11" cy="37" r="3" fill={g} filter={s} />

        {/* Leg */}
        <rect x="6" y="34" width="16" height="5" rx="2.5" fill={g} filter={s} />
        <rect x="6" y="34" width="8" height="5" rx="2.5" fill={h} />
        <ellipse cx="7" cy="38" rx="3" ry="4" fill={g} filter={s} />

        {/* Bent knee */}
        <path d="M18 32 Q 14 38, 18 42" stroke={g} strokeWidth="5" strokeLinecap="round" fill="none" filter={s} />

        {/* Stretch lines */}
        {[
          { d: "M38 14 L 42 10", o: 0.5 },
          { d: "M40 18 L 44 16", o: 0.4 },
          { d: "M38 22 L 42 22", o: 0.3 },
        ].map((line, i) => (
          <path key={i} d={line.d} stroke={g} strokeWidth="2" strokeLinecap="round" strokeOpacity={line.o} />
        ))}
      </svg>
    );
  }
);
StretchIcon.displayName = "StretchIcon";

export { StretchIcon };
