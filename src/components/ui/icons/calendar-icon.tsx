"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

// Extended colors for calendar header
const HEADER_COLORS = {
  sage: { header: "#8B9F82", headerDark: "#6A7D63" },
  coral: { header: "#D8877B", headerDark: "#C4685B" },
} as const;

const CalendarIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const header = HEADER_COLORS[variant];
    const id = React.useId();
    const b = `url(#${id}-b)`;
    const hd = `url(#${id}-hd)`;
    const hl = `url(#${id}-hl)`;
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
          <linearGradient id={`${id}-b`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <linearGradient id={`${id}-hd`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={header.header} />
            <stop offset="100%" stopColor={header.headerDark} />
          </linearGradient>
          <linearGradient id={`${id}-hl`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Body */}
        <rect x="4" y="8" width="40" height="36" rx="8" fill={b} filter={s} />
        <rect x="4" y="8" width="40" height="18" rx="8" fill={hl} />

        {/* Header */}
        <rect x="4" y="8" width="40" height="12" rx="8" fill={hd} />
        <rect x="4" y="14" width="40" height="6" fill={hd} />

        {/* Rings */}
        {[14, 30].map(x => (
          <React.Fragment key={x}>
            <rect x={x} y="4" width="4" height="10" rx="2" fill={colors.accent} />
            <rect x={x} y="4" width="2" height="10" rx="1" fill={colors.darker} />
          </React.Fragment>
        ))}

        {/* Dots */}
        {[[14, 28], [24, 28], [34, 28], [14, 36], [24, 36], [34, 36]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill="white" fillOpacity="0.9" />
        ))}

        {/* Shadow */}
        <rect x="4" y="36" width="40" height="8" rx="0" fill="black" fillOpacity="0.08" clipPath="inset(0 0 0 0 round 0 0 8px 8px)" />
      </svg>
    );
  }
);
CalendarIcon.displayName = "CalendarIcon";

export { CalendarIcon };
