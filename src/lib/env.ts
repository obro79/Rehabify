import { z } from 'zod';

/**
 * Environment Variable Validation
 *
 * This module provides type-safe access to environment variables.
 * Validation runs at module load time (fail-fast).
 *
 * Usage:
 *   Server-side: import { env } from '@/lib/env'
 *   Client-side: import { clientEnv } from '@/lib/env'
 */

// Helper to coerce string "true"/"false" to boolean
const booleanString = z
  .string()
  .default('false')
  .transform((val) => val === 'true');

const booleanStringDefaultTrue = z
  .string()
  .default('true')
  .transform((val) => val !== 'false');

// Server-only environment variables (never exposed to client)
const serverEnvSchema = z.object({
  // Database (Neon)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NEON_API_KEY: z.string().min(1, 'NEON_API_KEY is required'),

  // Neon Auth (Better Auth powered)
  // Optional during build, required at runtime
  NEON_AUTH_BASE_URL: z.string().url('NEON_AUTH_BASE_URL must be a valid URL').optional(),

  // Voice AI (Vapi)
  VAPI_PRIVATE_KEY: z.string().min(1, 'VAPI_PRIVATE_KEY is required'),
  VAPI_WEBHOOK_SECRET: z.string().min(1, 'VAPI_WEBHOOK_SECRET is required'),

  // AI Plan Generation (Gemini)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
});

// Client-safe environment variables (NEXT_PUBLIC_* prefix)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_VAPI_PUBLIC_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_VAPI_PUBLIC_KEY is required'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_ENABLE_VOICE: booleanStringDefaultTrue,
  NEXT_PUBLIC_ENABLE_ANALYTICS: booleanString,
  NEXT_PUBLIC_DEMO_MODE: booleanString,
});

// Combined schema for server-side access
const envSchema = serverEnvSchema.merge(clientEnvSchema);

// Type definitions
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws a descriptive error if validation fails
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n\nEnvironment validation failed:\n${errors}\n\nCheck your .env.local file against .env.example\n`
    );
  }

  return result.data;
}

function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_VOICE: process.env.NEXT_PUBLIC_ENABLE_VOICE,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n\nClient environment validation failed:\n${errors}\n\nCheck your .env.local file against .env.example\n`
    );
  }

  return result.data;
}

// Validate at module load time (fail-fast)
// Skip validation during build when env vars might not be present
const isServer = typeof window === 'undefined';
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === 'true' ||
  process.env.npm_lifecycle_event === 'lint';

/**
 * Server-side environment variables
 * Use this in API routes, server components, and server actions
 *
 * @example
 * import { env } from '@/lib/env'
 * const dbUrl = env.DATABASE_URL // type: string (not string | undefined)
 */
export const env: Env = isServer && !skipValidation ? validateEnv() : ({} as Env);

/**
 * Client-safe environment variables
 * Use this in client components
 * Only includes NEXT_PUBLIC_* variables
 *
 * @example
 * import { clientEnv } from '@/lib/env'
 * const appUrl = clientEnv.NEXT_PUBLIC_APP_URL
 */
export const clientEnv: ClientEnv = !skipValidation
  ? validateClientEnv()
  : ({} as ClientEnv);

// Runtime protection: prevent server env access from client
if (!isServer && !skipValidation) {
  const serverKeys = Object.keys(serverEnvSchema.shape);
  serverKeys.forEach((key) => {
    if (!key.startsWith('NEXT_PUBLIC_') && key in process.env) {
      console.warn(
        `Warning: Server-only env var "${key}" should not be accessible in client code`
      );
    }
  });
}
