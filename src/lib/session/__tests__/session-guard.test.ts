/**
 * Session Guard Tests
 *
 * Tests for multi-tab blocking functionality using BroadcastChannel.
 * BroadcastChannel is mocked since it's a browser API.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SessionGuard,
  CHANNEL_NAME,
  MESSAGE_TYPES,
  type SessionGuardMessage,
} from '../session-guard';

// Mock BroadcastChannel with synchronous message delivery for deterministic testing
class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(message: SessionGuardMessage): void {
    if (this.closed) return;

    // Deliver messages synchronously for deterministic testing
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

describe('SessionGuard', () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('claim() succeeds when no other tab has session', async () => {
    const guard = new SessionGuard();

    const claimPromise = guard.claim();

    // Advance timers past the 300ms claim timeout
    await vi.advanceTimersByTimeAsync(350);

    const result = await claimPromise;

    expect(result).toBe(true);
    expect(guard.isOwner).toBe(true);
    expect(guard.hasConflict).toBe(false);

    guard.destroy();
  });

  it('claim() fails when another tab responds with CONFLICT', async () => {
    // First guard claims ownership
    const ownerGuard = new SessionGuard();
    const ownerClaimPromise = ownerGuard.claim();
    await vi.advanceTimersByTimeAsync(350);
    await ownerClaimPromise;

    expect(ownerGuard.isOwner).toBe(true);

    // Second guard tries to claim
    // The CLAIM message will be sent immediately (synchronous mock)
    // and owner will respond with CONFLICT synchronously
    const secondGuard = new SessionGuard();
    const secondClaimPromise = secondGuard.claim();

    // Advance timers past the claim timeout
    await vi.advanceTimersByTimeAsync(350);

    const secondResult = await secondClaimPromise;

    expect(secondResult).toBe(false);
    expect(secondGuard.isOwner).toBe(false);
    expect(secondGuard.hasConflict).toBe(true);

    ownerGuard.destroy();
    secondGuard.destroy();
  });

  it('release() allows other tabs to claim', async () => {
    // First guard claims and then releases
    const firstGuard = new SessionGuard();
    const firstClaimPromise = firstGuard.claim();
    await vi.advanceTimersByTimeAsync(350);
    await firstClaimPromise;

    expect(firstGuard.isOwner).toBe(true);

    // Release ownership
    firstGuard.release();

    expect(firstGuard.isOwner).toBe(false);

    // Second guard should now be able to claim
    const secondGuard = new SessionGuard();
    const secondClaimPromise = secondGuard.claim();
    await vi.advanceTimersByTimeAsync(350);
    const secondResult = await secondClaimPromise;

    expect(secondResult).toBe(true);
    expect(secondGuard.isOwner).toBe(true);

    firstGuard.destroy();
    secondGuard.destroy();
  });

  it('heartbeat keeps session ownership alive', async () => {
    const guard = new SessionGuard();
    const claimPromise = guard.claim();
    await vi.advanceTimersByTimeAsync(350);
    await claimPromise;

    expect(guard.isOwner).toBe(true);

    // Create a listener to track heartbeat messages
    const heartbeatMessages: SessionGuardMessage[] = [];
    const listenerChannel = new MockBroadcastChannel(CHANNEL_NAME);
    listenerChannel.onmessage = (event: MessageEvent<SessionGuardMessage>) => {
      if (event.data.type === MESSAGE_TYPES.HEARTBEAT) {
        heartbeatMessages.push(event.data);
      }
    };

    // Advance time to trigger heartbeat (10 seconds)
    await vi.advanceTimersByTimeAsync(10_000);

    expect(heartbeatMessages.length).toBeGreaterThanOrEqual(1);
    expect(heartbeatMessages[0].type).toBe(MESSAGE_TYPES.HEARTBEAT);

    guard.destroy();
    listenerChannel.close();
  });

  it('onMessage handles CLAIM/CONFLICT/RELEASE correctly', async () => {
    // Test CLAIM handling - owner responds with CONFLICT
    const ownerGuard = new SessionGuard();
    const ownerClaimPromise = ownerGuard.claim();
    await vi.advanceTimersByTimeAsync(350);
    await ownerClaimPromise;

    expect(ownerGuard.isOwner).toBe(true);

    // Track if conflict is sent
    const conflictMessages: SessionGuardMessage[] = [];
    const observerChannel = new MockBroadcastChannel(CHANNEL_NAME);
    observerChannel.onmessage = (event: MessageEvent<SessionGuardMessage>) => {
      if (event.data.type === MESSAGE_TYPES.CONFLICT) {
        conflictMessages.push(event.data);
      }
    };

    // Simulate another tab sending CLAIM
    const claimMessage: SessionGuardMessage = {
      type: MESSAGE_TYPES.CLAIM,
      sessionId: 'other-session-id',
      timestamp: Date.now(),
    };

    // Send claim from observer - owner should respond with CONFLICT synchronously
    observerChannel.postMessage(claimMessage);

    // Owner should have responded with CONFLICT
    expect(conflictMessages.length).toBe(1);
    expect(conflictMessages[0].type).toBe(MESSAGE_TYPES.CONFLICT);

    // Test RELEASE handling - conflict flag should clear
    ownerGuard.release();

    // New guard should be able to claim after release
    const newGuard = new SessionGuard();
    const newClaimPromise = newGuard.claim();
    await vi.advanceTimersByTimeAsync(350);
    const newResult = await newClaimPromise;

    expect(newResult).toBe(true);
    expect(newGuard.hasConflict).toBe(false);

    ownerGuard.destroy();
    newGuard.destroy();
    observerChannel.close();
  });
});
