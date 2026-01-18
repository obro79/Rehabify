import {
  MobilityIcon,
  StrengthIcon,
  StabilityIcon,
  StretchIcon,
} from "@/components/ui/icons";
import { getExerciseIcon } from "@/components/ui/icons/exercises";

// Available exercise images (by slug)
const EXERCISE_IMAGES = new Set([
  "90-90-stretch",
  "bicycle-crunch",
  "bird-dog",
  "cat-camel",
  "child-pose",
  "clamshell",
  "cobra-stretch",
  "dead-bug",
  "double-knee-to-chest",
  "figure-four-stretch",
  "fire-hydrant",
  "glute-bridge",
  "hamstring-stretch-supine",
  "knee-to-chest",
  "pelvic-tilt",
  "plank",
  "prone-hip-extension",
  "prone-press-up",
  "quadruped-hip-extension",
  "side-plank",
  "side-plank-elbow",
  "single-leg-bridge",
  "sphinx-pose",
  "standing-back-extension",
  "standing-hip-flexor-stretch",
  "supine-leg-lower",
  "supine-twist",
]);

// Fallback images for exercises without dedicated images
// Maps exercise slug -> visually similar image slug
const IMAGE_FALLBACKS: Record<string, string> = {
  // Side-lying exercises -> clamshell
  "side-lying-leg-lift": "clamshell",
  "quadratus-lumborum-stretch": "clamshell",
  "sidelying-external-rotation": "clamshell",
  "sleeper-stretch": "clamshell",
  "foam-roll-it-band": "clamshell",
  "lateral-band-walk": "clamshell",
  "monster-walk": "clamshell",

  // Supine core exercises
  "supine-marching": "dead-bug",
  "heel-slides": "supine-leg-lower",
  "abdominal-brace": "pelvic-tilt",
  "drawing-in-maneuver": "pelvic-tilt",
  "straight-leg-raise-supine": "supine-leg-lower",
  "short-arc-quads": "supine-leg-lower",
  "supine-flexion-wand": "dead-bug",
  "supine-external-rotation-wand": "dead-bug",
  "shoulder-flexion-supine": "dead-bug",
  "ankle-alphabet": "supine-leg-lower",
  "ankle-circles": "supine-leg-lower",
  "ankle-pumps": "supine-leg-lower",
  "supine-ankle-dorsiflexion": "supine-leg-lower",
  "resisted-dorsiflexion": "supine-leg-lower",
  "resisted-plantarflexion": "supine-leg-lower",
  "resisted-inversion": "supine-leg-lower",
  "resisted-eversion": "supine-leg-lower",

  // Plank variations
  "modified-plank": "plank",
  "scapular-push-up": "plank",
  "wall-push-up-plus": "plank",
  "push-up-shoulder": "plank",

  // Hip stretches -> figure-four-stretch or 90-90-stretch
  "piriformis-stretch": "figure-four-stretch",
  "seated-figure-four": "figure-four-stretch",
  "happy-baby": "figure-four-stretch",
  "90-90-external-rotation": "90-90-stretch",

  // Standing hip flexor stretches
  "hip-flexor-stretch": "standing-hip-flexor-stretch",
  "standing-quad-stretch": "standing-hip-flexor-stretch",
  "kneeling-quad-stretch": "standing-hip-flexor-stretch",
  "it-band-stretch-standing": "standing-hip-flexor-stretch",
  "calf-stretch-wall": "standing-hip-flexor-stretch",
  "gastroc-stretch-wall": "standing-hip-flexor-stretch",
  "soleus-stretch-wall": "standing-hip-flexor-stretch",
  "step-calf-stretch": "standing-hip-flexor-stretch",
  "achilles-tendon-stretch": "standing-hip-flexor-stretch",
  "half-kneeling-ankle-mob": "standing-hip-flexor-stretch",
  "banded-ankle-distraction": "standing-hip-flexor-stretch",
  "lunge-with-rotation": "standing-hip-flexor-stretch",
  "reverse-lunge": "standing-hip-flexor-stretch",
  "curtsy-lunge": "standing-hip-flexor-stretch",
  "walking-lunges-ankle": "standing-hip-flexor-stretch",
  "standing-hip-circles": "standing-hip-flexor-stretch",
  "hip-hike": "standing-hip-flexor-stretch",
  "single-leg-stance": "standing-hip-flexor-stretch",
  "single-leg-stance-ankle": "standing-hip-flexor-stretch",
  "single-leg-eyes-closed": "standing-hip-flexor-stretch",

  // Hamstring stretches
  "hamstring-stretch-doorway": "hamstring-stretch-supine",
  "seated-hamstring-stretch": "hamstring-stretch-supine",
  "seated-forward-fold": "hamstring-stretch-supine",
  "nerve-glide-sciatic": "hamstring-stretch-supine",
  "nerve-glide-femoral": "hamstring-stretch-supine",

  // Rotation/twist exercises
  "lumbar-rotation-stretch": "supine-twist",
  "open-book-stretch": "supine-twist",
  "thoracic-rotation-seated": "supine-twist",

  // Wall exercises -> standing-back-extension
  "wall-sit": "standing-back-extension",
  "wall-angels": "standing-back-extension",
  "wall-squat-hold": "standing-back-extension",
  "wall-slide-shoulder": "standing-back-extension",
  "wall-clock-exercise": "standing-back-extension",
  "step-up-forward": "standing-back-extension",
  "lateral-step-up": "standing-back-extension",
  "step-down-forward": "standing-back-extension",
  "step-up-lateral-ankle": "standing-back-extension",
  "mini-squats": "standing-back-extension",
  "goblet-squat": "standing-back-extension",
  "single-leg-squat": "standing-back-extension",
  "split-squat": "standing-back-extension",
  "bulgarian-split-squat": "standing-back-extension",
  "bosu-squat": "standing-back-extension",
  "box-squat": "standing-back-extension",
  "single-leg-squat-ankle": "standing-back-extension",
  "standing-hamstring-curl": "standing-back-extension",
  "romanian-deadlift": "standing-back-extension",
  "single-leg-rdl": "standing-back-extension",
  "balance-board-bilateral": "standing-back-extension",
  "single-leg-balance-unstable": "standing-back-extension",
  "clock-reach": "standing-back-extension",
  "wobble-board-bilateral": "standing-back-extension",
  "wobble-board-single-leg": "standing-back-extension",
  "foam-pad-balance": "standing-back-extension",
  "tandem-stance": "standing-back-extension",
  "tandem-walk": "standing-back-extension",
  "star-balance-test": "standing-back-extension",
  "reactive-balance-tap": "standing-back-extension",
  "perturbation-training": "standing-back-extension",
  "lateral-hop-stabilization": "standing-back-extension",
  "forward-hop-stabilization": "standing-back-extension",
  "lateral-hop-ankle": "standing-back-extension",
  "forward-hop-ankle": "standing-back-extension",
  "four-square-hop": "standing-back-extension",
  "jump-rope-simulation": "standing-back-extension",
  "towel-scrunches": "standing-back-extension",
  "marble-pickup": "standing-back-extension",
  "short-foot-exercise": "standing-back-extension",
  "toe-yoga": "standing-back-extension",
  "seated-calf-raise": "standing-back-extension",
  "standing-calf-raise": "standing-back-extension",
  "single-leg-calf-raise": "standing-back-extension",
  "eccentric-calf-raise": "standing-back-extension",
  "bent-knee-eccentric-calf": "standing-back-extension",
  "calf-raise-progression": "standing-back-extension",
  "ball-of-foot-raises": "standing-back-extension",
  "toe-raises": "standing-back-extension",
  "toe-walking": "standing-back-extension",
  "heel-walking": "standing-back-extension",
  "ankle-eversion-walk": "standing-back-extension",
  "ankle-inversion-walk": "standing-back-extension",
  "agility-ladder-ankle": "standing-back-extension",
  "standing-external-rotation-band": "standing-back-extension",
  "internal-rotation-band": "standing-back-extension",
  "scapular-squeeze": "standing-back-extension",
  "seated-row": "standing-back-extension",
  "face-pull": "standing-back-extension",
  "band-pull-apart": "standing-back-extension",
  "shoulder-shrugs": "standing-back-extension",
  "doorway-pec-stretch": "standing-back-extension",
  "overhead-triceps-stretch": "standing-back-extension",
  "towel-internal-rotation-stretch": "standing-back-extension",
  "doorway-pec-minor-stretch": "standing-back-extension",
  "pendulum-exercise": "standing-back-extension",
  "shoulder-circles": "standing-back-extension",
  "scaption": "standing-back-extension",
  "lateral-raise": "standing-back-extension",
  "front-raise": "standing-back-extension",
  "reverse-fly": "standing-back-extension",
  "full-can-exercise": "standing-back-extension",
  "overhead-press": "standing-back-extension",
  "arnold-press": "standing-back-extension",
  "upright-row": "standing-back-extension",
  "isometric-shoulder-flexion": "standing-back-extension",
  "isometric-shoulder-abduction": "standing-back-extension",
  "isometric-external-rotation": "standing-back-extension",
  "shoulder-er-wall-slide": "standing-back-extension",

  // Thoracic/back mobility
  "thoracic-extension-foam-roller": "cobra-stretch",
  "seated-cat-cow": "cat-camel",
  "chin-tuck": "cat-camel",
  "quadruped-thoracic-rotation": "cat-camel",
  "thread-the-needle": "cat-camel",

  // Prone exercises
  "prone-swimming": "prone-hip-extension",
  "prone-hamstring-curl": "prone-hip-extension",
  "prone-knee-flexion": "prone-hip-extension",
  "prone-knee-extension": "prone-hip-extension",
  "prone-quad-stretch": "prone-hip-extension",
  "foam-roll-quads": "prone-hip-extension",
  "hamstring-curl-machine": "prone-hip-extension",
  "prone-y-raise": "prone-press-up",
  "prone-w-raise": "prone-press-up",
  "prone-horizontal-abduction": "prone-press-up",
  "low-trap-raise": "prone-press-up",
  "i-y-t-w": "prone-press-up",
  "prone-extension-shoulder": "cobra-stretch",
  "snow-angel-prone": "cobra-stretch",

  // Glute bridge variations
  "quad-sets": "glute-bridge",
  "terminal-knee-extension": "glute-bridge",
  "slider-hamstring-curl": "glute-bridge",
  "nordic-hamstring-curl": "glute-bridge",
  "leg-press": "glute-bridge",
  "leg-extension-machine": "glute-bridge",

  // Knee mobility
  "heel-slide-knee": "knee-to-chest",
  "seated-knee-extension-stretch": "knee-to-chest",
  "stationary-bike-rom": "knee-to-chest",
  "patellar-mobilization": "knee-to-chest",

  // Child pose / kneeling
  "plantar-fascia-stretch": "child-pose",
  "frozen-bottle-roll": "child-pose",
  "cross-body-stretch": "child-pose",
  "lat-stretch-wall": "child-pose",
  "bear-hug-stretch": "child-pose",
  "table-slide-flexion": "child-pose",
};

/**
 * Get the image path for an exercise by slug
 * Uses dedicated image if available, otherwise falls back to visually similar image
 */
export function getExerciseImage(slug: string): string | null {
  if (EXERCISE_IMAGES.has(slug)) {
    return `/exercise-images/${slug}.jpg`;
  }
  // Use fallback image if available
  const fallback = IMAGE_FALLBACKS[slug];
  if (fallback) {
    return `/exercise-images/${fallback}.jpg`;
  }
  return null;
}

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
