/**
 * Vapi Event Handlers
 *
 * Factory functions that create event handlers for Vapi SDK events.
 * Separates event handling logic from the main hook.
 */

import type { MutableRefObject } from 'react';
import type Vapi from '@vapi-ai/web';
import type { VoiceActions } from '@/stores/voice-store';
import { VapiMessage, isReadyPhrase, extractErrorMessage } from './constants';

export interface VapiCallbacks {
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
  onUserReady?: () => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>) => void;
}

export interface VapiCallbackRefs {
  onConnectionChange: MutableRefObject<VapiCallbacks['onConnectionChange']>;
  onError: MutableRefObject<VapiCallbacks['onError']>;
  onUserReady: MutableRefObject<VapiCallbacks['onUserReady']>;
  onFunctionCall: MutableRefObject<VapiCallbacks['onFunctionCall']>;
}

export interface HandlerDeps {
  store: Pick<
    VoiceActions,
    'setConnectionState' | 'setSpeakingStatus' | 'setVolumeLevel' | 'addTranscript' | 'setError'
  >;
  callbackRefs: VapiCallbackRefs;
}

/** Attach all event handlers to a Vapi instance */
export function attachVapiHandlers(vapi: Vapi, deps: HandlerDeps): void {
  const { store, callbackRefs } = deps;

  vapi.on('call-start', () => {
    console.log('[useVapi] Call started');
    store.setConnectionState('connected');
    store.setSpeakingStatus('listening');
    callbackRefs.onConnectionChange.current?.(true);
  });

  vapi.on('call-end', () => {
    console.log('[useVapi] Call ended');
    store.setConnectionState('disconnected');
    store.setSpeakingStatus('idle');
    callbackRefs.onConnectionChange.current?.(false);
  });

  vapi.on('speech-start', () => {
    store.setSpeakingStatus('speaking');
  });

  vapi.on('speech-end', () => {
    store.setSpeakingStatus('listening');
  });

  vapi.on('volume-level', (level: number) => {
    store.setVolumeLevel(level);
  });

  vapi.on('message', (message: VapiMessage) => {
    handleMessage(message, store, callbackRefs);
  });

  vapi.on('error', (error: Error | unknown) => {
    handleError(error, store, callbackRefs.onError);
  });
}

function handleMessage(
  message: VapiMessage,
  store: HandlerDeps['store'],
  callbackRefs: HandlerDeps['callbackRefs']
): void {
  if (message.type === 'transcript') {
    const role = message.role === 'assistant' ? 'assistant' : 'user';
    store.addTranscript({
      role,
      content: message.transcript ?? '',
      timestamp: Date.now(),
    });

    if (role === 'user' && message.transcript && isReadyPhrase(message.transcript)) {
      callbackRefs.onUserReady.current?.();
    }
  }

  if (message.type === 'function-call' && message.functionCall?.name) {
    const { name, parameters = {} } = message.functionCall;
    callbackRefs.onFunctionCall.current?.(name, parameters as Record<string, unknown>);
  }
}

function handleError(
  error: Error | unknown,
  store: HandlerDeps['store'],
  onErrorRef: MutableRefObject<VapiCallbacks['onError']>
): void {
  console.error('[useVapi] Error:', error);
  const errorMessage = extractErrorMessage(error);
  store.setConnectionState('error');
  store.setError(errorMessage);
  onErrorRef.current?.(error instanceof Error ? error : new Error(errorMessage));
}
