"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

const SIZE_CONFIG = {
  sm: { icon: 24, text: "text-base", gap: "gap-1.5" },
  default: { icon: 32, text: "text-xl", gap: "gap-2" },
  lg: { icon: 48, text: "text-3xl", gap: "gap-3" },
} as const;

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "default", showText = true, ...props }, ref) => {
    const config = SIZE_CONFIG[size];

    return (
      <div
        ref={ref}
        className={cn("flex items-center", config.gap, className)}
        {...props}
      >
        {/* Logo Icon - Stylized "R" with healing wave */}
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 48 48"
          fill="none"
          className="shrink-0"
        >
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="url(#logo-gradient)"
          />
          {/* Inner highlight */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="url(#logo-highlight)"
          />
          {/* Letter R stylized */}
          <path
            d="M16 14h8c3.314 0 6 2.686 6 6s-2.686 6-6 6h-2l6 8"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M16 14v20"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Healing wave accent */}
          <path
            d="M32 24c2 0 3-1 4-2s2-2 4-2"
            stroke="var(--coral-400)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stopColor="var(--sage-light)" />
              <stop offset="100%" stopColor="var(--sage-600)" />
            </linearGradient>
            <radialGradient id="logo-highlight" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {showText && (
          <span className={cn("font-bold text-foreground", config.text)}>
            Rehabify
          </span>
        )}
      </div>
    );
  }
);
Logo.displayName = "Logo";

export { Logo };
