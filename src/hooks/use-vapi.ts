/**
 * useVapi Hook
 *
 * Manages Vapi SDK lifecycle and syncs events to voiceStore.
 * Provides methods for starting/stopping calls, injecting context, and TTS.
 */

'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import Vapi from '@vapi-ai/web';
import { useVoiceStore } from '@/stores/voice-store';
import { clientEnv } from '@/lib/env';

export interface UseVapiOptions {
  /** Assistant ID to use (defaults to env variable) */
  assistantId?: string;
  /** Called when connection state changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when user confirms they are ready (says "ready", "yes", etc.) */
  onUserReady?: () => void;
  /** Called when a function call is received from the LLM */
  onFunctionCall?: (name: string, args: Record<string, unknown>) => void;
}

export interface UseVapiReturn {
  /** Start a voice call with the assistant */
  start: (overrideAssistantId?: string, metadata?: Record<string, unknown>) => Promise<void>;
  /** Stop the current call */
  stop: () => void;
  /** Speak text immediately (bypasses LLM) */
  say: (text: string) => void;
  /** Inject context message for LLM to process */
  injectContext: (context: string) => void;
  /** Set microphone muted state */
  setMuted: (muted: boolean) => void;
  /** Whether currently connected to a call */
  isConnected: boolean;
  /** Whether the assistant is currently speaking */
  isSpeaking: boolean;
  /** Current volume level (0-1) */
  volumeLevel: number;
  /** Whether voice is enabled in config */
  isVoiceEnabled: boolean;
}

