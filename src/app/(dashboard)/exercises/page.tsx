"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import exerciseData from "@/lib/exercises/data.json";
import { useDebounce } from "@/hooks/use-debounce";
import { Exercise, DIFFICULTY_LEVELS } from "@/lib/exercises/types";
import {
  getCategoryIcon,
  getCategoryBadgeVariant,
  getCategoryLabel,
  getExerciseImage,
} from "@/lib/exercise-utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { AnimatePresence } from "framer-motion";

// Constants
const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "mobility", label: "Mobility" },
  { value: "strengthening", label: "Strength" },
  { value: "core_stability", label: "Stability" },
  { value: "stretch", label: "Stretch" },
] as const;

const BODY_PARTS = [
  { value: "all", label: "All Body Parts" },
  { value: "lower_back", label: "Back" },
  { value: "knee", label: "Knee" },
] as const;

const DIFFICULTIES = [
  { value: "all", label: "All Difficulties" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const ITEMS_PER_PAGE = 24;

function getDifficultyLevel(difficulty: string): number {
  return DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS] ?? 2;
}

function getDifficultyBadgeVariant(difficulty: string): "easy" | "medium" | "hard" {
  switch (difficulty) {
    case "beginner":
      return "easy";
    case "intermediate":
      return "medium";
    case "advanced":
      return "hard";
    default:
      return "medium";
  }
}

export default function ExercisesPage() {
  const exercises = exerciseData.exercises as Exercise[];

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBodyPart, setSelectedBodyPart] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedBodyPart, selectedDifficulty]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search filter
      if (
        debouncedSearch &&
        !exercise.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && exercise.category !== selectedCategory) {
        return false;
      }

      // Body part filter
      if (selectedBodyPart !== "all" && exercise.body_region !== selectedBodyPart) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && exercise.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [exercises, debouncedSearch, selectedCategory, selectedBodyPart, selectedDifficulty]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: exercises.length };
    exercises.forEach((exercise) => {
      counts[exercise.category] = (counts[exercise.category] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredExercises.length);
  const paginatedExercises = filteredExercises.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Generate page numbers to display (smart range with ellipsis)
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis if needed before range
    if (rangeStart > 2) {
      pages.push("ellipsis");
    }

    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed after range
    if (rangeEnd < totalPages - 1) {
      pages.push("ellipsis");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Subtle gradient mesh background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-sage-100/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-terracotta-100/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <FadeIn>
        <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse our collection of {exercises.length} evidence-based rehabilitation exercises
        </p>
      </FadeIn>

      {/* Search and Filters - with larger border radius */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar - softer with larger radius */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={18} />}
              className="rounded-2xl"
            />
          </div>

          {/* Body Part Filter */}
          <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
            <SelectTrigger className="w-full sm:w-48 rounded-2xl">
              <SelectValue placeholder="Body Part" />
            </SelectTrigger>
            <SelectContent>
              {BODY_PARTS.map((part) => (
                <SelectItem key={part.value} value={part.value}>
                  {part.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-48 rounded-2xl">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      {/* Category Tabs - pill-shaped with sage/terracotta selected states */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <FadeIn delay={0.15}>
          <TabsList className="rounded-full">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="rounded-full data-[state=active]:bg-sage-500 data-[state=active]:text-white"
              >
                {category.label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({categoryCounts[category.value] || 0})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </FadeIn>

        <TabsContent value={selectedCategory}>
          {/* Results info */}
          {filteredExercises.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing {startIndex + 1}-{endIndex} of {filteredExercises.length} exercises
            </p>
          )}

          {/* Exercise Grid */}
          {paginatedExercises.length > 0 ? (
            <>
            <AnimatePresence mode="wait">
              <StaggerContainer
                key={`${selectedCategory}-${selectedBodyPart}-${selectedDifficulty}-${debouncedSearch}-${currentPage}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4"
              >
                {paginatedExercises.map((exercise) => (
                  <StaggerItem key={exercise.id}>
                    <Card
                      variant="organic"
                      className="group p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] focus-within:ring-2 focus-within:ring-sage-400 focus-within:ring-offset-2"
                      tabIndex={0}
                      role="button"
                      aria-label={`${exercise.name} - ${getCategoryLabel(exercise.category)} exercise`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          window.location.href = `/workout/${exercise.slug}`;
                        }
                      }}
                    >
                      {/* Image/Icon area */}
                      <div className="flex items-center justify-center h-32 bg-sage-50 rounded-2xl mb-3 group-hover:bg-sage-100 transition-colors relative overflow-hidden">
                        {getExerciseImage(exercise.slug) ? (
                          <Image
                            src={getExerciseImage(exercise.slug)!}
                            alt={exercise.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          getCategoryIcon(exercise.category, "md")
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                            {exercise.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getCategoryBadgeVariant(exercise.category)}
                            size="sm"
                          >
                            {getCategoryLabel(exercise.category)}
                          </Badge>
                          <Badge
                            variant={getDifficultyBadgeVariant(exercise.difficulty)}
                            size="sm"
                          >
                            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>
                            {exercise.default_sets} sets × {exercise.default_reps} reps
                          </p>
                        </div>

                        <Link href={`/workout/${exercise.slug}`}>
                          <Button variant="ghost" size="sm" className="w-full mt-2 h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground">
                            Start
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <FadeIn>
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Prev</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) =>
                      page === "ellipsis" ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "primary" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="rounded-full min-w-[36px]"
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                    aria-label="Next page"
                  >
                    <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </FadeIn>
            )}
            </>
          ) : (
            <div className="mt-12">
              <EmptyState
                icon={Search}
                title="No exercises found"
                description="Try adjusting your filters or search query to find exercises."
                action={{
                  label: "Clear Filters",
                  onClick: () => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedBodyPart("all");
                    setSelectedDifficulty("all");
                  },
                }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
