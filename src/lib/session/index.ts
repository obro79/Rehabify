/**
 * Barrel Export for Session Utilities
 *
 * Re-exports session persistence and guard functionality for clean imports:
 * import { persist, restore, getSessionGuard } from '@/lib/session';
 */

// Session Persistence
export {
  persist,
  restore,
  clearPersisted,
  getPersistedSessionAge,
  serializeSession,
  deserializeSession,
  extractSessionState,
  STORAGE_KEYS,
  RESUME_WINDOW_MS,
} from './session-persistence';

// Session Guard
export {
  SessionGuard,
  getSessionGuard,
  sessionGuard,
  CHANNEL_NAME,
  MESSAGE_TYPES,
} from './session-guard';
export type { SessionGuardMessage, MessageType } from './session-guard';
