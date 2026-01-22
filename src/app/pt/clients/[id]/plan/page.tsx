"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Save, Search, Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePTStore } from "@/stores/pt-store";
import type { PlanExercise } from "@/lib/mock-data/pt-data";
import type { PlanWeek } from "@/lib/gemini/types";
import { DAYS_OF_WEEK, getCategoryBadgeVariant } from "./plan-utils";

import exerciseData from "@/lib/exercises/data.json";
import type { Exercise } from "@/lib/exercises/types";

// Extract unique categories from exercise data
const categories = Array.from(
  new Set(exerciseData.exercises.map((ex) => ex.category))
).sort();

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
    draftPlanStructure,
    loadDraftPlan,
    addExerciseToPlan,
    removeExerciseFromPlan,
    updateExerciseConfig,
    savePlan,
    clearDraftPlan,
    setPlanStructure,
    addExerciseToWeek,
    removeExerciseFromWeek,
    updateWeekExercise,
    updateWeekFocus,
    updateWeekNotes,
  } = usePTStore();

  const patient = getPatientById(clientId);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [planName, setPlanName] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday
  const [selectedWeek, setSelectedWeek] = useState<number>(1); // Default to Week 1
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAssessment, setAvailableAssessment] = useState<{ id: string; completed: boolean } | null>(null);

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

  // Fetch available assessments for this patient
  useEffect(() => {
    async function fetchAssessments() {
      try {
        const response = await fetch(`/api/assessments/${clientId}`);
        if (!response.ok) {
          // If 404 or other error, just continue without assessment
          return;
        }
        const { data } = await response.json();
        // Find the most recent completed assessment
        const completed = data?.find((a: { completed: boolean }) => a.completed);
        if (completed) {
          setAvailableAssessment({ id: completed.id, completed: true });
        }
      } catch (err) {
        // Silently fail - assessment is optional
        console.error('Failed to fetch assessments:', err);
      }
    }
    fetchAssessments();
  }, [clientId]);

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

  // Get current week data
  const currentWeek = useMemo(() => {
    if (draftPlanStructure) {
      return draftPlanStructure.weeks.find(w => w.weekNumber === selectedWeek);
    }
    return null;
  }, [draftPlanStructure, selectedWeek]);

  // Filter exercises for selected week and day
  const exercisesForSelectedDay = useMemo(() => {
    if (currentWeek) {
      return currentWeek.exercises.filter((ex) => ex.days.includes(selectedDay));
    }
    // Fallback to legacy draftPlan structure
    return draftPlan.filter((ex) => ex.dayOfWeek === selectedDay);
  }, [currentWeek, selectedDay, draftPlan]) as Array<PlanExercise | { exerciseId: string; name: string; sets: number; reps: number; holdSeconds?: number; days: number[]; order: number; exerciseSlug?: string; notes?: string }>;

  // Get exercise count per day for current week
  const getExerciseCountForDay = useCallback(
    (day: number) => {
      if (currentWeek) {
        return currentWeek.exercises.filter((ex) => ex.days.includes(day)).length;
      }
      return draftPlan.filter((ex) => ex.dayOfWeek === day).length;
    },
    [currentWeek, draftPlan]
  );

  // Check if exercise is already in current week
  const isInPlan = (exerciseId: string) => {
    if (currentWeek) {
      return currentWeek.exercises.some((ex) => ex.exerciseId === exerciseId);
    }
    return draftPlan.some((ex) => ex.exerciseId === exerciseId);
  };

  // Add exercise to plan
  const handleAddExercise = (exercise: Exercise) => {
    if (isInPlan(exercise.id)) return;

    if (draftPlanStructure && currentWeek) {
      // Add to 12-week structure
      const planExercise: PlanExercise = {
        id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: exercise.default_sets,
        reps: exercise.default_reps,
        holdSeconds: exercise.default_hold_seconds,
        order: currentWeek.exercises.length,
        dayOfWeek: selectedDay,
      };

      // Check if exercise already exists in this week (by exerciseId)
      const existsInWeek = currentWeek.exercises.some(ex => ex.exerciseId === exercise.id);
      if (!existsInWeek) {
        addExerciseToWeek(selectedWeek, planExercise, [selectedDay]);
      }
    } else {
      // Fallback to legacy structure
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
    }
  };

  // AI Generate Plan from Assessment
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Check if we have an assessment
      if (!availableAssessment || !availableAssessment.completed) {
        // Fallback to mock generation if no assessment
        await handleMockGeneratePlan();
        return;
      }

      // Call the real API
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: availableAssessment.id,
          patientId: clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate plan');
      }

      const { data } = await response.json();

      // Clear existing draft
      clearDraftPlan();

      // Store the full 12-week plan structure
      if (data.structure?.weeks && data.structure.weeks.length === 12) {
        setPlanStructure(data.structure);
        setPlanName(data.summary ? `AI Plan: ${data.summary.substring(0, 50)}...` : "AI-Generated Recovery Plan");
      } else {
        throw new Error('Invalid plan structure: expected 12 weeks');
      }

      // Show success message
      if (data.recommendations && data.recommendations.length > 0) {
        console.log('Plan recommendations:', data.recommendations);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan';
      setError(errorMessage);
      console.error('Plan generation error:', err);

      // Fallback to mock generation on error
      await handleMockGeneratePlan();
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback mock generation (original logic)
  const handleMockGeneratePlan = async () => {
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

    // Create a simple 12-week structure for mock generation
    const mockWeeks: PlanWeek[] = Array.from({ length: 12 }, (_, i) => {
      const weekNum = i + 1;
      // Only populate first week with exercises for demo
      const exercises = weekNum === 1 ? selectedExercises.slice(0, 3).map((ex, idx) => ({
        exerciseId: ex.id,
        exerciseSlug: ex.slug,
        name: ex.name,
        sets: ex.default_sets,
        reps: ex.default_reps,
        holdSeconds: ex.default_hold_seconds,
        days: [1, 3, 5], // Mon, Wed, Fri
        order: idx,
      })) : [];

      return {
        weekNumber: weekNum,
        focus: weekNum <= 2 ? 'Pain relief and gentle mobility' :
               weekNum <= 4 ? 'Core activation and stability basics' :
               weekNum <= 6 ? 'Progressive strengthening' :
               weekNum <= 8 ? 'Functional movement patterns' :
               weekNum <= 10 ? 'Advanced stability and endurance' :
               'Maintenance and independence',
        notes: weekNum <= 2 ? 'Focus on pain-free movement. Stop if pain increases.' :
               weekNum <= 4 ? 'Begin engaging core muscles. Maintain neutral spine.' :
               weekNum <= 6 ? 'Increase difficulty gradually. Monitor fatigue.' :
               weekNum <= 8 ? 'Apply exercises to daily movements.' :
               weekNum <= 10 ? 'Build endurance. Longer holds, more reps.' :
               "You're ready for independent maintenance!",
        exercises,
      };
    });

    setPlanStructure({ weeks: mockWeeks });
    setPlanName("AI-Generated Recovery Plan");
  };

  // Handle save plan
  const handleSavePlan = async () => {
    if (!draftPlanStructure && draftPlan.length === 0) return;

    // If we have a 12-week structure, save it to the database
    if (draftPlanStructure) {
      try {
        const response = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: clientId,
            name: planName || 'Rehabilitation Plan',
            structure: draftPlanStructure,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to save plan');
        }

        router.push(`/pt/clients/${clientId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save plan');
        console.error('Save plan error:', err);
      }
    } else {
      // Fallback to legacy save
      savePlan(clientId, planName);
      router.push(`/pt/clients/${clientId}`);
    }
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
              title={availableAssessment ? "Generate plan from assessment" : "Generate sample plan (no assessment found)"}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : availableAssessment ? "AI Generate from Assessment" : "AI Generate (Sample)"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSavePlan}
              disabled={!draftPlanStructure && draftPlan.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
            {availableAssessment && (
              <p className="text-xs text-red-600 mt-1">
                Falling back to sample plan generation.
              </p>
            )}
          </div>
        )}

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
                    {draftPlanStructure
                      ? `12-week plan${currentWeek ? ` - Week ${selectedWeek}` : ''}`
                      : `${draftPlan.length} exercise${draftPlan.length !== 1 ? "s" : ""} total`
                    }
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Week Tabs (if 12-week structure exists) */}
              {draftPlanStructure && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Week Selection
                  </label>
                  <Tabs
                    value={String(selectedWeek)}
                    onValueChange={(val) => setSelectedWeek(Number(val))}
                    className="mb-4"
                  >
                    <TabsList className="grid grid-cols-6 gap-1 w-full">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((weekNum) => {
                        const week = draftPlanStructure.weeks.find(w => w.weekNumber === weekNum);
                        const exerciseCount = week?.exercises.length || 0;
                        return (
                          <TabsTrigger
                            key={weekNum}
                            value={String(weekNum)}
                            className="flex flex-col items-center gap-0.5 py-2"
                          >
                            <span className="text-xs font-medium">W{weekNum}</span>
                            {exerciseCount > 0 && (
                              <span className="text-[10px] text-sage-600 bg-sage-100 rounded-full px-1.5 min-w-[18px]">
                                {exerciseCount}
                              </span>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>

                  {/* Week Focus and Notes */}
                  {currentWeek && (
                    <div className="mb-4 p-3 bg-sage-50 rounded-lg">
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-sage-700 mb-1">
                          Week Focus
                        </label>
                        <Input
                          value={currentWeek.focus}
                          onChange={(e) => updateWeekFocus(selectedWeek, e.target.value)}
                          className="text-sm"
                          placeholder="e.g., Pain relief and gentle mobility"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-sage-700 mb-1">
                          Patient Notes
                        </label>
                        <Textarea
                          value={currentWeek.notes}
                          onChange={(e) => updateWeekNotes(selectedWeek, e.target.value)}
                          className="min-h-[60px] text-sm"
                          placeholder="Instructions for this week..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  {draftPlanStructure && currentWeek && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Week {selectedWeek})
                    </span>
                  )}
                </h3>
              </div>

              {exercisesForSelectedDay.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-sage-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-sage-500" />
                  </div>
                  <p className="text-muted-foreground">
                    No exercises for {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.fullLabel}
                    {draftPlanStructure && ` (Week ${selectedWeek})`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click exercises from the library to add them
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {exercisesForSelectedDay.map((exercise, index) => {
                    // Handle both structure types (PlanExercise from mock-data vs PlanExercise from gemini types)
                    const exerciseId = 'exerciseId' in exercise ? exercise.exerciseId : (exercise as PlanExercise).id;
                    const exerciseName = exercise.name;
                    const exerciseSets = exercise.sets;
                    const exerciseReps = exercise.reps;
                    const exerciseHoldSeconds = exercise.holdSeconds;
                    const exerciseCategory = 'category' in exercise ? exercise.category : 'mobility';
                    const exerciseDays = 'days' in exercise ? exercise.days : [(exercise as PlanExercise).dayOfWeek || selectedDay];

                    return (
                      <div
                        key={exerciseId + '-' + index}
                        className="relative p-4 rounded-xl surface-pillowy hover:shadow-pillowy-lg hover:scale-[1.02] transition-all duration-200"
                      >
                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            if (draftPlanStructure && currentWeek) {
                              removeExerciseFromWeek(selectedWeek, exerciseId);
                            } else {
                              removeExerciseFromPlan(exerciseId);
                            }
                          }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-sage-100 hover:bg-red-100 flex items-center justify-center transition-colors group"
                          aria-label={`Remove ${exerciseName} from plan`}
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
                              {exerciseName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              size="sm"
                              variant={getCategoryBadgeVariant(exerciseCategory)}
                            >
                              {formatCategory(exerciseCategory)}
                            </Badge>
                            {exerciseDays.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                Days: {exerciseDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Configuration Inputs */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <NumberInput
                            label="Sets"
                            value={exerciseSets}
                            onChange={(value) => {
                              if (draftPlanStructure && currentWeek) {
                                updateWeekExercise(selectedWeek, exerciseId, { sets: value });
                              } else {
                                updateExerciseConfig(exerciseId, { sets: value });
                              }
                            }}
                            min={1}
                            max={10}
                          />
                          <NumberInput
                            label="Reps"
                            value={exerciseReps}
                            onChange={(value) => {
                              if (draftPlanStructure && currentWeek) {
                                updateWeekExercise(selectedWeek, exerciseId, { reps: value });
                              } else {
                                updateExerciseConfig(exerciseId, { reps: value });
                              }
                            }}
                            min={1}
                            max={50}
                          />
                          {(exerciseHoldSeconds !== undefined && exerciseHoldSeconds > 0) && (
                            <NumberInput
                              label="Hold"
                              value={exerciseHoldSeconds}
                              onChange={(value) => {
                                if (draftPlanStructure && currentWeek) {
                                  updateWeekExercise(selectedWeek, exerciseId, { holdSeconds: value });
                                } else {
                                  updateExerciseConfig(exerciseId, { holdSeconds: value });
                                }
                              }}
                              min={1}
                              max={120}
                              suffix="s"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
