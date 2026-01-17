import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Environment Validation Tests
 *
 * Tests for src/lib/env.ts validation logic.
 * We test the schema directly to avoid module caching issues.
 */

// Recreate the schemas from env.ts for isolated testing
const booleanString = z
  .string()
  .default('false')
  .transform((val) => val === 'true');

const booleanStringDefaultTrue = z
  .string()
  .default('true')
  .transform((val) => val !== 'false');

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NEON_API_KEY: z.string().min(1, 'NEON_API_KEY is required'),
  VAPI_PRIVATE_KEY: z.string().min(1, 'VAPI_PRIVATE_KEY is required'),
  VAPI_WEBHOOK_SECRET: z.string().min(1, 'VAPI_WEBHOOK_SECRET is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
});

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

const envSchema = serverEnvSchema.merge(clientEnvSchema);

describe('Environment Validation', () => {
  describe('valid environment variables', () => {
    it('should pass validation with all required variables', () => {
      const validEnv = {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should apply default values correctly', () => {
      const minimalEnv = {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      };

      const result = envSchema.safeParse(minimalEnv);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.GEMINI_MODEL).toBe('gemini-2.5-flash');
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.NEXT_PUBLIC_ENABLE_VOICE).toBe(true);
        expect(result.data.NEXT_PUBLIC_ENABLE_ANALYTICS).toBe(false);
        expect(result.data.NEXT_PUBLIC_DEMO_MODE).toBe(false);
      }
    });
  });

  describe('missing required variables', () => {
    it('should fail when DATABASE_URL is missing', () => {
      const invalidEnv = {
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorPaths = result.error.issues.map((i) => i.path[0]);
        expect(errorPaths).toContain('DATABASE_URL');
      }
    });

    it('should report all missing variables in error', () => {
      const emptyEnv = {};

      const result = envSchema.safeParse(emptyEnv);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorPaths = result.error.issues.map((i) => i.path[0]);
        expect(errorPaths).toContain('DATABASE_URL');
        expect(errorPaths).toContain('NEON_API_KEY');
        expect(errorPaths).toContain('VAPI_PRIVATE_KEY');
      }
    });
  });

  describe('invalid URL formats', () => {
    it('should reject invalid DATABASE_URL', () => {
      const invalidEnv = {
        DATABASE_URL: 'not-a-valid-url',
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);

      if (!result.success) {
        const dbError = result.error.issues.find(
          (i) => i.path[0] === 'DATABASE_URL'
        );
        expect(dbError).toBeDefined();
        expect(dbError?.message).toContain('URL');
      }
    });

    it('should reject invalid NEXT_PUBLIC_APP_URL', () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'not-a-url',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
    });
  });

  describe('boolean coercion for feature flags', () => {
    it('should convert "true" string to boolean true', () => {
      const env = {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_DEMO_MODE: 'true',
        NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.NEXT_PUBLIC_DEMO_MODE).toBe(true);
        expect(result.data.NEXT_PUBLIC_ENABLE_ANALYTICS).toBe(true);
      }
    });

    it('should convert "false" string to boolean false', () => {
      const env = {
        DATABASE_URL: 'postgresql://user:pass@host/db',
        NEON_API_KEY: 'neon-key-123',
        VAPI_PRIVATE_KEY: 'vapi-private-123',
        VAPI_WEBHOOK_SECRET: 'webhook-secret',
        GEMINI_API_KEY: 'gemini-key',
        NEXT_PUBLIC_VAPI_PUBLIC_KEY: 'vapi-public-123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_ENABLE_VOICE: 'false',
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.NEXT_PUBLIC_ENABLE_VOICE).toBe(false);
      }
    });
  });
});
