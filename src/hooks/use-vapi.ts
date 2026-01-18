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
      console.log('[useVapi] Voice disabled by config');
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
        console.log('[useVapi] Call started');
        setConnectionState('connected');
        setSpeakingStatus('listening');
        onConnectionChangeRef.current?.(true);
      });

      vapi.on('call-end', () => {
        console.log('[useVapi] Call ended');
        setConnectionState('disconnected');
        setSpeakingStatus('idle');
        onConnectionChangeRef.current?.(false);
      });

      // Speech events
      vapi.on('speech-start', () => {
        console.log('[useVapi] 🎤 Assistant started speaking');
        setSpeakingStatus('speaking');
      });

      vapi.on('speech-end', () => {
        console.log('[useVapi] 🎤 Assistant stopped speaking');
        setSpeakingStatus('listening');
      });

      // Volume level for visualizations
      vapi.on('volume-level', (level: number) => {
        setVolumeLevel(level);
      });

      // Message/transcript events
      vapi.on('message', (message: VapiMessage) => {
        console.log('[useVapi] 📨 Message received:', message.type, message);

        if (message.type === 'transcript') {
          const role = message.role === 'assistant' ? 'assistant' : 'user';
          console.log(`[useVapi] 💬 Transcript (${role}):`, message.transcript);
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
              console.log('[useVapi] ✅ User confirmed ready:', message.transcript);
              onUserReadyRef.current?.();
            }
          }
        }

        // Handle function calls from the LLM
        if (message.type === 'function-call') {
          console.log('[useVapi] 🔧 Function call:', message);
          const functionName = message.functionCall?.name;
          const functionArgs = message.functionCall?.parameters || {};
          if (functionName) {
            console.log(`[useVapi] 📝 Calling ${functionName} with:`, functionArgs);
            onFunctionCallRef.current?.(functionName, functionArgs as Record<string, unknown>);
          }
        }
      });

      // Error handling
      vapi.on('error', (error: Error | unknown) => {
        // Log full error details for debugging
        console.error('[useVapi] Error:', JSON.stringify(error, null, 2));
        console.error('[useVapi] Error type:', typeof error);
        if (error && typeof error === 'object') {
          console.error('[useVapi] Error keys:', Object.keys(error));
        }
        const errorMessage = error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : 'Unknown Vapi error';
        setConnectionState('error');
        setError(errorMessage);
        onErrorRef.current?.(error instanceof Error ? error : new Error(errorMessage));
      });

      console.log('[useVapi] Initialized successfully');
    } catch (err) {
      console.error('[useVapi] Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Vapi');
    }

    // Cleanup function - ensures call is always disconnected
    const cleanup = () => {
      if (vapiRef.current) {
        console.log('[useVapi] Cleanup: stopping call');
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
        console.log('[useVapi] Starting call with assistant:', targetAssistantId);

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
      console.log('[useVapi] Call stopped');
    } catch (err) {
      console.error('[useVapi] Failed to stop call:', err);
    }
  }, []);

  // Speak text immediately (bypasses LLM)
  const say = useCallback((text: string) => {
    if (!vapiRef.current) {
      console.warn('[useVapi] Cannot say - not connected');
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
      console.warn('[useVapi] ⚠️ Cannot inject context - not connected');
      return;
    }

    try {
      console.log('[useVapi] 📤 Sending context to LLM (triggerResponseEnabled=true)...');
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: context,
        },
        triggerResponseEnabled: true,
      });
      console.log('[useVapi] ✅ Context sent:', context.substring(0, 80) + '...');
    } catch (err) {
      console.error('[useVapi] ❌ Failed to inject context:', err);
    }
  }, []);

  // Set muted state
  const setMuted = useCallback(
    (muted: boolean) => {
      if (!vapiRef.current) return;

      try {
        vapiRef.current.setMuted(muted);
        setStoreMuted(muted);
        console.log('[useVapi] Muted:', muted);
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

// Type for Vapi message events
interface VapiMessage {
  type: 'transcript' | 'function-call' | 'hang' | string;
  role?: 'user' | 'assistant' | 'system';
  transcript?: string;
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

export default useVapi;
