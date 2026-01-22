import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, schemas } from '../validation';
import { APIError, ErrorCode } from '../errors';

describe('validateBody', () => {
  const userSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
  });

  function createRequestWithBody(body: unknown): Request {
    return new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('parses and validates valid body', async () => {
    const request = createRequestWithBody({ email: 'test@example.com', name: 'John' });
    const result = await validateBody(request, userSchema);

    expect(result).toEqual({ email: 'test@example.com', name: 'John' });
  });

  it('throws APIError for invalid JSON', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });

    await expect(validateBody(request, userSchema)).rejects.toThrow(APIError);
    await expect(validateBody(request, userSchema)).rejects.toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid JSON in request body',
      status: 400,
    });
  });

  it('throws VALIDATION_ERROR for schema mismatch', async () => {
    const request = createRequestWithBody({ email: 'not-an-email', name: '' });

    try {
      await validateBody(request, userSchema);
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as APIError;
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.status).toBe(422);
      expect(error.details).toHaveProperty('fields');
      expect((error.details as { fields: Record<string, string[]> }).fields).toHaveProperty('email');
      expect((error.details as { fields: Record<string, string[]> }).fields).toHaveProperty('name');
    }
  });

  it('includes field-specific errors in details', async () => {
    const request = createRequestWithBody({ email: 'invalid' });

    try {
      await validateBody(request, userSchema);
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as APIError;
      const fields = (error.details as { fields: Record<string, string[]> }).fields;
      // Zod uses 'Invalid email' message from our schemas or default 'Invalid email address'
      expect(fields.email.some((msg: string) => msg.toLowerCase().includes('email'))).toBe(true);
      expect(fields.name).toBeDefined();
    }
  });

  it('provides full type inference', async () => {
    const request = createRequestWithBody({ email: 'test@example.com', name: 'John' });
    const result = await validateBody(request, userSchema);

    // TypeScript should infer these properties
    const email: string = result.email;
    const name: string = result.name;

    expect(email).toBe('test@example.com');
    expect(name).toBe('John');
  });
});

describe('validateQuery', () => {
  const querySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
    status: z.enum(['active', 'inactive']).optional(),
  });

  function createRequestWithQuery(query: string): Request {
    return new Request(`http://localhost/api/test?${query}`);
  }

  it('parses and validates query parameters', async () => {
    const request = createRequestWithQuery('limit=10&offset=20&status=active');
    const result = await validateQuery(request, querySchema);

    expect(result).toEqual({ limit: 10, offset: 20, status: 'active' });
  });

  it('applies default values for missing params', async () => {
    const request = createRequestWithQuery('');
    const result = await validateQuery(request, querySchema);

    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.status).toBeUndefined();
  });

  it('coerces string numbers to numbers', async () => {
    const request = createRequestWithQuery('limit=50');
    const result = await validateQuery(request, querySchema);

    expect(typeof result.limit).toBe('number');
    expect(result.limit).toBe(50);
  });

  it('throws VALIDATION_ERROR for invalid params', async () => {
    const request = createRequestWithQuery('limit=invalid');

    await expect(validateQuery(request, querySchema)).rejects.toThrow(APIError);

    try {
      await validateQuery(request, querySchema);
    } catch (err) {
      const error = err as APIError;
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid query parameters');
      expect(error.status).toBe(422);
    }
  });

  it('throws for invalid enum values', async () => {
    const request = createRequestWithQuery('status=unknown');

    await expect(validateQuery(request, querySchema)).rejects.toThrow(APIError);
  });
});

describe('validateParams', () => {
  const paramsSchema = z.object({
    id: z.string().uuid(),
  });

  it('validates route parameters', async () => {
    const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const result = await validateParams(params, paramsSchema);

    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('throws BAD_REQUEST for invalid params', async () => {
    const params = { id: 'not-a-uuid' };

    await expect(validateParams(params, paramsSchema)).rejects.toThrow(APIError);

    try {
      await validateParams(params, paramsSchema);
    } catch (err) {
      const error = err as APIError;
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
      expect(error.status).toBe(400);
      expect(error.message).toContain('Invalid route parameters');
    }
  });

  it('handles multiple route params', async () => {
    const multiParamsSchema = z.object({
      userId: z.string().uuid(),
      postId: z.string().uuid(),
    });

    const params = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      postId: '987e6543-e21b-12d3-a456-426614174999',
    };

    const result = await validateParams(params, multiParamsSchema);
    expect(result.userId).toBeDefined();
    expect(result.postId).toBeDefined();
  });
});

describe('schemas helpers', () => {
  describe('uuid', () => {
    it('validates valid UUID', () => {
      const result = schemas.uuid.safeParse('123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = schemas.uuid.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
    });
  });

  describe('pagination', () => {
    it('parses valid pagination', () => {
      const result = schemas.pagination.safeParse({ limit: '10', offset: '20' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(20);
      }
    });

    it('applies defaults', () => {
      const result = schemas.pagination.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('enforces min/max limits', () => {
      const tooHigh = schemas.pagination.safeParse({ limit: '200' });
      expect(tooHigh.success).toBe(false);

      const tooLow = schemas.pagination.safeParse({ limit: '0' });
      expect(tooLow.success).toBe(false);
    });
  });

  describe('nonEmptyString', () => {
    it('accepts non-empty strings', () => {
      expect(schemas.nonEmptyString.safeParse('hello').success).toBe(true);
    });

    it('rejects empty strings', () => {
      expect(schemas.nonEmptyString.safeParse('').success).toBe(false);
    });
  });

  describe('email', () => {
    it('validates email format', () => {
      expect(schemas.email.safeParse('test@example.com').success).toBe(true);
      expect(schemas.email.safeParse('invalid').success).toBe(false);
    });
  });

  describe('dateString', () => {
    it('validates ISO date format', () => {
      expect(schemas.dateString.safeParse('2024-01-15T10:30:00.000Z').success).toBe(true);
      expect(schemas.dateString.safeParse('not-a-date').success).toBe(false);
    });
  });

  describe('messageContent', () => {
    it('validates valid message content', () => {
      const result = schemas.messageContent.safeParse({ content: 'Hello, world!' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Hello, world!');
      }
    });

    it('rejects empty content', () => {
      const result = schemas.messageContent.safeParse({ content: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing content', () => {
      const result = schemas.messageContent.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects content exceeding 2000 characters', () => {
      const longContent = 'a'.repeat(2001);
      const result = schemas.messageContent.safeParse({ content: longContent });
      expect(result.success).toBe(false);
    });

    it('accepts content at exactly 2000 characters', () => {
      const maxContent = 'a'.repeat(2000);
      const result = schemas.messageContent.safeParse({ content: maxContent });
      expect(result.success).toBe(true);
    });
  });
});
