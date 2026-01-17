"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { EyeIcon, MicrophoneIcon, ChartIcon } from "@/components/ui/icons";

export interface TutorialSlide {
  Icon: React.ComponentType<{ size?: "sm" | "md" | "lg"; variant?: "sage" | "coral"; className?: string }>;
  title: string;
  description: string;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    Icon: EyeIcon,
    title: "AI Vision Coaching",
    description: "Our computer vision technology analyzes your form in real-time, detecting 33 body landmarks to ensure you're performing exercises correctly and safely.",
  },
  {
    Icon: MicrophoneIcon,
    title: "Voice Guidance",
    description: "Get hands-free coaching with natural voice feedback. Our AI coach provides real-time corrections and encouragement throughout your workout.",
  },
  {
    Icon: ChartIcon,
    title: "Track Your Progress",
    description: "See your improvement over time with detailed analytics, form scores, and personalized insights to optimize your recovery journey.",
  },
];

export interface TutorialCarouselProps {
  onComplete?: () => void;
}

const TutorialCarousel = React.forwardRef<HTMLDivElement, TutorialCarouselProps>(
  ({ onComplete }, ref) => {
    const [currentSlide, setCurrentSlide] = React.useState(0);
    const slideTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const completeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Auto-advance slides
    React.useEffect(() => {
      slideTimerRef.current = setTimeout(() => {
        if (currentSlide < TUTORIAL_SLIDES.length - 1) {
          setCurrentSlide(currentSlide + 1);
        } else {
          // Auto-complete after last slide
          completeTimerRef.current = setTimeout(() => {
            onComplete?.();
          }, 3000);
        }
      }, 4000);

      return () => {
        if (slideTimerRef.current) {
          clearTimeout(slideTimerRef.current);
        }
        if (completeTimerRef.current) {
          clearTimeout(completeTimerRef.current);
        }
      };
    }, [currentSlide, onComplete]);

    const handleDotClick = (index: number) => {
      setCurrentSlide(index);
    };

    return (
      <Card ref={ref} className="surface-organic border-2 border-sage-200/60">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Slides */}
            <div className="min-h-[280px] flex items-center justify-center">
              <div
                className="w-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-5 motion-safe:duration-500"
                key={currentSlide}
              >
                {TUTORIAL_SLIDES.map((slide, index) => {
                  const SlideIcon = slide.Icon;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center text-center space-y-6",
                        index !== currentSlide && "hidden"
                      )}
                    >
                      {/* Icon */}
                      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-sage-100/50 to-sage-200/50">
                        <SlideIcon size="lg" variant="sage" />
                      </div>

                      {/* Content */}
                      <div className="space-y-3 max-w-lg">
                        <h3 className="text-2xl font-semibold text-foreground">
                          {slide.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col items-center gap-4">
              {/* Continue Button */}
              <button
                onClick={() => {
                  if (currentSlide < TUTORIAL_SLIDES.length - 1) {
                    setCurrentSlide(currentSlide + 1);
                  } else {
                    onComplete?.();
                  }
                }}
                className="px-6 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2"
              >
                {currentSlide < TUTORIAL_SLIDES.length - 1 ? "Next" : "Get Started"}
              </button>

              {/* Navigation Dots */}
              <div
                className="flex items-center justify-center gap-2"
                role="tablist"
                aria-label="Tutorial slides"
              >
                {TUTORIAL_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    role="tab"
                    aria-selected={index === currentSlide}
                    aria-label={`Slide ${index + 1} of ${TUTORIAL_SLIDES.length}`}
                    onClick={() => handleDotClick(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
                      index === currentSlide
                        ? "bg-sage-600 w-8"
                        : "bg-sage-200 hover:bg-sage-300"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Progress indicator for screen readers */}
            <div className="sr-only" role="status" aria-live="polite">
              Slide {currentSlide + 1} of {TUTORIAL_SLIDES.length}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TutorialCarousel.displayName = "TutorialCarousel";

export { TutorialCarousel };
