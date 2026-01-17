// 3D Character Mascot Types

export type CharacterPose =
  | "idle"
  | "presenting"
  | "thumbsUp"
  | "thinking"
  | "pointing"
  | "celebrating";

export type CharacterSize = "sm" | "md" | "lg";

export interface CharacterProps {
  /** Which pose to display */
  pose?: CharacterPose;
  /** Size of the character */
  size?: CharacterSize;
  /** Enable orbit controls for interaction */
  interactive?: boolean;
  /** Enable slow auto-rotation */
  autoRotate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface CharacterModelProps {
  pose: CharacterPose;
}

// Size configurations for the character container
export const CHARACTER_SIZES: Record<CharacterSize, { width: number; height: number }> = {
  sm: { width: 120, height: 160 },
  md: { width: 200, height: 280 },
  lg: { width: 320, height: 420 },
};
