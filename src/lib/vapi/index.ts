/**
 * Vapi Integration
 *
 * Barrel export for Vapi-related utilities.
 */

export { READY_PHRASES, isReadyPhrase, extractErrorMessage } from './constants';
export type { VapiWebhookMessage } from './constants';

export { attachVapiHandlers } from './event-handlers';
export type { VapiCallbacks } from './event-handlers';

export {
  parseToolArguments,
  processToolCalls,
  extractCallMetadata,
  createWebhookErrorResponse,
  createHealthCheckResponse,
} from './webhook-utils';
export type {
  VapiToolCall,
  VapiWebhookPayload,
  ToolResult,
  ToolHandler,
  ToolCallContext,
} from './webhook-utils';
