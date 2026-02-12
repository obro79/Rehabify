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

type NeonClientType = ReturnType<typeof neon>;

/**
 * Lazily-initialized Neon HTTP client.
 * Defers the neon() call so importing this module during build
 * (when DATABASE_URL is unavailable) doesn't throw.
 */
let _client: NeonClientType | null = null;

function getNeonClient(): NeonClientType {
  if (!_client) {
    _client = neon(env.DATABASE_URL);
  }
  return _client;
}

/**
 * Proxy that lazily initializes the Neon client on first use.
 * Keeps existing `neonClient` import API intact.
 */
export const neonClient = new Proxy((() => {}) as unknown as NeonClientType, {
  apply(_target, thisArg, args) {
    return Reflect.apply(getNeonClient(), thisArg, args);
  },
  get(_target, prop, receiver) {
    return Reflect.get(getNeonClient(), prop, receiver);
  },
});

/**
 * Type for the Neon client
 */
export type NeonClient = NeonClientType;
