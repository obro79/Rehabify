/**
 * Session Persistence Tests
 *
 * Tests for localStorage-based session crash recovery.
 * Mocks localStorage for test isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionState } from '@/stores/session-store';
import {
  persist,
  restore,
  clearPersisted,
  serializeSession,
  deserializeSession,
  STORAGE_KEYS,
  RESUME_WINDOW_MS,
} from '../session-persistence';

// Mock localStorage
const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _store: store, // For direct access in tests
  };
};

// Sample session state for testing
const createSampleSessionState = (): SessionState => ({
  sessionId: 'test-session-123',
  startedAt: Date.now() - 60000, // Started 1 minute ago
  pausedAt: null,
  isPaused: false,
  totalReps: 15,
  averageFormScore: 85,
  totalDuration: 120,
  exerciseHistory: [
    {
      exerciseId: 'ex-1',
      exerciseName: 'Cat-Camel',
      reps: 10,
      sets: 2,
      formScore: 85,
      duration: 60,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
  ],
  currentExerciseIndex: 1,
  planId: 'plan-456',
  planExercises: ['ex-1', 'ex-2', 'ex-3'],
});

describe('session-persistence', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  describe('persist', () => {
    it('writes session state to localStorage', () => {
      const state = createSampleSessionState();

      const result = persist(state);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.session,
        expect.any(String)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.timestamp,
        expect.any(String)
      );

      // Verify the stored JSON is valid
      const storedSession = mockLocalStorage._store[STORAGE_KEYS.session];
      expect(() => JSON.parse(storedSession)).not.toThrow();
    });

    it('returns false when sessionId is null', () => {
      const state = createSampleSessionState();
      state.sessionId = null;

      const result = persist(state);

      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles localStorage quota exceeded errors gracefully', () => {
      const state = createSampleSessionState();
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should not throw, just return false
      const result = persist(state);
      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('returns valid session within 5-minute window', () => {
      const state = createSampleSessionState();
      const serialized = serializeSession(state);
      const timestamp = Date.now().toString(); // Just now

      mockLocalStorage._store[STORAGE_KEYS.session] = serialized;
      mockLocalStorage._store[STORAGE_KEYS.timestamp] = timestamp;

      const restored = restore();

      expect(restored).not.toBeNull();
      expect(restored?.sessionId).toBe(state.sessionId);
      expect(restored?.totalReps).toBe(state.totalReps);
      expect(restored?.exerciseHistory).toHaveLength(1);
    });

    it('returns null for sessions older than 5 minutes', () => {
      const state = createSampleSessionState();
      const serialized = serializeSession(state);
      // Set timestamp to 6 minutes ago (beyond 5-minute window)
      const staleTimestamp = (Date.now() - RESUME_WINDOW_MS - 60000).toString();

      mockLocalStorage._store[STORAGE_KEYS.session] = serialized;
      mockLocalStorage._store[STORAGE_KEYS.timestamp] = staleTimestamp;

      const restored = restore();

      expect(restored).toBeNull();
      // Should have cleared the stale data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.session);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.timestamp);
    });

    it('returns null when no session is persisted', () => {
      const restored = restore();
      expect(restored).toBeNull();
    });
  });

  describe('clearPersisted', () => {
    it('removes localStorage keys', () => {
      mockLocalStorage._store[STORAGE_KEYS.session] = 'test-data';
      mockLocalStorage._store[STORAGE_KEYS.timestamp] = '12345';

      clearPersisted();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.session);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.timestamp);
    });
  });

  describe('serialization', () => {
    it('excludes function properties and only serializes data', () => {
      const state = createSampleSessionState();

      const serialized = serializeSession(state);
      const parsed = JSON.parse(serialized);

      // Verify all data properties are present
      expect(parsed.sessionId).toBe(state.sessionId);
      expect(parsed.totalReps).toBe(state.totalReps);
      expect(parsed.exerciseHistory).toEqual(state.exerciseHistory);

      // Verify no function properties exist
      Object.values(parsed).forEach((value) => {
        expect(typeof value).not.toBe('function');
      });
    });

    it('deserializes back to complete SessionState', () => {
      const state = createSampleSessionState();
      const serialized = serializeSession(state);

      const deserialized = deserializeSession(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized?.sessionId).toBe(state.sessionId);
      expect(deserialized?.startedAt).toBe(state.startedAt);
      expect(deserialized?.pausedAt).toBe(state.pausedAt);
      expect(deserialized?.isPaused).toBe(state.isPaused);
      expect(deserialized?.totalReps).toBe(state.totalReps);
      expect(deserialized?.averageFormScore).toBe(state.averageFormScore);
      expect(deserialized?.totalDuration).toBe(state.totalDuration);
      expect(deserialized?.exerciseHistory).toEqual(state.exerciseHistory);
      expect(deserialized?.currentExerciseIndex).toBe(state.currentExerciseIndex);
      expect(deserialized?.planId).toBe(state.planId);
      expect(deserialized?.planExercises).toEqual(state.planExercises);
    });

    it('returns null for invalid JSON', () => {
      const result = deserializeSession('not valid json');
      expect(result).toBeNull();
    });
  });
});
