/**
 * Vapi Constants and Types
 *
 * Shared constants and type definitions for Vapi integration.
 */

/** Phrases that indicate user is ready to start */
export const READY_PHRASES = [
  'ready',
  'yes',
  "let's go",
  'start',
  'begin',
  'ok',
  'okay',
  'yep',
  'sure',
  'go ahead',
] as const;

/** Vapi webhook message event types */
export interface VapiWebhookMessage {
  type: 'transcript' | 'function-call' | 'hang' | string;
  role?: 'user' | 'assistant' | 'system';
  transcript?: string;
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

/** Check if text contains a ready phrase */
export function isReadyPhrase(text: string): boolean {
  const lowered = text.toLowerCase();
  return READY_PHRASES.some((phrase) => lowered.includes(phrase));
}

/** Extract error message from unknown error */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) return JSON.stringify(error);
  return 'Unknown Vapi error';
}
