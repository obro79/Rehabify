// Vapi Webhook Types - Shared types for Vapi webhook handlers

/**
 * A single tool call from Vapi
 */
export interface VapiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Webhook message types supported by Vapi
 */
export type VapiWebhookMessageType =
  | "tool-calls"
  | "transcript"
  | "end-of-call-report"
  | "workflow-node-started";

/**
 * Webhook payload received from Vapi
 */
export interface VapiWebhookPayload {
  message?: {
    type: VapiWebhookMessageType | string;
    toolCalls?: VapiToolCall[];
    role?: string;
    transcript?: string;
    call?: {
      id: string;
      metadata?: Record<string, unknown>;
    };
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
 * Result of a tool call execution
 */
export interface ToolResult {
  toolCallId: string;
  result: string;
}

/**
 * Handler function signature for tool calls
 */
export type ToolHandler = (
  callId: string | undefined,
  args: Record<string, unknown>
) => Promise<Record<string, unknown>>;

/**
 * Stored assessment data structure
 */
export interface AssessmentData {
  callId: string;
  data: Record<string, unknown>;
  updatedAt: number;
}
