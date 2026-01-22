"use client";

import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Exercise } from "@/lib/exercises/types";
import { ITEMS_PER_PAGE } from "./constants";

export interface ExerciseFilters {
  searchQuery: string;
  selectedCategory: string;
  selectedBodyPart: string;
  selectedDifficulty: string;
}

export interface UseExerciseFiltersResult {
  filters: ExerciseFilters;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedBodyPart: (bodyPart: string) => void;
  setSelectedDifficulty: (difficulty: string) => void;
  clearFilters: () => void;
  filteredExercises: Exercise[];
  paginatedExercises: Exercise[];
  categoryCounts: Record<string, number>;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export function useExerciseFilters(
  exercises: Exercise[]
): UseExerciseFiltersResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBodyPart, setSelectedBodyPart] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedBodyPart, selectedDifficulty]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      if (
        debouncedSearch &&
        !exercise.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedCategory !== "all" &&
        exercise.category !== selectedCategory
      ) {
        return false;
      }
      if (
        selectedBodyPart !== "all" &&
        exercise.body_region !== selectedBodyPart
      ) {
        return false;
      }
      if (
        selectedDifficulty !== "all" &&
        exercise.difficulty !== selectedDifficulty
      ) {
        return false;
      }
      return true;
    });
  }, [
    exercises,
    debouncedSearch,
    selectedCategory,
    selectedBodyPart,
    selectedDifficulty,
  ]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: exercises.length };
    for (const exercise of exercises) {
      counts[exercise.category] = (counts[exercise.category] || 0) + 1;
    }
    return counts;
  }, [exercises]);

  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredExercises.length
  );
  const paginatedExercises = filteredExercises.slice(startIndex, endIndex);

  // Adjust page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  function clearFilters(): void {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBodyPart("all");
    setSelectedDifficulty("all");
  }

  return {
    filters: {
      searchQuery,
      selectedCategory,
      selectedBodyPart,
      selectedDifficulty,
    },
    setSearchQuery,
    setSelectedCategory,
    setSelectedBodyPart,
    setSelectedDifficulty,
    clearFilters,
    filteredExercises,
    paginatedExercises,
    categoryCounts,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
  };
}
