"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const TrophyIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Cup */}
        <path d="M14 6 L34 6 L32 24 C32 28 28 30 24 30 C20 30 16 28 16 24 L14 6 Z" fill={g} filter={s} />
        <path d="M14 6 L24 6 L23 24 C23 28 21 30 24 30 C20 30 16 28 16 24 L14 6 Z" fill={h} />

        {/* Handles */}
        <path d="M14 10 C8 10, 6 16, 10 20 C12 22, 14 20, 16 18" stroke={d} strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M34 10 C40 10, 42 16, 38 20 C36 22, 34 20, 32 18" stroke={d} strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Stem & Base */}
        <rect x="21" y="30" width="6" height="6" rx="1" fill={g} filter={s} />
        <rect x="21" y="30" width="3" height="6" rx="1" fill={h} />
        <rect x="15" y="36" width="18" height="4" rx="2" fill={g} filter={s} />
        <rect x="15" y="36" width="9" height="4" rx="2" fill={h} />
        <rect x="13" y="40" width="22" height="4" rx="2" fill={d} filter={s} />

        {/* Star */}
        <path d="M24 12 L25.5 16 L30 16 L26.5 19 L28 23 L24 20 L20 23 L21.5 19 L18 16 L22.5 16 Z" fill="white" fillOpacity="0.8" />
      </svg>
    );
  }
);
TrophyIcon.displayName = "TrophyIcon";

export { TrophyIcon };
