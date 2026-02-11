export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "mobility", label: "Mobility" },
  { value: "strengthening", label: "Strength" },
  { value: "core_stability", label: "Stability" },
  { value: "stretch", label: "Stretch" },
] as const;

export const BODY_PARTS = [
  { value: "all", label: "All Body Parts" },
  { value: "lower_back", label: "Back" },
  { value: "knee", label: "Knee" },
] as const;

export const DIFFICULTIES = [
  { value: "all", label: "All Difficulties" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export const ITEMS_PER_PAGE = 24;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export type BodyPartValue = (typeof BODY_PARTS)[number]["value"];
export type DifficultyValue = (typeof DIFFICULTIES)[number]["value"];
