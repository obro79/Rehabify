"use client";

import { cn } from "@/lib/utils";
import { OrganicBlob } from "./organic-blob";
import { GradientMesh } from "./gradient-mesh";
import { useSanctuaryAnimations } from "@/hooks/use-sanctuary-animations";

interface SanctuaryBackgroundProps {
  /**
   * Background variant configuration
   */
  variant?: "default" | "minimal" | "celebration";
  /**
   * Manually control pause state (overrides auto-pause)
   */
  paused?: boolean;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Children content to render on top of background
   */
  children?: React.ReactNode;
}

/**
 * SanctuaryBackground Component
 *
 * Combines OrganicBlob and GradientMesh components into a complete
 * page-level decorative background system. Automatically pauses
 * animations during workout sessions via useSanctuaryAnimations hook.
 *
 * Variants:
 * - default: Multiple blobs in corners with gradient mesh (homepage, dashboard)
 * - minimal: Very subtle decoration (workout session)
 * - celebration: More vivid colors and movement (workout complete)
 *
 * @example
 * ```tsx
 * <SanctuaryBackground variant="default">
 *   <PageContent />
 * </SanctuaryBackground>
 * ```
 */
export function SanctuaryBackground({
  variant = "default",
  paused: manualPaused,
  className,
  children,
}: SanctuaryBackgroundProps) {
  const { isPaused: autoPaused } = useSanctuaryAnimations();

  // Use manual pause state if provided, otherwise use auto-pause from hook
  const isPaused = manualPaused !== undefined ? manualPaused : autoPaused;

  // Render nothing for minimal variant during active sessions
  if (variant === "minimal") {
    return (
      <div className={cn("relative", className)}>
        {/* Very subtle background for workout session */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sand-100 to-background" />
        {children}
      </div>
    );
  }

  // Default variant: Multiple blobs in corners with gradient mesh
  if (variant === "default") {
    return (
      <div className={cn("sanctuary-bg relative", isPaused && "sanctuary-paused", className)}>
        {/* Gradient mesh background */}
        <GradientMesh variant="mixed" intensity={0.4} position="top-left" />
        <GradientMesh variant="sage" intensity={0.3} position="bottom-right" />

        {/* Corner organic blobs */}
        <OrganicBlob
          size={350}
          color="sage"
          position={{ top: "-10%", left: "-10%" }}
          variant={0}
          animate={!isPaused}
        />
        <OrganicBlob
          size={280}
          color="terracotta"
          position={{ top: "5%", right: "-5%" }}
          variant={1}
          animate={!isPaused}
        />
        <OrganicBlob
          size={320}
          color="sage"
          position={{ bottom: "-8%", left: "10%" }}
          variant={2}
          animate={!isPaused}
        />
        <OrganicBlob
          size={300}
          color="mixed"
          position={{ bottom: "5%", right: "-8%" }}
          variant={3}
          animate={!isPaused}
        />

        {children}
      </div>
    );
  }

  // Celebration variant: More vivid colors and additional blobs
  if (variant === "celebration") {
    return (
      <div className={cn("sanctuary-bg relative", isPaused && "sanctuary-paused", className)}>
        {/* Enhanced gradient meshes for celebration */}
        <GradientMesh variant="mixed" intensity={0.6} position="top-left" />
        <GradientMesh variant="terracotta" intensity={0.5} position="top-right" />
        <GradientMesh variant="sage" intensity={0.5} position="bottom-left" />
        <GradientMesh variant="mixed" intensity={0.6} position="bottom-right" />

        {/* Multiple organic blobs with more vivid colors */}
        <OrganicBlob
          size={400}
          color="sage"
          position={{ top: "-15%", left: "-12%" }}
          variant={0}
          animate={!isPaused}
        />
        <OrganicBlob
          size={350}
          color="terracotta"
          position={{ top: "-10%", right: "-10%" }}
          variant={1}
          animate={!isPaused}
        />
        <OrganicBlob
          size={380}
          color="mixed"
          position={{ bottom: "-12%", left: "-8%" }}
          variant={2}
          animate={!isPaused}
        />
        <OrganicBlob
          size={360}
          color="terracotta"
          position={{ bottom: "-10%", right: "-12%" }}
          variant={3}
          animate={!isPaused}
        />

        {/* Additional center blobs for extra depth */}
        <OrganicBlob
          size={250}
          color="sage"
          position={{ top: "30%", left: "20%" }}
          variant={1}
          animate={!isPaused}
        />
        <OrganicBlob
          size={220}
          color="terracotta"
          position={{ top: "40%", right: "15%" }}
          variant={3}
          animate={!isPaused}
        />

        {children}
      </div>
    );
  }

  // Fallback: render children with no decoration
  return <div className={cn("relative", className)}>{children}</div>;
}
