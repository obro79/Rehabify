/**
 * Voice Store Tests
 * Tests for voice-store functionality including connection state,
 * speaking status, transcript handling, and mute toggle.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVoiceStore } from '../voice-store';

describe('voice-store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useVoiceStore.getState().reset();
  });

  it('setConnectionState updates connectionState correctly', () => {
    const store = useVoiceStore.getState();

    // Initial state should be disconnected
    expect(store.connectionState).toBe('disconnected');

    // Update to connecting
    store.setConnectionState('connecting');
    expect(useVoiceStore.getState().connectionState).toBe('connecting');

    // Update to connected
    store.setConnectionState('connected');
    expect(useVoiceStore.getState().connectionState).toBe('connected');

    // Update to error
    store.setConnectionState('error');
    expect(useVoiceStore.getState().connectionState).toBe('error');
  });

  it('setSpeakingStatus cycles through idle/listening/thinking/speaking', () => {
    const store = useVoiceStore.getState();

    // Initial state should be idle
    expect(store.speakingStatus).toBe('idle');

    // Cycle through all statuses
    store.setSpeakingStatus('listening');
    expect(useVoiceStore.getState().speakingStatus).toBe('listening');

    store.setSpeakingStatus('thinking');
    expect(useVoiceStore.getState().speakingStatus).toBe('thinking');

    store.setSpeakingStatus('speaking');
    expect(useVoiceStore.getState().speakingStatus).toBe('speaking');

    // Back to idle
    store.setSpeakingStatus('idle');
    expect(useVoiceStore.getState().speakingStatus).toBe('idle');
  });

  it('addTranscript appends to transcript array', () => {
    const store = useVoiceStore.getState();

    // Initially empty
    expect(store.transcript).toHaveLength(0);

    // Add first transcript entry
    const entry1 = {
      role: 'user' as const,
      content: 'Hello, can you help me?',
      timestamp: Date.now(),
    };
    store.addTranscript(entry1);
    expect(useVoiceStore.getState().transcript).toHaveLength(1);
    expect(useVoiceStore.getState().transcript[0]).toEqual(entry1);

    // Add second transcript entry
    const entry2 = {
      role: 'assistant' as const,
      content: 'Of course! I am here to help with your exercises.',
      timestamp: Date.now() + 1000,
    };
    store.addTranscript(entry2);
    expect(useVoiceStore.getState().transcript).toHaveLength(2);
    expect(useVoiceStore.getState().transcript[1]).toEqual(entry2);
  });

  it('setMuted toggles isMuted boolean', () => {
    const store = useVoiceStore.getState();

    // Initial state should be not muted
    expect(store.isMuted).toBe(false);

    // Toggle to muted
    store.setMuted(true);
    expect(useVoiceStore.getState().isMuted).toBe(true);

    // Toggle back to unmuted
    store.setMuted(false);
    expect(useVoiceStore.getState().isMuted).toBe(false);
  });

  it('reset clears all voice state', () => {
    const store = useVoiceStore.getState();

    // Set various state values
    store.setConnectionState('connected');
    store.setError('Test error');
    store.setSpeakingStatus('speaking');
    store.setVolumeLevel(0.8);
    store.addTranscript({
      role: 'user',
      content: 'Test message',
      timestamp: Date.now(),
    });
    store.setLastSpokenFeedback('Great form!');
    store.setMuted(true);

    // Verify state is modified
    const modifiedState = useVoiceStore.getState();
    expect(modifiedState.connectionState).toBe('connected');
    expect(modifiedState.error).toBe('Test error');
    expect(modifiedState.speakingStatus).toBe('speaking');
    expect(modifiedState.volumeLevel).toBe(0.8);
    expect(modifiedState.transcript).toHaveLength(1);
    expect(modifiedState.lastSpokenFeedback).toBe('Great form!');
    expect(modifiedState.isMuted).toBe(true);

    // Reset and verify all values return to initial state
    store.reset();
    const resetState = useVoiceStore.getState();
    expect(resetState.connectionState).toBe('disconnected');
    expect(resetState.error).toBe(null);
    expect(resetState.speakingStatus).toBe('idle');
    expect(resetState.volumeLevel).toBe(0);
    expect(resetState.transcript).toHaveLength(0);
    expect(resetState.lastSpokenFeedback).toBe(null);
    expect(resetState.isMuted).toBe(false);
  });
});
