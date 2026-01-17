/**
 * CRUD Template: Single Resource Routes (GET, PUT, DELETE)
 *
 * This is a reference implementation showing how to build API routes
 * for single resource operations. Copy and adapt for your resources.
 *
 * Replace:
 * - `resources` with your table name
 * - Schemas with your actual Zod schemas
 * - Add appropriate authentication as needed
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
// import { db } from '@/db';
// import { resources } from '@/db/schema';
// import { eq } from 'drizzle-orm';
import {
  success,
  noContent,
  validateBody,
  validateParams,
  handleAPIError,
  APIError,
  ErrorCode,
} from '@/lib/api';

/**
 * Schema for validating route params.
 */
const paramsSchema = z.object({
  id: z.string().uuid('Invalid resource ID'),
});

/**
 * Schema for updating a resource.
 * All fields optional for partial updates.
 */
const updateResourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

/**
 * Route segment config for Next.js
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/_templates/crud-resource/[id]
 *
 * Retrieves a single resource by ID.
 *
 * Response: { data: { ...resource } }
 * Error: 404 if not found
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const { id } = await validateParams(params, paramsSchema);

    // TODO: Replace with actual database query
    // const [resource] = await db
    //   .select()
    //   .from(resources)
    //   .where(eq(resources.id, id));

    // Mock data for template demonstration
    const resource = id === 'test-id'
      ? { id, name: 'Test Resource', status: 'active', createdAt: new Date().toISOString() }
      : null;

    if (!resource) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Resource not found');
    }

    return success(resource);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PUT /api/_templates/crud-resource/[id]
 *
 * Updates an existing resource.
 * Supports partial updates (only provided fields are updated).
 *
 * Response: { data: { ...updated resource } }
 * Error: 404 if not found
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const { id } = await validateParams(params, paramsSchema);
    const body = await validateBody(request, updateResourceSchema);

    // TODO: Replace with actual database update
    // const [resource] = await db
    //   .update(resources)
    //   .set({
    //     ...body,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(resources.id, id))
    //   .returning();

    // Mock response for template demonstration
    const resource = {
      id,
      name: body.name ?? 'Existing Name',
      status: body.status ?? 'active',
      updatedAt: new Date().toISOString(),
    };

    // In real implementation, check if update affected any rows
    // if (!resource) {
    //   throw new APIError(ErrorCode.NOT_FOUND, 'Resource not found');
    // }

    return success(resource);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/_templates/crud-resource/[id]
 *
 * Deletes a resource by ID.
 *
 * Response: 204 No Content
 * Error: 404 if not found
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const { id } = await validateParams(params, paramsSchema);

    // TODO: Replace with actual database delete
    // const [deleted] = await db
    //   .delete(resources)
    //   .where(eq(resources.id, id))
    //   .returning({ id: resources.id });

    // Mock: Simulate not found for certain IDs
    const deleted = id !== 'nonexistent-id' ? { id } : null;

    if (!deleted) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Resource not found');
    }

    return noContent();
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Alternative: Protected endpoint examples
 *
 * For authenticated endpoints, use the withAuth wrapper:
 */
// import { withAuth, assertRole } from '@/lib/api';
//
// export const GET = withAuth(async (request, { user }) => {
//   const { id } = await validateParams(await request.params, paramsSchema);
//
//   const [resource] = await db
//     .select()
//     .from(resources)
//     .where(and(eq(resources.id, id), eq(resources.userId, user.id)));
//
//   if (!resource) {
//     throw new APIError(ErrorCode.NOT_FOUND, 'Resource not found');
//   }
//
//   return success(resource);
// });
//
// // Admin-only delete
// export const DELETE = withAuth(
//   async (request, { user }) => {
//     const { id } = await validateParams(await request.params, paramsSchema);
//     await db.delete(resources).where(eq(resources.id, id));
//     return noContent();
//   },
//   { roles: ['admin'] }
// );
