import type { Exercise } from "@/lib/exercises/types";
import exerciseData from "@/lib/exercises/data.json";

export interface Testimonial {
  quote: string;
  author: string;
  condition: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "Finally, I can do my physio exercises with confidence that my form is correct. It's like having a physiotherapist in my living room.",
    author: "Sarah M.",
    condition: "Recovering from disc herniation",
  },
  {
    quote:
      "The AI coach catches mistakes I didn't even know I was making. My back pain has improved dramatically in just two weeks.",
    author: "Marcus T.",
    condition: "Chronic lower back pain",
  },
  {
    quote:
      "As someone who was nervous about exercising wrong and making things worse, this gives me the confidence to stay consistent with my rehab.",
    author: "Linda K.",
    condition: "Post-surgery rehabilitation",
  },
];

export const carouselTexts = [
  "Physical Therapy Coach",
  "Companion",
  "Cheerleader",
  "Greatest Supporter",
];

export const previewExercises = exerciseData.exercises.slice(0, 4) as Exercise[];

export const totalExerciseCount = exerciseData.exercises.length;

export function getCategoryBadgeVariant(
  category: string
): "info" | "coral" | "success" | "muted" {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory === "mobility") return "info";
  if (lowerCategory === "extension" || lowerCategory === "strength") return "coral";
  if (lowerCategory === "stability") return "success";
  return "muted";
}
