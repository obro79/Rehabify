export const ASSESSMENT_STEPS = [
  { id: "interview", label: "Interview" },
  { id: "movement", label: "Movement" },
  { id: "summary", label: "Summary" },
] as const;

export const MOVEMENT_SLUGS = [
  "standing-lumbar-flexion",
  "standing-lumbar-extension",
  "standing-lumbar-side-bending",
] as const;

export const MOVEMENT_KEYWORDS = [
  "movement test",
  "stand facing",
  "stand where",
  "bend forward",
  "lean backward",
  "side bend",
  "3 quick tests",
  "three quick tests",
  "let's do 3",
  "let's do three",
] as const;

export const DEFAULT_ASSESSMENT_DATA = {
  chiefComplaint: {
    bodyPart: "lower back",
    symptomType: "stiffness and discomfort",
    duration: "a few weeks",
    onset: "gradual" as "gradual" | "sudden",
  },
  pain: {
    currentLevel: 4,
    worstLevel: 6,
    character: ["dull", "aching"] as string[],
    radiates: false,
    aggravators: ["prolonged sitting", "bending forward"] as string[],
    relievers: ["walking", "stretching"] as string[],
  },
  functional: {
    limitedActivities: ["sitting at desk", "lifting"] as string[],
    dailyImpact: "Mild interference with work and daily activities",
    goals: ["reduce stiffness", "improve mobility"] as string[],
  },
  history: {
    previousInjuries: false,
    imaging: null,
    currentTreatment: null,
    redFlags: [] as string[],
  },
  movementScreen: {
    flexion: { pain: 3, painLocation: "lower back" },
    extension: { pain: 2, comparison: "better" as "better" | "same" | "worse" },
    sideBend: { pain: 2, painSide: "neither" as "left" | "right" | "neither" | "both" },
  },
  movementResults: [],
};

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";
export type AssessmentPhase = "interview" | "movement" | "summary";
