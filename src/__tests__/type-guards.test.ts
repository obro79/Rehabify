import { describe, it, expect } from 'vitest';
import {
  isFormError,
  isFormAnalysis,
  isVapiMessage,
  isApiError,
} from '@/types/guards';

describe('Type Guards', () => {
  describe('isFormError', () => {
    it('returns true for valid FormError', () => {
      const validError = {
        type: 'hip_drop',
        message: 'Keep your hips level',
        severity: 'warning',
        timestamp: Date.now(),
      };
      expect(isFormError(validError)).toBe(true);
    });

    it('returns false for invalid objects', () => {
      expect(isFormError(null)).toBe(false);
      expect(isFormError(undefined)).toBe(false);
      expect(isFormError({})).toBe(false);
      expect(isFormError({ type: 'error' })).toBe(false);
      expect(isFormError({ type: 123, message: 'test', severity: 'error', timestamp: 0 })).toBe(false);
    });
  });

  describe('isFormAnalysis', () => {
    it('returns true for valid FormAnalysis', () => {
      const validAnalysis = {
        isCorrect: true,
        phase: 'neutral',
        errors: [],
        repCount: 5,
        formScore: 85,
      };
      expect(isFormAnalysis(validAnalysis)).toBe(true);
    });

    it('returns false for invalid objects', () => {
      expect(isFormAnalysis(null)).toBe(false);
      expect(isFormAnalysis(undefined)).toBe(false);
      expect(isFormAnalysis({ isCorrect: true })).toBe(false);
      expect(isFormAnalysis({ isCorrect: 'yes', phase: 'test', errors: [], repCount: 0, formScore: 0 })).toBe(false);
    });
  });

  describe('isVapiMessage', () => {
    it('returns true for valid VapiMessage', () => {
      const validMessage = {
        type: 'add-message',
        content: 'Hello',
        role: 'assistant',
      };
      expect(isVapiMessage(validMessage)).toBe(true);
    });

    it('returns false for invalid objects', () => {
      expect(isVapiMessage(null)).toBe(false);
      expect(isVapiMessage({ type: 'say' })).toBe(false);
    });
  });

  describe('isApiError', () => {
    it('returns true for valid ApiError', () => {
      const validError = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      };
      expect(isApiError(validError)).toBe(true);
    });

    it('returns false for invalid objects', () => {
      expect(isApiError(null)).toBe(false);
      expect(isApiError({ code: 404 })).toBe(false);
    });
  });
});
