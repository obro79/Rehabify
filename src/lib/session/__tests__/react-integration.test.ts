/**
 * React Integration Tests
 *
 * Tests for React hooks and store integration functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExerciseStore } from '@/stores/exercise-store';
import { useSessionStore } from '@/stores/session-store';
import { selectRepCount, selectPhase } from '@/stores/exercise-store-selectors';
import { STORAGE_KEYS } from '../session-persistence';

// Mock BroadcastChannel for session guard tests
class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(message: unknown): void {
    if (this.closed) return;
    const otherInstances = MockBroadcastChannel.instances.filter(
      (instance) => instance !== this && !instance.closed && instance.onmessage
    );
    for (const instance of otherInstances) {
      instance.onmessage!(new MessageEvent('message', { data: message }));
    }
  }

  close(): void {
    this.closed = true;
    const index = MockBroadcastChannel.instances.indexOf(this);
    if (index > -1) {
      MockBroadcastChannel.instances.splice(index, 1);
    }
  }

  static reset(): void {
    MockBroadcastChannel.instances = [];
  }
}

// Setup global mocks
vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2)}`,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('React Integration', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useExerciseStore.getState().reset();
    useSessionStore.getState().reset();
    localStorageMock.clear();
    MockBroadcastChannel.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Store Selectors', () => {
    it('selector only triggers re-render when subscribed slice changes', () => {
      const renderCounts = { repCount: 0, phase: 0 };

      // Render hook that subscribes to repCount
      const { result: repResult } = renderHook(() => {
        renderCounts.repCount++;
        return useExerciseStore(selectRepCount);
      });

      // Render hook that subscribes to phase
      const { result: phaseResult } = renderHook(() => {
        renderCounts.phase++;
        return useExerciseStore(selectPhase);
      });

      // Initial render count
      expect(renderCounts.repCount).toBe(1);
      expect(renderCounts.phase).toBe(1);

      // Update repCount - should only trigger repCount subscriber
      act(() => {
        useExerciseStore.getState().incrementRep();
      });

      expect(repResult.current).toBe(1);
      expect(renderCounts.repCount).toBe(2);
      // Phase subscriber should not re-render
      expect(renderCounts.phase).toBe(1);

      // Update phase - should only trigger phase subscriber
      act(() => {
        useExerciseStore.getState().setPhase('cat');
      });

      expect(phaseResult.current).toBe('cat');
      expect(renderCounts.phase).toBe(2);
      // RepCount subscriber should not re-render for phase change
      expect(renderCounts.repCount).toBe(2);
    });

    it('store subscription cleanup on component unmount', () => {
      const { unmount } = renderHook(() => useExerciseStore(selectRepCount));

      // Store should work after unmount
      unmount();

      // Verify store still works (no errors thrown)
      act(() => {
        useExerciseStore.getState().incrementRep();
      });

      expect(useExerciseStore.getState().repCount).toBe(1);
    });
  });

  describe('useSessionResume', () => {
    it('returns correct modal state when recoverable session exists', async () => {
      // Import the hook after mocks are set up
      const { useSessionResume } = await import('@/hooks/useSessionResume');

      // Set up a valid persisted session
      const mockSession = {
        sessionId: 'test-session-123',
        startedAt: Date.now() - 60000, // 1 minute ago
        pausedAt: null,
        isPaused: false,
        totalReps: 10,
        averageFormScore: 85,
        totalDuration: 60,
        exerciseHistory: [],
        currentExerciseIndex: 0,
        planId: null,
        planExercises: [],
      };

      localStorageMock.setItem(STORAGE_KEYS.session, JSON.stringify(mockSession));
      localStorageMock.setItem(STORAGE_KEYS.timestamp, Date.now().toString());

      const { result } = renderHook(() => useSessionResume());

      // Wait for initial effect to complete
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.hasRecoverableSession).toBe(true);
      expect(result.current.restoredSession).not.toBeNull();
      expect(result.current.restoredSession?.sessionId).toBe('test-session-123');
      expect(result.current.sessionAge).not.toBeNull();
      expect(result.current.timeRemaining).not.toBeNull();
    });

    it('returns no recoverable session when storage is empty', async () => {
      const { useSessionResume } = await import('@/hooks/useSessionResume');

      const { result } = renderHook(() => useSessionResume());

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.hasRecoverableSession).toBe(false);
      expect(result.current.restoredSession).toBeNull();
      expect(result.current.sessionAge).toBeNull();
    });
  });

  describe('useMultiTabGuard', () => {
    it('shows blocking state on conflict with another tab', async () => {
      // Reset the session guard module to get fresh instances
      vi.resetModules();

      // Re-import after reset to get fresh session guard
      const { useMultiTabGuard } = await import('@/hooks/useMultiTabGuard');
      const { SessionGuard } = await import('@/lib/session/session-guard');

      // Simulate another tab owning the session
      const otherTabGuard = new SessionGuard();

      // Have the other tab claim first
      const otherClaimPromise = otherTabGuard.claim();
      await vi.advanceTimersByTimeAsync(350);
      await otherClaimPromise;

      expect(otherTabGuard.isOwner).toBe(true);

      // Now render our hook - it will try to claim and fail
      const { result } = renderHook(() => useMultiTabGuard(true));

      // Wait for claim attempt to complete
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      // Should have conflict since other tab owns it
      expect(result.current.hasConflict).toBe(true);
      expect(result.current.isOwner).toBe(false);

      otherTabGuard.destroy();
    });
  });
});
