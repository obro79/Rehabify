"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Save, Search, Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePTStore } from "@/stores/pt-store";
import type { PlanExercise } from "@/lib/mock-data/pt-data";

import exerciseData from "@/lib/exercises/data.json";

interface Exercise {
  id: string;
  name: string;
  slug: string;
  tier: number;
  body_region: string;
  category: string;
  difficulty: string;
  default_reps: number;
  default_sets: number;
  default_hold_seconds?: number;
  description?: string;
}

// Extract unique categories from exercise data
const categories = Array.from(
  new Set(exerciseData.exercises.map((ex: Exercise) => ex.category))
).sort();

// Day labels for weekly plan tabs
const DAYS_OF_WEEK = [
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
  { value: 0, label: "Sun", fullLabel: "Sunday" },
];

interface PlanBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function PlanBuilderPage({ params }: PlanBuilderPageProps) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const router = useRouter();

  const {
    getPatientById,
    draftPlan,
    loadDraftPlan,
    addExerciseToPlan,
    removeExerciseFromPlan,
    updateExerciseConfig,
    savePlan,
    clearDraftPlan,
  } = usePTStore();

  const patient = getPatientById(clientId);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [planName, setPlanName] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday
  const [isGenerating, setIsGenerating] = useState(false);

  // Load existing plan on mount
  useEffect(() => {
    if (patient?.currentPlan) {
      loadDraftPlan(clientId);
      setPlanName(patient.currentPlan.name);
    } else {
      clearDraftPlan();
      setPlanName("New Treatment Plan");
    }
  }, [clientId, patient, loadDraftPlan, clearDraftPlan]);

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return (exerciseData.exercises as Exercise[]).filter((exercise) => {
      const matchesSearch =
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.body_region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || exercise.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filter draft plan exercises by selected day
  const exercisesForSelectedDay = useMemo(() => {
    return draftPlan.filter((ex) => ex.dayOfWeek === selectedDay);
  }, [draftPlan, selectedDay]);

  // Get exercise count per day
  const getExerciseCountForDay = useCallback(
    (day: number) => {
      return draftPlan.filter((ex) => ex.dayOfWeek === day).length;
    },
    [draftPlan]
  );

  // Check if exercise is already in plan
  const isInPlan = (exerciseId: string) => {
    return draftPlan.some((ex) => ex.exerciseId === exerciseId);
  };

  // Add exercise to plan
  const handleAddExercise = (exercise: Exercise) => {
    if (isInPlan(exercise.id)) return;

    const planExercise: PlanExercise = {
      id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: exercise.default_sets,
      reps: exercise.default_reps,
      holdSeconds: exercise.default_hold_seconds,
      order: draftPlan.length,
      dayOfWeek: selectedDay,
    };

    addExerciseToPlan(planExercise);
  };

  // AI Generate Plan - populates with sample exercises
  const handleGeneratePlan = async () => {
    setIsGenerating(true);

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Clear existing draft
    clearDraftPlan();

    // Get exercises from different categories
    const allExercises = exerciseData.exercises as Exercise[];
    const categoryGroups = new Map<string, Exercise[]>();

    allExercises.forEach((ex) => {
      if (!categoryGroups.has(ex.category)) {
        categoryGroups.set(ex.category, []);
      }
      categoryGroups.get(ex.category)!.push(ex);
    });

    // Select 4-5 exercises from different categories
    const selectedExercises: Exercise[] = [];
    const categoryList = Array.from(categoryGroups.keys());

    // Shuffle categories
    for (let i = categoryList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [categoryList[i], categoryList[j]] = [categoryList[j], categoryList[i]];
    }

    // Pick one from each category until we have 5
    for (const category of categoryList) {
      if (selectedExercises.length >= 5) break;
      const exercises = categoryGroups.get(category)!;
      const randomEx = exercises[Math.floor(Math.random() * exercises.length)];
      if (!selectedExercises.find((e) => e.id === randomEx.id)) {
        selectedExercises.push(randomEx);
      }
    }

    // Distribute exercises across weekdays (Mon-Fri)
    const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri
    selectedExercises.forEach((exercise, index) => {
      const dayOfWeek = weekdays[index % weekdays.length];
      const planExercise: PlanExercise = {
        id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: exercise.default_sets,
        reps: exercise.default_reps,
        holdSeconds: exercise.default_hold_seconds,
        order: index,
        dayOfWeek,
      };
      addExerciseToPlan(planExercise);
    });

    setPlanName("AI-Generated Recovery Plan");
    setIsGenerating(false);
  };

  // Handle save plan
  const handleSavePlan = () => {
    if (draftPlan.length === 0) return;
    savePlan(clientId, planName);
    router.push(`/pt/clients/${clientId}`);
  };

  // Handle cancel
  const handleCancel = () => {
    clearDraftPlan();
    router.push(`/pt/clients/${clientId}`);
  };

  // Format category for display
  const formatCategory = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get badge variant for category
  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, "default" | "success" | "info" | "warning" | "coral" | "muted"> = {
      mobility: "info",
      extension: "success",
      stretch: "warning",
      strengthening: "coral",
      core_stability: "success",
      neural_mobilization: "muted",
    };
    return variants[category] || "default";
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sage-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Patient not found</p>
            <Link href="/pt/clients" className="text-sage-600 hover:underline mt-4 block">
              Back to Clients
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-sage-200/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/pt/clients/${clientId}`}
              className="flex items-center gap-2 text-sage-600 hover:text-sage-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Client</span>
            </Link>
            <div className="h-6 w-px bg-sage-200" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Plan Builder</h1>
              <p className="text-sm text-muted-foreground">{patient.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="text-sage-600 hover:text-sage-800"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "AI Generate"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSavePlan}
              disabled={draftPlan.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Plan Name Input */}
        <div className="mb-6">
          <label htmlFor="plan-name" className="block text-sm font-medium text-sage-700 mb-2">
            Plan Name
          </label>
          <Input
            id="plan-name"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Enter plan name..."
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exercise Library Panel */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-sage-100">
              <CardTitle className="text-lg">Exercise Library</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Click an exercise to add it to the plan
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {/* Search Input */}
              <div className="mb-4">
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              {/* Category Tabs */}
              <Tabs
                value={selectedCategory}
                onValueChange={setSelectedCategory}
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

              {/* Exercise List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredExercises.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No exercises found
                  </p>
                ) : (
                  filteredExercises.map((exercise) => {
                    const alreadyAdded = isInPlan(exercise.id);
                    return (
                      <button
                        key={exercise.id}
                        onClick={() => handleAddExercise(exercise)}
                        disabled={alreadyAdded}
                        className={`
                          w-full p-3 rounded-xl text-left transition-all duration-200
                          ${
                            alreadyAdded
                              ? "bg-sage-100 opacity-50 cursor-not-allowed"
                              : "surface-pillowy hover:shadow-pillowy-lg hover:scale-[1.02] cursor-pointer"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground truncate">
                                {exercise.name}
                              </span>
                              {exercise.tier === 1 && (
                                <Badge size="sm" variant="coral">
                                  AI Guided
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                size="sm"
                                variant={getCategoryBadgeVariant(exercise.category)}
                              >
                                {formatCategory(exercise.category)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {exercise.default_sets} sets x {exercise.default_reps} reps
                                {exercise.default_hold_seconds && (
                                  <> ({exercise.default_hold_seconds}s hold)</>
                                )}
                              </span>
                            </div>
                          </div>
                          {!alreadyAdded && (
                            <Plus className="w-5 h-5 text-sage-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Drop Zone */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-sage-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {draftPlan.length} exercise{draftPlan.length !== 1 ? "s" : ""} total
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Weekly Day Tabs */}
              <Tabs
                value={String(selectedDay)}
                onValueChange={(val) => setSelectedDay(Number(val))}
                className="mb-4"
              >
                <TabsList className="grid grid-cols-7 gap-1 w-full">
                  {DAYS_OF_WEEK.map((day) => {
                    const count = getExerciseCountForDay(day.value);
                    return (
                      <TabsTrigger
                        key={day.value}
                        value={String(day.value)}
                        className="flex flex-col items-center gap-0.5 py-2"
                      >
                        <span className="text-xs font-medium">{day.label}</span>
                        {count > 0 && (
                          <span className="text-[10px] text-sage-600 bg-sage-100 rounded-full px-1.5 min-w-[18px]">
                            {count}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {/* Day Label */}
              <div className="mb-3">
                <h3 className="text-sm font-medium text-sage-700">
                  {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.fullLabel} - {exercisesForSelectedDay.length} exercise{exercisesForSelectedDay.length !== 1 ? "s" : ""}
                </h3>
              </div>

              {exercisesForSelectedDay.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-sage-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-sage-500" />
                  </div>
                  <p className="text-muted-foreground">
                    No exercises for {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.fullLabel}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click exercises from the library to add them
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {exercisesForSelectedDay.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="relative p-4 rounded-xl surface-pillowy hover:shadow-pillowy-lg hover:scale-[1.02] transition-all duration-200"
                    >
                      {/* Remove Button */}
                      <button
                        onClick={() => removeExerciseFromPlan(exercise.id)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-sage-100 hover:bg-red-100 flex items-center justify-center transition-colors group"
                        aria-label={`Remove ${exercise.name} from plan`}
                      >
                        <X className="w-4 h-4 text-sage-500 group-hover:text-red-500" />
                      </button>

                      {/* Exercise Info */}
                      <div className="pr-10 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-medium">
                            #{index + 1}
                          </span>
                          <h4 className="font-medium text-foreground">
                            {exercise.name}
                          </h4>
                        </div>
                        <Badge
                          size="sm"
                          variant={getCategoryBadgeVariant(exercise.category)}
                          className="mt-1"
                        >
                          {formatCategory(exercise.category)}
                        </Badge>
                      </div>

                      {/* Configuration Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <NumberInput
                          label="Sets"
                          value={exercise.sets}
                          onChange={(value) =>
                            updateExerciseConfig(exercise.id, { sets: value })
                          }
                          min={1}
                          max={10}
                        />
                        <NumberInput
                          label="Reps"
                          value={exercise.reps}
                          onChange={(value) =>
                            updateExerciseConfig(exercise.id, { reps: value })
                          }
                          min={1}
                          max={50}
                        />
                        {exercise.holdSeconds !== undefined && (
                          <NumberInput
                            label="Hold"
                            value={exercise.holdSeconds}
                            onChange={(value) =>
                              updateExerciseConfig(exercise.id, {
                                holdSeconds: value,
                              })
                            }
                            min={1}
                            max={120}
                            suffix="s"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
