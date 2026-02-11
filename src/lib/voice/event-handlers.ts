/**
 * Event Handlers for FormEventBridge
 *
 * Extracted handler functions for each event type.
 */

import type {
  FormEvent,
  FormEventType,
  FormErrorType,
  FormErrorDetails,
  EventPriority,
  VapiMethods,
} from './types.js';
import {
  EventPriority as Priority,
  FORM_ERROR_CORRECTIONS,
  ERROR_PRIORITY,
} from './types.js';
import type { FormEventDebouncer } from './form-event-debouncer.js';

export interface HandlerContext {
  vapi: VapiMethods;
  debouncer: FormEventDebouncer;
  log: (message: string, data?: unknown) => void;
}

function getErrorPriority(
  errorType: FormErrorType,
  severity: 'mild' | 'moderate' | 'severe'
): EventPriority {
  const basePriority = ERROR_PRIORITY[errorType] ?? Priority.LOW;
  if (severity === 'severe' && basePriority < Priority.HIGH) {
    return Priority.HIGH;
  }
  return basePriority;
}

function formatFormErrorContext(details: FormErrorDetails, exerciseId: string): string {
  const { errorType, severity, correction } = details;
  const correctionHint = correction ?? FORM_ERROR_CORRECTIONS[errorType];
  return `[FORM FEEDBACK NEEDED] Exercise: ${exerciseId}. Issue detected: ${errorType} (${severity}). Suggested correction: "${correctionHint}". Provide a brief, encouraging correction.`;
}

function handleFormError(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'FORM_ERROR') return;

  const { errorType, severity } = event.details.data;
  const { exerciseId } = event;

  if (!ctx.debouncer.shouldSend(exerciseId, errorType)) {
    ctx.log(`Debounced: ${errorType}`);
    return;
  }

  const occurrenceCount = ctx.debouncer.getOccurrenceCount(exerciseId, errorType);
  const basePriority = getErrorPriority(errorType, severity);
  const priority =
    occurrenceCount >= 2 && basePriority < Priority.HIGH ? Priority.HIGH : basePriority;

  ctx.debouncer.recordSent(exerciseId, errorType);

  if (priority >= Priority.HIGH) {
    const correction = FORM_ERROR_CORRECTIONS[errorType] ?? 'Adjust your form slightly';
    ctx.vapi.say(correction);
    ctx.log(`[SAY] ${correction}`);
  } else {
    const context = formatFormErrorContext(event.details.data, exerciseId);
    ctx.vapi.injectContext(context);
    ctx.log(`[CONTEXT] ${context}`);
  }
}

function handleRepComplete(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'REP_COMPLETE') return;

  const { repNumber, targetReps, formScore } = event.details.data;
  const isHalfway = repNumber === Math.floor(targetReps / 2);
  const isComplete = repNumber === targetReps;

  if (isComplete) {
    ctx.vapi.say(`That's ${repNumber}! Great set.`);
  } else if (isHalfway) {
    ctx.vapi.say(`Nice, that's ${repNumber}. Halfway there.`);
  } else {
    ctx.vapi.injectContext(
      `[REP COMPLETED] Rep ${repNumber}/${targetReps}. Form score: ${formScore}%.`
    );
  }
}

function handlePhaseChange(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'PHASE_CHANGE') return;
  const { newPhase } = event.details.data;
  ctx.vapi.injectContext(`[PHASE CHANGE] Now in ${newPhase} phase.`);
}

function handleSessionStart(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'SESSION_START') return;
  const { exerciseName } = event.details.data;
  ctx.vapi.injectContext(
    `[EXERCISE START] Starting ${exerciseName}. Provide brief introduction and first instruction.`
  );
}

function handleSessionEnd(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'SESSION_END') return;
  const { exerciseName, totalReps, averageFormScore, duration } = event.details.data;
  const durationSecs = duration ? Math.round(duration / 1000) : 'N/A';
  ctx.vapi.injectContext(
    `[SESSION COMPLETE] Exercise: ${exerciseName}. Total reps: ${totalReps ?? 'N/A'}. Average form score: ${averageFormScore ?? 'N/A'}%. Duration: ${durationSecs} seconds. Provide warm closing summary.`
  );
}

function handleRestPeriod(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'REST_PERIOD') return;
  const { duration } = event.details.data;
  ctx.vapi.injectContext(
    `[REST PERIOD] User is resting for ${duration} seconds. You can be more conversational, ask how they're feeling, or prepare them for the next set.`
  );
}

function handlePainIndication(event: FormEvent, ctx: HandlerContext): void {
  if (event.details.type !== 'PAIN_INDICATION') return;
  const { painLevel, location } = event.details.data;

  if (painLevel >= 7) {
    ctx.vapi.say("Let's stop there. Please rest and don't push through that pain.");
  } else if (painLevel >= 4) {
    ctx.vapi.say('Take a moment. We can modify this or take a break.');
  } else {
    ctx.vapi.injectContext(
      `[PAIN REPORTED] User reported ${painLevel}/10 pain in ${location}. Acknowledge and offer to modify or rest.`
    );
  }
}

/**
 * Lookup table mapping event types to their handlers
 */
export const EVENT_HANDLERS: Record<
  FormEventType,
  (event: FormEvent, ctx: HandlerContext) => void
> = {
  FORM_ERROR: handleFormError,
  REP_COMPLETE: handleRepComplete,
  PHASE_CHANGE: handlePhaseChange,
  SESSION_START: handleSessionStart,
  SESSION_END: handleSessionEnd,
  REST_PERIOD: handleRestPeriod,
  PAIN_INDICATION: handlePainIndication,
};
