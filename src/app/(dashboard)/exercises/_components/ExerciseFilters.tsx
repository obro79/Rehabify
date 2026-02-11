"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BODY_PARTS, DIFFICULTIES } from "./constants";

interface ExerciseFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBodyPart: string;
  onBodyPartChange: (value: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
}

export function ExerciseFilters({
  searchQuery,
  onSearchChange,
  selectedBodyPart,
  onBodyPartChange,
  selectedDifficulty,
  onDifficultyChange,
}: ExerciseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search size={18} />}
          className="rounded-2xl"
        />
      </div>

      <Select value={selectedBodyPart} onValueChange={onBodyPartChange}>
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

      <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
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
  );
}
