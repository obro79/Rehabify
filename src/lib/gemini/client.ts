/**
 * Gemini Client
 *
 * Wrapper around Google Generative AI SDK for plan generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';
import { APIError, ErrorCode } from '@/lib/api/errors';

/**
 * Singleton Gemini client instance
 */
let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Get or create the Gemini client instance
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!env.GEMINI_API_KEY) {
      throw new APIError(
        ErrorCode.INTERNAL_ERROR,
        'GEMINI_API_KEY is not configured'
      );
    }
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

/**
 * Generate content using Gemini API with retry logic
 *
 * @param prompt - The prompt to send to Gemini
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The generated text response
 * @throws APIError if generation fails after retries
 */
export async function generateContent(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: env.GEMINI_MODEL });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        lastError.message.includes('API key') ||
        lastError.message.includes('quota') ||
        lastError.message.includes('permission')
      ) {
        throw new APIError(
          ErrorCode.INTERNAL_ERROR,
          `Gemini API error: ${lastError.message}`
        );
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new APIError(
    ErrorCode.INTERNAL_ERROR,
    `Failed to generate plan after ${maxRetries} attempts: ${lastError?.message ?? 'Unknown error'}`
  );
}

/**
 * Parse JSON response from Gemini, handling markdown code blocks
 *
 * @param text - Raw text response from Gemini
 * @returns Parsed JSON object
 * @throws APIError if JSON parsing fails
 */
export function parseGeminiJson<T>(text: string): T {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleaned) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new APIError(
      ErrorCode.INTERNAL_ERROR,
      `Failed to parse Gemini JSON response: ${message}`,
      500,
      { rawResponse: text.substring(0, 500) } // Include first 500 chars for debugging
    );
  }
}

