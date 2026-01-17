/**
 * Neon Serverless Database Client
 *
 * Provides a configured Neon HTTP driver for serverless PostgreSQL connections.
 * Used by Drizzle ORM for type-safe database queries.
 *
 * Usage:
 *   import { neonClient } from '@/db/neon-client';
 */

import { neon } from '@neondatabase/serverless';
import { env } from '@/lib/env';

/**
 * Neon HTTP client configured with DATABASE_URL
 * Uses HTTP for serverless-friendly connections (no persistent TCP)
 */
export const neonClient = neon(env.DATABASE_URL);

/**
 * Type for the Neon client
 */
export type NeonClient = typeof neonClient;
