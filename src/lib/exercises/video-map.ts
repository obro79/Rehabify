/**
 * Exercise Video Mapping
 *
 * Maps exercise slugs to demo video URLs.
 * Videos are stored in /public/videos/
 */

// Video file to exercise slug mapping
// Multiple exercises can share the same video
const VIDEO_MAPPINGS: Record<string, string[]> = {
  // Squat video
  '/videos/squat.mp4': [
    'bodyweight-squat',
    'mini-squats',
    'goblet-squat',
    'wall-squat-hold',
    'single-leg-squat',
    'box-squat',
    'bosu-squat',
  ],

  // Back extension video (includes assessment movement)
  '/videos/back-extension.mp4': [
    'cobra-stretch',
    'prone-press-up',
    'sphinx-pose',
    'standing-back-extension',
    'standing-lumbar-extension',
    'prone-extension-shoulder',
    'superman',
    'prone-swimming',
  ],

  // Lunge video
  '/videos/lunge.mp4': [
    'lunge',
    'split-squat',
    'reverse-lunge',
    'walking-lunges-ankle',
    'lunge-with-rotation',
    'bulgarian-split-squat',
    'curtsy-lunge',
  ],

  // Forward bending video (includes assessment movement)
  '/videos/bending.mp4': [
    'standing-lumbar-flexion',
    'seated-forward-fold',
    'knee-to-chest',
    'double-knee-to-chest',
    'child-pose',
    'hamstring-stretch-supine',
    'hamstring-stretch-doorway',
  ],

  // Side bend video
  '/videos/side-bend.mp4': [
    'standing-lumbar-side-bending',
    'quadratus-lumborum-stretch',
    'side-plank',
    'side-lying-leg-lift',
  ],
};

// Build reverse lookup: slug -> video URL
const slugToVideo = new Map<string, string>();

for (const [videoUrl, slugs] of Object.entries(VIDEO_MAPPINGS)) {
  for (const slug of slugs) {
    slugToVideo.set(slug, videoUrl);
  }
}

/**
 * Get the demo video URL for an exercise
 * @param slug - Exercise slug
 * @returns Video URL or null if no video available
 */
export function getExerciseVideoUrl(slug: string): string | null {
  return slugToVideo.get(slug) || null;
}

/**
 * Check if an exercise has a demo video
 */
export function hasExerciseVideo(slug: string): boolean {
  return slugToVideo.has(slug);
}
