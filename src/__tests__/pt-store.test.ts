/**
 * Focused tests for PT store and mock data
 * Testing core functionality without exhaustive edge case coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePTStore } from '@/stores/pt-store';
import { mockPatients } from '@/lib/mock-data/pt-data';

describe('PT Store', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = usePTStore.getState();
    store.clearDraftPlan();
    store.setSelectedPatient(null);
  });

  describe('Mock Data Validation', () => {
    it('should have valid mock patient data structure', () => {
      expect(mockPatients).toBeDefined();
      expect(mockPatients.length).toBeGreaterThanOrEqual(8);
      expect(mockPatients.length).toBeLessThanOrEqual(12);

      // Validate first patient has required fields
      const firstPatient = mockPatients[0];
      expect(firstPatient).toHaveProperty('id');
      expect(firstPatient).toHaveProperty('name');
      expect(firstPatient).toHaveProperty('email');
      expect(firstPatient).toHaveProperty('status');
      expect(firstPatient).toHaveProperty('alerts');
      expect(firstPatient).toHaveProperty('sessionHistory');
      expect(Array.isArray(firstPatient.alerts)).toBe(true);
      expect(Array.isArray(firstPatient.sessionHistory)).toBe(true);
    });

    it('should have at least 2 patients with pending_review plans', () => {
      const pendingReviewPatients = mockPatients.filter(
        patient => patient.currentPlan?.status === 'pending_review'
      );
      expect(pendingReviewPatients.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Patient Retrieval', () => {
    it('should retrieve patient by ID', () => {
      const patient = usePTStore.getState().getPatientById('pt-001');
      expect(patient).toBeDefined();
      expect(patient?.id).toBe('pt-001');
    });

    it('should return undefined for non-existent patient ID', () => {
      const patient = usePTStore.getState().getPatientById('non-existent');
      expect(patient).toBeUndefined();
    });
  });

  describe('Selected Patient', () => {
    it('should set selected patient ID', () => {
      const store = usePTStore.getState();

      expect(store.selectedPatientId).toBeNull();

      store.setSelectedPatient('pt-001');
      expect(usePTStore.getState().selectedPatientId).toBe('pt-001');
    });

    it('should clear selected patient when set to null', () => {
      const store = usePTStore.getState();

      store.setSelectedPatient('pt-001');
      expect(usePTStore.getState().selectedPatientId).toBe('pt-001');

      store.setSelectedPatient(null);
      expect(usePTStore.getState().selectedPatientId).toBeNull();
    });
  });

  describe('Plan Status Updates', () => {
    it('should update plan status to approved', () => {
      const store = usePTStore.getState();
      const patientId = 'pt-002'; // Patient with pending_review plan

      // Update status
      store.updatePlanStatus(patientId, 'approved');

      // Verify update
      const updatedPatient = store.getPatientById(patientId);
      expect(updatedPatient?.currentPlan?.status).toBe('approved');
      expect(updatedPatient?.currentPlan?.reviewedAt).toBeInstanceOf(Date);
    });

    it('should update plan status to rejected with notes', () => {
      const store = usePTStore.getState();
      const patientId = 'pt-004';
      const notes = 'Exercises too advanced for current level';

      store.updatePlanStatus(patientId, 'rejected', notes);

      const updatedPatient = store.getPatientById(patientId);
      expect(updatedPatient?.currentPlan?.status).toBe('rejected');
      expect(updatedPatient?.currentPlan?.notes).toBe(notes);
    });
  });

  describe('Draft Plan Management', () => {
    it('should add exercise to draft plan', () => {
      const exercise = {
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      };

      usePTStore.getState().addExerciseToPlan(exercise);

      const state = usePTStore.getState();
      expect(state.draftPlan).toHaveLength(1);
      expect(state.draftPlan[0].exerciseId).toBe('cat-camel');
    });

    it('should auto-assign order when adding exercises', () => {
      const store = usePTStore.getState();

      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 99, // This should be overwritten
      });

      store.addExerciseToPlan({
        id: 'test-ex-2',
        exerciseId: 'bird-dog',
        name: 'Bird Dog',
        category: 'stability',
        sets: 3,
        reps: 8,
        order: 99, // This should be overwritten
      });

      const state = usePTStore.getState();
      expect(state.draftPlan[0].order).toBe(0);
      expect(state.draftPlan[1].order).toBe(1);
    });

    it('should remove exercise from draft plan and re-index', () => {
      // Add two exercises
      usePTStore.getState().addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });

      usePTStore.getState().addExerciseToPlan({
        id: 'test-ex-2',
        exerciseId: 'bird-dog',
        name: 'Bird Dog',
        category: 'stability',
        sets: 3,
        reps: 8,
        order: 1,
      });

      let state = usePTStore.getState();
      expect(state.draftPlan).toHaveLength(2);

      // Remove first exercise
      usePTStore.getState().removeExerciseFromPlan('test-ex-1');

      state = usePTStore.getState();
      expect(state.draftPlan).toHaveLength(1);
      expect(state.draftPlan[0].exerciseId).toBe('bird-dog');
      expect(state.draftPlan[0].order).toBe(0); // Should be re-indexed
    });

    it('should reorder exercises in draft plan', () => {
      // Add three exercises
      ['cat-camel', 'bird-dog', 'dead-bug'].forEach((id, idx) => {
        usePTStore.getState().addExerciseToPlan({
          id: `test-ex-${idx}`,
          exerciseId: id,
          name: id,
          category: 'test',
          sets: 2,
          reps: 10,
          order: idx,
        });
      });

      // Move first exercise to last position
      usePTStore.getState().reorderPlanExercises(0, 2);

      const state = usePTStore.getState();
      expect(state.draftPlan[0].exerciseId).toBe('bird-dog');
      expect(state.draftPlan[1].exerciseId).toBe('dead-bug');
      expect(state.draftPlan[2].exerciseId).toBe('cat-camel');

      // Verify order properties are updated
      state.draftPlan.forEach((ex, idx) => {
        expect(ex.order).toBe(idx);
      });
    });

    it('should update exercise configuration', () => {
      usePTStore.getState().addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });

      // Update config
      usePTStore.getState().updateExerciseConfig('test-ex-1', {
        sets: 3,
        reps: 12,
      });

      const state = usePTStore.getState();
      expect(state.draftPlan[0].sets).toBe(3);
      expect(state.draftPlan[0].reps).toBe(12);
    });

    it('should clear draft plan', () => {
      const store = usePTStore.getState();

      // Add exercises to draft
      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });
      store.addExerciseToPlan({
        id: 'test-ex-2',
        exerciseId: 'bird-dog',
        name: 'Bird Dog',
        category: 'stability',
        sets: 3,
        reps: 8,
        order: 1,
      });

      expect(usePTStore.getState().draftPlan).toHaveLength(2);

      // Clear draft
      store.clearDraftPlan();

      expect(usePTStore.getState().draftPlan).toHaveLength(0);
    });
  });

  describe('Load Draft Plan', () => {
    it('should load existing plan into draft for editing', () => {
      const store = usePTStore.getState();
      const patientWithPlan = mockPatients.find(p => p.currentPlan);

      if (!patientWithPlan) {
        throw new Error('Test setup error: No patient with currentPlan found');
      }

      expect(store.draftPlan).toHaveLength(0);

      store.loadDraftPlan(patientWithPlan.id);

      const state = usePTStore.getState();
      expect(state.draftPlan.length).toBe(patientWithPlan.currentPlan!.exercises.length);
    });

    it('should clear draft when loading plan for patient without a plan', () => {
      const store = usePTStore.getState();

      // Pre-populate draft
      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });

      expect(usePTStore.getState().draftPlan).toHaveLength(1);

      // Load for non-existent patient
      store.loadDraftPlan('non-existent-patient');

      expect(usePTStore.getState().draftPlan).toHaveLength(0);
    });
  });

  describe('Save Plan', () => {
    it('should save draft plan to patient', () => {
      const store = usePTStore.getState();
      const patientId = 'pt-001';

      // Add exercises to draft
      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });
      store.addExerciseToPlan({
        id: 'test-ex-2',
        exerciseId: 'bird-dog',
        name: 'Bird Dog',
        category: 'stability',
        sets: 3,
        reps: 8,
        order: 1,
      });

      // Save plan
      store.savePlan(patientId, 'New Recovery Plan');

      // Verify patient has updated plan
      const patient = usePTStore.getState().getPatientById(patientId);
      expect(patient?.currentPlan).toBeDefined();
      expect(patient?.currentPlan?.name).toBe('New Recovery Plan');
      expect(patient?.currentPlan?.exercises).toHaveLength(2);
      expect(patient?.currentPlan?.status).toBe('pending_review');
      expect(patient?.currentPlan?.notes).toBe('Created by PT');
    });

    it('should clear draft plan after saving', () => {
      const store = usePTStore.getState();

      // Add exercise to draft
      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });

      expect(usePTStore.getState().draftPlan).toHaveLength(1);

      // Save plan
      store.savePlan('pt-001', 'Test Plan');

      // Draft should be cleared
      expect(usePTStore.getState().draftPlan).toHaveLength(0);
    });

    it('should generate plan ID with expected format', () => {
      const store = usePTStore.getState();

      // Add exercise and save plan
      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });
      store.savePlan('pt-001', 'Test Plan');

      const planId = usePTStore.getState().getPatientById('pt-001')?.currentPlan?.id;

      // Plan ID should follow the expected format: plan-{timestamp}
      expect(planId).toBeDefined();
      expect(planId).toMatch(/^plan-\d+$/);
    });

    it('should generate unique plan IDs with advancing time', () => {
      vi.useFakeTimers();
      const store = usePTStore.getState();

      // Save first plan at time 1000
      vi.setSystemTime(1000);
      store.addExerciseToPlan({
        id: 'test-ex-1',
        exerciseId: 'cat-camel',
        name: 'Cat-Camel',
        category: 'mobility',
        sets: 2,
        reps: 10,
        order: 0,
      });
      store.savePlan('pt-001', 'Plan 1');
      const firstPlanId = usePTStore.getState().getPatientById('pt-001')?.currentPlan?.id;

      // Advance time and save second plan
      vi.setSystemTime(2000);
      store.addExerciseToPlan({
        id: 'test-ex-2',
        exerciseId: 'bird-dog',
        name: 'Bird Dog',
        category: 'stability',
        sets: 3,
        reps: 8,
        order: 0,
      });
      store.savePlan('pt-001', 'Plan 2');
      const secondPlanId = usePTStore.getState().getPatientById('pt-001')?.currentPlan?.id;

      expect(firstPlanId).toBe('plan-1000');
      expect(secondPlanId).toBe('plan-2000');
      expect(firstPlanId).not.toBe(secondPlanId);

      vi.useRealTimers();
    });
  });
});
