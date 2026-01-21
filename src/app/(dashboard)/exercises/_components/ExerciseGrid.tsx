"use client";

import { Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import type { Exercise } from "@/lib/exercises/types";
import { ExerciseGridCard } from "./ExerciseGridCard";
import { ExercisePagination } from "./ExercisePagination";

interface ExerciseGridProps {
  exercises: Exercise[];
  selectedCategory: string;
  selectedBodyPart: string;
  selectedDifficulty: string;
  debouncedSearch: string;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export function ExerciseGrid({
  exercises,
  selectedCategory,
  selectedBodyPart,
  selectedDifficulty,
  debouncedSearch,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalCount,
  onPageChange,
  onClearFilters,
}: ExerciseGridProps) {
  const gridKey = `${selectedCategory}-${selectedBodyPart}-${selectedDifficulty}-${debouncedSearch}-${currentPage}`;

  return (
    <TabsContent value={selectedCategory}>
      {totalCount > 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          Showing {startIndex + 1}-{endIndex} of {totalCount} exercises
        </p>
      )}

      {exercises.length > 0 ? (
        <>
          <AnimatePresence mode="wait">
            <StaggerContainer
              key={gridKey}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4"
            >
              {exercises.map((exercise) => (
                <StaggerItem key={exercise.id}>
                  <ExerciseGridCard exercise={exercise} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </AnimatePresence>

          <ExercisePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <div className="mt-12">
          <EmptyState
            icon={Search}
            title="No exercises found"
            description="Try adjusting your filters or search query to find exercises."
            action={{
              label: "Clear Filters",
              onClick: onClearFilters,
            }}
          />
        </div>
      )}
    </TabsContent>
  );
}
