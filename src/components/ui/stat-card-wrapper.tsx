"use client";

import { ReactElement, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardWrapperProps {
  /** Animation delay for staggered entrance animations (e.g., "0.1s", "0.2s") */
  animationDelay?: string;
  /** Content to render inside the card */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A wrapper component for stat cards with optional entrance animation.
 * Provides consistent styling for centered stat displays.
 */
export function StatCardWrapper({
  animationDelay,
  children,
  className,
}: StatCardWrapperProps): ReactElement {
  return (
    <Card
      className={`surface-organic flex flex-col items-center justify-center p-6 ${
        animationDelay
          ? "animate-celebration-fade-in-up [animation-delay:var(--delay)]"
          : ""
      } ${className || ""}`}
      style={animationDelay ? ({ "--delay": animationDelay } as React.CSSProperties) : undefined}
    >
      <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
        {children}
      </CardContent>
    </Card>
  );
}
