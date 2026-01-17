"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
  CharacterProps,
  CHARACTER_SIZES,
  CharacterPose,
} from "@/types/character";
import { DEFAULT_POSE } from "@/lib/3d/poses";

// Dynamic import with SSR disabled (WebGL doesn't work server-side)
const CharacterCanvas = dynamic(
  () => import("./CharacterCanvas").then((mod) => mod.CharacterCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full bg-sage-100 animate-pulse" />
      </div>
    ),
  }
);

export function Character({
  pose = DEFAULT_POSE,
  size = "md",
  interactive = false,
  autoRotate = false,
  className,
}: CharacterProps) {
  const dimensions = CHARACTER_SIZES[size];

  return (
    <div
      className={cn("relative", className)}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <CharacterCanvas
        pose={pose}
        interactive={interactive}
        autoRotate={autoRotate}
      />
    </div>
  );
}

// Re-export pose type for convenience
export type { CharacterPose };
