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
  "standing-lumbar-extension",
  "standing-hip-flexor-stretch",
  "standing-lumbar-flexion",
  "standing-lumbar-side-bending",
  "supine-leg-lower",
  "supine-twist",
  "bodyweight-squat"
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
  "lunge": "standing-hip-flexor-stretch",
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

  // Wall exercises -> standing-lumbar-extension
  "wall-sit": "standing-lumbar-extension",
  "wall-angels": "standing-lumbar-extension",
  "wall-squat-hold": "standing-lumbar-extension",
  "wall-slide-shoulder": "standing-lumbar-extension",
  "wall-clock-exercise": "standing-lumbar-extension",
  "step-up-forward": "standing-lumbar-extension",
  "lateral-step-up": "standing-lumbar-extension",
  "step-down-forward": "standing-lumbar-extension",
  "step-up-lateral-ankle": "standing-lumbar-extension",
  "mini-squats": "standing-lumbar-extension",
  "goblet-squat": "standing-lumbar-extension",
  "single-leg-squat": "standing-lumbar-extension",
  "split-squat": "standing-lumbar-extension",
  "bulgarian-split-squat": "standing-lumbar-extension",
  "bosu-squat": "standing-lumbar-extension",
  "box-squat": "standing-lumbar-extension",
  "single-leg-squat-ankle": "standing-lumbar-extension",
  "standing-hamstring-curl": "standing-lumbar-extension",
  "romanian-deadlift": "standing-lumbar-extension",
  "single-leg-rdl": "standing-lumbar-extension",
  "balance-board-bilateral": "standing-lumbar-extension",
  "single-leg-balance-unstable": "standing-lumbar-extension",
  "clock-reach": "standing-lumbar-extension",
  "wobble-board-bilateral": "standing-lumbar-extension",
  "wobble-board-single-leg": "standing-lumbar-extension",
  "foam-pad-balance": "standing-lumbar-extension",
  "tandem-stance": "standing-lumbar-extension",
  "tandem-walk": "standing-lumbar-extension",
  "star-balance-test": "standing-lumbar-extension",
  "reactive-balance-tap": "standing-lumbar-extension",
  "perturbation-training": "standing-lumbar-extension",
  "lateral-hop-stabilization": "standing-lumbar-extension",
  "forward-hop-stabilization": "standing-lumbar-extension",
  "lateral-hop-ankle": "standing-lumbar-extension",
  "forward-hop-ankle": "standing-lumbar-extension",
  "four-square-hop": "standing-lumbar-extension",
  "jump-rope-simulation": "standing-lumbar-extension",
  "towel-scrunches": "standing-lumbar-extension",
  "marble-pickup": "standing-lumbar-extension",
  "short-foot-exercise": "standing-lumbar-extension",
  "toe-yoga": "standing-lumbar-extension",
  "seated-calf-raise": "standing-lumbar-extension",
  "standing-calf-raise": "standing-lumbar-extension",
  "single-leg-calf-raise": "standing-lumbar-extension",
  "eccentric-calf-raise": "standing-lumbar-extension",
  "bent-knee-eccentric-calf": "standing-lumbar-extension",
  "calf-raise-progression": "standing-lumbar-extension",
  "ball-of-foot-raises": "standing-lumbar-extension",
  "toe-raises": "standing-lumbar-extension",
  "toe-walking": "standing-lumbar-extension",
  "heel-walking": "standing-lumbar-extension",
  "ankle-eversion-walk": "standing-lumbar-extension",
  "ankle-inversion-walk": "standing-lumbar-extension",
  "agility-ladder-ankle": "standing-lumbar-extension",
  "standing-external-rotation-band": "standing-lumbar-extension",
  "internal-rotation-band": "standing-lumbar-extension",
  "scapular-squeeze": "standing-lumbar-extension",
  "seated-row": "standing-lumbar-extension",
  "face-pull": "standing-lumbar-extension",
  "band-pull-apart": "standing-lumbar-extension",
  "shoulder-shrugs": "standing-lumbar-extension",
  "doorway-pec-stretch": "standing-lumbar-extension",
  "overhead-triceps-stretch": "standing-lumbar-extension",
  "towel-internal-rotation-stretch": "standing-lumbar-extension",
  "doorway-pec-minor-stretch": "standing-lumbar-extension",
  "pendulum-exercise": "standing-lumbar-extension",
  "shoulder-circles": "standing-lumbar-extension",
  "scaption": "standing-lumbar-extension",
  "lateral-raise": "standing-lumbar-extension",
  "front-raise": "standing-lumbar-extension",
  "reverse-fly": "standing-lumbar-extension",
  "full-can-exercise": "standing-lumbar-extension",
  "overhead-press": "standing-lumbar-extension",
  "arnold-press": "standing-lumbar-extension",
  "upright-row": "standing-lumbar-extension",
  "isometric-shoulder-flexion": "standing-lumbar-extension",
  "isometric-shoulder-abduction": "standing-lumbar-extension",
  "isometric-external-rotation": "standing-lumbar-extension",
  "shoulder-er-wall-slide": "standing-lumbar-extension",

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
