/**
 * Vapi Webhook Utilities
 *
 * Shared types and handlers for Vapi webhook routes.
 */

/**
 * A single tool call from Vapi
 */
export interface VapiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Standard Vapi webhook payload structure
 */
export interface VapiWebhookPayload {
  message?: {
    type:
      | 'tool-calls'
      | 'transcript'
      | 'end-of-call-report'
      | 'workflow-node-started'
      | string;
    toolCalls?: VapiToolCall[];
    role?: string;
    transcript?: string;
    call?: {
      id: string;
      metadata?: Record<string, unknown>;
    };
    // Workflow-specific fields
    node?: {
      id: string;
      name?: string;
    };
    extractedVariables?: Record<string, unknown>;
  };
  call?: {
    id: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Result from a tool call to return to Vapi
 */
export interface ToolResult {
  toolCallId: string;
  result: string;
}

/**
 * Handler function type for individual tool implementations
 */
export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolCallContext
) => Promise<Record<string, unknown>>;

/**
 * Context passed to tool handlers
 */
export interface ToolCallContext {
  callId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parse tool call arguments safely
 */
export function parseToolArguments(argsString: string): Record<string, unknown> {
  try {
    return JSON.parse(argsString || '{}');
  } catch {
    return {};
  }
}

/**
 * Process multiple tool calls with a handler map
 *
 * @param toolCalls - Array of tool calls from Vapi
 * @param handlers - Map of tool names to handler functions
 * @param context - Context to pass to handlers
 * @returns Array of tool results
 */
export async function processToolCalls(
  toolCalls: VapiToolCall[],
  handlers: Record<string, ToolHandler>,
  context: ToolCallContext
): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map(async (call) => {
      const { name, arguments: argsString } = call.function;
      const args = parseToolArguments(argsString);

      let result: Record<string, unknown>;

      const handler = handlers[name];
      if (handler) {
        result = await handler(args, context);
      } else {
        result = { error: `Unknown tool: ${name}` };
      }

      return {
        toolCallId: call.id,
        result: JSON.stringify(result),
      };
    })
  );
}

/**
 * Extract call metadata from Vapi webhook payload
 */
export function extractCallMetadata(body: VapiWebhookPayload): {
  callId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
} {
  const callMetadata = body.message?.call?.metadata || body.call?.metadata || {};
  const callId = body.message?.call?.id || body.call?.id;
  const sessionId = callMetadata.sessionId as string | undefined;

  return {
    callId,
    sessionId,
    metadata: callMetadata,
  };
}

/**
 * Create a standard webhook error response
 */
export function createWebhookErrorResponse(
  message: string,
  status = 500
): { error: string; status: number } {
  return { error: message, status };
}

/**
 * Create a standard health check response
 */
export function createHealthCheckResponse(
  serviceName: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    status: 'healthy',
    service: serviceName,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}
