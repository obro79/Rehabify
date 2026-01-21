/**
 * Vapi Integration
 *
 * Barrel export for Vapi-related utilities.
 */

export { READY_PHRASES, isReadyPhrase, extractErrorMessage } from './constants';
export type { VapiMessage } from './constants';

export { attachVapiHandlers } from './event-handlers';
export type { VapiCallbacks } from './event-handlers';
