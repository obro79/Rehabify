"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const PoseIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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
        <circle cx="24" cy="8" r="6" fill={g} filter={s} />
        <circle cx="22" cy="6" r="3" fill={h} />

        {/* Torso */}
        <rect x="20" y="14" width="8" height="14" rx="4" fill={g} filter={s} />
        <rect x="20" y="14" width="4" height="14" rx="4" fill={h} />

        {/* Arms */}
        <rect x="6" y="10" width="14" height="5" rx="2.5" fill={g} filter={s} transform="rotate(-30 13 12.5)" />
        <rect x="6" y="10" width="7" height="5" rx="2.5" fill={h} transform="rotate(-30 13 12.5)" />
        <rect x="28" y="16" width="14" height="5" rx="2.5" fill={g} filter={s} transform="rotate(15 35 18.5)" />
        <rect x="28" y="16" width="7" height="5" rx="2.5" fill={h} transform="rotate(15 35 18.5)" />

        {/* Legs */}
        <rect x="17" y="27" width="6" height="16" rx="3" fill={g} filter={s} transform="rotate(-10 20 35)" />
        <rect x="17" y="27" width="3" height="16" rx="3" fill={h} transform="rotate(-10 20 35)" />
        <rect x="25" y="27" width="6" height="16" rx="3" fill={g} filter={s} transform="rotate(10 28 35)" />
        <rect x="25" y="27" width="3" height="16" rx="3" fill={h} transform="rotate(10 28 35)" />

        {/* Joints */}
        <circle cx="24" cy="28" r="2" fill={colors.accent} />
        <circle cx="12" cy="18" r="1.5" fill={colors.accent} />
        <circle cx="36" cy="22" r="1.5" fill={colors.accent} />
      </svg>
    );
  }
);
PoseIcon.displayName = "PoseIcon";

export { PoseIcon };
