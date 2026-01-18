/**
 * Zustand store for PT dashboard state management
 * Handles patient data, plan builder, and plan modifications
 */

import { create } from 'zustand';
import type { MockPatient, Plan, PlanExercise } from '@/lib/mock-data/pt-data';
import type { PlanStructure } from '@/lib/gemini/types';
import { mockPatients } from '@/lib/mock-data/pt-data';

interface ExerciseConfig {
  sets?: number;
  reps?: number;
  holdSeconds?: number;
}

interface PTStore {
  // State
  patients: MockPatient[];
  selectedPatientId: string | null;
  draftPlan: PlanExercise[]; // Legacy flat structure for backward compatibility
  draftPlanStructure: PlanStructure | null; // New 12-week structure

  // Actions
  getPatientById: (id: string) => MockPatient | undefined;
  updatePlanStatus: (patientId: string, status: Plan['status'], notes?: string) => void;
  addExerciseToPlan: (exercise: PlanExercise) => void;
  removeExerciseFromPlan: (exerciseId: string) => void;
  reorderPlanExercises: (sourceIndex: number, destIndex: number) => void;
  updateExerciseConfig: (exerciseId: string, config: ExerciseConfig) => void;
  savePlan: (patientId: string, planName: string) => void;
  clearDraftPlan: () => void;
  setSelectedPatient: (patientId: string | null) => void;
  loadDraftPlan: (patientId: string) => void;

  // 12-week plan structure actions
  setPlanStructure: (structure: PlanStructure) => void;
  addExerciseToWeek: (weekNumber: number, exercise: PlanExercise, days: number[]) => void;
  removeExerciseFromWeek: (weekNumber: number, exerciseId: string) => void;
  updateWeekExercise: (weekNumber: number, exerciseId: string, config: ExerciseConfig) => void;
  updateWeekFocus: (weekNumber: number, focus: string) => void;
  updateWeekNotes: (weekNumber: number, notes: string) => void;
}

