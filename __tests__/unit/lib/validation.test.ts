/**
 * Validation Utility Tests
 *
 * Tests for Zod schema validation patterns used in the application.
 * Focuses on the boolean coercion helpers and schema composition.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * These tests verify the validation patterns used in the application.
 * The actual schemas are in src/lib/env.ts but we test the patterns
 * in isolation to avoid module caching issues with process.env.
 */

// Recreate the boolean coercion helpers for isolated testing
const booleanString = z
  .string()
  .default('false')
  .transform((val) => val === 'true');

const booleanStringDefaultTrue = z
  .string()
  .default('true')
  .transform((val) => val !== 'false');

describe('Validation Patterns', () => {
  describe('booleanString (default false)', () => {
    it('transforms "true" string to boolean true', () => {
      const result = booleanString.parse('true');
      expect(result).toBe(true);
    });

    it('transforms "false" string to boolean false', () => {
      const result = booleanString.parse('false');
      expect(result).toBe(false);
    });

    it('transforms empty string to false', () => {
      const result = booleanString.parse('');
      expect(result).toBe(false);
    });

    it('transforms any non-"true" string to false', () => {
      expect(booleanString.parse('yes')).toBe(false);
      expect(booleanString.parse('1')).toBe(false);
      expect(booleanString.parse('TRUE')).toBe(false);
      expect(booleanString.parse('True')).toBe(false);
    });

    it('defaults to false when undefined', () => {
      const result = booleanString.parse(undefined);
      expect(result).toBe(false);
    });
  });

  describe('booleanStringDefaultTrue (default true)', () => {
    it('transforms "true" string to boolean true', () => {
      const result = booleanStringDefaultTrue.parse('true');
      expect(result).toBe(true);
    });

    it('transforms "false" string to boolean false', () => {
      const result = booleanStringDefaultTrue.parse('false');
      expect(result).toBe(false);
    });

    it('defaults to true when undefined', () => {
      const result = booleanStringDefaultTrue.parse(undefined);
      expect(result).toBe(true);
    });

    it('transforms non-"false" strings to true', () => {
      expect(booleanStringDefaultTrue.parse('yes')).toBe(true);
      expect(booleanStringDefaultTrue.parse('1')).toBe(true);
      expect(booleanStringDefaultTrue.parse('')).toBe(true);
    });
  });

  describe('URL Validation', () => {
    const urlSchema = z.string().url('Must be a valid URL');

    it('accepts valid HTTP URLs', () => {
      expect(() => urlSchema.parse('http://localhost:3000')).not.toThrow();
      expect(() => urlSchema.parse('http://example.com')).not.toThrow();
    });

    it('accepts valid HTTPS URLs', () => {
      expect(() => urlSchema.parse('https://example.com')).not.toThrow();
      expect(() => urlSchema.parse('https://api.example.com/path')).not.toThrow();
    });

    it('accepts PostgreSQL connection URLs', () => {
      expect(() => urlSchema.parse('postgresql://user:pass@host/db')).not.toThrow();
    });

    it('rejects invalid URLs', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow();
      expect(() => urlSchema.parse('example.com')).toThrow();
      expect(() => urlSchema.parse('')).toThrow();
    });

    it('provides custom error message', () => {
      const result = urlSchema.safeParse('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be a valid URL');
      }
    });
  });

  describe('Required String Validation', () => {
    const requiredString = z.string().min(1, 'Field is required');

    it('accepts non-empty strings', () => {
      expect(() => requiredString.parse('value')).not.toThrow();
      expect(() => requiredString.parse('a')).not.toThrow();
    });

    it('rejects empty strings', () => {
      expect(() => requiredString.parse('')).toThrow();
    });

    it('provides custom error message', () => {
      const result = requiredString.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Field is required');
      }
    });
  });

  describe('Enum Validation', () => {
    const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']);

    it('accepts valid enum values', () => {
      expect(nodeEnvSchema.parse('development')).toBe('development');
      expect(nodeEnvSchema.parse('production')).toBe('production');
      expect(nodeEnvSchema.parse('test')).toBe('test');
      expect(nodeEnvSchema.parse('staging')).toBe('staging');
    });

    it('rejects invalid enum values', () => {
      expect(() => nodeEnvSchema.parse('invalid')).toThrow();
      expect(() => nodeEnvSchema.parse('DEVELOPMENT')).toThrow();
      expect(() => nodeEnvSchema.parse('')).toThrow();
    });
  });

  describe('Schema Composition', () => {
    const baseSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    const extendedSchema = baseSchema.extend({
      email: z.string().email(),
    });

    it('base schema validates correctly', () => {
      const result = baseSchema.safeParse({ id: '1', name: 'Test' });
      expect(result.success).toBe(true);
    });

    it('extended schema includes base fields', () => {
      const result = extendedSchema.safeParse({
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('extended schema requires all fields', () => {
      const result = extendedSchema.safeParse({ id: '1', name: 'Test' });
      expect(result.success).toBe(false);
    });
  });

  describe('Optional Fields with Defaults', () => {
    const schemaWithDefaults = z.object({
      required: z.string(),
      optional: z.string().optional(),
      defaulted: z.string().default('default-value'),
    });

    it('uses default when field is undefined', () => {
      const result = schemaWithDefaults.parse({ required: 'test' });
      expect(result.defaulted).toBe('default-value');
    });

    it('overrides default when field is provided', () => {
      const result = schemaWithDefaults.parse({
        required: 'test',
        defaulted: 'custom-value',
      });
      expect(result.defaulted).toBe('custom-value');
    });

    it('keeps optional fields as undefined', () => {
      const result = schemaWithDefaults.parse({ required: 'test' });
      expect(result.optional).toBeUndefined();
    });
  });

  describe('Error Message Formatting', () => {
    const complexSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().min(0, 'Age must be positive'),
      email: z.string().email('Invalid email format'),
    });

    it('collects all validation errors', () => {
      const result = complexSchema.safeParse({
        name: '',
        age: -1,
        email: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(3);
      }
    });

    it('provides field paths in errors', () => {
      const result = complexSchema.safeParse({
        name: '',
        age: 10,
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const namePaths = result.error.issues.map((i) => i.path[0]);
        expect(namePaths).toContain('name');
      }
    });

    it('error messages can be formatted for display', () => {
      const result = complexSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('\n');

        expect(formattedErrors).toContain('name:');
        expect(formattedErrors).toContain('age:');
        expect(formattedErrors).toContain('email:');
      }
    });
  });

  describe('Type Coercion', () => {
    const coercedSchema = z.object({
      count: z.coerce.number(),
      active: z.coerce.boolean(),
    });

    it('coerces string to number', () => {
      const result = coercedSchema.parse({ count: '42', active: true });
      expect(result.count).toBe(42);
      expect(typeof result.count).toBe('number');
    });

    it('coerces truthy values to boolean', () => {
      const result = coercedSchema.parse({ count: 1, active: 'yes' });
      expect(result.active).toBe(true);
    });
  });
});
