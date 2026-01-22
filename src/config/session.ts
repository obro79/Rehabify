/**
 * Session Configuration
 *
 * Centralized configuration for session-related constants.
 * Used by session persistence, session state API, and session guard.
 */

export const SESSION_CONFIG = {
  /** Time window during which a session can be resumed (5 minutes) */
  RESUME_WINDOW_MS: 5 * 60 * 1000,

  /** Session TTL for in-memory store cleanup (5 minutes) */
  TTL_MS: 5 * 60 * 1000,

  /** Timeout for session claim attempts (300ms) */
  CLAIM_TIMEOUT_MS: 300,

  /** Interval between heartbeat messages (10 seconds) */
  HEARTBEAT_INTERVAL_MS: 10_000,

  /** Timeout after which a session is considered abandoned (15 seconds) */
  HEARTBEAT_TIMEOUT_MS: 15_000,
} as const;
