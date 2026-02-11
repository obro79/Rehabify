import type { ToolCallHandler } from './types';

export class ToolCallDispatcher {
  private handlers = new Map<string, ToolCallHandler>();

  register(name: string, handler: ToolCallHandler): void {
    this.handlers.set(name, handler);
  }

  registerAll(handlers: Record<string, ToolCallHandler>): void {
    for (const [name, handler] of Object.entries(handlers)) {
      this.register(name, handler);
    }
  }

  async dispatch(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const handler = this.handlers.get(name);
    if (!handler) {
      console.warn(`[ToolCallDispatcher] No handler for: ${name}`);
      return { error: `Unknown function: ${name}` };
    }
    try {
      return await handler(args);
    } catch (err) {
      console.error(`[ToolCallDispatcher] Error in ${name}:`, err);
      return { error: err instanceof Error ? err.message : 'Handler failed' };
    }
  }

  hasHandler(name: string): boolean {
    return this.handlers.has(name);
  }

  clear(): void {
    this.handlers.clear();
  }
}
