// Type Guards - Runtime validation for shared types
// Used at API boundaries for safe type narrowing

import type { FormError, FormAnalysis } from './vision';
import type { VapiMessage } from './voice';
import type { SessionState } from './session';
import type { ApiError } from './common';

/**
 * Type guard for FormError
 */
export function isFormError(obj: unknown): obj is FormError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'message' in obj &&
    'severity' in obj &&
    'timestamp' in obj &&
    typeof (obj as FormError).type === 'string' &&
    typeof (obj as FormError).message === 'string' &&
    typeof (obj as FormError).timestamp === 'number'
  );
}

/**
 * Type guard for FormAnalysis
 */
export function isFormAnalysis(obj: unknown): obj is FormAnalysis {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'isCorrect' in obj &&
    'phase' in obj &&
    'errors' in obj &&
    'repCount' in obj &&
    'formScore' in obj &&
    typeof (obj as FormAnalysis).isCorrect === 'boolean' &&
    typeof (obj as FormAnalysis).phase === 'string' &&
    Array.isArray((obj as FormAnalysis).errors) &&
    typeof (obj as FormAnalysis).repCount === 'number' &&
    typeof (obj as FormAnalysis).formScore === 'number'
  );
}

/**
 * Type guard for VapiMessage
 */
export function isVapiMessage(obj: unknown): obj is VapiMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'content' in obj &&
    'role' in obj &&
    typeof (obj as VapiMessage).type === 'string' &&
    typeof (obj as VapiMessage).content === 'string' &&
    typeof (obj as VapiMessage).role === 'string'
  );
}

/**
 * Type guard for SessionState
 */
export function isSessionState(obj: unknown): obj is SessionState {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    'exercises' in obj &&
    'results' in obj &&
    'metrics' in obj &&
    Array.isArray((obj as SessionState).exercises) &&
    Array.isArray((obj as SessionState).results)
  );
}

/**
 * Type guard for ApiError
 */
export function isApiError(obj: unknown): obj is ApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'message' in obj &&
    typeof (obj as ApiError).code === 'string' &&
    typeof (obj as ApiError).message === 'string'
  );
}
