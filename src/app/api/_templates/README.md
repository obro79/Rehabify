# API Route Templates

Reference implementations for building consistent API routes.

## Usage

1. Copy the `crud-resource` folder to your target location (e.g., `src/app/api/users/`)
2. Rename files and update imports
3. Replace mock data with actual database queries
4. Uncomment authentication wrappers as needed

## File Structure

```
_templates/
├── README.md           # This file
└── crud-resource/
    ├── route.ts        # GET (list) + POST (create)
    └── [id]/
        └── route.ts    # GET (single) + PUT (update) + DELETE
```

## Quick Reference

### Response Helpers

```typescript
import { success, paginated, noContent, error, ErrorCode } from '@/lib/api';

// Success with data
return success({ id: '123', name: 'Test' });

// Success with 201 status
return success(createdItem, 201);

// Paginated list
return paginated(items, { total: 100, limit: 20, offset: 0 });

// No content (for DELETE)
return noContent();

// Error response
return error(ErrorCode.NOT_FOUND, 'User not found');
```

### Validation

```typescript
import { validateBody, validateParams, validateQuery } from '@/lib/api';

// Validate request body
const body = await validateBody(request, createUserSchema);

// Validate route params
const { id } = await validateParams(params, paramsSchema);

// Validate query string
const { limit, offset } = await validateQuery(request, paginationSchema);
```

### Authentication

```typescript
import { withAuth, getCurrentUser, assertRole } from '@/lib/api';

// Wrap entire handler with auth
export const GET = withAuth(async (request, { user }) => {
  return success({ userId: user.id });
});

// Role-restricted
export const DELETE = withAuth(
  async (request, { user }) => {
    return noContent();
  },
  { roles: ['admin'] }
);

// Manual auth check
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  assertRole(user, ['pt', 'admin']);
  // ...
}
```

### Error Handling

```typescript
import { APIError, ErrorCode, handleAPIError, Errors } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    throw new APIError(ErrorCode.NOT_FOUND, 'Resource not found');
    // Or use helpers:
    throw Errors.notFound('User');
    throw Errors.forbidden();
    throw Errors.validation('Invalid input', { email: ['Invalid format'] });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

## Common Patterns

### Pagination

```typescript
const { limit, offset } = getPaginationParams(request);
const [items, totalResult] = await Promise.all([
  db.select().from(resources).limit(limit).offset(offset),
  db.select({ count: count() }).from(resources),
]);
return paginated(items, { total: totalResult[0].count, limit, offset });
```

### Conditional Logic by Role

```typescript
export const GET = withAuth(async (request, { user }) => {
  const baseQuery = db.select().from(resources);

  // Patients only see their own data
  if (user.role === 'patient') {
    return success(await baseQuery.where(eq(resources.userId, user.id)));
  }

  // PTs and admins see all
  return success(await baseQuery);
});
```
