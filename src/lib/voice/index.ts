/**
 * Voice Module
 *
 * Exports for vision-to-voice integration.
 */

// Types
export * from './types';

// Debouncer
export { FormEventDebouncer, formEventDebouncer } from './form-event-debouncer';

// Bridge
export {
  FormEventBridge,
  createFormEventBridge,
  type VoiceMethods,
  type FormEventBridgeOptions,
} from './form-event-bridge';
