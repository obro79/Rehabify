"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const ProfileIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Circular background */}
        <circle cx="24" cy="24" r="20" fill={g} filter={s} />
        <path
          d="M24 4 A20 20 0 0 0 6 18"
          stroke="white"
          strokeWidth="6"
          strokeOpacity="0.3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner circle */}
        <circle cx="24" cy="24" r="14" fill="white" fillOpacity="0.9" />

        {/* User silhouette */}
        <g fill={d}>
          {/* Head */}
          <circle cx="24" cy="19" r="5" />
          {/* Body */}
          <path d="M15 34 C15 27 19 24 24 24 C29 24 33 27 33 34 L15 34 Z" />
        </g>
      </svg>
    );
  }
);
ProfileIcon.displayName = "ProfileIcon";

export { ProfileIcon };
