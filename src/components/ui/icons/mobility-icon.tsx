"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const MobilityIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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
        <circle cx="14" cy="10" r="5" fill={g} filter={s} />
        <circle cx="12" cy="8" r="2.5" fill={h} />

        {/* Body curve */}
        <path d="M14 15 Q 20 20, 24 28 Q 28 36, 36 40" stroke={g} strokeWidth="6" strokeLinecap="round" fill="none" filter={s} />

        {/* Motion lines */}
        {[
          { d: "M8 22 Q 12 20, 16 22", w: 3, o: 0.6 },
          { d: "M6 28 Q 10 26, 14 28", w: 2.5, o: 0.4 },
          { d: "M4 34 Q 8 32, 12 34", w: 2, o: 0.3 },
        ].map((line, i) => (
          <path key={i} d={line.d} stroke={g} strokeWidth={line.w} strokeLinecap="round" fill="none" strokeOpacity={line.o} />
        ))}

        {/* Arm */}
        <path d="M18 20 Q 26 14, 32 8" stroke={g} strokeWidth="5" strokeLinecap="round" fill="none" filter={s} />
        <circle cx="33" cy="7" r="3" fill={g} filter={s} />

        {/* Foot */}
        <ellipse cx="38" cy="42" rx="4" ry="2.5" fill={g} filter={s} />
      </svg>
    );
  }
);
MobilityIcon.displayName = "MobilityIcon";

export { MobilityIcon };
