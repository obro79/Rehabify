/**
 * Patient Medical Information API Route
 *
 * GET /api/patient-medical-info - Get current patient's medical info
 * PUT /api/patient-medical-info - Update current patient's medical info
 *
 * Patients can only access their own medical info.
 * PTs can access their assigned patients' medical info.
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { handleAPIError } from '@/lib/api/errors';
import { getTargetPatientId } from '@/lib/api/patient-access';
import { validateBody } from '@/lib/api/validation';
import { db, patientMedicalInfo } from '@/db';
import { z } from 'zod';

const updateMedicalInfoSchema = z.object({
  // Demographics
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),

  // Medical Information
  primaryCondition: z.string().optional().nullable(),
  conditionType: z.enum(['acute', 'chronic', 'post_surgical', 'preventive', 'other']).optional().nullable(),
  diagnosisDate: z.string().optional().nullable(),
  primaryPhysician: z.string().optional().nullable(),
  physicianPhone: z.string().optional().nullable(),

  // Medical History
  pastMedicalHistory: z.array(z.any()).optional(),
  surgeries: z.array(z.any()).optional(),
  allergies: z.array(z.any()).optional(),
  medications: z.array(z.any()).optional(),

  // Insurance & Emergency Contact
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNumber: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelationship: z.string().optional().nullable(),

  // Additional Notes
  additionalNotes: z.string().optional().nullable(),
});

/**
 * Get patient medical information
 *
 * GET /api/patient-medical-info?patientId=...
 * - Patients: Gets their own medical info (patientId ignored)
 * - PTs: Can optionally specify patientId to get a patient's info
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const targetPatientId = getTargetPatientId(request, user);

    // Get medical info
    const [medicalInfo] = await db
      .select()
      .from(patientMedicalInfo)
      .where(eq(patientMedicalInfo.patientId, targetPatientId));

    // If no medical info exists, return null (not an error)
    return success(medicalInfo || null);
  } catch (err) {
    return handleAPIError(err);
  }
}

/**
 * Update patient medical information
 *
 * PUT /api/patient-medical-info
 * Body: Partial<PatientMedicalInfo>
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const targetPatientId = getTargetPatientId(request, user);

    // Validate request body
    const body = await validateBody(request, updateMedicalInfoSchema);

    // Check if medical info already exists
    const [existing] = await db
      .select()
      .from(patientMedicalInfo)
      .where(eq(patientMedicalInfo.patientId, targetPatientId));

    let updatedInfo;

    if (existing) {
      // Update existing record
      const updateData: any = {};

      // Only include fields that are provided
      if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
      if (body.gender !== undefined) updateData.gender = body.gender;
      if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.state !== undefined) updateData.state = body.state;
      if (body.zipCode !== undefined) updateData.zipCode = body.zipCode;
      if (body.primaryCondition !== undefined) updateData.primaryCondition = body.primaryCondition;
      if (body.conditionType !== undefined) updateData.conditionType = body.conditionType;
      if (body.diagnosisDate !== undefined) updateData.diagnosisDate = body.diagnosisDate;
      if (body.primaryPhysician !== undefined) updateData.primaryPhysician = body.primaryPhysician;
      if (body.physicianPhone !== undefined) updateData.physicianPhone = body.physicianPhone;
      if (body.pastMedicalHistory !== undefined) updateData.pastMedicalHistory = body.pastMedicalHistory;
      if (body.surgeries !== undefined) updateData.surgeries = body.surgeries;
      if (body.allergies !== undefined) updateData.allergies = body.allergies;
      if (body.medications !== undefined) updateData.medications = body.medications;
      if (body.insuranceProvider !== undefined) updateData.insuranceProvider = body.insuranceProvider;
      if (body.insurancePolicyNumber !== undefined) updateData.insurancePolicyNumber = body.insurancePolicyNumber;
      if (body.emergencyContactName !== undefined) updateData.emergencyContactName = body.emergencyContactName;
      if (body.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = body.emergencyContactPhone;
      if (body.emergencyContactRelationship !== undefined) updateData.emergencyContactRelationship = body.emergencyContactRelationship;
      if (body.additionalNotes !== undefined) updateData.additionalNotes = body.additionalNotes;

      [updatedInfo] = await db
        .update(patientMedicalInfo)
        .set(updateData)
        .where(eq(patientMedicalInfo.patientId, targetPatientId))
        .returning();
    } else {
      // Create new record
      [updatedInfo] = await db
        .insert(patientMedicalInfo)
        .values({
          patientId: targetPatientId,
          dateOfBirth: body.dateOfBirth || null,
          gender: body.gender || null,
          phoneNumber: body.phoneNumber || null,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          zipCode: body.zipCode || null,
          primaryCondition: body.primaryCondition || null,
          conditionType: body.conditionType || null,
          diagnosisDate: body.diagnosisDate || null,
          primaryPhysician: body.primaryPhysician || null,
          physicianPhone: body.physicianPhone || null,
          pastMedicalHistory: body.pastMedicalHistory || [],
          surgeries: body.surgeries || [],
          allergies: body.allergies || [],
          medications: body.medications || [],
          insuranceProvider: body.insuranceProvider || null,
          insurancePolicyNumber: body.insurancePolicyNumber || null,
          emergencyContactName: body.emergencyContactName || null,
          emergencyContactPhone: body.emergencyContactPhone || null,
          emergencyContactRelationship: body.emergencyContactRelationship || null,
          additionalNotes: body.additionalNotes || null,
        })
        .returning();
    }

    return success(updatedInfo);
  } catch (err) {
    return handleAPIError(err);
  }
}

