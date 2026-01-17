// Pose to model path mapping
import { CharacterPose } from "@/types/character";

// Map poses to their model file paths
export const POSE_MODELS: Record<CharacterPose, string> = {
  idle: "/models/mascot-idle.glb",
  presenting: "/models/mascot-presenting.glb",
  thumbsUp: "/models/mascot-thumbsup.glb",
  thinking: "/models/mascot-thinking.glb",
  pointing: "/models/mascot-pointing.glb",
  celebrating: "/models/mascot-celebrating.glb",
};

// All model paths for preloading
export const ALL_POSE_PATHS = Object.values(POSE_MODELS);

// Default pose when none specified
export const DEFAULT_POSE: CharacterPose = "idle";
