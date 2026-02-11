export type Verbosity = "minimal" | "normal" | "detailed";
export type SpeechSpeed = "slow" | "normal" | "fast";

export interface ProfileFormState {
  displayName: string;
  email: string;
  verbosity: Verbosity;
  speechSpeed: SpeechSpeed;
  muteCoach: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  largerText: boolean;
}

export interface DialogState {
  clearHistory: boolean;
  deleteAccount: boolean;
}

export const VERBOSITY_OPTIONS: { value: Verbosity; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "normal", label: "Normal" },
  { value: "detailed", label: "Detailed" },
];

export const SPEECH_SPEED_OPTIONS: { value: SpeechSpeed; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];
