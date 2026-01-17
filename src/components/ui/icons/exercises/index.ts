import { CatCamelIcon } from "./cat-camel-icon";
import { CobraIcon } from "./cobra-icon";
import { DeadBugIcon } from "./dead-bug-icon";
import type { BaseIconProps } from "../shared";

// Re-export individual icons
export { CatCamelIcon } from "./cat-camel-icon";
export { CobraIcon } from "./cobra-icon";
export { DeadBugIcon } from "./dead-bug-icon";

// Type for exercise icon components
export type ExerciseIconComponent = React.ForwardRefExoticComponent<
  BaseIconProps & React.RefAttributes<SVGSVGElement>
>;

// Map exercise slugs to their custom icons
export const exerciseIconMap: Record<string, ExerciseIconComponent> = {
  "cat-camel": CatCamelIcon,
  "cobra-stretch": CobraIcon,
  "dead-bug": DeadBugIcon,
};

// Helper to get exercise icon by slug
export function getExerciseIcon(slug: string): ExerciseIconComponent | null {
  return exerciseIconMap[slug] || null;
}

// Check if exercise has a custom icon
export function hasExerciseIcon(slug: string): boolean {
  return slug in exerciseIconMap;
}