export const usePTStore = create<PTStore>((set, get) => ({
  // Initial state
  patients: mockPatients,
  selectedPatientId: null,
  draftPlan: [],
  draftPlanStructure: null,

  // Get patient by ID
  getPatientById: (id: string) => {
    return get().patients.find(patient => patient.id === id);
  },

  // Set selected patient
  setSelectedPatient: (patientId: string | null) => {
    set({ selectedPatientId: patientId });
  },

  // Update plan status (approve/reject/modify)
  updatePlanStatus: (patientId: string, status: Plan['status'], notes?: string) => {
    set(state => ({
      patients: state.patients.map(patient => {
        if (patient.id === patientId && patient.currentPlan) {
          return {
            ...patient,
            currentPlan: {
              ...patient.currentPlan,
              status,
              reviewedAt: new Date(),
              notes: notes || patient.currentPlan.notes,
            },
          };
        }
        return patient;
      }),
    }));
  },

  // Load existing plan into draft for editing
  loadDraftPlan: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (patient && patient.currentPlan) {
      set({ draftPlan: [...patient.currentPlan.exercises] });
    } else {
      set({ draftPlan: [] });
    }
  },

  // Add exercise to draft plan
  addExerciseToPlan: (exercise: PlanExercise) => {
    set(state => ({
      draftPlan: [
        ...state.draftPlan,
        {
          ...exercise,
          order: state.draftPlan.length, // Auto-assign next order number
        },
      ],
    }));
  },

  // Remove exercise from draft plan
  removeExerciseFromPlan: (exerciseId: string) => {
    set(state => ({
      draftPlan: state.draftPlan
        .filter(ex => ex.id !== exerciseId)
        .map((ex, index) => ({ ...ex, order: index })), // Re-index after removal
    }));
  },

  // Reorder exercises in draft plan (for drag-drop)
  reorderPlanExercises: (sourceIndex: number, destIndex: number) => {
    set(state => {
      const newPlan = [...state.draftPlan];
      const [movedExercise] = newPlan.splice(sourceIndex, 1);
      newPlan.splice(destIndex, 0, movedExercise);

      // Update order property to match new positions
      return {
        draftPlan: newPlan.map((ex, index) => ({ ...ex, order: index })),
      };
    });
  },

  // Update exercise configuration (sets/reps/hold)
  updateExerciseConfig: (exerciseId: string, config: ExerciseConfig) => {
    set(state => ({
      draftPlan: state.draftPlan.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            ...(config.sets !== undefined && { sets: config.sets }),
            ...(config.reps !== undefined && { reps: config.reps }),
            ...(config.holdSeconds !== undefined && { holdSeconds: config.holdSeconds }),
          };
        }
        return ex;
      }),
    }));
  },

  // Save draft plan to patient's current plan
  savePlan: (patientId: string, planName: string) => {
    const { draftPlan } = get();
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: planName,
      status: 'pending_review',
      exercises: draftPlan,
      createdAt: new Date(),
      notes: 'Created by PT',
    };

    set(state => ({
      patients: state.patients.map(patient => {
        if (patient.id === patientId) {
          return {
            ...patient,
            currentPlan: newPlan,
          };
        }
        return patient;
      }),
      draftPlan: [], // Clear draft after saving
    }));
  },

  // Clear draft plan
  clearDraftPlan: () => {
    set({ draftPlan: [], draftPlanStructure: null });
  },

  // Set 12-week plan structure
  setPlanStructure: (structure: PlanStructure) => {
    set({ draftPlanStructure: structure });
  },

  // Add exercise to a specific week
  addExerciseToWeek: (weekNumber: number, exercise: PlanExercise, days: number[]) => {
    set(state => {
      if (!state.draftPlanStructure) return state;

      const newStructure = { ...state.draftPlanStructure };
      const week = newStructure.weeks.find(w => w.weekNumber === weekNumber);

      if (week) {
        // Check if exercise already exists in this week
        const exists = week.exercises.some(ex => ex.exerciseId === exercise.exerciseId);
        if (exists) return state;

        const newExercise = {
          exerciseId: exercise.exerciseId,
          exerciseSlug: exercise.exerciseId, // Can be updated later with actual slug from exercise library
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          holdSeconds: exercise.holdSeconds,
          days,
          order: week.exercises.length,
          notes: undefined,
        };

        week.exercises = [...week.exercises, newExercise];
      }

      return { draftPlanStructure: newStructure };
    });
  },

  // Remove exercise from a specific week
  removeExerciseFromWeek: (weekNumber: number, exerciseId: string) => {
    set(state => {
      if (!state.draftPlanStructure) return state;

      const newStructure = { ...state.draftPlanStructure };
      const week = newStructure.weeks.find(w => w.weekNumber === weekNumber);

      if (week) {
        week.exercises = week.exercises
          .filter(ex => ex.exerciseId !== exerciseId)
          .map((ex, index) => ({ ...ex, order: index }));
      }

      return { draftPlanStructure: newStructure };
    });
  },

  // Update exercise config in a specific week
  updateWeekExercise: (weekNumber: number, exerciseId: string, config: ExerciseConfig) => {
    set(state => {
      if (!state.draftPlanStructure) return state;

      const newStructure = { ...state.draftPlanStructure };
      const week = newStructure.weeks.find(w => w.weekNumber === weekNumber);

      if (week) {
        week.exercises = week.exercises.map(ex => {
          if (ex.exerciseId === exerciseId) {
            return {
              ...ex,
              ...(config.sets !== undefined && { sets: config.sets }),
              ...(config.reps !== undefined && { reps: config.reps }),
              ...(config.holdSeconds !== undefined && { holdSeconds: config.holdSeconds }),
            };
          }
          return ex;
        });
      }

      return { draftPlanStructure: newStructure };
    });
  },

  // Update week focus
  updateWeekFocus: (weekNumber: number, focus: string) => {
    set(state => {
      if (!state.draftPlanStructure) return state;

      const newStructure = { ...state.draftPlanStructure };
      const week = newStructure.weeks.find(w => w.weekNumber === weekNumber);

      if (week) {
        week.focus = focus;
      }

      return { draftPlanStructure: newStructure };
    });
  },

  // Update week notes
  updateWeekNotes: (weekNumber: number, notes: string) => {
    set(state => {
      if (!state.draftPlanStructure) return state;

      const newStructure = { ...state.draftPlanStructure };
      const week = newStructure.weeks.find(w => w.weekNumber === weekNumber);

      if (week) {
        week.notes = notes;
      }

      return { draftPlanStructure: newStructure };
    });
  },
}));
