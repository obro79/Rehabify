/**
 * Voice Store
 *
 * Tracks Vapi connection state, speaking status, and transcripts for UI display.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type SpeakingStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface VoiceState {
  connectionState: ConnectionState;
  error: string | null;
  speakingStatus: SpeakingStatus;
  volumeLevel: number;
  transcript: TranscriptEntry[];
  lastSpokenFeedback: string | null;
  isMuted: boolean;
}

export interface VoiceActions {
  setConnectionState: (state: ConnectionState) => void;
  setError: (error: string | null) => void;
  setSpeakingStatus: (status: SpeakingStatus) => void;
  setVolumeLevel: (level: number) => void;
  addTranscript: (entry: TranscriptEntry) => void;
  setLastSpokenFeedback: (feedback: string) => void;
  clearTranscripts: () => void;
  setMuted: (muted: boolean) => void;
  reset: () => void;
}

const initialState: VoiceState = {
  connectionState: 'disconnected',
  error: null,
  speakingStatus: 'idle',
  volumeLevel: 0,
  transcript: [],
  lastSpokenFeedback: null,
  isMuted: false,
};

export const useVoiceStore = create<VoiceState & VoiceActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setConnectionState: (connectionState) => set({ connectionState }),
      setError: (error) => set({ error }),
      setSpeakingStatus: (speakingStatus) => set({ speakingStatus }),

      setVolumeLevel: (level) => {
        set({ volumeLevel: Math.max(0, Math.min(1, level)) });
      },

      addTranscript: (entry) =>
        set((state) => ({ transcript: [...state.transcript, entry] })),

      setLastSpokenFeedback: (lastSpokenFeedback) => set({ lastSpokenFeedback }),
      clearTranscripts: () => set({ transcript: [] }),
      setMuted: (isMuted) => set({ isMuted }),
      reset: () => set(initialState),
    }),
    { name: 'voice-store', enabled: process.env.NODE_ENV === 'development' }
  )
);
