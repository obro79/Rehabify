/**
 * Form Event Bridge
 *
 * Bridges vision form events to Vapi voice feedback.
 * Subscribes to exerciseStore errors and routes to appropriate Vapi method.
 *
 * Routing:
 * - HIGH/CRITICAL priority → vapi.say() (immediate speech, bypasses LLM)
 * - MEDIUM/LOW priority → vapi.send() (context for LLM to respond naturally)
 */

import type {
  FormEvent,
  FormEventType,
  FormErrorType,
  EventPriority,
  FormErrorDetails,
} from './types';
import {
  EventPriority as Priority,
  FORM_ERROR_CORRECTIONS,
  ERROR_PRIORITY,
} from './types';
import { FormEventDebouncer } from './form-event-debouncer';

export interface VapiMethods {
  /** Speak text immediately (bypasses LLM) */
  say: (text: string) => void;
  /** Inject context message for LLM */
  injectContext: (context: string) => void;
  /** Check if connected */
  isConnected: boolean;
}

export interface FormEventBridgeOptions {
  /** Enable verbose logging */
  debug?: boolean;
  /** Override debouncer instance */
  debouncer?: FormEventDebouncer;
}

export class FormEventBridge {
  private vapi: VapiMethods;
  private debouncer: FormEventDebouncer;
  private debug: boolean;
  private isActive: boolean = false;

  constructor(vapi: VapiMethods, options: FormEventBridgeOptions = {}) {
    this.vapi = vapi;
    this.debouncer = options.debouncer ?? new FormEventDebouncer();
    this.debug = options.debug ?? false;
  }

  /**
   * Start the bridge (call when voice connects)
   */
  start(): void {
    this.isActive = true;
    this.debouncer.reset();
    this.log('Bridge started');
  }

  /**
   * Stop the bridge (call when voice disconnects)
   */
  stop(): void {
    this.isActive = false;
    this.log('Bridge stopped');
  }

  /**
   * Main entry point - handle a form event
   */
  handleFormEvent(event: FormEvent): void {
    if (!this.isActive) {
      this.log('Bridge not active, ignoring event');
      return;
    }

    if (!this.vapi.isConnected) {
      this.log('Vapi not connected, ignoring event');
      return;
    }

    this.log(`Handling event: ${event.type}`, event);

    switch (event.type) {
      case 'FORM_ERROR':
        this.handleFormError(event);
        break;

      case 'REP_COMPLETE':
        this.handleRepComplete(event);
        break;

      case 'PHASE_CHANGE':
        this.handlePhaseChange(event);
        break;

      case 'SESSION_START':
        this.handleSessionStart(event);
        break;

      case 'SESSION_END':
        this.handleSessionEnd(event);
        break;

      case 'REST_PERIOD':
        this.handleRestPeriod(event);
        break;

      case 'PAIN_INDICATION':
        this.handlePainIndication(event);
        break;

      default:
        this.log(`Unknown event type: ${event.type}`);
    }
  }

  /**
   * Handle form error event
   */
  private handleFormError(event: FormEvent): void {
    if (event.details.type !== 'FORM_ERROR') return;

    const { errorType, severity } = event.details.data;
    const exerciseId = event.exerciseId;

    // Check debouncer
    if (!this.debouncer.shouldSend(exerciseId, errorType)) {
      this.log(`Debounced: ${errorType}`);
      return;
    }

    // Get occurrence count for priority adjustment
    const occurrenceCount = this.debouncer.getOccurrenceCount(exerciseId, errorType);
    const basePriority = this.getErrorPriority(errorType, severity);

    // Boost priority for repeated errors
    const priority =
      occurrenceCount >= 2 && basePriority < Priority.HIGH
        ? Priority.HIGH
        : basePriority;

    // Record that we're sending
    this.debouncer.recordSent(exerciseId, errorType);

    // Route based on priority
    if (priority >= Priority.HIGH) {
      // Immediate speech for high priority
      const correction = this.getUrgentCorrection(errorType);
      this.vapi.say(correction);
      this.log(`[SAY] ${correction}`);
    } else {
      // Context injection for lower priority
      const context = this.formatFormErrorContext(event.details.data, exerciseId);
      this.vapi.injectContext(context);
      this.log(`[CONTEXT] ${context}`);
    }
  }

