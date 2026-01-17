/**
 * Database Client
 *
 * Provides a configured Drizzle ORM instance wrapping the Neon serverless driver.
 * Import from '@/db' for all database operations.
 *
 * Usage:
 *   import { db, profiles, sessions } from '@/db';
 *   const users = await db.select().from(profiles);
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neonClient } from './neon-client';
import * as schema from './schema';

/**
 * Drizzle database client
 * Configured with all schema tables for type-safe queries
 */
export const db = drizzle(neonClient, { schema });

/**
 * Type for the database client
 */
export type Database = typeof db;

// Re-export all schema tables and types
export * from './schema';
