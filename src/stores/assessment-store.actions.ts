/**
 * Assessment Store Action Helpers
 *
 * Factory functions to reduce boilerplate in the store definition.
 */

import type { StoreApi } from 'zustand';
import type {
  AssessmentState,
  AssessmentData,
  ChiefComplaint,
  PainProfile,
  FunctionalImpact,
  MedicalHistory,
  MovementScreen,
} from './assessment-store.types';

type SetState = StoreApi<AssessmentState>['setState'];
type GetState = StoreApi<AssessmentState>['getState'];

// Object data fields that support partial updates
type ObjectDataField = ChiefComplaint | PainProfile | FunctionalImpact | MedicalHistory | MovementScreen;
type ObjectDataKey = 'chiefComplaint' | 'pain' | 'functional' | 'history' | 'movementScreen';

/**
 * Creates an updater for a nested object data field.
 * Reduces repetitive spread patterns for updating AssessmentData subfields.
 */
export function createDataUpdater<K extends ObjectDataKey>(
  set: SetState,
  key: K
): (updates: Partial<AssessmentData[K]>) => void {
  return (updates) =>
    set((state) => ({
      data: {
        ...state.data,
        [key]: { ...(state.data[key] as ObjectDataField), ...updates },
      },
    }));
}

type MovementKey = keyof MovementScreen;

/**
 * Creates an updater for a movement screen subfield (flexion, extension, sideBend).
 */
export function createMovementUpdater<K extends MovementKey>(
  set: SetState,
  movement: K
): (updates: Partial<MovementScreen[K]>) => void {
  return (updates) =>
    set((state) => ({
      data: {
        ...state.data,
        movementScreen: {
          ...state.data.movementScreen,
          [movement]: { ...state.data.movementScreen[movement], ...updates },
        },
      },
    }));
}

/**
 * Creates a simple data field setter for boolean/primitive fields.
 */
export function createDataFieldSetter<K extends keyof AssessmentData>(
  set: SetState,
  key: K
): (value: AssessmentData[K]) => void {
  return (value) =>
    set((state) => ({
      data: { ...state.data, [key]: value },
    }));
}

/**
 * Calculates assessment duration from start time.
 */
export function calculateDuration(get: GetState): number {
  const { startedAt } = get();
  if (!startedAt) return 0;
  return Math.floor((Date.now() - startedAt) / 1000);
}