  /**
   * Handle rep complete event
   */
  private handleRepComplete(event: FormEvent): void {
    if (event.details.type !== 'REP_COMPLETE') return;

    const { repNumber, targetReps, formScore } = event.details.data;

    // Milestone reps get spoken
    const isMilestone =
      repNumber === Math.floor(targetReps / 2) || // Halfway
      repNumber === targetReps; // Complete

    if (isMilestone) {
      if (repNumber === targetReps) {
        this.vapi.say(`That's ${repNumber}! Great set.`);
      } else {
        this.vapi.say(`Nice, that's ${repNumber}. Halfway there.`);
      }
    } else {
      // Non-milestone - just context
      const context = `[REP COMPLETED] Rep ${repNumber}/${targetReps}. Form score: ${formScore}%.`;
      this.vapi.injectContext(context);
    }
  }

  /**
   * Handle phase change event
   */
  private handlePhaseChange(event: FormEvent): void {
    if (event.details.type !== 'PHASE_CHANGE') return;

    const { newPhase } = event.details.data;

    // Inject context for LLM to acknowledge if appropriate
    const context = `[PHASE CHANGE] Now in ${newPhase} phase.`;
    this.vapi.injectContext(context);
  }

  /**
   * Handle session start event
   */
  private handleSessionStart(event: FormEvent): void {
    if (event.details.type !== 'SESSION_START') return;

    const { exerciseName } = event.details.data;

    const context = `[EXERCISE START] Starting ${exerciseName}. Provide brief introduction and first instruction.`;
    this.vapi.injectContext(context);
  }

  /**
   * Handle session end event
   */
  private handleSessionEnd(event: FormEvent): void {
    if (event.details.type !== 'SESSION_END') return;

    const { exerciseName, totalReps, averageFormScore, duration } = event.details.data;

    const context = `[SESSION COMPLETE] Exercise: ${exerciseName}. Total reps: ${totalReps ?? 'N/A'}. Average form score: ${averageFormScore ?? 'N/A'}%. Duration: ${duration ? Math.round(duration / 1000) : 'N/A'} seconds. Provide warm closing summary.`;
    this.vapi.injectContext(context);
  }

  /**
   * Handle rest period event
   */
  private handleRestPeriod(event: FormEvent): void {
    if (event.details.type !== 'REST_PERIOD') return;

    const { duration } = event.details.data;

    const context = `[REST PERIOD] User is resting for ${duration} seconds. You can be more conversational, ask how they're feeling, or prepare them for the next set.`;
    this.vapi.injectContext(context);
  }

  /**
   * Handle pain indication event - CRITICAL priority
   */
  private handlePainIndication(event: FormEvent): void {
    if (event.details.type !== 'PAIN_INDICATION') return;

    const { painLevel, location } = event.details.data;

    if (painLevel >= 7) {
      // Severe - immediate stop
      this.vapi.say("Let's stop there. Please rest and don't push through that pain.");
    } else if (painLevel >= 4) {
      // Moderate - suggest modification
      this.vapi.say("Take a moment. We can modify this or take a break.");
    } else {
      // Mild - acknowledge
      const context = `[PAIN REPORTED] User reported ${painLevel}/10 pain in ${location}. Acknowledge and offer to modify or rest.`;
      this.vapi.injectContext(context);
    }
  }

  /**
   * Get priority for a form error
   */
  private getErrorPriority(
    errorType: FormErrorType,
    severity: 'mild' | 'moderate' | 'severe'
  ): EventPriority {
    const basePriority = ERROR_PRIORITY[errorType] ?? Priority.LOW;

    // Boost priority for severe errors
    if (severity === 'severe' && basePriority < Priority.HIGH) {
      return Priority.HIGH;
    }

    return basePriority;
  }

  /**
   * Get urgent correction phrase for high-priority errors
   */
  private getUrgentCorrection(errorType: FormErrorType): string {
    return FORM_ERROR_CORRECTIONS[errorType] ?? 'Adjust your form slightly';
  }

  /**
   * Format form error for LLM context injection
   */
  private formatFormErrorContext(
    details: FormErrorDetails,
    exerciseId: string
  ): string {
    const { errorType, severity, correction } = details;

    const correctionHint = correction ?? FORM_ERROR_CORRECTIONS[errorType];

    return `[FORM FEEDBACK NEEDED] Exercise: ${exerciseId}. Issue detected: ${errorType} (${severity}). Suggested correction: "${correctionHint}". Provide a brief, encouraging correction.`;
  }

  /**
   * Log helper
   */
  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[FormEventBridge] ${message}`, data ?? '');
    }
  }

  /**
   * Reset the debouncer (call on exercise change)
   */
  resetDebouncer(): void {
    this.debouncer.reset();
  }

  /**
   * Get debouncer stats for debugging
   */
  getStats() {
    return this.debouncer.getStats();
  }
}

/**
 * Create a FormEventBridge instance
 */
export function createFormEventBridge(
  vapi: VapiMethods,
  options?: FormEventBridgeOptions
): FormEventBridge {
  return new FormEventBridge(vapi, options);
}
