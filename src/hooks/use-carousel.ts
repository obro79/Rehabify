import * as React from "react";

export interface UseCarouselOptions {
  /** Total number of items in the carousel */
  itemsLength: number;
  /** Interval in milliseconds between auto-rotations */
  intervalMs?: number;
  /** Whether the carousel should auto-rotate */
  autoPlay?: boolean;
  /** Duration of transition animation in ms (for text carousels with transitions) */
  transitionDuration?: number;
}

export interface UseCarouselReturn {
  /** Current active index */
  currentIndex: number;
  /** Whether the carousel is transitioning (for animated text carousels) */
  isTransitioning: boolean;
  /** Manually go to a specific index */
  goTo: (index: number) => void;
  /** Go to next item */
  next: () => void;
  /** Go to previous item */
  prev: () => void;
  /** Check if a given index is the next one (useful for slide-up animations) */
  isNext: (index: number) => boolean;
}

/**
 * Hook for managing carousel state with auto-rotation
 *
 * @example Simple testimonials carousel:
 * ```tsx
 * const { currentIndex, goTo } = useCarousel({
 *   itemsLength: testimonials.length,
 *   intervalMs: 6000,
 * });
 * ```
 *
 * @example Text carousel with transition animations:
 * ```tsx
 * const { currentIndex, isTransitioning, isNext } = useCarousel({
 *   itemsLength: carouselTexts.length,
 *   intervalMs: 3500,
 *   transitionDuration: 400,
 * });
 * ```
 */
export function useCarousel({
  itemsLength,
  intervalMs = 5000,
  autoPlay = true,
  transitionDuration,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const goTo = React.useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const next = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % itemsLength);
  }, [itemsLength]);

  const prev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + itemsLength) % itemsLength);
  }, [itemsLength]);

  const isNext = React.useCallback(
    (index: number) => index === (currentIndex + 1) % itemsLength,
    [currentIndex, itemsLength]
  );

  // Auto-rotation with optional transition animation
  React.useEffect(() => {
    if (!autoPlay || itemsLength <= 1) return;

    const timer = setInterval(() => {
      if (transitionDuration) {
        // For animated text carousels
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % itemsLength);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, transitionDuration);
      } else {
        // Simple rotation
        setCurrentIndex((prev) => (prev + 1) % itemsLength);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, itemsLength, intervalMs, transitionDuration]);

  return {
    currentIndex,
    isTransitioning,
    goTo,
    next,
    prev,
    isNext,
  };
}
