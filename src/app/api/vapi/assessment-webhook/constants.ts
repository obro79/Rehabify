// Assessment Webhook Constants

/**
 * Default movement screen result when vision data is not yet available
 */
export const DEFAULT_MOVEMENT_SCREEN = {
  flexion: {
    romAngle: null,
    pain: null,
    note: "Awaiting vision data",
  },
  extension: {
    romAngle: null,
    pain: null,
    note: "Awaiting vision data",
  },
  sideBend: {
    leftAngle: null,
    rightAngle: null,
    pain: null,
    note: "Awaiting vision data",
  },
} as const;

/**
 * Default movement tests for movement screen
 */
export const MOVEMENT_TESTS = ["flexion", "extension", "sideBend"] as const;

/**
 * Fields that can be extracted from assessment body
 */
export const ASSESSMENT_FIELDS = [
  "chiefComplaint",
  "pain",
  "functional",
  "history",
  "flexionPain",
  "extensionPain",
  "sidebendPain",
] as const;