/**
 * Hook for managing Vapi voice AI integration
 *
 * @example
 * ```tsx
 * function VoiceCoach() {
 *   const { start, stop, isConnected, isSpeaking } = useVapi();
 *
 *   return (
 *     <button onClick={isConnected ? stop : () => start()}>
 *       {isConnected ? 'End Call' : 'Start Call'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useVapi(options: UseVapiOptions = {}): UseVapiReturn {
  const { assistantId, onConnectionChange, onError, onUserReady, onFunctionCall } = options;

  // Phrases that indicate user is ready to start
  const READY_PHRASES = ['ready', 'yes', "let's go", 'start', 'begin', 'ok', 'okay', 'yep', 'sure', 'go ahead'];

  // Store actions and state
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

  // Vapi instance ref (persists across renders)
  const vapiRef = useRef<Vapi | null>(null);
  const isInitializedRef = useRef(false);

  // Store callbacks in refs to prevent useEffect reinitializing when they change
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onErrorRef = useRef(onError);
  const onUserReadyRef = useRef(onUserReady);
  const onFunctionCallRef = useRef(onFunctionCall);
  onConnectionChangeRef.current = onConnectionChange;
  onErrorRef.current = onError;
  onUserReadyRef.current = onUserReady;
  onFunctionCallRef.current = onFunctionCall;

  // Check if voice is enabled
  const isVoiceEnabled = clientEnv.NEXT_PUBLIC_ENABLE_VOICE ?? true;

  // Initialize Vapi SDK
  useEffect(() => {
    if (!isVoiceEnabled) {
      return;
    }

    if (isInitializedRef.current) return;

    const publicKey = clientEnv.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error('[useVapi] NEXT_PUBLIC_VAPI_PUBLIC_KEY not configured');
      setError('Vapi public key not configured');
      return;
    }

    try {
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;
      isInitializedRef.current = true;

      // Connection events
      vapi.on('call-start', () => {
        setConnectionState('connected');
        setSpeakingStatus('listening');
        onConnectionChangeRef.current?.(true);
      });

      vapi.on('call-end', () => {
        setConnectionState('disconnected');
        setSpeakingStatus('idle');
        onConnectionChangeRef.current?.(false);
      });

      // Speech events
      vapi.on('speech-start', () => {
        setSpeakingStatus('speaking');
      });

      vapi.on('speech-end', () => {
        setSpeakingStatus('listening');
      });

      // Volume level for visualizations
      vapi.on('volume-level', (level: number) => {
        setVolumeLevel(level);
      });

      // Message/transcript events
      vapi.on('message', (message: VapiWebhookMessage) => {
        if (message.type === 'transcript') {
          const role = message.role === 'assistant' ? 'assistant' : 'user';
          addTranscript({
            role,
            content: message.transcript || '',
            timestamp: Date.now(),
          });

          // Detect user confirmation ("ready", "yes", etc.)
          if (role === 'user' && message.transcript) {
            const text = message.transcript.toLowerCase();
            const isReady = READY_PHRASES.some(phrase => text.includes(phrase));
            if (isReady) {
              onUserReadyRef.current?.();
            }
          }
        }

        // Handle function calls from the LLM
        if (message.type === 'function-call') {
          const functionName = message.functionCall?.name;
          const functionArgs = message.functionCall?.parameters || {};
          if (functionName) {
            onFunctionCallRef.current?.(functionName, functionArgs as Record<string, unknown>);
          }
        }
      });

      // Error handling
      vapi.on('error', (error: Error | unknown) => {
        console.error('[useVapi] Error:', error);
        const errorMessage = error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : 'Unknown Vapi error';
        setConnectionState('error');
        setError(errorMessage);
        onErrorRef.current?.(error instanceof Error ? error : new Error(errorMessage));
      });
    } catch (err) {
      console.error('[useVapi] Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Vapi');
    }

    // Cleanup function - ensures call is always disconnected
    const cleanup = () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
        isInitializedRef.current = false;
        reset();
      }
    };

    // Handle browser/tab close
    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [
    isVoiceEnabled,
    setConnectionState,
    setSpeakingStatus,
    setVolumeLevel,
    addTranscript,
    setError,
    reset,
  ]);

  // Start a call
  const start = useCallback(
    async (overrideAssistantId?: string, metadata?: Record<string, unknown>) => {
      if (!vapiRef.current) {
        console.error('[useVapi] Vapi not initialized');
        setError('Vapi not initialized');
        return;
      }

      const targetAssistantId =
        overrideAssistantId ||
        assistantId ||
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      if (!targetAssistantId) {
        console.error('[useVapi] No assistant ID provided');
        setError('No assistant ID configured');
        return;
      }

      try {
        setConnectionState('connecting');

        await vapiRef.current.start(targetAssistantId, {
          metadata,
        });
      } catch (err) {
        console.error('[useVapi] Failed to start call:', err);
        setConnectionState('error');
        setError(err instanceof Error ? err.message : 'Failed to start call');
      }
    },
    [assistantId, setConnectionState, setError]
  );

  // Stop the current call
  const stop = useCallback(() => {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.stop();
    } catch (err) {
      console.error('[useVapi] Failed to stop call:', err);
    }
  }, []);

  // Speak text immediately (bypasses LLM)
  const say = useCallback((text: string) => {
    if (!vapiRef.current) {
      return;
    }

    try {
      vapiRef.current.say(text);
    } catch (err) {
      console.error('[useVapi] Failed to say:', err);
    }
  }, []);

  // Inject context message for LLM
  const injectContext = useCallback((context: string) => {
    if (!vapiRef.current) {
      return;
    }

    try {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: context,
        },
        triggerResponseEnabled: true,
      });
    } catch (err) {
      console.error('[useVapi] Failed to inject context:', err);
    }
  }, []);

  // Set muted state
  const setMuted = useCallback(
    (muted: boolean) => {
      if (!vapiRef.current) return;

      try {
        vapiRef.current.setMuted(muted);
        setStoreMuted(muted);
      } catch (err) {
        console.error('[useVapi] Failed to set muted:', err);
      }
    },
    [setStoreMuted]
  );

  // Computed values
  const isConnected = connectionState === 'connected';
  const isSpeaking = speakingStatus === 'speaking';

  return useMemo(
    () => ({
      start,
      stop,
      say,
      injectContext,
      setMuted,
      isConnected,
      isSpeaking,
      volumeLevel,
      isVoiceEnabled,
    }),
    [
      start,
      stop,
      say,
      injectContext,
      setMuted,
      isConnected,
      isSpeaking,
      volumeLevel,
      isVoiceEnabled,
    ]
  );
}

// Type for Vapi webhook message events
interface VapiWebhookMessage {
  type: 'transcript' | 'function-call' | 'hang' | string;
  role?: 'user' | 'assistant' | 'system';
  transcript?: string;
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

export default useVapi;
