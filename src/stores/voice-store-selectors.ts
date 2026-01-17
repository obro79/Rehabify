/**
 * Voice Store Selectors
 *
 * Reusable selectors for useVoiceStore(selector) to prevent unnecessary re-renders.
 */

import type { VoiceState, ConnectionState, SpeakingStatus } from './voice-store';

// Atomic Selectors

export const selectConnectionState = (state: VoiceState): ConnectionState => state.connectionState;
export const selectSpeakingStatus = (state: VoiceState): SpeakingStatus => state.speakingStatus;
export const selectIsMuted = (state: VoiceState): boolean => state.isMuted;
export const selectVolumeLevel = (state: VoiceState): number => state.volumeLevel;
export const selectTranscript = (state: VoiceState) => state.transcript;
export const selectLastSpokenFeedback = (state: VoiceState): string | null => state.lastSpokenFeedback;
export const selectError = (state: VoiceState): string | null => state.error;

// Derived Selectors

export function selectIsConnected(state: VoiceState): boolean {
  return state.connectionState === 'connected';
}

export function selectIsActive(state: VoiceState): boolean {
  return state.connectionState === 'connected' && !state.isMuted;
}

// Voice Indicator (combines connection, speaking, and mute state)

export type VoiceIndicatorState =
  | 'disconnected'
  | 'connecting'
  | 'error'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted';

export function selectVoiceIndicatorState(state: VoiceState): VoiceIndicatorState {
  if (state.connectionState === 'disconnected') return 'disconnected';
  if (state.connectionState === 'connecting') return 'connecting';
  if (state.connectionState === 'error') return 'error';
  if (state.isMuted) return 'muted';
  return state.speakingStatus;
}

/** Returns the last N transcript entries (default: 5) */
export function selectRecentTranscripts(count: number = 5) {
  return (state: VoiceState) => state.transcript.slice(-count);
}
