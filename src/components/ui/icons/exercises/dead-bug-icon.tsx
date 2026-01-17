"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "../shared";

const DeadBugIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
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

        {/* Background circle */}
        <circle cx="24" cy="24" r="22" fill={g} filter={s} />
        <path
          d="M24 2 A22 22 0 0 0 4 18"
          stroke="white"
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
          fill="none"
        />

        {/* Figure in dead bug pose (supine with opposite arm/leg raised) */}
        <g fill="white" fillOpacity="0.95">
          {/* Head - on ground */}
          <circle cx="10" cy="28" r="4" />

          {/* Torso (lying on back) */}
          <path
            d="M14 28 L32 28"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />

          {/* Left arm - raised up */}
          <path
            d="M16 28 L12 14"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />

          {/* Right arm - down/bent */}
          <path
            d="M26 28 L28 34"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />

          {/* Left leg - bent at 90 degrees */}
          <path
            d="M30 28 L34 34"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />

          {/* Right leg - raised up */}
          <path
            d="M32 28 L38 16"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.95"
          />
        </g>

        {/* Ground line */}
        <line
          x1="6"
          y1="36"
          x2="42"
          y2="36"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
);
DeadBugIcon.displayName = "DeadBugIcon";

export { DeadBugIcon };
