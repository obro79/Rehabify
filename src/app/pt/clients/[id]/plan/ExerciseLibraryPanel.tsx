"use client";

import React from "react";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseLibraryItem } from "./ExerciseLibraryItem";
import type { Exercise } from "@/lib/exercises/types";
import { formatCategory } from "./plan-utils";

interface ExerciseLibraryPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  exercises: Exercise[];
  isInPlan: (id: string) => boolean;
  onAddExercise: (exercise: Exercise) => void;
}

export function ExerciseLibraryPanel({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  exercises,
  isInPlan,
  onAddExercise,
}: ExerciseLibraryPanelProps): React.JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-sage-100">
        <CardTitle className="text-lg">Exercise Library</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Click an exercise to add it to the plan
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <Tabs
          value={selectedCategory}
          onValueChange={onCategoryChange}
          className="mb-4"
        >
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {formatCategory(category)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {exercises.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No exercises found
            </p>
          ) : (
            exercises.map((exercise) => (
              <ExerciseLibraryItem
                key={exercise.id}
                exercise={exercise}
                isInPlan={isInPlan(exercise.id)}
                onAdd={() => onAddExercise(exercise)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
