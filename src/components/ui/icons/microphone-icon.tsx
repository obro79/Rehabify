"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const MicrophoneIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Mic body */}
        <rect x="16" y="6" width="16" height="24" rx="8" fill={g} filter={s} />
        <rect x="16" y="6" width="8" height="24" rx="8" fill={h} />

        {/* Grille */}
        {[12, 16, 20, 24].map(y => (
          <line key={y} x1="19" y1={y} x2="29" y2={y} stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        ))}

        {/* Stand */}
        <path d="M12 26 C12 35, 36 35, 36 26" stroke={d} strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="22" y="34" width="4" height="8" rx="2" fill={g} filter={s} />
        <rect x="22" y="34" width="2" height="8" rx="2" fill={h} />
        <rect x="17" y="42" width="14" height="4" rx="2" fill={g} filter={s} />
        <rect x="17" y="42" width="7" height="4" rx="2" fill={h} />
      </svg>
    );
  }
);
MicrophoneIcon.displayName = "MicrophoneIcon";

export { MicrophoneIcon };
