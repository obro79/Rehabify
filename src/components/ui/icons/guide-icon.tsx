"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  BASE_SVG_ATTRS,
} from "./shared";

// Amber colors for the guide icon
const AMBER_COLORS = {
  light: "#FCD34D",
  dark: "#F59E0B",
  accent: "#D97706",
  darker: "#B45309",
};

const GuideIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", className, ...props }, ref) => {
    const colors = AMBER_COLORS;
    const id = React.useId();
    const g = `url(#${id}-g)`;
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
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Lightbulb base/circle */}
        <circle cx="24" cy="22" r="18" fill={g} filter={s} />
        <path
          d="M24 4 A18 18 0 0 0 8 16"
          stroke="white"
          strokeWidth="5"
          strokeOpacity="0.3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner glow */}
        <circle cx="24" cy="22" r="12" fill="white" fillOpacity="0.9" />

        {/* Lightbulb filament / idea symbol */}
        <path
          d="M24 14 L24 22 M20 18 L28 18"
          stroke={colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Bulb base */}
        <rect x="18" y="36" width="12" height="4" rx="1" fill={colors.darker} />
        <rect x="20" y="40" width="8" height="3" rx="1" fill={colors.accent} />

        {/* Connection to base */}
        <path
          d="M18 34 Q18 38 20 38 L28 38 Q30 38 30 34"
          fill={colors.dark}
        />

        {/* Sparkle */}
        <circle cx="32" cy="10" r="2" fill={colors.light} />
        <circle cx="36" cy="14" r="1.5" fill={colors.light} fillOpacity="0.7" />
      </svg>
    );
  }
);
GuideIcon.displayName = "GuideIcon";

export { GuideIcon };
