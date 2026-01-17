"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const SpineIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();

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
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Vertebrae */}
        {[
          { x: 18, y: 4, w: 12, h: 6, hw: 6 },
          { x: 17, y: 11, w: 14, h: 6, hw: 7 },
          { x: 16, y: 18, w: 16, h: 7, hw: 8 },
          { x: 17, y: 26, w: 14, h: 6, hw: 7 },
          { x: 18, y: 33, w: 12, h: 6, hw: 6 },
          { x: 19, y: 40, w: 10, h: 5, hw: 5 },
        ].map((v, i) => (
          <React.Fragment key={i}>
            <rect x={v.x} y={v.y} width={v.w} height={v.h} rx="3" fill={`url(#${id}-g)`} filter={`url(#${id}-s)`} />
            <rect x={v.x} y={v.y} width={v.hw} height={v.h} rx="3" fill={`url(#${id}-h)`} />
          </React.Fragment>
        ))}

        {/* Discs */}
        {[10, 17, 25, 32, 39].map((cy, i) => (
          <ellipse key={i} cx="24" cy={cy} rx={i === 1 || i === 2 ? 4.5 : i === 4 ? 3.5 : 4} ry="1" fill={colors.accent} fillOpacity="0.5" />
        ))}
      </svg>
    );
  }
);
SpineIcon.displayName = "SpineIcon";

export { SpineIcon };
