"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

// Extended colors for eye
const IRIS_COLORS = {
  sage: { iris: "#4A5A44", irisDark: "#3A4A34" },
  coral: { iris: "#9A4A3E", irisDark: "#7A3A2E" },
} as const;

const EyeIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const iris = IRIS_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const h = `url(#${id}-h)`;
    const d = `url(#${id}-d)`;
    const i = `url(#${id}-i)`;
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
          <linearGradient id={`${id}-h`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-d`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.darker} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <linearGradient id={`${id}-i`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={iris.iris} />
            <stop offset="50%" stopColor={iris.irisDark} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Eye shape - almond form */}
        <path
          d="M6 24 Q24 6, 42 24 Q24 42, 6 24 Z"
          fill={g}
          filter={s}
        />
        <path
          d="M6 24 Q24 6, 24 24 Q24 42, 6 24 Z"
          fill={h}
        />

        {/* Outer iris ring */}
        <circle cx="24" cy="24" r="10" fill={d} filter={s} />

        {/* Iris */}
        <circle cx="24" cy="24" r="8" fill={i} />

        {/* Pupil */}
        <circle cx="24" cy="24" r="4" fill={iris.irisDark} />

        {/* Eye highlight */}
        <circle cx="21" cy="21" r="2" fill="white" fillOpacity="0.7" />
        <circle cx="26" cy="26" r="1" fill="white" fillOpacity="0.3" />

        {/* Vision lines - representing AI analysis */}
        <path
          d="M10 24 L6 24 M14 16 L11 13 M14 32 L11 35"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <path
          d="M38 24 L42 24 M34 16 L37 13 M34 32 L37 35"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
      </svg>
    );
  }
);
EyeIcon.displayName = "EyeIcon";

export { EyeIcon };
