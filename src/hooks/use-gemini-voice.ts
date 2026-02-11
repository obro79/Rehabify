/**
 * useGeminiVoice Hook
 *
 * Drop-in replacement for useVapi. Manages GeminiLiveSessionManager lifecycle
 * and syncs events to voiceStore. Provides methods for starting/stopping
 * sessions, injecting context, and TTS.
 */

'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useVoiceStore } from '@/stores/voice-store';
import { clientEnv } from '@/lib/env';
import { GeminiLiveSessionManager } from '@/lib/gemini-live/session-manager';
import { isReadyPhrase } from '@/lib/gemini-live/constants';
import type { UseVoiceOptions, UseVoiceReturn, GeminiLiveConfig } from '@/lib/gemini-live/types';

export type { UseVoiceOptions, UseVoiceReturn };

/**
 * Hook for managing Gemini Live voice AI integration.
 * API-compatible replacement for useVapi.
 *
 * @example
 * ```tsx
 * function VoiceCoach() {
 *   const { start, stop, isConnected, isSpeaking } = useGeminiVoice();
 *
 *   return (
 *     <button onClick={isConnected ? stop : () => start()}>
 *       {isConnected ? 'End Call' : 'Start Call'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useGeminiVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { assistantId, onConnectionChange, onError, onUserReady, onFunctionCall } = options;

  const {
    connectionState,
    speakingStatus,
    volumeLevel,
    isMuted,
    setConnectionState,
    setSpeakingStatus,
    setVolumeLevel,
    addTranscript,
    setMuted: setStoreMuted,
    setError,
    reset,
  } = useVoiceStore();

  const managerRef = useRef<GeminiLiveSessionManager | null>(null);
  const callbackRefs = useRef({ onConnectionChange, onError, onUserReady, onFunctionCall });
  callbackRefs.current = { onConnectionChange, onError, onUserReady, onFunctionCall };

  const isVoiceEnabled = clientEnv.NEXT_PUBLIC_ENABLE_VOICE ?? true;

  // Lazy init the session manager
  useEffect(() => {
    if (!isVoiceEnabled) return;

    if (!managerRef.current) {
      managerRef.current = new GeminiLiveSessionManager();
    }

    return () => {
      managerRef.current?.disconnect();
      managerRef.current = null;
      reset();
    };
  }, [isVoiceEnabled, reset]);

  // Start a session - accepts either an assistant ID string or an inline config object
  const start = useCallback(async (
    assistantIdOrConfig?: string | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => {
    if (!managerRef.current) {
      setError('Voice not initialized');
      return;
    }

    try {
      setConnectionState('connecting');

      // Build config from inline config object or use defaults
      let config: GeminiLiveConfig = {};

      if (typeof assistantIdOrConfig === 'object' && assistantIdOrConfig !== null) {
        // Inline config (used by assessment hook)
        const c = assistantIdOrConfig;
        config = {
          systemInstruction: extractSystemInstruction(c),
          tools: extractTools(c),
          voiceName: extractVoiceName(c),
          firstMessage: c.firstMessage as string,
        };
      }

      await managerRef.current.connect(config, {
        onConnectionChange: (connected) => {
          setConnectionState(connected ? 'connected' : 'disconnected');
          setSpeakingStatus(connected ? 'listening' : 'idle');
          callbackRefs.current.onConnectionChange?.(connected);
        },
        onError: (error) => {
          setConnectionState('error');
          setError(error.message);
          callbackRefs.current.onError?.(error);
        },
        onTranscript: (role, text) => {
          addTranscript({ role, content: text, timestamp: Date.now() });
          // Check for ready phrases in user speech
          if (role === 'user') {
            if (isReadyPhrase(text)) {
              callbackRefs.current.onUserReady?.();
            }
          }
        },
        onFunctionCall: (name, args) => {
          callbackRefs.current.onFunctionCall?.(name, args);
        },
        onSpeakingChange: (speaking) => {
          setSpeakingStatus(speaking ? 'speaking' : 'listening');
        },
        onVolumeChange: (level) => {
          setVolumeLevel(level);
        },
      });
    } catch (err) {
      console.error('[useGeminiVoice] Failed to start:', err);
      setConnectionState('error');
      setError(err instanceof Error ? err.message : 'Failed to start voice session');
    }
  }, [setConnectionState, setSpeakingStatus, setVolumeLevel, addTranscript, setError]);

  // Stop the current session
  const stop = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  // Speak text (via model instruction)
  const say = useCallback((text: string) => {
    managerRef.current?.say(text);
  }, []);

  // Inject context message for the model
  const injectContext = useCallback((context: string) => {
    managerRef.current?.sendContext(context);
  }, []);

  // Set microphone muted state
  const setMuted = useCallback((muted: boolean) => {
    managerRef.current?.setMuted(muted);
    setStoreMuted(muted);
  }, [setStoreMuted]);

  const isConnected = connectionState === 'connected';
  const isSpeaking = speakingStatus === 'speaking';

  return useMemo(() => ({
    start,
    stop,
    say,
    injectContext,
    setMuted,
    isConnected,
    isSpeaking,
    volumeLevel,
    isVoiceEnabled,
  }), [start, stop, say, injectContext, setMuted, isConnected, isSpeaking, volumeLevel, isVoiceEnabled]);
}

// Helper: extract system instruction from Vapi-style inline config
function extractSystemInstruction(config: Record<string, unknown>): string | undefined {
  const model = config.model as Record<string, unknown> | undefined;
  if (!model) return undefined;
  const messages = model.messages as Array<{ role: string; content: string }> | undefined;
  return messages?.find(m => m.role === 'system')?.content;
}

// Helper: extract tools from Vapi-style inline config -> Gemini FunctionDeclaration format
function extractTools(config: Record<string, unknown>): any[] | undefined {
  const model = config.model as Record<string, unknown> | undefined;
  if (!model) return undefined;
  const tools = model.tools as Array<{ type: string; function: Record<string, unknown> }> | undefined;
  if (!tools) return undefined;

  return tools
    .filter(t => t.type === 'function')
    .map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }));
}

// Helper: extract voice name from Vapi-style inline config
function extractVoiceName(config: Record<string, unknown>): string | undefined {
  // Vapi uses { voice: { provider: '11labs', voiceId: 'sarah' } }
  // Map to Gemini voice names: default to 'Kore' (warm female voice)
  const voice = config.voice as Record<string, unknown> | undefined;
  if (voice?.voiceId === 'sarah') return 'Kore';
  return 'Kore'; // default
}

export default useGeminiVoice;
