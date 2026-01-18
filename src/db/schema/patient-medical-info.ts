/**
 * Patient Medical Information Schema
 *
 * Stores comprehensive medical information for patients including demographics,
 * medical history, conditions, medications, and emergency contacts.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profiles';

export const patientMedicalInfo = pgTable(
  'patient_medical_info',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Demographics
    dateOfBirth: date('date_of_birth'),
    gender: text('gender'), // 'male', 'female', 'other', 'prefer_not_to_say'
    phoneNumber: text('phone_number'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),

    // Medical Information
    primaryCondition: text('primary_condition'), // e.g., 'lower_back_pain', 'knee_injury', etc.
    conditionType: text('condition_type'), // e.g., 'acute', 'chronic', 'post_surgical', etc.
    diagnosisDate: date('diagnosis_date'),
    primaryPhysician: text('primary_physician'),
    physicianPhone: text('physician_phone'),

    // Medical History
    pastMedicalHistory: jsonb('past_medical_history').default(sql`'[]'::jsonb`), // Array of conditions
    surgeries: jsonb('surgeries').default(sql`'[]'::jsonb`), // Array of {date, procedure, notes}
    allergies: jsonb('allergies').default(sql`'[]'::jsonb`), // Array of {type, name, severity}
    medications: jsonb('medications').default(sql`'[]'::jsonb`), // Array of {name, dosage, frequency, notes}

    // Insurance & Emergency Contact
    insuranceProvider: text('insurance_provider'),
    insurancePolicyNumber: text('insurance_policy_number'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    emergencyContactRelationship: text('emergency_contact_relationship'),

    // Additional Notes
    additionalNotes: text('additional_notes'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_patient_medical_info_patient_id').on(table.patientId),
  ]
);

// Type exports
export type PatientMedicalInfo = typeof patientMedicalInfo.$inferSelect;
export type NewPatientMedicalInfo = typeof patientMedicalInfo.$inferInsert;

