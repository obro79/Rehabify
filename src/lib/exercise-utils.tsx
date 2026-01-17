import {
  MobilityIcon,
  StrengthIcon,
  StabilityIcon,
  StretchIcon,
} from "@/components/ui/icons";
import { getExerciseIcon } from "@/components/ui/icons/exercises";

/**
 * Get the icon component for a category
 */
export function getCategoryIcon(category: string, size: "sm" | "md" = "sm") {
  const props = { size, variant: "sage" as const };
  switch (category) {
    case "Mobility":
    case "mobility":
      return <MobilityIcon {...props} />;
    case "Strength":
    case "strengthening":
    case "extension":
      return <StrengthIcon {...props} />;
    case "Stability":
    case "core_stability":
      return <StabilityIcon {...props} />;
    case "stretch":
    case "neural_mobilization":
      return <StretchIcon {...props} />;
    default:
      return <MobilityIcon {...props} />;
  }
}

/**
 * Get exercise-specific icon if available, fallback to category icon
 */
export function getExerciseIconOrCategory(
  exerciseId: string,
  category: string,
  size: "sm" | "md" = "sm"
) {
  const ExerciseIcon = getExerciseIcon(exerciseId);
  if (ExerciseIcon) {
    return <ExerciseIcon size={size} variant="sage" />;
  }
  return getCategoryIcon(category, size);
}

/**
 * Get the badge variant for a category
 */
export function getCategoryBadgeVariant(category: string) {
  switch (category) {
    case "Mobility":
    case "mobility":
      return "info" as const;
    case "Strength":
    case "strengthening":
    case "extension":
      return "coral" as const;
    case "Stability":
    case "core_stability":
      return "success" as const;
    case "stretch":
    case "neural_mobilization":
      return "warning" as const;
    default:
      return "muted" as const;
  }
}

/**
 * Get category label (display name)
 */
export function getCategoryLabel(category: string): string {
  switch (category) {
    case "mobility":
      return "Mobility";
    case "strengthening":
      return "Strength";
    case "core_stability":
      return "Stability";
    case "stretch":
      return "Stretch";
    case "extension":
      return "Extension";
    case "neural_mobilization":
      return "Neural";
    default:
      return category;
  }
}

/**
 * Get the badge variant for a score
 */
export function getScoreBadgeVariant(score: number) {
  if (score >= 85) return "success" as const;
  if (score >= 70) return "warning" as const;
  return "error" as const;
}
