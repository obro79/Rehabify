/**
 * Schema Barrel Export
 *
 * Re-exports all schema definitions and types from a single entry point.
 */

// Tables
export { profiles } from './profiles';
export { exercises } from './exercises';
export { plans, planModifications } from './plans';
export { assessments } from './assessments';
export { sessions, sessionNotes } from './sessions';
export { messages, cannedResponses } from './messages';
export { notifications } from './notifications';
export { ptAlerts, ptRecommendations } from './alerts';
export { achievements, userAchievements } from './achievements';
export { patientMedicalInfo } from './patient-medical-info';

// Types
export type { Profile, NewProfile } from './profiles';
export type { Exercise, NewExercise } from './exercises';
export type { Plan, NewPlan, PlanModification, NewPlanModification } from './plans';
export type { Assessment, NewAssessment } from './assessments';
export type { Session, NewSession, SessionNote, NewSessionNote } from './sessions';
export type { Message, NewMessage, CannedResponse, NewCannedResponse } from './messages';
export type { Notification, NewNotification } from './notifications';
export type {
  PtAlert,
  NewPtAlert,
  PtRecommendation,
  NewPtRecommendation,
} from './alerts';
export type {
  Achievement,
  NewAchievement,
  UserAchievement,
  NewUserAchievement,
} from './achievements';
export type {
  PatientMedicalInfo,
  NewPatientMedicalInfo,
} from './patient-medical-info';
