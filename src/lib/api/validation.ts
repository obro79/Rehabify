import { z } from 'zod';
import { APIError, ErrorCode } from './errors';

/**
 * Validates a request body against a Zod schema.
 * Parses JSON, validates structure, and returns typed data.
 *
 * @param request - The incoming Request object
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data with full type inference
 * @throws APIError with VALIDATION_ERROR code if validation fails
 *
 * @example
 * const createUserSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1),
 * });
 *
 * export async function POST(request: NextRequest) {
 *   const body = await validateBody(request, createUserSchema);
 *   // body is typed as { email: string; name: string }
 *   const user = await createUser(body);
 *   return success(user, 201);
 * }
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  let rawBody: unknown;

  // Parse JSON body
  try {
    rawBody = await request.json();
  } catch {
    throw new APIError(
      ErrorCode.BAD_REQUEST,
      'Invalid JSON in request body',
      400
    );
  }

  // Validate against schema
  const result = schema.safeParse(rawBody);

  if (!result.success) {
    // Transform Zod errors into field-specific details
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      422,
      { fields: fieldErrors }
    );
  }

  return result.data;
}

/**
 * Validates query parameters against a Zod schema.
 *
 * @param request - The incoming Request object
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated query parameters
 * @throws APIError with VALIDATION_ERROR code if validation fails
 *
 * @example
 * const querySchema = z.object({
 *   limit: z.coerce.number().min(1).max(100).default(20),
 *   offset: z.coerce.number().min(0).default(0),
 *   status: z.enum(['active', 'inactive']).optional(),
 * });
 *
 * export async function GET(request: NextRequest) {
 *   const { limit, offset, status } = await validateQuery(request, querySchema);
 *   // ... use validated params
 * }
 */
export async function validateQuery<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  // Convert URLSearchParams to plain object
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid query parameters',
      422,
      { fields: fieldErrors }
    );
  }

  return result.data;
}

/**
 * Validates route parameters (e.g., [id] in /api/users/[id]).
 *
 * @param params - Route params object from Next.js
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated route parameters
 * @throws APIError with BAD_REQUEST code if validation fails
 *
 * @example
 * const paramsSchema = z.object({
 *   id: z.string().uuid(),
 * });
 *
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const { id } = await validateParams(params, paramsSchema);
 *   // id is validated as UUID
 * }
 */
export async function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): Promise<T> {
  const result = schema.safeParse(params);

  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join(', ');
    throw new APIError(
      ErrorCode.BAD_REQUEST,
      `Invalid route parameters: ${issues}`,
      400
    );
  }

  return result.data;
}

/**
 * Common Zod schema helpers for API validation.
 */
export const schemas = {
  /** UUID string validation */
  uuid: z.string().uuid('Invalid UUID format'),

  /** Pagination query params */
  pagination: z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
  }),

  /** Non-empty string */
  nonEmptyString: z.string().min(1, 'This field is required'),

  /** Email validation */
  email: z.string().email('Invalid email address'),

  /** Date string (ISO format) */
  dateString: z.string().datetime('Invalid date format'),

  /** Message content validation */
  messageContent: z.object({
    content: z.string().min(1, 'Message content is required').max(2000, 'Message content exceeds 2000 characters'),
  }),
};
