// Voice Types - VoiceContext, VapiMessage, VoiceState
// Used by specs 12, 13

import type { FormError } from './vision';

/**
 * Roles for Vapi messages
 */
export type VapiMessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Message types for Vapi communication
 */
export type VapiMessageType =
  | 'add-message'
  | 'say'
  | 'function-call'
  | 'transcript'
  | 'hang';

/**
 * A message sent to or from Vapi
 */
export interface VapiMessage {
  type: VapiMessageType;
  content: string;
  role: VapiMessageRole;
  timestamp?: number;
}

/**
 * Context injected into Vapi for form corrections
 */
export interface VoiceContext {
  /** Currently active form errors (debounced) */
  activeErrors: FormError[];
  /** Current exercise being performed */
  currentExercise: {
    id: string;
    name: string;
    phase?: string;
  };
  /** Current rep count */
  repCount: number;
  /** Current form score 0-100 */
  formScore: number;
  /** Session duration in seconds */
  sessionDuration: number;
}

/**
 * Connection states for voice/Vapi
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/**
 * Voice store state (for Zustand)
 */
export interface VoiceState {
  connectionState: ConnectionState;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  lastMessage?: VapiMessage;
  error?: string;
}
