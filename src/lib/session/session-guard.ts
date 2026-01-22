/**
 * Session Guard - Multi-Tab Blocking
 *
 * Uses BroadcastChannel API to prevent concurrent workout sessions
 * across multiple browser tabs. Only one tab can own an active workout
 * session at a time.
 */

import { SESSION_CONFIG } from '@/config/session';

// Channel and timing constants
export const CHANNEL_NAME = 'rehabify_workout_session';

// Message types for BroadcastChannel communication
export const MESSAGE_TYPES = {
  CLAIM: 'CLAIM',
  RELEASE: 'RELEASE',
  HEARTBEAT: 'HEARTBEAT',
  CONFLICT: 'CONFLICT',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export interface SessionGuardMessage {
  type: MessageType;
  sessionId: string;
  timestamp: number;
}

/**
 * SessionGuard class manages multi-tab session blocking using BroadcastChannel.
 *
 * Usage:
 * - Call claim() when starting a workout to acquire ownership
 * - Call release() when ending the workout to allow other tabs
 * - Call destroy() when cleaning up
 */
export class SessionGuard {
  private channel: BroadcastChannel | null = null;
  private _isOwner: boolean = false;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeatAt: number = 0;
  private sessionId: string | null = null;
  private claimResolve: ((success: boolean) => void) | null = null;
  private isClaiming: boolean = false;
  private _hasConflict: boolean = false;
  private onConflictCallback: (() => void) | null = null;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      this.initChannel();
    }
  }

  private initChannel(): void {
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = this.handleMessage.bind(this);
    } catch {
      // BroadcastChannel not supported - allow single-tab operation
      console.warn('BroadcastChannel not supported - multi-tab blocking disabled');
    }
  }

  get isOwner(): boolean {
    return this._isOwner;
  }

  get hasConflict(): boolean {
    return this._hasConflict;
  }

  /**
   * Attempt to claim session ownership.
   * Returns true if claim succeeds, false if another tab has the session.
   */
  async claim(): Promise<boolean> {
    // If already owner, return success
    if (this._isOwner) {
      return true;
    }

    // If no channel (SSR or unsupported), allow claim
    if (!this.channel) {
      this._isOwner = true;
      this.sessionId = crypto.randomUUID();
      return true;
    }

    // Generate new session ID for this claim attempt
    this.sessionId = crypto.randomUUID();
    this.isClaiming = true;
    this._hasConflict = false;

    // Wait for potential CONFLICT response
    const success = await new Promise<boolean>((resolve) => {
      // Set up the resolver BEFORE sending the message
      // This ensures we can handle synchronous responses (in tests)
      this.claimResolve = resolve;

      // If no conflict received within timeout, claim succeeds
      setTimeout(() => {
        if (this.claimResolve === resolve) {
          this.claimResolve(true);
          this.claimResolve = null;
        }
      }, SESSION_CONFIG.CLAIM_TIMEOUT_MS);

      // Send CLAIM message AFTER setting up the resolver
      this.sendMessage(MESSAGE_TYPES.CLAIM);
    });

    this.isClaiming = false;

    if (success) {
      this._isOwner = true;
      this._hasConflict = false;
      this.startHeartbeat();
    } else {
      this._hasConflict = true;
      this.sessionId = null;
    }

    return success;
  }

  /**
   * Release session ownership, allowing other tabs to claim.
   */
  release(): void {
    if (!this._isOwner) {
      return;
    }

    this.sendMessage(MESSAGE_TYPES.RELEASE);
    this.stopHeartbeat();
    this._isOwner = false;
    this._hasConflict = false;
    this.sessionId = null;
  }

  /**
   * Register a callback to be called when a conflict is detected.
   */
  onConflict(callback: () => void): void {
    this.onConflictCallback = callback;
  }

  /**
   * Handle incoming BroadcastChannel messages.
   */
  private handleMessage(event: MessageEvent<SessionGuardMessage>): void {
    const message = event.data;

    // Ignore our own messages
    if (message.sessionId === this.sessionId) {
      return;
    }

    switch (message.type) {
      case MESSAGE_TYPES.CLAIM:
        // Another tab is trying to claim - respond with CONFLICT if we own
        if (this._isOwner) {
          this.sendMessage(MESSAGE_TYPES.CONFLICT);
        }
        break;

      case MESSAGE_TYPES.CONFLICT:
        // Another tab responded with conflict during our claim attempt
        if (this.isClaiming && this.claimResolve) {
          this.claimResolve(false);
          this.claimResolve = null;
          this._hasConflict = true;
          this.onConflictCallback?.();
        }
        break;

      case MESSAGE_TYPES.RELEASE:
        // Another tab released - session is now available
        this._hasConflict = false;
        break;

      case MESSAGE_TYPES.HEARTBEAT:
        // Track last heartbeat from other tabs
        this.lastHeartbeatAt = message.timestamp;
        break;
    }
  }

  /**
   * Start sending heartbeats to indicate session is still active.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage(MESSAGE_TYPES.HEARTBEAT);
    }, SESSION_CONFIG.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Stop sending heartbeats.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if a session from another tab has been abandoned (no heartbeat).
   */
  isSessionAbandoned(): boolean {
    if (this.lastHeartbeatAt === 0) {
      return false;
    }
    return Date.now() - this.lastHeartbeatAt > SESSION_CONFIG.HEARTBEAT_TIMEOUT_MS;
  }

  /**
   * Send a message to other tabs via BroadcastChannel.
   */
  private sendMessage(type: MessageType): void {
    if (!this.channel || !this.sessionId) {
      return;
    }

    const message: SessionGuardMessage = {
      type,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    try {
      this.channel.postMessage(message);
    } catch {
      // Channel may be closed
    }
  }

  /**
   * Clean up channel and intervals.
   */
  destroy(): void {
    this.release();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Singleton instance for use across the app
let sessionGuardInstance: SessionGuard | null = null;

export function getSessionGuard(): SessionGuard {
  if (typeof window === 'undefined') {
    // Return a mock for SSR that always allows claims
    return new SessionGuard();
  }

  if (!sessionGuardInstance) {
    sessionGuardInstance = new SessionGuard();
  }
  return sessionGuardInstance;
}

// Export singleton for direct import
export const sessionGuard = typeof window !== 'undefined' ? getSessionGuard() : null;

