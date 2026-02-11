export interface WorkflowNode {
  id: string;
  type: 'conversation';
  name: string;
  isStart?: boolean;
  prompt: string;
  model?: { provider: string; model: string };
  extractVariables?: VariableDefinition[];
}

export interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  enum?: string[];
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition: { type: 'ai'; prompt: string };
}

export interface AssessmentWorkflowConfig {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const DEFAULT_MODEL = { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' };

export function createNode(
  id: string,
  name: string,
  prompt: string,
  extractVariables?: VariableDefinition[],
  isStart?: boolean
): WorkflowNode {
  return {
    id,
    type: 'conversation',
    name,
    ...(isStart && { isStart }),
    prompt,
    model: DEFAULT_MODEL,
    ...(extractVariables && { extractVariables }),
  };
}

export function createEdge(from: string, to: string, conditionPrompt: string): WorkflowEdge {
  return { from, to, condition: { type: 'ai', prompt: conditionPrompt } };
}

export function stringVar(name: string, description: string, enumValues?: string[]): VariableDefinition {
  return { name, type: 'string', description, ...(enumValues && { enum: enumValues }) };
}

export function numberVar(name: string, description: string): VariableDefinition {
  return { name, type: 'number', description };
}

export function boolVar(name: string, description: string): VariableDefinition {
  return { name, type: 'boolean', description };
}

export function arrayVar(name: string, description: string): VariableDefinition {
  return { name, type: 'array', description };
}
