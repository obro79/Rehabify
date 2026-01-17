/**
 * CRUD Template: Collection Routes (GET list, POST create)
 *
 * This is a reference implementation showing how to build API routes
 * using the standardized utilities. Copy and adapt for your resources.
 *
 * Replace:
 * - `resources` with your table name
 * - `createResourceSchema` with your Zod schema
 * - Add appropriate authentication as needed
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
// import { db } from '@/db';
// import { resources } from '@/db/schema';
// import { count, eq } from 'drizzle-orm';
import {
  success,
  paginated,
  getPaginationParams,
  validateBody,
  handleAPIError,
  withAuth,
} from '@/lib/api';

/**
 * Example Zod schema for creating a resource.
 * Replace with your actual schema.
 */
const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
});

type CreateResourceInput = z.infer<typeof createResourceSchema>;

/**
 * GET /api/_templates/crud-resource
 *
 * Lists resources with pagination.
 * Supports ?limit=20&offset=0 query parameters.
 *
 * Response format:
 * {
 *   data: [...],
 *   pagination: { total, limit, offset, hasMore }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { limit, offset } = getPaginationParams(request);

    // TODO: Replace with actual database query
    // const [items, totalResult] = await Promise.all([
    //   db.select().from(resources).limit(limit).offset(offset),
    //   db.select({ count: count() }).from(resources),
    // ]);
    // const total = totalResult[0].count;

    // Mock data for template demonstration
    const items = [
      { id: '1', name: 'Example 1', status: 'active' },
      { id: '2', name: 'Example 2', status: 'draft' },
    ];
    const total = 2;

    return paginated(items, { total, limit, offset });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/_templates/crud-resource
 *
 * Creates a new resource.
 * Request body is validated against createResourceSchema.
 *
 * Response: { data: { ...created resource } } with 201 status
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await validateBody(request, createResourceSchema);

    // TODO: Replace with actual database insert
    // const [resource] = await db
    //   .insert(resources)
    //   .values({
    //     ...body,
    //     createdAt: new Date(),
    //   })
    //   .returning();

    // Mock response for template demonstration
    const resource = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    };

    return success(resource, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Alternative: Protected endpoint example
 *
 * Uncomment and use this pattern for authenticated endpoints:
 */
// export const GET = withAuth(async (request, { user }) => {
//   const { limit, offset } = getPaginationParams(request);
//
//   const [items, totalResult] = await Promise.all([
//     db.select().from(resources).where(eq(resources.userId, user.id)).limit(limit).offset(offset),
//     db.select({ count: count() }).from(resources).where(eq(resources.userId, user.id)),
//   ]);
//
//   return paginated(items, { total: totalResult[0].count, limit, offset });
// });

/**
 * Alternative: Role-restricted endpoint example
 */
// export const POST = withAuth(
//   async (request, { user }) => {
//     const body = await validateBody(request, createResourceSchema);
//     const [resource] = await db.insert(resources).values({ ...body, userId: user.id }).returning();
//     return success(resource, 201);
//   },
//   { roles: ['pt', 'admin'] }
// );
